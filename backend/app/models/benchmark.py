from datetime import datetime
import uuid
from sqlalchemy import String, Integer, Float, BigInteger, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    solution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("solutions.id", ondelete="CASCADE"), index=True
    )

    # Hardware profile
    hardware_profile: Mapped[str] = mapped_column(String(50), default="standard")

    # Input size
    input_size: Mapped[int] = mapped_column(Integer)

    # Metrics
    execution_time_ms: Mapped[float] = mapped_column(Float)
    memory_bytes: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    runs_count: Mapped[int] = mapped_column(Integer, default=10)
    baseline_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    solution = relationship("Solution", back_populates="benchmarks")
