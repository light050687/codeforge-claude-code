# Multi-Agent Orchestration Guide

## Overview

Для масштабных задач можно запускать **десятки Claude агентов параллельно**. Это ускоряет разработку в 5-10x и позволяет выполнять комплексные задачи автономно.

## Available Orchestration Tools

### 1. Claude-Flow (Recommended)

**GitHub**: https://github.com/ruvnet/claude-flow

Лидирующая платформа с 64+ специализированными агентами.

```bash
# Установка
npm install -g claude-flow

# Инициализация swarm
npx claude-flow hive-mind init

# Запуск swarm для CodeForge
npx claude-flow hive-mind spawn "Build CodeForge Cloud Platform" \
  --queen-type tactical \
  --topology hierarchical

# Параллельная разработка
npx claude-flow swarm "implement full-stack" \
  --agents frontend,backend,devops,tester,reviewer
```

**Особенности**:
- 64 специализированных агента
- SPARC методология (TDD)
- Byzantine consensus для координации
- 84.8% SWE-Bench solve rate
- MCP интеграция

### 2. CCSwarm (Rust-based)

**GitHub**: https://github.com/nwiizo/ccswarm

Высокопроизводительная система на Rust с git worktree изоляцией.

```bash
# Установка
cargo install ccswarm

# Инициализация
ccswarm init --name "CodeForge" --agents frontend,backend,devops

# Запуск с Claude Code
ccswarm start
ccswarm tui  # Мониторинг в отдельном терминале

# Отправка задачи
ccswarm claude-acp send --task "Build semantic search API"
```

**Архитектура**:
```
┌─────────────────────────────────────────┐
│         ProactiveMaster                 │
├─────────────────────────────────────────┤
│    Claude ACP Integration               │
│    (WebSocket ws://localhost:9100)      │
├─────────────────────────────────────────┤
│  Specialized Agent Pool                 │
│  ├─ Frontend Agent                      │
│  ├─ Backend Agent                       │
│  ├─ DevOps Agent                        │
│  └─ QA Agent                            │
└─────────────────────────────────────────┘
```

### 3. Swarm-IOSM

**GitHub**: https://github.com/rokoss21/swarm-iosm

Оркестрация с quality gates и file locking.

```bash
# Установка как Claude Code skill
git clone https://github.com/rokoss21/swarm-iosm.git \
  .claude/skills/swarm-iosm

# Использование
/swarm-iosm new-track "Build CodeForge frontend"
```

**IOSM Methodology**:
```
IMPROVE → OPTIMIZE → SHRINK → MODULARIZE
```

### 4. Native Claude Code Sub-Agents

Встроенная система в Claude Code (декабрь 2025+).

```yaml
# ~/.claude/agents/codeforge-swarm.yml
version: "1.0"
agents:
  - name: "frontend-architect"
    model: "claude-sonnet-4-5-20250929"
    tools: ["read_file", "write_file", "browser_tool"]
    system_prompt: |
      You are the Frontend Architect for CodeForge.
      - Use React 18, Vite, TailwindCSS
      - Follow Developer Tool Noir theme
      - NEVER write backend logic

  - name: "backend-engineer"
    model: "claude-sonnet-4-5-20250929"
    tools: ["read_file", "write_file", "terminal_cmd"]
    system_prompt: |
      You are the Backend Engineer for CodeForge.
      - Use FastAPI, SQLAlchemy, Pydantic
      - Implement semantic search with pgvector
      - ALWAYS validate inputs

  - name: "devops-specialist"
    model: "claude-haiku-4-5-20251001"
    tools: ["terminal_cmd", "read_file"]
    system_prompt: |
      You are DevOps for CodeForge.
      - Docker, docker-compose
      - CI/CD pipelines
      - Monitoring setup

  - name: "qa-engineer"
    model: "claude-haiku-4-5-20251001"
    tools: ["terminal_cmd", "read_file", "write_file"]
    system_prompt: |
      You are QA Engineer for CodeForge.
      - Write pytest tests
      - Integration testing
      - Performance benchmarks
```

**Использование**:
```bash
claude "Use @frontend-architect to build Search page and \
        @backend-engineer to create /search API endpoint"
```

## Recommended Architecture for CodeForge

### Swarm Configuration

```
┌─────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR                              │
│              (Main Claude Instance)                          │
│                                                              │
│  Responsibilities:                                           │
│  • Task decomposition                                        │
│  • Agent assignment                                          │
│  • Conflict resolution                                       │
│  • Quality review                                            │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┬───────────────┐
       ▼               ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│  Frontend   │ │  Backend    │ │  Database   │ │  DevOps     │
│  Squad      │ │  Squad      │ │  Squad      │ │  Squad      │
│  (3 agents) │ │  (3 agents) │ │  (2 agents) │ │  (2 agents) │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
      │               │               │               │
      ▼               ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ • UI Dev    │ │ • API Dev   │ │ • Schema    │ │ • Docker    │
│ • Styling   │ │ • Services  │ │ • Migrations│ │ • CI/CD     │
│ • Testing   │ │ • Testing   │ │ • Indexing  │ │ • Monitoring│
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

### Agent Specializations for CodeForge

| Agent | Responsibility | Model | Count |
|-------|---------------|-------|-------|
| UI Developer | React components, pages | Sonnet | 2 |
| UI Stylist | Tailwind, animations | Haiku | 1 |
| API Developer | FastAPI endpoints | Sonnet | 2 |
| Search Engineer | Embeddings, pgvector | Sonnet | 1 |
| DB Architect | Schema, migrations | Sonnet | 1 |
| Test Engineer | pytest, integration | Haiku | 2 |
| DevOps | Docker, CI/CD | Haiku | 1 |
| Docs Writer | README, API docs | Haiku | 1 |
| Code Reviewer | Quality gates | Sonnet | 1 |
| **TOTAL** | | | **12** |

### File Locking Strategy

Prevents conflicts when multiple agents edit:

```yaml
# .swarm/locks.yml
locks:
  frontend/:
    owner: frontend-squad
    exclusive: true
    
  backend/app/api/:
    owner: api-developer
    exclusive: true
    
  backend/app/services/:
    owner: service-developer
    exclusive: true
    
  docker/:
    owner: devops
    exclusive: true
    
  tests/:
    owner: null  # Shared access
    exclusive: false
