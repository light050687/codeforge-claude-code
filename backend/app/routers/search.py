import math
import re

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.solution import Solution
from app.models.problem import Problem
from app.schemas.search import SearchQuery, SearchResult, SearchResultItem
from app.services.embeddings import get_embedding, translate_query


# Common stop words to filter out when extracting keywords
STOP_WORDS = {'find', 'get', 'make', 'create', 'how', 'to', 'a', 'the', 'fast',
              'efficient', 'optimize', 'best', 'way', 'for', 'in', 'array', 'list',
              'algorithm', 'function', 'code', 'write', 'implement'}


def extract_primary_keyword(query: str) -> str:
    """Extract the most meaningful keyword from search query."""
    words = re.findall(r'\w+', query.lower())
    keywords = [w for w in words if w not in STOP_WORDS and len(w) > 2]
    if not keywords:
        return query.lower().split()[0] if query.split() else ""
    # Prefer longer keywords (more specific)
    return max(keywords, key=len)

router = APIRouter()


@router.post("/", response_model=SearchResult)
async def semantic_search(
    query: SearchQuery,
    db: AsyncSession = Depends(get_db),
):
    """
    Hybrid semantic search for solutions.

    Combines:
    - Vector embedding similarity (semantic meaning)
    - Problem title matching (exact relevance)
    - Speedup bonus (prefer faster solutions)
    """
    # Translate Russian terms to English for better embedding search
    translated_query = translate_query(query.query)

    # Generate embedding for the translated query
    query_embedding = await get_embedding(translated_query)

    # Extract primary keyword for title matching
    keyword = extract_primary_keyword(translated_query)

    # Minimum similarity threshold to filter out irrelevant results
    min_similarity = 0.20  # Lowered slightly to allow title matching to boost relevant results

    # Hybrid SQL query with embedding similarity + title matching
    sql = """
        SELECT
            s.id,
            s.title,
            s.code,
            s.language,
            s.speedup,
            s.memory_reduction,
            s.efficiency_score,
            s.badges,
            s.vote_count,
            s.created_at,
            COALESCE(u.username, 'anonymous') as author_username,
            p.id as problem_id,
            p.slug as problem_slug,
            p.title as problem_title,
            p.category as problem_category,
            1 - (s.embedding <=> :embedding) as embedding_sim,
            COALESCE(similarity(lower(p.title), lower(:query_text)), 0) as title_sim,
            CASE
                WHEN lower(p.title) LIKE '%' || :keyword || '%' THEN 0.30
                WHEN lower(p.slug) LIKE '%' || :keyword || '%' THEN 0.20
                ELSE 0.0
            END as keyword_bonus
        FROM solutions s
        LEFT JOIN users u ON s.author_id = u.id
        JOIN problems p ON s.problem_id = p.id
        WHERE s.embedding IS NOT NULL
        AND 1 - (s.embedding <=> :embedding) >= :min_similarity
    """

    params = {
        "embedding": str(query_embedding),
        "min_similarity": min_similarity,
        "query_text": translated_query,
        "keyword": keyword,
    }

    # Add filters
    if query.language:
        sql += " AND s.language = :language"
        params["language"] = query.language

    if query.category:
        sql += " AND p.category = :category"
        params["category"] = query.category

    if query.min_speedup:
        sql += " AND s.speedup >= :min_speedup"
        params["min_speedup"] = query.min_speedup

    # Fetch more results for Python-side re-ranking when using relevance sort
    fetch_limit = query.limit * 3 if query.sort.lower() == "relevance" else query.limit

    # Apply database-level sorting for non-relevance sorts
    if query.sort.lower() != "relevance":
        sort_mapping = {
            "speedup": "s.speedup DESC NULLS LAST",
            "votes": "s.vote_count DESC",
            "recent": "s.created_at DESC",
        }
        order_by = sort_mapping.get(query.sort.lower(), "embedding_sim DESC")
        sql += f" ORDER BY {order_by} LIMIT :limit OFFSET :offset"
        params["limit"] = query.limit
        params["offset"] = query.offset
    else:
        # For relevance sort, fetch more and re-rank in Python
        sql += " ORDER BY embedding_sim DESC LIMIT :limit"
        params["limit"] = fetch_limit

    result = await db.execute(text(sql), params)
    rows = result.fetchall()

    # Build items with hybrid scoring
    scored_items = []
    for row in rows:
        # Calculate hybrid final score for relevance sorting
        # Weights: embedding 45%, title match 35%, speedup 20%
        embedding_sim = float(row.embedding_sim)
        title_sim = float(row.title_sim)
        keyword_bonus = float(row.keyword_bonus)
        speedup_norm = math.log10(max(row.speedup or 1, 1)) / 3.0  # Normalize: 10x=0.33, 100x=0.67, 1000x=1.0

        final_score = (
            embedding_sim * 0.45 +
            title_sim * 0.35 +
            keyword_bonus +
            speedup_norm * 0.20
        )

        item = SearchResultItem(
            id=str(row.id),
            title=row.title,
            code_preview=row.code[:200] + "..." if len(row.code) > 200 else row.code,
            language=row.language,
            speedup=row.speedup,
            memory_reduction=row.memory_reduction,
            efficiency_score=row.efficiency_score,
            badges=row.badges or [],
            vote_count=row.vote_count,
            author_username=row.author_username,
            problem_id=str(row.problem_id),
            problem_slug=row.problem_slug,
            problem_title=row.problem_title,
            problem_category=row.problem_category,
            similarity_score=round(final_score, 3),  # Return hybrid score
        )
        scored_items.append((item, final_score))

    # Re-rank by hybrid score for relevance sort
    if query.sort.lower() == "relevance":
        scored_items.sort(key=lambda x: x[1], reverse=True)
        # Apply pagination after re-ranking
        scored_items = scored_items[query.offset:query.offset + query.limit]

    items = [item for item, _ in scored_items]

    return SearchResult(
        items=items,
        total=len(items),
        query=query.query,
    )


@router.get("/suggestions")
async def search_suggestions(
    q: str,
    limit: int = 5,
    db: AsyncSession = Depends(get_db),
):
    """Get search suggestions based on partial query."""
    # Simple full-text search for suggestions
    result = await db.execute(
        select(Problem.title)
        .where(Problem.title.ilike(f"%{q}%"))
        .limit(limit)
    )
    problems = result.scalars().all()

    result = await db.execute(
        select(Solution.title)
        .where(Solution.title.ilike(f"%{q}%"))
        .limit(limit)
    )
    solutions = result.scalars().all()

    return {
        "problems": problems,
        "solutions": solutions,
    }


@router.get("/by-category", response_model=SearchResult)
async def search_by_category(
    category: str,
    language: str | None = None,
    sort: str = "speedup",
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    """Get solutions filtered by category (no semantic search)."""
    sql = """
        SELECT
            s.id,
            s.title,
            s.code,
            s.language,
            s.speedup,
            s.memory_reduction,
            s.efficiency_score,
            s.badges,
            s.vote_count,
            s.created_at,
            COALESCE(u.username, 'anonymous') as author_username,
            p.id as problem_id,
            p.slug as problem_slug,
            p.title as problem_title,
            p.category as problem_category
        FROM solutions s
        LEFT JOIN users u ON s.author_id = u.id
        JOIN problems p ON s.problem_id = p.id
        WHERE p.category = :category
    """
    params: dict = {"category": category}

    if language:
        sql += " AND s.language = :language"
        params["language"] = language

    # Apply sorting
    sort_mapping = {
        "speedup": "s.speedup DESC NULLS LAST",
        "votes": "s.vote_count DESC",
        "recent": "s.created_at DESC",
        "relevance": "s.speedup DESC NULLS LAST",  # Default to speedup for category search
    }
    order_by = sort_mapping.get(sort.lower(), "s.speedup DESC NULLS LAST")
    sql += f" ORDER BY {order_by} LIMIT :limit OFFSET :offset"
    params["limit"] = limit
    params["offset"] = offset

    result = await db.execute(text(sql), params)
    rows = result.fetchall()

    # Count total
    count_sql = """
        SELECT COUNT(*) FROM solutions s
        JOIN problems p ON s.problem_id = p.id
        WHERE p.category = :category
    """
    if language:
        count_sql += " AND s.language = :language"

    count_result = await db.execute(text(count_sql), {"category": category, "language": language} if language else {"category": category})
    total = count_result.scalar() or 0

    items = []
    for row in rows:
        items.append(SearchResultItem(
            id=str(row.id),
            title=row.title,
            code_preview=row.code[:200] + "..." if len(row.code) > 200 else row.code,
            language=row.language,
            speedup=row.speedup,
            memory_reduction=row.memory_reduction,
            efficiency_score=row.efficiency_score,
            badges=row.badges or [],
            vote_count=row.vote_count,
            author_username=row.author_username,
            problem_id=str(row.problem_id),
            problem_slug=row.problem_slug,
            problem_title=row.problem_title,
            problem_category=row.problem_category,
            similarity_score=None,
        ))

    return SearchResult(
        items=items,
        total=total,
        query=f"category:{category}",
    )
