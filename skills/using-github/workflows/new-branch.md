# issue branch procedure Workflow

**Goal:** From a GitHub issue reference, prepare a clean working branch and ready
its dependencies — replacing the manual `fetch / checkout -b / rebase / install`
dance with a single, reproducible procedure.

`issue branch procedure` only operates on the current working directory's
default `gh` repository.

---

## Checklist (use TodoWrite)

Create todos for each step before starting:

- [ ] Step 1: Resolve issue
- [ ] Step 2: Compute branch name
- [ ] Step 3: Check working tree
- [ ] Step 4: Fetch default branch
- [ ] Step 5: Checkout / rebase
- [ ] Step 6: Install dependencies
- [ ] Step 7: Report

---

## Step 1: Resolve Issue

Accept an issue reference from the invocation args. The argument may be:

- A bare integer (`42`).
- A `#`-prefixed integer (`#42`).
- A full issue URL (`https://github.com/<owner>/<repo>/issues/42`).

Normalize to the integer `<N>` and fetch the issue:

```bash
gh issue view <N> --json number,title,state
```

Refusals:

- If `gh issue view` exits non-zero (issue does not exist, no network, etc.),
  refuse:
  > "Issue #<N> could not be resolved — refusing to create a branch. Confirm the
  > issue number and that `gh` is authenticated against this repository."
- If the issue's `state` is not `OPEN` and the user did **not** pass
  `--allow-closed`, refuse:
  > "Issue #<N> is closed. Re-run with `--allow-closed` if you intend to branch
  > off a closed issue."

Capture `$issueNumber` and `$issueTitle` for the next step.

---

## Step 2: Compute Branch Name

Use GitHub's "Create branch" UI default format: `<issue-number>-<kebab-title>`.

**Kebab algorithm (apply in order):**

1. Lowercase the title.
2. Replace any run of `[^a-z0-9]` characters with a single hyphen `-`.
3. Trim leading and trailing hyphens.
4. Prepend `<issue-number>-` to the kebabed title.
5. Truncate the full string to 60 characters total. Prefer to cut at a hyphen
   boundary (i.e., if the 60-char cut lands inside a word, walk back to the
   previous hyphen so the branch never ends mid-word). After truncation, trim
   any trailing hyphen that the cut introduced.

**Worked example (AC-1-17):**

Issue 42 titled `Let agents use GitHub more ergonomically` →
`42-let-agents-use-github-more-ergonomically`.

Capture the result as `$branch`.

---

## Step 3: Check Working Tree

Run:

```bash
git status --porcelain
```

If the output is non-empty, refuse with this exact message:

> Working tree has uncommitted changes — refusing to switch branches. Stash
> them with `git stash` and re-run, or commit first.

Do not attempt any partial sync, stash, or auto-commit on the user's behalf.

---

## Step 4: Fetch Default Branch

Resolve the repository's default branch from the remote — never hardcode `main`:

```bash
gh repo view --json defaultBranchRef --jq .defaultBranchRef.name
```

Capture as `$defaultBranch`. If the command exits non-zero or returns an empty
string, refuse:

> "Could not resolve default branch via `gh repo view` — refusing to proceed.
> Ensure the working directory has a configured `gh` remote and try again."

Then fetch it:

```bash
git fetch origin "$defaultBranch"
```

If the fetch fails, surface the underlying `git` error and stop.

---

## Step 5: Checkout / Rebase

Two paths, depending on whether `$branch` already exists locally
(`git rev-parse --verify --quiet "refs/heads/$branch"`):

**Branch does not exist locally** — create it from the freshly fetched default:

```bash
git checkout -b "$branch" "origin/$defaultBranch"
```

**Branch already exists locally** — switch to it and rebase onto the default:

```bash
git checkout "$branch"
git rebase "origin/$defaultBranch"
```

**Rebase conflict handling:** if `git rebase` exits non-zero with conflicts,
**surface the conflict and stop**. Do NOT run `git rebase --abort` automatically;
the user must resolve manually so their work is not lost. Print:

> "Rebase onto `origin/$defaultBranch` hit conflicts. Resolve them in your
> editor, then run `git add <files>` and `git rebase --continue`. Run
> `git rebase --abort` yourself if you want to back out."

