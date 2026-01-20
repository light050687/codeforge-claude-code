from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.solution import Solution
from app.models.problem import Problem
from app.schemas.solution import SolutionCreate, SolutionResponse, SolutionList

router = APIRouter()


@router.get("/", response_model=SolutionList)
async def list_solutions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    problem_id: UUID | None = None,
    language: str | None = None,
    min_speedup: float | None = None,
    sort_by: str = Query("votes", regex="^(votes|speedup|recent)$"),
    db: AsyncSession = Depends(get_db),
):
    """List solutions with pagination and filters."""
    query = select(Solution).options(joinedload(Solution.author))

    if problem_id:
        query = query.where(Solution.problem_id == problem_id)
    if language:
        query = query.where(Solution.language == language)
    if min_speedup:
        query = query.where(Solution.speedup >= min_speedup)

    # Sorting
    if sort_by == "votes":
        query = query.order_by(Solution.vote_count.desc())
    elif sort_by == "speedup":
        query = query.order_by(Solution.speedup.desc().nullslast())
    else:  # recent
        query = query.order_by(Solution.created_at.desc())

    # Count total
    count_query = select(func.count()).select_from(
        select(Solution.id).where(query.whereclause).subquery()
    )
    total = await db.scalar(count_query) or 0

    # Paginate
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    solutions = result.scalars().unique().all()

    return SolutionList(items=solutions, total=total, page=page, size=size)


@router.get("/{solution_id}", response_model=SolutionResponse)
async def get_solution(solution_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific solution by ID."""
    result = await db.execute(
        select(Solution)
        .options(joinedload(Solution.author))
        .where(Solution.id == solution_id)
    )
    solution = result.scalar_one_or_none()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    return solution


@router.post("/", response_model=SolutionResponse)
async def create_solution(
    solution: SolutionCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new solution."""
    # Check if problem exists
    problem_uuid = UUID(solution.problem_id)
    result = await db.execute(
        select(Problem).where(Problem.id == problem_uuid)
    )
    problem = result.scalar_one_or_none()
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    # TODO: Get current user from auth
    author_id = None  # Anonymous for now

    db_solution = Solution(
        problem_id=problem_uuid,
        author_id=author_id,
        title=solution.title,
        description=solution.description,
        code=solution.code,
        language=solution.language,
        complexity_time=solution.complexity_time,
        complexity_space=solution.complexity_space,
    )

    db.add(db_solution)
    await db.commit()
    await db.refresh(db_solution)

    return db_solution


@router.post("/{solution_id}/vote")
async def vote_solution(
    solution_id: UUID,
    value: int = Query(..., ge=-1, le=1),
    db: AsyncSession = Depends(get_db),
):
    """Vote on a solution (+1 or -1)."""
    result = await db.execute(
        select(Solution).where(Solution.id == solution_id)
    )
    solution = result.scalar_one_or_none()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    # TODO: Check if user already voted, update vote
    solution.vote_count += value
    await db.commit()

    return {"vote_count": solution.vote_count}
