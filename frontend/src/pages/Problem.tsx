import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useProblemByIdOrSlug } from '../hooks/useProblems'
import { useSolutions } from '../hooks/useSolutions'
import { useRunBenchmark, type RunBenchmarkResult } from '../hooks/useBenchmarks'
import { CATEGORY_META, type Difficulty, type SolutionBadge } from '../types/api'
import { SolutionCardSkeleton } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/ErrorState'
import { CodeBlock } from '../components/CodeBlock'
import { BadgeList, EfficiencyScore } from '../components/Badge'

const difficultyColors: Record<Difficulty, string> = {
  easy: 'bg-accent-success/20 text-accent-success',
  medium: 'bg-amber-500/20 text-amber-400',
  hard: 'bg-accent-error/20 text-accent-error',
}

const sortOptions = [
  { value: 'speedup', label: 'Speed' },
  { value: 'memory', label: 'Memory' },
  { value: 'efficiency', label: 'Efficiency' },
  { value: 'votes', label: 'Votes' },
  { value: 'recent', label: 'Recent' },
]

// Benchmark results display component
function BenchmarkResultsDisplay({ result }: { result: RunBenchmarkResult }) {
  if (!result.success) {
    return (
      <div className="mt-3 p-3 bg-accent-error/10 border border-accent-error/30 rounded-lg text-sm text-accent-error">
        Benchmark failed: {result.error || 'Unknown error'}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 p-4 bg-bg-primary border border-bg-tertiary rounded-lg"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-text-primary">Benchmark Results</span>
        {result.speedup && (
          <span className="px-3 py-1 bg-accent-success/20 text-accent-success rounded-lg font-medium">
            {result.speedup.toFixed(1)}x faster
          </span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-text-muted">
              <th className="text-left py-2 pr-4">Input Size</th>
              <th className="text-right py-2 px-4">Baseline</th>
              <th className="text-right py-2 px-4">Optimized</th>
              <th className="text-right py-2 pl-4">Speedup</th>
            </tr>
          </thead>
          <tbody className="text-text-secondary">
            {result.results.map((r) => (
              <tr key={r.input_size} className="border-t border-bg-tertiary">
                <td className="py-2 pr-4">{r.input_size.toLocaleString()}</td>
                <td className="text-right py-2 px-4">{r.baseline_time_ms.toFixed(2)}ms</td>
                <td className="text-right py-2 px-4">{r.optimized_time_ms.toFixed(2)}ms</td>
                <td className="text-right py-2 pl-4 text-accent-success font-medium">
                  {r.speedup.toFixed(1)}x
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  )
}

export default function Problem() {
  const { problemId: problemSlug } = useParams<{ problemId: string }>()
  const [sortBy, setSortBy] = useState<'speedup' | 'memory' | 'efficiency' | 'votes' | 'recent'>('speedup')
  const [benchmarkResults, setBenchmarkResults] = useState<Record<string, RunBenchmarkResult>>({})
  const [runningBenchmarks, setRunningBenchmarks] = useState<Set<string>>(new Set())

  const {
    data: problem,
    isLoading: loadingProblem,
    error: problemError,
  } = useProblemByIdOrSlug(problemSlug || null)

  const {
    data: solutionsData,
    isLoading: loadingSolutions,
    error: solutionsError,
    refetch: refetchSolutions,
  } = useSolutions(
    {
      problem_id: problem?.id,  // Use UUID from fetched problem
      sort_by: sortBy,
      size: 50,
    },
    { enabled: !!problem?.id }  // Only fetch when problem is loaded
  )

  const runBenchmark = useRunBenchmark()

  const handleRunBenchmark = async (solutionId: string) => {
    if (runningBenchmarks.has(solutionId)) return

    setRunningBenchmarks((prev) => new Set(prev).add(solutionId))

    try {
      const result = await runBenchmark.mutateAsync({ solutionId })
      setBenchmarkResults((prev) => ({ ...prev, [solutionId]: result }))
    } catch (error) {
      setBenchmarkResults((prev) => ({
        ...prev,
        [solutionId]: {
          solution_id: solutionId,
          results: [],
          speedup: null,
          success: false,
          error: error instanceof Error ? error.message : 'Benchmark failed',
        },
      }))
    } finally {
      setRunningBenchmarks((prev) => {
        const newSet = new Set(prev)
        newSet.delete(solutionId)
        return newSet
      })
    }
  }

  if (loadingProblem) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-bg-secondary rounded w-1/3 mb-4" />
          <div className="h-4 bg-bg-secondary rounded w-2/3 mb-2" />
          <div className="h-4 bg-bg-secondary rounded w-1/2" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <SolutionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  if (problemError || !problem) {
    return (
      <ErrorState
        message="Problem not found"
        onRetry={() => window.location.reload()}
      />
    )
  }

  const categoryMeta = CATEGORY_META[problem.category] || {
    name: problem.category,
    icon: '📁',
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-text-muted">
        <Link to="/" className="hover:text-text-secondary">
          Home
        </Link>
        {' / '}
        <Link
          to={`/category/${problem.category}`}
          className="hover:text-text-secondary"
        >
          {categoryMeta.name}
        </Link>
        {' / '}
        <span className="text-text-secondary">{problem.title}</span>
      </nav>

      {/* Problem Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {problem.title}
            </h1>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-text-secondary">
                <span>{categoryMeta.icon}</span>
                <span>{categoryMeta.name}</span>
              </span>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${
                  difficultyColors[problem.difficulty]
                }`}
              >
                {problem.difficulty}
              </span>
            </div>
          </div>
          <div className="text-right text-sm text-text-muted">
            <div>{solutionsData?.total || 0} solutions</div>
          </div>
        </div>

        {problem.description && (
          <p className="text-text-secondary mb-4">{problem.description}</p>
        )}

        {/* Baseline Info */}
        <div className="mt-4 pt-4 border-t border-bg-tertiary">
          <h3 className="text-sm font-medium text-text-muted mb-2">
            Baseline Implementation ({problem.baseline_language})
          </h3>
          <CodeBlock
            code={problem.baseline_code}
            language={problem.baseline_language}
            maxHeight="max-h-48"
          />
          <div className="flex gap-4 mt-2 text-sm text-text-muted">
            {problem.baseline_complexity_time && (
              <span>Time: {problem.baseline_complexity_time}</span>
            )}
            {problem.baseline_complexity_space && (
              <span>Space: {problem.baseline_complexity_space}</span>
            )}
          </div>
        </div>
      </motion.header>

      {/* Solutions Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">
            Solutions ({solutionsData?.total || 0})
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value as 'speedup' | 'memory' | 'efficiency' | 'votes' | 'recent')
              }
              className="px-3 py-1 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loadingSolutions ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <SolutionCardSkeleton key={i} />
            ))}
          </div>
        ) : solutionsError ? (
          <ErrorState
            message="Failed to load solutions"
            onRetry={() => refetchSolutions()}
          />
        ) : solutionsData?.items.length === 0 ? (
          <EmptyState
            message="No solutions yet. Be the first to contribute!"
            icon="💡"
          />
        ) : (
          <div className="grid gap-4">
            {solutionsData?.items.map((solution, index) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.25) }}
                className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 hover:border-accent-primary/50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-medium text-text-primary">
                        {solution.title}
                      </h3>
                      {solution.efficiency_score != null && (
                        <EfficiencyScore score={solution.efficiency_score} size="sm" />
                      )}
                    </div>
                    {solution.description && (
                      <p className="text-sm text-text-muted mt-1">
                        {solution.description}
                      </p>
                    )}
                    {/* Badges */}
                    {solution.badges && solution.badges.length > 0 && (
                      <div className="mt-2">
                        <BadgeList badges={solution.badges as SolutionBadge[]} size="sm" showLabels />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="px-2 py-1 text-xs font-medium bg-bg-tertiary text-text-secondary rounded">
                      {solution.language}
                    </span>
                    <div className="flex items-center gap-2">
                      {solution.speedup && (
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            solution.speedup > 100
                              ? 'bg-accent-success/20 text-accent-success'
                              : solution.speedup > 10
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-bg-tertiary text-text-secondary'
                          }`}
                        >
                          {solution.speedup.toFixed(0)}x faster
                        </span>
                      )}
                      {solution.memory_reduction && solution.memory_reduction > 1 && (
                        <span className="px-2 py-1 text-xs font-medium rounded bg-emerald-500/20 text-emerald-400">
                          {solution.memory_reduction.toFixed(1)}x less memory
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Code Preview */}
                <CodeBlock
                  code={solution.code}
                  language={solution.language}
                  maxHeight="max-h-64"
                  className="mb-3"
                />

                {/* Meta Info */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4 text-text-muted">
                    <span>
                      {solution.author ? (
                        <>by @{solution.author.username}</>
                      ) : (
                        <span className="text-text-muted">Community</span>
                      )}
                    </span>
                    {solution.complexity_time && (
                      <span>Time: {solution.complexity_time}</span>
                    )}
                    {solution.complexity_space && (
                      <span>Space: {solution.complexity_space}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {solution.is_verified && (
                      <span className="text-accent-success" title="Verified">
                        ✓
                      </span>
                    )}
                    <span className="text-text-muted">
                      ↑ {solution.vote_count} votes
                    </span>
                    {/* Run Benchmark Button - only for Python */}
                    {solution.language.toLowerCase() === 'python' && (
                      <button
                        onClick={() => handleRunBenchmark(solution.id)}
                        disabled={runningBenchmarks.has(solution.id)}
                        className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                          runningBenchmarks.has(solution.id)
                            ? 'bg-bg-tertiary text-text-muted cursor-wait'
                            : 'bg-accent-primary/20 text-accent-primary hover:bg-accent-primary/30'
                        }`}
                      >
                        {runningBenchmarks.has(solution.id) ? (
                          <span className="flex items-center gap-1">
                            <span className="animate-spin">⏳</span>
                            Running...
                          </span>
                        ) : (
                          'Run Benchmark'
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Benchmark Results */}
                {benchmarkResults[solution.id] && (
                  <BenchmarkResultsDisplay result={benchmarkResults[solution.id]} />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
