from datetime import datetime
import uuid
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from app.database import Base


class Difficulty(str, enum.Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class Category(str, enum.Enum):
    # Core algorithms
    SORTING = "sorting"
    SEARCHING = "searching"
    GRAPHS = "graphs"
    TREES = "trees"
    DYNAMIC_PROGRAMMING = "dp"
    # Data handling
    STRINGS = "strings"
    ARRAYS = "arrays"
    DATA_STRUCTURES = "data_structures"
    # Math & Science
    MATH = "math"
    GEOMETRY = "geometry"
    STATISTICS = "statistics"
    # System & Performance
    IO_OPTIMIZATION = "io"
    MEMORY_MANAGEMENT = "memory"
    CONCURRENCY = "concurrency"
    NETWORKING = "networking"
    # Specialized
    CRYPTOGRAPHY = "crypto"
    MACHINE_LEARNING = "ml"
    IMAGE_PROCESSING = "image"
    DATA_PROCESSING = "data_processing"
    DATETIME = "datetime"
    FINANCE = "finance"
    VALIDATION = "validation"
    PARSING = "parsing"


class OptimizationPattern(str, enum.Enum):
    """Patterns used to achieve optimization"""
    MEMOIZATION = "memoization"
    DYNAMIC_PROGRAMMING = "dp"
    DIVIDE_CONQUER = "divide_conquer"
    EARLY_EXIT = "early_exit"
    BATCHING = "batching"
    LAZY_EVALUATION = "lazy"
    PARALLELIZATION = "parallel"
    VECTORIZATION = "vectorized"
    CACHING = "caching"
    PRECOMPUTATION = "precompute"
    STREAMING = "streaming"
    POOLING = "pooling"
    COMPRESSION = "compression"
    INDEX_OPTIMIZATION = "indexing"


# PostgreSQL ENUM types
difficulty_level = ENUM('easy', 'medium', 'hard', name='difficulty_level', create_type=False)
category_type = ENUM(
    'sorting', 'searching', 'graphs', 'trees', 'dp', 'strings', 'arrays',
    'data_structures', 'math', 'geometry', 'statistics', 'io', 'memory',
    'concurrency', 'networking', 'crypto', 'ml', 'image', 'data_processing',
    'datetime', 'finance', 'validation', 'parsing',
    name='category_type', create_type=False
)
optimization_pattern_type = ENUM(
    'memoization', 'dp', 'divide_conquer', 'early_exit', 'batching',
    'lazy', 'parallel', 'vectorized', 'caching', 'precompute',
    'streaming', 'pooling', 'compression', 'indexing',
    name='optimization_pattern_type', create_type=False
)


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    category: Mapped[str] = mapped_column(category_type, index=True)
    difficulty: Mapped[str] = mapped_column(difficulty_level, index=True)

    # Baseline code for speedup comparison
    baseline_code: Mapped[str] = mapped_column(Text)
    baseline_language: Mapped[str] = mapped_column(String(50))
    baseline_complexity_time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    baseline_complexity_space: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Test cases (JSON)
    test_cases: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    solutions = relationship("Solution", back_populates="problem")
