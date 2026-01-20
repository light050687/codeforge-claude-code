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
      generate_variants: {
        type: 'number',
        description: 'Number of optimized variants to generate (1-5). If set, Claude will generate new variants based on optimization patterns.',
      },
    },
    required: ['code', 'language'],
  },
}

const OptimizeArgsSchema = z.object({
  code: z.string(),
  language: z.string(),
  description: z.string().optional(),
  generate_variants: z.number().min(1).max(5).optional(),
})

const OPTIMIZATION_PATTERNS = `
## Optimization Patterns by Category

### Data Structure Optimizations
1. **List → Set/Dict**: O(n) lookup → O(1) lookup
   - \`if x in list\` → \`if x in set(list)\`
2. **Nested loops → Hash join**: O(n²) → O(n)
3. **Array → collections.deque**: O(n) pop(0) → O(1) popleft()
4. **Dict → defaultdict/Counter**: Cleaner grouping

### Algorithmic Optimizations
1. **Brute force → Binary search**: O(n) → O(log n) for sorted data
2. **Recursion → Memoization**: Exponential → Polynomial
3. **Multiple passes → Single pass**: Reduce iterations
4. **Sort-then-search → Heap**: O(n log n) → O(n log k) for top-k

### Memory Optimizations
1. **List → Generator**: O(n) space → O(1) space
2. **String concatenation → join()**: O(n²) → O(n)
3. **Copy → In-place**: Reduce allocations

### Python-Specific
1. **Loop → List comprehension**: 2-3x faster
2. **Manual math → NumPy**: 10-100x faster for arrays
3. **For loop → map/filter**: Often faster
4. **Class → namedtuple/dataclass**: Memory efficient

### Common Antipatterns to Fix
- \`for i in range(len(arr))\` → \`for item in arr\` or \`enumerate()\`
- \`arr = arr + [item]\` → \`arr.append(item)\`
- \`"".join([str(x) for x in arr])\` → \`"".join(map(str, arr))\`
- Repeated \`.count()\` → Single pass with Counter
`

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

  // If generate_variants is set, return a prompt for Claude to generate optimizations
  if (parsed.generate_variants) {
    const numVariants = Math.min(parsed.generate_variants, 5)

    return {
      content: [
        {
          type: 'text' as const,
          text: `## 🔧 GENERATE ${numVariants} OPTIMIZED VARIANTS

**Original Code** (${parsed.language}):
\`\`\`${parsed.language.toLowerCase()}
${parsed.code}
\`\`\`

**Detected Intent**: ${searchQuery}

---

${OPTIMIZATION_PATTERNS}

---

## YOUR TASK

Generate **${numVariants} different optimized versions** of the code above. For each variant:

1. **Name**: Descriptive title (e.g., "Hash-based O(n) Solution")
2. **Approach**: Which optimization pattern you applied
3. **Complexity**: Time and space complexity
4. **Speedup**: Estimated speedup vs original (e.g., "~50x faster")
5. **Code**: Complete, working implementation
6. **Trade-offs**: Any limitations or when NOT to use

**Format each variant as:**
\`\`\`
### Variant N: [Name]
- **Approach**: [pattern used]
- **Time**: O(?) → O(?)
- **Space**: O(?)
- **Speedup**: ~Nx

\`\`\`${parsed.language.toLowerCase()}
[optimized code]
\`\`\`

**Trade-offs**: [when to use/not use]
\`\`\`

Generate diverse approaches: different data structures, algorithms, or libraries (numpy, collections, etc.).
`,
        },
      ],
    }
  }

  // Standard behavior: search CodeForge for existing solutions
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
            text: `No optimized versions found in CodeForge for this code pattern.

**To generate new variants**, use:
\`codeforge_optimize\` with \`generate_variants: 3\`

Or try \`codeforge_search\` with a more specific query like "${searchQuery}".`,
          },
        ],
      }
    }

    const formattedResults = results.items
      .map(
        (item, i) => `
### ${i + 1}. ${item.title}
- **Speedup**: ${item.speedup ? `${item.speedup}x faster` : 'N/A'}
- **Problem**: ${item.problem_title}

\`\`\`${parsed.language.toLowerCase()}
${item.code_preview}
\`\`\`
`
      )
      .join('\n---\n')

    return {
      content: [
        {
          type: 'text' as const,
          text: `## Found ${results.items.length} Optimized Versions

**Your Code Intent**: ${searchQuery}

${formattedResults}

---
💡 *To generate MORE variants, use \`codeforge_optimize\` with \`generate_variants: 3\`*
`,
        },
      ],
    }
  } catch (error) {
    // Fallback: offer to generate
    return {
      content: [
        {
          type: 'text' as const,
          text: `## CodeForge API Offline

**To generate optimized variants locally**, call:
\`codeforge_optimize\` with \`generate_variants: 3\`

This will use Claude to generate ${parsed.generate_variants || 3} optimized versions based on:
${OPTIMIZATION_PATTERNS}
`,
        },
      ],
    }
  }
}
