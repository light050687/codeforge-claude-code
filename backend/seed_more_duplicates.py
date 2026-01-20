"""
Additional duplicate detection solutions for CodeForge.
Run: docker exec codeforge-backend python seed_more_duplicates.py
"""

import asyncio
import sys
sys.path.insert(0, '/app')

from sqlalchemy import text
from app.database import async_session
from app.services.embeddings import get_embedding


MORE_SOLUTIONS = [
    {
        "problem_title": "Find Duplicate Elements",
        "title": "List Comprehension with Count",
        "description": "One-liner using list comprehension and count method",
        "code": '''def find_duplicates(arr):
    """One-liner duplicate detection - O(n²) but elegant"""
    return list(set(x for x in arr if arr.count(x) > 1))''',
        "language": "python",
        "complexity_time": "O(n²)",
        "complexity_space": "O(n)",
        "tags": ["one-liner", "comprehension", "simple"],
        "speedup": 1.2,  # Slower than baseline but more readable
    },
    {
        "problem_title": "Find Duplicate Elements",
        "title": "Pandas Value Counts",
        "description": "Use pandas for large dataset duplicate detection with statistics",
        "code": '''import pandas as pd

def find_duplicates(arr):
    """Pandas-based duplicate detection - great for data analysis"""
    series = pd.Series(arr)
    counts = series.value_counts()
    return counts[counts > 1].index.tolist()''',
        "language": "python",
        "complexity_time": "O(n)",
        "complexity_space": "O(n)",
        "tags": ["pandas", "data-science", "analytics"],
        "speedup": 89.0,
    },
    {
        "problem_title": "Find Duplicate Elements",
        "title": "NumPy Unique with Counts",
        "description": "NumPy vectorized duplicate detection - fastest for numeric arrays",
        "code": '''import numpy as np

def find_duplicates(arr):
    """NumPy vectorized duplicate detection - O(n log n)"""
    arr = np.array(arr)
    unique, counts = np.unique(arr, return_counts=True)
    return unique[counts > 1].tolist()''',
        "language": "python",
        "complexity_time": "O(n log n)",
        "complexity_space": "O(n)",
        "tags": ["numpy", "vectorized", "numeric"],
        "speedup": 312.0,
    },
    {
        "problem_title": "Find Duplicate Elements",
        "title": "Sorting-based Detection",
        "description": "Sort first, then find adjacent duplicates - memory efficient",
        "code": '''def find_duplicates(arr):
    """Sort-based duplicate detection - O(n log n) time, O(1) extra space"""
    if not arr:
        return []

    sorted_arr = sorted(arr)
    duplicates = []

    for i in range(1, len(sorted_arr)):
        if sorted_arr[i] == sorted_arr[i-1]:
            if not duplicates or duplicates[-1] != sorted_arr[i]:
                duplicates.append(sorted_arr[i])

    return duplicates''',
        "language": "python",
        "complexity_time": "O(n log n)",
        "complexity_space": "O(1)",
        "tags": ["sorting", "memory-efficient", "in-place"],
        "speedup": 98.0,
    },
    {
        "problem_title": "Find Duplicate Elements",
        "title": "DefaultDict Grouping",
        "description": "Group elements by value using defaultdict",
        "code": '''from collections import defaultdict

def find_duplicates(arr):
    """DefaultDict grouping - O(n) with element positions"""
    groups = defaultdict(list)
    for i, item in enumerate(arr):
        groups[item].append(i)
    return [k for k, v in groups.items() if len(v) > 1]''',
        "language": "python",
        "complexity_time": "O(n)",
        "complexity_space": "O(n)",
        "tags": ["defaultdict", "grouping", "positions"],
        "speedup": 138.0,
    },
    {
        "problem_title": "Find Duplicate Elements",
        "title": "Bitwise XOR Detection",
        "description": "Find single duplicate in array where all others appear once",
        "code": '''def find_single_duplicate(arr):
    """XOR-based single duplicate detection - O(n) time, O(1) space
    Works when exactly one element is duplicated once"""
    n = len(arr) - 1
    xor_all = 0
    xor_range = 0

    for num in arr:
        xor_all ^= num
    for i in range(1, n + 1):
        xor_range ^= i

    return xor_all ^ xor_range''',
        "language": "python",
        "complexity_time": "O(n)",
        "complexity_space": "O(1)",
        "tags": ["bitwise", "xor", "constant-space", "single-duplicate"],
        "speedup": 203.0,
    },
    {
        "problem_title": "Find Duplicate Elements",
        "title": "Floyd's Cycle Detection",
        "description": "Find duplicate using tortoise and hare algorithm - O(1) space",
        "code": '''def find_duplicate_floyd(arr):
    """Floyd's cycle detection for finding duplicate in [1,n] range
    O(n) time, O(1) space - no extra memory!"""
    # Phase 1: Find intersection point
    slow = fast = arr[0]
    while True:
        slow = arr[slow]
        fast = arr[arr[fast]]
        if slow == fast:
            break

    # Phase 2: Find cycle entrance
    slow = arr[0]
    while slow != fast:
        slow = arr[slow]
        fast = arr[fast]

    return slow''',
        "language": "python",
        "complexity_time": "O(n)",
        "complexity_space": "O(1)",
        "tags": ["floyd", "cycle-detection", "constant-space", "interview"],
        "speedup": 178.0,
    },
    {
        "problem_title": "Find Duplicate Elements",
        "title": "Binary Search on Count",
        "description": "Binary search approach for sorted range duplicates",
        "code": '''def find_duplicate_binary(arr):
    """Binary search on value range - O(n log n) time, O(1) space
    Works for arrays with values in range [1, n]"""
    low, high = 1, len(arr) - 1

    while low < high:
        mid = (low + high) // 2
        count = sum(1 for x in arr if x <= mid)

        if count > mid:
            high = mid
        else:
            low = mid + 1

    return low''',
        "language": "python",
        "complexity_time": "O(n log n)",
        "complexity_space": "O(1)",
        "tags": ["binary-search", "constant-space", "pigeonhole"],
        "speedup": 67.0,
    },
]


