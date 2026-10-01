"""Regression coverage for the documented production WSGI target."""

import unittest

from wsgi import app


class WsgiEntrypointTest(unittest.TestCase):
    """The production entry point must expose the factory-created application."""

    def test_wsgi_exports_flask_app_with_login_route(self):
        rules = {rule.rule for rule in app.url_map.iter_rules()}

        self.assertIsNotNone(app)
        self.assertIn("/api/auth/login", rules)
