import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams, Link } from 'react-router-dom'
import { useSearch } from '../hooks/useSearch'
import { SearchResultSkeleton } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/ErrorState'
import { CodeBlock } from '../components/CodeBlock'
import { CATEGORY_META, type Category } from '../types/api'

const languages = ['All', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C++', 'Java']
const sortOptions = ['Relevance', 'Speedup', 'Votes', 'Recent']

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize state from URL params
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedLanguage, setSelectedLanguage] = useState(
    searchParams.get('language') || 'All'
  )
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'Relevance')
  const [category, setCategory] = useState<Category | undefined>(
    (searchParams.get('category') as Category) || undefined
  )

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams()
    if (query) params.set('q', query)
    if (selectedLanguage !== 'All') params.set('language', selectedLanguage)
    if (sortBy !== 'Relevance') params.set('sort', sortBy)
    if (category) params.set('category', category)
    setSearchParams(params, { replace: true })
  }, [query, selectedLanguage, sortBy, category, setSearchParams])

  // Determine if we should search - either have a query or a category filter
  const shouldSearch = query.trim() || category

  // Search query
  const { data, isLoading, error, refetch } = useSearch(
    shouldSearch
      ? {
          query: query || '*',  // Use wildcard if no query but have category
          language:
            selectedLanguage !== 'All' ? selectedLanguage.toLowerCase() : undefined,
          category,
          limit: 20,
          offset: 0,
          sort: sortBy.toLowerCase() as 'relevance' | 'speedup' | 'votes' | 'recent',
        }
      : null
  )

  const handleSearch = () => {
    if (query.trim()) {
      refetch()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for optimized algorithms..."
            className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={!query.trim()}
          className="px-6 py-3 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Search
        </button>
      </div>

      {/* Active Category Badge */}
      {category && (
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Category:</span>
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-accent-primary/20 text-accent-primary rounded-lg">
            <span>{CATEGORY_META[category]?.icon}</span>
            <span>{CATEGORY_META[category]?.name || category}</span>
            <button
              onClick={() => setCategory(undefined)}
              className="hover:text-white transition-colors"
              title="Clear category filter"
            >
              ✕
            </button>
          </span>
        </div>
      )}

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

        {/* Sort */}
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-text-muted">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1 bg-bg-secondary border border-bg-tertiary rounded-lg text-text-primary focus:outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {isLoading ? (
          // Loading skeletons
          <>
            {[1, 2, 3].map((i) => (
              <SearchResultSkeleton key={i} />
            ))}
          </>
        ) : error ? (
          <ErrorState
            message="Failed to load search results. Please try again."
            onRetry={() => refetch()}
          />
        ) : !shouldSearch ? (
          <EmptyState
            message="Enter a search query to find optimized code"
            icon="🔍"
          />
        ) : data?.items.length === 0 ? (
          <EmptyState message={`No results found for "${query}"`} icon="📭" />
        ) : (
          data?.items.map((result, index) => (
            <motion.div
              key={result.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 hover:border-accent-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-medium text-text-primary">
                    {result.title}
                  </h3>
                  <p className="text-sm text-text-muted">
                    Problem:{' '}
                    <Link
                      to={`/problem/${result.problem_id}`}
                      className="text-accent-primary hover:underline"
                    >
                      {result.problem_title}
                    </Link>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 text-xs font-medium bg-bg-tertiary text-text-secondary rounded">
                    {result.language}
                  </span>
                  {result.speedup && (
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        result.speedup > 100
                          ? 'bg-accent-success/20 text-accent-success'
                          : result.speedup > 10
                            ? 'bg-accent-warning/20 text-accent-warning'
                            : 'bg-bg-tertiary text-text-secondary'
                      }`}
                    >
                      {result.speedup.toFixed(0)}x faster
                    </span>
                  )}
                </div>
              </div>

              {/* Code Preview */}
              <CodeBlock
                code={result.code_preview}
                language={result.language}
                maxHeight="max-h-48"
                className="mb-3"
              />

              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">by @{result.author_username}</span>
                <span className="text-text-muted">↑ {result.vote_count} votes</span>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Results count */}
      {data && data.total > 0 && (
        <div className="text-center text-sm text-text-muted">
          Showing {data.items.length} of {data.total} results
        </div>
      )}
    </div>
  )
}
