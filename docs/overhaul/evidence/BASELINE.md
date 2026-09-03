# Baseline Evidence

## Environment setup

- Installed Pipenv `2026.8.0` for the existing Python 3.13.5 user installation.
- Verified `Pipfile.lock` and synchronized backend dependencies using `py -3.13 -m pipenv sync --dev`.
- Verified Node `v24.19.0` and npm `11.17.0`; installed frontend dependencies using `npm ci`.
- No source files or lockfiles changed; generated dependencies and frontend static build output remain ignored.

## Command outcomes

See the baseline table in `../MASTER_PLAN.md`. Detailed diagnostics are intentionally not copied here because they contain thousands of lint entries; the concise counts, command identity, and failure category are the durable evidence.

## Safety notes

No database setup, seed, migration, external service mutation, vulnerability fix, formatter write, or dependency upgrade was run.
