---
name: resolve-issue
description: Implement one GitHub issue of the frontend repo (e.g. /resolve-issue 4 or /resolve-issue #4) on a feature branch, verify its acceptance criteria, run the ui-reviewer agent, and post the results on the issue. Use when the user asks to fix, implement, build or work on an issue.
---

# /resolve-issue <issue number>

Implement exactly one GitHub issue from `pirrozani/django-blog-frontend`.

## Input

`$ARGUMENTS` is an issue number (`4`, `#4`, or the issue URL). If it's missing, list open issues (`gh issue list --state open --limit 50 --json number,title,labels`) and recommend the next one from "Recommended issue order" in `docs/README.md`, then ask.

## Steps

1. **Load the issue.** `gh issue view <N> --json number,title,body,labels,state`. If it's closed, say so and stop. If it touches the API, read `docs/03-api-contract.md` and `src/api/schema.d.ts`; ask the `backend-contract` agent when the contract is unclear.
2. **Check readiness.**
   - Issues earlier in the recommended order that this one depends on (e.g. FE-02 before any page) are closed or merged into `develop`; otherwise warn.
   - `git status`: if the tree is dirty, stop and ask what to do with the changes.
3. **Branch.** `git switch develop && git pull --ff-only && git switch -c feature/<N>-<slug>` (short kebab-case slug from the title). If you're already on `feature/<N>-…`, keep it.
4. **Implement** the issue's *Fix* section, and only that.
   - Follow `CLAUDE.md`: stack table, folder layout, code style, MVP scope. New dependencies only if the issue names them; otherwise ask.
   - API calls go through `src/api/`; types come from `src/api/schema.d.ts`. If the schema is missing something the issue needs, run `/api-sync` before coding around it.
   - If the issue is wrong or incomplete compared with the code or the contract, tell the user and propose an issue edit rather than silently deviating. If the **backend** is at fault, draft a backend issue (`/issue --backend`).
   - For visual work, use the `frontend-design` skill if it's available, and keep one consistent look across pages.
5. **Add the tests** the acceptance criteria ask for (Vitest + RTL, MSW handlers in `src/mocks/`).
6. **Verify.**
   - Run each acceptance-criteria command. For browser criteria, run `/ui-smoke` (or the relevant flows of it) against the local backend.
   - Then run the `/health-check` steps.
   - If `src/api/` changed or the backend moved, run `/api-sync` (read-only).
7. **Review.** Launch the `ui-reviewer` agent on the branch diff. Fix HIGH findings, then re-run the affected checks.
8. **Report on the issue.** Ask first, then `gh issue comment <N> --body-file <file>`: each acceptance criterion as `[x]`/`[ ]` with a one-line result, plus the branch name. **Don't close the issue.** It closes when the release PR (`develop` → `main`, merge commit) brings the squash commit with `Closes #N` into `main`.
9. **Report to the user** in ≤15 lines: branch, files changed, criteria passed/failed, review findings, follow-ups. Suggest `/pr` next. **Don't commit or push** unless the user asks; if asked, use `feat:`/`fix:`/`chore:`/`test:` ending with `(#N)`.

## Never

- Read `.env*`/`.dev.vars`, hand-edit `src/api/schema.d.ts`, or edit `node_modules/`/`dist/`.
- Claim a criterion passed without running it.
- Bundle several issues in one branch unless the user asks.
- Deploy, or change Cloudflare/Render settings.
