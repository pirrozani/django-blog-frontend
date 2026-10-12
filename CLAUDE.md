# CLAUDE.md — django-blog-frontend

> **Scope note:** the global `~/.claude/CLAUDE.md` describes an unrelated project (master-thesis: LLM fine-tuning, `adapters/`, training runs). **None of it applies here.** Follow this file for this repo.

## What this is

React SPA for the `pirrozani/django-api` backend (Django 5 + DRF: authors and blogs). It's a **lean demo MVP** for a portfolio: browse blogs and authors without logging in, then log in with a shared demo account to create, edit and delete blogs. Free-tier hosting: **Cloudflare Workers** static assets (this repo), Render (API), Neon (Postgres). GitHub: `pirrozani/django-blog-frontend`.

**Sources of truth:**
- **Work to do:** GitHub issues on this repo, labelled `priority: P0`–`P3`, written with `.github/ISSUE_TEMPLATE/fix.md`.
- **Scope and issue order:** `docs/README.md`. `docs/05-frontend-plan.md` is the full plan; build only what `docs/README.md` marks as in scope.
- **API:** `docs/03-api-contract.md` is a copy. When it disagrees with the backend repo's copy, **the backend wins**. For exact field types, the live schema at `$VITE_API_URL/api/schema/` (→ `src/api/schema.d.ts`) wins over both.
- **Backend repo (local):** `../../django_api_project` (i.e. `Desktop/django_api_project`). Read-only from here; ask the `backend-contract` agent.

## Backend facts that shape the code

- **Two kinds of "user".** Login accounts are Django `auth.User` (the demo account): `POST /api/auth/token/` with `{username, password}` → `{"token": "..."}`. `/api/users/` are **authors**, which are content, not login accounts. Call them **"Authors"** in the UI text; routes stay `/users` and `/users/:id` as in `docs/05-frontend-plan.md`, and the API path is `/api/users/`.
- Auth header: `Authorization: Token <token>`. No cookies, no `credentials: 'include'`.
- Reads are public. Writes without a token return **401** with `WWW-Authenticate: Token`.
- `GET /api/auth/me/` → `{id, username, is_staff}`. `POST /api/auth/logout/` → 204, token revoked for **every** session on that account (the demo account is shared).
- Login errors: **400** `{"non_field_errors": [...]}`, **429** when throttled (20/min per IP).
- Errors: `{"detail": "..."}` or field errors `{"field": ["msg"]}`.
- **Pagination hasn't landed yet** (backend issue #11). Lists return plain arrays today and will become `{count, next, previous, results}`. Every list read goes through `src/api/pagination.ts`, which accepts both shapes and paginates on the client until the server does.
- `?search=` and `?author=` haven't landed either: no search in the MVP. An author's blogs come from `GET /api/users/<id>/blogs/` (200 with an empty list when there are none).
- Blogs embed a read-only `author {id, username, first_name, last_name}`. Writes send `user` (the author id).
- `POST` → 201 + object, `DELETE` → 204 empty body, `PATCH` supported. **Trailing slash on every path.**
- Render's free tier sleeps: the first request can take ~1 minute. The wake-up banner pings `GET /api/health/`.

## Stack & layout

| Concern | Choice |
|---|---|
| Runtime | Node LTS pinned in `.nvmrc`, **npm** (`package-lock.json` committed) |
| Build | Vite + React + TypeScript (`strict`) |
| Routing | React Router v7 (library mode, `createBrowserRouter`) |
| Server state | TanStack Query v5 |
| HTTP | `src/api/client.ts`: thin `fetch` wrapper (base URL, token header, JSON, typed `ApiError`) |
| API types | `openapi-typescript` → `src/api/schema.d.ts` (**generated, never hand-edited**) |
| Forms | React Hook Form + Zod |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Tests | Vitest + React Testing Library + MSW |
| Quality | ESLint (flat config) + Prettier + `tsc --noEmit` |
| Hosting | Cloudflare Workers static assets (`wrangler.jsonc`, Workers Builds from `main`) |

Folder layout: see `docs/05-frontend-plan.md` ("Proposed structure").

## Commands (Windows, Git Bash)

```bash
npm ci                     # install from package-lock.json
npm run dev                # http://localhost:5173 (backend on http://127.0.0.1:8000)
npm run lint
npm run typecheck          # tsc --noEmit
npm test                   # vitest run
npm run build              # tsc -b && vite build → dist/
npm run gen:api            # openapi-typescript $VITE_API_URL/api/schema/ -o src/api/schema.d.ts
npx wrangler deploy --dry-run   # validate wrangler.jsonc + dist/ without uploading
```

