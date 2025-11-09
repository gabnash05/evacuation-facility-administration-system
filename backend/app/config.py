"""Configuration settings for EFAS application."""

import os


class Config:
    """Base configuration."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key")
    DEBUG = True
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
