from datetime import datetime
from typing import Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_serializer


class SolutionBase(BaseModel):
    title: str
    code: str
    language: str
    description: str | None = None
    complexity_time: str | None = None
    complexity_space: str | None = None
    tags: list[str] = []
    optimization_patterns: list[str] = []


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


class BenchmarkEnvironmentBrief(BaseModel):
    """Brief benchmark environment info for solution response"""
    model_config = ConfigDict(from_attributes=True)

    name: str
    python_version: str
    python_implementation: str
    cpu_model: str | None = None
    cpu_cores: int | None = None
    ram_gb: int | None = None
    os_name: str | None = None
    os_version: str | None = None


class SolutionResponse(SolutionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    problem_id: UUID
    problem_slug: str | None = None  # For routing to problem page
    author: AuthorBrief | None = None

    # Speed metrics
    speedup: float | None = None
    avg_execution_time_ms: float | None = None

    # Memory metrics
    memory_reduction: float | None = None
    avg_memory_bytes: int | None = None
    peak_memory_bytes: int | None = None

    # Combined efficiency score (0-100)
    efficiency_score: float | None = None

    # Code quality metrics
    readability_score: float | None = None
    lines_of_code: int | None = None
    cyclomatic_complexity: int | None = None

    # Dependencies
    dependencies: list[str] = []
    has_external_deps: bool = False

    # Badges
    badges: list[str] = []

    # Verification and votes
    vote_count: int = 0
    is_verified: bool = False

    # Benchmark info
    last_benchmark_at: datetime | None = None
    benchmark_environment: dict | None = None

    created_at: datetime

    @field_serializer('id', 'problem_id')
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)


class SolutionList(BaseModel):
    items: list[SolutionResponse]
    total: int
    page: int
    size: int


class SolutionStats(BaseModel):
    """Statistics for solutions in a category or problem"""
    total_solutions: int
    fastest_speedup: float | None = None
    best_memory_reduction: float | None = None
    avg_efficiency_score: float | None = None
    languages: dict[str, int] = {}  # language -> count
    badges_count: dict[str, int] = {}  # badge -> count
