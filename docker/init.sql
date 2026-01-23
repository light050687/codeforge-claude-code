-- CodeForge Database Initialization
-- This script runs on first docker-compose up

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create enum types
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE language_type AS ENUM (
    'python', 'javascript', 'typescript', 'go', 'rust', 
    'cpp', 'c', 'java', 'csharp', 'ruby', 'php', 
    'swift', 'kotlin', 'scala', 'haskell', 'lua'
);
CREATE TYPE category_type AS ENUM (
    'sorting', 'searching', 'graphs', 'strings', 'math',
    'data_structures', 'io', 'memory', 'crypto', 'ml'
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar_url TEXT,
    oauth_provider VARCHAR(20),
    oauth_id VARCHAR(255),
    github_access_token VARCHAR(255),
    score INTEGER DEFAULT 0,
    solutions_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    category category_type NOT NULL,
    difficulty difficulty_level DEFAULT 'medium',
    baseline_code TEXT NOT NULL,
    baseline_language language_type NOT NULL,
    baseline_complexity_time VARCHAR(50),
    baseline_complexity_space VARCHAR(50),
    test_cases JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Solutions table
CREATE TABLE solutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    problem_id UUID REFERENCES problems(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    language language_type NOT NULL,
    complexity_time VARCHAR(50),
    complexity_space VARCHAR(50),
    tags TEXT[] DEFAULT '{}',
    embedding vector(768),
    search_vector tsvector,
    is_verified BOOLEAN DEFAULT FALSE,
    vote_count INTEGER DEFAULT 0,
    speedup FLOAT,
    -- Versioning
    version INTEGER DEFAULT 1,
    parent_version_id UUID REFERENCES solutions(id) ON DELETE SET NULL,
    version_notes TEXT,
    -- Code quality metrics
    memory_reduction FLOAT,
    efficiency_score FLOAT,
    readability_score FLOAT,
    lines_of_code INTEGER,
    cyclomatic_complexity INTEGER,
    dependencies TEXT[] DEFAULT '{}',
    has_external_deps BOOLEAN DEFAULT FALSE,
    badges TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Benchmarks table
CREATE TABLE benchmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
    hardware_profile VARCHAR(50) DEFAULT 'standard',
    input_size INTEGER NOT NULL,
    execution_time_ms FLOAT NOT NULL,
    memory_bytes BIGINT,
    runs_count INTEGER DEFAULT 10,
    baseline_time_ms FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Votes table
CREATE TABLE votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    solution_id UUID REFERENCES solutions(id) ON DELETE CASCADE,
    value INTEGER CHECK (value IN (-1, 1)),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, solution_id)
);

-- Solution comments table
CREATE TABLE solution_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solution_id UUID NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES solution_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics: Page views
CREATE TABLE page_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    path VARCHAR(500) NOT NULL,
    referrer VARCHAR(500),
    user_agent TEXT,
    ip_hash VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics: Search queries
CREATE TABLE search_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    filters JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_solutions_embedding ON solutions 
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_solutions_search ON solutions USING gin(search_vector);
CREATE INDEX idx_solutions_language ON solutions(language);
CREATE INDEX idx_solutions_problem ON solutions(problem_id);
CREATE INDEX idx_solutions_author ON solutions(author_id);
CREATE INDEX idx_solutions_votes ON solutions(vote_count DESC);
CREATE INDEX idx_solutions_speedup ON solutions(speedup DESC NULLS LAST);
CREATE INDEX idx_benchmarks_solution ON benchmarks(solution_id);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_score ON users(score DESC);
CREATE INDEX idx_problems_slug ON problems(slug);
CREATE INDEX idx_problems_category ON problems(category);
CREATE INDEX idx_problems_title_trgm ON problems USING gin(title gin_trgm_ops);

-- Comments indexes
CREATE INDEX idx_comments_solution ON solution_comments(solution_id);
CREATE INDEX idx_comments_author ON solution_comments(author_id);
CREATE INDEX idx_comments_parent ON solution_comments(parent_id);

-- Analytics indexes
CREATE INDEX idx_pageviews_path ON page_views(path);
CREATE INDEX idx_pageviews_created ON page_views(created_at);
CREATE INDEX idx_search_queries_created ON search_queries(created_at);

-- Trigger to update search_vector
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.title, '') || ' ' || 
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(array_to_string(NEW.tags, ' '), '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER solutions_search_vector_update
    BEFORE INSERT OR UPDATE ON solutions
    FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- Trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_timestamp
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_problems_timestamp
    BEFORE UPDATE ON problems
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_solutions_timestamp
    BEFORE UPDATE ON solutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert seed data (sample problem and baseline)
INSERT INTO problems (title, slug, description, category, difficulty, baseline_code, baseline_language, baseline_complexity_time, baseline_complexity_space) VALUES
('Find Duplicate Elements',
 'find-duplicate-elements',
 'Given an array of integers, return a list of all elements that appear more than once.',
 'searching',
 'easy',
 E'def find_duplicates(arr):\n    """Find duplicates using nested loops - O(n²)"""\n    duplicates = []\n    for i in range(len(arr)):\n        for j in range(i + 1, len(arr)):\n            if arr[i] == arr[j] and arr[i] not in duplicates:\n                duplicates.append(arr[i])\n    return duplicates',
 'python',
 'O(n²)',
 'O(n)'
),
('Sort Large Array',
 'sort-large-array',
 'Sort an array of integers efficiently.',
 'sorting',
 'medium',
 E'def bubble_sort(arr):\n    """Bubble sort - O(n²)"""\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr',
 'python',
 'O(n²)',
 'O(1)'
),
('Find Shortest Path',
 'find-shortest-path',
 'Find the shortest path between two nodes in a weighted graph.',
 'graphs',
 'hard',
 E'def shortest_path_bfs(graph, start, end):\n    """BFS for unweighted graphs - not optimal for weighted"""\n    from collections import deque\n    queue = deque([(start, [start])])\n    visited = set()\n    while queue:\n        node, path = queue.popleft()\n        if node == end:\n            return path\n        if node in visited:\n            continue\n        visited.add(node)\n        for neighbor in graph.get(node, []):\n            queue.append((neighbor, path + [neighbor]))\n    return None',
 'python',
 'O(V + E)',
 'O(V)'
);

-- Done
SELECT 'Database initialized successfully!' as status;
