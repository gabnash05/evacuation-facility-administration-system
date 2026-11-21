"""Tests for the disposable PostgreSQL runner's target validation."""

import unittest

from tests.run_postgresql_smoke import fixture_server_url


class PostgreSQLRunnerTests(unittest.TestCase):
    def test_accepts_explicit_local_fixture_server(self):
        url = fixture_server_url("postgresql://fixture:secret@127.0.0.1:55471/postgres")
        self.assertEqual(url.port, 55471)

    def test_rejects_non_fixture_targets(self):
        for url in (
            "",
            "postgresql://host/postgres",
            "postgresql://127.0.0.1:5432/postgres",
            "postgresql://127.0.0.1:55471/production",
            "postgresql://127.0.0.1:55471/postgres?host=remote",
        ):
            with self.subTest(url=url), self.assertRaises(ValueError):
                fixture_server_url(url)
