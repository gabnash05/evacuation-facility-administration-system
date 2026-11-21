# Agentic Coding Readiness

## Current state

- No `AGENTS.md` files exist.
- Toolchain commands were undocumented for an environment where `npm` and `pipenv` are not visible on PATH.
- Fast and full validation commands are incomplete because tests, CI, and database migration validation are absent.
- The baseline requires explicit runtime invocation in this environment: `C:\\Program Files\\nodejs\\npm.cmd` and `py -3.13 -m pipenv`.

## Target state

Provide root/scoped instructions, pinned runtime expectations, deterministic bootstrap, fast/full validation scripts, database safety rules, generated-file policy, external-service mocking conventions, change-scope checks, and durable progress records. Do not add these until the audit determines the supported workflows.
