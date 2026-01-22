"""
Tests for solutions API endpoints.
"""
import pytest
from httpx import AsyncClient

from tests.conftest import generate_sample_problem_data, generate_sample_solution_data


@pytest.mark.anyio
async def test_list_solutions(client: AsyncClient):
    """Test listing solutions."""
    response = await client.get("/api/v1/solutions/")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert "size" in data


@pytest.mark.anyio
async def test_list_solutions_with_filters(client: AsyncClient):
    """Test listing solutions with various filters."""
    # Test language filter
    response = await client.get("/api/v1/solutions/", params={"language": "python"})
    assert response.status_code == 200

    # Test sort options
    for sort_by in ["votes", "speedup", "memory", "efficiency", "recent"]:
        response = await client.get("/api/v1/solutions/", params={"sort_by": sort_by})
        assert response.status_code == 200


@pytest.mark.anyio
async def test_get_solution_not_found(client: AsyncClient):
    """Test getting a non-existent solution."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/solutions/{fake_uuid}")
    assert response.status_code == 404


@pytest.mark.anyio
async def test_get_category_stats(client: AsyncClient):
    """Test getting category statistics."""
    response = await client.get("/api/v1/solutions/stats/by-category")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.anyio
async def test_create_solution_problem_not_found(client: AsyncClient):
    """Test creating solution with non-existent problem."""
    fake_problem_id = "00000000-0000-0000-0000-000000000000"
    solution_data = generate_sample_solution_data(fake_problem_id)

    response = await client.post("/api/v1/solutions/", json=solution_data)
    assert response.status_code == 404
    assert "Problem not found" in response.json()["detail"]


@pytest.mark.anyio
async def test_vote_solution_not_found(client: AsyncClient):
    """Test voting on non-existent solution."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.post(f"/api/v1/solutions/{fake_uuid}/vote", params={"value": 1})
    assert response.status_code == 404
