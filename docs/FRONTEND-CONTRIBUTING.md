# Frontend Development Guide

This guide will help new contributors understand the structure, conventions, and development workflow for the React + Vite + TypeScript frontend. It assumes no prior experience with modern frontend directory structures.

---

## Architecture Overview

**Data Flow:**

```
User → Layout → Page → Components → Hooks/Stores → API Service → Backend
Response ← API Service ← Components ← Page
```

This represents the logical path of data through the frontend application. When a user interacts with the UI, the components use hooks and services to fetch data from the backend, and responses flow back to update the UI.

---

## Directory Responsibilities

Each directory inside `src/` serves a specific purpose in keeping the codebase organized and scalable:

### `src/pages/`

This directory contains top-level **pages**, which represent entire routes in the app (e.g. `/dashboard`, `/login`). Each page typically handles data fetching, state setup, and rendering of components.

> Example: `DashboardPage.tsx`, `LoginPage.tsx`

### `src/layouts/`

Layouts define **consistent page structures** that can wrap multiple pages. They handle shared UI elements like navigation bars or sidebars.

> Example: `MainLayout.tsx` for authenticated users, `AuthLayout.tsx` for login/register screens.

### `src/components/`

All **reusable UI building blocks** live here. It is subdivided into:

* **`ui/`** — Components from shadcn/ui or small, generic UI parts (e.g. Button, Card, Input).
* **`common/`** — Shared structural components like Topbar, Sidebar, or Modal.
* **`features/`** — Components specific to a feature or module (e.g. user management tables, note cards).

Every component should use colors and variables defined in `index.css`, which contains the **main Tailwind and shadcn color configuration** to ensure visual consistency.

### `src/hooks/`

This is where **custom React hooks** are defined. Hooks encapsulate reusable logic such as fetching data, managing authentication, or handling input.

> Example: `useAuth()` checks the user’s authentication status; `useFetch<T>()` simplifies API data fetching.

### `src/store/`

Contains **global state management** using Zustand. Stores are like central data hubs that multiple components can access without prop drilling.

> Example: `useUserStore()` keeps track of the logged-in user, accessible from anywhere in the app.

### `src/services/`

Contains functions that handle **API communication**. Each service file is responsible for a specific area (e.g. `authService.ts`, `userService.ts`).

> Example: `authService.login()` calls the backend `/auth/login` endpoint and returns the user data.

### `src/schemas/`

Holds **Zod schemas** used for validating data. This ensures that form inputs and API responses match expected formats.

> Example: `LoginSchema` validates that both email and password are provided.

### `src/types/`

Defines **TypeScript types and interfaces** for data models, API responses, and props. Types make the code more reliable and easier to navigate.

> Example: `User`, `AuthResponse`, `Item`.

### `src/utils/`

Utility and helper functions that can be reused across features. These handle common logic like formatting, date conversion, or API error parsing.

> Example: `formatDate()`, `handleApiError()`.

### `index.css`

The **central styling file**. It defines the main Tailwind and shadcn color tokens, font settings, and any global design variables. All components must use these styles to maintain consistency.

> Never hardcode colors—always use the variables defined here.

---

## Development Workflow

### 1. Plan Your Feature

* Understand the feature’s purpose and data needs.
* Determine if it requires a new page, a component, or just a modification.

### 2. Define Types and Schemas

* Create or update TypeScript types in `src/types/`.
* Add Zod validation schemas in `src/schemas/`.

### 3. Update or Create Services

* Add API communication logic in `src/services/`.

### 4. Build Components

* Place small UI elements in `ui/`, larger reusable sections in `common/`, and feature-specific parts in `features/`.

### 5. Add Pages and Layouts

* Create new route pages in `src/pages/`.
* Wrap them with the appropriate layout in `src/layouts/`.

### 6. Connect with Hooks and Store

* Use or create hooks for logic.
* Use Zustand stores for global state (e.g. `useUserStore()`).

### 7. Style Using Tailwind & index.css

* Always use colors, spacing, and fonts from `index.css`.
* Maintain consistency with Tailwind utilities and shadcn/ui.

### 8. Test Your Feature

* Run the app locally: `npm run dev`
* Check browser console for errors.
* Use mock data if backend is not ready.

---

## Pre-Commit Check

Before pushing your code, ensure all formatting and linting rules are followed:

```bash
npm run pre-commit
```

This automatically formats your code, sorts imports, and ensures consistent styling across the project.

---

## Best Practices

1. **Keep components small and reusable.**
2. **Use TypeScript everywhere.** Avoid `any`.
3. **Validate input and API data** using Zod.
4. **Centralize API calls** in `src/services/`.
5. **Use Zustand for global state**, and React context only when necessary.
6. **Follow consistent styling** using Tailwind and index.css.
7. **Always test** new features thoroughly before creating a PR.
8. **Commit cleanly** — use descriptive commit messages and run pre-commit scripts.

---

## Getting Help

* Review existing components to follow established patterns.
* Ask for feedback during development.
* Document new patterns in this guide if they become standard practice.
