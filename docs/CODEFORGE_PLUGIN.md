# CodeForge Plugin - Proactive Code Intelligence

## Core Philosophy

**НЕ**: написал код → протестировал → нашёл узкие места → оптимизировал

**ДА**: планирую задачу → ищу лучший паттерн → **сразу пишу оптимальный код**

CodeForge **перехватывает процесс на этапе планирования** и инжектит лучшие решения ДО того, как Claude начнёт писать код.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    TRADITIONAL APPROACH                          │
│                                                                  │
│  User Request → Claude Plans → Writes Naive Code → Tests →      │
│  Finds Bottlenecks → Optimizes → Tests Again → Done             │
│                                                                  │
│  Problem: Wasted cycles, reactive optimization                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    CODEFORGE APPROACH                            │
│                                                                  │
│  User Request → CodeForge Intercepts → Analyzes Intent →        │
│  Searches Knowledge Base → Finds Best Patterns →                │
│  Injects Into Claude's Context → Claude Writes Optimal Code     │
│                                                                  │
│  Result: Best code from the start, no wasted iterations         │
└─────────────────────────────────────────────────────────────────┘
```

## Architecture

### Interception Layer

```
┌──────────────────────────────────────────────────────────────────┐
│                     USER PROMPT                                   │
│  "Write a function to find duplicates in large array"            │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   CODEFORGE INTERCEPTOR                          │
│                                                                  │
│  1. INTENT ANALYSIS                                              │
│     └─ Detects: "duplicate finding", "large array", "performance"│
│                                                                  │
│  2. KNOWLEDGE BASE SEARCH                                        │
│     └─ Query: find_duplicates + large_data + python              │
│     └─ Found: 5 patterns, best = Counter-based (234x faster)     │
│                                                                  │
│  3. CONTEXT INJECTION                                            │
│     └─ Adds to Claude's prompt:                                  │
│        "Use Counter-based approach for O(n) complexity.          │
│         Avoid nested loops. Reference implementation: ..."       │
└──────────────────────────────┬───────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE                                   │
│                                                                  │
│  Now writes optimal code FROM THE START because it has:          │
│  - Best known pattern                                            │
│  - Performance characteristics                                   │
│  - Reference implementation                                      │
└──────────────────────────────────────────────────────────────────┘
```

### Planning Phase Integration

When Claude Code creates a plan, CodeForge analyzes EACH step:

```
Original Plan:
┌────────────────────────────────────────┐
│ 1. Create data models                  │
│ 2. Implement search function           │  ← CodeForge: "Use binary search 
│ 3. Build API endpoint                  │     with bisect, 50x faster"
│ 4. Add caching                         │  ← CodeForge: "Use LRU with 
│ 5. Write tests                         │     functools, not manual dict"
└────────────────────────────────────────┘

Enhanced Plan (with CodeForge):
┌────────────────────────────────────────────────────────────────┐
│ 1. Create data models                                          │
│ 2. Implement search function                                   │
│    └─ [CODEFORGE] Use bisect.bisect_left for O(log n)         │
│    └─ [CODEFORGE] Pattern: optimized_binary_search_v3         │
│ 3. Build API endpoint                                          │
│ 4. Add caching                                                 │
│    └─ [CODEFORGE] Use @lru_cache(maxsize=1024)                │
│    └─ [CODEFORGE] Pattern: smart_caching_decorator            │
│ 5. Write tests                                                 │
└────────────────────────────────────────────────────────────────┘
```

## Knowledge Base

### Pattern Storage

```yaml
pattern:
  id: "fast_duplicate_finder_v3"
  name: "Counter-based Duplicate Finder"
  
  # What problem does this solve?
  intent:
    keywords: ["duplicate", "find", "array", "list", "repeated"]
    description: "Finding duplicate elements in a collection"
    
  # When to use this pattern
  conditions:
    - data_size: ">1000 elements"
    - data_type: "hashable items"
    - requirement: "find all duplicates"
    
  # The optimal implementation
  implementation:
    language: python
    code: |
      def find_duplicates(arr):
          from collections import Counter
          counts = Counter(arr)
          return [item for item, count in counts.items() if count > 1]
    
  # Performance characteristics
  performance:
    time_complexity: "O(n)"
    space_complexity: "O(n)"
    speedup_vs_naive: 234
    benchmark_data:
      - input_size: 10000
        naive_ms: 2340
        optimized_ms: 10
        
  # What NOT to do
  anti_patterns:
    - name: "nested_loop"
      why_bad: "O(n²) complexity, unusable for large data"
      code_smell: "for i in range... for j in range..."
```

### Intent Matching

CodeForge understands WHAT you want to do, not just keywords:

```python
# These all match "duplicate finding" pattern:

