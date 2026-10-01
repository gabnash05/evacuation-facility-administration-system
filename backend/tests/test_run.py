"""Regression tests for the development server entry point."""

import unittest

from run import app


class DevelopmentEntryPointTests(unittest.TestCase):
    def test_development_entry_point_exports_a_configured_application(self):
        self.assertGreater(len(list(app.url_map.iter_rules())), 0)
