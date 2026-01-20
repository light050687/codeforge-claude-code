"""
Benchmark Runner Service

Executes code in isolated environment and measures:
- Execution time (with statistical analysis)
- Memory usage (peak, average, total allocations)
- Output correctness

Uses tracemalloc for memory profiling and subprocess for isolation.
"""

import asyncio
import hashlib
import json
import platform
import statistics
import sys
import time
import tracemalloc
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any
import multiprocessing as mp


@dataclass
class BenchmarkResult:
    """Result of a single benchmark run"""
    success: bool
    execution_time_ms: float
    execution_time_min_ms: float | None = None
    execution_time_max_ms: float | None = None
    execution_time_std_ms: float | None = None
    memory_bytes: int | None = None
    memory_peak_bytes: int | None = None
    memory_allocated_bytes: int | None = None
    output: Any = None
    output_correct: bool | None = None
    error_message: str | None = None
    speedup: float | None = None
    memory_reduction: float | None = None
    raw_times: list[float] | None = None
    environment: dict | None = None


@dataclass
class BenchmarkConfig:
    """Configuration for benchmark execution"""
    runs: int = 10
    warmup_runs: int = 3
    timeout_ms: int = 30000  # 30 seconds
    input_sizes: list[int] | None = None
    measure_memory: bool = True
    verify_output: bool = True


def get_environment_info() -> dict:
    """Capture current execution environment"""
    return {
        "python_version": platform.python_version(),
        "python_implementation": platform.python_implementation(),
        "os_name": platform.system(),
        "os_version": platform.release(),
        "cpu_count": mp.cpu_count(),
        "architecture": platform.machine(),
        "timestamp": datetime.utcnow().isoformat(),
    }


def _run_with_memory_tracking(code: str, func_name: str, test_input: Any) -> tuple[Any, float, int, int, int]:
    """
    Execute code and measure time and memory.
    Returns: (result, time_ms, current_memory, peak_memory, total_allocated)
    """
    # Compile and execute code to get the function
    local_vars = {}
    exec(code, local_vars)
    func = local_vars.get(func_name)

    if func is None:
        raise ValueError(f"Function '{func_name}' not found in code")

    # Start memory tracking
    tracemalloc.start()

    # Run the function
    start_time = time.perf_counter()
    result = func(test_input)
    end_time = time.perf_counter()

    # Get memory stats
    current, peak = tracemalloc.get_traced_memory()
    snapshot = tracemalloc.take_snapshot()

    # Calculate total allocated (sum of all allocations)
    total_allocated = sum(stat.size for stat in snapshot.statistics('lineno'))

    tracemalloc.stop()

    time_ms = (end_time - start_time) * 1000
    return result, time_ms, current, peak, total_allocated


def _run_benchmark_process(
    code: str,
    func_name: str,
    test_input: Any,
    runs: int,
    warmup_runs: int,
    measure_memory: bool,
    result_queue: mp.Queue
):
    """
    Run benchmark in separate process for isolation.
    Results are put into the queue.
    """
    try:
        # Compile code once
        local_vars = {}
        exec(code, local_vars)
        func = local_vars.get(func_name)

        if func is None:
            result_queue.put({"error": f"Function '{func_name}' not found"})
            return

        # Warmup runs (discard results)
        for _ in range(warmup_runs):
            # Copy input to avoid mutation issues
            input_copy = json.loads(json.dumps(test_input)) if isinstance(test_input, (list, dict)) else test_input
            func(input_copy)

        # Actual benchmark runs
        times = []
        memory_samples = []
        peak_memories = []
        total_allocations = []
        last_result = None

        for _ in range(runs):
            input_copy = json.loads(json.dumps(test_input)) if isinstance(test_input, (list, dict)) else test_input

            if measure_memory:
                tracemalloc.start()

            start = time.perf_counter()
            last_result = func(input_copy)
            end = time.perf_counter()

            times.append((end - start) * 1000)

            if measure_memory:
                current, peak = tracemalloc.get_traced_memory()
                snapshot = tracemalloc.take_snapshot()
                total = sum(stat.size for stat in snapshot.statistics('lineno'))
                tracemalloc.stop()

                memory_samples.append(current)
                peak_memories.append(peak)
                total_allocations.append(total)

        result_queue.put({
            "success": True,
            "times": times,
            "memory_samples": memory_samples if measure_memory else None,
            "peak_memories": peak_memories if measure_memory else None,
            "total_allocations": total_allocations if measure_memory else None,
            "output": last_result if isinstance(last_result, (int, float, str, bool, list, dict, type(None))) else str(last_result),
        })

    except Exception as e:
        result_queue.put({"error": str(e)})


