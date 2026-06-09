# TaskFlow

A project & task management workspace — the `taskflow-prototype.html` mock, rebuilt as a
responsive Next.js 16 (App Router) application with **users, projects, and tasks split into
independent services** so each can later become its own microservice.

## Run

```bash
npm run dev      # http://localhost:3000
npm run build    # production build + typecheck
```

Demo login: `sovan@divii.com` / any password. Use the **View as** toggle (top-right) to switch
between the Admin and User role views. Register creates a new `User`.

## Architecture — built for a future microservice split

The seam between front end and data is HTTP. Each domain owns its data, its rules, and its
endpoints, and references the others **by ID only** — no service imports another.

```
app/
  (auth)/login, (auth)/register      ← public auth screens
  (app)/                             ← authenticated shell (sidebar + topbar, responsive drawer)
    dashboard, projects, projects/[id], tasks, users, profile
  api/                               ← API GATEWAY — thin route handlers, one per service
    users/…  projects/…  tasks/…  auth/login  auth/register

services/                            ← THE SERVICES (each independently extractable)
  users/index.ts                     ← owns users:    validation, uniqueness, store
  projects/index.ts                  ← owns projects: validation, store
  tasks/index.ts                     ← owns tasks:    validation, store

lib/
  types.ts          ← shared API contracts (the only thing crossing service boundaries)
  api.ts            ← typed client; per-domain BASE urls = the microservice seam
  service-error.ts  ← domain errors → HTTP status mapping
  route-helpers.ts  ← keeps every route handler a thin adapter
```

**How it becomes microservices later:** each `services/<name>` module is self-contained and
swaps its in-memory store for a real database without touching callers. The route handlers in
`app/api/<name>` are the gateway in front of each service. In `lib/api.ts`, every domain has its
own base URL (`NEXT_PUBLIC_USERS_API`, `NEXT_PUBLIC_PROJECTS_API`, `NEXT_PUBLIC_TASKS_API`) that
today defaults to `/api/<name>` but can be repointed at a standalone deployment — the network hop
is already where the boundary is.

> **Note:** services use in-memory stores seeded from the prototype data (kept on `globalThis` so
> they survive dev hot-reloads). Data resets when the server restarts. Swap each store for a real
> DB to persist.

## Responsiveness

The full layout is fluid: the sidebar collapses into a slide-in drawer (☰) under 860px, stat and
chart grids reflow to a single column, the kanban board stacks, and tables scroll horizontally.

Built per the project's `AGENTS.md` against the version-matched docs in `node_modules/next/dist/docs/`.