"find duplicates in array"           → fast_duplicate_finder
"get repeated elements"              → fast_duplicate_finder  
"which items appear more than once"  → fast_duplicate_finder
"remove unique, keep only dupes"     → fast_duplicate_finder
"найти повторяющиеся элементы"       → fast_duplicate_finder
```

## Prompt Injection

### How CodeForge Modifies Claude's Context

```
┌─────────────────────────────────────────────────────────────────┐
│ ORIGINAL USER PROMPT:                                           │
│ "Create a function to process large CSV and find duplicates"    │
└─────────────────────────────────────────────────────────────────┘

                    ↓ CodeForge Intercepts ↓

┌─────────────────────────────────────────────────────────────────┐
│ ENHANCED PROMPT (sent to Claude):                               │
│                                                                 │
│ [CODEFORGE CONTEXT - USE THESE PATTERNS]                        │
│                                                                 │
│ For CSV processing with large files:                            │
│ • Use pandas.read_csv(chunksize=10000) for memory efficiency   │
│ • Pattern: chunked_csv_processor (12x faster, 90% less memory) │
│                                                                 │
│ For finding duplicates:                                         │
│ • Use Counter-based approach, NOT nested loops                  │
│ • Pattern: fast_duplicate_finder (234x faster)                 │
│ • Reference: from collections import Counter                    │
│                                                                 │
│ Anti-patterns to AVOID:                                         │
│ • ❌ df.iterrows() - extremely slow                             │
│ • ❌ Nested loops for comparison                                │
│ • ❌ Loading entire file into memory                            │
│                                                                 │
│ [END CODEFORGE CONTEXT]                                         │
│                                                                 │
│ USER REQUEST:                                                   │
│ "Create a function to process large CSV and find duplicates"    │
└─────────────────────────────────────────────────────────────────┘
```

## MCP Tools

### `codeforge_plan_analyze`

Called automatically when Claude plans a task:

```json
{
  "plan_steps": [
    "Create user model",
    "Implement search",
    "Add pagination"
  ],
  "language": "python",
  "project_context": "FastAPI web service"
}
```

**Returns** enhanced plan with best patterns for each step.

### `codeforge_intent_search`

Searches knowledge base by intent:

```json
{
  "intent": "sort large dataset efficiently",
  "language": "python",
  "constraints": {
    "memory_limited": true,
    "data_size": "1GB+"
  }
}
```

**Returns** best matching patterns with implementations.

### `codeforge_get_pattern`

Gets specific pattern for immediate use:

```json
{
  "pattern_id": "fast_duplicate_finder_v3"
}
```

**Returns** full implementation ready to use.

### `codeforge_learn`

Stores new optimal pattern discovered during development:

```json
{
  "name": "parallel_json_parser",
  "intent": "parse large JSON files quickly",
  "implementation": "...",
  "benchmark_results": {...}
}
```

## Operating Modes

### Mode: `always` (Default)

Every Claude Code interaction goes through CodeForge:

```
1. User types request
2. CodeForge analyzes intent
3. CodeForge searches patterns
4. CodeForge injects context
5. Claude writes optimal code
```

**Overhead**: ~500ms for pattern search, minimal token increase

### Mode: `planning-only`

Only intercepts during planning phase:

```
1. User requests feature
2. Claude creates plan
3. CodeForge enhances plan with patterns
4. Claude executes with guidance
```

### Mode: `on-demand`

Manual activation:

```bash
/codeforge search "fast sorting for linked list"
/codeforge use pattern:timsort_linked
```

## Project RAG Integration

CodeForge indexes your entire project to:

1. **Understand existing patterns** - "You already use Counter in utils.py"
2. **Avoid duplication** - "Similar function exists at lib/helpers.py:45"
3. **Maintain consistency** - "Your project uses snake_case, not camelCase"
4. **Learn project-specific optimizations** - "Your custom cache is 3x faster for this use case"

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT INDEX                                 │
│                                                                 │
│  Patterns Found in Your Code:                                   │
│  ├─ utils/cache.py → custom_lru_cache (your implementation)    │
│  ├─ lib/search.py → binary_search_with_fallback                │
│  └─ core/data.py → chunked_processor                           │
│                                                                 │
│  When writing new code:                                         │
│  • Reuse YOUR proven patterns first                            │
│  • Fall back to global knowledge base                          │
│  • Suggest improvements to existing patterns                   │
└─────────────────────────────────────────────────────────────────┘
```

## Continuous Development Mode

For autonomous app development, CodeForge guides the entire process:

