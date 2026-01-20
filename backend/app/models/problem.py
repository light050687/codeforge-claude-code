from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, Enum, func
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
    IO_OPTIMIZATION = "io_optimization"
    MEMORY_MANAGEMENT = "memory_management"
    CRYPTOGRAPHY = "cryptography"
    MACHINE_LEARNING = "machine_learning"


class Problem(Base):
    __tablename__ = "problems"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), index=True)
    slug: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text)

    category: Mapped[Category] = mapped_column(Enum(Category), index=True)
    difficulty: Mapped[Difficulty] = mapped_column(Enum(Difficulty), index=True)

    # Baseline code for speedup comparison
    baseline_code: Mapped[str] = mapped_column(Text)
    baseline_language: Mapped[str] = mapped_column(String(50))
    baseline_time_ms: Mapped[float | None] = mapped_column(nullable=True)

    # Test cases (JSON)
    test_cases: Mapped[str | None] = mapped_column(Text, nullable=True)

    solutions_count: Mapped[int] = mapped_column(Integer, default=0)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    solutions = relationship("Solution", back_populates="problem")
