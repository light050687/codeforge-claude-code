"""
Playground router for code analysis and optimization.
"""

import logging
import math
import re
from dataclasses import dataclass
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import text

from app.database import async_session
from app.services.embeddings import get_embedding
from app.limiter import limiter

logger = logging.getLogger(__name__)

router = APIRouter()


class AnalyzeRequest(BaseModel):
    code: str
    language: str


class ComplexityInfo(BaseModel):
    time: str
    space: str


class AnalyzeResponse(BaseModel):
    optimized_code: str
    speedup: float
    complexity: ComplexityInfo
    suggestions: list[str]


@dataclass
class SimilarSolution:
    """Simple data class for similar solution results."""
    id: str
    code: str
    title: str
    speedup: float
    complexity_time: str | None
    complexity_space: str | None


def normalize_code(code: str, language: str = "python") -> str:
    """
    Normalize code for better similarity comparison.
    Removes variable names, comments, whitespace differences.
    """
    normalized = code

    # Remove comments
    if language.lower() == "python":
        # Remove # comments
        normalized = re.sub(r'#.*$', '', normalized, flags=re.MULTILINE)
        # Remove docstrings
        normalized = re.sub(r'""".*?"""', '', normalized, flags=re.DOTALL)
        normalized = re.sub(r"'''.*?'''", '', normalized, flags=re.DOTALL)
    elif language.lower() in ["javascript", "typescript", "java", "c++", "go", "rust"]:
        # Remove // comments
        normalized = re.sub(r'//.*$', '', normalized, flags=re.MULTILINE)
        # Remove /* */ comments
        normalized = re.sub(r'/\*.*?\*/', '', normalized, flags=re.DOTALL)

    # Normalize whitespace
    normalized = re.sub(r'\s+', ' ', normalized)
    normalized = normalized.strip()

    # Convert to lowercase for comparison
    normalized = normalized.lower()

    return normalized


def calculate_code_similarity(code1: str, code2: str, language: str = "python") -> float:
    """
    Calculate similarity between two code snippets.
    Uses normalized Levenshtein-like comparison.
    """
    norm1 = normalize_code(code1, language)
    norm2 = normalize_code(code2, language)

    # Simple character-based similarity
    if not norm1 or not norm2:
        return 0.0

    # Calculate Jaccard similarity on tokens
    tokens1 = set(norm1.split())
    tokens2 = set(norm2.split())

    if not tokens1 or not tokens2:
        return 0.0

    intersection = len(tokens1 & tokens2)
    union = len(tokens1 | tokens2)

    return intersection / union if union > 0 else 0.0


def detect_complexity(code: str) -> tuple[str, str]:
    """Simple heuristic complexity detection."""
    code_lower = code.lower()

    # Detect nested loops
    nested_for = len(re.findall(r'for\s+.*?:\s*\n\s+for\s+', code, re.DOTALL))
    nested_while = len(re.findall(r'while\s+.*?:\s*\n\s+while\s+', code, re.DOTALL))
    nested_loops = nested_for + nested_while

    # Detect recursion
    func_match = re.search(r'def\s+(\w+)', code)
    is_recursive = False
    if func_match:
        func_name = func_match.group(1)
        is_recursive = code.count(func_name) > 1

    # Time complexity heuristics
    if nested_loops >= 2:
        time_complexity = "O(n³)"
    elif nested_loops == 1:
        time_complexity = "O(n²)"
    elif 'sort' in code_lower or is_recursive:
        time_complexity = "O(n log n)"
    elif any(kw in code_lower for kw in ['for ', 'while ', '.map(', '.filter(']):
        time_complexity = "O(n)"
    else:
        time_complexity = "O(1)"

    # Space complexity heuristics
    if any(kw in code_lower for kw in ['copy()', 'deepcopy', '[:]', 'list(', 'dict(']):
        space_complexity = "O(n)"
    elif is_recursive:
        space_complexity = "O(n)"  # call stack
    else:
        space_complexity = "O(1)"

    return time_complexity, space_complexity


