from datetime import datetime
from sqlalchemy import String, Integer, Text, Float, DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.database import Base
from app.config import get_settings

settings = get_settings()


class Solution(Base):
    __tablename__ = "solutions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)

    # Foreign keys
    problem_id: Mapped[int] = mapped_column(ForeignKey("problems.id"), index=True)
    author_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)

    # Code
    title: Mapped[str] = mapped_column(String(255))
    code: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(String(50), index=True)

    # Complexity
    time_complexity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    space_complexity: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Performance
    speedup: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)
    execution_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)
    memory_mb: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Embedding for semantic search
    embedding = mapped_column(Vector(settings.embedding_dim), nullable=True)

    # Votes
    votes_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    problem = relationship("Problem", back_populates="solutions")
    author = relationship("User", back_populates="solutions")
    benchmarks = relationship("Benchmark", back_populates="solution")
    votes = relationship("Vote", back_populates="solution")
