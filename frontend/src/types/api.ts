// Enums matching backend PostgreSQL enums
export type Category =
  | 'sorting'
  | 'searching'
  | 'graphs'
  | 'strings'
  | 'math'
  | 'data_structures'
  | 'io'
  | 'memory'
  | 'crypto'
  | 'ml'

export type Difficulty = 'easy' | 'medium' | 'hard'

// User types
export interface AuthorBrief {
  id: string
  username: string
  avatar_url: string | null
}

export interface UserResponse {
  id: string
  username: string
  email: string | null
  avatar_url: string | null
  score: number
  solutions_count: number
  created_at: string
}

export interface TopUsersResponse {
  users: UserResponse[]
  total: number
}

// Problem types
export interface ProblemResponse {
  id: string
  title: string
  description: string | null
  category: Category
  difficulty: Difficulty
  baseline_code: string
  baseline_language: string
  baseline_complexity_time: string | null
  baseline_complexity_space: string | null
  created_at: string
}

export interface ProblemList {
  items: ProblemResponse[]
  total: number
  page: number
  size: number
}

// Solution types
export interface SolutionResponse {
  id: string
  problem_id: string
  title: string
  code: string
  language: string
  description: string | null
  complexity_time: string | null
  complexity_space: string | null
  author: AuthorBrief | null
  speedup: number | null
  vote_count: number
  is_verified: boolean
  tags: string[]
  created_at: string
}

export interface SolutionList {
  items: SolutionResponse[]
  total: number
  page: number
  size: number
}

// Search types
export interface SearchResultItem {
  id: string
  title: string
  code_preview: string
  language: string
  speedup: number | null
  vote_count: number
  author_username: string
  problem_id: string
  problem_title: string
  problem_category: string
  similarity_score: number | null
}

export interface SearchResult {
  items: SearchResultItem[]
  total: number
  query: string
}

export interface SearchParams {
  query?: string
  language?: string
  category?: Category
  min_speedup?: number
  limit?: number
  offset?: number
  sort?: 'relevance' | 'speedup' | 'votes' | 'recent'
}

// Benchmark types
export interface BenchmarkResponse {
  id: string
  solution_id: string
  hardware_profile: string
  input_size: number
  execution_time_ms: number
  memory_bytes: number | null
  runs_count: number
  baseline_time_ms: number | null
  created_at: string
}

// Playground types
export interface PlaygroundAnalysis {
  optimized_code: string
  speedup: number
  complexity: {
    time: string
    space: string
  }
  suggestions: string[]
  similar_solutions?: SearchResultItem[]
}

export interface AnalyzeRequest {
  code: string
  language: string
}

// Category metadata for UI
export const CATEGORY_META: Record<Category, { name: string; icon: string }> = {
  sorting: { name: 'Sorting', icon: '⬆️' },
  searching: { name: 'Searching', icon: '🔍' },
  graphs: { name: 'Graphs', icon: '🌐' },
  strings: { name: 'Strings', icon: '📝' },
  math: { name: 'Math', icon: '🔢' },
  data_structures: { name: 'Data Structures', icon: '🗂️' },
  io: { name: 'I/O Optimization', icon: '⚡' },
  memory: { name: 'Memory Management', icon: '💾' },
  crypto: { name: 'Cryptography', icon: '🔐' },
  ml: { name: 'Machine Learning', icon: '🤖' },
}
