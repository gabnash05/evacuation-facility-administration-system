# Evacuation Facility Administration System

This repository contains a Flask backend and a React + Vite frontend for managing evacuation centers, events, households, and users.

The sections below provide concise, collaboration-focused setup instructions for the backend, database, and frontend.

## Prerequisites
- Git
- Python 3.9+ and pip
- Pipenv (backend dependency management)
- Node.js 16+ and npm or pnpm (frontend)

## Backend (development)
1. Clone the repository and change into the project root:

	git clone <repo-url>
	cd evacuation-facility-administration-system

2. Copy environment file and edit values (backend `.env` lives in `backend/`):

	cd backend
	copy .env.example .env   # Windows PowerShell
	# Edit `backend/.env` and set DB connection and secret keys

3. Install Python dependencies with Pipenv and activate the virtual environment:

	pipenv install
	pipenv shell

4. Run the development server:

	# from `backend/` inside pipenv shell
	python run.py

Notes for collaborators:
- Use the `.env.example` as the canonical template; do not commit secrets.
- Lock dependency changes (Pipfile/Pipfile.lock) and open a PR when bumping packages.

## Database
1. The database setup script is at `backend/database/setup_db.py` and SQL schema at `backend/database/sql/create_tables.sql`.
2. Ensure your `backend/.env` DB connection string points to your local DB (Postgres).
3. To create tables locally run (from `backend/`):

	pipenv run python backend\database\setup_db.py

4. For collaborative environments:
- Prefer migrations for production (this project uses a direct setup script; consider adding Alembic or Flask-Migrate for team projects).
- Share a sample DB dump (without PII) or schema changes in PRs.

## Frontend (development)
1. From the repo root, change into the `frontend/` folder:

	cd frontend

2. Copy environment file and set the API URL if needed:

	copy .env.example .env   # Windows PowerShell

3. Install dependencies and start the dev server:

	npm install
	npm run dev

4. The frontend expects the backend API to be available. If running both locally, ensure the backend server URL is set in `frontend/.env` or in `src/services/api.ts`.

Notes for collaborators:
- Keep frontend dependency updates in a separate PR; include build proof or CI change when necessary.

## Useful commands summary
- Backend install: `cd backend && pipenv install`
- Backend run: `cd backend && pipenv run python run.py`
- Setup DB: `cd backend && pipenv run python backend\database\setup_db.py`
- Frontend install & run: `cd frontend && npm install && npm run dev`