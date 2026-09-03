# Current Architecture and Data Flows

## Runtime topology

The React SPA is built by Vite into `backend/app/static/`. Flask registers API blueprints under `/api` and serves SPA assets or `index.html` for non-API paths. The frontend uses Axios with `/api` by default, Zustand stores, and route-level role protection. The backend uses Flask-JWT-Extended, Flask-SQLAlchemy, Marshmallow, models that mix ORM declarations and raw SQL, and PostgreSQL schema scripts.

## Initial trust boundaries

Browser credentials and user input cross into the Flask API; the API accesses PostgreSQL, map services via a frontend API key, and configuration indicates potential AWS/S3 center-photo integration. Local `.env` values are sensitive and excluded from audit output.

## Critical flows to trace

1. Login: `POST /api/auth/login` validates `UserLoginSchema`, looks up an active `users` row, creates a JWT whose identity is `user_id`, returns `{role, token}`, and sets the same token in `access_token`. Flask-JWT-Extended accepts both header and cookie tokens. `POST /auth/logout` only clears the cookie; `GET /auth/me` loads the identity. Cookie security is inconsistent with base config and CSRF is disabled (SECURITY-001, SECURITY-003).
2. Registration: `POST /api/auth/register` loads the caller from the JWT and permits `super_admin` to create every role and `city_admin` to create `center_admin`/`volunteer`; it persists through `User.create_from_schema`. This is distinct from generic user management and must be reconciled after the frontend audit.
3. Generic user management: `/api/users/**` delegates to generic service functions. It has JWT authentication but no server-side actor authorization. It currently exposes user records and permits account lifecycle and role changes to every authenticated role (SECURITY-002).
4. Center and event lifecycle through validation, authorization, persistence, and dashboard aggregation.
5. Household/individual creation through attendance check-in, checkout, transfer, and occupancy recalculation.
6. Allocation creation through distribution and remaining-quantity accounting.

Each flow must be expanded with contracts, errors, transactions, authorization, frontend state, and tests before its implementation ticket is approved.

## Attendance flow evidence

`/api/attendance/**` routes delegate to `attendance_records_service.py`, which calls the raw-SQL `AttendanceRecord` model. A normal check-in validates an active event/center and attempts to prevent another active record, then creates the record. The database schema also contains attendance/status/occupancy triggers, while the application performs related lifecycle and recalculation work separately. A transfer checks out the source record and creates a destination transfer record in separate commits; check-in can additionally auto-transfer a person already active elsewhere. Route-level role filters exist for several operations, but individual-history reads have no center scope and recorder identity can be supplied by the client. The singleton checkout route resolves a record but the service/model treat that value as an individual identifier (ATTENDANCE-001). No attendance request/response schema exists.

## Allocation and distribution flow evidence

`/api/allocations/**` uses a raw-SQL allocation model plus a service that joins category, center, event, and allocator data. `/api/distributions/**` creates a distribution session and then individual item records. The schema already supplies database functions that validate active event/center and allocation state, and triggers change remaining stock for inserts/deletes; the application bypasses those functions. Instead it creates each record in a separately committing model method, assigns session event ID 1, and never confirms that a household, session, and allocation share the same center/event. Distribution updates and status toggles manually change stock, while model methods commit mid-flow. Create and status-toggle endpoints lack server-side role/scope controls (SECURITY-008). Allocation's update service interpolates client JSON keys into SQL (SECURITY-009).

## Frontend shell evidence

`main.tsx` mounts `ThemeProvider` and `App`; `App` uses role-prefixed React Router groups around `ProtectedRoute` and `MainLayout`. `authStore` persists the user/role flag in browser storage. Its `checkAuth` endpoint call exists but is not automatically invoked by the shell, so route rendering relies on that persisted state until an API request returns an error. Axios sends cookies and retains the JSON login token only in memory; its request interceptor nevertheless attempts to read the backend's HTTP-only cookie through `document.cookie`. Shared navigation is role-specific, but route groups allow extra roles and have no documented access matrix. The checked-in `components/ui` group is shadcn/Radix-derived component source; shared EFAS UI lives under `components/common`.
