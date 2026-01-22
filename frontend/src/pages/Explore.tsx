import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTrendingSolutions, useSolutionsCount } from '../hooks/useSolutions'
import { useProblems } from '../hooks/useProblems'
import { useTopUsers } from '../hooks/useUsers'
import {
  StatSkeleton,
  CategorySkeleton,
  SolutionCardSkeleton,
} from '../components/Skeleton'
import { BadgeList } from '../components/Badge'
import { CATEGORY_META, type Category, type SolutionBadge } from '../types/api'

export default function Explore() {
  // Fetch data
  const { data: trendingSolutions, isLoading: loadingTrending } =
    useTrendingSolutions(3)

  const { data: problemsData, isLoading: loadingProblems } = useProblems({
    size: 20,
  })
  const { data: usersData, isLoading: loadingUsers } = useTopUsers(20)
  const { data: totalSolutions, isLoading: loadingSolutions } = useSolutionsCount()

  // Compute stats from fetched data
  const totalProblems = problemsData?.total || 0
  const totalUsers = usersData?.total || 0
  const avgSpeedup = trendingSolutions?.length
    ? Math.round(
        trendingSolutions.reduce((acc, s) => acc + (s.speedup || 0), 0) /
          trendingSolutions.length
      )
    : 0

  const stats = [
    { label: 'Solutions', value: totalSolutions || 0, loading: loadingSolutions },
    { label: 'Problems', value: totalProblems, loading: loadingProblems },
    { label: 'Contributors', value: totalUsers, loading: loadingUsers },
    {
      label: 'Avg Speedup',
      value: avgSpeedup,
      suffix: 'x',
      loading: loadingTrending,
    },
  ]

  // Count problems per category
  const categoryCounts: Record<string, number> = {}
  problemsData?.items.forEach((problem) => {
    categoryCounts[problem.category] = (categoryCounts[problem.category] || 0) + 1
  })

  const categories = Object.entries(CATEGORY_META).map(([id, meta]) => ({
    id: id as Category,
    name: meta.name,
    icon: meta.icon,
    count: categoryCounts[id] || 0,
  }))

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
          Semantic search for optimized algorithm implementations. Discover
          solutions that are 10x-1000x faster than naive approaches.
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
            <span className="text-text-muted group-hover:text-text-secondary">
              🔍
            </span>
            <span className="text-text-muted group-hover:text-text-secondary">
              Search for optimized code...
            </span>
          </Link>
        </motion.div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, index) =>
          stat.loading ? (
            <StatSkeleton key={stat.label} />
          ) : (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(0.1 + index * 0.02, 0.3) }}
              className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 text-center"
            >
              <div className="text-3xl font-bold text-text-primary">
                {stat.value.toLocaleString()}
                {stat.suffix || ''}
              </div>
              <div className="text-sm text-text-muted mt-1">{stat.label}</div>
            </motion.div>
          )
        )}
      </section>

      {/* Categories */}
      <section>
        <h2 className="text-2xl font-semibold text-text-primary mb-6">
          Browse by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {loadingProblems
            ? Array.from({ length: 10 }).map((_, i) => <CategorySkeleton key={i} />)
            : categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(0.1 + index * 0.02, 0.3) }}
                >
                  <Link
                    to={`/category/${category.id}`}
                    className="flex flex-col items-center p-6 bg-bg-secondary border border-bg-tertiary rounded-xl hover:border-accent-primary/50 transition-colors group"
                  >
                    <span className="text-3xl mb-2">{category.icon}</span>
                    <span className="text-text-primary font-medium">
                      {category.name}
                    </span>
                    <span className="text-sm text-text-muted">
                      {category.count} problems
                    </span>
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
          {loadingTrending
            ? Array.from({ length: 3 }).map((_, i) => (
                <SolutionCardSkeleton key={i} />
              ))
            : trendingSolutions?.map((solution, index) => (
                <Link
                  key={solution.id}
                  to={`/problem/${solution.problem_slug || solution.problem_id}`}
                >
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(0.1 + index * 0.02, 0.3) }}
                    className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 hover:border-accent-primary/50 transition-colors cursor-pointer h-full"
                  >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {solution.speedup ? (
                        <span className="px-2 py-1 text-xs font-medium bg-accent-success/20 text-accent-success rounded">
                          {solution.speedup.toFixed(0)}x faster
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-bg-tertiary text-text-muted rounded">
                          -
                        </span>
                      )}
                      {solution.memory_reduction && solution.memory_reduction > 1 && (
                        <span className="px-2 py-1 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded">
                          {solution.memory_reduction.toFixed(1)}x mem
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-text-muted">
                      {solution.language}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-text-primary mb-2">
                    {solution.title}
                  </h3>
                  {/* Badges */}
                  {solution.badges && solution.badges.length > 0 && (
                    <div className="mb-3">
                      <BadgeList badges={solution.badges as SolutionBadge[]} size="sm" maxVisible={3} />
                    </div>
                  )}
                  <p className="text-sm text-text-secondary line-clamp-2 mb-4">
                    {solution.complexity_time && `${solution.complexity_time} time`}
                    {solution.complexity_space &&
                      ` / ${solution.complexity_space} space`}
                    {!solution.complexity_time &&
                      !solution.complexity_space &&
                      'Optimized implementation'}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">
                      by @{solution.author?.username || 'anonymous'}
                    </span>
                    <span className="text-text-muted">
                      ↑ {solution.vote_count} votes
                    </span>
                  </div>
                  </motion.div>
                </Link>
              ))}
        </div>
      </section>
    </div>
  )
}
