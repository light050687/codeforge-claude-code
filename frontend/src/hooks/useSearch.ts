import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../api/client'
import type { SearchResult, SearchParams } from '../types/api'

export function useSearch(params: SearchParams | null) {
  return useQuery<SearchResult>({
    queryKey: ['search', params],
    queryFn: async () => {
      if (!params?.query) {
        return { items: [], total: 0, query: '' }
      }
      const response = await searchApi.search(params.query, {
        language: params.language,
        category: params.category,
        min_speedup: params.min_speedup,
        limit: params.limit ?? 20,
        offset: params.offset ?? 0,
      })
      return response.data
    },
    enabled: !!params?.query,
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
