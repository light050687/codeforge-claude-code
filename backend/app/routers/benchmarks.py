import logging
from uuid import UUID
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.limiter import limiter
from app.models.benchmark import Benchmark
from app.models.solution import Solution
from app.models.problem import Problem
from app.schemas.benchmark import BenchmarkCreate, BenchmarkResponse
from app.services.benchmark import (
    run_benchmark_for_language,
    run_benchmark_comparison,
    extract_function_name,
    is_language_supported,
    BenchmarkResult,
    SUPPORTED_LANGUAGES,
)

logger = logging.getLogger(__name__)

router = APIRouter()


class RunBenchmarkRequest(BaseModel):
    solution_id: str
    input_sizes: list[int] | None = None


class RunBenchmarkResponse(BaseModel):
    solution_id: str
    results: list[dict]
    speedup: float | None
    success: bool
    error: str | None = None


class AsyncBenchmarkResponse(BaseModel):
    task_id: str
    solution_id: str
    status: str = "pending"
    message: str = "Benchmark queued for processing"


@router.get("/solution/{solution_id}", response_model=list[BenchmarkResponse])
async def get_solution_benchmarks(
    solution_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all benchmarks for a solution."""
    result = await db.execute(
        select(Benchmark)
        .where(Benchmark.solution_id == solution_id)
        .order_by(Benchmark.input_size)
    )
    benchmarks = result.scalars().all()
    return benchmarks


@router.post("/", response_model=BenchmarkResponse)
async def create_benchmark(
    benchmark: BenchmarkCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new benchmark result."""
    # Verify solution exists
    solution_uuid = UUID(benchmark.solution_id)
    result = await db.execute(
        select(Solution).where(Solution.id == solution_uuid)
    )
    solution = result.scalar_one_or_none()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    db_benchmark = Benchmark(
        solution_id=solution_uuid,
        hardware_profile=benchmark.hardware_profile,
        input_size=benchmark.input_size,
        execution_time_ms=benchmark.execution_time_ms,
        memory_bytes=benchmark.memory_bytes,
        runs_count=benchmark.runs_count,
        baseline_time_ms=benchmark.baseline_time_ms,
    )

    db.add(db_benchmark)
    await db.commit()
    await db.refresh(db_benchmark)

    return db_benchmark


@router.get("/compare")
async def compare_solutions(
    solution_ids: str = Query(..., description="Comma-separated solution IDs"),
    include_solutions: bool = Query(False, description="Include full solution details"),
    db: AsyncSession = Depends(get_db),
):
    """Compare benchmarks between multiple solutions."""
    ids = [UUID(id.strip()) for id in solution_ids.split(",")]

    if len(ids) < 2 or len(ids) > 3:
        raise HTTPException(
            status_code=400,
            detail="Must compare 2 or 3 solutions"
        )

    # Get benchmarks
    result = await db.execute(
        select(Benchmark)
        .where(Benchmark.solution_id.in_(ids))
        .order_by(Benchmark.solution_id, Benchmark.input_size)
    )
    benchmarks = result.scalars().all()

    # Group benchmarks by solution
    benchmark_data = {}
    for b in benchmarks:
        sid = str(b.solution_id)
        if sid not in benchmark_data:
            benchmark_data[sid] = []
        benchmark_data[sid].append({
            "input_size": b.input_size,
            "execution_time_ms": b.execution_time_ms,
            "memory_bytes": b.memory_bytes,
        })

    response = {"benchmarks": benchmark_data}

    # Optionally include full solution details
    if include_solutions:
        result = await db.execute(
            select(Solution)
            .options(joinedload(Solution.author))
            .where(Solution.id.in_(ids))
        )
        solutions = result.scalars().unique().all()

        solution_data = []
        for s in solutions:
            solution_data.append({
                "id": str(s.id),
                "title": s.title,
                "code": s.code,
                "language": s.language,
                "speedup": s.speedup,
                "memory_reduction": s.memory_reduction,
                "efficiency_score": s.efficiency_score,
                "readability_score": s.readability_score,
                "lines_of_code": s.lines_of_code,
                "cyclomatic_complexity": s.cyclomatic_complexity,
                "badges": s.badges or [],
                "author_username": s.author.username if s.author else "anonymous",
            })
        response["solutions"] = solution_data

        # Determine winners
        if solution_data:
            # Speed winner (highest speedup)
            speed_winner = max(solution_data, key=lambda x: x["speedup"] or 0)
            response["winner_speed"] = speed_winner["id"] if speed_winner["speedup"] else None

            # Memory winner (highest memory_reduction)
            memory_winner = max(solution_data, key=lambda x: x["memory_reduction"] or 0)
            response["winner_memory"] = memory_winner["id"] if memory_winner["memory_reduction"] else None

            # Balanced winner (highest efficiency_score)
            balanced_winner = max(solution_data, key=lambda x: x["efficiency_score"] or 0)
            response["winner_balanced"] = balanced_winner["id"] if balanced_winner["efficiency_score"] else None

    return response


@router.post("/run", response_model=RunBenchmarkResponse)
@limiter.limit("10/minute")
async def run_benchmark(
    request: Request,
    benchmark_request: RunBenchmarkRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Run benchmarks for a solution against its problem's baseline.
    This actually executes the code and measures performance.
    """
    solution_uuid = UUID(benchmark_request.solution_id)

    # Get solution with problem
    result = await db.execute(
        select(Solution)
        .options(joinedload(Solution.problem))
        .where(Solution.id == solution_uuid)
    )
    solution = result.scalar_one_or_none()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    language = solution.language.lower()
    if not is_language_supported(language):
        raise HTTPException(
            status_code=400,
            detail=f"Benchmarking supported for {', '.join(SUPPORTED_LANGUAGES)}, got {solution.language}"
        )

    problem = solution.problem
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Extract function names
    baseline_func = extract_function_name(problem.baseline_code, language)
    solution_func = extract_function_name(solution.code, language)

    if not baseline_func:
        raise HTTPException(
            status_code=400,
            detail="Could not extract function name from baseline code"
        )

    if not solution_func:
        raise HTTPException(
            status_code=400,
            detail="Could not extract function name from solution code"
        )

    input_sizes = benchmark_request.input_sizes or [100, 1000, 10000]

    try:
        # Run comparison benchmarks
        comparisons = await run_benchmark_comparison(
            baseline_code=problem.baseline_code,
            optimized_code=solution.code,
            baseline_func=baseline_func,
            optimized_func=solution_func,
            input_sizes=input_sizes,
            language=language
        )

        if not comparisons:
            return RunBenchmarkResponse(
                solution_id=benchmark_request.solution_id,
                results=[],
                speedup=None,
                success=False,
                error="Benchmark execution failed"
            )

        # Save results to database
        benchmark_results = []
        for comp in comparisons:
            # Save benchmark for solution
            db_benchmark = Benchmark(
                solution_id=solution_uuid,
                hardware_profile="standard",
                input_size=comp.input_size,
                execution_time_ms=comp.optimized_time_ms,
                memory_bytes=comp.memory_optimized,
                runs_count=5,
                baseline_time_ms=comp.baseline_time_ms,
            )
            db.add(db_benchmark)

            benchmark_results.append({
                "input_size": comp.input_size,
                "baseline_time_ms": round(comp.baseline_time_ms, 3),
                "optimized_time_ms": round(comp.optimized_time_ms, 3),
                "speedup": round(comp.speedup, 2),
                "memory_baseline": comp.memory_baseline,
                "memory_optimized": comp.memory_optimized,
            })

        # Calculate average speedup
        avg_speedup = sum(c.speedup for c in comparisons) / len(comparisons)

        # Update solution speedup
        solution.speedup = round(avg_speedup, 2)

        await db.commit()

        logger.info(
            f"Benchmark completed for solution {solution.id}: "
            f"{avg_speedup:.2f}x speedup"
        )

        return RunBenchmarkResponse(
            solution_id=benchmark_request.solution_id,
            results=benchmark_results,
            speedup=round(avg_speedup, 2),
            success=True
        )

    except Exception as e:
        logger.error(f"Benchmark failed: {e}")
        return RunBenchmarkResponse(
            solution_id=benchmark_request.solution_id,
            results=[],
            speedup=None,
            success=False,
            error=str(e)
        )


@router.post("/run/async", response_model=AsyncBenchmarkResponse)
async def run_benchmark_async(
    request: RunBenchmarkRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Queue a benchmark to run asynchronously via Celery.
    Returns immediately with a task ID for status polling.
    """
    from app.tasks import run_benchmark as run_benchmark_task

    solution_uuid = UUID(benchmark_request.solution_id)

    # Get solution with problem
    result = await db.execute(
        select(Solution)
        .options(joinedload(Solution.problem))
        .where(Solution.id == solution_uuid)
    )
    solution = result.scalar_one_or_none()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    language = solution.language.lower()
    if not is_language_supported(language):
        raise HTTPException(
            status_code=400,
            detail=f"Benchmarking supported for {', '.join(SUPPORTED_LANGUAGES)}, got {solution.language}"
        )

    problem = solution.problem
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Queue the task
    task = run_benchmark_task.delay(
        solution_id=str(solution.id),
        code=solution.code,
        baseline_code=problem.baseline_code,
        language=language,
        input_sizes=benchmark_request.input_sizes
    )

    logger.info(f"Queued async benchmark for solution {solution.id}, task_id={task.id}")

    return AsyncBenchmarkResponse(
        task_id=task.id,
        solution_id=benchmark_request.solution_id,
        status="pending",
        message="Benchmark queued for processing"
    )


@router.get("/task/{task_id}")
async def get_benchmark_task_status(task_id: str):
    """
    Get the status and result of an async benchmark task.
    """
    from celery.result import AsyncResult
    from app.worker import celery_app

    result = AsyncResult(task_id, app=celery_app)

    response = {
        "task_id": task_id,
        "status": result.status,
        "ready": result.ready(),
    }

    if result.ready():
        if result.successful():
            response["result"] = result.result
        else:
            response["error"] = str(result.result)

    return response
