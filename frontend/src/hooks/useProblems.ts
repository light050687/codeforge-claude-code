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

// Helper to detect if a string is a UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Smart hook that fetches problem by either UUID or slug
 * Automatically detects the format and uses the appropriate API
 */
export function useProblemByIdOrSlug(idOrSlug: string | null) {
  const isUUID = idOrSlug ? UUID_REGEX.test(idOrSlug) : false

  return useQuery<ProblemResponse>({
    queryKey: ['problem', isUUID ? 'id' : 'slug', idOrSlug],
    queryFn: async () => {
      if (isUUID) {
        const response = await problemsApi.get(idOrSlug!)
        return response.data
      } else {
        const response = await problemsApi.getBySlug(idOrSlug!)
        return response.data
      }
    },
    enabled: idOrSlug !== null,
  })
}
