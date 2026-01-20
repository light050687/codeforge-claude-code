from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse

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
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
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
