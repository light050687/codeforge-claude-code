from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate
from app.utils.jwt import get_current_user

router = APIRouter()


@router.get("/", response_model=list[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    sort_by: str = Query("score", regex="^(score|solutions|recent)$"),
    db: AsyncSession = Depends(get_db),
):
    """List users (leaderboard)."""
    query = select(User)

    # Sorting
    if sort_by == "score":
        query = query.order_by(User.score.desc())
    elif sort_by == "solutions":
        query = query.order_by(User.solutions_count.desc())
    else:  # recent
        query = query.order_by(User.created_at.desc())

    query = query.offset((page - 1) * size).limit(size)
    result = await db.execute(query)
    users = result.scalars().all()

    return users


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a specific user by ID."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.get("/username/{username}", response_model=UserResponse)
async def get_user_by_username(username: str, db: AsyncSession = Depends(get_db)):
    """Get a user by username."""
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user


@router.get("/leaderboard/top")
async def get_top_users(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get top users by score."""
    result = await db.execute(
        select(User)
        .order_by(User.score.desc())
        .limit(limit)
    )
    users = result.scalars().all()

    return {
        "users": users,
        "total": len(users),
    }


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update current user's profile."""
    # Only update provided fields
    if user_update.email is not None:
        current_user.email = user_update.email
    if user_update.avatar_url is not None:
        current_user.avatar_url = user_update.avatar_url

    await db.commit()
    await db.refresh(current_user)

    return current_user


@router.get("/me/stats")
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get detailed statistics for current user."""
    from app.models.solution import Solution
    from app.models.vote import Vote

    # Get solutions with their stats
    solutions_result = await db.execute(
        select(Solution)
        .where(Solution.author_id == current_user.id)
    )
    solutions = solutions_result.scalars().all()

    # Calculate stats
    total_speedup = sum(s.speedup or 0 for s in solutions)
    avg_speedup = total_speedup / len(solutions) if solutions else 0

    # Count votes received
    votes_result = await db.execute(
        select(func.sum(Vote.value))
        .join(Solution, Vote.solution_id == Solution.id)
        .where(Solution.author_id == current_user.id)
    )
    total_votes = votes_result.scalar() or 0

    # Solutions by language
    languages = {}
    for s in solutions:
        lang = s.language.lower()
        languages[lang] = languages.get(lang, 0) + 1

    # Best solutions (by speedup)
    best_solutions = sorted(
        [{"id": str(s.id), "title": s.title, "speedup": s.speedup}
         for s in solutions if s.speedup],
        key=lambda x: x["speedup"],
        reverse=True
    )[:5]

    return {
        "total_solutions": len(solutions),
        "total_votes": total_votes,
        "average_speedup": round(avg_speedup, 2),
        "languages": languages,
        "best_solutions": best_solutions,
        "score": current_user.score,
    }
