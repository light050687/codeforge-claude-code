from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models.benchmark import Benchmark
from app.models.solution import Solution
from app.schemas.benchmark import BenchmarkCreate, BenchmarkResponse

router = APIRouter()


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
