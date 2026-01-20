import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const categories = [
  { id: 'sorting', name: 'Sorting', icon: '⬆️', count: 128 },
  { id: 'searching', name: 'Searching', icon: '🔍', count: 96 },
  { id: 'graphs', name: 'Graphs', icon: '🌐', count: 84 },
  { id: 'strings', name: 'Strings', icon: '📝', count: 156 },
  { id: 'math', name: 'Math', icon: '🔢', count: 112 },
  { id: 'data_structures', name: 'Data Structures', icon: '🗂️', count: 142 },
  { id: 'io_optimization', name: 'I/O Optimization', icon: '⚡', count: 48 },
  { id: 'memory', name: 'Memory Management', icon: '💾', count: 36 },
  { id: 'crypto', name: 'Cryptography', icon: '🔐', count: 24 },
  { id: 'ml', name: 'Machine Learning', icon: '🤖', count: 52 },
]

const stats = [
  { label: 'Solutions', value: '12,847' },
  { label: 'Problems', value: '1,256' },
  { label: 'Contributors', value: '3,421' },
  { label: 'Avg Speedup', value: '47x' },
]

export default function Explore() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold text-text-primary mb-4"
        >
          Find <span className="text-accent-primary">Faster</span> Code
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-text-secondary max-w-2xl mx-auto mb-8"
        >
          Semantic search for optimized algorithm implementations.
          Discover solutions that are 10x-1000x faster than naive approaches.
        </motion.p>

        {/* Search Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-xl mx-auto"
        >
          <Link
            to="/search"
            className="flex items-center gap-3 px-6 py-4 bg-bg-secondary border border-bg-tertiary rounded-xl hover:border-accent-primary/50 transition-colors group"
          >
            <span className="text-text-muted group-hover:text-text-secondary">🔍</span>
            <span className="text-text-muted group-hover:text-text-secondary">
              Search for optimized code...
            </span>
          </Link>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 text-center"
          >
            <div className="text-3xl font-bold text-text-primary">{stat.value}</div>
            <div className="text-sm text-text-muted mt-1">{stat.label}</div>
          </motion.div>
        ))}
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-6">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <Link
                to={`/search?category=${category.id}`}
                className="flex flex-col items-center p-6 bg-bg-secondary border border-bg-tertiary rounded-xl hover:border-accent-primary/50 transition-colors group"
              >
                <span className="text-3xl mb-2">{category.icon}</span>
                <span className="text-text-primary font-medium">{category.name}</span>
                <span className="text-sm text-text-muted">{category.count} solutions</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-6">
          Trending Solutions
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="px-2 py-1 text-xs font-medium bg-accent-success/20 text-accent-success rounded">
                  234x faster
                </span>
                <span className="text-sm text-text-muted">Python</span>
              </div>
              <h3 className="text-lg font-medium text-text-primary mb-2">
                Binary Search with SIMD
              </h3>
              <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                Optimized binary search using vectorized operations for array lookup.
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">by @speedmaster</span>
                <span className="text-text-muted">↑ 342 votes</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
