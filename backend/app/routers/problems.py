from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.problem import Problem, Category, Difficulty
from app.schemas.problem import ProblemCreate, ProblemResponse, ProblemList

router = APIRouter()


@router.get("/", response_model=ProblemList)
async def list_problems(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    category: Category | None = None,
    difficulty: Difficulty | None = None,
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
async def get_problem(problem_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific problem by ID."""
    result = await db.execute(select(Problem).where(Problem.id == problem_id))
    problem = result.scalar_one_or_none()

    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    return problem


@router.get("/slug/{slug}", response_model=ProblemResponse)
async def get_problem_by_slug(slug: str, db: AsyncSession = Depends(get_db)):
    """Get a specific problem by slug."""
    result = await db.execute(select(Problem).where(Problem.slug == slug))
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
    slug = problem.slug or problem.title.lower().replace(" ", "-")

    db_problem = Problem(
        title=problem.title,
        slug=slug,
        description=problem.description,
        category=problem.category,
        difficulty=problem.difficulty,
        baseline_code=problem.baseline_code,
        baseline_language=problem.baseline_language,
        baseline_time_ms=problem.baseline_time_ms,
        test_cases=problem.test_cases,
    )

    db.add(db_problem)
    await db.commit()
    await db.refresh(db_problem)

    return db_problem
