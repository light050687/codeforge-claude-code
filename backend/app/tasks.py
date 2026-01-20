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
    solution_id: int,
    code: str,
    language: str = "python",
    iterations: int = 100
) -> dict:
    """
    Run performance benchmark for a solution.

    Args:
        solution_id: ID of the solution to benchmark
        code: Source code to benchmark
        language: Programming language
        iterations: Number of benchmark iterations

    Returns:
        Benchmark results dict with timing stats
    """
    try:
        import time
        import statistics

        # Placeholder benchmark - in production this would run in a sandbox
        times = []
        for _ in range(min(iterations, 10)):  # Limited for safety
            start = time.perf_counter()
            # Simulated execution time
            time.sleep(0.001)
            end = time.perf_counter()
            times.append((end - start) * 1000)  # Convert to ms

        result = {
            "solution_id": solution_id,
            "language": language,
            "iterations": len(times),
            "mean_ms": statistics.mean(times),
            "median_ms": statistics.median(times),
            "std_dev_ms": statistics.stdev(times) if len(times) > 1 else 0,
            "min_ms": min(times),
            "max_ms": max(times),
        }

        logger.info(f"Benchmark completed for solution {solution_id}: {result['mean_ms']:.2f}ms")
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
