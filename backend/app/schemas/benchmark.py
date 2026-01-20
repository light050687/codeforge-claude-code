from datetime import datetime
from typing import Any
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_serializer


class BenchmarkEnvironmentBase(BaseModel):
    """Benchmark execution environment"""
    name: str
    python_version: str
    python_implementation: str
    cpu_model: str | None = None
    cpu_cores: int | None = None
    ram_gb: int | None = None
    os_name: str | None = None
    os_version: str | None = None
    container_image: str | None = None
    container_memory_limit_mb: int | None = None


class BenchmarkEnvironmentCreate(BenchmarkEnvironmentBase):
    pass


class BenchmarkEnvironmentResponse(BenchmarkEnvironmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime

    @field_serializer('id')
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)


class BenchmarkBase(BaseModel):
    input_size: int
    input_type: str | None = None  # random, sorted, worst_case, etc.

    # Time metrics
    execution_time_ms: float
    execution_time_min_ms: float | None = None
    execution_time_max_ms: float | None = None
    execution_time_std_ms: float | None = None

    # Memory metrics
    memory_bytes: int | None = None
    memory_peak_bytes: int | None = None
    memory_allocated_bytes: int | None = None

    # Baseline comparison
    baseline_time_ms: float | None = None
    baseline_memory_bytes: int | None = None
    speedup: float | None = None
    memory_reduction: float | None = None

    # Run configuration
    runs_count: int = 10
    warmup_runs: int | None = None
    timeout_ms: int | None = None

    # Status
    success: bool = True
    error_message: str | None = None
    output_correct: bool | None = None


class BenchmarkCreate(BenchmarkBase):
    solution_id: str
    environment_id: str | None = None


class BenchmarkResponse(BenchmarkBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    solution_id: UUID
    environment_id: UUID | None = None
    environment: BenchmarkEnvironmentResponse | None = None

    # Raw results for analysis
    raw_results: dict | None = None

    created_at: datetime

    @field_serializer('id', 'solution_id')
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)

    @field_serializer('environment_id')
    def serialize_env_uuid(self, v: UUID | None) -> str | None:
        return str(v) if v else None


class BenchmarkRunRequest(BaseModel):
    """Request to run a new benchmark"""
    solution_id: str
    input_sizes: list[int] | None = None
    input_type: str | None = None
    runs: int = 10
    warmup_runs: int = 3
    timeout_ms: int = 30000
    verify_output: bool = True


class BenchmarkCompareResponse(BaseModel):
    """Comparison of multiple solutions' benchmarks"""
    solutions: list[dict]  # solution_id, title, language
    benchmarks: list[BenchmarkResponse]
    input_sizes: list[int]
    winner_speed: str | None = None  # solution_id
    winner_memory: str | None = None  # solution_id
    winner_balanced: str | None = None  # solution_id