class BenchmarkRunner:
    """
    Runs benchmarks in isolated environment with comprehensive metrics.
    """

    def __init__(self, config: BenchmarkConfig | None = None):
        self.config = config or BenchmarkConfig()
        self.environment = get_environment_info()

    async def run_benchmark(
        self,
        code: str,
        func_name: str,
        test_input: Any,
        baseline_code: str | None = None,
        baseline_func_name: str | None = None,
        expected_output: Any = None,
    ) -> BenchmarkResult:
        """
        Run benchmark for given code.

        Args:
            code: The optimized code to benchmark
            func_name: Name of the function to call
            test_input: Input data to pass to the function
            baseline_code: Optional baseline code for comparison
            baseline_func_name: Name of baseline function
            expected_output: Expected output for verification

        Returns:
            BenchmarkResult with all metrics
        """
        # Run in separate process for isolation
        result_queue = mp.Queue()

        process = mp.Process(
            target=_run_benchmark_process,
            args=(
                code,
                func_name,
                test_input,
                self.config.runs,
                self.config.warmup_runs,
                self.config.measure_memory,
                result_queue,
            )
        )

        process.start()

        # Wait with timeout
        timeout_seconds = self.config.timeout_ms / 1000
        process.join(timeout=timeout_seconds)

        if process.is_alive():
            process.terminate()
            process.join()
            return BenchmarkResult(
                success=False,
                execution_time_ms=self.config.timeout_ms,
                error_message=f"Timeout after {self.config.timeout_ms}ms",
                environment=self.environment,
            )

        # Get results from queue
        if result_queue.empty():
            return BenchmarkResult(
                success=False,
                execution_time_ms=0,
                error_message="No result from benchmark process",
                environment=self.environment,
            )

        result_data = result_queue.get()

        if "error" in result_data:
            return BenchmarkResult(
                success=False,
                execution_time_ms=0,
                error_message=result_data["error"],
                environment=self.environment,
            )

        # Calculate statistics
        times = result_data["times"]
        avg_time = statistics.mean(times)
        min_time = min(times)
        max_time = max(times)
        std_time = statistics.stdev(times) if len(times) > 1 else 0

        # Memory stats
        memory_bytes = None
        memory_peak = None
        memory_allocated = None

        if result_data.get("memory_samples"):
            memory_bytes = int(statistics.mean(result_data["memory_samples"]))
            memory_peak = max(result_data["peak_memories"])
            memory_allocated = int(statistics.mean(result_data["total_allocations"]))

        # Verify output if expected output provided
        output_correct = None
        if expected_output is not None and self.config.verify_output:
            try:
                output_correct = result_data["output"] == expected_output
            except Exception:
                output_correct = False

        # Run baseline if provided
        speedup = None
        memory_reduction = None

        if baseline_code and baseline_func_name:
            baseline_result = await self._run_baseline(
                baseline_code, baseline_func_name, test_input
            )
            if baseline_result and baseline_result.get("avg_time"):
                speedup = baseline_result["avg_time"] / avg_time if avg_time > 0 else None

            if baseline_result and baseline_result.get("memory") and memory_bytes:
                memory_reduction = baseline_result["memory"] / memory_bytes if memory_bytes > 0 else None

        return BenchmarkResult(
            success=True,
            execution_time_ms=avg_time,
            execution_time_min_ms=min_time,
            execution_time_max_ms=max_time,
            execution_time_std_ms=std_time,
            memory_bytes=memory_bytes,
            memory_peak_bytes=memory_peak,
            memory_allocated_bytes=memory_allocated,
            output=result_data["output"],
            output_correct=output_correct,
            speedup=speedup,
            memory_reduction=memory_reduction,
            raw_times=times,
            environment=self.environment,
        )

    async def _run_baseline(
        self, code: str, func_name: str, test_input: Any
    ) -> dict | None:
        """Run baseline code for comparison"""
        result_queue = mp.Queue()

        process = mp.Process(
            target=_run_benchmark_process,
            args=(code, func_name, test_input, 5, 2, True, result_queue)
        )

        process.start()
        process.join(timeout=self.config.timeout_ms / 1000)

        if process.is_alive():
            process.terminate()
            return None

        if result_queue.empty():
            return None

        result_data = result_queue.get()
        if "error" in result_data:
            return None

        return {
            "avg_time": statistics.mean(result_data["times"]),
            "memory": int(statistics.mean(result_data["memory_samples"])) if result_data.get("memory_samples") else None,
        }

    async def run_benchmark_suite(
        self,
        code: str,
        func_name: str,
        input_generator: callable,
        input_sizes: list[int],
        baseline_code: str | None = None,
        baseline_func_name: str | None = None,
    ) -> list[BenchmarkResult]:
        """
        Run benchmarks for multiple input sizes.

        Args:
            code: Code to benchmark
            func_name: Function name
            input_generator: Function that generates input given size
            input_sizes: List of input sizes to test
            baseline_code: Optional baseline for comparison
            baseline_func_name: Baseline function name

        Returns:
            List of BenchmarkResults, one per input size
        """
        results = []

        for size in input_sizes:
            test_input = input_generator(size)
            result = await self.run_benchmark(
                code=code,
                func_name=func_name,
                test_input=test_input,
                baseline_code=baseline_code,
                baseline_func_name=baseline_func_name,
            )
            results.append(result)

        return results


