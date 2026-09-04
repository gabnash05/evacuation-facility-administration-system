"""Regression tests for application-factory configuration."""

import logging
import unittest

from app import create_app
from tests.api_test_case import ApiTestConfig


class AppFactoryTests(unittest.TestCase):
    def test_factory_does_not_emit_unknown_flask_cors_option_warning(self):
        with self.assertNoLogs("flask_cors.core", logging.WARNING):
            app = create_app(ApiTestConfig)

        self.assertGreater(len(list(app.url_map.iter_rules())), 0)
