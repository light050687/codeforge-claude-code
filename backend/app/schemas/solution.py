from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_serializer


class SolutionBase(BaseModel):
    title: str
    code: str
    language: str
    description: str | None = None
    complexity_time: str | None = None
    complexity_space: str | None = None


class SolutionCreate(SolutionBase):
    problem_id: str


class AuthorBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    username: str
    avatar_url: str | None = None

    @field_serializer('id')
    def serialize_id(self, v: UUID) -> str:
        return str(v)


class SolutionResponse(SolutionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    problem_id: UUID
    author: AuthorBrief | None = None
    speedup: float | None = None
    vote_count: int = 0
    is_verified: bool = False
    tags: list[str] = []
    created_at: datetime

    @field_serializer('id', 'problem_id')
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)


class SolutionList(BaseModel):
    items: list[SolutionResponse]
    total: int
    page: int
    size: int
