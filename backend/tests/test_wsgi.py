"""Regression coverage for the documented production WSGI target."""

import os
import runpy
import unittest
from unittest.mock import patch


class WsgiEntrypointTest(unittest.TestCase):
    """The production entry point must expose the factory-created application."""

    def test_wsgi_exports_flask_app_with_login_route(self):
        with patch.dict(
            os.environ,
            {
                "SECRET_KEY": "test-flask",
                "JWT_SECRET_KEY": "test-jwt",
                "FLASK_DEBUG": "1",
                "DATABASE_URL": "postgresql://localhost/efas_fixture",
            },
        ):
            app = runpy.run_module("wsgi")["app"]
        rules = {rule.rule for rule in app.url_map.iter_rules()}

        self.assertFalse(app.debug)
        self.assertEqual(app.config["JWT_SECRET_KEY"], "test-jwt")
        self.assertEqual(app.config["SQLALCHEMY_DATABASE_URI"].database, "efas_fixture")
        self.assertIn("/api/auth/login", rules)

    def test_wsgi_refuses_to_start_without_deployment_secrets(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "non-default SECRET_KEY"):
                runpy.run_module("wsgi")

    def test_wsgi_refuses_to_start_without_database(self):
        with patch.dict(
            os.environ,
            {"SECRET_KEY": "test-flask", "JWT_SECRET_KEY": "test-jwt"},
            clear=True,
        ):
            with self.assertRaisesRegex(RuntimeError, "Set DATABASE_URL"):
                runpy.run_module("wsgi")
