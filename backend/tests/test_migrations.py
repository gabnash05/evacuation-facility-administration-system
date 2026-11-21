"""Regression coverage for migration target and baseline safety checks."""

import importlib
import os
import unittest
from pathlib import Path
from unittest.mock import Mock, patch

from api_test_case import ApiTestConfig

from app import create_app

MIGRATIONS = Path(__file__).resolve().parents[1] / "migrations"
baseline = importlib.import_module("migrations.versions.0001_legacy_schema")
active_attendance = importlib.import_module(
    "migrations.versions.0003_unique_active_attendance"
)


class MigrationEnvironmentTests(unittest.TestCase):
    def invoke_upgrade(self, *args):
        runner = create_app(ApiTestConfig).test_cli_runner()
        return runner.invoke(
            args=["db", "upgrade", "--directory", str(MIGRATIONS), *args]
        )

    def test_refuses_default_target(self):
        with patch.dict(os.environ, {}, clear=True):
            result = self.invoke_upgrade()
        self.assertNotEqual(result.exit_code, 0)
        self.assertIn("Set DATABASE_URL", result.output)

    def test_refuses_non_postgresql_engine(self):
        with patch.dict(os.environ, {"DATABASE_URL": "sqlite://"}):
            result = self.invoke_upgrade()
        self.assertNotEqual(result.exit_code, 0)
        self.assertIn("require PostgreSQL", result.output)

    def test_offline_upgrade_cannot_bypass_schema_preflight(self):
        result = self.invoke_upgrade("--sql")
        self.assertNotEqual(result.exit_code, 0)
        self.assertIn("online schema preflight", result.output)


class MigrationBaselineTests(unittest.TestCase):
    @patch.object(baseline, "inspect")
    @patch.object(baseline.op, "get_bind")
    def test_existing_efas_table_blocks_baseline_before_ddl(self, get_bind, inspect):
        inspect.return_value.get_table_names.return_value = ["alembic_version", "users"]
        with self.assertRaisesRegex(RuntimeError, "EFAS tables already exist"):
            baseline.upgrade()
        get_bind.return_value.exec_driver_sql.assert_not_called()

    @patch.object(baseline.op, "get_bind")
    def test_changed_sql_snapshot_blocks_baseline_before_connecting(self, get_bind):
        altered_path = Mock()
        altered_path.read_text.return_value = "SELECT 1;"
        with patch.object(baseline, "LEGACY_SQL", altered_path):
            with self.assertRaisesRegex(RuntimeError, "snapshot was modified"):
                baseline.upgrade()
        get_bind.assert_not_called()

    def test_baseline_removal_requires_backup_recovery(self):
        with self.assertRaisesRegex(RuntimeError, "Restore a backup"):
            baseline.downgrade()


class ActiveAttendanceMigrationTests(unittest.TestCase):
    @patch.object(active_attendance.op, "get_bind")
    def test_duplicate_rows_prevent_index_creation(self, get_bind):
        connection = get_bind.return_value
        connection.exec_driver_sql.return_value.scalar_one.return_value = True

        with self.assertRaisesRegex(RuntimeError, "Duplicate active attendance"):
            active_attendance.upgrade()

        commands = [call.args[0] for call in connection.exec_driver_sql.call_args_list]
        self.assertIn("LOCK TABLE attendance_records IN SHARE MODE", commands)
        self.assertFalse(any("CREATE UNIQUE INDEX" in command for command in commands))