```
User: "Build a delivery service API"

CodeForge + Claude Code:

┌─ PHASE 1: PLANNING ─────────────────────────────────────────────┐
│                                                                 │
│ Plan created with 15 tasks                                     │
│ CodeForge found optimal patterns for 12/15 tasks               │
│                                                                 │
│ Task 3: "Implement geospatial search"                          │
│ └─ [CODEFORGE] Use R-tree index, not brute force               │
│ └─ Pattern: rtree_geo_search (500x faster for 10K+ points)     │
│                                                                 │
│ Task 7: "Order status updates"                                 │
│ └─ [CODEFORGE] Use event sourcing pattern                      │
│ └─ Pattern: event_sourcing_orders (better audit, undo support) │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─ PHASE 2: IMPLEMENTATION ───────────────────────────────────────┐
│                                                                 │
│ Writing: services/geo.py                                       │
│ [CODEFORGE ACTIVE] Using pattern: rtree_geo_search             │
│                                                                 │
│ → Optimal code written from start                              │
│ → No refactoring needed                                        │
│ → Tests included from pattern                                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Configuration

### `.codeforge.yml`

```yaml
codeforge:
  mode: always  # always | planning-only | on-demand
  
  # What to inject into prompts
  injection:
    patterns: true           # Include optimal patterns
    anti_patterns: true      # Warn about bad approaches
    project_context: true    # Reference existing code
    benchmarks: true         # Show performance data
    
  # Knowledge sources (priority order)
  knowledge:
    - source: project        # Your codebase first
      weight: 1.0
    - source: local_db       # Local pattern database
      weight: 0.8
    - source: codeforge_cloud  # Community patterns
      weight: 0.6
      
  # Intent matching sensitivity
  matching:
    threshold: 0.7           # Min similarity to suggest pattern
    max_suggestions: 3       # Patterns per intent
    
  # Learning
  learning:
    auto_learn: true         # Learn from your code
    min_speedup: 2.0         # Only learn if 2x+ faster
    require_tests: true      # Pattern must have tests
```

## Example Session

```
User: "Add a search feature to find products by name"

[CODEFORGE] Analyzing intent...
[CODEFORGE] Found 3 relevant patterns:
  1. fuzzy_search_trigram (handles typos, 95% accuracy)
  2. prefix_search_trie (instant autocomplete)  
  3. fulltext_search_postgres (best for large catalogs)

[CODEFORGE] Your project uses PostgreSQL → recommending #3

[CODEFORGE] Injecting context into Claude...

Claude: "I'll implement product search using PostgreSQL full-text search
with GIN indexes, which is optimal for your setup.

Based on CodeForge patterns, I'll:
1. Add GIN index on product names
2. Use ts_vector for efficient matching
3. Include trigram similarity for fuzzy matching

Here's the implementation..."

[Writes optimal code directly, no iteration needed]
```

## Key Differentiators

| Traditional | CodeForge |
|-------------|-----------|
| Write → Test → Find slow → Optimize | **Analyze → Find best → Write optimal** |
| Reactive optimization | **Proactive pattern injection** |
| Reinvent solutions | **Reuse proven patterns** |
| Learn after mistakes | **Know best practices upfront** |
| Manual research | **Automatic knowledge retrieval** |

---

## Scenario: No Pattern Found

When CodeForge doesn't have a known optimal solution:

```
┌─────────────────────────────────────────────────────────────────┐
│ User: "Implement custom sorting for linked list with metadata"  │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CODEFORGE INTERCEPTOR                          │
│                                                                 │
│  Intent: "sorting" + "linked list" + "metadata"                 │
│  Knowledge Base Search: ❌ No exact match found                  │
│  Similar patterns: 3 (but different context)                    │
│                                                                 │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                   CODEFORGE PROMPT                               │
│                                                                 │
│  ⚠️  No optimal pattern found for this task.                    │
│                                                                 │
│  Options:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [1] Generate & Benchmark Variants                        │   │
│  │     Create 10-20 different implementations,              │   │
│  │     benchmark each, select the fastest                   │   │
│  │     ⏱️ ~2-5 minutes                                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [2] Use Best Practices (Skip Optimization)               │   │
│  │     Write standard implementation now,                   │   │
│  │     optimize later with Post-Dev Optimizer               │   │
│  │     ⏱️ Immediate                                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ [3] Show Similar Patterns                                │   │
│  │     View 3 related patterns that might help              │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Option 1: Generate & Benchmark Variants

