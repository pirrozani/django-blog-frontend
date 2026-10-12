---
name: pr
description: Open a pull request from the current feature branch into develop with "Closes #N", after running the health check. Asks before pushing. Also handles the develop → main release PR (merge commit) when asked. Use when the user asks to open, create or raise a PR, or after /resolve-issue is done.
---

# /pr [--release]

Open a PR for the current branch against `develop` on `pirrozani/django-blog-frontend`.

## Steps

1. **Check the branch.**
   - `git branch --show-current`. Refuse on `main` or `develop` (unless `--release`, see below).
   - Get the issue number from `feature/<N>-…`. If there's none, ask which issue it closes (or "none").
   - If `gh pr list --head <branch> --state open` already shows a PR, report its URL and stop.
2. **Check the tree.** `git status --short`.
   - Uncommitted changes: show them and ask whether to commit (`<type>: <summary> (#N)` with the Claude Code co-author trailer) or stop.
   - `git log develop..HEAD --oneline` must not be empty.
3. **Health check.** Run the `/health-check` steps. If a step fails for a reason this branch was supposed to fix, stop and report. Note pre-existing failures (tracked by other open issues) in the PR body.
4. **Scope check.** `git diff develop...HEAD --stat`.
   - `src/api/schema.d.ts` changed → it must match a fresh `npm run gen:api` (suggest `/api-sync`).
   - `package.json` changed → `package-lock.json` changed too, and each new dependency is in the `CLAUDE.md` stack table or named in the issue.
   - No `.env*` (other than `.env.example`), `.dev.vars`, `dist/` or `node_modules/` in the diff.
5. **Draft the PR.**
   - **Title:** `<type>: <issue title>` (`bug` → `fix`, `enhancement` → `feat`, `documentation` → `docs`).
   - **Body:**
     ```markdown
     ## Summary
     - <2–5 bullets: what changed and why>

     Closes #N

     ## Screenshots
     <only for UI changes: before/after or the new page, from /ui-smoke>

     ## Verification
     - [x] <each acceptance criterion and its result>
     - [x] /health-check: <one-line result>

     ## Checklist
     - [ ] Tests added/updated
     - [ ] Loading, empty and error states handled
     - [ ] No secrets, `.env` values or demo credentials in the diff

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     ```
   Show title and body and **ask for confirmation before pushing**.
6. **Publish.** `git push -u origin <branch>`, write the body to a scratchpad file, `gh pr create --base develop --head <branch> --title "<title>" --body-file <file>`.
7. **Report** the PR URL in one line, and remind the user to **squash-merge** it (the issue closes at release).

## `--release` (develop → main)

On `develop`: list `git log main..develop --oneline` and the issues those commits close. Draft `chore: release <version>` with that list. After confirmation, `gh pr create --base main --head develop`. Remind the user to merge with a **merge commit, never squash**, and that merging deploys the frontend through Cloudflare Workers Builds.

## Never

- Target `main` from a feature branch, force-push, or use `--no-verify`.
- Push without confirmation.
- Merge the PR. The user merges it.
