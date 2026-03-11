"""
FastAPI application entry point for Q Studio.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
import os
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from fastapi.responses import JSONResponse
import logging

from app.api.routes import auth, projects
from app.core.config import settings
from app.core.database import init_db

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

# Create FastAPI app
app = FastAPI(
    title="Q Studio API",
    description="Private Professional Digital AI Film Production Operating System",
    version="1.0.0",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please try again later."}
    )


# CORS middleware - allow all for now to debug
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GZIP compression
app.add_middleware(GZipMiddleware, minimum_size=1000)


@app.on_event("startup")
async def startup_event():
    logger.info("Starting Q Studio API...")
    logger.info(f"Environment: {'Development' if settings.DEBUG else 'Production'}")
    # Initialize database tables
    init_db()
    logger.info("Database initialized")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down Q Studio API...")


@app.get("/")
async def root():
    return {
        "name": "Q Studio API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs" if settings.DEBUG else "disabled"
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])

# Phase 1.1: Identity Engine
from app.api.routes import identity
app.include_router(identity.router, prefix="/api/identity", tags=["Identity Engine"])

# Phase 1.1: Scene Builder
from app.api.routes import scenes
app.include_router(scenes.router, prefix="/api/scenes", tags=["Scene Builder"])

# Phase 1.1: Episodes
from app.api.routes import episodes
app.include_router(episodes.router, prefix="/api/episodes", tags=["Episodes"])

# Phase 1.1: Render Queue
from app.api.routes import render
app.include_router(render.router, prefix="/api/render", tags=["Render Queue"])

# Phase 1.2: AI Generation
from app.api.routes import ai
app.include_router(ai.router, prefix="/api/ai", tags=["AI Generation"])

# Serve exported files (videos, images, etc.)
exports_dir = "/app/exports"
os.makedirs(exports_dir, exist_ok=True)
app.mount("/exports", StaticFiles(directory=exports_dir), name="exports")
