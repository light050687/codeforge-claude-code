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
    return Promise.reject(error)
  }
)

// API functions
export const searchApi = {
  search: (query: string, params?: Record<string, unknown>) =>
    api.post('/search', { query, ...params }),
  suggestions: (q: string) => api.get('/search/suggestions', { params: { q } }),
}

export const problemsApi = {
  list: (params?: Record<string, unknown>) => api.get('/problems', { params }),
  get: (id: number) => api.get(`/problems/${id}`),
  getBySlug: (slug: string) => api.get(`/problems/slug/${slug}`),
}

export const solutionsApi = {
  list: (params?: Record<string, unknown>) => api.get('/solutions', { params }),
  get: (id: number) => api.get(`/solutions/${id}`),
  create: (data: Record<string, unknown>) => api.post('/solutions', data),
  vote: (id: number, value: number) =>
    api.post(`/solutions/${id}/vote`, null, { params: { value } }),
}

export const usersApi = {
  list: (params?: Record<string, unknown>) => api.get('/users', { params }),
  get: (id: number) => api.get(`/users/${id}`),
  getByUsername: (username: string) => api.get(`/users/username/${username}`),
  topUsers: (limit?: number) => api.get('/users/leaderboard/top', { params: { limit } }),
}

export const benchmarksApi = {
  getSolutionBenchmarks: (solutionId: number) =>
    api.get(`/benchmarks/solution/${solutionId}`),
  compare: (solutionIds: number[]) =>
    api.get('/benchmarks/compare', { params: { solution_ids: solutionIds.join(',') } }),
}

export default api
