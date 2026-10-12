---
name: review-pr
description: Review a frontend pull request (e.g. /review-pr 5) or the current feature branch against its linked GitHub issue and the repo rules (base branch, Closes #N, acceptance criteria, scope, dependencies, generated types, tests, secrets), run the health check and the ui-reviewer agent, and give a verdict. Read-only; asks before posting the review on GitHub. Use when the user asks to review a PR or check that an issue was done correctly.
---

# /review-pr [N]

Check that a PR on `pirrozani/django-blog-frontend` does what its issue asked and follows `CLAUDE.md`. Read-only: never edit code, commit, push or merge.

## Input

`$ARGUMENTS` is a PR number (`5`, `#5`, or the URL), or nothing.
- **PR mode:** review that PR.
- **Branch mode:** review the current branch against `develop`; if an open PR exists for it, switch to PR mode.

## Steps

1. **Resolve the target.**
   - PR mode: `gh pr view <N> --json number,title,body,state,isDraft,baseRefName,headRefName,files,commits`. Stop if it's missing, closed or merged.
   - Branch mode: `git branch --show-current`; refuse on `main` or `develop`.
   - Remember the current branch. `git fetch origin`. Diff range: `origin/develop...origin/<head>` (PR) or `origin/develop...HEAD` (branch).
2. **Load the linked issue** from `Closes #N` (or the branch name): `gh issue view <N> --json number,title,body,labels,state`. Extract its *Fix* steps and *Acceptance criteria*. No linked issue → flag and continue.
3. **Process checks** (static, from `git diff <range> --stat`, `git diff <range>` and PR metadata):
   - base is `develop`; branch is `feature/<N>-<slug>`; body has `Closes #N`;
   - commit subjects use `feat|fix|refactor|chore|docs|test`;
   - **scope:** every changed file maps to a *Fix* step; flag unrelated files and anything from the "Left out (stretch)" column of `docs/README.md`;
   - `package.json` changed → `package-lock.json` changed, and new dependencies are in the stack table or the issue;
   - `src/api/schema.d.ts` changed → it was generated (no hand edits; header comment from openapi-typescript intact);
   - no `.env*` (except `.env.example`), `.dev.vars`, `dist/`, tokens, passwords or database URLs in **added** lines;
   - new behaviour has tests.
4. **Get the code locally** for steps 5–6. If `HEAD` isn't the PR head and the tree is clean, **ask** before `gh pr checkout <N>`. If declined or dirty, mark 5–6 `SKIP`.
5. **Acceptance criteria.** Run each read-only command criterion; for browser criteria run the matching `/ui-smoke` flows (ask first, since they need the backend running and demo credentials). Mark `PASS`/`FAIL`/`UNVERIFIED` with one line of evidence.
6. **Health check.** Run the `/health-check` steps; don't blame this PR for failures tracked by other open issues.
7. **Code review.** Launch the `ui-reviewer` agent with the diff range from step 1, in parallel with steps 5–6.
8. **Restore** the branch remembered in step 1.
9. **Report, then offer to post.** PR mode: ask, then `gh pr review <N> --comment --body-file <file>` (always `--comment`; GitHub rejects approve/request-changes on your own PR). Branch mode with no PR and a ready verdict: suggest `/pr`.

## Output

At most 30 lines:

```
Review: PR #5 <title> (feature/5-… → develop) · Issue #5 <title>
Process:  PASS | FAIL <rule> — <detail>
Criteria: [PASS|FAIL|UNVERIFIED|SKIP] <criterion> — <evidence>
Checks:   health-check <one line>
Code:     [HIGH|MEDIUM|LOW] file:line — problem — fix   (from ui-reviewer)
Verdict:  Ready to merge | Changes needed (<n> blocking)
```

**Changes needed** if: any HIGH finding or FAIL criterion; wrong base branch; out-of-scope changes; hand-edited generated types; a secret in the diff.

## Never

- Edit code, commit, push, merge, approve or close anything.
- Post to GitHub without confirmation, or post secrets/credentials (the repo is **public**).
- Leave the user on a different branch from the one they started on.
- Mark a criterion `PASS` without evidence.
