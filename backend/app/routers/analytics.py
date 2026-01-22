"""
Analytics router for tracking and statistics.
"""
import hashlib
import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from pydantic import BaseModel

from app.database import get_db
from app.models.analytics import PageView, SearchQuery
from app.utils.jwt import get_current_user_optional
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


class PageViewRequest(BaseModel):
    path: str
    referrer: str | None = None


class SearchTrackRequest(BaseModel):
    query: str
    results_count: int
    filters: dict | None = None


def hash_ip(ip: str | None) -> str | None:
    """Hash IP address for privacy."""
    if not ip:
        return None
    return hashlib.sha256(ip.encode()).hexdigest()[:16]


@router.post("/pageview")
async def track_pageview(
    request: Request,
    data: PageViewRequest,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Track a page view."""
    client_ip = request.client.host if request.client else None

    pageview = PageView(
        user_id=current_user.id if current_user else None,
        path=data.path,
        referrer=data.referrer,
        user_agent=request.headers.get("user-agent"),
        ip_hash=hash_ip(client_ip),
    )

    db.add(pageview)
    await db.commit()

    return {"status": "tracked"}


@router.post("/search")
async def track_search(
    data: SearchTrackRequest,
    current_user: User | None = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db),
):
    """Track a search query."""
    search_query = SearchQuery(
        user_id=current_user.id if current_user else None,
        query=data.query,
        results_count=data.results_count,
        filters=data.filters,
    )

    db.add(search_query)
    await db.commit()

    return {"status": "tracked"}


@router.get("/stats/overview")
async def get_analytics_overview(
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    """Get analytics overview (public stats)."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Total pageviews
    pageviews_result = await db.execute(
        select(func.count()).select_from(PageView).where(PageView.created_at >= since)
    )
    total_pageviews = pageviews_result.scalar() or 0

    # Unique visitors (by ip_hash)
    unique_visitors_result = await db.execute(
        select(func.count(func.distinct(PageView.ip_hash)))
        .where(PageView.created_at >= since)
    )
    unique_visitors = unique_visitors_result.scalar() or 0

    # Total searches
    searches_result = await db.execute(
        select(func.count()).select_from(SearchQuery).where(SearchQuery.created_at >= since)
    )
    total_searches = searches_result.scalar() or 0

    # Popular pages
    popular_pages_result = await db.execute(
        select(PageView.path, func.count().label("views"))
        .where(PageView.created_at >= since)
        .group_by(PageView.path)
        .order_by(text("views DESC"))
        .limit(10)
    )
    popular_pages = [{"path": row.path, "views": row.views} for row in popular_pages_result]

    # Popular search queries
    popular_queries_result = await db.execute(
        select(SearchQuery.query, func.count().label("count"))
        .where(SearchQuery.created_at >= since)
        .group_by(SearchQuery.query)
        .order_by(text("count DESC"))
        .limit(10)
    )
    popular_queries = [{"query": row.query, "count": row.count} for row in popular_queries_result]

    return {
        "period_days": days,
        "total_pageviews": total_pageviews,
        "unique_visitors": unique_visitors,
        "total_searches": total_searches,
        "popular_pages": popular_pages,
        "popular_queries": popular_queries,
    }


@router.get("/stats/daily")
async def get_daily_stats(
    days: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    """Get daily pageview and search counts."""
    since = datetime.now(timezone.utc) - timedelta(days=days)

    # Daily pageviews
    daily_pageviews_result = await db.execute(
        text("""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM page_views
            WHERE created_at >= :since
            GROUP BY DATE(created_at)
            ORDER BY date
        """),
        {"since": since}
    )
    daily_pageviews = [
        {"date": str(row.date), "count": row.count}
        for row in daily_pageviews_result
    ]

    # Daily searches
    daily_searches_result = await db.execute(
        text("""
            SELECT DATE(created_at) as date, COUNT(*) as count
            FROM search_queries
            WHERE created_at >= :since
            GROUP BY DATE(created_at)
            ORDER BY date
        """),
        {"since": since}
    )
    daily_searches = [
        {"date": str(row.date), "count": row.count}
        for row in daily_searches_result
    ]

    return {
        "period_days": days,
        "pageviews": daily_pageviews,
        "searches": daily_searches,
    }