def analyze_patterns(code: str, language: str) -> list[str]:
    """Detect anti-patterns and suggest optimizations."""
    suggestions = []
    code_lower = code.lower()

    # Python-specific patterns
    if language.lower() == 'python':
        # Nested loops with list lookup
        if 'for ' in code and ' in ' in code and 'if ' in code and ' in ' in code:
            if '.count(' not in code and 'set(' not in code:
                suggestions.append("Use set for O(1) lookup instead of list")

        # range(len()) anti-pattern
        if 'range(len(' in code:
            suggestions.append("Use enumerate() instead of range(len())")

        # String concatenation in loop
        if ('for ' in code or 'while ' in code) and '+=' in code and ('"' in code or "'" in code):
            suggestions.append("Use ''.join() for string concatenation")

        # Multiple list.count() calls
        if code.count('.count(') > 1:
            suggestions.append("Use collections.Counter instead of multiple count() calls")

        # Nested for loops
        if code.count('for ') > 1:
            suggestions.append("Consider hash-based approach to reduce nested loops")

        # List comprehension opportunity
        if re.search(r'for\s+\w+\s+in\s+.*:\s*\n\s+\w+\.append\(', code):
            suggestions.append("Consider using list comprehension for better performance")

        # Dictionary get with default
        if re.search(r'if\s+\w+\s+in\s+\w+:\s*\n.*else:', code) and 'dict' in code_lower:
            suggestions.append("Use dict.get(key, default) instead of if-else")

        # Multiple if instead of elif
        if code.count('\nif ') > 2 and 'elif' not in code:
            suggestions.append("Consider using elif for mutually exclusive conditions")

    # JavaScript-specific patterns
    elif language.lower() in ['javascript', 'js', 'typescript', 'ts']:
        if '.forEach(' in code and ('push' in code or 'result' in code):
            suggestions.append("Use .map() or .reduce() instead of forEach with mutation")

        if 'var ' in code:
            suggestions.append("Use const/let instead of var for block scoping")

        if '== ' in code and '===' not in code:
            suggestions.append("Use === for strict equality comparison")

        if '.indexOf(' in code and ' !== -1' in code:
            suggestions.append("Use .includes() for cleaner array membership check")

    # Go-specific patterns
    elif language.lower() in ['go', 'golang']:
        if 'append(' in code and 'for ' in code:
            suggestions.append("Pre-allocate slice capacity with make() for known sizes")

        if 'string(' in code and 'for ' in code:
            suggestions.append("Use strings.Builder for string concatenation in loops")

    # Rust-specific patterns
    elif language.lower() in ['rust', 'rs']:
        if '.clone()' in code:
            suggestions.append("Avoid unnecessary .clone() - consider borrowing")

        if 'unwrap()' in code:
            suggestions.append("Handle errors properly instead of using unwrap()")

    # General patterns
    if 'sort' in code_lower and ('for ' in code_lower or 'while ' in code_lower):
        suggestions.append("Sorting inside loop is expensive - consider sorting once")

    if not suggestions:
        suggestions.append("Code looks reasonably optimized")

    return suggestions


