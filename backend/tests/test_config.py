"""Regression tests for the explicit runtime configuration contract."""

import unittest

from app.config import Config


class ConfigTests(unittest.TestCase):
    def test_token_transport_is_explicitly_configured(self):
        self.assertEqual(Config.JWT_TOKEN_LOCATION, ["headers", "cookies"])
        self.assertEqual(Config.JWT_HEADER_NAME, "Authorization")
        self.assertEqual(Config.JWT_HEADER_TYPE, "Bearer")
        self.assertEqual(Config.JWT_ACCESS_COOKIE_NAME, "access_token")

    def test_development_cors_origins_are_explicit(self):
        self.assertEqual(
            Config.CORS_ORIGINS,
            [
                "http://localhost:5173",
                "http://localhost:5000",
                "http://127.0.0.1:5000",
            ],
        )
