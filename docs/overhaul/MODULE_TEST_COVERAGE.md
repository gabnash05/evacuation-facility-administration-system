# Module Test Coverage Ledger

`module-test-coverage.json` is the machine-readable source of truth. The
verifier discovers every executable Python, TypeScript, and TSX module in the
maintained source roots and emits a complete current report. A module is
`covered`, `missing`, or narrowly `exempt`; an unlisted discovered module is
always reported as `missing`.

Run the baseline ledger report from the repository root:

```powershell
py -3.13 backend/scripts/verify_module_test_coverage.py --report docs/overhaul/module-test-report.json
```

Run `py -3.13 backend/scripts/verify_module_test_coverage.py --strict` for the
coverage gate. It fails on uncovered modules, stale source rows, missing mapped
test paths, duplicate rows, and exemptions without an explanation. Keep the
generated report out of Git and review the mapping with every ticket.

Each mapping should point to a test that exercises the module or its exported
contract. The verifier checks inventory and paths. Test review and actual runs
establish behavioral coverage. Unit and component mappings do not establish
live PostgreSQL, migration, deployment, or end-to-end coverage.

## Baseline — 2026-09-03

The verifier discovered 217 maintained executable modules: 5 currently have
mapped regressions, 212 are deliberately reported as missing, and none are
exempt. This baseline is an enforcement starting point, not a claim that the
repository is sufficiently covered. `TEST-003B` through `TEST-003J` must close
the missing rows in the published mapping; `--strict` is intentionally expected
to fail until then.

## Historical progress — 2026-09-05

The verifier now reports 109 covered modules, 101 missing modules, and five
narrow exemptions for zero-byte backend markers. The count was executed from
the repository root with the Pipenv environment on 2026-09-05. Configuration
coverage characterizes the current explicit token and development CORS contract;
it does not approve the insecure defaults tracked in `SECURITY-001`.

## Strict reconciliation — 2026-11-21

The current checkout has 203 mapped modules (43 backend and 160 frontend),
zero unmapped modules, and six exemptions. This count excludes three retired
unreachable attendance pages. Their three maintained V2 counterparts now have
direct checkout tests and a separate route-binding regression.
