from datetime import datetime
from pydantic import BaseModel

from app.schemas.user import UserResponse


class SolutionBase(BaseModel):
    title: str
    code: str
    language: str
    time_complexity: str | None = None
    space_complexity: str | None = None


class SolutionCreate(SolutionBase):
    problem_id: int


class AuthorBrief(BaseModel):
    id: int
    username: str
    avatar_url: str | None

    class Config:
        from_attributes = True


class SolutionResponse(SolutionBase):
    id: int
    problem_id: int
    author: AuthorBrief
    speedup: float | None
    execution_time_ms: float | None
    memory_mb: float | None
    votes_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class SolutionList(BaseModel):
    items: list[SolutionResponse]
    total: int
    page: int
    size: int
