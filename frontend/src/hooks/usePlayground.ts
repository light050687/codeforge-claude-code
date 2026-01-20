import { useMutation } from '@tanstack/react-query'
import { playgroundApi } from '../api/client'
import type { PlaygroundAnalysis } from '../types/api'

interface AnalyzeRequest {
  code: string
  language: string
}

export function useAnalyzeCode() {
  return useMutation<PlaygroundAnalysis, Error, AnalyzeRequest>({
    mutationFn: async (request) => {
      const response = await playgroundApi.analyze(request.code, request.language)
      return response.data
    },
  })
}
