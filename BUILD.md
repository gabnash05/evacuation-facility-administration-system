# Building and Running the Application

This application consists of a React frontend (Vite) and a Flask backend. The frontend can be built and served statically from the Flask backend.

## Prerequisites

- Node.js and npm (for frontend)
- Python 3.13 and pipenv (for backend)

## Building the Frontend

### Windows (PowerShell)
```powershell
.\build.ps1
```

### Unix/Linux/Mac (Bash)
```bash
chmod +x build.sh
./build.sh
```

### Manual Build
```bash
cd frontend
npm install
npm run build
cd ..
```

The build script will:
1. Install frontend dependencies
2. Build the React application using Vite
3. Output the built files to `backend/app/static/`
4. Verify that the build was successful

## Running the Application

### Development Mode (Frontend + Backend Separate)

1. **Start the backend:**
   ```bash
   cd backend
   pipenv install  # First time only
   pipenv run dev
   ```
   Backend will run on `http://localhost:5000`

2. **Start the frontend dev server:**
   ```bash
   cd frontend
   npm install  # First time only
   npm run dev
   ```
   Frontend will run on `http://localhost:5173`

### Production Mode (Frontend Served from Backend)

1. **Build the frontend:**
   ```bash
   .\build.ps1  # Windows
   # or
   ./build.sh   # Unix/Linux/Mac
   ```

2. **Start the backend:**
   ```bash
   cd backend
   pipenv run dev
   ```
   
   The application will be available at `http://localhost:5000`
   - Frontend: `http://localhost:5000/`
   - API: `http://localhost:5000/api/`

## How It Works

- The Vite build configuration (`frontend/vite.config.ts`) is set to output to `backend/app/static/`
- The Flask app (`backend/app/__init__.py`) is configured to:
  - Serve API routes at `/api/*`
  - Serve static files (JS, CSS, images) from `backend/app/static/`
  - Serve `index.html` for all other routes (React Router handles client-side routing)
- The frontend API service (`frontend/src/services/api.ts`) uses relative paths (`/api`) when `VITE_API_BASE_URL` is not set, which works when served from the same domain

## Environment Variables

### Frontend
- `VITE_API_BASE_URL` (optional): API base URL. If not set, defaults to `/api` (relative path)

### Backend
- `SECRET_KEY`: Flask secret key
- `DATABASE_URL`: Database connection string
- `JWT_SECRET_KEY`: JWT secret key
- `FLASK_ENV`: Set to `development` for development mode

## Notes

- The `backend/app/static/` directory is in `.gitignore` as it contains build artifacts
- Always rebuild the frontend after making changes to see them in production mode
- In development mode, the frontend dev server proxies API requests to the backend
- CORS is only enabled in development mode when using separate frontend/backend servers

