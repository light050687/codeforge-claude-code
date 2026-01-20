from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_serializer


class BenchmarkBase(BaseModel):
    hardware_profile: str = "standard"
    input_size: int
    execution_time_ms: float
    memory_bytes: int | None = None
    runs_count: int = 10
    baseline_time_ms: float | None = None


class BenchmarkCreate(BenchmarkBase):
    solution_id: str


class BenchmarkResponse(BenchmarkBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    solution_id: UUID
    created_at: datetime

    @field_serializer('id', 'solution_id')
    def serialize_uuid(self, v: UUID) -> str:
        return str(v)
