"""
Tests for users API endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_list_users(client: AsyncClient):
    """Test listing users."""
    response = await client.get("/api/v1/users/")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.anyio
async def test_get_leaderboard(client: AsyncClient):
    """Test getting user leaderboard."""
    response = await client.get("/api/v1/users/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.anyio
async def test_get_leaderboard_with_params(client: AsyncClient):
    """Test leaderboard with different parameters."""
    response = await client.get("/api/v1/users/leaderboard", params={
        "limit": 5,
        "sort_by": "solutions_count"
    })
    assert response.status_code == 200


@pytest.mark.anyio
async def test_get_user_not_found(client: AsyncClient):
    """Test getting a non-existent user."""
    response = await client.get("/api/v1/users/nonexistent-user-12345")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_get_current_user_unauthorized(client: AsyncClient):
    """Test getting current user without authentication."""
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401


@pytest.mark.anyio
async def test_update_current_user_unauthorized(client: AsyncClient):
    """Test updating current user without authentication."""
    response = await client.patch("/api/v1/users/me", json={"email": "test@example.com"})
    assert response.status_code == 401


@pytest.mark.anyio
async def test_get_current_user_stats_unauthorized(client: AsyncClient):
    """Test getting current user stats without authentication."""
    response = await client.get("/api/v1/users/me/stats")
    assert response.status_code == 401
