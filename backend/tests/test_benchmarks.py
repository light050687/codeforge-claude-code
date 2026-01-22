"""
Tests for benchmarks API endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_get_solution_benchmarks_not_found(client: AsyncClient):
    """Test getting benchmarks for non-existent solution."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/benchmarks/solution/{fake_uuid}")
    # Should return empty list, not 404
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 0


@pytest.mark.anyio
async def test_compare_solutions_invalid_count(client: AsyncClient):
    """Test comparing solutions with invalid count (less than 2)."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.get(f"/api/v1/benchmarks/compare", params={
        "solution_ids": fake_uuid
    })
    assert response.status_code == 400
    assert "Must compare 2 or 3 solutions" in response.json()["detail"]


@pytest.mark.anyio
async def test_compare_solutions_too_many(client: AsyncClient):
    """Test comparing more than 3 solutions."""
    ids = ",".join([
        "00000000-0000-0000-0000-000000000001",
        "00000000-0000-0000-0000-000000000002",
        "00000000-0000-0000-0000-000000000003",
        "00000000-0000-0000-0000-000000000004",
    ])
    response = await client.get(f"/api/v1/benchmarks/compare", params={
        "solution_ids": ids
    })
    assert response.status_code == 400
    assert "Must compare 2 or 3 solutions" in response.json()["detail"]


@pytest.mark.anyio
async def test_run_benchmark_solution_not_found(client: AsyncClient):
    """Test running benchmark for non-existent solution."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.post("/api/v1/benchmarks/run", json={
        "solution_id": fake_uuid,
        "input_sizes": [100, 1000]
    })
    assert response.status_code == 404
    assert "Solution not found" in response.json()["detail"]


@pytest.mark.anyio
async def test_run_benchmark_async_solution_not_found(client: AsyncClient):
    """Test running async benchmark for non-existent solution."""
    fake_uuid = "00000000-0000-0000-0000-000000000000"
    response = await client.post("/api/v1/benchmarks/run/async", json={
        "solution_id": fake_uuid
    })
    assert response.status_code == 404
    assert "Solution not found" in response.json()["detail"]
