"""
Comments router for solution discussions.
"""
import logging
from uuid import UUID

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.comment import SolutionComment
from app.models.solution import Solution
from app.models.user import User
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse, CommentList
from app.utils.jwt import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()


def comment_to_response(comment: SolutionComment) -> CommentResponse:
    """Convert a SolutionComment model to CommentResponse schema."""
    return CommentResponse(
        id=comment.id,
        solution_id=comment.solution_id,
        author_id=comment.author_id,
        parent_id=comment.parent_id,
        content=comment.content,
        upvotes=comment.upvotes,
        is_edited=comment.is_edited,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author_username=comment.author.username if comment.author else None,
        author_avatar=comment.author.avatar_url if comment.author else None,
        replies=[comment_to_response(r) for r in comment.replies] if comment.replies else []
    )


@router.get("/solution/{solution_id}", response_model=CommentList)
async def get_solution_comments(
    solution_id: UUID,
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get all top-level comments for a solution with nested replies."""
    # Verify solution exists
    result = await db.execute(select(Solution).where(Solution.id == solution_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Solution not found")

    # Get top-level comments (no parent)
    result = await db.execute(
        select(SolutionComment)
        .options(
            joinedload(SolutionComment.author),
            joinedload(SolutionComment.replies).joinedload(SolutionComment.author)
        )
        .where(SolutionComment.solution_id == solution_id)
        .where(SolutionComment.parent_id.is_(None))
        .order_by(SolutionComment.upvotes.desc(), SolutionComment.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    comments = result.scalars().unique().all()

    # Count total
    count_result = await db.execute(
        select(func.count())
        .select_from(SolutionComment)
        .where(SolutionComment.solution_id == solution_id)
        .where(SolutionComment.parent_id.is_(None))
    )
    total = count_result.scalar() or 0

    return CommentList(
        items=[comment_to_response(c) for c in comments],
        total=total
    )


@router.post("/", response_model=CommentResponse)
async def create_comment(
    comment: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new comment (requires authentication)."""
    solution_uuid = UUID(comment.solution_id)

    # Verify solution exists
    result = await db.execute(select(Solution).where(Solution.id == solution_uuid))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Solution not found")

    # Verify parent comment exists if specified
    parent_uuid = None
    if comment.parent_id:
        parent_uuid = UUID(comment.parent_id)
        result = await db.execute(
            select(SolutionComment).where(SolutionComment.id == parent_uuid)
        )
        parent = result.scalar_one_or_none()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent comment not found")
        if parent.solution_id != solution_uuid:
            raise HTTPException(status_code=400, detail="Parent comment belongs to different solution")

    db_comment = SolutionComment(
        solution_id=solution_uuid,
        author_id=current_user.id,
        parent_id=parent_uuid,
        content=comment.content,
    )

    db.add(db_comment)
    await db.commit()
    await db.refresh(db_comment, ["author"])

    logger.info(f"User {current_user.username} created comment on solution {solution_uuid}")

    return comment_to_response(db_comment)


@router.patch("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    update: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a comment (author only)."""
    result = await db.execute(
        select(SolutionComment)
        .options(joinedload(SolutionComment.author))
        .where(SolutionComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this comment")

    comment.content = update.content
    comment.is_edited = True

    await db.commit()
    await db.refresh(comment)

    logger.info(f"User {current_user.username} updated comment {comment_id}")

    return comment_to_response(comment)


@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a comment (author only)."""
    result = await db.execute(
        select(SolutionComment).where(SolutionComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    if comment.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this comment")

    await db.delete(comment)
    await db.commit()

    logger.info(f"User {current_user.username} deleted comment {comment_id}")

    return {"message": "Comment deleted successfully"}


@router.post("/{comment_id}/vote")
async def vote_comment(
    comment_id: UUID,
    value: int = Query(..., ge=-1, le=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Vote on a comment (+1 or -1)."""
    result = await db.execute(
        select(SolutionComment).where(SolutionComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()

    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")

    # Simple vote tracking (no duplicate check for now)
    comment.upvotes += value

    await db.commit()

    return {"upvotes": comment.upvotes}
