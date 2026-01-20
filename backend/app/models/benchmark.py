from datetime import datetime
import uuid
from sqlalchemy import String, Integer, Float, BigInteger, DateTime, ForeignKey, Boolean, Text, func, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class BenchmarkEnvironment(Base):
    """Captures the exact environment where benchmarks are run for reproducibility"""
    __tablename__ = "benchmark_environments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(100), unique=True)  # e.g., "standard-python311"

    # Python environment
    python_version: Mapped[str] = mapped_column(String(20))  # e.g., "3.11.5"
    python_implementation: Mapped[str] = mapped_column(String(20), default="CPython")  # CPython, PyPy

    # Hardware
    cpu_model: Mapped[str | None] = mapped_column(String(200), nullable=True)
    cpu_cores: Mapped[int | None] = mapped_column(Integer, nullable=True)
    ram_gb: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # OS
    os_name: Mapped[str | None] = mapped_column(String(50), nullable=True)  # Linux, Windows, macOS
    os_version: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Docker/container info
    container_image: Mapped[str | None] = mapped_column(String(200), nullable=True)
    container_memory_limit_mb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    container_cpu_limit: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Configuration
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    benchmarks = relationship("Benchmark", back_populates="environment")


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    solution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("solutions.id", ondelete="CASCADE"), index=True
    )
    environment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("benchmark_environments.id"), nullable=True, index=True
    )

    # Input configuration
    input_size: Mapped[int] = mapped_column(Integer, index=True)
    input_type: Mapped[str | None] = mapped_column(String(50), nullable=True)  # e.g., "random", "sorted", "worst_case"
    input_data_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)  # SHA256 of input for reproducibility

    # === TIME METRICS ===
    execution_time_ms: Mapped[float] = mapped_column(Float)
    execution_time_min_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    execution_time_max_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    execution_time_std_ms: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Baseline comparison
    baseline_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    speedup: Mapped[float | None] = mapped_column(Float, nullable=True)

    # === MEMORY METRICS ===
    memory_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    memory_peak_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    memory_allocated_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)  # Total allocations

    # Baseline memory comparison
    baseline_memory_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    memory_reduction: Mapped[float | None] = mapped_column(Float, nullable=True)  # e.g., 2.0 means 2x less memory

    # === RUN INFO ===
    runs_count: Mapped[int] = mapped_column(Integer, default=10)
    warmup_runs: Mapped[int] = mapped_column(Integer, default=3)
    timeout_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # === STATUS ===
    success: Mapped[bool] = mapped_column(Boolean, default=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    output_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)  # Did it produce correct output?

    # Raw data for debugging
    raw_results = mapped_column(JSON, nullable=True)  # Store all individual run times

    # Legacy field for backwards compatibility
    hardware_profile: Mapped[str] = mapped_column(String(50), default="standard")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    solution = relationship("Solution", back_populates="benchmarks")
    environment = relationship("BenchmarkEnvironment", back_populates="benchmarks")
