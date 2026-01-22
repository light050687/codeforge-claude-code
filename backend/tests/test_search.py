"""
Tests for search API endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_search_basic(client: AsyncClient):
    """Test basic semantic search."""
    response = await client.post("/api/v1/search/", json={
        "query": "sort array",
        "limit": 10
    })
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "query" in data


@pytest.mark.anyio
async def test_search_with_filters(client: AsyncClient):
    """Test search with language and category filters."""
    response = await client.post("/api/v1/search/", json={
        "query": "fast sorting algorithm",
        "language": "python",
        "category": "sorting",
        "limit": 5
    })
    assert response.status_code == 200
    data = response.json()
    assert "items" in data


@pytest.mark.anyio
async def test_search_with_sort_options(client: AsyncClient):
    """Test search with different sort options."""
    for sort_option in ["relevance", "speedup", "votes", "recent"]:
        response = await client.post("/api/v1/search/", json={
            "query": "array sorting",
            "sort": sort_option,
            "limit": 5
        })
        assert response.status_code == 200


@pytest.mark.anyio
async def test_search_with_min_speedup(client: AsyncClient):
    """Test search filtering by minimum speedup."""
    response = await client.post("/api/v1/search/", json={
        "query": "optimization",
        "min_speedup": 2.0,
        "limit": 10
    })
    assert response.status_code == 200


@pytest.mark.anyio
async def test_search_suggestions(client: AsyncClient):
    """Test search suggestions endpoint."""
    response = await client.get("/api/v1/search/suggestions", params={"q": "sort"})
    assert response.status_code == 200
    data = response.json()
    assert "problems" in data
    assert "solutions" in data


@pytest.mark.anyio
async def test_search_by_category(client: AsyncClient):
    """Test search by category endpoint."""
    response = await client.get("/api/v1/search/by-category", params={
        "category": "sorting",
        "limit": 10
    })
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data


@pytest.mark.anyio
async def test_search_by_category_with_language(client: AsyncClient):
    """Test search by category with language filter."""
    response = await client.get("/api/v1/search/by-category", params={
        "category": "sorting",
        "language": "python",
        "sort": "speedup"
    })
    assert response.status_code == 200
