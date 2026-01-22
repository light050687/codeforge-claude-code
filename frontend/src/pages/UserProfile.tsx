import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { usersApi, solutionsApi, authApi } from '../api/client'
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

interface UserStats {
  total_solutions: number
  total_votes: number
  average_speedup: number
  languages: Record<string, number>
  best_solutions: Array<{ id: string; title: string; speedup: number }>
  score: number
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>()
  const queryClient = useQueryClient()

  const [isEditing, setIsEditing] = useState(false)
  const [editEmail, setEditEmail] = useState('')

  // Get current logged-in user
  const { data: currentUser } = useQuery<UserData>({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const response = await authApi.getMe()
      return response.data
    },
  })

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

  // Fetch stats only for own profile
  const isOwnProfile = currentUser?.username === username
  const { data: stats } = useQuery<UserStats>({
    queryKey: ['user-stats'],
    queryFn: async () => {
      const response = await usersApi.getMyStats()
      return response.data
    },
    enabled: isOwnProfile,
  })

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { email?: string }) => {
      const response = await usersApi.updateMe(data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user', username] })
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      setIsEditing(false)
    },
  })

  const handleSaveProfile = () => {
    updateMutation.mutate({ email: editEmail || undefined })
  }

  const startEditing = () => {
    setEditEmail(user?.email || '')
    setIsEditing(true)
  }

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
        <div className="flex items-center justify-between">
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

              {/* Email display/edit */}
              {isEditing ? (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="email"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="Email"
                    className="px-3 py-1 bg-bg-tertiary border border-bg-tertiary rounded text-text-primary text-sm focus:outline-none focus:border-accent-primary"
                  />
                  <button
                    onClick={handleSaveProfile}
                    disabled={updateMutation.isPending}
                    className="px-3 py-1 text-sm bg-accent-primary text-white rounded hover:bg-accent-primary/80 disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1 text-sm text-text-secondary hover:text-text-primary"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                user.email && (
                  <p className="text-sm text-text-muted mt-1">{user.email}</p>
                )
              )}
            </div>
          </div>

          {/* Edit button for own profile */}
          {isOwnProfile && !isEditing && (
            <button
              onClick={startEditing}
              className="px-4 py-2 text-sm bg-bg-tertiary text-text-secondary rounded-lg hover:bg-bg-tertiary/80 hover:text-text-primary transition-colors"
            >
              Edit Profile
            </button>
          )}
        </div>
      </motion.header>

      {/* Stats Section (only for own profile) */}
      {isOwnProfile && stats && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
            <p className="text-text-muted text-sm">Total Solutions</p>
            <p className="text-2xl font-bold text-text-primary">{stats.total_solutions}</p>
          </div>
          <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
            <p className="text-text-muted text-sm">Total Votes</p>
            <p className="text-2xl font-bold text-accent-primary">{stats.total_votes}</p>
          </div>
          <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
            <p className="text-text-muted text-sm">Avg Speedup</p>
            <p className="text-2xl font-bold text-accent-success">{stats.average_speedup}x</p>
          </div>
          <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-4">
            <p className="text-text-muted text-sm">Languages</p>
            <p className="text-2xl font-bold text-text-primary">{Object.keys(stats.languages).length}</p>
          </div>
        </motion.section>
      )}

      {/* Languages breakdown */}
      {isOwnProfile && stats && Object.keys(stats.languages).length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4">Languages Used</h2>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.languages).map(([lang, count]) => (
              <span
                key={lang}
                className="px-3 py-1 bg-bg-tertiary text-text-secondary rounded-full text-sm"
              >
                {lang}: {count}
              </span>
            ))}
          </div>
        </motion.section>
      )}

      {/* Best Solutions */}
      {isOwnProfile && stats && stats.best_solutions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-text-primary mb-4">Top Performing Solutions</h2>
          <div className="space-y-2">
            {stats.best_solutions.map((sol, idx) => (
              <div
                key={sol.id}
                className="flex items-center justify-between p-3 bg-bg-tertiary rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <span className="text-text-muted">#{idx + 1}</span>
                  <span className="text-text-primary">{sol.title}</span>
                </div>
                <span className="text-accent-success font-semibold">{sol.speedup}x faster</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

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