```
┌─────────────────────────────────────────────────────────────────┐
│                VARIANT GENERATION MODE                           │
│                                                                 │
│  Generating variants for: linked_list_metadata_sort             │
│                                                                 │
│  Strategy 1: Different algorithms                               │
│  ├─ Variant 1: Merge sort (recursive)                          │
│  ├─ Variant 2: Merge sort (iterative)                          │
│  ├─ Variant 3: Quick sort with random pivot                    │
│  ├─ Variant 4: Insertion sort (for small lists)                │
│  └─ Variant 5: Tim sort hybrid                                 │
│                                                                 │
│  Strategy 2: Different data handling                            │
│  ├─ Variant 6: Convert to array, sort, rebuild                 │
│  ├─ Variant 7: In-place pointer manipulation                   │
│  └─ Variant 8: Skip list intermediate structure                │
│                                                                 │
│  Strategy 3: Metadata-specific optimizations                    │
│  ├─ Variant 9: Cache comparison keys                           │
│  └─ Variant 10: Schwartzian transform                          │
│                                                                 │
│  [████████████████░░░░] 80% - Benchmarking...                  │
│                                                                 │
│  Results:                                                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 🥇 Variant 10: Schwartzian transform     │ 12.3x faster │   │
│  │ 🥈 Variant 6: Array conversion           │ 8.7x faster  │   │
│  │ 🥉 Variant 2: Merge sort iterative       │ 5.2x faster  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Use Winner] [Compare Top 3] [See All Results]                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**After selection:**
- Winner is used in code
- Pattern saved to Knowledge Base for future use
- Next time similar task → instant recommendation

---

## Post-Development Optimizer

Separate mode for analyzing already-written code.

### ⚠️ IMPORTANT: Real Profiling, Not Style Checking

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ❌ WRONG APPROACH (what we DON'T do)                          │
│   ────────────────────────────────────                          │
│   "This function uses list comprehension instead of map()"      │
│   "Variable name doesn't follow PEP8"                           │
│   "You should use enumerate() here"                             │
│                                                                 │
│   This is LINTING, not optimization!                            │
│                                                                 │
│   ✅ RIGHT APPROACH (what we DO)                                │
│   ──────────────────────────────                                │
│   "This function takes 340ms (profiled) and is called 10K/hour" │
│   "Memory spikes to 2GB here (measured)"                        │
│   "This loop is 89% of total execution time (traced)"           │
│                                                                 │
│   Real data from real profilers!                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Profiling Tools Used

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROFILING STACK                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  TIME PROFILING                                                 │
│  ├─ cProfile        - Built-in, function-level timing           │
│  ├─ py-spy          - Sampling profiler, no code changes        │
│  ├─ scalene         - CPU + memory + GPU, line-level            │
│  └─ pyinstrument    - Statistical profiler, call trees          │
│                                                                 │
│  MEMORY PROFILING                                               │
│  ├─ memory_profiler - Line-by-line memory usage                 │
│  ├─ tracemalloc     - Built-in, allocation tracking             │
│  ├─ objgraph        - Object reference graphs                   │
│  └─ fil-profile     - High-memory line attribution              │
│                                                                 │
│  TRACING                                                        │
│  ├─ viztracer       - Flame graphs, timeline                    │
│  ├─ austin          - Frame stack sampler                       │
│  └─ yappi           - Multi-threaded profiling                  │
│                                                                 │
│  BENCHMARKING                                                   │
│  ├─ pytest-benchmark - Comparative benchmarks                   │
│  ├─ pyperf          - Reliable micro-benchmarks                 │
│  └─ asv             - Airspeed Velocity, historical tracking    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### How Optimizer Finds Real Problems

```
/codeforge optimize --profile

┌─────────────────────────────────────────────────────────────────┐
│                   PROFILING PROJECT                              │
│                                                                 │
│  Step 1: Running test suite with profiler attached...           │
│          [████████████████████] 100%                            │
│                                                                 │
│  Step 2: Analyzing profile data...                              │
│          Total execution time: 45.3s                            │
│          Memory peak: 1.2GB                                     │
│                                                                 │
│  Step 3: Identifying hotspots...                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              REAL PERFORMANCE DATA (from profiler)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔥 HOTSPOTS BY TIME                                            │
│  ───────────────────────────────────────────────────────────    │
│  #  Function                      Time      %      Calls        │
│  ───────────────────────────────────────────────────────────    │
│  1  services/geo.py:find_nearest  12.4s    27.4%   45,230      │
│  2  utils/json.py:parse_response   8.2s    18.1%  102,445      │
│  3  db/queries.py:get_orders       5.1s    11.3%   12,033      │
│  4  api/serialize.py:to_dict       3.8s     8.4%   89,221      │
│  5  core/calc.py:distance          2.9s     6.4%  450,120      │
│  ───────────────────────────────────────────────────────────    │
│       Other (234 functions)       12.9s    28.4%                │
│                                                                 │
│  🧠 HOTSPOTS BY MEMORY                                          │
│  ───────────────────────────────────────────────────────────    │
│  #  Function                      Peak      Allocations         │
│  ───────────────────────────────────────────────────────────    │
│  1  utils/json.py:parse_response  890MB    12.3M objects       │
│  2  services/report.py:generate   340MB     2.1M objects       │
│  3  db/queries.py:get_all         210MB     0.8M objects       │
│  ───────────────────────────────────────────────────────────    │
│                                                                 │
│  Based on REAL profiler data, not style analysis!              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Iterative Optimization (Multiple Runs)

