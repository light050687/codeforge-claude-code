import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { solutionsApi } from '../api/client'
import type { SolutionList, SolutionResponse } from '../types/api'

interface SolutionFilters {
  page?: number
  size?: number
  problem_id?: string
  language?: string
  min_speedup?: number
  sort_by?: 'votes' | 'speedup' | 'recent'
}

export function useSolutions(filters: SolutionFilters = {}) {
  return useQuery<SolutionList>({
    queryKey: ['solutions', filters],
    queryFn: async () => {
      const response = await solutionsApi.list(filters)
      return response.data
    },
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
