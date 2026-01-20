import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../api/client'
import { SearchResultSkeleton } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/ErrorState'
import { CodeBlock } from '../components/CodeBlock'
import { CATEGORY_META, type Category as CategoryType, type SearchResultItem } from '../types/api'

const languages = ['All', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C++', 'Java']
const sortOptions = [
  { value: 'speedup', label: 'Speedup' },
  { value: 'votes', label: 'Votes' },
  { value: 'recent', label: 'Recent' },
]

// Group solutions by problem
function groupByProblem(items: SearchResultItem[]): Record<string, {
  problem_id: string
  problem_title: string
  solutions: SearchResultItem[]
}> {
  const groups: Record<string, {
    problem_id: string
    problem_title: string
    solutions: SearchResultItem[]
  }> = {}

  for (const item of items) {
    if (!groups[item.problem_id]) {
      groups[item.problem_id] = {
        problem_id: item.problem_id,
        problem_title: item.problem_title,
        solutions: [],
      }
    }
    groups[item.problem_id].solutions.push(item)
  }

  return groups
}

export default function Category() {
  const { categoryId } = useParams<{ categoryId: string }>()
  const category = categoryId as CategoryType

  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [sortBy, setSortBy] = useState('speedup')
  const [expandedProblems, setExpandedProblems] = useState<Set<string>>(new Set())

  const categoryMeta = CATEGORY_META[category] || { name: categoryId, icon: '📁' }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['category', category, selectedLanguage, sortBy],
    queryFn: async () => {
      const response = await searchApi.byCategory(category, {
        language: selectedLanguage !== 'All' ? selectedLanguage.toLowerCase() : undefined,
        sort: sortBy,
        limit: 100,
        offset: 0,
      })
      return response.data
    },
    enabled: !!category,
  })

  const groupedSolutions = data?.items ? groupByProblem(data.items) : {}
  const problemGroups = Object.values(groupedSolutions)

  // Expand first 3 problems by default
  useEffect(() => {
    if (problemGroups.length > 0 && expandedProblems.size === 0) {
      const firstThree = problemGroups.slice(0, 3).map(g => g.problem_id)
      setExpandedProblems(new Set(firstThree))
    }
  }, [problemGroups.length])

  const toggleProblem = (problemId: string) => {
    setExpandedProblems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(problemId)) {
        newSet.delete(problemId)
      } else {
        newSet.add(problemId)
      }
      return newSet
    })
  }

  const expandAll = () => {
    setExpandedProblems(new Set(problemGroups.map(g => g.problem_id)))
  }

  const collapseAll = () => {
    setExpandedProblems(new Set())
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/leaderboard"
          className="text-text-muted hover:text-text-primary transition-colors"
        >
          ← Back to Categories
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-4xl">{categoryMeta.icon}</span>
        <div>
          <h1 className="text-3xl font-bold text-text-primary">{categoryMeta.name}</h1>
          <p className="text-text-muted">
            {data?.total || 0} solutions across {problemGroups.length} problems
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Language Filter */}
        <div className="flex gap-2 flex-wrap">
          {languages.map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLanguage(lang)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                selectedLanguage === lang
                  ? 'bg-accent-primary text-white'
                  : 'bg-bg-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        {/* Sort & Expand/Collapse */}
        <div className="ml-auto flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={expandAll}
              className="px-3 py-1 text-sm bg-bg-secondary text-text-secondary hover:text-text-primary rounded-lg transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="px-3 py-1 text-sm bg-bg-secondary text-text-secondary hover:text-text-primary rounded-lg transition-colors"
            >
              Collapse All
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
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
      </div>

      {/* Results grouped by problem */}
      <div className="space-y-6">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <SearchResultSkeleton key={i} />
            ))}
          </>
        ) : error ? (
          <ErrorState
            message="Failed to load category solutions"
            onRetry={() => refetch()}
          />
        ) : problemGroups.length === 0 ? (
          <EmptyState
            message={`No solutions found for ${categoryMeta.name}`}
            icon="📭"
          />
        ) : (
          problemGroups.map((group, groupIndex) => (
            <motion.div
              key={group.problem_id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: groupIndex * 0.05 }}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden"
            >
              {/* Problem Header */}
              <button
                onClick={() => toggleProblem(group.problem_id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-bg-tertiary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <span className="text-xl text-text-muted">
                    {expandedProblems.has(group.problem_id) ? '▼' : '▶'}
                  </span>
                  <div className="text-left">
                    <h3 className="text-lg font-medium text-text-primary">
                      {group.problem_title}
                    </h3>
                    <p className="text-sm text-text-muted">
                      {group.solutions.length} solution{group.solutions.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <Link
                  to={`/problem/${group.problem_id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 py-1 text-sm bg-accent-primary/20 text-accent-primary rounded-lg hover:bg-accent-primary/30 transition-colors"
                >
                  View Problem
                </Link>
              </button>

              {/* Solutions List */}
              {expandedProblems.has(group.problem_id) && (
                <div className="border-t border-bg-tertiary divide-y divide-bg-tertiary">
                  {group.solutions.map((solution, solutionIndex) => (
                    <motion.div
                      key={solution.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: solutionIndex * 0.03 }}
                      className="px-6 py-4 hover:bg-bg-tertiary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-text-primary">
                            {solution.title}
                          </h4>
                          <p className="text-sm text-text-muted">
                            by @{solution.author_username}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 text-xs font-medium bg-bg-tertiary text-text-secondary rounded">
                            {solution.language}
                          </span>
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
                          <span className="text-sm text-text-muted">
                            ↑ {solution.vote_count}
                          </span>
                        </div>
                      </div>

                      {/* Code Preview */}
                      <CodeBlock
                        code={solution.code_preview}
                        language={solution.language}
                        maxHeight="max-h-40"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>

      {/* Results count */}
      {data && data.total > 0 && (
        <div className="text-center text-sm text-text-muted">
          Showing {data.items.length} of {data.total} solutions
        </div>
      )}
    </div>
  )
}
