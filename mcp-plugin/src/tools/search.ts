import { z } from 'zod'
import { searchCode } from '../api.js'

export const searchTool = {
  name: 'codeforge_search',
  description:
    'Search CodeForge for optimized code implementations. Use natural language to describe what you need.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'Natural language search query (e.g., "fast way to sort an array")',
      },
      language: {
        type: 'string',
        description: 'Filter by programming language (e.g., "python", "javascript")',
      },
      category: {
        type: 'string',
        description: 'Filter by category (sorting, searching, graphs, strings, math, etc.)',
      },
      min_speedup: {
        type: 'number',
        description: 'Minimum speedup factor (e.g., 10 for 10x faster)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of results (default: 5)',
      },
    },
    required: ['query'],
  },
}

const SearchArgsSchema = z.object({
  query: z.string(),
  language: z.string().optional(),
  category: z.string().optional(),
  min_speedup: z.number().optional(),
  limit: z.number().optional().default(5),
})

export async function searchHandler(args: unknown) {
  const parsed = SearchArgsSchema.parse(args)

  try {
    const results = await searchCode(parsed.query, {
      language: parsed.language,
      category: parsed.category,
      min_speedup: parsed.min_speedup,
      limit: parsed.limit,
    })

    if (results.items.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No results found for "${parsed.query}". Try a different search query or broaden your filters.`,
          },
        ],
      }
    }

    const formattedResults = results.items
      .map(
        (item, i) => `
## ${i + 1}. ${item.title}
- **Problem**: ${item.problem_title}
- **Language**: ${item.language}
- **Speedup**: ${item.speedup ? `${item.speedup}x faster` : 'N/A'}
- **Votes**: ${item.votes_count}
- **Author**: @${item.author_username}

\`\`\`${item.language.toLowerCase()}
${item.code_preview}
\`\`\`
`
      )
      .join('\n---\n')

    return {
      content: [
        {
          type: 'text' as const,
          text: `Found ${results.total} results for "${parsed.query}":\n${formattedResults}`,
        },
      ],
    }
  } catch (error) {
    // Return mock data if API is not available
    return {
      content: [
        {
          type: 'text' as const,
          text: `Search for "${parsed.query}" (API offline - showing mock results):

## 1. Hash-based Duplicate Detection
- **Problem**: Find Duplicates
- **Language**: Python
- **Speedup**: 147x faster
- **Votes**: 342

\`\`\`python
def find_duplicates(arr):
    seen = set()
    duplicates = set()
    for item in arr:
        if item in seen:
            duplicates.add(item)
        seen.add(item)
    return list(duplicates)
\`\`\`

## 2. NumPy Vectorized Sort
- **Problem**: Array Sorting
- **Language**: Python
- **Speedup**: 234x faster
- **Votes**: 567

\`\`\`python
import numpy as np

def fast_sort(arr):
    return np.sort(arr)
\`\`\`
`,
        },
      ],
    }
  }
}
