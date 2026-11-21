"""Regression tests for the explicit runtime configuration contract."""

import os
import unittest
from unittest.mock import patch

from app.config import Config, DevelopmentConfig, ProductionConfig


class ConfigTests(unittest.TestCase):
    def test_base_config_disables_debug(self):
        self.assertFalse(Config.DEBUG)

    def test_production_requires_both_keys_without_echoing_values(self):
        for key in ("SECRET_KEY", "JWT_SECRET_KEY"):
            for invalid in (None, "  ", "dev-secret-key", "jwt-secret-key"):
                with self.subTest(key=key, invalid=invalid):
                    values = {
                        "SECRET_KEY": "flask-test-value",
                        "JWT_SECRET_KEY": "jwt-test-value",
                    }
                    if invalid is None:
                        values.pop(key)
                    else:
                        values[key] = invalid
                    with patch.dict(os.environ, values, clear=True):
                        with self.assertRaisesRegex(
                            RuntimeError, f"non-default {key}"
                        ) as failure:
                            ProductionConfig()
                    for value in values.values():
                        if value.strip():
                            self.assertNotIn(value, str(failure.exception))

    def test_production_reads_deployment_keys_and_disables_debug(self):
        with patch.dict(
            os.environ,
            {
                "SECRET_KEY": "test-flask",
                "JWT_SECRET_KEY": "test-jwt",
                "DATABASE_URL": "postgresql+psycopg2://localhost/efas_fixture",
            },
        ):
            config = ProductionConfig()
        self.assertEqual(config.SECRET_KEY, "test-flask")
        self.assertEqual(config.JWT_SECRET_KEY, "test-jwt")
        self.assertFalse(config.DEBUG)

    def test_rejects_unsupported_and_malformed_database_urls_without_echoing_them(self):
        for url in (
            "postgresql://user:fixture-password@localhost/",
            "sqlite:///efas.db",
            "postgresql+asyncpg://localhost/efas_fixture",
            "not-a-url-with-fixture-password",
        ):
            with self.subTest(url=url):
                with patch.dict(os.environ, {"DATABASE_URL": url}):
                    with self.assertRaisesRegex(
                        RuntimeError, "DATABASE_URL"
                    ) as failure:
                        DevelopmentConfig()
                self.assertNotIn(url, str(failure.exception))
                self.assertNotIn("fixture-password", str(failure.exception))

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
