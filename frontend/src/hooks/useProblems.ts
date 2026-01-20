import { useQuery } from '@tanstack/react-query'
import { problemsApi } from '../api/client'
import type { ProblemList, ProblemResponse, Category, Difficulty } from '../types/api'

interface ProblemFilters {
  page?: number
  size?: number
  category?: Category
  difficulty?: Difficulty
}

export function useProblems(filters: ProblemFilters = {}) {
  return useQuery<ProblemList>({
    queryKey: ['problems', filters],
    queryFn: async () => {
      const response = await problemsApi.list(filters)
      return response.data
    },
  })
}

export function useProblem(id: string | null) {
  return useQuery<ProblemResponse>({
    queryKey: ['problem', id],
    queryFn: async () => {
      const response = await problemsApi.get(id!)
      return response.data
    },
    enabled: id !== null,
  })
}

export function useProblemBySlug(slug: string | null) {
  return useQuery<ProblemResponse>({
    queryKey: ['problem', 'slug', slug],
    queryFn: async () => {
      const response = await problemsApi.getBySlug(slug!)
      return response.data
    },
    enabled: slug !== null,
  })
}
