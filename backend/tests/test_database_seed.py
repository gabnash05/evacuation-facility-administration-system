"""Regression tests for non-destructive database seed preflight checks."""

import unittest
from unittest.mock import Mock

from database import seed_db


class DatabaseSeedTests(unittest.TestCase):
    def test_missing_seed_file_fails_before_opening_a_cursor(self):
        connection = Mock()

        with self.assertRaises(FileNotFoundError):
            seed_db.execute_sql_file(connection, "missing-seed-file.sql")

        connection.cursor.assert_not_called()
