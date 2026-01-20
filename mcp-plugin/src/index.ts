#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

import { searchTool, searchHandler } from './tools/search.js'
import { analyzeTool, analyzeHandler } from './tools/analyze.js'
import { optimizeTool, optimizeHandler } from './tools/optimize.js'
import { benchmarkTool, benchmarkHandler } from './tools/benchmark.js'

const server = new Server(
  {
    name: 'codeforge-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [searchTool, analyzeTool, optimizeTool, benchmarkTool],
  }
})

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params

  try {
    switch (name) {
      case 'codeforge_search':
        return await searchHandler(args)
      case 'codeforge_analyze':
        return await analyzeHandler(args)
      case 'codeforge_optimize':
        return await optimizeHandler(args)
      case 'codeforge_benchmark':
        return await benchmarkHandler(args)
      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    }
  }
})

// Start server
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('CodeForge MCP Server running on stdio')
}

main().catch(console.error)
