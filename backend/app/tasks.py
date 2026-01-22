"""Celery tasks for CodeForge background processing."""

import logging
from typing import Optional

from app.worker import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(bind=True, max_retries=3)
def generate_embedding(self, code: str, language: str = "python") -> list[float]:
    """
    Generate embedding vector for code snippet.

    Args:
        code: Source code to embed
        language: Programming language

    Returns:
        Embedding vector as list of floats
    """
    try:
        # Import lazily to avoid loading model at worker startup
        from app.services.embeddings import get_embedding
        import asyncio

        # Run async function in sync context
        loop = asyncio.new_event_loop()
        try:
            embedding = loop.run_until_complete(get_embedding(code))
        finally:
            loop.close()

        return embedding
    except Exception as exc:
        logger.error(f"Failed to generate embedding: {exc}")
        raise self.retry(exc=exc, countdown=60)


@celery_app.task(bind=True, max_retries=2)
def run_benchmark(
    self,
    solution_id: str,
    code: str,
    baseline_code: str,
    language: str = "python",
    input_sizes: list[int] = None
) -> dict:
    """
    Run performance benchmark for a solution against baseline.

    Args:
        solution_id: UUID of the solution to benchmark
        code: Solution source code
        baseline_code: Baseline code to compare against
        language: Programming language
        input_sizes: List of input sizes to test

    Returns:
        Benchmark results dict with comparison stats
    """
    try:
        import asyncio
        from app.services.benchmark import (
            run_benchmark_for_language,
            extract_function_name,
            is_language_supported,
            DEFAULT_INPUT_SIZES
        )

        if not is_language_supported(language):
            return {
                "solution_id": solution_id,
                "success": False,
                "error": f"Language {language} not supported for benchmarking"
            }

        sizes = input_sizes or DEFAULT_INPUT_SIZES

        # Extract function names
        baseline_func = extract_function_name(baseline_code, language)
        solution_func = extract_function_name(code, language)

        if not baseline_func or not solution_func:
            return {
                "solution_id": solution_id,
                "success": False,
                "error": "Could not extract function names from code"
            }

        # Run benchmarks
        loop = asyncio.new_event_loop()
        results = []

        try:
            for size in sizes:
                baseline_result = loop.run_until_complete(
                    run_benchmark_for_language(baseline_code, baseline_func, size, language)
                )
                solution_result = loop.run_until_complete(
                    run_benchmark_for_language(code, solution_func, size, language)
                )

                if baseline_result.success and solution_result.success:
                    speedup = (
                        baseline_result.execution_time_ms / solution_result.execution_time_ms
                        if solution_result.execution_time_ms > 0
                        else 1.0
                    )
                    results.append({
                        "input_size": size,
                        "baseline_time_ms": round(baseline_result.execution_time_ms, 3),
                        "solution_time_ms": round(solution_result.execution_time_ms, 3),
                        "speedup": round(speedup, 2),
                        "baseline_memory": baseline_result.memory_bytes,
                        "solution_memory": solution_result.memory_bytes,
                    })
                else:
                    logger.warning(
                        f"Benchmark failed for size {size}: "
                        f"baseline={baseline_result.error}, solution={solution_result.error}"
                    )
        finally:
            loop.close()

        if not results:
            return {
                "solution_id": solution_id,
                "success": False,
                "error": "All benchmark runs failed"
            }

        # Calculate average speedup
        avg_speedup = sum(r["speedup"] for r in results) / len(results)

        result = {
            "solution_id": solution_id,
            "language": language,
            "success": True,
            "results": results,
            "average_speedup": round(avg_speedup, 2),
        }

        logger.info(f"Benchmark completed for solution {solution_id}: {avg_speedup:.2f}x speedup")
        return result

    except Exception as exc:
        logger.error(f"Benchmark failed for solution {solution_id}: {exc}")
        raise self.retry(exc=exc, countdown=30)


@celery_app.task
def update_solution_embedding(solution_id: int, code: str, language: str = "python") -> bool:
    """
    Update embedding for a solution in the database.

    Args:
        solution_id: ID of solution to update
        code: Source code
        language: Programming language

    Returns:
        True if successful
    """
    try:
        embedding = generate_embedding(code, language)
        # In production: update database with new embedding
        logger.info(f"Updated embedding for solution {solution_id}")
        return True
    except Exception as exc:
        logger.error(f"Failed to update embedding for solution {solution_id}: {exc}")
        return False


@celery_app.task
def reindex_all_solutions() -> dict:
    """
    Reindex all solutions with fresh embeddings.

    Returns:
        Stats about reindexing process
    """
    logger.info("Starting full reindex of all solutions")
    # Placeholder - would query all solutions and regenerate embeddings
    return {
        "status": "completed",
        "solutions_processed": 0,
        "errors": 0
    }
