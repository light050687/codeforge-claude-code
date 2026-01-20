import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'

const languages = ['All', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'C++', 'Java']
const sortOptions = ['Relevance', 'Speedup', 'Votes', 'Recent']

export default function Search() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedLanguage, setSelectedLanguage] = useState('All')
  const [sortBy, setSortBy] = useState('Relevance')

  const mockResults = [
    {
      id: 1,
      title: 'NumPy-based Matrix Multiplication',
      problem: 'Matrix Multiplication',
      language: 'Python',
      speedup: 156,
      votes: 892,
      author: 'pymaster',
      preview: 'def matmul_fast(a, b):\n    return np.dot(a, b)',
    },
    {
      id: 2,
      title: 'SIMD-optimized Quick Sort',
      problem: 'Array Sorting',
      language: 'C++',
      speedup: 234,
      votes: 567,
      author: 'speedking',
      preview: 'void quicksort_simd(int* arr, int n) {\n    // SIMD implementation',
    },
    {
      id: 3,
      title: 'Hash-based Duplicate Detection',
      problem: 'Find Duplicates',
      language: 'Go',
      speedup: 89,
      votes: 445,
      author: 'gopher',
      preview: 'func findDuplicates(arr []int) []int {\n    seen := make(map[int]bool)',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Search Input */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for optimized algorithms..."
            className="w-full px-4 py-3 bg-bg-secondary border border-bg-tertiary rounded-xl text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-primary"
          />
        </div>
        <button className="px-6 py-3 bg-accent-primary text-white rounded-xl hover:bg-accent-primary/90 transition-colors">
          Search
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        {/* Language Filter */}
        <div className="flex gap-2">
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
        {mockResults.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 hover:border-accent-primary/50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-medium text-text-primary">
                  {result.title}
                </h3>
                <p className="text-sm text-text-muted">Problem: {result.problem}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 text-xs font-medium bg-bg-tertiary text-text-secondary rounded">
                  {result.language}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    result.speedup > 100
                      ? 'bg-accent-success/20 text-accent-success'
                      : result.speedup > 10
                      ? 'bg-accent-warning/20 text-accent-warning'
                      : 'bg-bg-tertiary text-text-secondary'
                  }`}
                >
                  {result.speedup}x faster
                </span>
              </div>
            </div>

            {/* Code Preview */}
            <pre className="bg-bg-primary rounded-lg p-4 text-sm font-mono text-text-secondary overflow-x-auto mb-3">
              {result.preview}
            </pre>

            <div className="flex items-center justify-between text-sm">
              <span className="text-text-muted">by @{result.author}</span>
              <span className="text-text-muted">↑ {result.votes} votes</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
