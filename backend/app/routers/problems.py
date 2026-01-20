from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.problem import Problem
from app.schemas.problem import ProblemCreate, ProblemResponse, ProblemList

router = APIRouter()


@router.get("/", response_model=ProblemList)
async def list_problems(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: str | None = None,
    difficulty: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """List all problems with pagination and filters."""
    query = select(Problem)

    if category:
        query = query.where(Problem.category == category)
    if difficulty:
        query = query.where(Problem.difficulty == difficulty)

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total = await db.scalar(count_query) or 0

    # Paginate
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    problems = result.scalars().all()

    return ProblemList(items=problems, total=total, page=page, size=size)


@router.get("/{problem_id}", response_model=ProblemResponse)
async def get_problem(problem_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific problem by ID."""
    result = await db.execute(select(Problem).where(Problem.id == problem_id))
    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    return problem


@router.post("/", response_model=ProblemResponse)
async def create_problem(
    problem: ProblemCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new problem (admin only)."""
    db_problem = Problem(
        title=problem.title,
        description=problem.description,
        category=problem.category,
        difficulty=problem.difficulty,
        baseline_code=problem.baseline_code,
        baseline_language=problem.baseline_language,
        baseline_complexity_time=problem.baseline_complexity_time,
        baseline_complexity_space=problem.baseline_complexity_space,
        test_cases=problem.test_cases,
    )

    db.add(db_problem)
    await db.commit()
    await db.refresh(db_problem)

    return db_problem
