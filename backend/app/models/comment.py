"""
Comment model for solution discussions.
"""
from datetime import datetime
import uuid
from sqlalchemy import Text, Integer, DateTime, ForeignKey, Boolean, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SolutionComment(Base):
    """Comment on a solution for discussion."""
    __tablename__ = "solution_comments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    solution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("solutions.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("solution_comments.id", ondelete="CASCADE"),
        nullable=True, index=True
    )

    content: Mapped[str] = mapped_column(Text)
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    is_edited: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    solution = relationship("Solution", back_populates="comments")
    author = relationship("User", back_populates="comments")
    replies = relationship(
        "SolutionComment",
        back_populates="parent",
        cascade="all, delete-orphan",
        foreign_keys=[parent_id]
    )
    parent = relationship(
        "SolutionComment",
        back_populates="replies",
        remote_side=[id],
        foreign_keys=[parent_id]
    )
