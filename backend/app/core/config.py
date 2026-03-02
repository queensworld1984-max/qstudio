"""
Core configuration for Q Studio API.
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "Q Studio"
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"

    # Database
    DATABASE_URL: str = "postgresql://qstudio:qstudio@postgres:5432/qstudio"

    # Redis
    REDIS_URL: str = "redis://:qstudio@redis:6379/0"

    # JWT
    JWT_SECRET_KEY: str = "dev-secret-key-change-in-production-min-32-chars"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://web:3000",
        "http://api:8000",
    ]

    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 100

    # File uploads
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100MB
    UPLOAD_DIR: str = "/app/uploads"
    EXPORT_DIR: str = "/app/exports"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
