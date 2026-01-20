# CodeForge MCP Plugin Specification

## Overview

The CodeForge MCP Plugin integrates CodeForge Cloud directly into Claude Code, allowing developers to search for optimized code, analyze their implementations, and get suggestions without leaving their editor.

## MCP Protocol Basics

MCP (Model Context Protocol) is Anthropic's standard for connecting AI assistants to external tools. The plugin runs as a local server that Claude Code communicates with via stdio or HTTP.

**Key Concepts**:
- **Tools**: Functions Claude can call (search, analyze, etc.)
- **Resources**: Data Claude can read (not used in this plugin)
- **Prompts**: Pre-defined prompt templates (optional)

## Plugin Tools

### Tool 1: `codeforge_search`

Search for optimized code implementations.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Natural language description of what you're looking for"
    },
    "language": {
      "type": "string",
      "enum": ["python", "javascript", "typescript", "go", "rust", "cpp", "java"],
      "description": "Filter by programming language"
    },
    "category": {
      "type": "string",
      "enum": ["sorting", "searching", "graphs", "strings", "math", "data-structures"],
      "description": "Filter by algorithm category"
    },
    "min_speedup": {
      "type": "number",
      "description": "Minimum speedup factor (e.g., 10 for 10x faster)"
    },
    "limit": {
      "type": "integer",
      "default": 5,
      "description": "Number of results to return"
    }
  },
  "required": ["query"]
}
```

**Output**:
```json
{
  "results": [
    {
      "id": "solution-uuid",
      "title": "Counter-based Duplicate Finder",
      "description": "Uses collections.Counter for O(n) duplicate detection",
      "language": "python",
      "speedup": "234x",
      "baseline": "Nested loop comparison O(n²)",
      "complexity": "O(n)",
      "code": "def find_duplicates(arr):\n    from collections import Counter\n    ...",
      "author": "username",
      "votes": 847,
      "url": "https://codeforge.cloud/s/solution-uuid"
    }
  ],
  "total_count": 156,
  "search_time_ms": 45
}
```

**Example Usage in Claude Code**:
```
User: "Find a fast way to remove duplicates from a list in Python"

Claude: Let me search CodeForge for optimized solutions.
[Calls codeforge_search with query="remove duplicates list", language="python"]

Found 3 highly-rated solutions:
1. **Set-based approach** (89x faster) - O(n) using set()
2. **Dict.fromkeys method** (76x faster) - Preserves order
3. **Pandas unique** (45x faster) - For large datasets
```

### Tool 2: `codeforge_analyze`

Analyze code and find better alternatives.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "The code to analyze"
    },
    "language": {
      "type": "string",
      "description": "Programming language of the code"
    },
    "context": {
      "type": "string",
      "description": "Optional context about what the code does"
    }
  },
  "required": ["code", "language"]
}
```

**Output**:
```json
{
  "detected_patterns": [
    {
      "pattern": "nested_loop_comparison",
      "location": "lines 5-9",
      "current_complexity": "O(n²)",
      "description": "Nested loops comparing all pairs"
    }
  ],
  "suggestions": [
    {
      "title": "Use Counter for frequency counting",
      "speedup_potential": "~200x",
      "new_complexity": "O(n)",
      "code_snippet": "from collections import Counter\ncounts = Counter(arr)",
      "explanation": "Counter uses hash table for O(1) lookups"
    }
  ],
  "similar_solutions": [
    {
      "id": "uuid",
      "title": "Optimized duplicate finder",
      "speedup": "234x",
      "url": "https://codeforge.cloud/s/uuid"
    }
  ]
}
```

### Tool 3: `codeforge_optimize`

