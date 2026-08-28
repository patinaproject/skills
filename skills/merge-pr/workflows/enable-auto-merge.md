# Enable auto-merge

Use these instructions only after the user explicitly asks to merge, queue,
land, integrate, or enable auto-merge for a pull request. Work in the current
directory's default `gh` repository. Confirm that `ready-pr` is installed.

## Steps

1. Read repository instructions and resolve the current branch's pull request:

   ```sh
   gh pr view --json url,number,state,isDraft,headRefName,headRefOid,baseRefName,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,autoMergeRequest,mergedAt
   git branch --show-current
   git rev-parse HEAD
   ```

   Stop and ask the user when no pull request exists, it closed without merging,
   or the local branch differs from its head branch. A local commit mismatch
   should go through `ready-pr`. If `mergedAt` is present, report that it already
   merged and do not run another merge command.
2. Run `ready-pr` when the pull request is a draft, has conflicts, has a failed
   required check, has actionable feedback or any unresolved review thread, has
   unpublished local commits, or has local files that prevent a reliable ready
   result.

   Pending checks and missing approvals do not require branch changes because
   auto-merge can wait for them. Optional or replaced check runs are history.

   Before calling `ready-pr`, record the local commit, pull request commit, and
   reasons. After it returns, repeat step 1. If the commits and reasons are
   unchanged, stop with the specific remaining problem instead of calling it
   again. A new pull request commit may get one new readiness pass.

   If a clean target branch merge fails verification, use the exact result from
   [the clean merge instructions](../../ready-pr/references/base-update-recovery.md).
   Continue after `verified` or `recovered`. Stop and report the failed command
   after `reproducible` or `drifted`.
3. Choose the repository's merge method. Prefer the method named in repository
   instructions. Otherwise inspect repository settings and use the only enabled
   method among merge commit, squash, and rebase. Ask the user when several are
   enabled and no instruction chooses one. Omit the method flag when a required
   merge queue chooses the method.

   Confirm that GitHub auto-merge is available. When GitHub reports that the
   repository setting is off, ask the user to enable **Allow auto-merge** in
   pull request settings. When GitHub reports that the plan does not support
   auto-merge, say that the repository must become public or use a plan that
   supports it. Do not guess which case applies from one Boolean field; use the
   GitHub response and repository plan information.

   Do not change repository settings, rulesets, or branch protection. Do not
   fall back to a direct merge.
4. Refresh the pull request and local commit immediately before the command.
   Require an open, non-draft pull request with the same branch and commit. Then
   run:

   ```sh
   gh pr merge <pr-number-or-url> --auto --match-head-commit <head-sha> <repository-mode-flag>
   ```

   Use exactly one of `--merge`, `--squash`, or `--rebase` when there is no
   merge queue. Omit the flag for a required queue. Never pass `--admin`, delete
   the branch in this command, or merge with local Git.
5. Fetch GitHub state again after the command. Read `state`, `mergedAt`,
   `headRefOid`, and `autoMergeRequest`; query `mergeQueueEntry` with GraphQL
   when needed. Do not trust the command's exit code or prose alone.

   - Report `merged` only when GitHub returns a merge time or merged state.
   - Report `queued` only when the pull request remains open and GitHub returns
     a current auto-merge request or queue entry.
   - Otherwise report `blocked` because the requested state was not proven.

   If another actor changes the pull request commit before the result is read,
   report both commits and stop. Do not enable auto-merge on the replacement
   commit until it has been reviewed.

## Final report

Lead with `Merged`, `Queued`, or `Blocked`. Link the pull request and name the
merge method or queue. For a queued pull request, name only the visible checks
or approvals still required. For a blocked result, state the exact problem and
user action. Never report an open or queued pull request as merged.
