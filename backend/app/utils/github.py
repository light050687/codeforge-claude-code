"""GitHub OAuth and API integration."""

import httpx
from pydantic import BaseModel

from app.config import get_settings


class GitHubUser(BaseModel):
    """GitHub user profile data."""
    id: int
    login: str
    email: str | None
    avatar_url: str | None
    name: str | None


class GitHubOAuthError(Exception):
    """Exception for GitHub OAuth errors."""
    pass


async def exchange_code_for_token(code: str) -> str:
    """
    Exchange OAuth authorization code for access token.

    Args:
        code: The authorization code from GitHub callback

    Returns:
        GitHub access token

    Raises:
        GitHubOAuthError: If token exchange fails
    """
    settings = get_settings()

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                "redirect_uri": settings.github_redirect_uri,
            },
            headers={"Accept": "application/json"},
        )

        if response.status_code != 200:
            raise GitHubOAuthError(f"Failed to exchange code: {response.text}")

        data = response.json()

        if "error" in data:
            raise GitHubOAuthError(f"GitHub OAuth error: {data.get('error_description', data['error'])}")

        access_token = data.get("access_token")
        if not access_token:
            raise GitHubOAuthError("No access token in response")

        return access_token


async def get_github_user(access_token: str) -> GitHubUser:
    """
    Fetch user profile from GitHub API.

    Args:
        access_token: GitHub OAuth access token

    Returns:
        GitHubUser with profile data

    Raises:
        GitHubOAuthError: If API call fails
    """
    async with httpx.AsyncClient() as client:
        # Get user profile
        response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )

        if response.status_code != 200:
            raise GitHubOAuthError(f"Failed to get user: {response.text}")

        user_data = response.json()

        # If email is private, fetch from emails endpoint
        email = user_data.get("email")
        if not email:
            email_response = await client.get(
                "https://api.github.com/user/emails",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/vnd.github+json",
                },
            )

            if email_response.status_code == 200:
                emails = email_response.json()
                # Get primary email
                for e in emails:
                    if e.get("primary"):
                        email = e.get("email")
                        break
                # Fallback to first verified email
                if not email:
                    for e in emails:
                        if e.get("verified"):
                            email = e.get("email")
                            break

        return GitHubUser(
            id=user_data["id"],
            login=user_data["login"],
            email=email,
            avatar_url=user_data.get("avatar_url"),
            name=user_data.get("name"),
        )
