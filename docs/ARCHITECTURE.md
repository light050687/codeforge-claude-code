# CodeForge Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
├─────────────────┬─────────────────┬─────────────────────────────┤
│   Web App       │   Claude Code   │   Future: CLI, IDE Plugins  │
│   (React)       │   (MCP Plugin)  │                             │
└────────┬────────┴────────┬────────┴─────────────────────────────┘
         │                 │
         ▼                 ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY                                 │
│                    (nginx / traefik)                            │
│              Rate Limiting, SSL, Load Balancing                 │
└────────────────────────────┬────────────────────────────────────┘
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  Backend API    │ │  Search Service │ │  Benchmark      │
│  (FastAPI)      │ │  (FastAPI)      │ │  Worker         │
│                 │ │                 │ │  (Celery)       │
│  - Auth         │ │  - Embeddings   │ │                 │
│  - CRUD         │ │  - Vector Search│ │  - Run code     │
│  - Validation   │ │  - Hybrid Search│ │  - Measure perf │
└────────┬────────┘ └────────┬────────┘ └────────┬────────┘
         │                   │                   │
         └───────────────────┼───────────────────┘
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│      PostgreSQL         │    │        Redis            │
│   + pgvector extension  │    │                         │
│                         │    │   - Session cache       │
│   - Solutions           │    │   - Query cache         │
│   - Problems            │    │   - Rate limiting       │
│   - Users               │    │   - Job queue           │
│   - Benchmarks          │    │                         │
│   - Embeddings (vector) │    │                         │
└─────────────────────────┘    └─────────────────────────┘
```

## Component Details

### 1. Frontend (React)

**Stack**: React 18 + Vite + TailwindCSS + Framer Motion

**Structure**:
```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Button, Input, Modal, etc.
│   │   ├── layout/          # Header, Footer, Sidebar
│   │   ├── search/          # SearchBar, ResultCard, Filters
│   │   ├── playground/      # CodeEditor, ResultsPanel
│   │   └── leaderboard/     # Podium, LeaderTable
│   ├── pages/
│   │   ├── Explore.tsx
│   │   ├── Search.tsx
│   │   ├── Leaderboard.tsx
│   │   └── Playground.tsx
│   ├── hooks/               # useSearch, useDebounce, etc.
│   ├── api/                 # API client functions
│   ├── stores/              # Zustand stores
│   ├── types/               # TypeScript interfaces
│   └── theme/               # Design tokens, theme config
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

**State Management**: Zustand (lightweight, simple)

**API Client**: TanStack Query for caching and sync

### 2. Backend API (FastAPI)

**Stack**: Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2

**Structure**:
```
backend/
├── app/
│   ├── main.py              # FastAPI app entry
│   ├── config.py            # Settings from env
│   ├── database.py          # DB connection
│   ├── models/              # SQLAlchemy models
│   │   ├── solution.py
│   │   ├── problem.py
│   │   ├── user.py
│   │   └── benchmark.py
│   ├── schemas/             # Pydantic schemas
│   │   ├── solution.py
│   │   ├── search.py
│   │   └── user.py
│   ├── api/
│   │   ├── routes/
│   │   │   ├── solutions.py
│   │   │   ├── search.py
│   │   │   ├── problems.py
│   │   │   ├── users.py
│   │   │   └── auth.py
│   │   └── deps.py          # Dependencies (auth, db)
│   ├── services/
│   │   ├── search.py        # Search logic
│   │   ├── embedding.py     # Generate embeddings
│   │   └── benchmark.py     # Benchmark orchestration
│   └── utils/
├── tests/
├── alembic/                 # DB migrations
├── requirements.txt
└── Dockerfile
```

**Key Patterns**:
- Repository pattern for data access
- Service layer for business logic
- Dependency injection for testability

### 3. Search Service

**Embedding Model**: `microsoft/codebert-base` or `bigcode/starencoder`

