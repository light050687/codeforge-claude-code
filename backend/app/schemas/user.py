from datetime import datetime
from pydantic import BaseModel


class UserBase(BaseModel):
    username: str
    email: str | None = None
    avatar_url: str | None = None


class UserCreate(UserBase):
    github_id: int


class UserUpdate(BaseModel):
    email: str | None = None
    avatar_url: str | None = None


class UserResponse(UserBase):
    id: int
    github_id: int
    score: int
    solutions_count: int
    created_at: datetime

    class Config:
        from_attributes = True