async def seed_more():
    """Add more duplicate detection solutions."""
    async with async_session() as db:
        # Get user
        result = await db.execute(
            text("SELECT id FROM users WHERE username = 'codeforge_bot'")
        )
        user = result.fetchone()
        if not user:
            print("User not found! Run seed_data.py first.")
            return

        user_id = user[0]

        # Get problem
        result = await db.execute(
            text("SELECT id FROM problems WHERE title = 'Find Duplicate Elements'")
        )
        problem = result.fetchone()
        if not problem:
            print("Problem not found!")
            return

        problem_id = problem[0]
        added = 0

        for sol in MORE_SOLUTIONS:
            # Check if exists
            result = await db.execute(
                text("SELECT id FROM solutions WHERE title = :title AND problem_id = :problem_id"),
                {"title": sol["title"], "problem_id": problem_id}
            )
            if result.fetchone():
                print(f"Skipping (exists): {sol['title']}")
                continue

            # Generate embedding
            print(f"Generating embedding for: {sol['title']}")
            embedding_text = f"{sol['title']} {sol['description']} {sol['code']}"
            embedding = await get_embedding(embedding_text)

            # Insert
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
                    "author_id": user_id,
                    "title": sol["title"],
                    "description": sol["description"],
                    "code": sol["code"],
                    "language": sol["language"],
                    "complexity_time": sol["complexity_time"],
                    "complexity_space": sol["complexity_space"],
                    "tags": sol["tags"],
                    "embedding": str(embedding),
                    "speedup": sol["speedup"],
                    "vote_count": 0,
                }
            )
            print(f"✓ Added: {sol['title']} ({sol['speedup']}x)")
            added += 1

        await db.commit()

        # Show total
        result = await db.execute(
            text("SELECT COUNT(*) FROM solutions WHERE problem_id = :pid"),
            {"pid": problem_id}
        )
        total = result.scalar()
        print(f"\nAdded {added} new solutions. Total for 'Find Duplicates': {total}")


if __name__ == "__main__":
    asyncio.run(seed_more())
