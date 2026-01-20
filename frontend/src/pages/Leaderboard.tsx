import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useTopUsers } from '../hooks/useUsers'
import { useFastestSolutions, useCategoryStats } from '../hooks/useSolutions'
import { LeaderboardRowSkeleton } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/ErrorState'
import { CATEGORY_META, type Category } from '../types/api'

type TabType = 'authors' | 'solutions' | 'categories'

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<TabType>('authors')

  const {
    data: topUsersData,
    isLoading: loadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useTopUsers(10)

  const {
    data: fastestSolutions,
    isLoading: loadingSolutions,
    error: solutionsError,
    refetch: refetchSolutions,
  } = useFastestSolutions(10)

  const {
    data: categoryStats,
    isLoading: loadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useCategoryStats()

  const tabs: { id: TabType; label: string }[] = [
    { id: 'authors', label: 'Top Authors' },
    { id: 'solutions', label: 'Fastest Solutions' },
    { id: 'categories', label: 'By Category' },
  ]

  const authors = topUsersData?.users || []
  const solutions = fastestSolutions || []
  const categories = categoryStats || []

  const isLoading =
    activeTab === 'authors'
      ? loadingUsers
      : activeTab === 'solutions'
        ? loadingSolutions
        : loadingCategories
  const error =
    activeTab === 'authors'
      ? usersError
      : activeTab === 'solutions'
        ? solutionsError
        : categoriesError
  const refetch =
    activeTab === 'authors'
      ? refetchUsers
      : activeTab === 'solutions'
        ? refetchSolutions
        : refetchCategories

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-bg-tertiary pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorState
          message="Failed to load leaderboard data"
          onRetry={() => refetch()}
        />
      ) : (
        <>
          {/* Podium for Top 3 */}
          {activeTab === 'authors' && !isLoading && authors.length >= 3 && (
            <div className="flex justify-center items-end gap-4 py-8">
              {/* Second Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center text-2xl mb-2">
                  🥈
                </div>
                <div className="text-text-primary font-medium">
                  {authors[1].username}
                </div>
                <div className="text-sm text-text-muted">
                  {authors[1].score.toLocaleString()} pts
                </div>
                <div className="w-24 h-24 bg-bg-secondary rounded-t-lg mt-2" />
              </motion.div>

              {/* First Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-24 h-24 rounded-full bg-accent-primary/20 flex items-center justify-center text-3xl mb-2">
                  🥇
                </div>
                <div className="text-text-primary font-semibold text-lg">
                  {authors[0].username}
                </div>
                <div className="text-sm text-text-muted">
                  {authors[0].score.toLocaleString()} pts
                </div>
                <div className="w-28 h-32 bg-accent-primary/30 rounded-t-lg mt-2" />
              </motion.div>

              {/* Third Place */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center text-2xl mb-2">
                  🥉
                </div>
                <div className="text-text-primary font-medium">
                  {authors[2].username}
                </div>
                <div className="text-sm text-text-muted">
                  {authors[2].score.toLocaleString()} pts
                </div>
                <div className="w-24 h-16 bg-bg-secondary rounded-t-lg mt-2" />
              </motion.div>
            </div>
          )}

          {/* Categories Grid View */}
          {activeTab === 'categories' && !isLoading && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat, index) => {
                const meta = CATEGORY_META[cat.category as Category] || {
                  name: cat.category,
                  icon: '📁',
                }
                return (
                  <motion.div
                    key={cat.category}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/category/${cat.category}`}
                      className="block bg-bg-secondary border border-bg-tertiary rounded-xl p-6 hover:border-accent-primary/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-3xl">{meta.icon}</span>
                        <div>
                          <h3 className="text-lg font-medium text-text-primary">
                            {meta.name}
                          </h3>
                          <p className="text-sm text-text-muted">
                            {cat.solutions_count} solutions
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-bold text-accent-success">
                            {cat.max_speedup.toFixed(0)}x
                          </div>
                          <div className="text-xs text-text-muted">Max Speedup</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-text-primary">
                            {cat.avg_speedup.toFixed(0)}x
                          </div>
                          <div className="text-xs text-text-muted">Avg Speedup</div>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-text-primary">
                            {cat.total_votes}
                          </div>
                          <div className="text-xs text-text-muted">Total Votes</div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Table for Authors and Solutions */}
          {activeTab !== 'categories' && (
            <div className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-bg-tertiary">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {activeTab === 'solutions' ? 'Solution' : 'Author'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {activeTab === 'solutions' ? 'Speedup' : 'Score'}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                      {activeTab === 'solutions' ? 'Language' : 'Solutions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bg-tertiary">
                  {isLoading ? (
                    // Loading skeletons
                    Array.from({ length: 5 }).map((_, i) => (
                      <LeaderboardRowSkeleton key={i} />
                    ))
                  ) : activeTab === 'authors' ? (
                    authors.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState message="No authors found" />
                        </td>
                      </tr>
                    ) : (
                      authors.map((author, index) => (
                        <motion.tr
                          key={author.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-bg-tertiary/50"
                        >
                          <td className="px-6 py-4 text-text-primary font-medium">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {author.avatar_url ? (
                                <img
                                  src={author.avatar_url}
                                  alt={author.username}
                                  className="w-8 h-8 rounded-full"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-sm text-accent-primary">
                                  {author.username[0].toUpperCase()}
                                </div>
                              )}
                              <span className="text-text-primary">
                                @{author.username}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-text-primary">
                            {author.score.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-text-secondary">
                            {author.solutions_count}
                          </td>
                        </motion.tr>
                      ))
                    )
                  ) : (
                    solutions.length === 0 ? (
                      <tr>
                        <td colSpan={4}>
                          <EmptyState message="No solutions found" />
                        </td>
                      </tr>
                    ) : (
                      solutions.map((solution, index) => (
                        <motion.tr
                          key={solution.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-bg-tertiary/50"
                        >
                          <td className="px-6 py-4 text-text-primary font-medium">
                            #{index + 1}
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-text-primary">{solution.title}</div>
                              <div className="text-sm text-text-muted">
                                by @{solution.author?.username || 'anonymous'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {solution.speedup ? (
                              <span className="px-2 py-1 text-xs font-medium bg-accent-success/20 text-accent-success rounded">
                                {solution.speedup.toFixed(0)}x
                              </span>
                            ) : (
                              <span className="text-text-muted">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-text-secondary">
                            {solution.language}
                          </td>
                        </motion.tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
