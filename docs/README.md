# Project docs — django-blog-frontend

React SPA for the [`pirrozani/django-api`](https://github.com/pirrozani/django-api) backend. This repo builds a **lean demo MVP**: everything a reviewer needs to see the API working from a real UI, and nothing more.

## Reading order

| Doc | What's in it | Owner |
|---|---|---|
| [GitHub issues](https://github.com/pirrozani/django-blog-frontend/issues) | **Start here.** One issue per work item, labelled `priority: P0`–`P3` | this repo |
| This file | MVP scope, issue order, sync rules | this repo |
| [01-architecture.md](01-architecture.md) | Target architecture, decision log, free-tier constraints | **backend** (copy) |
| [03-api-contract.md](03-api-contract.md) | Endpoints, auth, JSON shapes the UI builds against | **backend** (copy) |
| [05-frontend-plan.md](05-frontend-plan.md) | Full frontend plan: stack, structure, routes, FE-01…FE-10 | **backend** (copy) |
| [06-configuration.md](06-configuration.md) | Env vars for both apps, local dev setup | **backend** (copy) |

The copied docs link to backend docs that don't exist here (`02-…`, `04-…`, `07-…`, `08-…`). Read those in the backend repo: `https://github.com/pirrozani/django-api/tree/develop/docs`.

## MVP scope

| FE item | In the MVP | Left out (stretch) |
|---|---|---|
| FE-01 Scaffold | Vite React TS strict, Tailwind, ESLint/Prettier, Vitest, folders, `.env.example`, `.nvmrc` | — |
| FE-02 API layer | `gen:api`, `client.ts` + `ApiError`, `pagination.ts` (array **or** paginated), per-resource endpoint functions | `openapi-fetch` |
| FE-03 Auth | Login page, `AuthProvider` (token in `localStorage`, `/api/auth/me/` on boot), logout, `RequireAuth`, auto-logout on 401 | — |
| FE-04 Blogs | List (page numbers), detail with author link, create/edit form (author select), delete with confirm | Search |
| FE-05 Authors | List and profile with that author's blogs (read-only) | Author create/edit/delete |
| FE-06 UX states | Spinner, empty state, error state with retry, 404 page, one error boundary | Skeletons, toasts, optimistic updates |
| FE-07 Tests | A few: `ApiError` mapping, pagination normalizer, login flow, `RequireAuth` redirect | Full page coverage |
| FE-08 Wake-up banner | In | — |
| FE-09 Deploy | `wrangler.jsonc`, Workers Builds from `main`, `VITE_API_URL` as a build variable, backend CORS updated | Preview-branch builds |
| FE-10 README | Comprehensive README (no demo credentials): live link, screenshots, stack, architecture, setup, token-storage trade-off | GIF |
| CI | — | GitHub Actions lint/typecheck/test/build |

## Recommended issue order

| # | Issue | Work item | Priority |
|---|---|---|---|
| 1 | Scaffold the Vite + React + TS app | FE-01 | P0 |
| 2 | API client, generated types and pagination normalizer | FE-02 | P1 |
| 3 | App shell: layout, nav, routes, UX state components, wake-up banner | FE-06, FE-08 | P1 |
| 4 | Token login, logout and protected routes | FE-03 | P1 |
| 5 | Blog list and detail pages | FE-04 | P1 |
| 6 | Create, edit and delete blogs | FE-04 | P1 |
| 7 | Author list and profile pages | FE-05 | P2 |
| 8 | Deploy to Cloudflare Workers | FE-09 | P1 |
| 9 | Comprehensive README documenting the whole project (no demo credentials) | FE-10 | P3 |

Each issue carries its own small tests (FE-07 is spread across them).

**Priority labels:** P0 = the app doesn't build or run · P1 = blocks the demo or deploy, or a security problem · P2 = a demo page or UX the demo needs · P3 = polish/portfolio.

## Keeping in sync with the backend

- **The backend owns the API.** Run `/api-sync` after the backend changes (especially when issue #11, pagination, lands) and copy the backend's `03-api-contract.md` over this one.
- If the UI needs something the API doesn't do, file it on the backend repo (draft it with the `backend-contract` agent) instead of working around it.
- When a backend issue lands that affects the UI (e.g. #11 pagination, search filters), open a frontend issue to adopt it.
