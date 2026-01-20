from datetime import datetime
from pydantic import BaseModel


class BenchmarkBase(BaseModel):
    input_size: str
    execution_time_ms: float
    memory_mb: float
    iterations: int = 10
    cpu_info: str | None = None


class BenchmarkCreate(BenchmarkBase):
    solution_id: int


class BenchmarkResponse(BenchmarkBase):
    id: int
    solution_id: int
    created_at: datetime

    class Config:
        from_attributes = True
