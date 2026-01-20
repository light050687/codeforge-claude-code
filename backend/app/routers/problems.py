import re
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.problem import Problem
from app.schemas.problem import ProblemCreate, ProblemResponse, ProblemList


def generate_slug(title: str) -> str:
    """Generate URL-friendly slug from title."""
    slug = title.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s_]+', '-', slug)
    slug = re.sub(r'-+', '-', slug)
    return slug.strip('-')

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

    # Count total - build separate count query with same filters
    count_query = select(func.count()).select_from(Problem)
    if category:
        count_query = count_query.where(Problem.category == category)
    if difficulty:
        count_query = count_query.where(Problem.difficulty == difficulty)
    total = await db.scalar(count_query) or 0

    # Paginate
    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    problems = result.scalars().all()

    return ProblemList(items=problems, total=total, page=page, size=size)


@router.get("/slug/{slug}", response_model=ProblemResponse)
async def get_problem_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a specific problem by slug."""
    result = await db.execute(select(Problem).where(Problem.slug == slug))
    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    return problem


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
    # Generate slug from title if not provided
    slug = problem.slug or generate_slug(problem.title)

    # Check if slug already exists
    existing = await db.execute(select(Problem).where(Problem.slug == slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Problem with this slug already exists")

    db_problem = Problem(
        title=problem.title,
        slug=slug,
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
