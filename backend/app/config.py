"""Configuration settings for EFAS application."""

import os


class Config:
    """Base configuration."""
    
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    DEBUG = True
    TESTING = False

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", "sqlite:///efas.db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-secret-key")
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 3600))
    JWT_TOKEN_LOCATION = ["cookies"]
    JWT_ACCESS_COOKIE_NAME = "access_token"
    JWT_COOKIE_CSRF_PROTECT = False  # For development
    JWT_COOKIE_SAMESITE = "Lax"

    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173")