from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models.solution import Solution
from app.models.problem import Problem
from app.schemas.search import SearchQuery, SearchResult, SearchResultItem
from app.services.embeddings import get_embedding

router = APIRouter()


@router.post("/", response_model=SearchResult)
async def semantic_search(
    query: SearchQuery,
    db: AsyncSession = Depends(get_db),
):
    """Semantic search for solutions using natural language query."""
    # Generate embedding for the query
    query_embedding = await get_embedding(query.query)

    # Build query with vector similarity
    sql = """
        SELECT
            s.id,
            s.title,
            s.code,
            s.language,
            s.speedup,
            s.vote_count,
            COALESCE(u.username, 'anonymous') as author_username,
            p.title as problem_title,
            p.category as problem_category,
            1 - (s.embedding <=> :embedding) as similarity_score
        FROM solutions s
        LEFT JOIN users u ON s.author_id = u.id
        JOIN problems p ON s.problem_id = p.id
        WHERE s.embedding IS NOT NULL
    """

    params = {"embedding": str(query_embedding)}

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

    # Order by similarity and limit
    sql += " ORDER BY similarity_score DESC LIMIT :limit OFFSET :offset"
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
