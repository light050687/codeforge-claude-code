from datetime import datetime
from sqlalchemy import Integer, DateTime, ForeignKey, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Vote(Base):
    __tablename__ = "votes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    solution_id: Mapped[int] = mapped_column(ForeignKey("solutions.id"), index=True)
    value: Mapped[int] = mapped_column(Integer)  # 1 or -1

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="votes")
    solution = relationship("Solution", back_populates="votes")

    __table_args__ = (
        UniqueConstraint("user_id", "solution_id", name="uq_user_solution_vote"),
    )
