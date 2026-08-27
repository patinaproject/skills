---
name: update-branch
description: Update the current work branch with pure Git, using an open pull request's target and pushing its updated head, or falling back to an explicit/default base locally. Use when the user invokes `/update-branch`, says "update branch", or asks to merge the base or default branch into this branch.
---

# Update Branch

## Quick Start

Invoke from a local work branch:

```text
/update-branch
/update-branch release/1.x
```

First resolve whether the current branch has one open pull request. Its target
branch is the base, including when an optional base argument was supplied. With
no open pull request, an optional argument selects the base and no argument
falls back to `origin/HEAD`.

Use pure `git` for fetch, merge, and push. Use `gh` only to read pull request
context; the bundled `scripts/update-context.sh` makes target selection and the
configured-remote push deterministic. The open-PR path pushes only after the
merge, dependency refresh, and scoped verification succeed. Apply the
[target-merge verification contract](references/verification.md) to additional
broad failures. The no-PR path remains local-only. GitHub's remote update
button and update-branch APIs are outside this workflow.

## Required Conflict Skill

`resolving-merge-conflicts` owns every merge-conflict resolution. Load and
follow it whenever `git merge` conflicts. Before touching a conflicted hunk,
run `scripts/update-context.sh require-conflict-skill`; if it reports the skill
missing, follow its installation guidance and load the installed skill, or stop
with that actionable error when installation cannot complete.

## Input Contract

1. Accept no argument or one optional base ref.
2. Refuse detached HEAD.
3. Refuse a missing `origin` remote.
4. Require `gh` to resolve open pull requests. Treat a failed query as a hard
   error rather than assuming there is no pull request.
5. When the no-PR path has no base argument, refuse missing `origin/HEAD`; do
   not hardcode `main`, `master`, or another default branch. The helper tells
   the operator to run `git remote set-head origin -a` when it is missing.
6. Refuse to update the repository default branch unless the user explicitly
   supplies a base and confirms they intend to mutate that branch.

## Workflow

1. Read repository guidance for commit messages, verification, and protected
   branches.
2. Record the current branch with `git branch --show-current`. Compare it to
   the repository default branch before fetch or merge. If they match, stop
   unless the user supplied a base and explicitly confirmed they intend to
   update the default branch.
3. From the installed skill directory, run
   `scripts/update-context.sh resolve [base-ref]` and record every returned
   field: mode, current branch, normalized base ref, pull request number and
   URL, and pull request head. The helper requires zero or one open pull request
   for the current branch:
   - `pull-request` mode uses that pull request's target, taking precedence over
     the optional argument and `origin/HEAD`.
   - `local-only` mode preserves the optional explicit base, or resolves
     `origin/HEAD` when no base was supplied.
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
7. When the merge conflicts, run the conflict-skill availability check, then
   invoke and follow `resolving-merge-conflicts` as the underlying workflow.
   Keep ownership of *when* to engage versus stop: first screen the conflicts
   and hand it only hunks that are branch-local, in scope for this update, and
   mechanically verifiable. Escalate a hunk that needs product judgment, and
   stop (see Conflict Rules) for unrelated scope, permissions, secrets,
   generated-file uncertainty, or unverifiable semantics.
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
9. Apply the
   [target-merge verification contract](references/verification.md) after
   auto-committing dirty work, completing dependency refresh, or resolving
   conflicts. Select scoped verification from `AGENTS.md`, README files,
   package scripts, or other repository guidance. Run additional broad
   repository-health commands separately. When a broad command fails, prove
   target ownership or treat it as blocking; a nonzero status alone does not
   classify the failure. Use the bundled `scripts/update-verify.sh` for the
   unchanged-input evidence path so the exact verified merge is committed or a
   blocking merge is aborted. If no local verification applies, say so
   explicitly.
10. Finish according to the resolved mode:
    - In `pull-request` mode, run
      `scripts/update-context.sh push <pr-number> <base-ref> <pr-head>` with the
      fields recorded in step 3. This pushes `HEAD` to the branch's configured
      upstream after validating the pull request identity, target, and head,
      then revalidates that context immediately after the push. A post-push
      context change means the remote branch moved but the pull request update
      is indeterminate. On failure, report the helper's context change or exact
      failed `git push` command and output, then stop without claiming the pull
      request was updated. After a successful push, capture `HEAD` and run
      `scripts/current-head-required-checks.sh --pr <pr-number> --head <head>`.
      Record its exact-head outcome. A non-pass result leaves the successfully
      updated pull request non-ready and routes through readiness triage; it
      does not undo or misreport the push.
    - In `local-only` mode, leave the branch unpushed and report the optional
      command `git push origin HEAD`.

## Conflict Rules

- Keep the merge in progress only while `resolving-merge-conflicts` works the
  clear branch-local conflicts.
- `update-branch`'s stop rules **override** `resolving-merge-conflicts`' "always
  resolve; never `--abort`" directive. When a conflict needs product judgment or
  falls outside this update's scope, `git merge --abort` and stop rather than
  resolving it.
- Use `git merge --abort` before stopping when the branch should be restored to
  its pre-merge state.
- Do not rebase, force-push, or rewrite history.
- Do not sweep unrelated dirty files into the merge.
- Preserve normal commit and push hooks. Do not use a skip flag or other
  verification bypass.
- Leave a target-owned defect unchanged on the issue branch.

## Final Report

Always include:

- Current branch.
- Base ref fetched and merged.
- Whether the base came from an open pull request, an explicit argument, or
  `origin/HEAD`.
- Whether a dirty-work auto-commit was created.
- Whether a merge commit was created or the branch was already up to date.
- Whether dependency refresh was skipped, run, or blocked because no documented
  install/bootstrap command was available.
- Conflicts resolved or the human-owned blocker that stopped the workflow.
- Documented verification commands and results, when run.
- For a target-owned failure, the broad command, failing contract, exact target
  SHA, ownership evidence, and required-check outcome on the pushed head.
- In the open-PR path, the pull request URL and whether its configured remote
  branch was updated; a failed push is a failed update.
- In the no-PR path, a clear note that the branch remains local-only and the
  optional push command `git push origin HEAD`.
