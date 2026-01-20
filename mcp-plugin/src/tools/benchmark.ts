import { z } from 'zod'
import { getBenchmarks, compareSolutions } from '../api.js'

export const benchmarkTool = {
  name: 'codeforge_benchmark',
  description:
    'Get benchmark data for CodeForge solutions. Compare performance across different input sizes.',
  inputSchema: {
    type: 'object' as const,
    properties: {
      solution_id: {
        type: 'number',
        description: 'ID of the solution to get benchmarks for',
      },
      compare_ids: {
        type: 'array',
        items: { type: 'number' },
        description: 'Array of solution IDs to compare (2-3 solutions)',
      },
    },
    required: [],
  },
}

const BenchmarkArgsSchema = z.object({
  solution_id: z.number().optional(),
  compare_ids: z.array(z.number()).optional(),
})

export async function benchmarkHandler(args: unknown) {
  const parsed = BenchmarkArgsSchema.parse(args)

  if (!parsed.solution_id && !parsed.compare_ids) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Please provide either:
- \`solution_id\`: Get benchmarks for a specific solution
- \`compare_ids\`: Compare benchmarks between 2-3 solutions

Example: \`codeforge_benchmark solution_id=123\`
Example: \`codeforge_benchmark compare_ids=[123, 456]\``,
        },
      ],
    }
  }

  try {
    if (parsed.compare_ids && parsed.compare_ids.length >= 2) {
      const comparison = await compareSolutions(parsed.compare_ids)

      const comparisonTable = Object.entries(comparison)
        .map(([solutionId, benchmarks]) => {
          const rows = benchmarks
            .map(
              (b: { input_size: string; execution_time_ms: number; memory_mb: number }) =>
                `| ${b.input_size} | ${b.execution_time_ms.toFixed(2)}ms | ${b.memory_mb.toFixed(2)}MB |`
            )
            .join('\n')
          return `### Solution #${solutionId}\n| Input Size | Time | Memory |\n|------------|------|--------|\n${rows}`
        })
        .join('\n\n')

      return {
        content: [
          {
            type: 'text' as const,
            text: `## Benchmark Comparison\n\n${comparisonTable}`,
          },
        ],
      }
    }

    if (parsed.solution_id) {
      const benchmarks = await getBenchmarks(parsed.solution_id)

      if (benchmarks.length === 0) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `No benchmarks available for solution #${parsed.solution_id}.`,
            },
          ],
        }
      }

      const table = benchmarks
        .map(
          (b) =>
            `| ${b.input_size} | ${b.execution_time_ms.toFixed(2)}ms | ${b.memory_mb.toFixed(2)}MB | ${b.iterations} |`
        )
        .join('\n')

      return {
        content: [
          {
            type: 'text' as const,
            text: `## Benchmarks for Solution #${parsed.solution_id}

| Input Size | Execution Time | Memory | Iterations |
|------------|----------------|--------|------------|
${table}

*Times are median of multiple runs on standardized hardware.*`,
          },
        ],
      }
    }
  } catch (error) {
    // Mock data fallback
    return {
      content: [
        {
          type: 'text' as const,
          text: `## Benchmark Data (Mock - API Offline)

### Typical Performance Comparison:

| Algorithm | n=1,000 | n=10,000 | n=100,000 |
|-----------|---------|----------|-----------|
| Naive O(n^2) | 1ms | 100ms | 10,000ms |
| Optimized O(n) | 0.01ms | 0.1ms | 1ms |
| Optimized O(n log n) | 0.02ms | 0.2ms | 2ms |

### Memory Usage:
- O(1) space: ~1KB constant
- O(n) space: ~8KB per 1,000 elements

*Connect to CodeForge API for real benchmark data.*`,
        },
      ],
    }
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: 'Invalid benchmark request.',
      },
    ],
  }
}
