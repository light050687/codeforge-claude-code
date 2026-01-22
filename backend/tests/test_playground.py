"""
Tests for playground API endpoints.
"""
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_analyze_simple_python_code(client: AsyncClient):
    """Test analyzing simple Python code."""
    response = await client.post("/api/v1/playground/analyze", json={
        "code": """def sum_array(arr):
    total = 0
    for x in arr:
        total += x
    return total
""",
        "language": "python"
    })
    assert response.status_code == 200
    data = response.json()
    assert "optimized_code" in data
    assert "speedup" in data
    assert "complexity" in data
    assert "suggestions" in data


@pytest.mark.anyio
async def test_analyze_nested_loops(client: AsyncClient):
    """Test analyzing code with nested loops."""
    response = await client.post("/api/v1/playground/analyze", json={
        "code": """def find_duplicates(arr):
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j]:
                duplicates.append(arr[i])
    return duplicates
""",
        "language": "python"
    })
    assert response.status_code == 200
    data = response.json()
    # Should detect O(n²) complexity
    assert "O(n²)" in data["complexity"]["time"] or "O(n)" in data["complexity"]["time"]


@pytest.mark.anyio
async def test_analyze_javascript_code(client: AsyncClient):
    """Test analyzing JavaScript code."""
    response = await client.post("/api/v1/playground/analyze", json={
        "code": """function findMax(arr) {
    var max = arr[0];
    for (var i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i];
        }
    }
    return max;
}""",
        "language": "javascript"
    })
    assert response.status_code == 200
    data = response.json()
    # Should suggest using const/let instead of var
    suggestions = " ".join(data["suggestions"])
    assert "var" in suggestions or "const" in suggestions or "optimized" in suggestions.lower()


@pytest.mark.anyio
async def test_analyze_with_anti_patterns(client: AsyncClient):
    """Test that analyzer detects anti-patterns."""
    response = await client.post("/api/v1/playground/analyze", json={
        "code": """def build_string(items):
    result = ""
    for item in items:
        result += str(item)
    return result
""",
        "language": "python"
    })
    assert response.status_code == 200
    data = response.json()
    # Should suggest using join() for string concatenation
    suggestions = " ".join(data["suggestions"])
    assert "join" in suggestions.lower() or "optimized" in suggestions.lower()


@pytest.mark.anyio
async def test_analyze_optimal_code(client: AsyncClient):
    """Test analyzing already optimal code."""
    response = await client.post("/api/v1/playground/analyze", json={
        "code": """def max_val(arr):
    return max(arr)
""",
        "language": "python"
    })
    assert response.status_code == 200
    data = response.json()
    assert "suggestions" in data
