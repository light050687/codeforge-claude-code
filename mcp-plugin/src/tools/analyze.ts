import { z } from 'zod'

export const analyzeTool = {
  name: 'codeforge_analyze',
  description:
    'Analyze code for potential performance improvements. Returns complexity analysis and optimization suggestions.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      code: {
        type: 'string',
        description: 'The code to analyze',
      },
      language: {
        type: 'string',
        description: 'Programming language of the code',
      },
    },
    required: ['code', 'language'],
  },
}

const AnalyzeArgsSchema = z.object({
  code: z.string(),
  language: z.string(),
})

interface AnalysisResult {
  complexity: {
    time: string
    space: string
  }
  issues: string[]
  suggestions: string[]
  patterns: string[]
}

function analyzeCode(code: string, language: string): AnalysisResult {
  const issues: string[] = []
  const suggestions: string[] = []
  const patterns: string[] = []

  // Simple heuristic analysis
  const lowerCode = code.toLowerCase()

  // Nested loops detection
  const forCount = (code.match(/\bfor\b/gi) || []).length
  const whileCount = (code.match(/\bwhile\b/gi) || []).length
  const loopCount = forCount + whileCount

  if (loopCount >= 2) {
    issues.push('Nested loops detected - possible O(n^2) or worse complexity')
    suggestions.push('Consider using hash maps/sets for O(1) lookups')
    suggestions.push('Look for opportunities to reduce loop iterations')
  }

  // Array operations in loops
  if (lowerCode.includes('append') || lowerCode.includes('push')) {
    if (loopCount > 0) {
      suggestions.push('Pre-allocate arrays when size is known to avoid repeated allocations')
    }
  }

  // String concatenation in loops
  if ((lowerCode.includes("'") || lowerCode.includes('"')) && lowerCode.includes('+')) {
    if (loopCount > 0) {
      issues.push('String concatenation in loop detected')
      suggestions.push('Use string builder or join() for better performance')
    }
  }

  // List/array operations
  if (lowerCode.includes(' in ') && lowerCode.includes('list')) {
    issues.push('Linear search in list detected')
    suggestions.push('Use set or dict for O(1) membership testing')
  }

  // Sort detection
  if (lowerCode.includes('sort')) {
    patterns.push('Sorting operation detected - O(n log n)')
    suggestions.push('Consider if partial sorting or selection would suffice')
  }

  // Recursion detection
  const funcMatch = code.match(/def\s+(\w+)|function\s+(\w+)/)
  if (funcMatch) {
    const funcName = funcMatch[1] || funcMatch[2]
    if (code.includes(funcName) && (code.match(new RegExp(funcName, 'g')) || []).length > 1) {
      patterns.push('Recursive function detected')
      suggestions.push('Consider memoization or dynamic programming for overlapping subproblems')
    }
  }

  // Estimate complexity
  let timeComplexity = 'O(n)'
  let spaceComplexity = 'O(1)'

  if (loopCount >= 3) {
    timeComplexity = 'O(n^3)'
  } else if (loopCount === 2) {
    timeComplexity = 'O(n^2)'
  } else if (lowerCode.includes('sort')) {
    timeComplexity = 'O(n log n)'
  }

  if (lowerCode.includes('dict') || lowerCode.includes('map') || lowerCode.includes('set')) {
    spaceComplexity = 'O(n)'
  }

  return {
    complexity: { time: timeComplexity, space: spaceComplexity },
    issues,
    suggestions,
    patterns,
  }
}

export async function analyzeHandler(args: unknown) {
  const parsed = AnalyzeArgsSchema.parse(args)
  const analysis = analyzeCode(parsed.code, parsed.language)

  const issuesText =
    analysis.issues.length > 0
      ? `### Issues Found:\n${analysis.issues.map((i) => `- ${i}`).join('\n')}`
      : '### No major issues detected'

  const suggestionsText =
    analysis.suggestions.length > 0
      ? `### Optimization Suggestions:\n${analysis.suggestions.map((s) => `- ${s}`).join('\n')}`
      : ''

  const patternsText =
    analysis.patterns.length > 0
      ? `### Detected Patterns:\n${analysis.patterns.map((p) => `- ${p}`).join('\n')}`
      : ''

  return {
    content: [
      {
        type: 'text' as const,
        text: `## Code Analysis (${parsed.language})

### Complexity:
- **Time**: ${analysis.complexity.time}
- **Space**: ${analysis.complexity.space}

${issuesText}

${suggestionsText}

${patternsText}

---
*Use \`codeforge_search\` to find optimized implementations for similar problems.*
`,
      },
    ],
  }
}
