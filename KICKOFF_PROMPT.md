# Kickoff prompt

Open Claude Code **in this folder** (`cd Desktop/Repositories/django-blog-frontend && claude`) so it loads `CLAUDE.md`, `.claude/skills`, `.claude/agents` and the hooks. Then paste everything below the line.

Before you start: Node LTS and `gh` (logged in as `pirrozani`) installed; the backend runs locally (`cd ../../django_api_project && uv run python manage.py runserver`); the backend repo is at `../../django_api_project`.

---

You're starting the frontend for my Django REST API portfolio project. This folder already contains the project kit: `CLAUDE.md` (rules, stack, backend facts, env-var policy), `docs/` (MVP scope + issue order in `docs/README.md`; API contract, architecture, frontend plan and configuration copied from the backend repo), `.github/ISSUE_TEMPLATE/fix.md`, and Claude Code helpers (`/issue`, `/resolve-issue`, `/pr`, `/review-pr`, `/health-check`, `/api-sync`, `/deploy-check`, `/ui-smoke`, agents `ui-reviewer` and `backend-contract`, hooks in `.claude/settings.json`). Ignore the global `~/.claude/CLAUDE.md`; it belongs to another project.

**Goal:** a lean demo MVP React SPA (Vite + React + TypeScript) that consumes the backend at `VITE_API_URL`, deployed on Cloudflare Workers static assets. Visitors browse blogs and authors without logging in; with the shared demo account they create, edit and delete blogs.

Work in phases. Stop at the end of each phase, report in ≤15 lines, and wait for me. Ask before anything that touches GitHub, Cloudflare or Render, and before every push.

## Phase 0 — Orient (read-only)

