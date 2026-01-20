import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { solutionsApi } from '../api/client'
import type { SolutionList, SolutionResponse } from '../types/api'

interface SolutionFilters {
  page?: number
  size?: number
  problem_id?: string
  language?: string
  min_speedup?: number
  min_memory_reduction?: number
  badges?: string[]
  sort_by?: 'votes' | 'speedup' | 'memory' | 'efficiency' | 'recent'
}

interface UseSolutionsOptions {
  enabled?: boolean
}

export function useSolutions(filters: SolutionFilters = {}, options: UseSolutionsOptions = {}) {
  // Use the explicit enabled option - let the caller control when to fetch
  const shouldEnable = options.enabled !== false

  return useQuery<SolutionList>({
    queryKey: ['solutions', filters],
    queryFn: async () => {
      const response = await solutionsApi.list(filters)
      return response.data
    },
    enabled: shouldEnable,
  })
}

export function useSolution(id: string | null) {
  return useQuery<SolutionResponse>({
    queryKey: ['solution', id],
    queryFn: async () => {
      const response = await solutionsApi.get(id!)
      return response.data
    },
    enabled: id !== null,
  })
}

export function useVoteSolution() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, value }: { id: string; value: number }) => {
      const response = await solutionsApi.vote(id, value)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['solutions'] })
      queryClient.invalidateQueries({ queryKey: ['search'] })
    },
  })
}

// For trending solutions on Explore page
export function useTrendingSolutions(limit: number = 3) {
  return useQuery<SolutionResponse[]>({
    queryKey: ['solutions', 'trending', limit],
    queryFn: async () => {
      const response = await solutionsApi.list({
        sort_by: 'votes',
        size: limit,
      })
      return response.data.items
    },
  })
}

// For fastest solutions on Leaderboard
export function useFastestSolutions(limit: number = 10) {
  return useQuery<SolutionResponse[]>({
    queryKey: ['solutions', 'fastest', limit],
    queryFn: async () => {
      const response = await solutionsApi.list({
        sort_by: 'speedup',
        size: limit,
      })
      return response.data.items
    },
  })
}

// For getting total solutions count
export function useSolutionsCount() {
  return useQuery<number>({
    queryKey: ['solutions', 'count'],
    queryFn: async () => {
      const response = await solutionsApi.list({ size: 1 })
      return response.data.total
    },
  })
}

// Category stats for leaderboard
export interface CategoryStats {
  category: string
  solutions_count: number
  avg_speedup: number
  max_speedup: number
  total_votes: number
}

export function useCategoryStats() {
  return useQuery<CategoryStats[]>({
    queryKey: ['solutions', 'categoryStats'],
    queryFn: async () => {
      const response = await solutionsApi.categoryStats()
      return response.data
    },
  })
}
