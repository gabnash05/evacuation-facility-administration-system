"""Regression tests for non-destructive database setup guards."""

import os
import unittest
from unittest.mock import patch

from database import setup_db


class DatabaseSetupTests(unittest.TestCase):
    def test_database_identifier_rejects_sql_syntax(self):
        with self.assertRaisesRegex(ValueError, "DB_NAME"):
            setup_db.validate_database_identifier("efas; DROP DATABASE postgres")

    @patch("database.setup_db.get_database_connection")
    def test_create_database_rejects_unsafe_name_before_connecting(self, connection):
        with patch.dict(os.environ, {"DB_NAME": "efas; DROP DATABASE postgres"}):
            with self.assertRaisesRegex(ValueError, "DB_NAME"):
                setup_db.create_database()

        connection.assert_not_called()
