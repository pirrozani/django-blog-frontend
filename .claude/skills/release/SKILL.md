---
name: release
description: Ship develop to main end to end (preflight, health check, changelog, version bump, release PR merged with a merge commit, tag, GitHub release, back-merge into develop) with a single confirmation, or none with --yes. Use when the user asks to release, cut a release, ship or deploy develop to main. Supports --dry-run.
---

# /release [major|minor|patch|<x.y.z>] [--dry-run] [--yes]

Release `develop` into `main` on `pirrozani/django-blog-frontend`. The bump defaults to `minor`. `main` deploys through Cloudflare Workers Builds.

**One confirmation, not one per step.** Steps 1–4 run without asking. Step 5 shows the plan and asks **once**; that yes covers push → PR → merge → tag → GitHub release → back-merge. With `--yes`, print the plan and go on without asking. After that, nothing asks again: the skill runs unattended and **stops with a report** at the first failed guard (see "Stop conditions").

With `--dry-run`, run steps 1–3, print the plan from step 5 and stop. A dry run creates no release branch, commit, push, PR, tag or release.

## Steps

1. **Preflight.** Run the read-only checks in parallel (independent tool calls in one message), then refuse and stop if any fails, saying which one.
   - `git fetch origin --tags --prune` (run this first, alone; the rest read its result).
   - `git status --short` is empty (clean tree).
   - `git rev-parse develop` == `git rev-parse origin/develop`, and the same for `main`. If a local branch is missing, create it from `origin`; if it differs, refuse (don't pull or reset for the user).
   - `git log origin/main..origin/develop --oneline` is not empty (something to release).
   - `git merge-base --is-ancestor origin/main origin/develop` succeeds. If not, `main` has commits `develop` lacks: refuse and suggest merging `main` into `develop` first.
   - `gh pr list --base main --state open` shows no other release PR. If one exists, report it and stop.
   - `gh api repos/pirrozani/django-blog-frontend --jq .allow_merge_commit` is `true`, or step 6 can't merge with a merge commit.
2. **Health check** on `develop`: `git switch develop`, then run the `/health-check` steps. Stop if lint, typecheck, tests or the build fail. Nothing has been pushed yet.
3. **Changelog and version.**
   - Commits: `git log origin/main..origin/develop --no-merges --format='- %s (%h)'`.
   - Closing issues: the union of closing keywords in commit bodies and the issue number in squash subjects. Squash merges here are titled `<type>: <title> (#<issue>) (#<PR>)` and their bodies usually **don't** carry `Closes #N`, so the keyword grep alone finds nothing:
     ```bash
     { git log origin/main..origin/develop --format=%B | grep -oiE '\b(close[sd]?|fix(e[sd])?|resolve[sd]?):? #[0-9]+' | grep -oE '[0-9]+'
       git log origin/main..origin/develop --no-merges --format=%s | grep -oE '\(#[0-9]+\) \(#[0-9]+\)$' | grep -oE '^\(#[0-9]+' | grep -oE '[0-9]+'
     } | sort -un
     ```
     For each, `gh api repos/pirrozani/django-blog-frontend/issues/<N> --jq '{number,title,state,pr:(.pull_request != null)}'` (in parallel). Drop PRs; keep the open issues. The release PR's `Closes #N` lines are what close them when it merges into `main` (the default branch).
   - Current version: the `"version"` field in `package.json` (`node -p "require('./package.json').version"`). **Never derive it from git tags.**
   - Next version: bump `major` (`X+1.0.0`), `minor` (`X.Y+1.0`) or `patch` (`X.Y.Z+1`); an explicit `<x.y.z>` must be valid semver and greater than the current version.
   - Refuse if `git tag -l <x.y.z>` or `git ls-remote --tags origin <x.y.z>` already exists. Report the clash; the skill never deletes or moves tags.
   - Warn (don't refuse) if `git tag --sort=-v:refname | head -1` is higher than `<x.y.z>`, naming the tag.
4. **Version bump** (skipped on `--dry-run`).
   - `git switch -c release/<x.y.z> origin/develop`
   - `npm version <x.y.z> --no-git-tag-version`. `git diff --stat` must show only `package.json` and `package-lock.json`; otherwise stop and report.
   - `git commit -am "chore: bump version to <x.y.z>"` with the Claude Code co-author trailer.
5. **Show the plan** and ask **one** question (skip the question with `--yes`):
   ```
   Release <current> → <x.y.z>   (develop <sha> → main <sha>)
   Commits (<n>):
   - …
   Will close: #11 <title>, #27 <title>
   Already closed: #…   (if any)
   On yes, without asking again: push release/<x.y.z>, open the PR into main,
   wait for checks, merge with a merge commit (DEPLOYS to Cloudflare Workers),
   tag <x.y.z>, create the GitHub release, merge the tag back into develop.
   ```
   On `--dry-run`, print the plan with the header `DRY RUN, nothing pushed` and stop here.
   If the user says no, `git switch develop` and offer to delete the local branch (`git branch -D release/<x.y.z>`).
6. **Release PR** (no further prompts).
   - Write the body to a scratchpad file:
     ```markdown
     ## Release <x.y.z>

     <commit list from step 3>

     Closes #11
     Closes #27

     Merge with a **merge commit**, never squash or rebase, or the `Closes` lines in the squash commits are lost.

     🤖 Generated with [Claude Code](https://claude.com/claude-code)
     ```
   - `git push -u origin release/<x.y.z>` and `gh pr create --base main --head release/<x.y.z> --title "release: <x.y.z>" --body-file <file>`.
   - Checks: `gh pr checks <PR>`. If it reports no checks, go on. If any are pending, wait with `gh pr checks <PR> --watch` (run it in the background and continue when it exits; don't poll). If any fail, **stop**.
   - `gh pr merge <PR> --merge --delete-branch`. This also deletes the local branch and switches to `main`. Never `--squash`, `--rebase`, `--admin` or `--auto`.
7. **Tag, GitHub release and back-merge** (no further prompts).
   - `git fetch origin`, then confirm `git rev-parse origin/main` equals `gh pr view <PR> --json mergeCommit --jq .mergeCommit.oid`. Stop if they differ.
   - `git tag -a <x.y.z> origin/main -m "Release <x.y.z>"` and `git push origin <x.y.z>`.
   - Write the changelog (step 3 commits plus the closed issues) to a scratchpad file and run `gh release create <x.y.z> --title "<x.y.z>" --notes-file <file> --verify-tag --latest`.
   - `git switch develop`, `git pull --ff-only`, `git merge --no-ff <x.y.z> -m "Merge tag '<x.y.z>' into develop"` and `git push origin develop`. On a merge conflict, `git merge --abort` and stop.
   - If `release/<x.y.z>` still exists locally, `git branch -d release/<x.y.z>`.
8. **Verify** (checks in parallel) and report in at most 15 lines:
   - Every issue from step 3 is `CLOSED` (`gh issue view <N> --json state`). If one is still open, say so and don't close it by hand: check that the release PR body has its `Closes #N` line (`gh pr view <PR> --json closingIssuesReferences`).
   - `git rev-parse origin/main` == `git rev-parse <x.y.z>^{commit}`.
   - `git merge-base --is-ancestor origin/main origin/develop` succeeds.
   - Report the PR URL, the tag, the release URL (`gh release view <x.y.z> --json url`) and the closed issues.
   - Suggest `/deploy-check <frontend-url> <backend-url>` once the Workers Builds deploy finishes.

## Stop conditions

After the yes, the skill never asks; it stops and reports instead when:
- a preflight or health-check step fails (nothing pushed);
- the version diff touches anything other than `package.json` and `package-lock.json`;
- a PR check fails;
- `origin/main` after the merge isn't the PR's merge commit;
- the tag already exists locally or on `origin`;
- the back-merge into `develop` conflicts or `git pull --ff-only` fails.

## Never

- Push to `main` directly, force-push, use `--no-verify`, or merge with squash, rebase, `--admin` or `--auto`.
- Push, merge, tag or release without the step 5 yes (or `--yes` in the user's command). A yes for one release doesn't cover the next.
- Run `wrangler deploy`; the deploy happens through Workers Builds on `main`.
- Move, delete or re-create existing tags.
- Close issues by hand or edit files other than `package.json` and `package-lock.json`.

## If a step fails midway

Stop and report what's done and what isn't. Don't undo pushed work. On the next `/release`, resume from the failed step: the release branch, PR or tag already exists, so check it instead of recreating it.