### Run Modes

```bash
# Single run (default)
/codeforge optimize

# Specific number of iterations
/codeforge optimize --iterations=5

# Run until stopped (Ctrl+C)
/codeforge optimize --continuous

# Run until no improvement found
/codeforge optimize --until-plateau
```

### Unique Variants Across Iterations

**CRITICAL**: Each iteration generates DIFFERENT variants, never repeating previous ones.

```
┌─────────────────────────────────────────────────────────────────┐
│                 ITERATION UNIQUENESS                             │
│                                                                 │
│  ITERATION 1 (--iterations=1)                                   │
│  ─────────────────────────────                                  │
│  Variants generated:                                            │
│  • Variant A: Counter-based        → 12x faster  ← WINNER      │
│  • Variant B: Set intersection     → 8x faster                 │
│  • Variant C: Sorting approach     → 3x faster                 │
│  • Variant D: NumPy unique         → 15x faster (needs numpy)  │
│  • Variant E: Dict comprehension   → 10x faster                │
│                                                                 │
│  Saved: A, B, C, D, E (all stored in history)                  │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ITERATION 2 (user runs again)                                  │
│  ─────────────────────────────                                  │
│  System knows: A, B, C, D, E already tried                     │
│                                                                 │
│  New variants (MUST be different):                              │
│  • Variant F: Cython typed         → 25x faster ← NEW WINNER   │
│  • Variant G: Bloom filter approx  → 50x faster (probabilistic)│
│  • Variant H: Parallel multiproc   → 18x faster                │
│  • Variant I: C extension          → 30x faster                │
│  • Variant J: PyPy optimized       → 20x faster                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ITERATION 3 (user runs again)                                  │
│  ─────────────────────────────                                  │
│  System knows: A, B, C, D, E, F, G, H, I, J already tried      │
│                                                                 │
│  New variants (exploring edge cases):                           │
│  • Variant K: SIMD vectorized      → 28x faster                │
│  • Variant L: Memory-mapped        → 22x faster (large files)  │
│  • Variant M: Generator-based      → 5x faster (low memory)    │
│  • Variant N: Rust binding         → 35x faster ← NEW WINNER   │
│  • Variant O: Hybrid adaptive      → 30x faster                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### How Uniqueness Is Enforced

```python
# Variant Generator uses "negative prompting"

prompt = f"""
Generate a NEW implementation for: {function_signature}

ALREADY TRIED (DO NOT REPEAT THESE APPROACHES):
{list_of_previous_variants}

Requirements for new variant:
- Must be fundamentally DIFFERENT from all above
- Can use different: algorithm, data structure, library, paradigm
- Explore: parallel, vectorized, native extensions, approximations

Generate implementation #{ len(previous) + 1 }:
"""
```

### Continuous Mode

```
/codeforge optimize --continuous

┌─────────────────────────────────────────────────────────────────┐
│                   CONTINUOUS OPTIMIZATION                        │
│                   Press Ctrl+C to stop                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Target: services/geo.py:find_nearest_driver()                 │
│  Current best: Variant A (12x faster)                          │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Iteration 1: 5 variants tested                                │
│  └─ Best: Variant A (12x) ✓                                    │
│                                                                 │
│  Iteration 2: 5 new variants tested                            │
│  └─ Best: Variant F (25x) ⬆️ NEW RECORD                         │
│                                                                 │
│  Iteration 3: 5 new variants tested                            │
│  └─ Best: Variant N (35x) ⬆️ NEW RECORD                         │
│                                                                 │
│  Iteration 4: 5 new variants tested                            │
│  └─ No improvement (best remains 35x)                          │
│                                                                 │
│  Iteration 5: 5 new variants tested                            │
│  └─ Variant Q (34x) - close but not better                     │
│                                                                 │
│  Iteration 6: 5 new variants tested                            │
│  └─ No improvement                                              │
│                                                                 │
│  ^C ← User stops                                                │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  SUMMARY                                                        │
│  • Iterations: 6                                                │
│  • Variants tested: 30 (all unique)                            │
│  • Best found: Variant N (35x faster)                          │
│  • Applied: Yes                                                 │
│  • Tests: All passing                                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Until-Plateau Mode

