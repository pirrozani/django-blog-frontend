---
name: deploy-check
description: Validate the Cloudflare Workers deployment of the SPA - wrangler.jsonc, a production build with VITE_API_URL, wrangler dry run, env-var hygiene - and, given live URLs, check health, CORS, deep links and that the deployed bundle points at the right backend. Read-only; never deploys and never changes Cloudflare or Render settings. Use before the first deploy, after a deploy, or when the live demo misbehaves (CORS errors, 404 on refresh, calls going to the wrong API).
---

# /deploy-check [frontend-url] [backend-url]

Two parts: **local** (always) and **live** (only when both URLs are given). Deploys happen only through Cloudflare Workers Builds when `main` changes; this skill never runs `wrangler deploy` (the hook blocks it) and never edits dashboard settings.

## Local checks

1. **`wrangler.jsonc`** (read it):
   - `name` is set; `compatibility_date` is a real date, not in the future;
   - `assets.directory` is `"./dist"` and `assets.not_found_handling` is `"single-page-application"` (deep links like `/blogs/3` work after refresh);
   - no `main` entry unless the repo really has Worker code (MVP: none);
   - **no `vars` holding `VITE_*`**. Those are runtime variables and never reach the Vite build. Flag it as a FAIL with that explanation.
2. **Env hygiene:**
   - `.env.example` exists and lists `VITE_API_URL` with a placeholder only;
   - `.gitignore` ignores `.env*` except `.env.example`, plus `.dev.vars`, `dist/` and `.wrangler/`. Check it with the **Grep tool** on `.gitignore` (the hook blocks shell commands that mention `.env` files);
   - `git ls-files` lists no `.env*` file other than `.env.example`.
3. **Build:** `VITE_API_URL=https://example.invalid npm run build`, then `npx wrangler deploy --dry-run` (needs no login). Report the asset count and total size from its output.
4. **API URL usage:** Grep `src/` for `import.meta.env`. Only `VITE_API_URL` should appear, read in one place (`src/api/client.ts` or a small `src/config.ts`).

## Live checks (frontend and backend URLs given)

Use `curl -s -m 90` (Render may be asleep; say so if the first call is slow).

1. **Backend up:** `curl -s <backend>/api/health/` → `{"status":"ok"}`.
2. **CORS preflight:**
   ```bash
   curl -s -o /dev/null -D - -X OPTIONS <backend>/api/blogs/ \
     -H "Origin: <frontend>" -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: authorization,content-type"
   ```
   `access-control-allow-origin` must equal `<frontend>` exactly. If it's missing, the fix is on Render: add the exact origin (`https://…workers.dev`, no trailing slash, no spaces) to `CORS_ALLOWED_ORIGINS` and redeploy the backend. Tell the user; don't change it.
3. **SPA fallback:** `curl -s -o /dev/null -w '%{http_code}' <frontend>/blogs/1` → `200`, and the body is the app's `index.html`.
4. **Right backend baked in:** fetch `<frontend>/`, find the main `assets/*.js` file, and check it contains `<backend>`'s host. If it holds `example.invalid`, `127.0.0.1` or another host, `VITE_API_URL` is wrong or missing in the Cloudflare **build** variables; the fix is to set it there and retry the build.
5. **Public read from the browser's origin:** `curl -s -H "Origin: <frontend>" <backend>/api/blogs/ | head -c 200` returns JSON.

## First-time setup checklist (print it; never do it)

1. Cloudflare dashboard → Workers & Pages → Create → Import a repository → `pirrozani/django-blog-frontend`.
2. Build command `npm run build`, deploy command `npx wrangler deploy`, production branch `main`.
3. Settings → Build → Variables and secrets → add `VITE_API_URL = https://<backend>.onrender.com` (build variable; not secret, but not in GitHub either).
4. Deploy, copy the `https://<name>.<account>.workers.dev` URL.
5. Render → backend service → Environment → add that URL to `CORS_ALLOWED_ORIGINS` → redeploy.
6. Re-run `/deploy-check <frontend> <backend>`.

## Output

At most 15 lines: one line per check (`PASS`/`FAIL`/`WARN`/`SKIP` + short reason), then the fix for each FAIL and where it's made (repo, Cloudflare dashboard, or Render).
