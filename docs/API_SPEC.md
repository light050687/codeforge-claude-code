# CodeForge API Specification

## Base URL

```
Production: https://api.codeforge.cloud/v1
Development: http://localhost:8000/api/v1
```

## Authentication

Bearer token authentication for protected endpoints:
```
Authorization: Bearer <access_token>
```

Public endpoints (no auth required):
- GET /search
- GET /solutions/{id}
- GET /problems
- GET /leaderboard/*

Protected endpoints require authentication:
- POST /solutions
- POST /solutions/{id}/vote
- POST /playground/analyze
- POST /benchmark/*
- GET /users/me

## Endpoints

---

### Search

#### `GET /search`

Semantic search for code solutions.

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| q | string | Yes | Search query (natural language) |
| language | string | No | Filter by language (python, javascript, etc.) |
| category | string | No | Filter by category (sorting, graphs, etc.) |
| min_speedup | number | No | Minimum speedup factor |
| sort | string | No | Sort by: relevance, speedup, votes, newest |
| page | integer | No | Page number (default: 1) |
| limit | integer | No | Results per page (default: 20, max: 50) |

**Response** `200 OK`:
```json
{
  "results": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Counter-based Duplicate Finder",
      "description": "Efficient O(n) duplicate detection using Counter",
      "language": "python",
      "code_preview": "def find_duplicates(arr):\n    from collections import Counter...",
      "speedup": 234.5,
      "speedup_display": "234x",
      "baseline": {
        "name": "Nested Loop O(n²)",
        "complexity": "O(n²)"
      },
      "complexity_time": "O(n)",
      "complexity_space": "O(n)",
      "author": {
        "id": "user-uuid",
        "username": "fastcoder",
        "avatar_url": "https://..."
      },
      "votes": 847,
      "is_verified": true,
      "tags": ["duplicates", "counter", "optimization"],
      "created_at": "2024-01-15T10:30:00Z",
      "relevance_score": 0.94
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  },
  "meta": {
    "query_time_ms": 45,
    "embedding_time_ms": 12
  }
}
```

---

### Solutions

#### `GET /solutions/{id}`

Get full solution details.

**Response** `200 OK`:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Counter-based Duplicate Finder",
  "description": "Uses Python's Counter for efficient frequency counting...",
  "language": "python",
  "code": "def find_duplicates(arr):\n    \"\"\"Find duplicates using Counter - O(n)\"\"\"\n    from collections import Counter\n    counts = Counter(arr)\n    return [item for item, count in counts.items() if count > 1]",
  "problem": {
    "id": "problem-uuid",
    "title": "Find Duplicate Elements",
    "category": "arrays",
    "difficulty": "easy"
  },
  "baseline": {
    "name": "Nested Loop Comparison",
    "description": "Compares each element with every other element",
    "code": "def find_duplicates_naive(arr):\n    duplicates = []\n    for i in range(len(arr)):\n        for j in range(i + 1, len(arr)):\n            if arr[i] == arr[j] and arr[i] not in duplicates:\n                duplicates.append(arr[i])\n    return duplicates",
    "complexity_time": "O(n²)",
    "complexity_space": "O(n)"
  },
  "complexity_time": "O(n)",
  "complexity_space": "O(n)",
  "speedup": 234.5,
  "benchmarks": [
    {
      "input_size": 100,
      "baseline_time_ms": 0.5,
      "solution_time_ms": 0.002,
      "speedup": 250
    },
    {
      "input_size": 1000,
      "baseline_time_ms": 48.2,
      "solution_time_ms": 0.02,
      "speedup": 2410
    },
    {
      "input_size": 10000,
      "baseline_time_ms": 4820,
      "solution_time_ms": 0.2,
      "speedup": 24100
    }
  ],
  "author": {
    "id": "user-uuid",
    "username": "fastcoder",
    "avatar_url": "https://...",
    "score": 12450
  },
  "votes": 847,
  "is_verified": true,
  "tags": ["duplicates", "counter", "hash-table"],
  "created_at": "2024-01-15T10:30:00Z",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

#### `POST /solutions`

Submit a new solution. **Requires authentication.**

**Request Body**:
```json
{
  "problem_id": "problem-uuid",
  "title": "Set-based Duplicate Finder",
  "description": "Alternative approach using sets for duplicate detection",
  "code": "def find_duplicates(arr):\n    seen = set()\n    duplicates = set()\n    for item in arr:\n        if item in seen:\n            duplicates.add(item)\n        seen.add(item)\n    return list(duplicates)",
  "language": "python",
  "complexity_time": "O(n)",
  "complexity_space": "O(n)",
  "tags": ["duplicates", "set", "optimization"]
}
```

**Response** `201 Created`:
```json
{
  "id": "new-solution-uuid",
  "title": "Set-based Duplicate Finder",
  "status": "pending_benchmark",
  "message": "Solution submitted. Benchmarks will be available in ~2 minutes."
}
```

#### `POST /solutions/{id}/vote`

Vote on a solution. **Requires authentication.**

**Request Body**:
```json
{
  "vote": 1  // 1 for upvote, -1 for downvote, 0 to remove vote
}
```

**Response** `200 OK`:
```json
{
  "solution_id": "solution-uuid",
  "new_vote_count": 848,
  "user_vote": 1
}
```

---

### Problems

#### `GET /problems`

List all problems.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| category | string | Filter by category |
| difficulty | string | Filter by difficulty (easy, medium, hard) |
| page | integer | Page number |
| limit | integer | Results per page |

**Response** `200 OK`:
```json
{
  "results": [
    {
      "id": "problem-uuid",
      "title": "Find Duplicate Elements",
      "description": "Given an array, find all duplicate elements",
      "category": "arrays",
      "difficulty": "easy",
      "solutions_count": 45,
      "best_speedup": 234.5
    }
  ],
  "pagination": {...}
}
```

#### `GET /problems/{id}`

Get problem with baseline.

**Response** `200 OK`:
```json
{
  "id": "problem-uuid",
  "title": "Find Duplicate Elements",
  "description": "Given an array of integers, return a list of all elements that appear more than once.",
  "category": "arrays",
  "difficulty": "easy",
  "baseline": {
    "code": "...",
    "language": "python",
    "complexity_time": "O(n²)",
    "complexity_space": "O(n)",
    "explanation": "This naive approach compares every pair of elements..."
  },
  "test_cases": [
    {"input": "[1, 2, 3, 2, 4, 3]", "expected": "[2, 3]"},
    {"input": "[1, 1, 1]", "expected": "[1]"}
  ],
  "solutions_count": 45,
  "top_solutions": [...]
}
```

---

### Playground

#### `POST /playground/analyze`

Analyze pasted code and find optimizations.

**Request Body**:
```json
{
  "code": "def find_duplicates(arr):\n    duplicates = []\n    for i in range(len(arr)):\n        for j in range(i + 1, len(arr)):\n            if arr[i] == arr[j] and arr[i] not in duplicates:\n                duplicates.append(arr[i])\n    return duplicates",
  "language": "python"
}
```

**Response** `200 OK`:
```json
{
  "analysis": {
    "detected_purpose": "Finding duplicate elements in an array",
    "current_complexity": {
      "time": "O(n²)",
      "space": "O(n)"
    },
    "patterns_detected": [
      {
        "type": "nested_loop",
        "location": "lines 3-6",
        "impact": "Quadratic time complexity"
      }
    ]
  },
  "optimizations": [
    {
      "title": "Counter-based Approach",
      "code": "def find_duplicates_optimized(arr):\n    from collections import Counter\n    counts = Counter(arr)\n    return [item for item, count in counts.items() if count > 1]",
      "complexity": {
        "time": "O(n)",
        "space": "O(n)"
      },
      "speedup_estimate": "~200x",
      "explanation": "Uses hash table for O(1) lookups instead of O(n) nested search"
    },
    {
      "title": "Set-based Approach",
      "code": "def find_duplicates_set(arr):\n    seen = set()\n    duplicates = set()\n    for item in arr:\n        if item in seen:\n            duplicates.add(item)\n        seen.add(item)\n    return list(duplicates)",
      "complexity": {
        "time": "O(n)",
        "space": "O(n)"
      },
      "speedup_estimate": "~180x",
      "explanation": "Single pass with O(1) set operations"
    }
  ],
  "similar_solutions": [
    {
      "id": "solution-uuid",
      "title": "Counter-based Duplicate Finder",
      "speedup": "234x",
      "votes": 847
    }
  ],
  "suggestions": [
    {
      "type": "success",
      "text": "Replaced nested loops with Counter"
    },
    {
      "type": "success",
      "text": "Complexity reduced from O(n²) to O(n)"
    },
    {
      "type": "info",
      "text": "Alternative: Set-based approach preserves insertion order"
    }
  ]
}
```

---

### Leaderboard

#### `GET /leaderboard/authors`

Top authors by score.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | all, month, week |
| limit | integer | Number of results (default: 50) |

**Response** `200 OK`:
```json
{
  "period": "all",
  "results": [
    {
      "rank": 1,
      "user": {
        "id": "user-uuid",
        "username": "algorithmmaster",
        "avatar_url": "https://..."
      },
      "score": 45230,
      "solutions_count": 127,
      "total_votes": 8453,
      "avg_speedup": 156.3,
      "streak_days": 45,
      "badges": ["🏆", "⚡", "🔥"]
    }
  ]
}
```

#### `GET /leaderboard/solutions`

Top solutions by speedup.

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| period | string | all, month, week |
| language | string | Filter by language |
| category | string | Filter by category |
| limit | integer | Number of results |

**Response** `200 OK`:
```json
{
  "results": [
    {
      "rank": 1,
      "solution": {
        "id": "solution-uuid",
        "title": "SIMD-optimized Array Sum",
        "language": "rust",
        "speedup": 1250.0,
        "author": {...},
        "votes": 2341
      }
    }
  ]
}
```

---

### Authentication

#### `POST /auth/github`

GitHub OAuth callback.

**Request Body**:
```json
{
  "code": "github-oauth-code"
}
```

**Response** `200 OK`:
```json
{
  "access_token": "jwt-token",
  "token_type": "bearer",
  "expires_in": 604800,
  "user": {
    "id": "user-uuid",
    "username": "developer",
    "email": "dev@example.com",
    "avatar_url": "https://..."
  }
}
```

#### `GET /users/me`

Get current user. **Requires authentication.**

**Response** `200 OK`:
```json
{
  "id": "user-uuid",
  "username": "developer",
  "email": "dev@example.com",
  "avatar_url": "https://...",
  "score": 1250,
  "solutions_count": 12,
  "votes_received": 340,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}  // Optional additional info
  }
}
```

**Error Codes**:
| Code | HTTP Status | Description |
|------|-------------|-------------|
| VALIDATION_ERROR | 400 | Invalid request parameters |
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

## Rate Limits

| Endpoint | Limit |
|----------|-------|
| GET /search | 100/min |
| POST /playground/analyze | 20/min |
| POST /solutions | 10/hour |
| POST /benchmark/* | 5/hour |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```
