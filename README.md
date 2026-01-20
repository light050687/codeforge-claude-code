# CodeForge Cloud Platform

> 🔍 **Semantic Code Search Engine** - Find faster, optimized algorithm implementations using natural language queries.

## 🎯 What is CodeForge?

CodeForge is a platform where developers discover optimized code. Unlike traditional search (text-based), CodeForge understands what code *does* and finds faster alternatives.

**Key Features:**
- 🔎 **Semantic Search** - Describe what you need in plain English
- ⚡ **Speedup Metrics** - Every solution shows Nx faster vs baseline
- 📊 **Benchmarks** - Real performance data, not just Big-O
- 🎮 **Playground** - Paste your code, get optimized versions
- 🔌 **Claude Code Plugin** - Search directly from your editor

## 📁 Project Structure

```
codeforge/
├── CLAUDE.md              # AI assistant instructions
├── docs/
│   ├── PROJECT_SPEC.md    # Full specification
│   ├── ARCHITECTURE.md    # System design
│   ├── API_SPEC.md        # API documentation
│   ├── MCP_PLUGIN.md      # Claude Code plugin spec
│   ├── UI_DESIGN.md       # Design system
│   └── ui-prototypes/     # React prototypes
├── frontend/              # React + Vite + Tailwind
├── backend/               # Python FastAPI
├── mcp-plugin/            # Claude Code integration
├── docker-compose.yml     # Development environment
└── .env.example           # Environment template
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- Python 3.11+

### Development Setup

1. **Clone and setup environment:**
```bash
git clone https://github.com/yourorg/codeforge.git
cd codeforge
cp .env.example .env
```

2. **Start infrastructure:**
```bash
docker-compose up -d postgres redis
```

3. **Start backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

4. **Start frontend:**
```bash
cd frontend
npm install
npm run dev
```

5. **Open browser:** http://localhost:3000

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, TailwindCSS |
| Backend | Python, FastAPI, SQLAlchemy |
| Database | PostgreSQL + pgvector |
| Cache | Redis |
| ML | CodeBERT, sentence-transformers |
| MCP | TypeScript, @modelcontextprotocol/sdk |

## 📖 Documentation

- [Project Specification](docs/PROJECT_SPEC.md) - Features, requirements, data models
- [Architecture](docs/ARCHITECTURE.md) - System design, components, database schema
- [API Specification](docs/API_SPEC.md) - REST API endpoints
- [MCP Plugin](docs/MCP_PLUGIN.md) - Claude Code integration
- [UI Design](docs/UI_DESIGN.md) - Design system, components, tokens

## 🔌 Claude Code Plugin

Install the MCP plugin to search CodeForge from Claude Code:

```bash
npm install -g @codeforge/mcp-plugin
```

Add to `~/.config/claude-code/mcp.json`:
```json
{
  "mcpServers": {
    "codeforge": {
      "command": "codeforge-mcp"
    }
  }
}
```

**Available Tools:**
- `codeforge_search` - Search for optimized solutions
- `codeforge_analyze` - Analyze your code for improvements
- `codeforge_optimize` - Get optimized version of your code

## 🎨 Design

Theme: **Developer Tool Noir**
- Dark backgrounds (#0a0a0f)
- Indigo accents (#6366f1)
- DM Sans UI font
- JetBrains Mono for code

See [UI Design](docs/UI_DESIGN.md) for full design system.

## 🤝 Contributing

1. Read the documentation in `/docs`
2. Check existing issues
3. Create a feature branch
4. Submit a PR

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

Built with ❤️ for developers who care about performance.
