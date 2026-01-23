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
      // Don't redirect - let the app handle unauthenticated state gracefully
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

// API functions - NO trailing slashes (backend middleware handles normalization)
export const searchApi = {
  search: (query: string, params?: Record<string, unknown>) =>
    api.post('/search', { query, ...params }),
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
  updateMe: (data: { email?: string; avatar_url?: string }) =>
    api.patch('/users/me', data),
  getMyStats: () => api.get('/users/me/stats'),
}

export const benchmarksApi = {
  getSolutionBenchmarks: (solutionId: string) =>
    api.get(`/benchmarks/solution/${solutionId}`),
  compare: (solutionIds: string[], includeSolutions = false) =>
    api.get('/benchmarks/compare', {
      params: {
        solution_ids: solutionIds.join(','),
        include_solutions: includeSolutions
      }
    }),
  run: (solutionId: string, inputSizes?: number[]) =>
    api.post('/benchmarks/run', { solution_id: solutionId, input_sizes: inputSizes }),
  runAsync: (solutionId: string, inputSizes?: number[]) =>
    api.post('/benchmarks/run/async', { solution_id: solutionId, input_sizes: inputSizes }),
  getTaskStatus: (taskId: string) =>
    api.get(`/benchmarks/task/${taskId}`),
}

export const commentsApi = {
  getForSolution: (solutionId: string, page = 1, size = 20) =>
    api.get(`/comments/solution/${solutionId}`, { params: { page, size } }),
  create: (solutionId: string, content: string, parentId?: string) =>
    api.post('/comments', { solution_id: solutionId, content, parent_id: parentId }),
  update: (commentId: string, content: string) =>
    api.patch(`/comments/${commentId}`, { content }),
  delete: (commentId: string) =>
    api.delete(`/comments/${commentId}`),
  vote: (commentId: string, value: number) =>
    api.post(`/comments/${commentId}/vote`, null, { params: { value } }),
}

export const playgroundApi = {
  analyze: (code: string, language: string) =>
    api.post('/playground/analyze', { code, language }),
}

export const authApi = {
  getGithubUrl: () => api.get<{ url: string }>('/auth/github'),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

export default api