1. Read `CLAUDE.md`, `docs/README.md`, `docs/03-api-contract.md`, `docs/05-frontend-plan.md`, `docs/06-configuration.md`.
2. Ask the `backend-contract` agent to confirm against the backend repo **on `main`**: list response shape (plain array vs paginated, backend #11), `Blog`/`User` field types and max lengths (for Zod), login error bodies (400/429), and whether `/api/users/<id>/blogs/` exists. Note any difference from `docs/03-api-contract.md`.
3. Report what you'll build and any contract surprises. Ask questions only if something blocks you.

## Phase 1 — Repository setup

1. `git init -b main`, commit the kit as `chore: add project docs and Claude Code helpers` (`.claude/settings.local.json` is gitignored; keep it that way), then create `develop` from it.
2. **Ask first**, then: `gh repo create pirrozani/django-blog-frontend --public --source . --remote origin`, push `main` and `develop`.
3. **Ask first**, then create labels `priority: P0`…`priority: P3` (same names as the backend repo; `bug`, `enhancement`, `documentation` exist by default; add `security`).

## Phase 2 — Issues

Use `/issue` in **batch mode** to draft the 9 MVP issues from "Recommended issue order" in `docs/README.md`, one per row, in that order, with the template's sections fully filled in. Show all drafts for one confirmation, then create them. Use these decisions so the issues are concrete:

1. **FE-01 Scaffold** (P0)
   - `create-vite` prompts when the folder isn't empty, so scaffold the `react-ts` template in a **temporary folder outside the repo**, copy its files in without overwriting `CLAUDE.md`, `docs/`, `.claude/`, `.github/`, merge its `.gitignore` into ours, then delete the temp folder.
   - `.nvmrc` (current Node LTS major) + `engines`; TS `strict` plus `noUncheckedIndexedAccess`.
   - Tailwind v4 via `@tailwindcss/vite`; ESLint flat config + `eslint-config-prettier`; Prettier with `singleQuote: true`.
   - Vitest + jsdom + React Testing Library + `@testing-library/user-event` + `jest-dom` + MSW.
   - Scripts: `dev`, `build`, `preview`, `lint`, `typecheck` (`tsc --noEmit` on the app config), `test` (`vitest run`), `format`, `gen:api`.
   - `src/config.ts` exports `API_URL` from `import.meta.env.VITE_API_URL` (trailing slash stripped), falling back to `http://127.0.0.1:8000` **only in dev**.
   - `vite.config.ts` uses `loadEnv` and throws a clear error when a **production build** has no `VITE_API_URL` ("set it in Cloudflare → Settings → Build → Variables and secrets").
   - `.env.example` with `VITE_API_URL=http://127.0.0.1:8000`. Folder skeleton from `docs/05-frontend-plan.md`.
   - Criteria: lint, typecheck, test (one smoke test) and build pass; the build fails without `VITE_API_URL`; `npm run dev` renders a placeholder.
2. **FE-02 API layer** (P1)
   - `scripts/gen-api.mjs`: origin from argv, else `VITE_API_URL` via Vite's `loadEnv`, else the local backend; runs `openapi-typescript <origin>/api/schema/ -o src/api/schema.d.ts`. Commit the generated file.
   - `src/api/client.ts`: `apiFetch` with base URL, JSON, `Authorization: Token <t>` when logged in, 204 → `undefined`, a typed `ApiError { status, detail?, fieldErrors, nonFieldErrors }` (network failure → status 0), and an `onUnauthorized` hook the auth provider registers.
   - `src/api/pagination.ts`: `toPage(data, page, pageSize = 10)` accepting a plain array (client-side slice) **or** `{count, next, previous, results}`, returning `{ items, count, page, pageSize, totalPages }`.
   - Typed endpoint modules: `auth.ts` (login, logout, me, health), `blogs.ts` (list, get, create, PATCH update, delete), `users.ts` (list, get, listUserBlogs).
   - Tests: `ApiError` mapping (`detail`, field errors, `non_field_errors`, 204) and `toPage` for both shapes.
3. **App shell, UX states, wake-up banner — FE-06 + FE-08** (P1)
   - `createBrowserRouter` with the routes from `docs/05-frontend-plan.md`, keeping the `/users` paths, labelled "Authors" in the UI.
   - Layout + navbar (Blogs, Authors, login or username + logout); `QueryClientProvider` (no retries on 4xx); Spinner, EmptyState, ErrorState with retry, NotFoundPage, route `errorElement`, ConfirmDialog on native `<dialog>`.
   - WakeUpBanner: ping `/api/health/` on load. If there's no answer within 2 s, show "Waking up the free server, this can take up to a minute…". Hide it on response; show a retry message on failure or after ~90 s.
   - Pick one visual direction with the `frontend-design` skill if it's available, and keep it.
   - Test: the banner appears with a delayed MSW handler and goes away on response.
4. **FE-03 Auth** (P1)
   - Token in `localStorage` (try/catch wrapper) under one key.
   - `AuthProvider`: calls `me()` on boot when a token exists, exposes `status` = `loading | authenticated | anonymous`, `user`, `login`, `logout`. Logout calls the API, then clears local state even if the call fails.
   - `onUnauthorized` clears the token and query cache and redirects to `/login` with a return path.
   - `LoginPage`: React Hook Form + Zod; shows `non_field_errors` and a 429 message; redirects to `state.from` or `/blogs`; no credentials shown anywhere (they are never published; see issue #9).
   - `RequireAuth`: spinner while loading, redirect when anonymous.
   - Tests: login success (redirects back), wrong password shows the API message, `RequireAuth` redirect.
5. **FE-04 Blog list + detail** (P1)
   - List with `?page=` in the URL, cards (title, author full name linking to `/users/:id`, date, excerpt), Pagination ("Page x of y", prev/next).
   - Detail with `whitespace-pre-wrap` content; edit/delete actions only when authenticated; unknown id → not-found state.
   - Test: list renders and page 2 works.
6. **FE-04 Blog create/edit/delete** (P1)
   - One form page for new and edit: author select from `users.list` ("First Last (@username)"), title and content, with Zod limits matching the backend.
   - Create → detail page; edit uses PATCH; server field errors shown on the fields; delete via ConfirmDialog → list.
   - Invalidate the blog list, the author's blog list and the detail.
   - Tests: client validation, and a server field error is displayed.
7. **FE-05 Authors** (P2): list (name, `@username`, registration date) and profile with that author's blogs from `/api/users/<id>/blogs/` (paginated via `toPage`, empty state). Read-only: author create/edit/delete stays a stretch item.
8. **FE-09 Deploy** (P1)
   - `wrangler.jsonc`: `name`, `compatibility_date`, `assets.directory: "./dist"`, `assets.not_found_handling: "single-page-application"`, no `main`, no `vars`. Add `wrangler` as a dev dependency.
   - `npx wrangler deploy --dry-run` and the local `/deploy-check` pass.
   - Then **I** do the dashboard steps (`/deploy-check` prints them), including setting `VITE_API_URL` as a Cloudflare **build** variable and adding the Worker URL to Render's `CORS_ALLOWED_ORIGINS`.
   - Done when `/deploy-check <frontend> <backend>` passes live. This needs the backend live on Render first.
9. **FE-10 README** (P3): what it is, live link, no demo credentials (never published; see issue #9), screenshots from `/ui-smoke --screenshots`, stack, architecture diagram, local setup, env var policy (`VITE_API_URL` is public and set in Cloudflare build variables, not GitHub), and the token-storage trade-off from `docs/05-frontend-plan.md`.

## Phase 3 — Build

Run `/resolve-issue` on the FE-01 issue, then stop and report. After that we go one issue at a time: I say "next" (or `/pr` first), and you take the next issue in order. Keep each branch to its issue, keep the MVP lean, and if the backend is missing something, draft a backend issue with the `backend-contract` agent instead of working around it.
