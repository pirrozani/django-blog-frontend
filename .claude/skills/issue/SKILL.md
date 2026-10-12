---
name: issue
description: Investigate a problem or work item in the frontend repo and file it as a GitHub issue filled in with the project's fix template (Problem / Evidence / Impact / Fix / Acceptance criteria / Notes), with priority and type labels. Also drafts backend issues for pirrozani/django-api when the API is at fault. Use when the user asks to create, open, file, log or draft an issue, or reports a bug/gap that should be tracked.
---

# /issue <short description> [--backend] [--dry-run]

Turn a description into a complete GitHub issue on `pirrozani/django-blog-frontend` using `.github/ISSUE_TEMPLATE/fix.md`.

## Input

`$ARGUMENTS` is a short description (e.g. `blog list flashes empty state while loading`). If it's empty, ask what the issue is about.
- `--dry-run`: stop after step 6 and create nothing.
- `--backend`: the problem is in the API. Hand the investigation to the `backend-contract` agent, which drafts the issue in the **backend** repo's template; then continue from step 6 with `--repo pirrozani/django-api` and the backend's labels (`priority: P0`–`P3`, `bug`/`enhancement`/`documentation`, `security`).

## Steps

1. **Load context.** Read `.github/ISSUE_TEMPLATE/fix.md` (its headings and footer are the required structure), `docs/README.md` (MVP scope, issue order, priority meanings) and, if the API is involved, `docs/03-api-contract.md`.
2. **Check labels exist** (first run only): `gh label list --limit 50`. If `priority: P0`…`priority: P3` are missing, show the `gh label create` commands and ask before running them.
3. **Check for duplicates.** `gh issue list --state all --search "<2–4 keywords>" --limit 20`. If one already covers it, show it and ask whether to comment on it instead.
4. **Investigate (read-only).** Collect **real evidence**:
   - `src/…:line` references and what the code does; or, for a new work item, the contract section / FE item it implements;
   - error text, failing command output, or browser steps that reproduce it.

   Run only read-only commands (`npm run typecheck`, `npm test`, `curl` against the API). Never read `.env*`, never invent line numbers. If you can't confirm something, say so in Evidence.
5. **Fill every section** of the template, same order, same headings:
   - **Problem:** one or two sentences.
   - **Evidence:** bullets with `file:line` or contract references; a code block for errors.
   - **Impact:** what can't be demoed or what breaks, and when.
   - **Fix:** numbered steps; short snippets only where they remove ambiguity. Respect the stack table and MVP scope in `CLAUDE.md` / `docs/README.md`; anything outside goes in Notes as a stretch.
   - **Acceptance criteria:** `- [ ]` checkboxes, each a command (`npm run lint/typecheck/test/build`) or an observable browser result (e.g. "visiting `/blogs/new` logged out redirects to `/login`"). Include the small tests the issue should add.
   - **Notes / risks:** alternatives not taken, stretch items, backend dependencies.
   - **Footer:** `**Priority:** Px · **Blocks:** … · **Work item:** FE-xx · **Related:** #N · **Backend:** pirrozani/django-api#N` (drop parts that don't apply). Remove all HTML comments.
6. **Choose labels.** Type: `bug`, `enhancement` or `documentation`. Exactly one priority: P0 (doesn't build/run), P1 (blocks the demo or deploy, or security), P2 (demo page/UX the demo needs), P3 (polish/portfolio). Add `security` when it applies. Title: imperative or descriptive, ≤ 70 characters.
7. **Show the draft** (repo, title, labels, full body) and **ask for confirmation**. Apply requested changes.
8. **Create it.** Write the body to a scratchpad file, then `gh issue create [--repo <repo>] --title "<title>" --label "<type>" --label "priority: Px" [--label security] --body-file <file>`.
9. **Report** the issue URL in ≤ 3 lines.

## Batch mode

When asked to create several issues at once (e.g. the MVP list in `docs/README.md`), draft them all, show them as one numbered list (title, labels, acceptance criteria), ask for a single confirmation, then create them in order and report all URLs.

## Never

- Create an issue without showing the draft and getting a yes (unless the user explicitly said to skip confirmation).
- Put secrets, `.env` values, tokens, demo passwords or database URLs in an issue: the repos are **public**.
- Create several issues for one problem. Suggest follow-ups in Notes instead.
