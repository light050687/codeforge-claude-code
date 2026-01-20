"""Authentication router with GitHub OAuth support."""

import logging
from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config import get_settings
from app.database import get_db
from app.models.user import User
from app.utils.jwt import create_access_token, get_current_user
from app.utils.github import exchange_code_for_token, get_github_user, GitHubOAuthError

logger = logging.getLogger(__name__)
router = APIRouter()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GithubAuthUrl(BaseModel):
    url: str


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    avatar_url: str | None
    score: int
    solutions_count: int

    class Config:
        from_attributes = True


@router.get("/github", response_model=GithubAuthUrl)
async def github_auth():
    """Get GitHub OAuth authorization URL."""
    settings = get_settings()

    if not settings.github_client_id:
        raise HTTPException(status_code=500, detail="GitHub OAuth not configured")

    url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={settings.github_client_id}"
        f"&redirect_uri={settings.github_redirect_uri}"
        f"&scope=read:user user:email"
    )
    return {"url": url}


@router.get("/github/callback")
async def github_callback(
    code: str = Query(..., description="Authorization code from GitHub"),
    db: AsyncSession = Depends(get_db),
):
    """
    Handle GitHub OAuth callback.

    1. Exchange code for access token
    2. Get user info from GitHub API
    3. Create or update user in database
    4. Generate JWT token
    5. Redirect to frontend with token
    """
    settings = get_settings()

    try:
        # Exchange code for GitHub access token
        github_token = await exchange_code_for_token(code)

        # Get user info from GitHub
        github_user = await get_github_user(github_token)

        # Find or create user in database
        result = await db.execute(
            select(User).where(
                User.oauth_provider == "github",
                User.oauth_id == str(github_user.id)
            )
        )
        user = result.scalar_one_or_none()

        if user is None:
            # Check if username already exists
            result = await db.execute(
                select(User).where(User.username == github_user.login)
            )
            existing_user = result.scalar_one_or_none()

            if existing_user:
                # Username taken, append GitHub ID
                username = f"{github_user.login}_{github_user.id}"
            else:
                username = github_user.login

            # Create new user
            user = User(
                username=username,
                email=github_user.email or f"{github_user.login}@github.local",
                avatar_url=github_user.avatar_url,
                oauth_provider="github",
                oauth_id=str(github_user.id),
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            logger.info(f"Created new user: {user.username}")
        else:
            # Update existing user info
            user.avatar_url = github_user.avatar_url
            if github_user.email:
                user.email = github_user.email
            await db.commit()
            logger.info(f"Updated existing user: {user.username}")

        # Generate JWT token
        access_token = create_access_token(data={"sub": str(user.id)})

        # Redirect to frontend with token
        # Frontend will extract token from URL and store it
        frontend_url = settings.cors_origins[0] if settings.cors_origins else "http://localhost:5173"
        redirect_url = f"{frontend_url}/auth/callback?token={access_token}"

        return RedirectResponse(url=redirect_url)

    except GitHubOAuthError as e:
        logger.error(f"GitHub OAuth error: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in GitHub callback: {e}")
        raise HTTPException(status_code=500, detail="Authentication failed")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    """Get current authenticated user."""
    return UserResponse(
        id=str(current_user.id),
        username=current_user.username,
        email=current_user.email,
        avatar_url=current_user.avatar_url,
        score=current_user.score,
        solutions_count=current_user.solutions_count,
    )


@router.post("/logout")
async def logout():
    """
    Logout endpoint.
    JWT tokens are stateless, so actual logout happens client-side.
    This endpoint is provided for API completeness.
    """
    return {"message": "Logged out successfully"}
