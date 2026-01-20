from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_serializer


class ProblemBase(BaseModel):
    title: str
    description: str | None = None
    category: str
    difficulty: str
    baseline_code: str
    baseline_language: str


class ProblemCreate(ProblemBase):
    test_cases: str | None = None
    baseline_complexity_time: str | None = None
    baseline_complexity_space: str | None = None


class ProblemResponse(ProblemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    baseline_complexity_time: str | None = None
    baseline_complexity_space: str | None = None
    created_at: datetime

    @field_serializer('id')
    def serialize_id(self, v: UUID) -> str:
        return str(v)


class ProblemList(BaseModel):
    items: list[ProblemResponse]
    total: int
    page: int
    size: int
