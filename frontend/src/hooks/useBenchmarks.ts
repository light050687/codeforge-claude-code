import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { benchmarksApi } from '../api/client'
import type { BenchmarkResponse } from '../types/api'

export interface RunBenchmarkResult {
  solution_id: string
  results: {
    input_size: number
    baseline_time_ms: number
    optimized_time_ms: number
    speedup: number
    memory_baseline: number
    memory_optimized: number
  }[]
  speedup: number | null
  success: boolean
  error: string | null
}

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

export function useRunBenchmark() {
  const queryClient = useQueryClient()

  return useMutation<RunBenchmarkResult, Error, { solutionId: string; inputSizes?: number[] }>({
    mutationFn: async ({ solutionId, inputSizes }) => {
      const response = await benchmarksApi.run(solutionId, inputSizes)
      return response.data
    },
    onSuccess: (data) => {
      // Invalidate benchmarks and solutions to refresh data
      queryClient.invalidateQueries({ queryKey: ['benchmarks', 'solution', data.solution_id] })
      queryClient.invalidateQueries({ queryKey: ['solutions'] })
    },
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