Capture the post-checkout commit SHA for the report:

```bash
git rev-parse HEAD
```

Store as `$baseSha`.

---

## Step 6: Install Dependencies

Probe the repository root for lockfiles in the order below — **the first match
wins**. If multiple lockfiles are present, the higher row in the table wins
(e.g., a repo with both pnpm and npm lockfiles installs with `pnpm`).

| Priority | Lockfile           | Install command   |
|----------|--------------------|-------------------|
| 1        | `pnpm-lock.yaml`   | `pnpm install`    |
| 2        | `yarn.lock`        | `yarn install`    |
| 3        | `bun.lockb`        | `bun install`     |
| 4        | `package-lock.json`| `npm install`     |

If **no lockfile is present and there is no `package.json`** at the repo root,
skip silently with a one-line note:

> "No lockfile and no `package.json` — skip silently (nothing to install)."

If a `package.json` exists but no lockfile is present, default to
`npm install` and print a one-line note that no lockfile was detected.

Run the chosen command from the repository root and capture its exit code as
`$installExit` for the Step 7 report. Do not retry on failure — surface the
package manager's output and the non-zero exit code so the user can diagnose.

---

## Step 7: Report

Print a compact summary:

```text
Branch:  <branch>
Base:    <baseSha>  (origin/<defaultBranch>)
Install: <command>  (exit <installExit>)
```

If Step 6 was skipped, print `Install: skipped (no lockfile, no package.json)`
in the install line instead.

Stop after the report. Do not push the branch, open a PR, or run any further
commands — those are out of scope for `issue branch procedure`.

---

## Refusal Conditions

Stop and do NOT create or switch branches if:

1. The issue cannot be resolved via `gh issue view` (Step 1).
2. The issue is closed and `--allow-closed` was not supplied (Step 1).
3. `git status --porcelain` is non-empty (Step 3) — emit the literal Step 3
   refusal message verbatim (the one beginning "Working tree has uncommitted
   changes" and ending "or commit first.").
4. `gh repo view` cannot resolve the default branch (Step 4).
5. The user requested operating against a different repository (cross-repo
   `-R other/repo`):
   > "`issue branch procedure` only operates on the current working
   > directory's default `gh` repository. To branch in another repo, `cd` into
   > that worktree first."
6. `git rebase` reports conflicts (Step 5) — surface the conflict and stop;
   never auto-abort the rebase.

---

## Quick Reference

| Step | Action                          | Blocks on                                                                    |
|------|---------------------------------|------------------------------------------------------------------------------|
| 1    | Resolve issue via `gh issue view` | Unknown issue → refuse; closed without `--allow-closed` → refuse           |
| 2    | Compute kebab `<N>-<title>`     | n/a — pure transform                                                         |
| 3    | `git status --porcelain`        | Non-empty → refuse with `git stash` suggestion                               |
| 4    | Resolve default branch + fetch  | `gh repo view` failure → refuse                                              |
| 5    | Checkout / rebase               | Rebase conflict → surface and stop (do NOT auto-abort)                       |
| 6    | Lockfile-driven install         | No lockfile + no `package.json` → skip silently                              |
| 7    | Report branch, base SHA, install | n/a — final summary                                                         |

## Common Mistakes

| Mistake                                                              | Fix                                                                                  |
|----------------------------------------------------------------------|--------------------------------------------------------------------------------------|
| Hardcoding `main` as the base branch                                 | Always resolve via `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`|
| Auto-stashing or auto-committing dirty changes                       | Refuse and tell the user to `git stash` or commit themselves                         |
| Running `git rebase --abort` after a conflict                        | Surface the conflict and stop; let the user resolve                                  |
| Picking `npm install` when `pnpm-lock.yaml` is also present          | Lockfile priority table is ordered: pnpm > yarn > bun > npm                          |
| Erroring out when there is no `package.json`                         | No lockfile + no `package.json` → skip silently with a one-line note                 |
| Operating against `-R other/repo`                                    | Refuse — same-repo only; user must `cd` into that worktree                           |
| Pushing the branch or opening a PR                                   | Out of scope; stop after the Step 7 report                                           |
