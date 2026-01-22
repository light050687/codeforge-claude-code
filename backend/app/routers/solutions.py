import re
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.solution import Solution
from app.models.problem import Problem
from app.schemas.solution import SolutionCreate, SolutionResponse, SolutionList
from app.limiter import limiter
from app.services.benchmark_runner import calculate_readability_score, extract_dependencies
from app.utils.jwt import get_current_user
from app.utils.github import create_gist, GitHubOAuthError
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


def normalize_code_for_duplicate_check(code: str, language: str = "python") -> str:
    """
    Normalize code for duplicate detection.
    More aggressive than similarity check - strips all non-essential content.
    """
    normalized = code

    # Remove comments
    if language.lower() == "python":
        normalized = re.sub(r'#.*$', '', normalized, flags=re.MULTILINE)
        normalized = re.sub(r'""".*?"""', '', normalized, flags=re.DOTALL)
        normalized = re.sub(r"'''.*?'''", '', normalized, flags=re.DOTALL)
    else:
        normalized = re.sub(r'//.*$', '', normalized, flags=re.MULTILINE)
        normalized = re.sub(r'/\*.*?\*/', '', normalized, flags=re.DOTALL)

    # Remove all whitespace
    normalized = re.sub(r'\s+', '', normalized)

    # Convert to lowercase
    normalized = normalized.lower()

    return normalized


async def check_duplicate_code(
    db: AsyncSession,
    code: str,
    language: str,
    problem_id: UUID,
    threshold: float = 0.9
) -> Solution | None:
    """
    Check if similar code already exists for this problem.
    Returns the existing solution if found, None otherwise.
    """
    # Get all solutions for this problem in the same language
    result = await db.execute(
        select(Solution)
        .where(Solution.problem_id == problem_id)
        .where(Solution.language == language.lower())
    )
    existing_solutions = result.scalars().all()

    if not existing_solutions:
        return None

    # Normalize new code
    new_code_normalized = normalize_code_for_duplicate_check(code, language)

    for existing in existing_solutions:
        existing_normalized = normalize_code_for_duplicate_check(existing.code, language)

        # Check exact match (after normalization)
        if new_code_normalized == existing_normalized:
            logger.info(f"Exact duplicate found: solution {existing.id}")
            return existing

        # Check high similarity using Jaccard on tokens
        new_tokens = set(new_code_normalized)  # character-level
        existing_tokens = set(existing_normalized)

        if new_tokens and existing_tokens:
            intersection = len(new_tokens & existing_tokens)
            union = len(new_tokens | existing_tokens)
            similarity = intersection / union if union > 0 else 0

            if similarity >= threshold:
                logger.info(
                    f"Near-duplicate found: solution {existing.id} "
                    f"(similarity: {similarity:.2%})"
                )
                return existing

    return None


@router.get("/stats/by-category")
async def get_category_stats(db: AsyncSession = Depends(get_db)):
    """Get solution statistics grouped by category."""
    sql = """
        SELECT
            p.category,
            COUNT(s.id) as solutions_count,
            COALESCE(AVG(s.speedup), 0) as avg_speedup,
            COALESCE(MAX(s.speedup), 0) as max_speedup,
            SUM(s.vote_count) as total_votes
        FROM problems p
        LEFT JOIN solutions s ON s.problem_id = p.id
        GROUP BY p.category
        ORDER BY solutions_count DESC
    """
    result = await db.execute(text(sql))
    rows = result.fetchall()

    return [
        {
            "category": row.category,
            "solutions_count": row.solutions_count,
            "avg_speedup": round(row.avg_speedup, 1) if row.avg_speedup else 0,
            "max_speedup": row.max_speedup or 0,
            "total_votes": row.total_votes or 0,
        }
        for row in rows
    ]


