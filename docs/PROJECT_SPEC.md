# CodeForge Cloud Platform - Full Specification

## Vision

CodeForge is a **semantic code search platform** where developers discover optimized algorithm implementations. Unlike GitHub search (text-based), CodeForge understands what code *does* and finds faster alternatives.

## Core Concepts

### Solution
A code implementation submitted by a user with:
- Source code (any supported language)
- Problem it solves (linked to Problem entity)
- Benchmark results (execution time, memory)
- Metadata (author, language, complexity, tags)

### Problem
A computational task that solutions solve:
- Title and description
- Category (sorting, searching, graphs, etc.)
- Difficulty level
- Baseline implementation (reference for speedup calculation)
- Test cases for verification

### Baseline
The reference implementation for speedup calculation:
- Usually the naive/textbook approach
- O(n²) bubble sort is baseline for sorting
- Speedup = baseline_time / solution_time

### Benchmark
Performance measurement:
- Execution time (median of N runs)
- Memory usage (peak)
- Multiple input sizes tested
- Standardized hardware profiles

## Feature Specifications

### F1: Semantic Search

**User Story**: As a developer, I want to describe what I need in plain English and find relevant optimized code.

**Implementation**:
- Generate embeddings for code using CodeBERT/StarCoder
- Generate embeddings for search queries
- Use pgvector for similarity search
- Combine with keyword search for hybrid results

**Query Examples**:
- "fast way to find duplicates in array"
- "parallel merge sort implementation"
- "memory efficient graph traversal"

**Search Response**:
```json
{
  "results": [
    {
      "id": "uuid",
      "title": "Counter-based Duplicate Finder",
      "language": "python",
      "speedup": "234x",
      "baseline": "Nested Loop O(n²)",
      "complexity": "O(n)",
      "author": "username",
      "votes": 847,
      "relevance_score": 0.94
    }
  ],
  "total": 156,
  "query_embedding_time_ms": 12
}
```

### F2: Speedup Display

Every solution shows speedup vs baseline:
- Format: "234x faster"
- Color coded: green (>10x), yellow (2-10x), gray (<2x)
- Clickable to show baseline details
- Baseline modal shows: name, code, why it's the baseline

### F3: Comparison Mode

Compare up to 3 solutions side-by-side:
- Select solutions with checkbox
- Comparison panel slides up
- Tabs: Overview / Benchmarks / Code
- Overview: metrics table
- Benchmarks: chart with input size scaling
- Code: syntax-highlighted diff view

### F4: Playground

Interactive code optimization:
1. User pastes their code (left panel)
2. Selects language
3. Clicks "Find Better"
4. System analyzes and finds similar optimized solutions
5. Shows optimized version (right panel)
6. Bottom panel: speedup, time, complexity, suggestions

### F5: Leaderboard

Three tabs:
- **Authors**: Ranked by total score (solutions × votes × speedup)
- **Solutions**: Top solutions by speedup
- **Categories**: Best solutions per category

Time filters: All Time / This Month / This Week

Visual podium for top 3 with gold/silver/bronze styling.

### F6: Explore Page

Discovery-focused landing:
- Hero with platform stats
- Browse by Category (8 categories with icons)
- Scientific Inspirations section
- Trending solutions
- Quick language filters

## Supported Languages

| Language | Icon | File Extensions |
|----------|------|-----------------|
| Python | 🐍 | .py |
| JavaScript | ⚡ | .js, .mjs |
| TypeScript | 📘 | .ts |
| Go | 🔵 | .go |
| Rust | 🦀 | .rs |
| C++ | ⚙️ | .cpp, .cc, .cxx |
| Java | ☕ | .java |
| C | 🔷 | .c |
| C# | 💜 | .cs |
| Ruby | 💎 | .rb |
| PHP | 🐘 | .php |
| Swift | 🍎 | .swift |
| Kotlin | 🎯 | .kt |
| Scala | 🔴 | .scala |
| Haskell | λ | .hs |
| Lua | 🌙 | .lua |

## Categories

1. **Sorting** - Quicksort, mergesort, radix, etc.
2. **Searching** - Binary search, interpolation, etc.
3. **Graph Algorithms** - BFS, DFS, Dijkstra, A*
4. **String Processing** - Pattern matching, parsing
5. **Mathematical** - Prime numbers, matrix ops
6. **Data Structures** - Trees, heaps, hash tables
7. **I/O Optimizations** - Fast input, buffering
8. **Memory Management** - Allocation, pooling
9. **Cryptography** - Hashing, encryption
10. **Machine Learning** - Inference, training ops

## User Roles

| Role | Permissions |
|------|-------------|
| Anonymous | Search, view solutions |
| User | + Submit solutions, vote, save favorites |
| Verified | + Solutions get "verified" badge |
| Moderator | + Edit/remove solutions, manage reports |
| Admin | + Full platform access |

## Data Models

### Solution
```
- id: UUID
- problem_id: FK → Problem
- author_id: FK → User
- title: string
- description: text
- code: text
- language: enum
- complexity_time: string (e.g., "O(n log n)")
- complexity_space: string
- tags: string[]
- embedding: vector(768)
- created_at: timestamp
- updated_at: timestamp
- is_verified: boolean
- vote_count: integer
```

### Problem
```
- id: UUID
- title: string
- description: text
- category: enum
- difficulty: enum (easy/medium/hard)
- baseline_code: text
- baseline_language: enum
- test_cases: jsonb
- created_at: timestamp
```

### Benchmark
```
- id: UUID
- solution_id: FK → Solution
- hardware_profile: string
- input_size: integer
- execution_time_ms: float
- memory_bytes: bigint
- runs_count: integer
- created_at: timestamp
```

### User
```
- id: UUID
- username: string (unique)
- email: string (unique)
- avatar_url: string
- oauth_provider: string
- oauth_id: string
- score: integer
- solutions_count: integer
- created_at: timestamp
```

## Non-Functional Requirements

- **Performance**: Search < 200ms, page load < 1s
- **Scale**: 1M+ solutions, 100K+ users
- **Availability**: 99.9% uptime
- **Security**: OAuth only, no password storage
- **Accessibility**: WCAG 2.1 AA compliance
