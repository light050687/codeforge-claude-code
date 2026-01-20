import logging
from uuid import UUID
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.benchmark import Benchmark
from app.models.solution import Solution
from app.models.problem import Problem
from app.schemas.benchmark import BenchmarkCreate, BenchmarkResponse
from app.services.benchmark import (
    run_python_benchmark,
    run_benchmark_comparison,
    extract_function_name,
    BenchmarkResult,
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
    db: AsyncSession = Depends(get_db),
):
    """Compare benchmarks between multiple solutions."""
    ids = [UUID(id.strip()) for id in solution_ids.split(",")]

    if len(ids) < 2 or len(ids) > 3:
        raise HTTPException(
            status_code=400,
            detail="Must compare 2 or 3 solutions"
        )

    result = await db.execute(
        select(Benchmark)
        .where(Benchmark.solution_id.in_(ids))
        .order_by(Benchmark.solution_id, Benchmark.input_size)
    )
    benchmarks = result.scalars().all()

    # Group by solution
    comparison = {}
    for b in benchmarks:
        sid = str(b.solution_id)
        if sid not in comparison:
            comparison[sid] = []
        comparison[sid].append({
            "input_size": b.input_size,
            "execution_time_ms": b.execution_time_ms,
            "memory_bytes": b.memory_bytes,
        })

    return comparison


@router.post("/run", response_model=RunBenchmarkResponse)
async def run_benchmark(
    request: RunBenchmarkRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Run benchmarks for a solution against its problem's baseline.
    This actually executes the code and measures performance.
    """
    solution_uuid = UUID(request.solution_id)

    # Get solution with problem
    result = await db.execute(
        select(Solution)
        .options(joinedload(Solution.problem))
        .where(Solution.id == solution_uuid)
    )
    solution = result.scalar_one_or_none()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    if solution.language.lower() != "python":
        raise HTTPException(
            status_code=400,
            detail=f"Benchmarking only supported for Python, got {solution.language}"
        )

    problem = solution.problem
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # Extract function names
    baseline_func = extract_function_name(problem.baseline_code, "python")
    solution_func = extract_function_name(solution.code, "python")

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

    input_sizes = request.input_sizes or [100, 1000, 10000]

    try:
        # Run comparison benchmarks
        comparisons = await run_benchmark_comparison(
            baseline_code=problem.baseline_code,
            optimized_code=solution.code,
            baseline_func=baseline_func,
            optimized_func=solution_func,
            input_sizes=input_sizes
        )

        if not comparisons:
            return RunBenchmarkResponse(
                solution_id=request.solution_id,
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
            solution_id=request.solution_id,
            results=benchmark_results,
            speedup=round(avg_speedup, 2),
            success=True
        )

    except Exception as e:
        logger.error(f"Benchmark failed: {e}")
        return RunBenchmarkResponse(
            solution_id=request.solution_id,
            results=[],
            speedup=None,
            success=False,
            error=str(e)
        )
