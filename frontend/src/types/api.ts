// Enums matching backend PostgreSQL enums
export type Category =
  | 'sorting'
  | 'searching'
  | 'graphs'
  | 'trees'
  | 'dp'
  | 'strings'
  | 'arrays'
  | 'data_structures'
  | 'math'
  | 'geometry'
  | 'statistics'
  | 'io'
  | 'memory'
  | 'concurrency'
  | 'networking'
  | 'crypto'
  | 'ml'
  | 'image'
  | 'data_processing'
  | 'datetime'
  | 'finance'
  | 'validation'
  | 'parsing'

export type Difficulty = 'easy' | 'medium' | 'hard'

// Solution badges
export type SolutionBadge =
  | 'fastest'
  | 'memory'
  | 'balanced'
  | 'readable'
  | 'zero_deps'
  | 'parallel'
  | 'production'
  | 'elegant'

// Optimization patterns
export type OptimizationPattern =
  | 'memoization'
  | 'dp'
  | 'divide_conquer'
  | 'early_exit'
  | 'batching'
  | 'lazy'
  | 'parallel'
  | 'vectorized'
  | 'caching'
  | 'precompute'
  | 'streaming'
  | 'pooling'
  | 'compression'
  | 'indexing'

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
  slug: string
  title: string
  description: string | null
  category: Category
  difficulty: Difficulty
  baseline_code: string
  baseline_language: string
  baseline_complexity_time: string | null
  baseline_complexity_space: string | null
  test_cases: TestCase[] | null
  solutions_count: number
  created_at: string
}

export interface TestCase {
  input: unknown
  expected_output: unknown
  description?: string
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

  // Speed metrics
  speedup: number | null
  avg_execution_time_ms: number | null

  // Memory metrics
  memory_reduction: number | null
  avg_memory_bytes: number | null
  peak_memory_bytes: number | null

  // Combined score (0-100)
  efficiency_score: number | null

  // Code quality metrics
  readability_score: number | null
  lines_of_code: number | null
  cyclomatic_complexity: number | null

  // Dependencies
  dependencies: string[]
  has_external_deps: boolean

  // Patterns and tags
  tags: string[]
  optimization_patterns: OptimizationPattern[]

  // Badges
  badges: SolutionBadge[]

  // Verification and votes
  vote_count: number
  is_verified: boolean

  // Benchmark info
  last_benchmark_at: string | null
  benchmark_environment: BenchmarkEnvironment | null

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
  memory_reduction: number | null
  efficiency_score: number | null
  badges: SolutionBadge[]
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
  min_memory_reduction?: number
  badges?: SolutionBadge[]
  limit?: number
  offset?: number
  sort?: 'relevance' | 'speedup' | 'memory' | 'efficiency' | 'votes' | 'recent'
}

// Benchmark types
export interface BenchmarkEnvironment {
  id?: string
  name: string
  python_version: string
  python_implementation: string
  cpu_model: string | null
  cpu_cores: number | null
  ram_gb: number | null
  os_name: string | null
  os_version: string | null
  container_image: string | null
  container_memory_limit_mb: number | null
}

export interface BenchmarkResponse {
  id: string
  solution_id: string
  environment_id: string | null
  environment: BenchmarkEnvironment | null

  // Input configuration
  input_size: number
  input_type: string | null  // random, sorted, worst_case

  // Time metrics
  execution_time_ms: number
  execution_time_min_ms: number | null
  execution_time_max_ms: number | null
  execution_time_std_ms: number | null

  // Memory metrics
  memory_bytes: number | null
  memory_peak_bytes: number | null
  memory_allocated_bytes: number | null

  // Baseline comparison
  baseline_time_ms: number | null
  baseline_memory_bytes: number | null
  speedup: number | null
  memory_reduction: number | null

  // Run configuration
  runs_count: number
  warmup_runs: number | null
  timeout_ms: number | null

  // Status
  success: boolean
  error_message: string | null
  output_correct: boolean | null

  // Raw data
  raw_results: unknown | null

  created_at: string
}

// Playground types
export interface PlaygroundAnalysis {
  optimized_code: string
  speedup: number
  memory_reduction: number | null
  efficiency_score: number | null
  complexity: {
    time: string
    space: string
  }
  readability: {
    score: number
    lines_of_code: number
    cyclomatic_complexity: number
  }
  dependencies: string[]
  optimization_patterns: OptimizationPattern[]
  suggestions: string[]
  similar_solutions?: SearchResultItem[]
}

export interface AnalyzeRequest {
  code: string
  language: string
}