```

## Scaling to 20+ Agents

### Hierarchical Topology

```
                    ┌─────────────┐
                    │   Master    │
                    │ Orchestrator│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Frontend    │  │   Backend     │  │ Infrastructure│
│ Sub-Orchestr. │  │ Sub-Orchestr. │  │ Sub-Orchestr. │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
   ┌────┼────┐        ┌────┼────┐        ┌────┼────┐
   ▼    ▼    ▼        ▼    ▼    ▼        ▼    ▼    ▼
  A1   A2   A3       A4   A5   A6       A7   A8   A9
  A10  A11  A12      A13  A14  A15      A16  A17  A18
```

### Practical Limits

| Agents | Use Case | Coordination Overhead |
|--------|----------|----------------------|
| 1-5 | Single feature | Minimal |
| 5-10 | Full module | Low |
| 10-20 | Full application | Medium |
| 20-50 | Large project | High (needs sub-orchestrators) |
| 50+ | Enterprise | Very high (hierarchical required) |

### Cost Estimation

```
Per agent per hour (active development):
- Sonnet: ~$5-10 (complex tasks)
- Haiku: ~$1-2 (simple tasks)

20 agents for 8 hours:
- 10 Sonnet × $7.50 × 8h = $600
- 10 Haiku × $1.50 × 8h = $120
- Total: ~$720/day

vs. 5 developers × $500/day = $2,500/day
Savings: 70%
```

## Integration with Ralph

Ralph + Multi-Agent = Maximum Efficiency

```yaml
# .ralph.yml
ralph:
  mode: always
  
  multi_agent:
    enabled: true
    optimization_agent: true  # Dedicated agent for optimization
    
    workflow:
      # Each agent's code goes through Ralph
      on_agent_complete:
        - ralph_analyze
        - ralph_optimize (if P0 or P1)
        - ralph_verify
```

**Workflow**:
```
Agent writes code → Ralph analyzes → Ralph optimizes → Tests pass → Merge
```

## Quick Start for CodeForge

### Option A: Claude-Flow (Easiest)

```bash
# 1. Install
npm install -g claude-flow

# 2. Initialize in project
cd codeforge
npx claude-flow init

# 3. Configure agents
cat > .claude-flow/agents.yml << 'EOF'
agents:
  - frontend-lead
  - frontend-dev
  - backend-lead  
  - backend-dev
  - search-engineer
  - db-architect
  - devops
  - qa-lead
  - qa-engineer
  - docs-writer
EOF

# 4. Start swarm
npx claude-flow hive-mind spawn "Build CodeForge Cloud Platform" \
  --read-docs ./docs \
  --output ./src
```

### Option B: Manual with Git Worktrees

```bash
# 1. Create worktrees for isolation
git worktree add ../codeforge-frontend frontend-branch
git worktree add ../codeforge-backend backend-branch
git worktree add ../codeforge-infra infra-branch

# 2. Run Claude Code in each (separate terminals)
cd ../codeforge-frontend && claude
cd ../codeforge-backend && claude
cd ../codeforge-infra && claude

# 3. Coordinate via shared task file
# Each agent reads/writes to .tasks/queue.json

# 4. Merge when complete
git checkout main
git merge frontend-branch backend-branch infra-branch
```

## Monitoring

### Real-time Dashboard

```bash
# Claude-Flow TUI
npx claude-flow tui

# Output:
┌─────────────────────────────────────────────────────────────┐
│  CodeForge Swarm Status                    12 agents active │
├─────────────────────────────────────────────────────────────┤
│  Agent          │ Status    │ Task                │ Progress│
├─────────────────┼───────────┼─────────────────────┼─────────┤
│  frontend-lead  │ 🟢 Active │ Search page UI      │ 78%     │
│  frontend-dev   │ 🟢 Active │ Leaderboard comp.   │ 45%     │
│  backend-lead   │ 🟢 Active │ Search API          │ 92%     │
│  backend-dev    │ 🟡 Wait   │ Waiting for schema  │ 0%      │
│  search-eng     │ 🟢 Active │ Embedding service   │ 60%     │
│  db-architect   │ 🟢 Active │ pgvector setup      │ 85%     │
│  devops         │ 🟢 Active │ Docker compose      │ 100% ✓  │
│  qa-lead        │ 🟡 Wait   │ Waiting for API     │ 0%      │
└─────────────────────────────────────────────────────────────┘
│  Tasks: 45 total │ 12 done │ 8 in progress │ 25 queued     │
│  Estimated completion: 2h 15m                               │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

1. **Always use file locking** - prevents merge conflicts
2. **Hierarchical for 10+ agents** - reduces coordination overhead  
3. **Mix Sonnet + Haiku** - Sonnet for complex, Haiku for simple
4. **Quality gates before merge** - tests must pass
5. **Shared context via docs** - all agents read same specs
6. **Dedicated reviewer agent** - catches cross-agent issues
7. **Incremental integration** - merge frequently, not at end
