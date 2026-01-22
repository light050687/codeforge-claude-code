from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.routers import auth, problems, solutions, search, benchmarks, users, playground, comments, analytics
from app.limiter import limiter

settings = get_settings()


# Middleware to normalize trailing slashes
# Routes are defined with "/" for list endpoints, without for specific resources
class TrailingSlashMiddleware(BaseHTTPMiddleware):
    # Routes that should have trailing slash (collection endpoints)
    ROUTES_WITH_SLASH = {
        "/api/v1/solutions",
        "/api/v1/problems",
        "/api/v1/users",
        "/api/v1/search",
        "/api/v1/benchmarks",
    }

    async def dispatch(self, request: Request, call_next):
        path = request.scope["path"]

        # Add trailing slash for specific collection routes
        if path in self.ROUTES_WITH_SLASH:
            request.scope["path"] = path + "/"
        # Remove trailing slash from all other paths (except root)
        elif path != "/" and path.endswith("/"):
            request.scope["path"] = path.rstrip("/")

        return await call_next(request)


app = FastAPI(
    title=settings.app_name,
    description="Semantic code search engine - find faster, optimized implementations",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=False,  # Disable automatic 307 redirects for trailing slashes
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Handle trailing slashes - normalize URLs
app.add_middleware(TrailingSlashMiddleware)

# Routers
app.include_router(auth.router, prefix=f"{settings.api_prefix}/auth", tags=["auth"])
app.include_router(problems.router, prefix=f"{settings.api_prefix}/problems", tags=["problems"])
app.include_router(solutions.router, prefix=f"{settings.api_prefix}/solutions", tags=["solutions"])
app.include_router(search.router, prefix=f"{settings.api_prefix}/search", tags=["search"])
app.include_router(benchmarks.router, prefix=f"{settings.api_prefix}/benchmarks", tags=["benchmarks"])
app.include_router(users.router, prefix=f"{settings.api_prefix}/users", tags=["users"])
app.include_router(playground.router, prefix=f"{settings.api_prefix}/playground", tags=["playground"])
app.include_router(comments.router, prefix=f"{settings.api_prefix}/comments", tags=["comments"])
app.include_router(analytics.router, prefix=f"{settings.api_prefix}/analytics", tags=["analytics"])


@app.on_event("startup")
async def startup_event():
    """Preload embedding model on startup to avoid slow first request."""
    import asyncio
    import logging
    from app.services.embeddings import _get_model

    logger = logging.getLogger(__name__)

    def load_model():
        try:
            logger.info("Preloading embedding model...")
            _get_model()
            logger.info("Embedding model preloaded successfully")
        except Exception as e:
            logger.warning(f"Failed to preload embedding model: {e}")

    # Load model in background to not block startup
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, load_model)


@app.get("/")
async def root():
    return {
        "name": settings.app_name,
        "version": "0.1.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
