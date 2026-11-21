# Proposed Agent Instructions

This is a proposal only; no existing `AGENTS.md` has been overwritten.

## Required future contents

- Preserve dirty worktrees and use `git -c safe.directory=...` only for repository-local inspection when ownership requires it.
- Use locked dependency installation (`npm ci`, `pipenv sync --dev`) and never update lockfiles incidentally.
- Run narrow validation before complete validation; do not weaken or delete tests to make checks pass.
- Use disposable databases for schema, seed, migration, or destructive test work.
- Never expose local environment values or secrets in logs, commits, or documentation.
- Escalate public-contract changes, destructive migrations, major dependency/platform upgrades, and material auth/privacy changes.
