"""
Playground router for code analysis and optimization.
"""

import re
from dataclasses import dataclass
from fastapi import APIRouter
from pydantic import BaseModel
from sqlalchemy import text

from app.database import async_session
from app.services.embeddings import get_embedding

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

    # General patterns
    if 'sort' in code_lower and ('for ' in code_lower or 'while ' in code_lower):
        suggestions.append("Sorting inside loop is expensive - consider sorting once")

    if not suggestions:
        suggestions.append("Code looks reasonably optimized")

    return suggestions


async def find_similar_solution(code: str, language: str) -> SimilarSolution | None:
    """Find similar optimized solution using semantic search."""
    try:
        embedding = await get_embedding(code)

        async with async_session() as db:
            # Find similar solutions with better speedup
            result = await db.execute(
                text("""
                    SELECT s.id, s.code, s.title, s.speedup,
                           s.complexity_time, s.complexity_space,
                           1 - (s.embedding <=> :embedding) as similarity
                    FROM solutions s
                    WHERE s.language = :language
                    AND s.speedup IS NOT NULL
                    AND s.speedup > 1
                    ORDER BY s.embedding <=> :embedding
                    LIMIT 1
                """),
                {"embedding": str(embedding), "language": language.lower()}
            )
            row = result.fetchone()

            if row and row.similarity > 0.5:  # Reasonable similarity threshold
                return SimilarSolution(
                    id=str(row.id),
                    code=row.code,
                    title=row.title,
                    speedup=row.speedup,
                    complexity_time=row.complexity_time,
                    complexity_space=row.complexity_space,
                )
    except Exception:
        pass

    return None


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_code(request: AnalyzeRequest):
    """
    Analyze code and return optimization suggestions.

    Uses:
    - Heuristic pattern detection for anti-patterns
    - Semantic search to find similar optimized solutions
    """
    code = request.code
    language = request.language.lower()

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

    # No similar solution found - return analysis only
    # Apply simple optimizations based on patterns
    optimized_code = code
    estimated_speedup = 1.0

    # If we detected nested loops, estimate potential improvement
    if "O(n²)" in time_complexity or "O(n³)" in time_complexity:
        estimated_speedup = 10.0 if "O(n²)" in time_complexity else 100.0
        suggestions.append("Nested loops detected - consider hash-based O(n) approach")

    return AnalyzeResponse(
        optimized_code=optimized_code,
        speedup=estimated_speedup,
        complexity=ComplexityInfo(
            time=time_complexity,
            space=space_complexity,
        ),
        suggestions=suggestions,
    )
