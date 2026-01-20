from pydantic import BaseModel, Field


class SearchQuery(BaseModel):
    query: str = Field(..., min_length=1, max_length=500)
    language: str | None = None
    category: str | None = None
    min_speedup: float | None = None
    sort: str = Field(default="relevance")  # relevance, speedup, votes, recent
    limit: int = Field(default=20, ge=1, le=100)
    offset: int = Field(default=0, ge=0)


class SearchResultItem(BaseModel):
    id: str  # UUID as string
    title: str
    code_preview: str
    language: str
    speedup: float | None
    vote_count: int
    author_username: str
    problem_id: str  # UUID as string
    problem_title: str
    problem_category: str
    similarity_score: float | None = None  # Optional for category-only searches


class SearchResult(BaseModel):
    items: list[SearchResultItem]
    total: int
    query: str
