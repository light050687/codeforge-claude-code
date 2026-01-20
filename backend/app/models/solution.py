from datetime import datetime
import uuid
import enum
from sqlalchemy import String, Integer, Text, Float, DateTime, ForeignKey, Boolean, func, ARRAY, JSON
from sqlalchemy.dialects.postgresql import UUID, ENUM, TSVECTOR
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector

from app.database import Base
from app.config import get_settings

settings = get_settings()

# PostgreSQL ENUM type
language_type = ENUM(
    'python', 'javascript', 'typescript', 'go', 'rust',
    'cpp', 'c', 'java', 'csharp', 'ruby', 'php',
    'swift', 'kotlin', 'scala', 'haskell', 'lua',
    name='language_type', create_type=False
)


class SolutionBadge(str, enum.Enum):
    """Badges awarded to solutions based on their characteristics"""
    FASTEST = "fastest"              # Best execution time
    MEMORY_EFFICIENT = "memory"      # Best memory usage
    BALANCED = "balanced"            # Best time/memory trade-off
    MOST_READABLE = "readable"       # Best readability score
    ZERO_DEPS = "zero_deps"          # No external dependencies
    PARALLELIZABLE = "parallel"      # Can be parallelized
    PRODUCTION_READY = "production"  # Tested, secure, documented
    ELEGANT = "elegant"              # Community voted for elegance


badge_type = ENUM(
    'fastest', 'memory', 'balanced', 'readable', 'zero_deps',
    'parallel', 'production', 'elegant',
    name='badge_type', create_type=False
)


class Solution(Base):
    __tablename__ = "solutions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )

    # Foreign keys
    problem_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("problems.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), index=True, nullable=True
    )

    # Code
    title: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    code: Mapped[str] = mapped_column(Text)
    language: Mapped[str] = mapped_column(language_type, index=True)

    # Complexity (theoretical)
    complexity_time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    complexity_space: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Tags and optimization patterns used
    tags = mapped_column(ARRAY(Text), default=[])
    optimization_patterns = mapped_column(ARRAY(Text), default=[])  # e.g., ['memoization', 'early_exit']

    # Embedding for semantic search
    embedding = mapped_column(Vector(settings.embedding_dim), nullable=True)
    search_vector = mapped_column(TSVECTOR, nullable=True)

    # Verification and votes
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    vote_count: Mapped[int] = mapped_column(Integer, default=0)

    # === PERFORMANCE METRICS ===
    # Speed metrics
    speedup: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)
    avg_execution_time_ms: Mapped[float | None] = mapped_column(Float, nullable=True)

    # Memory metrics
    memory_reduction: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)  # e.g., 2.5x less memory
    avg_memory_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    peak_memory_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Combined score (0-100, balances speed and memory)
    efficiency_score: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)

    # === CODE QUALITY METRICS ===
    # Readability (0-100)
    readability_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    lines_of_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    cyclomatic_complexity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Dependencies
    dependencies = mapped_column(ARRAY(Text), default=[])  # External libs required
    has_external_deps: Mapped[bool] = mapped_column(Boolean, default=False)

    # === BADGES ===
    # Awarded badges based on metrics comparison within problem
    badges = mapped_column(ARRAY(Text), default=[])  # ['fastest', 'memory', 'balanced']

    # === BENCHMARK ENVIRONMENT ===
    # Last benchmark info
    last_benchmark_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    benchmark_environment = mapped_column(JSON, nullable=True)  # {"python": "3.11", "cpu": "...", "os": "..."}

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
