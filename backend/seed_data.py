"""
Seed script to populate CodeForge database with demo solutions.
Run: docker exec -it codeforge-backend python seed_data.py

Note: In production, all users are created via GitHub OAuth.
These solutions are demo/community contributions without specific authors.
"""

import asyncio
import sys
sys.path.insert(0, '/app')

from sqlalchemy import text
from app.database import async_session
from app.services.embeddings import get_embedding


# Demo solutions - no author (community contributions)
# In production, users submit via GitHub OAuth
SEED_SOLUTIONS = [
    {
        "problem_title": "Find Duplicate Elements",
        "title": "Hash-based Duplicate Detection",
        "description": "Use a set for O(n) duplicate detection instead of nested loops",
        "code": '''def find_duplicates(arr):
    """Find duplicates using set - O(n) time, O(n) space"""
    seen = set()
    duplicates = set()
    for item in arr:
        if item in seen:
            duplicates.add(item)
        seen.add(item)
    return list(duplicates)''',
        "language": "python",
        "complexity_time": "O(n)",
        "complexity_space": "O(n)",
        "tags": ["hash", "set", "optimization"],
        "speedup": 147.0,
    },
    {
        "problem_title": "Find Duplicate Elements",
        "title": "Counter-based Duplicate Detection",
        "description": "Use collections.Counter for elegant duplicate detection",
        "code": '''from collections import Counter

def find_duplicates(arr):
    """Find duplicates using Counter - O(n) time"""
    counts = Counter(arr)
    return [item for item, count in counts.items() if count > 1]''',
        "language": "python",
        "complexity_time": "O(n)",
        "complexity_space": "O(n)",
        "tags": ["counter", "collections", "pythonic"],
        "speedup": 125.0,
    },
    {
        "problem_title": "Sort Large Array",
        "title": "TimSort (Built-in)",
        "description": "Python's built-in sort uses TimSort - O(n log n)",
        "code": '''def fast_sort(arr):
    """Use Python's built-in TimSort - O(n log n)"""
    return sorted(arr)''',
        "language": "python",
        "complexity_time": "O(n log n)",
        "complexity_space": "O(n)",
        "tags": ["timsort", "builtin", "sorting"],
        "speedup": 234.0,
    },
    {
        "problem_title": "Sort Large Array",
        "title": "NumPy Vectorized Sort",
        "description": "Use NumPy for extremely fast array sorting",
        "code": '''import numpy as np

def numpy_sort(arr):
    """NumPy's optimized quicksort - O(n log n) with C performance"""
    return np.sort(arr).tolist()''',
        "language": "python",
        "complexity_time": "O(n log n)",
        "complexity_space": "O(n)",
        "tags": ["numpy", "vectorized", "sorting"],
        "speedup": 567.0,
    },
    {
        "problem_title": "Find Shortest Path",
        "title": "Dijkstra with Heap",
        "description": "Dijkstra's algorithm with min-heap for weighted graphs",
        "code": '''import heapq

def dijkstra(graph, start, end):
    """Dijkstra's shortest path - O((V + E) log V)"""
    distances = {start: 0}
    heap = [(0, start, [start])]
    visited = set()

    while heap:
        dist, node, path = heapq.heappop(heap)

        if node == end:
            return path, dist

        if node in visited:
            continue
        visited.add(node)

        for neighbor, weight in graph.get(node, []):
            new_dist = dist + weight
            if neighbor not in distances or new_dist < distances[neighbor]:
                distances[neighbor] = new_dist
                heapq.heappush(heap, (new_dist, neighbor, path + [neighbor]))

    return None, float('inf')''',
        "language": "python",
        "complexity_time": "O((V+E) log V)",
        "complexity_space": "O(V)",
        "tags": ["dijkstra", "heap", "graphs", "shortest-path"],
        "speedup": 45.0,
    },
    {
        "problem_title": "Sort Large Array",
        "title": "Quicksort Implementation",
        "description": "Classic quicksort with random pivot for average O(n log n)",
        "code": '''import random

def quicksort(arr):
    """Quicksort with random pivot - O(n log n) average"""
    if len(arr) <= 1:
        return arr

    pivot = random.choice(arr)
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]

    return quicksort(left) + middle + quicksort(right)''',
        "language": "python",
        "complexity_time": "O(n log n)",
        "complexity_space": "O(log n)",
        "tags": ["quicksort", "divide-conquer", "sorting"],
        "speedup": 180.0,
    },
]


async def seed_database():
    """Seed the database with demo solutions (no authors - community contributions)."""
    async with async_session() as db:
        # Add solutions without authors (community contributions)
        for sol in SEED_SOLUTIONS:
            # Get problem ID
            result = await db.execute(
                text("SELECT id FROM problems WHERE title = :title"),
                {"title": sol["problem_title"]}
            )
            problem = result.fetchone()

            if not problem:
                print(f"Problem not found: {sol['problem_title']}")
                continue

            problem_id = problem[0]

            # Check if solution exists
            result = await db.execute(
                text("SELECT id FROM solutions WHERE title = :title AND problem_id = :problem_id"),
                {"title": sol["title"], "problem_id": problem_id}
            )
            existing = result.fetchone()

            if existing:
                print(f"Solution already exists: {sol['title']}")
                continue

            # Generate embedding
            print(f"Generating embedding for: {sol['title']}")
            embedding_text = f"{sol['title']} {sol['description']} {sol['code']}"
            embedding = await get_embedding(embedding_text)

            # Insert solution without author (NULL author_id = community contribution)
            await db.execute(
                text("""
                    INSERT INTO solutions
                    (problem_id, author_id, title, description, code, language,
                     complexity_time, complexity_space, tags, embedding, speedup, vote_count)
                    VALUES
                    (:problem_id, NULL, :title, :description, :code, :language,
                     :complexity_time, :complexity_space, :tags, :embedding, :speedup, 0)
                """),
                {
                    "problem_id": problem_id,
                    "title": sol["title"],
                    "description": sol["description"],
                    "code": sol["code"],
                    "language": sol["language"],
                    "complexity_time": sol["complexity_time"],
                    "complexity_space": sol["complexity_space"],
                    "tags": sol["tags"],
                    "embedding": str(embedding),
                    "speedup": sol["speedup"],
                }
            )
            print(f"Added: {sol['title']} (community contribution)")

        await db.commit()
        print("\nSeeding complete!")

        # Show count
        result = await db.execute(text("SELECT COUNT(*) FROM solutions WHERE embedding IS NOT NULL"))
        count = result.scalar()
        print(f"Total solutions with embeddings: {count}")


if __name__ == "__main__":
    asyncio.run(seed_database())
