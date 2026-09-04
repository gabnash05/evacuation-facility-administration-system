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

Use `--strict` only once the deterministic coverage batches have closed all
missing rows. It fails stale source rows, missing mapped test paths, duplicate
rows, invalid exemptions, and all uncovered modules. The report is generated
output and must not be committed; the mapping is reviewed with every ticket.

Current explicit mappings cover the existing WSGI, API boundary, configuration,
allocation security, map rendering, and component regressions. All other
discovered modules remain honestly `missing` until their owning TEST-003 batch
supplies meaningful tests.

## Baseline — 2026-09-03

The verifier discovered 217 maintained executable modules: 5 currently have
mapped regressions, 212 are deliberately reported as missing, and none are
exempt. This baseline is an enforcement starting point, not a claim that the
repository is sufficiently covered. `TEST-003B` through `TEST-003J` must close
the missing rows in the published mapping; `--strict` is intentionally expected
to fail until then.

## Current progress — 2026-09-04

The current mapping declares 71 covered modules, 138 missing modules, and five
narrow exemptions for zero-byte backend markers. Its total was independently
checked as JSON while the Python launcher is unavailable; rerun the repository
verifier once that local environment is restored. Configuration coverage
characterizes the current explicit token and development CORS contract; it does
not approve the insecure defaults tracked in `SECURITY-001`.
