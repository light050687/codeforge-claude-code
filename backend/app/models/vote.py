from datetime import datetime
import uuid
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint, CheckConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    solution_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("solutions.id", ondelete="CASCADE"), index=True
    )
    value: Mapped[int] = mapped_column(Integer)  # 1 or -1

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="votes")
    solution = relationship("Solution", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("user_id", "solution_id", name="uq_user_solution_vote"),
        CheckConstraint("value IN (-1, 1)", name="chk_vote_value"),
    )
