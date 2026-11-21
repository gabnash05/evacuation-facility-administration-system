"""Shared no-database helpers for backend API-boundary tests."""

import unittest

from flask_jwt_extended import create_access_token

from app import create_app


class ApiTestConfig:
    """Test-only application configuration that never selects a real database."""

    TESTING = True
    SECRET_KEY = "test-only-secret"
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = "test-only-jwt-secret"
    JWT_TOKEN_LOCATION = ("headers",)
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"
    CORS_ORIGINS = ("http://localhost",)


class ApiTestCase(unittest.TestCase):
    """Create an isolated Flask client and header-only JWTs for API tests."""

    def setUp(self):
        self.app = create_app(ApiTestConfig)
        self.client = self.app.test_client()

    def authorization_headers(self, user_id=1):
        """Create a JWT locally; the generated token is never logged or persisted."""
        with self.app.app_context():
            token = create_access_token(identity=str(user_id))

        return {"Authorization": f"Bearer {token}"}