@router.get("/", response_model=SolutionList)
async def list_solutions(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    problem_id: UUID | None = None,
    language: str | None = None,
    min_speedup: float | None = None,
    min_memory_reduction: float | None = None,
    badges: str | None = None,  # Comma-separated badges
    sort_by: str = Query("votes", regex="^(votes|speedup|memory|efficiency|recent)$"),
    db: AsyncSession = Depends(get_db),
):
    """List solutions with pagination and filters."""
    query = select(Solution).options(joinedload(Solution.author), joinedload(Solution.problem))

    if problem_id:
        query = query.where(Solution.problem_id == problem_id)
    if language:
        query = query.where(Solution.language == language)
    if min_speedup:
        query = query.where(Solution.speedup >= min_speedup)
    if min_memory_reduction:
        query = query.where(Solution.memory_reduction >= min_memory_reduction)
    if badges:
        # Filter by any of the specified badges
        badge_list = [b.strip() for b in badges.split(",")]
        query = query.where(Solution.badges.overlap(badge_list))

    # Sorting
    if sort_by == "votes":
        query = query.order_by(Solution.vote_count.desc())
    elif sort_by == "speedup":
        query = query.order_by(Solution.speedup.desc().nullslast())
    elif sort_by == "memory":
        query = query.order_by(Solution.memory_reduction.desc().nullslast())
    elif sort_by == "efficiency":
        query = query.order_by(Solution.efficiency_score.desc().nullslast())
    else:  # recent
        query = query.order_by(Solution.created_at.desc())

    # Count total - build separate count query with same filters
    count_query = select(func.count()).select_from(Solution)
    if problem_id:
        count_query = count_query.where(Solution.problem_id == problem_id)
    if language:
        count_query = count_query.where(Solution.language == language)
    if min_speedup:
        count_query = count_query.where(Solution.speedup >= min_speedup)
    if min_memory_reduction:
        count_query = count_query.where(Solution.memory_reduction >= min_memory_reduction)
    if badges:
        badge_list = [b.strip() for b in badges.split(",")]
        count_query = count_query.where(Solution.badges.overlap(badge_list))
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
        .options(joinedload(Solution.author), joinedload(Solution.problem))
        .where(Solution.id == solution_id)
    )
    solution = result.scalar_one_or_none()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    return solution