def generate_optimized_code(code: str, language: str) -> tuple[str, float]:
    """
    Apply automatic optimizations to code based on detected patterns.
    Returns (optimized_code, estimated_speedup).
    """
    optimized = code
    speedup_multiplier = 1.0

    if language.lower() == 'python':
        # Replace range(len()) with enumerate()
        pattern = r'for\s+(\w+)\s+in\s+range\(len\((\w+)\)\):'
        if re.search(pattern, optimized):
            optimized = re.sub(
                pattern,
                r'for \1, item in enumerate(\2):',
                optimized
            )
            speedup_multiplier *= 1.1

        # Replace nested loop membership check with set
        # Pattern: for x in list1: for y in list2: if x == y
        if re.search(r'for\s+\w+\s+in\s+\w+:\s*\n\s+for\s+\w+\s+in\s+\w+:', optimized):
            # Add set conversion suggestion in comments
            lines = optimized.split('\n')
            if lines and 'set(' not in optimized:
                lines.insert(0, "# Optimization: Convert inner list to set for O(1) lookup")
                optimized = '\n'.join(lines)
                speedup_multiplier *= 10.0  # O(n²) -> O(n)

        # Replace string += with list append + join
        if re.search(r'(\w+)\s*\+=\s*["\']', optimized) and 'for ' in optimized:
            # Add optimization hint
            if '# Optimization' not in optimized:
                lines = optimized.split('\n')
                lines.insert(0, "# Optimization: Use ''.join(parts) instead of string +=")
                optimized = '\n'.join(lines)
                speedup_multiplier *= 5.0

        # Replace multiple .count() with Counter
        if optimized.count('.count(') > 1:
            if 'from collections import Counter' not in optimized:
                lines = optimized.split('\n')
                lines.insert(0, "from collections import Counter")
                lines.insert(1, "# Use counter = Counter(items) then counter[x]")
                optimized = '\n'.join(lines)
                speedup_multiplier *= 3.0

    elif language.lower() in ['javascript', 'js', 'typescript', 'ts']:
        # Replace var with const/let
        optimized = re.sub(r'\bvar\s+', 'const ', optimized)

        # Replace == with ===
        optimized = re.sub(r'([^=!])===?([^=])', r'\1===\2', optimized)

        # Replace indexOf !== -1 with includes
        optimized = re.sub(
            r'(\w+)\.indexOf\(([^)]+)\)\s*!==?\s*-1',
            r'\1.includes(\2)',
            optimized
        )

        speedup_multiplier *= 1.2

    elif language.lower() in ['go', 'golang']:
        # Add capacity hint for slice append
        if 'append(' in optimized and 'make(' not in optimized:
            lines = optimized.split('\n')
            lines.insert(0, "// Optimization: Pre-allocate with make([]T, 0, expectedSize)")
            optimized = '\n'.join(lines)
            speedup_multiplier *= 2.0

    return optimized, speedup_multiplier


async def find_similar_solution(code: str, language: str) -> SimilarSolution | None:
    """
    Find similar optimized solution using semantic search + structural similarity.

    Strategy:
    1. Use embedding similarity to find candidates
    2. Apply structural similarity to re-rank
    3. Return the best match with highest speedup
    """
    try:
        embedding = await get_embedding(code)
    except Exception as e:
        logger.info(f"Embedding service unavailable, using heuristics only: {e}")
        return None

    try:
        async with async_session() as db:
            # Find top 30 similar solutions by embedding, including problem info for grouping
            result = await db.execute(
                text("""
                    SELECT s.id, s.code, s.title, s.speedup,
                           s.complexity_time, s.complexity_space,
                           p.id as problem_id, p.title as problem_title,
                           1 - (s.embedding <=> :embedding) as sim_score
                    FROM solutions s
                    JOIN problems p ON s.problem_id = p.id
                    WHERE s.language = :language
                    AND s.speedup IS NOT NULL
                    AND s.speedup > 1
                    AND 1 - (s.embedding <=> :embedding) > 0.2
                    ORDER BY s.embedding <=> :embedding
                    LIMIT 30
                """),
                {"embedding": str(embedding), "language": language.lower()}
            )
            rows = result.fetchall()

            if not rows:
                logger.info("No similar solutions found by embedding")
                return None

            # Group solutions by problem and find best solution per problem
            # Then pick the problem with highest average relevance
            problem_solutions: dict[str, list] = {}

            for row in rows:
                structural_sim = calculate_code_similarity(code, row.code, language)
                combined_sim = (row.sim_score * 0.70 + structural_sim * 0.30)

                # Logarithmic speedup bonus - no artificial cap
                speedup_bonus = math.log10(max(row.speedup, 1)) / 3.0
                final_score = combined_sim * (1 + speedup_bonus)

                logger.debug(
                    f"Candidate '{row.title}' (problem: {row.problem_title}): "
                    f"embed={row.sim_score:.2f}, struct={structural_sim:.2f}, "
                    f"speedup={row.speedup}x, final={final_score:.2f}"
                )

                if combined_sim > 0.20 or structural_sim > 0.4:
                    problem_id = str(row.problem_id)
                    if problem_id not in problem_solutions:
                        problem_solutions[problem_id] = []
                    problem_solutions[problem_id].append((row, final_score, combined_sim))

            if not problem_solutions:
                logger.info("No candidates passed similarity threshold")
                return None

            # For each problem, find the solution with highest speedup among good candidates
            # Then rank problems by their best candidate's combined_sim (relevance to input)
            best_per_problem = []
            for problem_id, candidates in problem_solutions.items():
                # Sort by combined_sim first, then by speedup
                candidates.sort(key=lambda x: (x[2], x[0].speedup or 0), reverse=True)
                best_relevance = candidates[0][2]  # highest combined_sim for this problem

                # Among solutions with similar relevance, pick highest speedup
                top_candidates = [c for c in candidates if c[2] >= best_relevance * 0.9]
                top_candidates.sort(key=lambda x: x[0].speedup or 0, reverse=True)

                best_solution = top_candidates[0]
                best_per_problem.append((best_solution[0], best_solution[1], best_relevance))

            # Sort problems by relevance (combined_sim of best candidate)
            best_per_problem.sort(key=lambda x: x[2], reverse=True)
            best_candidate = best_per_problem[0][0] if best_per_problem else None

            if best_candidate:
                best_score = best_per_problem[0][1] if best_per_problem else 0.0
                logger.info(
                    f"Found solution '{best_candidate.title}' with "
                    f"{best_candidate.speedup}x speedup (score: {best_score:.2f})"
                )
                return SimilarSolution(
                    id=str(best_candidate.id),
                    code=best_candidate.code,
                    title=best_candidate.title,
                    speedup=best_candidate.speedup,
                    complexity_time=best_candidate.complexity_time,
                    complexity_space=best_candidate.complexity_space,
                )

    except Exception as e:
        logger.warning(f"Database query for similar solutions failed: {e}")

    return None


