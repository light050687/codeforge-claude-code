import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import { usersApi, solutionsApi } from '../api/client'
import { SolutionCardSkeleton } from '../components/Skeleton'
import { ErrorState, EmptyState } from '../components/ErrorState'
import type { SolutionResponse } from '../types/api'

interface UserData {
  id: string
  username: string
  email: string
  avatar_url: string | null
  score: number
  solutions_count: number
  created_at: string
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>()

  const {
    data: user,
    isLoading: loadingUser,
    error: userError,
  } = useQuery<UserData>({
    queryKey: ['user', username],
    queryFn: async () => {
      const response = await usersApi.getByUsername(username!)
      return response.data
    },
    enabled: !!username,
  })

  const {
    data: solutions,
    isLoading: loadingSolutions,
  } = useQuery<SolutionResponse[]>({
    queryKey: ['user-solutions', user?.id],
    queryFn: async () => {
      const response = await solutionsApi.list({
        author_id: user!.id,
        size: 20,
        sort_by: 'votes',
      })
      return response.data.items
    },
    enabled: !!user?.id,
  })

  if (loadingUser) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-bg-secondary rounded-full" />
            <div>
              <div className="h-8 bg-bg-secondary rounded w-48 mb-2" />
              <div className="h-4 bg-bg-secondary rounded w-32" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (userError || !user) {
    return (
      <ErrorState
        message="User not found"
        onRetry={() => window.location.reload()}
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* User Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6"
      >
        <div className="flex items-center gap-6">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.username}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-accent-primary flex items-center justify-center">
              <span className="text-white text-3xl font-bold">
                {user.username[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              @{user.username}
            </h1>
            <div className="flex items-center gap-4 mt-2 text-text-secondary">
              <span className="flex items-center gap-1">
                <span className="text-accent-primary font-semibold">
                  {user.score.toLocaleString()}
                </span>
                points
              </span>
              <span>
                {user.solutions_count} solution{user.solutions_count !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      </motion.header>

      {/* User's Solutions */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">
          Solutions by @{user.username}
        </h2>

        {loadingSolutions ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <SolutionCardSkeleton key={i} />
            ))}
          </div>
        ) : !solutions || solutions.length === 0 ? (
          <EmptyState
            message="No solutions yet"
            icon="📝"
          />
        ) : (
          <div className="grid gap-4">
            {solutions.map((solution, index) => (
              <motion.div
                key={solution.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.25) }}
              >
                <Link
                  to={`/problem/${solution.problem_slug || solution.problem_id}`}
                  className="block bg-bg-secondary border border-bg-tertiary rounded-xl p-6 hover:border-accent-primary/50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-text-primary">
                      {solution.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 text-xs font-medium bg-bg-tertiary text-text-secondary rounded">
                        {solution.language}
                      </span>
                      {solution.speedup && (
                        <span className="px-2 py-1 text-xs font-medium bg-accent-success/20 text-accent-success rounded">
                          {solution.speedup.toFixed(0)}x faster
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-text-muted">
                    <span>
                      {solution.complexity_time && `Time: ${solution.complexity_time}`}
                      {solution.complexity_space && ` / Space: ${solution.complexity_space}`}
                    </span>
                    <span>↑ {solution.vote_count} votes</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