```
/codeforge optimize --until-plateau --plateau-threshold=3

┌─────────────────────────────────────────────────────────────────┐
│                   PLATEAU DETECTION                              │
│                                                                 │
│  Stops when: No improvement for 3 consecutive iterations       │
│                                                                 │
│  Iteration 1: Best = 12x                                       │
│  Iteration 2: Best = 25x  ⬆️                                    │
│  Iteration 3: Best = 35x  ⬆️                                    │
│  Iteration 4: Best = 35x  (no change) [1/3]                    │
│  Iteration 5: Best = 36x  ⬆️ (reset counter)                    │
│  Iteration 6: Best = 36x  (no change) [1/3]                    │
│  Iteration 7: Best = 36x  (no change) [2/3]                    │
│  Iteration 8: Best = 36x  (no change) [3/3]                    │
│                                                                 │
│  PLATEAU REACHED - Stopping                                     │
│  Final best: 36x faster                                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Variant History Storage

```sql
-- All variants are stored for future reference
CREATE TABLE variant_history (
    id UUID PRIMARY KEY,
    function_signature TEXT,
    iteration INTEGER,
    variant_code TEXT,
    variant_approach TEXT,      -- "counter-based", "cython", etc.
    speedup FLOAT,
    memory_change FLOAT,
    is_valid BOOLEAN,
    is_winner BOOLEAN,
    created_at TIMESTAMP,
    
    -- For uniqueness checking
    code_hash TEXT,             -- Hash of normalized code
    approach_embedding VECTOR   -- Semantic embedding of approach
);

-- Ensure no duplicate approaches
CREATE UNIQUE INDEX idx_unique_approach 
ON variant_history(function_signature, code_hash);
```

### Configuration

```yaml
codeforge:
  optimizer:
    # Profiling settings
    profiling:
      enabled: true
      tools:
        time: "py-spy"           # or cProfile, scalene
        memory: "memory_profiler"
        trace: "viztracer"
      min_time_threshold: 100    # ms - ignore faster functions
      min_memory_threshold: 50   # MB - ignore smaller allocations
      min_call_count: 100        # ignore rarely called functions
    
    # Iteration settings
    iterations:
      default: 1
      max: 100                   # safety limit for --continuous
      variants_per_iteration: 5
      
    # Uniqueness enforcement
    uniqueness:
      check_code_hash: true      # exact code match
      check_approach: true       # semantic similarity
      similarity_threshold: 0.8  # reject if >80% similar
      
    # Plateau detection
    plateau:
      enabled: true
      threshold: 3               # iterations without improvement
      min_improvement: 0.05      # 5% to count as improvement
```

### Optimizer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                   POST-DEVELOPMENT OPTIMIZER                     │
│                                                                 │
│  Scanning project: my-delivery-service/                         │
│  Files analyzed: 47                                             │
│  Functions found: 234                                           │
│                                                                 │
│  [████████████████████] 100% - Analysis complete                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   OPTIMIZATION OPPORTUNITIES                     │
│                                                                 │
│  Found 18 functions that can be optimized                       │
│                                                                 │
│  ══════════════════════════════════════════════════════════════ │
│  🔴 CRITICAL (P0) - High impact, frequently called              │
│  ══════════════════════════════════════════════════════════════ │
│                                                                 │
│  1. services/geo.py:find_nearest_driver()                       │
│     └─ Current: O(n²) brute force distance calculation          │
│     └─ Problem: Called 10K+ times/hour, 340ms avg               │
│     └─ Solution: R-tree spatial index                           │
│     └─ Expected improvement: ~500x faster                       │
│     [Optimize Now] [Show Variants] [Skip]                       │
│                                                                 │
│  2. services/orders.py:calculate_delivery_fee()                 │
│     └─ Current: Repeated API calls for distance                 │
│     └─ Problem: No caching, 200ms per call                      │
│     └─ Solution: LRU cache + batch geocoding                    │
│     └─ Expected improvement: ~50x faster (cache hits)           │
│     [Optimize Now] [Show Variants] [Skip]                       │
│                                                                 │
│  ══════════════════════════════════════════════════════════════ │
│  🟡 IMPORTANT (P1) - Medium impact                              │
│  ══════════════════════════════════════════════════════════════ │
│                                                                 │
│  3. utils/validation.py:validate_phone()                        │
│     └─ Current: Regex compiled on every call                    │
│     └─ Solution: Pre-compiled regex at module level             │
│     └─ Expected improvement: ~10x faster                        │
│     [Optimize Now] [Skip]                                       │
│                                                                 │
│  4. api/routes.py:serialize_order()                             │
│     └─ Current: Manual dict building                            │
│     └─ Solution: Pydantic with __slots__                        │
│     └─ Expected improvement: ~3x faster                         │
│     [Optimize Now] [Skip]                                       │
│                                                                 │
│  ... (5 more P1 items)                                          │
│                                                                 │
│  ══════════════════════════════════════════════════════════════ │
│  🟢 OPTIONAL (P2) - Low impact, nice to have                    │
│  ══════════════════════════════════════════════════════════════ │
│                                                                 │
│  9. helpers/formatters.py:format_currency()                     │
│     └─ Current: String concatenation                            │
│     └─ Solution: f-strings                                      │
│     └─ Expected improvement: ~1.5x faster                       │
│     [Optimize Now] [Skip]                                       │
│                                                                 │
│  ... (9 more P2 items)                                          │
│                                                                 │
│  ────────────────────────────────────────────────────────────── │
│  Summary: 2 Critical │ 7 Important │ 9 Optional                 │
│                                                                 │
│  [Optimize All Critical] [Optimize All] [Export Report]         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Priority Calculation

```python
Priority Score = (Impact × Frequency × Potential_Speedup) / Effort

