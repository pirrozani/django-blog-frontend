---
name: health-check
description: One-pass, read-only health check of the React frontend (Node version, install, lint, typecheck, tests, production build, secret scan of src/ and dist/), with each failure mapped to its GitHub issue. Use when the user asks whether the app builds or runs, after dependency changes, or as the verification step of /resolve-issue and /pr.
---

# /health-check

Run each step once, from the repo root. Don't stop at the first failure (except where noted), and don't modify tracked files. Cap each command with a 5-minute timeout.

## Steps

0. **Scaffolded?** If there's no `package.json`, report `FAIL not scaffolded yet → FE-01` and stop.
1. **Node:** `node -v` against `.nvmrc` (major version must match). If `node_modules/` is missing, run `npm ci` (this is the one write the check makes, and it only touches `node_modules/`). Then `npm ls --depth=0` must exit cleanly.
2. **Lint:** `npm run lint`
3. **Typecheck:** `npm run typecheck`
4. **Tests:** `npm test` (report pass/fail counts, not full output)
5. **Production build** with a dummy, non-secret URL:
   ```bash
   VITE_API_URL=https://example.invalid npm run build
   ```
   Variables set in the shell take precedence over env files, so this build never picks up local values.
   Then confirm the build fails **without** it: `env -u VITE_API_URL npm run build` should exit non-zero with a clear message (the `vite.config.ts` guard from FE-01). Vite also loads `.env.local` in production mode, so first use the **Glob tool** to see whether `.env.local` exists; if it does, mark this sub-check `SKIP (local env file present)`. If the build succeeds without any value, report `WARN production build doesn't require VITE_API_URL`.
6. **Secret scan:** search `src/` and `dist/` (Grep tool) for `postgres(ql)?://`, `DATABASE_URL`, `SECRET_KEY`, `DEMO_PASSWORD`, `Token [0-9a-f]{40}`, and `dangerouslySetInnerHTML`. Any hit is a FAIL with `file:line`. Also confirm `src/api/schema.d.ts` exists once FE-02 has landed.
7. **Clean-up:** `dist/` from step 5 stays (it's gitignored). Run `git status --short` and report anything the check itself changed (it should be nothing).

## Mapping failures to issues

| Symptom | Issue |
|---|---|
| No `package.json`, no `.nvmrc`, ESLint/Prettier/Vitest not configured | FE-01 (scaffold) |
| `src/api/schema.d.ts` missing, type errors in `src/api/` | FE-02 (API layer); run `/api-sync` |
| Type errors after a backend change | `/api-sync`, then a frontend issue to adopt the change |
| Build succeeds without `VITE_API_URL` | FE-01 (`vite.config.ts` guard) |
| Secret or token in `src/`/`dist/` | **stop and tell the user**; file with `/issue` (P1, `security`) |
| Unknown failure | Suggest `/issue <symptom>` |

Look up the issue number for each FE item with `gh issue list --state all --search "FE-0x in:body" --limit 5`. If the issue is closed, the failure is a regression: suggest reopening it or filing a new one.

## Output

At most 15 lines: one line per step (`PASS`/`FAIL`/`WARN`/`SKIP` plus a short reason), then the open issues to work on next, in the order in `docs/README.md`. Show raw output only for the failing lines (≤10 lines).
