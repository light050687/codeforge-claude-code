from datetime import datetime
from pydantic import BaseModel

from app.models.problem import Category, Difficulty


class ProblemBase(BaseModel):
    title: str
    description: str
    category: Category
    difficulty: Difficulty
    baseline_code: str
    baseline_language: str


class ProblemCreate(ProblemBase):
    slug: str | None = None
    test_cases: str | None = None
    baseline_time_ms: float | None = None


class ProblemResponse(ProblemBase):
    id: int
    slug: str
    baseline_time_ms: float | None
    solutions_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProblemList(BaseModel):
    items: list[ProblemResponse]
    total: int
    page: int
    size: int
