from datetime import datetime
import uuid
from sqlalchemy import String, Integer, Text, Float, DateTime, ForeignKey, Boolean, func, ARRAY
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

    # Complexity
    complexity_time: Mapped[str | None] = mapped_column(String(50), nullable=True)
    complexity_space: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Tags
    tags = mapped_column(ARRAY(Text), default=[])

    # Embedding for semantic search
    embedding = mapped_column(Vector(settings.embedding_dim), nullable=True)
    search_vector = mapped_column(TSVECTOR, nullable=True)

    # Verification and votes
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    vote_count: Mapped[int] = mapped_column(Integer, default=0)

    # Performance
    speedup: Mapped[float | None] = mapped_column(Float, nullable=True, index=True)

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
