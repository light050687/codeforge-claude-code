"""
Pytest configuration and fixtures for CodeForge backend tests.
"""
import pytest
import asyncio
from uuid import uuid4
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import app
from app.database import Base, get_db
from app.config import get_settings

settings = get_settings()


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests."""
    policy = asyncio.get_event_loop_policy()
    loop = policy.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    """Create test client without database override (uses real DB)."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


# Sample data generators for tests
def generate_sample_problem_data():
    """Generate sample problem data for testing."""
    unique_id = str(uuid4())[:8]
    return {
        "title": f"Test Problem {unique_id}",
        "slug": f"test-problem-{unique_id}",
        "description": "A test problem for unit testing",
        "category": "sorting",
        "difficulty": "easy",
        "baseline_code": """def baseline_sort(arr):
    return sorted(arr)
""",
        "baseline_language": "python",
    }


def generate_sample_solution_data(problem_id: str):
    """Generate sample solution data for testing."""
    unique_id = str(uuid4())[:8]
    return {
        "problem_id": problem_id,
        "title": f"Test Solution {unique_id}",
        "description": "A test solution for unit testing",
        "code": f"""def optimized_sort_{unique_id}(arr):
    # Quick sort implementation
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return optimized_sort_{unique_id}(left) + middle + optimized_sort_{unique_id}(right)
""",
        "language": "python",
        "complexity_time": "O(n log n)",
        "complexity_space": "O(n)",
    }