@router.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit("20/minute")
async def analyze_code(request: Request, analyze_request: AnalyzeRequest):
    """
    Analyze code and return optimization suggestions.

    Uses:
    - Heuristic pattern detection for anti-patterns
    - Semantic search to find similar optimized solutions
    """
    try:
        code = analyze_request.code
        language = analyze_request.language.lower()

        # Detect current complexity
        time_complexity, space_complexity = detect_complexity(code)

        # Find optimization suggestions
        suggestions = analyze_patterns(code, language)

        # Try to find similar optimized solution
        similar = await find_similar_solution(code, language)

        if similar and similar.speedup:
            # Return the optimized version found
            return AnalyzeResponse(
                optimized_code=similar.code,
                speedup=similar.speedup,
                complexity=ComplexityInfo(
                    time=similar.complexity_time or "O(n)",
                    space=similar.complexity_space or "O(n)",
                ),
                suggestions=suggestions + [f"Found similar solution: {similar.title}"],
            )

        # No similar solution found - apply automatic optimizations
        optimized_code, estimated_speedup = generate_optimized_code(code, language)

        # If we detected nested loops, add estimate
        if "O(n²)" in time_complexity or "O(n³)" in time_complexity:
            base_speedup = 10.0 if "O(n²)" in time_complexity else 100.0
            estimated_speedup = max(estimated_speedup, base_speedup)
            if "Nested loops detected" not in str(suggestions):
                suggestions.append("Nested loops detected - consider hash-based O(n) approach")

        # Determine improved complexity if optimizations applied
        improved_time = time_complexity
        if estimated_speedup > 5:
            if time_complexity == "O(n²)":
                improved_time = "O(n)"
            elif time_complexity == "O(n³)":
                improved_time = "O(n²)"

        return AnalyzeResponse(
            optimized_code=optimized_code,
            speedup=round(estimated_speedup, 1),
            complexity=ComplexityInfo(
                time=improved_time if optimized_code != code else time_complexity,
                space=space_complexity,
            ),
            suggestions=suggestions,
        )
    except Exception as e:
        logger.error(f"Code analysis failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )
