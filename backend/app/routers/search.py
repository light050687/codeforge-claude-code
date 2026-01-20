from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.solution import Solution
from app.models.problem import Problem
from app.schemas.search import SearchQuery, SearchResult, SearchResultItem
from app.services.embeddings import get_embedding, translate_query

router = APIRouter()


@router.post("/", response_model=SearchResult)
async def semantic_search(
    query: SearchQuery,
    db: AsyncSession = Depends(get_db),
):
    """Semantic search for solutions using natural language query."""
    # Translate Russian terms to English for better embedding search
    translated_query = translate_query(query.query)

    # Generate embedding for the translated query
    query_embedding = await get_embedding(translated_query)

    # Build query with vector similarity
    # Minimum similarity threshold to filter out irrelevant results
    min_similarity = 0.25

    sql = """
        SELECT
            s.id,
            s.title,
            s.code,
            s.language,
            s.speedup,
            s.vote_count,
            s.created_at,
            COALESCE(u.username, 'anonymous') as author_username,
            p.id as problem_id,
            p.title as problem_title,
            p.category as problem_category,
            1 - (s.embedding <=> :embedding) as similarity_score
        FROM solutions s
        LEFT JOIN users u ON s.author_id = u.id
        JOIN problems p ON s.problem_id = p.id
        WHERE s.embedding IS NOT NULL
        AND 1 - (s.embedding <=> :embedding) >= :min_similarity
    """

    params = {"embedding": str(query_embedding), "min_similarity": min_similarity}

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

    # Apply sorting
    sort_mapping = {
        "relevance": "similarity_score DESC",
        "speedup": "s.speedup DESC NULLS LAST",
        "votes": "s.vote_count DESC",
        "recent": "s.created_at DESC",
    }
    order_by = sort_mapping.get(query.sort.lower(), "similarity_score DESC")
    sql += f" ORDER BY {order_by} LIMIT :limit OFFSET :offset"
    params["limit"] = query.limit
    params["offset"] = query.offset

    result = await db.execute(text(sql), params)
    rows = result.fetchall()

    items = []
    for row in rows:
        items.append(SearchResultItem(
            id=str(row.id),
            title=row.title,
            code_preview=row.code[:200] + "..." if len(row.code) > 200 else row.code,
            language=row.language,
            speedup=row.speedup,
            vote_count=row.vote_count,
            author_username=row.author_username,
            problem_id=str(row.problem_id),
            problem_title=row.problem_title,
            problem_category=row.problem_category,
            similarity_score=row.similarity_score,
        ))

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
            s.vote_count,
            s.created_at,
            COALESCE(u.username, 'anonymous') as author_username,
            p.id as problem_id,
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
            vote_count=row.vote_count,
            author_username=row.author_username,
            problem_id=str(row.problem_id),
            problem_title=row.problem_title,
            problem_category=row.problem_category,
            similarity_score=None,
        ))

    return SearchResult(
        items=items,
        total=total,
        query=f"category:{category}",
    )
