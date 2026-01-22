"""
Tests for problems API endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_list_problems(client: AsyncClient):
    """Test listing problems."""
    response = await client.get("/api/v1/problems/")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.anyio
async def test_list_problems_with_filters(client: AsyncClient):
    """Test listing problems with filters."""
    # Test category filter
    response = await client.get("/api/v1/problems/", params={"category": "sorting"})
    assert response.status_code == 200

    # Test difficulty filter
    response = await client.get("/api/v1/problems/", params={"difficulty": "easy"})
    assert response.status_code == 200


@pytest.mark.anyio
async def test_get_problem_not_found(client: AsyncClient):
    """Test getting a non-existent problem by slug."""
    response = await client.get("/api/v1/problems/non-existent-slug-12345")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_get_categories(client: AsyncClient):
    """Test getting list of categories."""
    response = await client.get("/api/v1/problems/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.anyio
async def test_get_difficulties(client: AsyncClient):
    """Test getting list of difficulties."""
    response = await client.get("/api/v1/problems/difficulties")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
