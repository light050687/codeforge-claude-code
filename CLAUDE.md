# CodeForge Cloud Platform - Claude Code Instructions

## 🎯 Project Mission

Build **CodeForge Cloud Platform** - a semantic code search engine that helps developers find faster, more efficient implementations of algorithms. Think "Google for optimized code" with AI-powered analysis.

## 📁 Project Structure

```
codeforge/
├── CLAUDE.md                 # This file - your instructions
├── docs/
│   ├── PROJECT_SPEC.md       # Full platform specification
│   ├── ARCHITECTURE.md       # System architecture
│   ├── MCP_PLUGIN.md         # Claude Code plugin spec
│   ├── UI_DESIGN.md          # Design system & components
│   └── API_SPEC.md           # API endpoints specification
├── frontend/                 # React + Vite + TailwindCSS
├── backend/                  # Python FastAPI
├── mcp-plugin/              # Claude Code MCP server
└── docker/                  # Docker configurations
```

## 🚀 What To Build

### Phase 1: Backend API
- FastAPI server with PostgreSQL + pgvector
- Code embedding generation (CodeBERT/StarCoder)
- Semantic search endpoint
- Benchmark storage and comparison
- User authentication (OAuth)

### Phase 2: Frontend
- React 18 + Vite + TailwindCSS
- 4 pages: Explore, Search, Leaderboard, Playground
- "Developer Tool Noir" dark theme
- Reference UI prototypes in `docs/ui-prototypes/`

### Phase 3: MCP Plugin
- Claude Code integration via MCP protocol
- Tools: search, analyze, optimize, benchmark
- Direct code insertion into editor

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS, Framer Motion |
| Backend | Python 3.11+, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL 16 + pgvector extension |
| Search | pgvector for embeddings, full-text search |
| ML | sentence-transformers, CodeBERT |
| Cache | Redis |
| MCP | TypeScript, @modelcontextprotocol/sdk |
| Deploy | Docker, docker-compose |

## 📋 Development Commands

```bash
# Start development
cd frontend && npm run dev
cd backend && uvicorn main:app --reload

# Database
docker-compose up -d postgres redis

# Run tests
pytest backend/tests/
npm test --prefix frontend

# Build MCP plugin
cd mcp-plugin && npm run build
```

## ⚡ Key Features To Implement

1. **Semantic Code Search** - Natural language queries find relevant code
2. **Speedup Metrics** - Every solution shows Nx faster vs baseline
3. **Baseline Transparency** - Clear what speedup is measured against
4. **Playground** - Paste code, get optimized versions
5. **Comparison Mode** - Compare up to 3 solutions side-by-side
6. **MCP Integration** - Search from Claude Code directly

## 🎨 Design Tokens

```javascript
colors: {
  bg: { primary: '#0a0a0f', secondary: '#12121a', tertiary: '#1a1a2e' },
  accent: { primary: '#6366f1', success: '#10b981', error: '#ef4444' },
  text: { primary: '#f8fafc', secondary: '#94a3b8', muted: '#64748b' }
}
fonts: {
  ui: 'DM Sans',
  code: 'JetBrains Mono'
}
```

## 🔌 CodeForge Plugin (Proactive Intelligence)

CodeForge Plugin **перехватывает процесс на этапе планирования** и инжектит лучшие решения ДО написания кода:

```
❌ Traditional: Write → Test → Find slow → Optimize
✅ CodeForge:   Analyze intent → Find best pattern → Write optimal
```

**Как работает:**
1. User пишет запрос → CodeForge анализирует intent
2. Ищет лучшие паттерны в Knowledge Base
3. Инжектит контекст в промпт Claude
4. Claude сразу пишет оптимальный код

See `docs/CODEFORGE_PLUGIN.md` for full specification.

## 🐝 Multi-Agent Development

For faster development, use swarm of 10-20 agents:

```bash
# Using Claude-Flow
npx claude-flow hive-mind spawn "Build CodeForge" --agents 12

# Agent roles:
# - frontend-lead, frontend-dev (UI)
# - backend-lead, backend-dev (API)
# - search-engineer (embeddings)
# - db-architect (PostgreSQL)
# - devops (Docker, CI/CD)
# - qa-lead, qa-engineer (tests)
# - docs-writer, code-reviewer
```

See `docs/MULTI_AGENT.md` for orchestration guide.

## 📖 Read These First

Before coding, read the documentation in order:
1. `docs/PROJECT_SPEC.md` - Understand the full vision
2. `docs/ARCHITECTURE.md` - System design decisions
3. `docs/API_SPEC.md` - API contracts
4. `docs/MCP_PLUGIN.md` - CodeForge Cloud MCP plugin (search from Claude Code)
5. `docs/CODEFORGE_PLUGIN.md` - **Proactive code intelligence plugin**
6. `docs/MULTI_AGENT.md` - Multi-agent orchestration (20+ agents)
7. `docs/UI_DESIGN.md` - UI components and patterns

## ✅ Definition of Done

- [ ] All 4 frontend pages functional
- [ ] Backend API with 10+ endpoints
- [ ] Semantic search working with embeddings
- [ ] MCP plugin installable in Claude Code
- [ ] Docker Compose for full stack
- [ ] README with setup instructions
- [ ] Basic test coverage

## 🚨 Important Notes

- Always use TypeScript for MCP plugin (required by protocol)
- Use Pydantic for all API request/response models
- Implement proper error handling and loading states
- Follow the dark theme consistently
- Code should be production-ready, not prototype quality
