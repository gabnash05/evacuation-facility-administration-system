"""Configuration settings for EFAS application."""

import os

from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


def require_postgresql_url():
    """Validate the runtime database without connecting or disclosing credentials."""
    value = os.environ.get("DATABASE_URL", "").strip()
    if not value:
        raise RuntimeError("Set DATABASE_URL to the EFAS PostgreSQL database.")
    try:
        url = make_url(value)
    except (ArgumentError, ValueError):
        raise RuntimeError("DATABASE_URL must be a valid PostgreSQL URL.") from None
    if url.drivername not in {"postgresql", "postgresql+psycopg2"} or not url.database:
        raise RuntimeError(
            "DATABASE_URL must name a PostgreSQL database using psycopg2."
        )
    return url


class Config:
    """Base configuration."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    DEBUG = False
    TESTING = False

    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "sqlite:///efas.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    JWT_TOKEN_LOCATION = ["headers", "cookies"]  # Allow both header and cookie auth
    JWT_ACCESS_COOKIE_NAME = "access_token"
    JWT_COOKIE_CSRF_PROTECT = False
    JWT_COOKIE_SAMESITE = "Lax"
    JWT_COOKIE_SECURE = False  # Set to True in production with HTTPS
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    # Updated CORS settings to include both development server and static serving
    CORS_ORIGINS = [
        "http://localhost:5173",  # Vite dev server
        "http://localhost:5000",  # Flask development server
        "http://127.0.0.1:5000",  # Alternative local address
    ]


class DevelopmentConfig(Config):
    """Development uses the same PostgreSQL runtime as production."""

    def __init__(self):
        self.SQLALCHEMY_DATABASE_URI = require_postgresql_url()


class ProductionConfig(DevelopmentConfig):
    """Production requires deployment-provided signing keys at startup."""

    def __init__(self):
        for name in ("SECRET_KEY", "JWT_SECRET_KEY"):
            value = os.environ.get(name, "")
            if not value.strip() or value.strip() in {
                "dev-secret-key",
                "jwt-secret-key",
            }:
                raise RuntimeError(f"Set a non-default {name} before starting EFAS.")
            setattr(self, name, value)
        super().__init__()
