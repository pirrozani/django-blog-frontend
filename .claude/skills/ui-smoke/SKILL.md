---
name: ui-smoke
description: Run the SPA against a backend and drive it in a real browser (Playwright MCP) through the demo flows - browse blogs and authors, log in, create, edit and delete a blog, log out - checking console errors and failed requests, with a screenshot per step. Use to confirm a feature works in the real app, before /pr on UI changes, or to capture README screenshots (--screenshots).
---

# /ui-smoke [--prod <frontend-url>] [--screenshots]

## Setup

1. **Browser tool.** Load the Playwright MCP tools (`mcp__plugin_playwright_playwright__*`) with ToolSearch. If they aren't available, say so, suggest installing the Playwright plugin, and stop.
2. **Target.**
   - `--prod <url>`: use the deployed app; skip steps 3–4.
   - Otherwise local: the backend must answer `curl -s -m 5 http://127.0.0.1:8000/api/health/`. If it doesn't, ask before starting it in the background: `cd ../../django_api_project && uv run python manage.py runserver` (run_in_background).
3. Start `npm run dev` in the background and wait until `http://localhost:5173` responds.
4. **Credentials.** Ask the user for the demo username and password **in chat** each run. Never read them from files, never write them to files, screenshots names or reports. If the user declines, run only the public flows.

## Flows

Take a screenshot after each step (scratchpad by default; `docs/screenshots/<nn>-<step>.png` with `--screenshots`). After each step, read console messages and network requests: any console error, or any 4xx/5xx other than an expected 401/404, is a finding.

1. `/` redirects to `/blogs`; the list renders with titles and author names; pagination controls work (page 2, back).
2. Open a blog: title, content and author link; the author link opens that author's profile with their blogs.
3. `/users` ("Authors") list renders; a profile with no blogs shows the empty state.
4. Visit `/blogs/new` while logged out: redirected to `/login`.
5. Log in with a **wrong** password: the form shows the API's error message, no crash.
6. Log in with the real credentials: redirected back to `/blogs/new`; the nav shows the account name and a logout button.
7. Create a blog titled `Smoke test <timestamp>`: success, it shows on the detail page and in the list.
8. Edit its title: the change shows after save.
9. Delete it via the confirm dialog: it disappears from the list (query invalidated, no manual refresh).
10. Log out: write actions are hidden again; `/blogs/new` redirects to `/login`.
11. Visit `/does-not-exist`: the 404 page renders.

If a step fails, record it, try the next independent step, and always clean up: delete any `Smoke test` blog you created (through the UI, or ask before deleting through the API).

## Teardown

Close the browser and stop the background dev server(s) **you** started.

## Output

At most 15 lines: one line per flow (`PASS`/`FAIL` + one-line evidence), findings as `[HIGH|MEDIUM|LOW] page — problem`, and where the screenshots are.
