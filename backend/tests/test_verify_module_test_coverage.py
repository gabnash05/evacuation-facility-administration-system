"""Regression tests for the module-test coverage pairing verifier."""

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SCRIPT_PATH = Path(__file__).parents[1] / "scripts" / "verify_module_test_coverage.py"
SPEC = importlib.util.spec_from_file_location("module_coverage", SCRIPT_PATH)
module_coverage = importlib.util.module_from_spec(SPEC)
assert SPEC.loader is not None
SPEC.loader.exec_module(module_coverage)


class ModuleCoverageVerifierTests(unittest.TestCase):
    def _write_mapping(self, root: Path, rows: list[dict]) -> Path:
        mapping = root / "docs/overhaul/module-test-coverage.json"
        mapping.parent.mkdir(parents=True)
        mapping.write_text(json.dumps({"modules": rows}), encoding="utf-8")
        return mapping

    def test_reports_unmapped_module_as_missing(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "backend/app/config.py"
            source.parent.mkdir(parents=True)
            source.write_text("CONFIG = {}\n", encoding="utf-8")
            report, errors = module_coverage.inspect(
                root, self._write_mapping(root, [])
            )

        self.assertEqual(errors, [])
        self.assertEqual(
            report,
            [{"path": "backend/app/config.py", "status": "missing", "tests": []}],
        )

    def test_rejects_duplicate_rows_and_missing_mapped_test(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / "backend/app/config.py"
            source.parent.mkdir(parents=True)
            source.write_text("CONFIG = {}\n", encoding="utf-8")
            mapping = self._write_mapping(
                root,
                [
                    {
                        "path": "backend/app/config.py",
                        "status": "covered",
                        "tests": ["backend/tests/test_config.py"],
                    },
                    {
                        "path": "backend/app/config.py",
                        "status": "exempt",
                        "tests": [],
                        "exception": "duplicate",
                    },
                ],
            )

            with self.assertRaisesRegex(ValueError, "Duplicate module row"):
                module_coverage.inspect(root, mapping)
