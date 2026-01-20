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
    api.post('/search/', { query, ...params }),
  suggestions: (q: string) => api.get('/search/suggestions/', { params: { q } }),
}

export const problemsApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: any) => api.get('/problems/', { params }),
  get: (id: string) => api.get(`/problems/${id}/`),
  getBySlug: (slug: string) => api.get(`/problems/slug/${slug}/`),
}

export const solutionsApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: any) => api.get('/solutions/', { params }),
  get: (id: string) => api.get(`/solutions/${id}/`),
  create: (data: Record<string, unknown>) => api.post('/solutions/', data),
  vote: (id: string, value: number) =>
    api.post(`/solutions/${id}/vote/`, null, { params: { value } }),
}

export const usersApi = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  list: (params?: any) => api.get('/users/', { params }),
  get: (id: string) => api.get(`/users/${id}/`),
  getByUsername: (username: string) => api.get(`/users/username/${username}/`),
  topUsers: (limit?: number) => api.get('/users/leaderboard/top/', { params: { limit } }),
}

export const benchmarksApi = {
  getSolutionBenchmarks: (solutionId: string) =>
    api.get(`/benchmarks/solution/${solutionId}/`),
  compare: (solutionIds: string[]) =>
    api.get('/benchmarks/compare/', { params: { solution_ids: solutionIds.join(',') } }),
}

export const playgroundApi = {
  analyze: (code: string, language: string) =>
    api.post('/playground/analyze/', { code, language }),
}

export default api
