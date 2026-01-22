import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { benchmarksApi } from '../api/client'
import { CodeBlock } from '../components/CodeBlock'

interface SolutionData {
  id: string
  title: string
  code: string
  language: string
  speedup: number | null
  memory_reduction: number | null
  efficiency_score: number | null
  readability_score: number | null
  lines_of_code: number | null
  cyclomatic_complexity: number | null
  badges: string[]
  author_username: string
}

interface CompareResponse {
  benchmarks: Record<string, Array<{
    input_size: number
    execution_time_ms: number
    memory_bytes: number
  }>>
  solutions?: SolutionData[]
  winner_speed?: string
  winner_memory?: string
  winner_balanced?: string
}

function WinnerBadge({ type }: { type: 'speed' | 'memory' | 'balanced' }) {
  const badges = {
    speed: { label: 'Fastest', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
    memory: { label: 'Best Memory', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    balanced: { label: 'Best Overall', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  }
  const badge = badges[type]
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${badge.color}`}>
      {badge.label}
    </span>
  )
}

function MetricCard({ label, value, unit, highlight }: {
  label: string
  value: string | number | null
  unit?: string
  highlight?: boolean
}) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-accent-primary/10 border border-accent-primary/30' : 'bg-bg-tertiary'}`}>
      <div className="text-xs text-text-muted mb-1">{label}</div>
      <div className={`text-lg font-semibold ${highlight ? 'text-accent-primary' : 'text-text-primary'}`}>
        {value ?? 'N/A'}{unit && <span className="text-sm text-text-muted ml-1">{unit}</span>}
      </div>
    </div>
  )
}

export default function Compare() {
  const [searchParams] = useSearchParams()
  const idsParam = searchParams.get('ids')
  const solutionIds = idsParam ? idsParam.split(',').filter(Boolean) : []

  const { data, isLoading, error } = useQuery({
    queryKey: ['compare', solutionIds],
    queryFn: async () => {
      const response = await benchmarksApi.compare(solutionIds, true)
      return response.data as CompareResponse
    },
    enabled: solutionIds.length >= 2 && solutionIds.length <= 3,
  })

  if (solutionIds.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-text-primary mb-4">Compare Solutions</h1>
        <div className="bg-bg-secondary rounded-xl p-8 text-center">
          <p className="text-text-secondary mb-4">
            Select 2-3 solutions to compare. Add solution IDs to the URL:
          </p>
          <code className="bg-bg-tertiary px-4 py-2 rounded text-sm text-text-muted">
            /compare?ids=solution1,solution2,solution3
          </code>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
          Failed to load comparison data. Please check the solution IDs.
        </div>
      </div>
    )
  }

  const solutions = data.solutions || []
  const gridCols = solutions.length === 2 ? 'grid-cols-2' : 'grid-cols-3'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Compare Solutions</h1>
        <p className="text-text-secondary">
          Side-by-side comparison of {solutions.length} solutions
        </p>
      </div>

      {/* Solutions Grid */}
      <div className={`grid ${gridCols} gap-6 mb-8`}>
        {solutions.map((solution) => (
          <div key={solution.id} className="bg-bg-secondary rounded-xl overflow-hidden">
            {/* Solution Header */}
            <div className="p-4 border-b border-bg-tertiary">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-text-primary truncate pr-2">
                  {solution.title}
                </h3>
                <span className="text-xs text-text-muted bg-bg-tertiary px-2 py-1 rounded">
                  {solution.language}
                </span>
              </div>
              <div className="text-sm text-text-muted">
                by {solution.author_username}
              </div>
              {/* Winner badges */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {data.winner_speed === solution.id && <WinnerBadge type="speed" />}
                {data.winner_memory === solution.id && <WinnerBadge type="memory" />}
                {data.winner_balanced === solution.id && <WinnerBadge type="balanced" />}
              </div>
            </div>

            {/* Metrics */}
            <div className="p-4 grid grid-cols-2 gap-3">
              <MetricCard
                label="Speedup"
                value={solution.speedup?.toFixed(1)}
                unit="x"
                highlight={data.winner_speed === solution.id}
              />
              <MetricCard
                label="Memory"
                value={solution.memory_reduction?.toFixed(1)}
                unit="x"
                highlight={data.winner_memory === solution.id}
              />
              <MetricCard
                label="Efficiency"
                value={solution.efficiency_score?.toFixed(0)}
                unit="/100"
                highlight={data.winner_balanced === solution.id}
              />
              <MetricCard
                label="Readability"
                value={solution.readability_score?.toFixed(0)}
                unit="/100"
              />
              <MetricCard
                label="Lines"
                value={solution.lines_of_code}
              />
              <MetricCard
                label="Complexity"
                value={solution.cyclomatic_complexity}
              />
            </div>

            {/* Code */}
            <div className="p-4 border-t border-bg-tertiary">
              <h4 className="text-sm font-medium text-text-secondary mb-2">Code</h4>
              <CodeBlock
                code={solution.code}
                language={solution.language}
                maxHeight="max-h-80"
              />
            </div>

            {/* Badges */}
            {solution.badges.length > 0 && (
              <div className="px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {solution.badges.map((badge) => (
                    <span
                      key={badge}
                      className="px-2 py-1 text-xs bg-bg-tertiary text-text-muted rounded"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Benchmark Results Table */}
      {Object.keys(data.benchmarks).length > 0 && (
        <div className="bg-bg-secondary rounded-xl p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">Benchmark Results</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bg-tertiary">
                  <th className="text-left py-3 px-4 text-text-muted font-medium">Input Size</th>
                  {solutions.map((s) => (
                    <th key={s.id} className="text-right py-3 px-4 text-text-muted font-medium">
                      {s.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Get unique input sizes */}
                {Array.from(
                  new Set(
                    Object.values(data.benchmarks)
                      .flat()
                      .map((b) => b.input_size)
                  )
                )
                  .sort((a, b) => a - b)
                  .map((inputSize) => (
                    <tr key={inputSize} className="border-b border-bg-tertiary/50">
                      <td className="py-3 px-4 text-text-primary font-mono">
                        {inputSize.toLocaleString()}
                      </td>
                      {solutions.map((s) => {
                        const benchmark = data.benchmarks[s.id]?.find(
                          (b) => b.input_size === inputSize
                        )
                        return (
                          <td key={s.id} className="text-right py-3 px-4 text-text-secondary">
                            {benchmark ? (
                              <div>
                                <span className="text-text-primary">
                                  {benchmark.execution_time_ms.toFixed(3)}ms
                                </span>
                                <span className="text-text-muted text-xs ml-2">
                                  ({(benchmark.memory_bytes / 1024).toFixed(1)}KB)
                                </span>
                              </div>
                            ) : (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Back link */}
      <div className="mt-8 text-center">
        <Link
          to="/"
          className="text-accent-primary hover:text-accent-primary/80 transition-colors"
        >
          Back to Explore
        </Link>
      </div>
    </div>
  )
}
