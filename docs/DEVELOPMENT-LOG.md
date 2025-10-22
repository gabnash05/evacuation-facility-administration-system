# Directory Setup 
- EFASS-24: Create Project Directory
- Kim Gabriel A. Nasayao
- 10/15/2025 - 10/19/2025

---

## Backend
```bash
cd backend
```

### Install Pipenv globally (if not already installed)
```bash
pip install pipenv
```

### Install all project dependencies - Pipenv will auto-create the virtual environment
```bash
pipenv install flask
pipenv install flask-sqlalchemy
pipenv install flask-migrate
pipenv install flask-jwt-extended
pipenv install flask-cors
pipenv install marshmallow
pipenv install psycopg2-binary
pipenv install gunicorn
pipenv install werkzeug
```

### Development tools and linters
```bash
pipenv install --dev flake8
pipenv install --dev black
pipenv install --dev isort
pipenv install --dev python-dotenv
```

### Activate the virtual environment that Pipenv created
``` bash
pipenv shell
```

### Setup Backend Configuration Files
```bash
touch .flake8 .env .env.example
```

#### .flake8 File
```ini
[flake8]
max-line-length = 100
extend-ignore = E203, W503
exclude = .git,__pycache__,*.pyc,venv,migrations
```
#### .env File
```text
# Flask Configuration
FLASK_APP=wsgi.py
FLASK_ENV=development
SECRET_KEY=your-super-secret-key-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-change-this-too

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/efas_db

# CORS Configuration
CORS_ORIGINS=http://localhost:3000

# Optional: Application Settings
API_PREFIX=/api/v1
DEBUG=True
```

#### .env.example

```
# Flask Configuration
FLASK_APP=wsgi.py
FLASK_ENV=development
SECRET_KEY=
JWT_SECRET_KEY=

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/efas_db

# CORS Configuration  
CORS_ORIGINS=http://localhost:3000

# Optional: Application Settings
API_PREFIX=/api/v1
DEBUG=True
```

### Setup Backend Directory
```bash
mkdir -p app/models app/routes app/schemas app/services app/utils

touch app/__init__.py app/config.py
touch app/models/__init__.py app/models/user.py app/models/event.py app/models/center.py app/models/household.py app/models/individual.py
touch app/routes/__init__.py app/routes/auth.py app/routes/events.py app/routes/centers.py app/routes/households.py app/routes/individuals.py
touch app/schemas/__init__.py app/schemas/user.py app/schemas/event.py app/schemas/center.py app/schemas/household.py app/schemas/individual.py
touch app/services/__init__.py app/services/auth_service.py app/services/event_service.py app/services/center_service.py app/services/household_service.py
touch app/utils/__init__.py app/utils/validators.py
```

### Create Core Application Files

- Create `app/__init__.py`:

- Create `app/config.py`:


### Create Database Model Scaffolding 

- Create `app/models/__init__.py`:

- Create `app/models/user.py`:


### Create Route Blueprint and Scaffolding
- Create `app/routes/centers.py`:


### Create Application Entry Points
- Create `wsgi.py` at `backend/`:

- Create `run.py` at `backend/`:


### Add scripts to Pipfile
```
[scripts]
dev = "python run.py"
start = "gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app"
init-db = "flask db init"
migrate = "flask db migrate"
upgrade = "flask db upgrade"
lint = "flake8 app tests"
format = "black app tests && isort app tests"
```

### Add .gitignore file


### Add Service and Model Scaffolding


### Setup PostgreSQL Database
- Create `database/sql` directory
- Create `create_tables.sql` file
- Add `setup-db = "python database/setup_db.py"` to Pipfile scripts

---

## Frontend
```bash
cd ..
```

### Create Frontend Directory and Initialize
```bash
cd ..
mkdir frontend
cd frontend
```

### Initialize Vite + React + TypeScript
```bash
npm create vite@latest . -- --template react-ts
npm install
```

