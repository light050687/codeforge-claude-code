-- Migration 001: Add extended metrics, badges, and benchmark environments
-- Run this migration to upgrade existing database

-- Add new category types
DO $$
BEGIN
    -- Drop and recreate category_type to add new values
    -- Note: In production, you'd want to use ALTER TYPE ADD VALUE instead
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_type_new') THEN
        CREATE TYPE category_type_new AS ENUM (
            'sorting', 'searching', 'graphs', 'trees', 'dp', 'strings', 'arrays',
            'data_structures', 'math', 'geometry', 'statistics', 'io', 'memory',
            'concurrency', 'networking', 'crypto', 'ml', 'image', 'data_processing',
            'datetime', 'finance', 'validation', 'parsing'
        );
    END IF;
END $$;

-- Add optimization pattern type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'optimization_pattern_type') THEN
        CREATE TYPE optimization_pattern_type AS ENUM (
            'memoization', 'dp', 'divide_conquer', 'early_exit', 'batching',
            'lazy', 'parallel', 'vectorized', 'caching', 'precompute',
            'streaming', 'pooling', 'compression', 'indexing'
        );
    END IF;
END $$;

-- Add badge type
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'badge_type') THEN
        CREATE TYPE badge_type AS ENUM (
            'fastest', 'memory', 'balanced', 'readable', 'zero_deps',
            'parallel', 'production', 'elegant'
        );
    END IF;
END $$;

-- =====================================================
-- BENCHMARK ENVIRONMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS benchmark_environments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,

    -- Python environment
    python_version VARCHAR(20) NOT NULL,
    python_implementation VARCHAR(20) DEFAULT 'CPython',

    -- Hardware
    cpu_model VARCHAR(200),
    cpu_cores INTEGER,
    ram_gb INTEGER,

    -- OS
    os_name VARCHAR(50),
    os_version VARCHAR(50),

    -- Docker/container info
    container_image VARCHAR(200),
    container_memory_limit_mb INTEGER,
    container_cpu_limit FLOAT,

    -- Configuration
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD NEW COLUMNS TO SOLUTIONS
-- =====================================================

-- Optimization patterns
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS optimization_patterns TEXT[] DEFAULT '{}';

-- Speed metrics
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS avg_execution_time_ms FLOAT;

-- Memory metrics
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS memory_reduction FLOAT;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS avg_memory_bytes BIGINT;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS peak_memory_bytes BIGINT;

-- Combined score
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS efficiency_score FLOAT;

-- Code quality metrics
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS readability_score FLOAT;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS lines_of_code INTEGER;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS cyclomatic_complexity INTEGER;

-- Dependencies
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS dependencies TEXT[] DEFAULT '{}';
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS has_external_deps BOOLEAN DEFAULT FALSE;

-- Badges
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- Benchmark info
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS last_benchmark_at TIMESTAMPTZ;
ALTER TABLE solutions ADD COLUMN IF NOT EXISTS benchmark_environment JSONB;

-- =====================================================
-- ADD NEW COLUMNS TO BENCHMARKS
-- =====================================================

-- Environment reference
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES benchmark_environments(id);

-- Input configuration
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS input_type VARCHAR(50);
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS input_data_hash VARCHAR(64);

-- Extended time metrics
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS execution_time_min_ms FLOAT;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS execution_time_max_ms FLOAT;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS execution_time_std_ms FLOAT;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS speedup FLOAT;

-- Memory metrics
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS memory_peak_bytes BIGINT;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS memory_allocated_bytes BIGINT;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS baseline_memory_bytes BIGINT;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS memory_reduction FLOAT;

-- Run info
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS warmup_runs INTEGER DEFAULT 3;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS timeout_ms INTEGER;

-- Status
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS success BOOLEAN DEFAULT TRUE;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS output_correct BOOLEAN;

-- Raw results
ALTER TABLE benchmarks ADD COLUMN IF NOT EXISTS raw_results JSONB;

-- =====================================================
-- CREATE NEW INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_solutions_memory_reduction ON solutions(memory_reduction DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_solutions_efficiency ON solutions(efficiency_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_solutions_badges ON solutions USING gin(badges);
CREATE INDEX IF NOT EXISTS idx_benchmarks_environment ON benchmarks(environment_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_input_size ON benchmarks(input_size);

-- =====================================================
-- INSERT DEFAULT BENCHMARK ENVIRONMENT
-- =====================================================

INSERT INTO benchmark_environments (name, python_version, python_implementation, os_name, description)
VALUES (
    'standard-python311',
    '3.11',
    'CPython',
    'Linux',
    'Standard benchmark environment: Python 3.11 on Linux container'
) ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- FUNCTION TO AUTO-CALCULATE BADGES
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_solution_badges(p_problem_id UUID)
RETURNS void AS $$
DECLARE
    fastest_id UUID;
    memory_best_id UUID;
    balanced_id UUID;
    readable_id UUID;
BEGIN
    -- Find fastest solution for this problem
    SELECT id INTO fastest_id
    FROM solutions
    WHERE problem_id = p_problem_id AND speedup IS NOT NULL
    ORDER BY speedup DESC
    LIMIT 1;

    -- Find best memory solution
    SELECT id INTO memory_best_id
    FROM solutions
    WHERE problem_id = p_problem_id AND memory_reduction IS NOT NULL
    ORDER BY memory_reduction DESC
    LIMIT 1;

    -- Find most balanced (highest efficiency_score)
    SELECT id INTO balanced_id
    FROM solutions
    WHERE problem_id = p_problem_id AND efficiency_score IS NOT NULL
    ORDER BY efficiency_score DESC
    LIMIT 1;

    -- Find most readable
    SELECT id INTO readable_id
    FROM solutions
    WHERE problem_id = p_problem_id AND readability_score IS NOT NULL
    ORDER BY readability_score DESC
    LIMIT 1;

    -- Clear existing badges for this problem's solutions
    UPDATE solutions SET badges = '{}' WHERE problem_id = p_problem_id;

    -- Assign badges
    IF fastest_id IS NOT NULL THEN
        UPDATE solutions SET badges = array_append(badges, 'fastest') WHERE id = fastest_id;
    END IF;

    IF memory_best_id IS NOT NULL THEN
        UPDATE solutions SET badges = array_append(badges, 'memory') WHERE id = memory_best_id;
    END IF;

    IF balanced_id IS NOT NULL AND balanced_id != fastest_id AND balanced_id != memory_best_id THEN
        UPDATE solutions SET badges = array_append(badges, 'balanced') WHERE id = balanced_id;
    END IF;

    IF readable_id IS NOT NULL THEN
        UPDATE solutions SET badges = array_append(badges, 'readable') WHERE id = readable_id;
    END IF;

    -- Add zero_deps badge to solutions without external dependencies
    UPDATE solutions
    SET badges = array_append(badges, 'zero_deps')
    WHERE problem_id = p_problem_id
      AND has_external_deps = FALSE
      AND NOT ('zero_deps' = ANY(badges));
END;
$$ LANGUAGE plpgsql;

-- Done
SELECT 'Migration 001 completed successfully!' as status;