def calculate_efficiency_score(speedup: float | None, memory_reduction: float | None) -> float | None:
    """
    Calculate combined efficiency score (0-100).

    Formula: weighted combination of speedup and memory reduction.
    - 60% weight on speed
    - 40% weight on memory
    - Logarithmic scaling for large improvements
    """
    if speedup is None and memory_reduction is None:
        return None

    import math

    speed_score = 0
    memory_score = 0

    if speedup is not None and speedup > 0:
        # Log scale: 1x = 0, 10x = 50, 100x = 100
        speed_score = min(100, 50 * math.log10(max(speedup, 1)))

    if memory_reduction is not None and memory_reduction > 0:
        # Same log scale for memory
        memory_score = min(100, 50 * math.log10(max(memory_reduction, 1)))

    # Weighted average
    return 0.6 * speed_score + 0.4 * memory_score


def calculate_readability_score(code: str) -> tuple[float, int, int]:
    """
    Calculate readability metrics for code.

    Returns: (readability_score 0-100, lines_of_code, cyclomatic_complexity)
    """
    lines = code.strip().split('\n')
    loc = len([l for l in lines if l.strip() and not l.strip().startswith('#')])

    # Simple cyclomatic complexity estimation
    complexity_keywords = ['if', 'elif', 'for', 'while', 'and', 'or', 'except', 'with']
    complexity = 1  # Base complexity
    for line in lines:
        for keyword in complexity_keywords:
            if f' {keyword} ' in f' {line} ' or line.strip().startswith(f'{keyword} '):
                complexity += 1

    # Readability score (inversely related to complexity and length)
    # Ideal: short, simple code
    loc_penalty = max(0, (loc - 10) * 2)  # Penalty for code > 10 lines
    complexity_penalty = max(0, (complexity - 3) * 5)  # Penalty for complexity > 3

    readability = max(0, min(100, 100 - loc_penalty - complexity_penalty))

    return readability, loc, complexity


def extract_dependencies(code: str) -> tuple[list[str], bool]:
    """
    Extract external dependencies from code.

    Returns: (list of dependencies, has_external_deps)
    """
    import re

    # Find all imports
    import_pattern = r'^(?:from\s+(\w+)|import\s+(\w+))'
    matches = re.findall(import_pattern, code, re.MULTILINE)

    # Standard library modules (simplified list)
    stdlib = {
        'os', 'sys', 're', 'json', 'math', 'random', 'time', 'datetime',
        'collections', 'itertools', 'functools', 'operator', 'string',
        'io', 'pathlib', 'typing', 'dataclasses', 'enum', 'copy',
        'heapq', 'bisect', 'array', 'queue', 'threading', 'multiprocessing',
        'hashlib', 'hmac', 'secrets', 'base64', 'struct', 'pickle',
        'csv', 'xml', 'html', 'urllib', 'http', 'email', 'logging',
        'unittest', 'doctest', 'pdb', 'profile', 'timeit', 'tracemalloc',
        'abc', 'contextlib', 'decimal', 'fractions', 'statistics',
    }

    dependencies = []
    for match in matches:
        module = match[0] or match[1]
        if module and module not in stdlib:
            dependencies.append(module)

    return list(set(dependencies)), len(dependencies) > 0
