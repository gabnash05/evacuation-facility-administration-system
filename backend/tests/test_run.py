"""Regression tests for the development server entry point."""

import os
import runpy
import unittest
from unittest.mock import patch


class DevelopmentEntryPointTests(unittest.TestCase):
    def test_development_entry_point_exports_a_configured_application(self):
        with patch.dict(
            os.environ, {"DATABASE_URL": "postgresql://localhost/efas_fixture"}
        ):
            app = runpy.run_module("run")["app"]
        self.assertGreater(len(list(app.url_map.iter_rules())), 0)
        self.assertEqual(
            app.config["SQLALCHEMY_DATABASE_URI"].get_backend_name(), "postgresql"
        )

    def test_development_entry_point_refuses_sqlite(self):
        with patch.dict(os.environ, {"DATABASE_URL": "sqlite://"}):
            with self.assertRaisesRegex(
                RuntimeError, "must name a PostgreSQL database"
            ):
                runpy.run_module("run")