Local backend: `cd ../../django_api_project && uv run python manage.py runserver`. Local CORS already allows `http://localhost:5173`. Don't add a Vite proxy: going cross-origin locally catches CORS bugs early.

## Environment variables (read before touching config)

- There is **one** variable: `VITE_API_URL` (backend origin, no trailing slash). It is **not a secret**: Vite inlines it into the public JS bundle at build time, so anyone can read it.
- **Local:** `.env.local` (gitignored). **Template:** `.env.example` (committed, placeholder only).
- **Production:** set it in the Cloudflare dashboard → Workers & Pages → the worker → Settings → **Build → Variables and secrets** (a *build* variable). Don't use GitHub secrets (Workers Builds builds on Cloudflare, not in GitHub Actions). Don't use `vars` in `wrangler.jsonc` either: those are runtime variables for Worker code and never reach the Vite build.
- Changing it takes effect only after a **rebuild** (retry the build in Cloudflare or push to `main`).
- Never put a secret in any `VITE_*` variable, in code, or in the repo. The demo password is shown in the README (it's a public demo account) and nowhere else.
- When the Worker URL exists, the backend needs it in Render's `CORS_ALLOWED_ORIGINS`: exact origin, `https://`, no trailing slash, no spaces. That's a backend/Render change, so ask first.

## Claude Code helpers

| Helper | Use |
|---|---|
| `/issue <description>` | Investigate and draft a GitHub issue from the fix template (asks before creating) |
| `/resolve-issue <N>` | Implement issue #N on `feature/<N>-<slug>`, verify its acceptance criteria, report on the issue |
| `/pr` | Health check, then open a PR to `develop` with `Closes #N` (asks before pushing) |
| `/review-pr [N]` | Review PR #N (or the current branch) against its issue and these rules, with a verdict |
| `/health-check` | lint, typecheck, test, build, secret scan, in one read-only pass |
| `/api-sync [--write]` | Regenerate API types from the backend schema and diff them; diff the contract doc with the backend repo |
| `/deploy-check [frontend-url] [backend-url]` | Validate `wrangler.jsonc` and build; live CORS / deep-link / env checks after deploy |
| `/ui-smoke` | Drive the running app in a browser (Playwright) through the demo flows, with screenshots |
| `ui-reviewer` agent | React/TS review of the branch diff; `/resolve-issue` and `/review-pr` run it |
| `backend-contract` agent | Read-only answers about backend endpoints from the backend repo; drafts backend issues |

Hooks in `.claude/settings.json` block reading `.env*` / `.dev.vars`, editing `node_modules/`, `dist/` or the generated `src/api/schema.d.ts`, and running `wrangler deploy` (except `--dry-run`) or `wrangler secret`.

## Rules

1. **Never read `.env*` or `.dev.vars`.** Use `.env.example` to learn the variables.
2. **Never hand-edit `src/api/schema.d.ts`.** Regenerate it with `npm run gen:api` (see `/api-sync`).
3. Branch from `develop` as `feature/<N>-<slug>`; PRs go `feature/*` → `develop` → `main`. `main` deploys (Cloudflare Workers Builds). Never commit or open PRs directly against `main`. Squash-merge `feature/*` → `develop` (the squash message carries `Closes #N`); merge `develop` → `main` with a **merge commit, never squash**, so issues close at release.
4. Commit only when the user asks. Prefixes: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`.
5. PRs that resolve an issue include `Closes #N`. New problems become issues (`/issue`), not TODO comments. If the **backend** is wrong or missing something, draft an issue for `pirrozani/django-api` (the `backend-contract` agent writes the draft) instead of working around it silently.
6. Code style: TypeScript strict, no `any`, function components, named exports, single quotes (Prettier `singleQuote: true`), feature folders. Every server call goes through `src/api/`. One query-key factory per feature. Never use `dangerouslySetInnerHTML`; blog content is plain text (`whitespace-pre-wrap`).
7. Every page handles **loading, empty and error** states. Mutations invalidate the queries they affect.
8. Keep the MVP lean: no dependency beyond the stack table without asking.
9. Don't push, create issues/PRs, deploy, or touch external services (GitHub, Cloudflare, Render, Neon) without explicit confirmation.