**Search Algorithm**:
```python
def hybrid_search(query: str, filters: SearchFilters) -> List[Solution]:
    # 1. Generate query embedding
    query_embedding = model.encode(query)
    
    # 2. Vector similarity search (semantic)
    vector_results = db.query("""
        SELECT *, embedding <=> %s AS distance
        FROM solutions
        WHERE language = ANY(%s)
        ORDER BY distance
        LIMIT 100
    """, [query_embedding, filters.languages])
    
    # 3. Full-text search (keyword)
    text_results = db.query("""
        SELECT *, ts_rank(search_vector, query) AS rank
        FROM solutions, plainto_tsquery(%s) query
        WHERE search_vector @@ query
        LIMIT 100
    """, [query])
    
    # 4. Combine with RRF (Reciprocal Rank Fusion)
    combined = reciprocal_rank_fusion(vector_results, text_results)
    
    # 5. Apply filters and return
    return apply_filters(combined, filters)[:20]
```

### 4. Benchmark Worker (Celery)

**Responsibilities**:
- Execute submitted code in sandboxed environment
- Measure execution time (median of N runs)
- Measure memory usage
- Compare against baseline
- Store results

**Sandbox**: Docker containers with resource limits

**Hardware Profiles**:
- `standard`: 2 CPU, 4GB RAM
- `compute`: 8 CPU, 16GB RAM
- `memory`: 4 CPU, 32GB RAM

### 5. MCP Plugin

See `MCP_PLUGIN.md` for detailed specification.

**Architecture**:
```
mcp-plugin/
├── src/
│   ├── index.ts             # MCP server entry
│   ├── tools/
│   │   ├── search.ts        # codeforge_search tool
│   │   ├── analyze.ts       # codeforge_analyze tool
│   │   ├── optimize.ts      # codeforge_optimize tool
│   │   └── benchmark.ts     # codeforge_benchmark tool
│   ├── api-client.ts        # CodeForge API client
│   └── types.ts
├── package.json
└── tsconfig.json
```

## Database Schema

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(255),
    score INTEGER DEFAULT 0,
    solutions_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) DEFAULT 'medium',
    baseline_code TEXT NOT NULL,
    baseline_language VARCHAR(20) NOT NULL,
    test_cases JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solutions
CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES problems(id),
    author_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL,
    complexity_time VARCHAR(50),
    complexity_space VARCHAR(50),
    tags TEXT[],
    embedding vector(768),
    search_vector tsvector,
    is_verified BOOLEAN DEFAULT FALSE,
    vote_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benchmarks
CREATE TABLE benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID REFERENCES solutions(id),
    hardware_profile VARCHAR(50),
    input_size INTEGER,
    execution_time_ms FLOAT,
    memory_bytes BIGINT,
    runs_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_solutions_embedding ON solutions 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_solutions_search ON solutions USING gin(search_vector);
CREATE INDEX idx_solutions_language ON solutions(language);
CREATE INDEX idx_solutions_problem ON solutions(problem_id);
```

## API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/search` | Semantic search |
| GET | `/api/v1/solutions/{id}` | Get solution |
| POST | `/api/v1/solutions` | Submit solution |
| GET | `/api/v1/problems` | List problems |
| GET | `/api/v1/problems/{id}` | Get problem with baseline |
| POST | `/api/v1/playground/analyze` | Analyze pasted code |
| GET | `/api/v1/leaderboard/authors` | Top authors |
| GET | `/api/v1/leaderboard/solutions` | Top solutions |
| POST | `/api/v1/auth/github` | GitHub OAuth |
| GET | `/api/v1/users/me` | Current user |

## Deployment

**Docker Compose** for development:
```yaml
services:
  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    
  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [postgres, redis]
    
  postgres:
    image: pgvector/pgvector:pg16
    volumes: [postgres_data:/var/lib/postgresql/data]
    
  redis:
    image: redis:7-alpine
```

**Production**: Kubernetes with:
- HPA for auto-scaling
- PgBouncer for connection pooling
- CloudFlare for CDN/DDoS protection
