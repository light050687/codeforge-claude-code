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
    score INTEGER DEFAULT 0,
    solutions_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problems table
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
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
INSERT INTO problems (title, description, category, difficulty, baseline_code, baseline_language, baseline_complexity_time, baseline_complexity_space) VALUES
('Find Duplicate Elements', 
 'Given an array of integers, return a list of all elements that appear more than once.',
 'searching',
 'easy',
 E'def find_duplicates(arr):\n    """Find duplicates using nested loops - O(n²)"""\n    duplicates = []\n    for i in range(len(arr)):\n        for j in range(i + 1, len(arr)):\n            if arr[i] == arr[j] and arr[i] not in duplicates:\n                duplicates.append(arr[i])\n    return duplicates',
 'python',
 'O(n²)',
 'O(n)'
),
('Sort Large Array',
 'Sort an array of integers efficiently.',
 'sorting',
 'medium',
 E'def bubble_sort(arr):\n    """Bubble sort - O(n²)"""\n    n = len(arr)\n    for i in range(n):\n        for j in range(0, n-i-1):\n            if arr[j] > arr[j+1]:\n                arr[j], arr[j+1] = arr[j+1], arr[j]\n    return arr',
 'python',
 'O(n²)',
 'O(1)'
),
('Find Shortest Path',
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
