from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, problems, solutions, search, benchmarks, users

settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    description="Semantic code search engine - find faster, optimized implementations",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix=f"{settings.api_prefix}/auth", tags=["auth"])
app.include_router(problems.router, prefix=f"{settings.api_prefix}/problems", tags=["problems"])
app.include_router(solutions.router, prefix=f"{settings.api_prefix}/solutions", tags=["solutions"])
app.include_router(search.router, prefix=f"{settings.api_prefix}/search", tags=["search"])
app.include_router(benchmarks.router, prefix=f"{settings.api_prefix}/benchmarks", tags=["benchmarks"])
app.include_router(users.router, prefix=f"{settings.api_prefix}/users", tags=["users"])


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