Get an optimized version of the provided code.

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "The code to optimize"
    },
    "language": {
      "type": "string",
      "description": "Programming language"
    },
    "optimization_goal": {
      "type": "string",
      "enum": ["speed", "memory", "both"],
      "default": "speed",
      "description": "What to optimize for"
    }
  },
  "required": ["code", "language"]
}
```

**Output**:
```json
{
  "original_analysis": {
    "complexity_time": "O(n²)",
    "complexity_space": "O(n)",
    "estimated_time_ms": 2340
  },
  "optimized_code": "def find_duplicates_optimized(arr):\n    ...",
  "optimized_analysis": {
    "complexity_time": "O(n)",
    "complexity_space": "O(n)",
    "estimated_time_ms": 10
  },
  "speedup": "234x",
  "changes_made": [
    "Replaced nested loops with Counter",
    "Used list comprehension instead of append loop"
  ],
  "alternative_approaches": [
    {
      "name": "Set-based approach",
      "code": "...",
      "tradeoff": "Faster but doesn't preserve order"
    }
  ]
}
```

### Tool 4: `codeforge_benchmark`

Run benchmarks on code (requires API key with benchmark permissions).

**Input Schema**:
```json
{
  "type": "object",
  "properties": {
    "code": {
      "type": "string",
      "description": "Code to benchmark"
    },
    "language": {
      "type": "string",
      "description": "Programming language"
    },
    "input_generator": {
      "type": "string",
      "description": "Code that generates test input"
    },
    "input_sizes": {
      "type": "array",
      "items": {"type": "integer"},
      "default": [100, 1000, 10000],
      "description": "Input sizes to test"
    }
  },
  "required": ["code", "language", "input_generator"]
}
```

**Output**:
```json
{
  "benchmark_id": "bench-uuid",
  "results": [
    {"input_size": 100, "time_ms": 0.5, "memory_mb": 1.2},
    {"input_size": 1000, "time_ms": 4.8, "memory_mb": 2.1},
    {"input_size": 10000, "time_ms": 48.2, "memory_mb": 15.4}
  ],
  "complexity_detected": "O(n)",
  "hardware_profile": "standard",
  "comparison_to_baseline": {
    "baseline_name": "Naive implementation",
    "speedup": "12.5x"
  }
}
```

## Installation & Configuration

### User Installation

Add to Claude Code MCP settings (`~/.config/claude-code/mcp.json`):

```json
{
  "mcpServers": {
    "codeforge": {
      "command": "npx",
      "args": ["-y", "@codeforge/mcp-plugin"],
      "env": {
        "CODEFORGE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Or install globally:
```bash
npm install -g @codeforge/mcp-plugin
```

### Configuration Options

| Environment Variable | Description | Required |
|---------------------|-------------|----------|
| `CODEFORGE_API_KEY` | API key for authenticated requests | For benchmarks |
| `CODEFORGE_API_URL` | Custom API URL (default: https://api.codeforge.cloud) | No |
| `CODEFORGE_TIMEOUT` | Request timeout in ms (default: 30000) | No |

## Implementation Requirements

### Tech Stack
- **Language**: TypeScript (required for MCP SDK)
- **Framework**: `@modelcontextprotocol/sdk`
- **HTTP Client**: `fetch` or `axios`
- **Build**: `tsup` or `esbuild`

### Project Structure
```
mcp-plugin/
├── src/
│   ├── index.ts           # Entry point, MCP server setup
│   ├── tools/
│   │   ├── search.ts      # codeforge_search implementation
│   │   ├── analyze.ts     # codeforge_analyze implementation
│   │   ├── optimize.ts    # codeforge_optimize implementation
│   │   └── benchmark.ts   # codeforge_benchmark implementation
│   ├── api/
│   │   └── client.ts      # CodeForge API client
│   └── types.ts           # TypeScript interfaces
├── package.json
├── tsconfig.json
└── README.md
```

### MCP Server Template

```typescript
// src/index.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { searchTool } from "./tools/search.js";
import { analyzeTool } from "./tools/analyze.js";
import { optimizeTool } from "./tools/optimize.js";
import { benchmarkTool } from "./tools/benchmark.js";

const server = new Server(
  { name: "codeforge", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Register tools
server.setRequestHandler("tools/list", async () => ({
  tools: [
    searchTool.definition,
    analyzeTool.definition,
    optimizeTool.definition,
    benchmarkTool.definition,
  ]
}));

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case "codeforge_search":
      return searchTool.handler(args);
    case "codeforge_analyze":
      return analyzeTool.handler(args);
    case "codeforge_optimize":
      return optimizeTool.handler(args);
    case "codeforge_benchmark":
      return benchmarkTool.handler(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Error Handling

Return structured errors for better UX:

```typescript
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please wait 60 seconds.",
    "retry_after": 60
  }
}
```

Error codes:
- `RATE_LIMITED` - Too many requests
- `INVALID_CODE` - Code couldn't be parsed
- `LANGUAGE_NOT_SUPPORTED` - Unsupported language
- `BENCHMARK_TIMEOUT` - Benchmark took too long
- `API_ERROR` - Backend API error

## Publishing

Publish to npm as `@codeforge/mcp-plugin`:

```bash
npm publish --access public
```

Package.json requirements:
```json
{
  "name": "@codeforge/mcp-plugin",
  "version": "1.0.0",
  "type": "module",
  "bin": {
    "codeforge-mcp": "./dist/index.js"
  },
  "files": ["dist"],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0"
  }
}
```
