import axios from 'axios'

export const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor for auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    // Extract error message from FastAPI response
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// API functions
export const searchApi = {
  search: (query: string, params?: Record<string, unknown>) =>
    api.post('/search/', { query, ...params }),
  suggestions: (q: string) => api.get('/search/suggestions', { params: { q } }),
  byCategory: (category: string, params?: { language?: string; limit?: number; offset?: number; sort?: string }) =>
    api.get('/search/by-category', { params: { category, ...params } }),
}

export const problemsApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: any) => api.get('/problems', { params }),
  get: (id: string) => api.get(`/problems/${id}`),
  getBySlug: (slug: string) => api.get(`/problems/slug/${slug}`),
}

export const solutionsApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: any) => api.get('/solutions', { params }),
  get: (id: string) => api.get(`/solutions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/solutions', data),
  vote: (id: string, value: number) =>
    api.post(`/solutions/${id}/vote`, null, { params: { value } }),
  categoryStats: () => api.get('/solutions/stats/by-category'),
}

export const usersApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  getByUsername: (username: string) => api.get(`/users/username/${username}`),
  topUsers: (limit?: number) => api.get('/users/leaderboard/top', { params: { limit } }),
}

export const benchmarksApi = {
  getSolutionBenchmarks: (solutionId: string) =>
    api.get(`/benchmarks/solution/${solutionId}`),
  compare: (solutionIds: string[]) =>
    api.get('/benchmarks/compare', { params: { solution_ids: solutionIds.join(',') } }),
  run: (solutionId: string, inputSizes?: number[]) =>
    api.post('/benchmarks/run', { solution_id: solutionId, input_sizes: inputSizes }),
}

export const playgroundApi = {
  analyze: (code: string, language: string) =>
    api.post('/playground/analyze', { code, language }),
}

export default api
