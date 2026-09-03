"""Verify that executable modules have mapped regression tests or exceptions.

The source-of-truth mapping lives in ``docs/overhaul/module-test-coverage.json``.
This checker deliberately reports every discovered module, including uncovered
ones, so the generated report is the complete, current coverage ledger.
"""

import argparse
import json
from pathlib import Path
from typing import Any

SOURCE_SUFFIXES = {".py", ".ts", ".tsx"}
SOURCE_ROOTS = ("backend/app", "backend/database", "backend/scripts", "frontend/src")
SOURCE_FILES = ("backend/run.py", "backend/wsgi.py", "frontend/vite.config.ts")


def _normalise(path: str) -> str:
    return path.replace("\\", "/")


def discover_modules(repository: Path) -> set[str]:
    """Return executable source paths, excluding test files themselves."""
    modules: set[str] = set()
    for relative_root in SOURCE_ROOTS:
        root = repository / relative_root
        if not root.exists():
            continue
        for path in root.rglob("*"):
            relative = _normalise(str(path.relative_to(repository)))
            if (
                path.is_file()
                and path.suffix in SOURCE_SUFFIXES
                and ".test." not in path.name
            ):
                modules.add(relative)
    for relative_file in SOURCE_FILES:
        if (repository / relative_file).is_file():
            modules.add(relative_file)
    return modules


def load_mapping(path: Path) -> dict[str, dict[str, Any]]:
    """Load a unique, path-keyed mapping and reject malformed ledger rows."""
    payload = json.loads(path.read_text(encoding="utf-8"))
    rows = payload.get("modules")
    if not isinstance(rows, list):
        raise ValueError("'modules' must be a list")
    mapping: dict[str, dict[str, Any]] = {}
    for row in rows:
        if not isinstance(row, dict) or not isinstance(row.get("path"), str):
            raise ValueError("Each module row needs a string path")
        module_path = _normalise(row["path"])
        if module_path in mapping:
            raise ValueError(f"Duplicate module row: {module_path}")
        status = row.get("status")
        if status not in {"covered", "missing", "exempt"}:
            raise ValueError(f"Invalid status for {module_path}: {status!r}")
        tests = row.get("tests", [])
        exception = row.get("exception")
        if status == "covered" and not tests:
            raise ValueError(f"Covered module has no tests: {module_path}")
        if status == "exempt" and not exception:
            raise ValueError(f"Exempt module has no exception: {module_path}")
        mapping[module_path] = row
    return mapping


def inspect(
    repository: Path, mapping_path: Path
) -> tuple[list[dict[str, Any]], list[str]]:
    """Reconcile discovered source, declared rows, and referenced test paths."""
    discovered = discover_modules(repository)
    mapping = load_mapping(mapping_path)
    errors: list[str] = []
    for mapped_path, row in mapping.items():
        if mapped_path not in discovered:
            errors.append(f"Stale ledger path: {mapped_path}")
        for test_path in row.get("tests", []):
            if not (repository / test_path).is_file():
                errors.append(f"Missing mapped test: {mapped_path} -> {test_path}")
    report = []
    for module_path in sorted(discovered):
        row = mapping.get(module_path)
        if row is None:
            report.append({"path": module_path, "status": "missing", "tests": []})
        else:
            report.append({"path": module_path, **row})
    return report, errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repository", type=Path, default=Path.cwd())
    parser.add_argument(
        "--mapping",
        type=Path,
        default=Path("docs/overhaul/module-test-coverage.json"),
    )
    parser.add_argument("--strict", action="store_true")
    parser.add_argument("--report", type=Path)
    arguments = parser.parse_args()
    repository = arguments.repository.resolve()
    mapping_path = arguments.mapping
    if not mapping_path.is_absolute():
        mapping_path = repository / mapping_path
    report, errors = inspect(repository, mapping_path)
    if arguments.report:
        report_path = arguments.report
        if not report_path.is_absolute():
            report_path = repository / report_path
        report_path.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    counts = {
        status: sum(row["status"] == status for row in report)
        for status in ("covered", "missing", "exempt")
    }
    print(
        "module-test coverage:",
        ", ".join(f"{key}={value}" for key, value in counts.items()),
    )
    errors.extend(
        f"Uncovered module: {row['path']}"
        for row in report
        if arguments.strict and row["status"] == "missing"
    )
    if errors:
        print("\n".join(errors))
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