@router.post("/", response_model=SolutionResponse)
@limiter.limit("10/minute")
async def create_solution(
    request: Request,
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

    # Check for duplicate code
    duplicate = await check_duplicate_code(
        db=db,
        code=solution.code,
        language=solution.language,
        problem_id=problem_uuid,
        threshold=0.9  # 90% similarity threshold
    )

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail=f"Similar code already exists: '{duplicate.title}' (ID: {duplicate.id})"
        )

    # TODO: Get current user from auth
    author_id = None  # Anonymous for now

    # Calculate code quality metrics
    readability, loc, complexity = calculate_readability_score(solution.code)
    deps, has_external = extract_dependencies(solution.code)

    db_solution = Solution(
        problem_id=problem_uuid,
        author_id=author_id,
        title=solution.title,
        description=solution.description,
        code=solution.code,
        language=solution.language,
        complexity_time=solution.complexity_time,
        complexity_space=solution.complexity_space,
        # Code quality metrics
        readability_score=readability,
        lines_of_code=loc,
        cyclomatic_complexity=complexity,
        dependencies=deps,
        has_external_deps=has_external,
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


@router.get("/{solution_id}/versions", response_model=list[SolutionResponse])
async def get_solution_versions(
    solution_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Get all versions of a solution (including the original and all derived versions)."""
    # Find the root solution
    result = await db.execute(
        select(Solution)
        .options(joinedload(Solution.author), joinedload(Solution.problem))
        .where(Solution.id == solution_id)
    )
    solution = result.scalar_one_or_none()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    # Find root by traversing up the parent chain
    root_id = solution_id
    current = solution
    while current.parent_version_id:
        root_id = current.parent_version_id
        result = await db.execute(select(Solution).where(Solution.id == root_id))
        current = result.scalar_one_or_none()
        if not current:
            break

    # Get all versions (root + all descendants)
    result = await db.execute(
        select(Solution)
        .options(joinedload(Solution.author), joinedload(Solution.problem))
        .where(
            (Solution.id == root_id) |
            (Solution.parent_version_id == root_id)
        )
        .order_by(Solution.version)
    )
    versions = result.scalars().unique().all()

    return versions


@router.post("/{solution_id}/new-version", response_model=SolutionResponse)
async def create_new_version(
    solution_id: UUID,
    code: str = Query(..., description="New code for this version"),
    version_notes: str = Query(None, description="Notes about changes in this version"),
    db: AsyncSession = Depends(get_db),
):
    """Create a new version of an existing solution."""
    result = await db.execute(
        select(Solution)
        .options(joinedload(Solution.problem))
        .where(Solution.id == solution_id)
    )
    parent = result.scalar_one_or_none()

    if not parent:
        raise HTTPException(status_code=404, detail="Solution not found")

    # Find max version in this version chain
    root_id = solution_id
    current = parent
    while current.parent_version_id:
        root_id = current.parent_version_id
        result = await db.execute(select(Solution).where(Solution.id == root_id))
        current = result.scalar_one_or_none()
        if not current:
            break

    result = await db.execute(
        select(func.max(Solution.version))
        .where(
            (Solution.id == root_id) |
            (Solution.parent_version_id == root_id)
        )
    )
    max_version = result.scalar() or parent.version

    # Calculate quality metrics for new version
    readability, loc, complexity = calculate_readability_score(code)
    deps, has_external = extract_dependencies(code)

    # Create new version
    db_solution = Solution(
        problem_id=parent.problem_id,
        author_id=parent.author_id,
        parent_version_id=root_id,  # Always point to root
        version=max_version + 1,
        version_notes=version_notes,
        title=parent.title,
        description=parent.description,
        code=code,
        language=parent.language,
        complexity_time=parent.complexity_time,
        complexity_space=parent.complexity_space,
        readability_score=readability,
        lines_of_code=loc,
        cyclomatic_complexity=complexity,
        dependencies=deps,
        has_external_deps=has_external,
    )

    db.add(db_solution)
    await db.commit()
    await db.refresh(db_solution, ["author", "problem"])

    logger.info(f"Created version {db_solution.version} of solution {root_id}")

    return db_solution


# File extension mapping for gist
LANGUAGE_EXTENSIONS = {
    "python": "py",
    "javascript": "js",
    "typescript": "ts",
    "go": "go",
    "rust": "rs",
    "java": "java",
    "c++": "cpp",
    "c": "c",
}


@router.post("/{solution_id}/export-gist")
async def export_to_gist(
    solution_id: UUID,
    public: bool = Query(True, description="Whether the gist is public"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Export a solution to GitHub Gist.
    Requires the user to be authenticated with GitHub.
    """
    # Check if user has GitHub token
    if not current_user.github_access_token:
        raise HTTPException(
            status_code=400,
            detail="GitHub access token not found. Please re-authenticate with GitHub."
        )

    # Get solution
    result = await db.execute(
        select(Solution)
        .options(joinedload(Solution.problem))
        .where(Solution.id == solution_id)
    )
    solution = result.scalar_one_or_none()

    if not solution:
        raise HTTPException(status_code=404, detail="Solution not found")

    # Prepare filename
    ext = LANGUAGE_EXTENSIONS.get(solution.language.lower(), "txt")
    filename = f"{solution.title.lower().replace(' ', '_')}.{ext}"

    # Prepare description
    description = f"CodeForge: {solution.title}"
    if solution.speedup:
        description += f" - {solution.speedup}x speedup"
    if solution.problem:
        description += f" | Problem: {solution.problem.title}"

    try:
        gist = await create_gist(
            access_token=current_user.github_access_token,
            filename=filename,
            content=solution.code,
            description=description,
            public=public,
        )

        logger.info(f"User {current_user.username} exported solution {solution_id} to gist {gist.id}")

        return {
            "gist_id": gist.id,
            "url": gist.html_url,
            "raw_url": gist.raw_url,
        }

    except GitHubOAuthError as e:
        logger.error(f"Failed to create gist: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create gist: {str(e)}"
        )
