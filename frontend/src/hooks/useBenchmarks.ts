import { useQuery } from '@tanstack/react-query'
import { benchmarksApi } from '../api/client'
import type { BenchmarkResponse } from '../types/api'

export function useSolutionBenchmarks(solutionId: string | null) {
  return useQuery<BenchmarkResponse[]>({
    queryKey: ['benchmarks', 'solution', solutionId],
    queryFn: async () => {
      const response = await benchmarksApi.getSolutionBenchmarks(solutionId!)
      return response.data
    },
    enabled: solutionId !== null,
  })
}

interface CompareResult {
  [solutionId: string]: BenchmarkResponse[]
}

export function useCompareBenchmarks(solutionIds: string[]) {
  return useQuery<CompareResult>({
    queryKey: ['benchmarks', 'compare', solutionIds],
    queryFn: async () => {
      const response = await benchmarksApi.compare(solutionIds)
      return response.data
    },
    enabled: solutionIds.length >= 2,
  })
}