Where:
- Impact = How critical is this function? (1-10)
- Frequency = Calls per hour from profiling/estimation
- Potential_Speedup = Expected improvement (2x, 10x, 100x)
- Effort = Complexity of optimization (1-10)

Example:
  find_nearest_driver():
  Impact=9, Frequency=10000, Speedup=500, Effort=3
  Score = (9 × 10000 × 500) / 3 = 15,000,000 → P0 Critical
  
  format_currency():
  Impact=2, Frequency=1000, Speedup=1.5, Effort=1
  Score = (2 × 1000 × 1.5) / 1 = 3,000 → P2 Optional
```

### Batch Optimization Mode

```
/codeforge optimize --auto --level=critical

┌─────────────────────────────────────────────────────────────────┐
│                   BATCH OPTIMIZATION                             │
│                                                                 │
│  Mode: Automatic                                                │
│  Level: Critical (P0) only                                      │
│                                                                 │
│  Processing 2 critical functions...                             │
│                                                                 │
│  [1/2] find_nearest_driver()                                    │
│        ├─ Generating variants... ✓                              │
│        ├─ Benchmarking... ✓                                     │
│        ├─ Best: R-tree index (487x faster)                      │
│        ├─ Running tests... ✓ (23/23 passed)                     │
│        └─ Applied ✓                                             │
│                                                                 │
│  [2/2] calculate_delivery_fee()                                 │
│        ├─ Generating variants... ✓                              │
│        ├─ Benchmarking... ✓                                     │
│        ├─ Best: LRU cache (52x faster)                          │
│        ├─ Running tests... ✓ (18/18 passed)                     │
│        └─ Applied ✓                                             │
│                                                                 │
│  ════════════════════════════════════════════════════════════   │
│  OPTIMIZATION COMPLETE                                          │
│                                                                 │
│  Functions optimized: 2                                         │
│  Total speedup: ~270x average                                   │
│  Tests passed: 41/41                                            │
│  Patterns learned: 2 (saved to Knowledge Base)                  │
│                                                                 │
│  [View Changes] [Run Full Test Suite] [Commit]                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Complete Workflow

