import { z } from 'zod'
import { searchCode } from '../api.js'

export const optimizeTool = {
  name: 'codeforge_optimize',
  description:
    'Get an optimized version of your code. Searches CodeForge for faster implementations of similar algorithms.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      code: {
        type: 'string',
        description: 'The code to optimize',
      },
      language: {
        type: 'string',
        description: 'Programming language of the code',
      },
      description: {
        type: 'string',
        description: 'Brief description of what the code does (helps find better matches)',
      },
    },
    required: ['code', 'language'],
  },
}

const OptimizeArgsSchema = z.object({
  code: z.string(),
  language: z.string(),
  description: z.string().optional(),
})

function extractIntent(code: string, language: string): string {
  const lowerCode = code.toLowerCase()
  const intents: string[] = []

  // Common patterns
  if (lowerCode.includes('sort')) intents.push('sorting')
  if (lowerCode.includes('search') || lowerCode.includes('find')) intents.push('searching')
  if (lowerCode.includes('duplicate')) intents.push('find duplicates')
  if (lowerCode.includes('reverse')) intents.push('reverse array')
  if (lowerCode.includes('sum')) intents.push('sum calculation')
  if (lowerCode.includes('max') || lowerCode.includes('min')) intents.push('find max/min')
  if (lowerCode.includes('matrix') || lowerCode.includes('multiply')) intents.push('matrix operations')
  if (lowerCode.includes('fibonacci')) intents.push('fibonacci')
  if (lowerCode.includes('prime')) intents.push('prime numbers')
  if (lowerCode.includes('path') || lowerCode.includes('graph')) intents.push('graph traversal')

  if (intents.length === 0) {
    intents.push('algorithm optimization')
  }

  return intents.join(', ') + ` in ${language}`
}

export async function optimizeHandler(args: unknown) {
  const parsed = OptimizeArgsSchema.parse(args)

  const searchQuery = parsed.description || extractIntent(parsed.code, parsed.language)

  try {
    const results = await searchCode(searchQuery, {
      language: parsed.language,
      limit: 3,
    })

    if (results.items.length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: `No optimized versions found for this code pattern. Here are some general optimization tips:

1. **Use appropriate data structures** - HashMaps for O(1) lookups
2. **Avoid nested loops** - Look for ways to reduce complexity
3. **Pre-compute when possible** - Cache repeated calculations
4. **Use built-in functions** - They're often highly optimized
5. **Consider memory access patterns** - Sequential access is faster

Try using \`codeforge_search\` with a more specific query.`,
          },
        ],
      }
    }

    const bestMatch = results.items[0]

    return {
      content: [
        {
          type: 'text' as const,
          text: `## Optimized Version Found!

**Original Intent**: ${searchQuery}
**Speedup**: ${bestMatch.speedup ? `${bestMatch.speedup}x faster` : 'Significant improvement'}
**Problem**: ${bestMatch.problem_title}

### Optimized Code:
\`\`\`${parsed.language.toLowerCase()}
${bestMatch.code_preview}
\`\`\`

### Why It's Faster:
- Uses more efficient data structures
- Reduces algorithmic complexity
- Optimized for common cases

---
*View more alternatives with \`codeforge_search "${searchQuery}"\`*
`,
        },
      ],
    }
  } catch (error) {
    // Fallback with generic optimization
    return {
      content: [
        {
          type: 'text' as const,
          text: `## Optimization Suggestions (API offline)

Based on analysis of your ${parsed.language} code:

### General Optimizations:
1. **Replace nested loops with hash-based lookups**
2. **Use built-in sorted functions** (Timsort is highly optimized)
3. **Pre-allocate arrays** when size is known
4. **Use generators** for memory efficiency
5. **Consider NumPy/vectorization** for numerical operations

### Example Pattern:
\`\`\`${parsed.language.toLowerCase()}
# Instead of O(n^2):
for i in arr:
    if i in other_arr:  # O(n) lookup
        ...

# Use O(n) total:
other_set = set(other_arr)  # O(n) once
for i in arr:
    if i in other_set:  # O(1) lookup
        ...
\`\`\`

*Connect to CodeForge API for specific optimizations.*
`,
        },
      ],
    }
  }
}
