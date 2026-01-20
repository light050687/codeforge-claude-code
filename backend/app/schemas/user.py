from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, field_serializer


class UserBase(BaseModel):
    username: str
    email: str | None = None
    avatar_url: str | None = None


class UserCreate(UserBase):
    oauth_provider: str | None = None
    oauth_id: str | None = None


class UserUpdate(BaseModel):
    email: str | None = None
    avatar_url: str | None = None


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    score: int
    solutions_count: int
    created_at: datetime

    @field_serializer('id')
    def serialize_id(self, v: UUID) -> str:
        return str(v)
