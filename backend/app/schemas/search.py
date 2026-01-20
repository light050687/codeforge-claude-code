from pydantic import BaseModel, Field

from app.models.problem import Category


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    language: str | None = None
    category: Category | None = None
    min_speedup: float | None = None
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class SearchResultItem(BaseModel):
    id: int
    title: str
    code_preview: str
    language: str
    speedup: float | None
    votes_count: int
    author_username: str
    problem_title: str
    problem_category: Category
    similarity_score: float


class SearchResult(BaseModel):
    items: list[SearchResultItem]
    total: int
    query: str