// Badge metadata for UI
export const BADGE_META: Record<SolutionBadge, { name: string; icon: string; color: string; description: string }> = {
  fastest: {
    name: 'Fastest',
    icon: '⚡',
    color: '#fbbf24',
    description: 'Best execution time in category'
  },
  memory: {
    name: 'Memory Efficient',
    icon: '💾',
    color: '#10b981',
    description: 'Best memory usage in category'
  },
  balanced: {
    name: 'Balanced',
    icon: '⚖️',
    color: '#6366f1',
    description: 'Best speed/memory trade-off'
  },
  readable: {
    name: 'Most Readable',
    icon: '📖',
    color: '#8b5cf6',
    description: 'Highest readability score'
  },
  zero_deps: {
    name: 'Zero Dependencies',
    icon: '📦',
    color: '#06b6d4',
    description: 'No external libraries required'
  },
  parallel: {
    name: 'Parallelizable',
    icon: '🔀',
    color: '#f97316',
    description: 'Can utilize multiple cores'
  },
  production: {
    name: 'Production Ready',
    icon: '✅',
    color: '#22c55e',
    description: 'Tested, secure, documented'
  },
  elegant: {
    name: 'Elegant',
    icon: '✨',
    color: '#ec4899',
    description: 'Community voted for elegance'
  },
}

// Optimization pattern metadata
export const PATTERN_META: Record<OptimizationPattern, { name: string; description: string }> = {
  memoization: { name: 'Memoization', description: 'Cache computed results' },
  dp: { name: 'Dynamic Programming', description: 'Break into subproblems' },
  divide_conquer: { name: 'Divide & Conquer', description: 'Split and merge' },
  early_exit: { name: 'Early Exit', description: 'Return early when possible' },
  batching: { name: 'Batching', description: 'Process items in batches' },
  lazy: { name: 'Lazy Evaluation', description: 'Compute only when needed' },
  parallel: { name: 'Parallelization', description: 'Use multiple threads/cores' },
  vectorized: { name: 'Vectorization', description: 'SIMD/numpy operations' },
  caching: { name: 'Caching', description: 'Store frequently accessed data' },
  precompute: { name: 'Precomputation', description: 'Calculate values upfront' },
  streaming: { name: 'Streaming', description: 'Process data in chunks' },
  pooling: { name: 'Object Pooling', description: 'Reuse allocated objects' },
  compression: { name: 'Compression', description: 'Reduce data size' },
  indexing: { name: 'Index Optimization', description: 'Use efficient data lookups' },
}

// Category metadata for UI
export const CATEGORY_META: Record<Category, { name: string; icon: string; description: string }> = {
  sorting: { name: 'Sorting', icon: '⬆️', description: 'Array and list sorting algorithms' },
  searching: { name: 'Searching', icon: '🔍', description: 'Search and lookup algorithms' },
  graphs: { name: 'Graphs', icon: '🌐', description: 'Graph traversal and algorithms' },
  trees: { name: 'Trees', icon: '🌲', description: 'Tree data structures and algorithms' },
  dp: { name: 'Dynamic Programming', icon: '📊', description: 'Optimization via subproblems' },
  strings: { name: 'Strings', icon: '📝', description: 'String manipulation and matching' },
  arrays: { name: 'Arrays', icon: '📋', description: 'Array operations and transformations' },
  data_structures: { name: 'Data Structures', icon: '🗂️', description: 'Custom data structure implementations' },
  math: { name: 'Math', icon: '🔢', description: 'Mathematical computations' },
  geometry: { name: 'Geometry', icon: '📐', description: 'Geometric calculations' },
  statistics: { name: 'Statistics', icon: '📈', description: 'Statistical analysis functions' },
  io: { name: 'I/O Optimization', icon: '⚡', description: 'File and network I/O' },
  memory: { name: 'Memory Management', icon: '💾', description: 'Memory-efficient operations' },
  concurrency: { name: 'Concurrency', icon: '🔀', description: 'Async, threading, parallelism' },
  networking: { name: 'Networking', icon: '🌍', description: 'Network operations' },
  crypto: { name: 'Cryptography', icon: '🔐', description: 'Encryption and hashing' },
  ml: { name: 'Machine Learning', icon: '🤖', description: 'ML algorithms and operations' },
  image: { name: 'Image Processing', icon: '🖼️', description: 'Image manipulation' },
  data_processing: { name: 'Data Processing', icon: '🔄', description: 'ETL and data transformations' },
  datetime: { name: 'Date & Time', icon: '📅', description: 'Date/time operations' },
  finance: { name: 'Finance', icon: '💰', description: 'Financial calculations' },
  validation: { name: 'Validation', icon: '✔️', description: 'Input validation and sanitization' },
  parsing: { name: 'Parsing', icon: '📄', description: 'Text and data parsing' },
}
