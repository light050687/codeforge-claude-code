from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

router = APIRouter()


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class GithubAuthUrl(BaseModel):
    url: str


@router.get("/github", response_model=GithubAuthUrl)
async def github_auth():
    """Get GitHub OAuth authorization URL."""
    from app.config import get_settings
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
async def github_callback(code: str):
    """Handle GitHub OAuth callback."""
    # TODO: Implement GitHub OAuth callback
    # 1. Exchange code for access token
    # 2. Get user info from GitHub API
    # 3. Create or update user in database
    # 4. Generate JWT token
    return {"message": "GitHub callback - implement me"}


@router.get("/me")
async def get_current_user():
    """Get current authenticated user."""
    # TODO: Implement JWT validation
    return {"message": "Get current user - implement me"}