```
┌─────────────────────────────────────────────────────────────────┐
│                    CODEFORGE COMPLETE FLOW                       │
│                                                                 │
│                                                                 │
│   ┌─────────────┐                                               │
│   │ User writes │                                               │
│   │   request   │                                               │
│   └──────┬──────┘                                               │
│          │                                                      │
│          ▼                                                      │
│   ┌─────────────────────────────────────────┐                   │
│   │        CodeForge Intercepts             │                   │
│   │         Analyzes intent                 │                   │
│   └──────────────────┬──────────────────────┘                   │
│                      │                                          │
│          ┌───────────┴───────────┐                              │
│          │                       │                              │
│          ▼                       ▼                              │
│   ┌─────────────┐         ┌─────────────┐                       │
│   │  Pattern    │         │ No Pattern  │                       │
│   │   Found     │         │   Found     │                       │
│   └──────┬──────┘         └──────┬──────┘                       │
│          │                       │                              │
│          ▼                       ▼                              │
│   ┌─────────────┐         ┌─────────────────────┐               │
│   │   Inject    │         │  Ask User:          │               │
│   │  context    │         │  [Generate Variants]│               │
│   │             │         │  [Use Best Practice]│               │
│   └──────┬──────┘         └──────────┬──────────┘               │
│          │                           │                          │
│          │               ┌───────────┴───────────┐              │
│          │               │                       │              │
│          │               ▼                       ▼              │
│          │        ┌─────────────┐         ┌─────────────┐       │
│          │        │  Generate   │         │   Write     │       │
│          │        │  & Benchmark│         │  Standard   │       │
│          │        │  Variants   │         │   Code      │       │
│          │        └──────┬──────┘         └──────┬──────┘       │
│          │               │                       │              │
│          │               ▼                       │              │
│          │        ┌─────────────┐                │              │
│          │        │ Select Best │                │              │
│          │        │ Save Pattern│                │              │
│          │        └──────┬──────┘                │              │
│          │               │                       │              │
│          └───────────────┴───────────────────────┘              │
│                          │                                      │
│                          ▼                                      │
│                   ┌─────────────┐                               │
│                   │ Claude Code │                               │
│                   │ writes code │                               │
│                   └──────┬──────┘                               │
│                          │                                      │
│                          ▼                                      │
│                   ┌─────────────┐                               │
│                   │  Optional:  │                               │
│                   │ Post-Dev    │                               │
│                   │ Optimizer   │                               │
│                   └─────────────┘                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## MCP Tools (Updated)

### Proactive Tools (Always-on)

| Tool | Description |
|------|-------------|
| `codeforge_intercept` | Analyzes user intent, searches KB |
| `codeforge_inject` | Adds pattern context to prompt |
| `codeforge_plan_enhance` | Enhances plan with patterns |

### Variant Generation Tools

| Tool | Description |
|------|-------------|
| `codeforge_generate_variants` | Creates N implementation variants |
| `codeforge_benchmark_variants` | Benchmarks all variants |
| `codeforge_select_best` | Selects and saves winner |

### Post-Development Tools

| Tool | Description |
|------|-------------|
| `codeforge_scan` | Scans project for optimization opportunities |
| `codeforge_prioritize` | Ranks functions by optimization priority |
| `codeforge_optimize_function` | Optimizes single function |
| `codeforge_optimize_batch` | Batch optimization by priority level |
| `codeforge_report` | Generates optimization report |

---

## Configuration (Updated)

```yaml
codeforge:
  mode: always
  
  # Proactive settings
  proactive:
    enabled: true
    auto_inject: true          # Inject patterns automatically
    
  # When no pattern found
  no_pattern_behavior:
    action: ask                 # ask | auto_generate | skip
    default_choice: generate    # If ask, pre-select this option
    variants_count: 15          # How many variants to generate
    benchmark_timeout: 60       # Seconds per variant
    
  # Post-development optimizer
  optimizer:
    scan_on_commit: false       # Auto-scan before git commit
    scan_schedule: null         # Cron expression for scheduled scans
    auto_apply:
      critical: false           # Auto-apply P0 optimizations
      important: false          # Auto-apply P1 optimizations
      optional: false           # Auto-apply P2 optimizations
    require_tests: true         # Only apply if tests pass
    
  # Priority thresholds
  priorities:
    critical:                   # P0
      min_frequency: 1000       # Calls per hour
      min_speedup: 10           # Expected improvement
    important:                  # P1
      min_frequency: 100
      min_speedup: 3
    optional:                   # P2
      min_frequency: 0
      min_speedup: 1.2
```

---

## Example: Full Session

```
# 1. User starts new feature
User: "Add real-time order tracking with location updates"

# 2. CodeForge intercepts, finds pattern for "real-time location"
[CODEFORGE] Found pattern: websocket_geo_streaming (5 optimizations)
[CODEFORGE] Injecting context...

# 3. But no pattern for "efficient location diff calculation"
[CODEFORGE] ⚠️ No pattern for: "calculate_location_change_significance"

  Options:
  [1] Generate & Benchmark Variants (recommended)
  [2] Use standard implementation, optimize later

User: 1

# 4. CodeForge generates variants
[CODEFORGE] Generating 12 variants...
[CODEFORGE] Benchmarking...
[CODEFORGE] 🏆 Winner: Haversine with early-exit (8.3x faster)
[CODEFORGE] Pattern saved: haversine_optimized_v1

# 5. Claude writes code with both patterns
Claude: "Implementing real-time tracking with:
- WebSocket streaming (from CodeForge pattern)
- Optimized Haversine for location diff (just benchmarked)"

# 6. Later, user runs post-dev optimizer
User: /codeforge optimize

[CODEFORGE] Scanning...
[CODEFORGE] Found 5 optimization opportunities:
  🔴 P0: 1 function (location serialization)
  🟡 P1: 2 functions
  🟢 P2: 2 functions

User: "Optimize critical"

[CODEFORGE] Optimizing location_to_dict()...
[CODEFORGE] ✓ Applied: msgpack serialization (23x faster)
```
