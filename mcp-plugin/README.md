# CodeForge MCP Plugin

MCP (Model Context Protocol) plugin for Claude Code that provides semantic code search capabilities through the CodeForge platform.

## Features

- **codeforge_search** - Semantic search for optimized code implementations
- **codeforge_analyze** - Analyze code for potential performance improvements
- **codeforge_optimize** - Get optimized versions of your code
- **codeforge_benchmark** - View benchmark data and compare solutions

## Installation

### Option 1: Add to Claude Code Settings

Add to your `~/.claude/settings.json`:

```json
{
  "mcpServers": {
    "codeforge": {
      "command": "npx",
      "args": ["-y", "@codeforge/mcp-plugin"]
    }
  }
}
```

### Option 2: Project-level Configuration

Create `.mcp.json` in your project root:

```json
{
  "mcpServers": {
    "codeforge": {
      "command": "node",
      "args": ["./mcp-plugin/dist/index.js"],
      "env": {
        "CODEFORGE_API_URL": "http://localhost:8000/api/v1"
      }
    }
  }
}
```

### Option 3: Claude CLI

```bash
claude mcp add codeforge --command "npx -y @codeforge/mcp-plugin"
```

## Usage

Once installed, you can use these tools in Claude Code:

### Search for optimized code:
```
Use codeforge_search to find a fast way to sort an array in Python
```

### Analyze your code:
```
Use codeforge_analyze to check this code:
def find_duplicates(arr):
    for i in arr:
        for j in arr:
            if i == j: ...
```

### Get optimized version:
```
Use codeforge_optimize on this code:
def sum_array(arr):
    total = 0
    for i in arr:
        total += i
    return total
```

### View benchmarks:
```
Use codeforge_benchmark for solution 123
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev
```

## Environment Variables

- `CODEFORGE_API_URL` - CodeForge API URL (default: http://localhost:8000/api/v1)

## License

MIT
