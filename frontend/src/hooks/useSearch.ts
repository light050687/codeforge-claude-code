import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../api/client'
import type { SearchResult, SearchParams } from '../types/api'

export function useSearch(params: SearchParams | null) {
  // Determine if we have a text query or just category filter
  const hasTextQuery = params?.query && params.query !== '*'
  const hasCategoryOnly = !hasTextQuery && params?.category

  return useQuery<SearchResult>({
    queryKey: ['search', params],
    queryFn: async () => {
      if (!params) {
        return { items: [], total: 0, query: '' }
      }

      // If only category filter (no text query), use by-category endpoint
      if (hasCategoryOnly) {
        const response = await searchApi.byCategory(params.category!, {
          language: params.language,
          limit: params.limit ?? 20,
          offset: params.offset ?? 0,
          sort: params.sort,
        })
        return response.data
      }

      // Otherwise use semantic search
      const response = await searchApi.search(params.query!, {
        language: params.language,
        category: params.category,
        min_speedup: params.min_speedup,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
        sort: params.sort,
      })
      return response.data
    },
    enabled: !!(params?.query || params?.category),
  })
}

export function useSearchSuggestions(query: string) {
  return useQuery({
    queryKey: ['searchSuggestions', query],
    queryFn: async () => {
      const response = await searchApi.suggestions(query)
      return response.data as { suggestions: string[] }
    },
    enabled: query.length >= 2,
  })
}