### Install All Required Dependencies
```bash
# Core dependencies
npm install react-router-dom axios zustand
npm install react-hook-form @hookform/resolvers zod
npm install lucide-react

# Development tools
npm install -D @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-plugin-react-hooks eslint-plugin-react-refresh
npm install -D prettier eslint-config-prettier eslint-plugin-prettier
npm install -D @vitejs/plugin-react
npm install -D husky lint-staged

# UI & Styling
npm install -D tailwindcss @tailwindcss/vite
```

### Edit vite.config.ts
Run
```bash
npm install -D @types/node
```

Edit
```ts
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

### Edit index CSS File (src/index.css)
```css
@import "tailwindcss";
```

### Edit tsconfig.json
```json
{
    "files": [],
    "references": [
        { "path": "./tsconfig.app.json" },
        { "path": "./tsconfig.node.json" }
    ],
    "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

### Edit tsconfig.app.json
```json
{
  "compilerOptions": {
    // ...
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
    // ...
  }
}
```

### Initialize shadcn/ui
```bash
npx shadcn@latest init
```

### Setup Global CSS File

### Create the Theme Provider
Create src/components/theme-provider.tsx:

```tsx
import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove("light", "dark")

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
```

### Create a Mode Toggle Component
Create src/components/mode-toggle.tsx:

```tsx
import { Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useTheme } from "@/components/theme-provider"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Wrap your App with the Theme Provider
Update your src/App.tsx or src/main.tsx:

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/ThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <ThemeProvider>
            <App />
        </ThemeProvider>
    </StrictMode>,
)
```

### Add Custom Font to Project
```bash
mkdir -p src/assets/lexend
touch src/assets/fonts/index.css
```

Edit index.css
```css
/* Lexend Variable Font */
@font-face {
    font-family: 'Lexend';
    font-style: normal;
    font-weight: 100 900;
    font-display: swap;
    src: url('./lexend/Lexend-VariableFont_wght.ttf') format('truetype-variations');
}

/* Fallback for browsers that don't support variable fonts */
@font-face {
    font-family: 'Lexend Fallback';
    font-style: normal;
    font-weight: 400;
    font-display: swap;
    src: url('./lexend/Lexend-VariableFont_wght.ttf') format('truetype');
}
```

Update src/index.css
```css
@import "tailwindcss";
@import "./assets/fonts/index.css";

@theme inline {
  /* Define Lexend as the primary font */
  --font-sans: 'Lexend', 'Lexend Fallback', system-ui, sans-serif;
  
  /* Your existing theme variables */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  /* ... rest of your theme */
}

@layer base {
  html {
    font-family: var(--font-sans);
  }
  
  /* Ensure all elements inherit the font */
  body, input, button, textarea, select {
    font-family: inherit;
  }
}
```

### Setup Directory Structure
```bash
mkdir -p src/{components/{common,features},layouts,pages/{auth,city-admin,center-admin,volunteer,shared},hooks,schemas,services,types,utils,contexts,store}

# Components & Layouts
touch src/components/common/DataTable.tsx src/components/common/SearchBar.tsx
touch src/layouts/MainLayout.tsx src/layouts/RoleLayout.tsx src/layouts/CityAdminLayout.tsx src/layouts/CenterAdminLayout.tsx src/layouts/VolunteerLayout.tsx src/layouts/AuthLayout.tsx

# Pages
touch src/pages/auth/login/LoginPage.tsx src/pages/auth/logout/LogoutPage.tsx
touch src/pages/shared/profile/ProfilePage.tsx src/pages/shared/settings/SettingsPage.tsx

# Hooks & Services
touch src/hooks/useAuth.ts src/hooks/useApi.ts
touch src/services/api.ts src/services/authService.ts

# Types, Schemas, & Contexts
touch src/types/center.ts src/types/household.ts src/types/event.ts src/types/user.ts src/types/api.ts src/types/event-center.ts
touch src/contexts/AuthContext.tsx src/contexts/AppContext.tsx
touch src/schemas/index.ts src/schemas/auth.ts src/schemas/events.ts src/schemas/centers.ts src/schemas/households.ts src/schemas/search.ts

# Store, Lib & Utils
touch src/store/authStore.ts
```

### Edit eslint.config.js File
```js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig } from 'eslint/config'

export default defineConfig([
    { ignores: ['dist'] },  // ⬅️ Ignore build directory
    {
        files: ['**/*.{ts,tsx}'],  // ⬅️ Apply to all TypeScript/TSX files
        extends: [
            js.configs.recommended,           // ⬅️ Basic JavaScript rules
            tseslint.configs.recommended,     // ⬅️ TypeScript-specific rules
            reactHooks.configs['recommended-latest'], // ⬅️ React Hooks rules
            reactRefresh.configs.vite,        // ⬅️ Vite + React hot reload safety
        ],
        languageOptions: {
            ecmaVersion: 2020,        // ⬅️ Use modern JavaScript features
            globals: globals.browser, // ⬅️ Browser globals (window, document, etc.)
        },
        rules: {
            'react-refresh/only-export-components': [  // ⬅️ Prevents invalid hot reload
                'warn',
                { allowConstantExport: true },
            ],
            '@typescript-eslint/no-unused-vars': 'error',  // ⬅️ Error on unused variables
            '@typescript-eslint/no-explicit-any': 'warn',  // ⬅️ Warn when using `any` type
            'max-len': ['error', { code: 100 }],  // ⬅️ Enforce 100 char line length
        },
    },
])
```

### Create .prettierrc:
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "endOfLine": "lf"
}
```

### Create .prettierignore:

```text
node_modules/
dist/
build/
.coverage/
.env
```

### Create Environment Files
Create .env:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=EFAS
VITE_APP_VERSION=1.0.0
```

