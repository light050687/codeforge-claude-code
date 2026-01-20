"""
Benchmark service for running code and measuring performance.
Uses subprocess with timeouts for safety.
"""

import asyncio
import logging
import tempfile
import time
import os
import sys
from dataclasses import dataclass
from typing import Any

logger = logging.getLogger(__name__)

# Maximum execution time in seconds
MAX_EXECUTION_TIME = 30

# Number of runs for averaging
DEFAULT_RUNS = 5

# Input sizes for benchmarking
DEFAULT_INPUT_SIZES = [100, 1000, 10000]


@dataclass
class BenchmarkResult:
    """Result of a single benchmark run."""
    input_size: int
    execution_time_ms: float
    memory_bytes: int | None
    runs_count: int
    success: bool
    error: str | None = None


@dataclass
class BenchmarkComparison:
    """Comparison between baseline and optimized code."""
    input_size: int
    baseline_time_ms: float
    optimized_time_ms: float
    speedup: float
    memory_baseline: int | None
    memory_optimized: int | None


def generate_test_input(input_size: int, input_type: str = "array") -> str:
    """Generate test input data as Python code."""
    if input_type == "array":
        return f"list(range({input_size}))"
    elif input_type == "random_array":
        return f"[random.randint(0, {input_size}) for _ in range({input_size})]"
    elif input_type == "string":
        return f"'a' * {input_size}"
    elif input_type == "dict":
        return f"{{i: i for i in range({input_size})}}"
    else:
        return f"list(range({input_size}))"


def create_benchmark_script(
    code: str,
    function_name: str,
    input_code: str,
    runs: int = DEFAULT_RUNS
) -> str:
    """
    Create a Python script that benchmarks the given code.
    Returns the script content.
    """
    script = f'''
import time
import tracemalloc
import random
import sys

# User code
{code}

def run_benchmark():
    # Generate input
    test_input = {input_code}

    # Warmup run
    try:
        {function_name}(test_input)
    except Exception as e:
        print(f"ERROR: {{e}}", file=sys.stderr)
        sys.exit(1)

    # Measure time
    times = []
    for _ in range({runs}):
        start = time.perf_counter()
        {function_name}(test_input)
        end = time.perf_counter()
        times.append((end - start) * 1000)  # Convert to ms

    # Measure memory
    tracemalloc.start()
    {function_name}(test_input)
    current, peak = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    avg_time = sum(times) / len(times)
    print(f"TIME:{{avg_time}}")
    print(f"MEMORY:{{peak}}")
    print("SUCCESS")

if __name__ == "__main__":
    run_benchmark()
'''
    return script


def extract_function_name(code: str, language: str = "python") -> str | None:
    """Extract the main function name from code."""
    import re

    if language.lower() == "python":
        # Find first function definition
        match = re.search(r'def\s+(\w+)\s*\(', code)
        if match:
            return match.group(1)
    elif language.lower() in ["javascript", "typescript"]:
        # Find function or const/let function
        match = re.search(r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)', code)
        if match:
            return match.group(1) or match.group(2)

    return None


async def run_python_benchmark(
    code: str,
    function_name: str,
    input_size: int,
    input_type: str = "array",
    runs: int = DEFAULT_RUNS
) -> BenchmarkResult:
    """
    Run a Python benchmark using subprocess.
    """
    input_code = generate_test_input(input_size, input_type)
    script = create_benchmark_script(code, function_name, input_code, runs)

    # Create temp file
    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.py',
        delete=False,
        encoding='utf-8'
    ) as f:
        f.write(script)
        script_path = f.name

    try:
        # Run with timeout
        process = await asyncio.create_subprocess_exec(
            sys.executable, script_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=MAX_EXECUTION_TIME
            )
        except asyncio.TimeoutError:
            process.kill()
            return BenchmarkResult(
                input_size=input_size,
                execution_time_ms=0,
                memory_bytes=None,
                runs_count=runs,
                success=False,
                error=f"Execution timed out after {MAX_EXECUTION_TIME}s"
            )

        stdout_text = stdout.decode('utf-8')
        stderr_text = stderr.decode('utf-8')

        if "SUCCESS" not in stdout_text:
            return BenchmarkResult(
                input_size=input_size,
                execution_time_ms=0,
                memory_bytes=None,
                runs_count=runs,
                success=False,
                error=stderr_text or "Unknown error"
            )

        # Parse results
        time_ms = 0.0
        memory_bytes = None

        for line in stdout_text.split('\n'):
            if line.startswith('TIME:'):
                time_ms = float(line.split(':')[1])
            elif line.startswith('MEMORY:'):
                memory_bytes = int(float(line.split(':')[1]))

        return BenchmarkResult(
            input_size=input_size,
            execution_time_ms=time_ms,
            memory_bytes=memory_bytes,
            runs_count=runs,
            success=True
        )

    except Exception as e:
        logger.error(f"Benchmark failed: {e}")
        return BenchmarkResult(
            input_size=input_size,
            execution_time_ms=0,
            memory_bytes=None,
            runs_count=runs,
            success=False,
            error=str(e)
        )
    finally:
        # Cleanup
        try:
            os.unlink(script_path)
        except:
            pass


async def run_benchmark_comparison(
    baseline_code: str,
    optimized_code: str,
    baseline_func: str,
    optimized_func: str,
    input_sizes: list[int] = None,
    input_type: str = "array"
) -> list[BenchmarkComparison]:
    """
    Run benchmarks comparing baseline and optimized code.
    """
    if input_sizes is None:
        input_sizes = DEFAULT_INPUT_SIZES

    results = []

    for size in input_sizes:
        logger.info(f"Running benchmark for input size {size}")

        # Run baseline
        baseline_result = await run_python_benchmark(
            baseline_code, baseline_func, size, input_type
        )

        # Run optimized
        optimized_result = await run_python_benchmark(
            optimized_code, optimized_func, size, input_type
        )

        if baseline_result.success and optimized_result.success:
            speedup = (
                baseline_result.execution_time_ms / optimized_result.execution_time_ms
                if optimized_result.execution_time_ms > 0
                else 1.0
            )

            results.append(BenchmarkComparison(
                input_size=size,
                baseline_time_ms=baseline_result.execution_time_ms,
                optimized_time_ms=optimized_result.execution_time_ms,
                speedup=speedup,
                memory_baseline=baseline_result.memory_bytes,
                memory_optimized=optimized_result.memory_bytes,
            ))
        else:
            logger.warning(
                f"Benchmark failed for size {size}: "
                f"baseline={baseline_result.error}, optimized={optimized_result.error}"
            )

    return results


async def calculate_speedup(
    baseline_code: str,
    optimized_code: str,
    language: str = "python"
) -> float | None:
    """
    Calculate speedup of optimized code vs baseline.
    Returns average speedup across all input sizes.
    """
    if language.lower() != "python":
        logger.info(f"Benchmarking not supported for {language}")
        return None

    baseline_func = extract_function_name(baseline_code, language)
    optimized_func = extract_function_name(optimized_code, language)

    if not baseline_func or not optimized_func:
        logger.warning("Could not extract function names from code")
        return None

    results = await run_benchmark_comparison(
        baseline_code, optimized_code,
        baseline_func, optimized_func
    )

    if not results:
        return None

    # Average speedup across all input sizes
    avg_speedup = sum(r.speedup for r in results) / len(results)
    return round(avg_speedup, 2)
