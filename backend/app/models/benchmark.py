from datetime import datetime
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Benchmark(Base):
    __tablename__ = "benchmarks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    solution_id: Mapped[int] = mapped_column(ForeignKey("solutions.id"), index=True)

    # Input size
    input_size: Mapped[str] = mapped_column(String(50))  # e.g., "1000", "10000", "100000"

    # Metrics
    execution_time_ms: Mapped[float] = mapped_column(Float)
    memory_mb: Mapped[float] = mapped_column(Float)
    iterations: Mapped[int] = mapped_column(Integer, default=10)

    # Hardware info
    cpu_info: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    solution = relationship("Solution", back_populates="benchmarks")
