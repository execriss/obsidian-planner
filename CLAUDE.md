# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Dev server (localhost:5173)
npm run build      # Production build → dist/
npm run lint       # ESLint
npx wrangler deploy                  # Deploy frontend to calendario.exegestion.com
cd api-worker && npx wrangler deploy # Deploy REST API to api.exegestion.com
```

No test suite exists.

## Architecture

Two independent deployable units:

### 1. Frontend — React + Vite (`src/`)

SPA deployed as static assets on Cloudflare Workers. Single entry point: `App.jsx` renders `<Loader>` (auth check) → `<AuthGate>` (unauthenticated) → `<Planner>` (main app).

`<Planner>` owns all top-level state: active view (`calendar` | `monthly` | `grocery` | `servicios` | `habitos` | `notas` | `docs` | `settings`), the selected date, and the calendar navigation month/week. It passes `userId` down to section components and `addExpense` to sections that can create expenses (Services).

**Data flow:**
- `useData` (tasks + expenses) is fetched once at the `<Planner>` level and shared across calendar views and `MonthlyReport`.
- All other sections (`useNotes`, `useHabits`, `useGrocery`, `useServices`, `useDocuments`) fetch independently inside their own component via their dedicated hook. Each hook exposes `loading` + CRUD methods.
- `src/lib/db.js` is the only file that talks to Supabase. All functions map between camelCase (JS) and snake_case (DB) via `dbToX()` / `xToDb()` helpers.

**Styling:**
- Global design tokens (colors, fonts, easings, keyframes, utility classes) live in `src/index.css`.
- Each component has its own CSS Module (`ComponentName.module.css`). Never use inline styles except for dynamic values that can't be expressed in CSS (e.g. `--accent: ${color}`).
- Shared keyframes (`fadeUp`, `float`, `item-out`, `check-done`, `animate-viewIn`, `form-spring`) are defined globally in `index.css` and applied as plain class names, not CSS Modules.
- Color palette: `--obsidian` (bg), `--cream` (text), `--amber` (primary accent), `--sage` (green), `--coral` (red), `--blue`, `--border`.

**Loading states:**
- `<SectionSkeleton variant="notes|habits|services|rows">` renders shimmer placeholders. All section components use it: check that `loading` is destructured from the hook and returned early as `<SectionSkeleton>` before the main render.

### 2. REST API — Cloudflare Worker (`api-worker/`)

Stateless edge function. Auth resolves a Bearer API key against the `api_keys` Supabase table (in-memory cache, 5-min TTL). Uses the Supabase **service role key** (secret) to bypass RLS and query on behalf of the resolved `user_id`.

Routes: `GET|POST|PATCH|DELETE /tasks`, `GET|POST|DELETE /expenses`, `GET /summary/today`, `GET /summary/monthly`.

## Environment

Frontend requires `.env.local`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

API Worker requires Wrangler secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
