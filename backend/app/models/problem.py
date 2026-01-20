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
    SORTING = "sorting"
    SEARCHING = "searching"
    GRAPHS = "graphs"
    STRINGS = "strings"
    MATH = "math"
    DATA_STRUCTURES = "data_structures"
    IO_OPTIMIZATION = "io"
    MEMORY_MANAGEMENT = "memory"
    CRYPTOGRAPHY = "crypto"
    MACHINE_LEARNING = "ml"


# PostgreSQL ENUM types
difficulty_level = ENUM('easy', 'medium', 'hard', name='difficulty_level', create_type=False)
category_type = ENUM(
    'sorting', 'searching', 'graphs', 'strings', 'math',
    'data_structures', 'io', 'memory', 'crypto', 'ml',
    name='category_type', create_type=False
)


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(String(255), index=True)
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
