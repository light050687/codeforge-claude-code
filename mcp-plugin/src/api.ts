import axios from 'axios'

const API_BASE_URL = process.env.CODEFORGE_API_URL || 'http://localhost:8000/api/v1'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
})

export interface SearchResult {
  id: number
  title: string
  code_preview: string
  language: string
  speedup: number | null
  votes_count: number
  author_username: string
  problem_title: string
  problem_category: string
  similarity_score: number
}

export interface SearchResponse {
  items: SearchResult[]
  total: number
  query: string
}

export interface Solution {
  id: number
  title: string
  code: string
  language: string
  time_complexity: string | null
  space_complexity: string | null
  speedup: number | null
  execution_time_ms: number | null
  memory_mb: number | null
  votes_count: number
}

export interface Benchmark {
  id: number
  solution_id: number
  input_size: string
  execution_time_ms: number
  memory_mb: number
  iterations: number
}

export async function searchCode(
  query: string,
  options?: {
    language?: string
    category?: string
    min_speedup?: number
    limit?: number
  }
): Promise<SearchResponse> {
  const response = await api.post<SearchResponse>('/search', {
    query,
    ...options,
  })
  return response.data
}

export async function getSolution(id: number): Promise<Solution> {
  const response = await api.get<Solution>(`/solutions/${id}`)
  return response.data
}

export async function getBenchmarks(solutionId: number): Promise<Benchmark[]> {
  const response = await api.get<Benchmark[]>(`/benchmarks/solution/${solutionId}`)
  return response.data
}

export async function compareSolutions(
  solutionIds: number[]
): Promise<Record<number, Benchmark[]>> {
  const response = await api.get('/benchmarks/compare', {
    params: { solution_ids: solutionIds.join(',') },
  })
  return response.data
}
