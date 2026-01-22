"""
Pydantic schemas for comments.
"""
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_serializer


class CommentCreate(BaseModel):
    """Schema for creating a comment."""
    solution_id: str
    content: str
    parent_id: str | None = None


class CommentUpdate(BaseModel):
    """Schema for updating a comment."""
    content: str


class CommentResponse(BaseModel):
    """Schema for comment response."""
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    solution_id: UUID
    author_id: UUID
    parent_id: UUID | None
    content: str
    upvotes: int
    is_edited: bool
    created_at: datetime
    updated_at: datetime

    # Author info (populated from relationship)
    author_username: str | None = None
    author_avatar: str | None = None

    # Nested replies (for threaded display)
    replies: list["CommentResponse"] = []

    @field_serializer('id', 'solution_id', 'author_id', 'parent_id')
    def serialize_uuid(self, v):
        return str(v) if v else None


class CommentList(BaseModel):
    """Schema for list of comments."""
    items: list[CommentResponse]
    total: int
