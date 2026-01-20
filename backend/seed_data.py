"""
Seed script to populate CodeForge database with test solutions.
Run: docker exec -it codeforge-backend python seed_data.py
"""

import asyncio
import random
import sys
sys.path.insert(0, '/app')

from sqlalchemy import text
from app.database import async_session
from app.services.embeddings import get_embedding


# Realistic developer users (community contributors)
SEED_USERS = [
    {"username": "alexchen", "email": "alex.chen@gmail.com", "score": 1250, "avatar_url": "https://avatars.githubusercontent.com/u/1234567"},
    {"username": "sarah_dev", "email": "sarah.johnson@outlook.com", "score": 980, "avatar_url": "https://avatars.githubusercontent.com/u/2345678"},
    {"username": "rustacean42", "email": "mike.rust@proton.me", "score": 2100, "avatar_url": "https://avatars.githubusercontent.com/u/3456789"},
    {"username": "py_ninja", "email": "ninja.coder@yahoo.com", "score": 1560, "avatar_url": "https://avatars.githubusercontent.com/u/4567890"},
    {"username": "datasmith", "email": "john.smith.data@gmail.com", "score": 890, "avatar_url": "https://avatars.githubusercontent.com/u/5678901"},
    {"username": "algo_master", "email": "algorithms@techmail.dev", "score": 3200, "avatar_url": "https://avatars.githubusercontent.com/u/6789012"},
    {"username": "codewitch", "email": "emma.witch@gmail.com", "score": 1780, "avatar_url": "https://avatars.githubusercontent.com/u/7890123"},
    {"username": "bytehunter", "email": "hunter.bytes@outlook.com", "score": 1120, "avatar_url": "https://avatars.githubusercontent.com/u/8901234"},
]

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
        "author": "alexchen",
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
        "author": "py_ninja",
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
        "author": "sarah_dev",
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
        "author": "datasmith",
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
        "author": "algo_master",
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
        "author": "rustacean42",
    },
]


async def seed_database():
    """Seed the database with test data."""
    async with async_session() as db:
        # Create users
        user_ids = {}
        for user_data in SEED_USERS:
            result = await db.execute(
                text("SELECT id FROM users WHERE username = :username"),
                {"username": user_data["username"]}
            )
            user = result.fetchone()

            if not user:
                await db.execute(
                    text("""
                        INSERT INTO users (username, email, score, avatar_url)
                        VALUES (:username, :email, :score, :avatar_url)
                    """),
                    user_data
                )
                await db.commit()
                result = await db.execute(
                    text("SELECT id FROM users WHERE username = :username"),
                    {"username": user_data["username"]}
                )
                user = result.fetchone()
                print(f"Created user: {user_data['username']}")
            else:
                print(f"User exists: {user_data['username']}")

            user_ids[user_data["username"]] = user[0]

        # Add solutions
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

            # Get author ID
            author_id = user_ids.get(sol.get("author"))
            if not author_id:
                # Pick random user
                author_id = random.choice(list(user_ids.values()))

            # Generate embedding
            print(f"Generating embedding for: {sol['title']}")
            embedding_text = f"{sol['title']} {sol['description']} {sol['code']}"
            embedding = await get_embedding(embedding_text)

            # Random vote count for realism
            vote_count = random.randint(5, 150)

            # Insert solution
            await db.execute(
                text("""
                    INSERT INTO solutions
                    (problem_id, author_id, title, description, code, language,
                     complexity_time, complexity_space, tags, embedding, speedup, vote_count)
                    VALUES
                    (:problem_id, :author_id, :title, :description, :code, :language,
                     :complexity_time, :complexity_space, :tags, :embedding, :speedup, :vote_count)
                """),
                {
                    "problem_id": problem_id,
                    "author_id": author_id,
                    "title": sol["title"],
                    "description": sol["description"],
                    "code": sol["code"],
                    "language": sol["language"],
                    "complexity_time": sol["complexity_time"],
                    "complexity_space": sol["complexity_space"],
                    "tags": sol["tags"],
                    "embedding": str(embedding),
                    "speedup": sol["speedup"],
                    "vote_count": vote_count,
                }
            )
            print(f"Added: {sol['title']} (by {sol.get('author', 'random')})")

        await db.commit()
        print("\nSeeding complete!")

        # Show count
        result = await db.execute(text("SELECT COUNT(*) FROM solutions WHERE embedding IS NOT NULL"))
        count = result.scalar()
        print(f"Total solutions with embeddings: {count}")

        # Show users
        result = await db.execute(text("SELECT username, score FROM users ORDER BY score DESC"))
        users = result.fetchall()
        print(f"\nUsers ({len(users)}):")
        for u in users:
            print(f"  - {u[0]}: {u[1]} points")


if __name__ == "__main__":
    asyncio.run(seed_database())
