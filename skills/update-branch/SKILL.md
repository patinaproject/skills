---
name: update-branch
description: Update the current local work branch by merging the latest base/default branch with pure git and no automatic push. Use when the user invokes `/update-branch`, says "update branch", or asks to merge the latest base branch or default branch into this branch.
---

# Update Branch

## Quick Start

Invoke from a local work branch:

```text
/update-branch
/update-branch release/1.x
```

No argument means resolve the base from `origin/HEAD`. An optional base
argument selects another branch or remote-tracking ref. The initial update
request authorizes a clearly cohesive, branch-local, non-silent dirty-work
auto-commit when no human judgment is needed; otherwise dirty work stops the
update.
Dependency refresh is conditional on dependency-related files changing during
the merge; do not reinstall dependencies unconditionally on every branch
update.

This skill is local-first. Use pure `git`; do not use `gh pr update-branch`,
GitHub's remote update button, or any GitHub update API. Never push
automatically.

## Input Contract

1. Accept no argument or one optional base ref.
2. Refuse detached HEAD.
3. Refuse a missing `origin` remote.
4. When no base is supplied, refuse missing `origin/HEAD`; do not hardcode
   `main`, `master`, or another default branch. Tell the operator to run
   `git remote set-head origin -a` when `origin/HEAD` is missing.
5. Refuse to update the repository default branch unless the user explicitly
   supplies a base and confirms they intend to mutate that branch.

## Workflow

1. Read repository guidance for commit messages, verification, and protected
   branches.
2. Record the current branch with `git branch --show-current`. Before fetch or
   merge, compare it to the repository default branch. If they match, stop
   unless the user supplied a base and explicitly confirmed they intend to
   update the default branch.
3. Resolve the base:
   - With an optional base argument, normalize any bare branch name, such as
     `main`, `master`, `develop`, `trunk`, or `release/1.x`, to its
     `origin/<name>` remote-tracking ref. Keep remote-tracking refs such as
     `origin/release/1.x` as supplied.
   - Without an argument, read `refs/remotes/origin/HEAD` and normalize it to
     the remote-tracking branch it points at, such as `origin/main`.
4. Fetch the remote head name for the selected base from `origin`, stripping
   the leading `origin/` first. For example, fetch `main` for `origin/main` and
   `release/1.x` for `origin/release/1.x`.
5. Inspect local dirty state before merging:
   - Run `git status --short`.
   - Review staged, unstaged, and untracked diffs.
   - Auto-commit only when the entire dirty set is cohesive, branch-local,
     free of secrets, and can be summarized under the local commit convention.
     The initial update request authorizes this safe dirty-work auto-commit
     without asking for another confirmation. Before committing, state the
     exact files and commit message that will be used so the auto-commit is
     not silent.
   - Stop for unrelated or ambiguous changes, such as a mixed app, config, and
     generated-file dirty set; generated output with unclear source; possible
     secrets; or any commit-message requirement, such as a required issue tag,
     that cannot be satisfied from local guidance.
6. Merge with an explicit merge commit:
   - Run `git merge --no-ff <base-ref>`.
   - If Git reports `Already up to date`, report that no merge commit was
     needed.
7. Resolve conflicts only when the correct resolution is obvious, branch-local,
   in scope, and mechanically verifiable. Stop for product judgment, unrelated
   scope, permissions, secrets, generated-file uncertainty, or unverifiable
   semantics.
8. After a successful merge or conflict resolution, inspect whether dependency
   inputs changed during the merge. Treat package manifests, lockfiles,
   workspace manifests, or toolchain version files as dependency inputs.
   - When dependency inputs changed, run the repository's documented
     install/bootstrap command before verification. Prefer commands in
     `AGENTS.md`, README files, package scripts, or other repository guidance.
   - If dependency inputs changed and no install/bootstrap command is
     documented, stop and report that dependencies may need refresh before
     verification can run.
   - Do not silently commit lockfile or generated dependency changes. Include
     them only when they are a direct result of the documented install command,
     are in scope for the branch update, and follow the same reporting and
     commit-message rules as other auto-committed dirty work.
9. Run documented verification after auto-committing dirty work, completing
   dependency refresh, or completing conflict resolution. Prefer commands in
   `AGENTS.md`, README files, package scripts, or other repository guidance. If
   no local verification applies, say so explicitly.
10. Report the result without pushing.

## Conflict Rules

- Keep the merge in progress only while resolving clear branch-local conflicts.
- Use `git merge --abort` before stopping when the branch should be restored to
  its pre-merge state.
- Do not rebase, force-push, or rewrite history.
- Do not sweep unrelated dirty files into the merge.

## Final Report

Always include:

- Current branch.
- Base ref fetched and merged.
- Whether a dirty-work auto-commit was created.
- Whether a merge commit was created or the branch was already up to date.
- Whether dependency refresh was skipped, run, or blocked because no documented
  install/bootstrap command was available.
- Conflicts resolved or the human-owned blocker that stopped the workflow.
- Documented verification commands and results, when run.
- A clear note that the branch remains local-only.
- The optional push command: `git push origin HEAD`.