Create .env.example:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=EFAS
VITE_APP_VERSION=1.0.0
```

### Create Core Type Definitions
refer to types directory

### Create Zod Schemas
refer to schemas directory

### Create Core Utility Functions
refer to utils library

### Create Core Service Files
Create `service/api.ts`

### Create Sample Service File
Create `service/authService.ts`

### Store Setup (Zustand)
Create `src/store/authStore.ts`:

### Create Create Custom Hooks
Create `src/hooks/useAuth.ts` and `src/hooks/useApi.ts`

### Update package.json 
```json
{
    "scripts": {
        "dev": "vite",
        "build": "tsc && vite build",
        "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "lint:fix": "eslint . --ext ts,tsx --fix",
        "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
        "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\"",
        "type-check": "tsc --noEmit",
        "preview": "vite preview",
        "prepare": "husky install",
        "pre-commit": "npm run lint:fix && npm run format && npm run type-check",
        "validate": "npm run lint && npm run type-check && npm run build"
    }
}
```

### Setup Husky for auto pre-commit checking
```bash
npx husky init
```

Edit generated pre-commit file:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running EFAS pre-commit checks..."

npm run pre-commit

echo "[✔] EFAS pre-commit checks passed!"
```

### Finish up Frontend Setup
```bash
npm install
npm run type-check
npm run lint
npm run format
npm run dev
```


# Master Layout 
- EFASS-26: Master Layout
- Kim Gabriel A. Nasayao
- 10/20/2025 - 10/2X/2025

---

## Create Sidebar Component
- props: role
- based on role, it determines which sidebar is generated
- use Link component from react router to change pages

## Create Topbar Component
- shows which user role is logged in
- has ModeToggle for theme

## Create MainLayout
- instead of separate layouts for each user, a single layout that passes in the user role into the Sidebar component is created
- it gets the role of the user from useAuth hook

## Create ProtectedRoute.tsx
- this is a component that handles reroutes if the user is not yet authenticated
- it uses useAuth hook to determine this and reroutes users

## Create Mock Pages and Mock Login Page for testing

## Use a Mock useAuth hook

## Create App.tsx that handles all routing
- refer to App.tsx routing. its hella complicated.

## Create Sample Page
- `pages/CityAdminDashboardSample.tsx`

## Add Blank Pages connected into App.tsx to make it easier for collaborators to develop their parts