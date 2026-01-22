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


# Supported languages for benchmarking
SUPPORTED_LANGUAGES = ["python", "javascript", "typescript", "go", "rust"]


def is_language_supported(language: str) -> bool:
    """Check if benchmarking is supported for a language."""
    lang = language.lower()
    return lang in SUPPORTED_LANGUAGES or lang in ["js", "ts", "golang", "rs"]


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

    lang = language.lower()

    if lang == "python":
        # Find first function definition
        match = re.search(r'def\s+(\w+)\s*\(', code)
        if match:
            return match.group(1)

    elif lang in ["javascript", "typescript", "js", "ts"]:
        # Find function or const/let function
        match = re.search(r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=)', code)
        if match:
            return match.group(1) or match.group(2)

    elif lang in ["go", "golang"]:
        # Find func declaration (excluding main)
        matches = re.findall(r'func\s+(\w+)\s*\(', code)
        # Return first non-main function
        for name in matches:
            if name != "main":
                return name
        return matches[0] if matches else None

    elif lang in ["rust", "rs"]:
        # Find fn declaration (excluding main)
        matches = re.findall(r'fn\s+(\w+)\s*[<(]', code)
        # Return first non-main function
        for name in matches:
            if name != "main":
                return name
        return matches[0] if matches else None

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
    input_type: str = "array",
    language: str = "python"
) -> list[BenchmarkComparison]:
    """
    Run benchmarks comparing baseline and optimized code.
    Supports Python, JavaScript, Go, and Rust.
    """
    if input_sizes is None:
        input_sizes = DEFAULT_INPUT_SIZES

    lang = language.lower()
    results = []

    for size in input_sizes:
        logger.info(f"Running {lang} benchmark for input size {size}")

        # Run baseline using appropriate language runner
        baseline_result = await run_benchmark_for_language(
            baseline_code, baseline_func, size, lang, input_type
        )

        # Run optimized
        optimized_result = await run_benchmark_for_language(
            optimized_code, optimized_func, size, lang, input_type
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


async def run_benchmark_for_language(
    code: str,
    function_name: str,
    input_size: int,
    language: str,
    input_type: str = "array",
    runs: int = DEFAULT_RUNS
) -> BenchmarkResult:
    """
    Run benchmark for the specified language.
    Routes to appropriate language-specific runner.
    """
    lang = language.lower()

    if lang == "python":
        return await run_python_benchmark(code, function_name, input_size, input_type, runs)
    elif lang in ["javascript", "js", "typescript", "ts"]:
        return await run_javascript_benchmark(code, function_name, input_size, input_type, runs)
    elif lang in ["go", "golang"]:
        return await run_go_benchmark(code, function_name, input_size, input_type, runs)
    elif lang in ["rust", "rs"]:
        return await run_rust_benchmark(code, function_name, input_size, input_type, runs)
    else:
        return BenchmarkResult(
            input_size=input_size,
            execution_time_ms=0,
            memory_bytes=None,
            runs_count=runs,
            success=False,
            error=f"Unsupported language: {language}"
        )


async def calculate_speedup(
    baseline_code: str,
    optimized_code: str,
    language: str = "python"
) -> float | None:
    """
    Calculate speedup of optimized code vs baseline.
    Returns average speedup across all input sizes.
    Supports: Python, JavaScript/TypeScript, Go, Rust.
    """
    lang = language.lower()

    if not is_language_supported(lang):
        logger.info(f"Benchmarking not supported for {language}")
        return None

    baseline_func = extract_function_name(baseline_code, language)
    optimized_func = extract_function_name(optimized_code, language)

    if not baseline_func or not optimized_func:
        logger.warning("Could not extract function names from code")
        return None

    # Run benchmarks for multiple input sizes
    results = []
    for size in DEFAULT_INPUT_SIZES:
        logger.info(f"Running {language} benchmark for input size {size}")

        baseline_result = await run_benchmark_for_language(
            baseline_code, baseline_func, size, lang
        )
        optimized_result = await run_benchmark_for_language(
            optimized_code, optimized_func, size, lang
        )

        if baseline_result.success and optimized_result.success:
            speedup = (
                baseline_result.execution_time_ms / optimized_result.execution_time_ms
                if optimized_result.execution_time_ms > 0
                else 1.0
            )
            results.append(speedup)
        else:
            logger.warning(
                f"Benchmark failed for size {size}: "
                f"baseline={baseline_result.error}, optimized={optimized_result.error}"
            )

    if not results:
        return None

    # Average speedup across all input sizes
    avg_speedup = sum(results) / len(results)
    return round(avg_speedup, 2)


# ============================================
# JavaScript/TypeScript Benchmark Support
# ============================================

def create_javascript_benchmark_script(
    code: str,
    function_name: str,
    input_code: str,
    runs: int = DEFAULT_RUNS
) -> str:
    """Create a Node.js script that benchmarks the given code."""
    script = f'''
const {{ performance }} = require('perf_hooks');

// User code
{code}

function runBenchmark() {{
    // Generate input
    const testInput = {input_code};

    // Warmup run
    try {{
        {function_name}(testInput);
    }} catch (e) {{
        console.error("ERROR:", e.message);
        process.exit(1);
    }}

    // Measure time
    const times = [];
    for (let i = 0; i < {runs}; i++) {{
        const start = performance.now();
        {function_name}(testInput);
        const end = performance.now();
        times.push(end - start);
    }}

    // Memory measurement (approximate)
    const memBefore = process.memoryUsage().heapUsed;
    {function_name}(testInput);
    const memAfter = process.memoryUsage().heapUsed;

    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    console.log("TIME:" + avgTime);
    console.log("MEMORY:" + Math.max(0, memAfter - memBefore));
    console.log("SUCCESS");
}}

runBenchmark();
'''
    return script


def generate_javascript_test_input(input_size: int, input_type: str = "array") -> str:
    """Generate test input data as JavaScript code."""
    if input_type == "array":
        return f"Array.from({{length: {input_size}}}, (_, i) => i)"
    elif input_type == "random_array":
        return f"Array.from({{length: {input_size}}}, () => Math.floor(Math.random() * {input_size}))"
    elif input_type == "string":
        return f"'a'.repeat({input_size})"
    elif input_type == "dict":
        return f"Object.fromEntries(Array.from({{length: {input_size}}}, (_, i) => [i, i]))"
    else:
        return f"Array.from({{length: {input_size}}}, (_, i) => i)"


async def run_javascript_benchmark(
    code: str,
    function_name: str,
    input_size: int,
    input_type: str = "array",
    runs: int = DEFAULT_RUNS
) -> BenchmarkResult:
    """Run a JavaScript benchmark using Node.js subprocess."""
    import shutil

    # Check if Node.js is available
    node_path = shutil.which("node")
    if not node_path:
        return BenchmarkResult(
            input_size=input_size,
            execution_time_ms=0,
            memory_bytes=None,
            runs_count=runs,
            success=False,
            error="Node.js not installed"
        )

    input_code = generate_javascript_test_input(input_size, input_type)
    script = create_javascript_benchmark_script(code, function_name, input_code, runs)

    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.js',
        delete=False,
        encoding='utf-8'
    ) as f:
        f.write(script)
        script_path = f.name

    try:
        process = await asyncio.create_subprocess_exec(
            node_path, script_path,
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
        logger.error(f"JavaScript benchmark failed: {e}")
        return BenchmarkResult(
            input_size=input_size,
            execution_time_ms=0,
            memory_bytes=None,
            runs_count=runs,
            success=False,
            error=str(e)
        )
    finally:
        try:
            os.unlink(script_path)
        except:
            pass


# ============================================
# Go Benchmark Support
# ============================================

def create_go_benchmark_script(
    code: str,
    function_name: str,
    input_size: int,
    runs: int = DEFAULT_RUNS
) -> str:
    """Create a Go program that benchmarks the given code."""
    # Extract package name or use main
    script = f'''package main

import (
    "fmt"
    "runtime"
    "time"
)

{code}

func main() {{
    // Generate input
    testInput := make([]int, {input_size})
    for i := range testInput {{
        testInput[i] = i
    }}

    // Warmup
    defer func() {{
        if r := recover(); r != nil {{
            fmt.Println("ERROR:", r)
        }}
    }}()
    {function_name}(testInput)

    // Measure time
    var totalTime float64
    for i := 0; i < {runs}; i++ {{
        start := time.Now()
        {function_name}(testInput)
        elapsed := time.Since(start)
        totalTime += float64(elapsed.Nanoseconds()) / 1e6 // Convert to ms
    }}

    // Memory measurement
    var m runtime.MemStats
    runtime.GC()
    runtime.ReadMemStats(&m)

    avgTime := totalTime / float64({runs})
    fmt.Printf("TIME:%f\\n", avgTime)
    fmt.Printf("MEMORY:%d\\n", m.Alloc)
    fmt.Println("SUCCESS")
}}
'''
    return script


async def run_go_benchmark(
    code: str,
    function_name: str,
    input_size: int,
    input_type: str = "array",
    runs: int = DEFAULT_RUNS
) -> BenchmarkResult:
    """Run a Go benchmark using go run subprocess."""
    import shutil

    go_path = shutil.which("go")
    if not go_path:
        return BenchmarkResult(
            input_size=input_size,
            execution_time_ms=0,
            memory_bytes=None,
            runs_count=runs,
            success=False,
            error="Go not installed"
        )

    script = create_go_benchmark_script(code, function_name, input_size, runs)

    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.go',
        delete=False,
        encoding='utf-8'
    ) as f:
        f.write(script)
        script_path = f.name

    try:
        process = await asyncio.create_subprocess_exec(
            go_path, "run", script_path,
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
        logger.error(f"Go benchmark failed: {e}")
        return BenchmarkResult(
            input_size=input_size,
            execution_time_ms=0,
            memory_bytes=None,
            runs_count=runs,
            success=False,
            error=str(e)
        )
    finally:
        try:
            os.unlink(script_path)
        except:
            pass


# ============================================
# Rust Benchmark Support
# ============================================

def create_rust_benchmark_script(
    code: str,
    function_name: str,
    input_size: int,
    runs: int = DEFAULT_RUNS
) -> str:
    """Create a Rust program that benchmarks the given code."""
    script = f'''use std::time::Instant;

{code}

fn main() {{
    // Generate input
    let test_input: Vec<i32> = (0..{input_size}).collect();

    // Warmup
    {function_name}(&test_input);

    // Measure time
    let mut total_time = 0.0f64;
    for _ in 0..{runs} {{
        let start = Instant::now();
        {function_name}(&test_input);
        let elapsed = start.elapsed();
        total_time += elapsed.as_secs_f64() * 1000.0; // Convert to ms
    }}

    let avg_time = total_time / {runs} as f64;
    println!("TIME:{{}}", avg_time);
    println!("MEMORY:0"); // Rust doesn't have easy runtime memory measurement
    println!("SUCCESS");
}}
'''
    return script


async def run_rust_benchmark(
    code: str,
    function_name: str,
    input_size: int,
    input_type: str = "array",
    runs: int = DEFAULT_RUNS
) -> BenchmarkResult:
    """Run a Rust benchmark using rustc + execution."""
    import shutil

    rustc_path = shutil.which("rustc")
    if not rustc_path:
        return BenchmarkResult(
            input_size=input_size,
            execution_time_ms=0,
            memory_bytes=None,
            runs_count=runs,
            success=False,
            error="Rust compiler not installed"
        )

    script = create_rust_benchmark_script(code, function_name, input_size, runs)

    with tempfile.NamedTemporaryFile(
        mode='w',
        suffix='.rs',
        delete=False,
        encoding='utf-8'
    ) as f:
        f.write(script)
        script_path = f.name

    # Output binary path
    binary_path = script_path.replace('.rs', '')
    if sys.platform == 'win32':
        binary_path += '.exe'

    try:
        # Compile
        compile_process = await asyncio.create_subprocess_exec(
            rustc_path, "-O", script_path, "-o", binary_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            _, stderr = await asyncio.wait_for(
                compile_process.communicate(),
                timeout=MAX_EXECUTION_TIME
            )
        except asyncio.TimeoutError:
            compile_process.kill()
            return BenchmarkResult(
                input_size=input_size,
                execution_time_ms=0,
                memory_bytes=None,
                runs_count=runs,
                success=False,
                error="Compilation timed out"
            )

        if compile_process.returncode != 0:
            return BenchmarkResult(
                input_size=input_size,
                execution_time_ms=0,
                memory_bytes=None,
                runs_count=runs,
                success=False,
                error=f"Compilation failed: {stderr.decode('utf-8')}"
            )

        # Run
        run_process = await asyncio.create_subprocess_exec(
            binary_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        try:
            stdout, stderr = await asyncio.wait_for(
                run_process.communicate(),
                timeout=MAX_EXECUTION_TIME
            )
        except asyncio.TimeoutError:
            run_process.kill()
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
        logger.error(f"Rust benchmark failed: {e}")
        return BenchmarkResult(
            input_size=input_size,
            execution_time_ms=0,
            memory_bytes=None,
            runs_count=runs,
            success=False,
            error=str(e)
        )
    finally:
        try:
            os.unlink(script_path)
            os.unlink(binary_path)
        except:
            pass


# get_benchmark_runner and is_language_supported are defined at the top of the file
