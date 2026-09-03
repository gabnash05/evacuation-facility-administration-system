# Overhaul Progress Ledger

| ID | Status | Started | Completed | Evidence / next action |
| --- | --- | --- | --- | --- |
| FOUNDATION-001 | complete | 2026-09-02 | 2026-09-02 | Created all required control artifacts, recorded verified baseline results, and validated the docs-only worktree change. |
| AUDIT-001 | complete | 2026-09-02 | 2026-09-02 | Reviewed and ledgered all 28 batch-0 files. Logged tooling, documentation, and configuration drift. |
| AUDIT-002 | complete | 2026-09-02 | 2026-09-02 | Reviewed and ledgered 15 backend bootstrap/auth/user files. Confirmed missing WSGI app, user-management authorization bypass, insecure token/configuration defaults, user-contract drift, and persistence hazards. |
| AUDIT-003 | complete | 2026-09-02 | 2026-09-02 | Reviewed and ledgered all five tracked database artifacts. Confirmed absent migration history, PostgreSQL/PostGIS versus SQLite runtime incompatibility, non-idempotent bootstrap, and unsafe/partial seeding behavior. |
| AUDIT-004 | complete | 2026-09-02 | 2026-09-02 | Reviewed and ledgered 12 backend center/event/stats files. Confirmed unrestricted center management, non-atomic event/center lifecycle work, contradictory spatial contracts, destructive center deletion policy, and response/filter drift. |
| AUDIT-005 | complete | 2026-09-02 | 2026-09-02 | Reviewed and ledgered eight backend household/individual files and their models. Confirmed unrestricted PII CRUD/recalculation, schema-route drift, pagination/filter mismatch, and incomplete transaction/relationship safeguards. |
| AUDIT-006 | complete | 2026-09-02 | 2026-09-03 | Reviewed three backend files; recorded ATTENDANCE-001/002, SECURITY-007, CONTRACT-005, and BACKEND-006. |
| AUDIT-007 | complete | 2026-09-03 | 2026-09-03 | Reviewed seven backend files; recorded SECURITY-008/009, DISTRIBUTION-001, CONTRACT-006, and BACKEND-007. |
| AUDIT-008 | complete | 2026-09-03 | 2026-09-03 | Reviewed 54 frontend shell/auth/shared files; recorded FRONTEND-001 through FRONTEND-004 and classified 24 shadcn/Radix files as a generated component group. |
| AUDIT-009 | complete | 2026-09-03 | 2026-09-03 | Reviewed all remaining frontend feature, map, residual route, client/state/type, and utility files. Coverage ledger reconciles all 253 tracked snapshot files. |
| PLANNING-001 | complete | 2026-09-03 | 2026-09-03 | Reconciled audit completion and added the ordered implementation roadmap. DEVOPS-001 is the highest-priority unblocked implementation ticket. |
| DEVOPS-001 | complete | 2026-09-03 | 2026-09-03 | Restored `backend/wsgi.py` as the factory-created production app. Verified `from wsgi import app` (84 routes), Black, isort, and diff whitespace checks. Committed as `571701d` and published, with TEST-001A, on `origin/codex/overhaul-foundation`. The existing Flask-CORS warning remains tracked as BACKEND-001. |
| TEST-001A | complete | 2026-09-03 | 2026-09-03 | Added `pipenv run test` using stdlib discovery plus the WSGI regression. Passed 1 test, Black, isort, Pipenv verification, and diff whitespace checks. Database-backed and frontend testing remain later TEST-001 splits. |
| TEST-001B | complete | 2026-09-03 | 2026-09-03 | Added locked Vitest/jsdom/Testing Library dependencies, one-shot/watch test commands, explicit test setup, and two `ErrorAlert` component regressions. The tests exposed and fixed missing alert semantics (FRONTEND-019). Clean `npm ci --ignore-scripts` and the focused verbose suite pass; `npm run test` (2 tests), `npm run type-check`, targeted Prettier check, `npm run build`, and `git diff --check` pass. Build reports recorded P4 dynamic-import/chunk-size optimization work (FRONTEND-020). Committed as `d68cb9a` and published to `origin/codex/overhaul-foundation`. |
| TEST-001C | complete | 2026-09-03 | 2026-09-03 | Added a test-only Flask config, reusable API test base, and user-list JWT/validation boundary regressions. Focused tests and `pipenv run test` (3 tests), Black, isort, Pipenv verification, and whitespace validation pass. Tests made no database query/schema/migration/seed or external request. The pre-existing Flask-CORS warning is still BACKEND-001. Commit and publish after final diff review. |

## Audit batches

| Batch | Scope | Status |
| --- | --- | --- |
| 0 | Root files, existing documentation, manifests, scripts, Git metadata | complete |
| 1 | Backend bootstrap, configuration, auth, users | complete |
| 2 | Database SQL, setup, seed, schema/migration lifecycle | complete |
| 3 | Backend centers, events, stats, maps | complete |
| 4 | Households and individuals | complete |
| 5 | Attendance and transfers | complete |
| 6 | Aid allocation and distribution | complete |
| 7 | Frontend shell, routing, shared UI, auth, styles | complete |
| 8 | Frontend role features, services, stores, hooks, types, utilities | complete |
| 9 | Dependencies, DevOps, security, agent readiness | complete (baseline/audit evidence recorded) |
