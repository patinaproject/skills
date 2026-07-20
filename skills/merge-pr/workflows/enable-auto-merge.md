# Enable Auto-Merge Workflow

**Goal:** Express merge intent for the current pull request through GitHub's
repository-managed auto-merge path, then distinguish a queued request from a
completed merge without bypassing readiness policy.

## Preconditions

Use this workflow only when the caller explicitly asks to merge, auto-merge,
queue, land, or integrate a pull request. Stay in the current working
directory's default `gh` repository.

Confirm `ready-pr` is installed before starting. If it is missing, stop with
this install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill ready-pr -y
```

## Steps

1. Read repository guidance and resolve the current branch's pull request.
   Capture its URL, state, draft state, head branch and SHA, base branch,
   mergeability, merge-state status, review decision, checks, auto-merge
   request, and merged timestamp:

   ```sh
   gh pr view --json url,number,state,isDraft,headRefName,headRefOid,baseRefName,mergeable,mergeStateStatus,reviewDecision,statusCheckRollup,autoMergeRequest,mergedAt
   git branch --show-current
   git rev-parse HEAD
   ```

   Stop as `human-blocked` when no PR resolves, the PR is closed without a
   merge, the local branch differs from the PR head branch, or local `HEAD`
   differs from the captured PR head SHA. If `mergedAt` is already present,
   report `merged` without issuing another merge command.

2. Decide whether the PR needs readiness remediation. Invoke `ready-pr` when
   any of these conditions is visible:

   - the PR is a draft;
   - GitHub or a clean local base merge shows conflicts;
   - a completed check is not successful;
   - actionable or unresolved review feedback remains;
   - a dirty worktree, unpublished commit, stale head, or another branch-local
     condition prevents the latest head from satisfying readiness gates.

   Pending checks or outstanding required approvals alone do not require
   branch changes; repository-managed auto-merge may wait for them. When
   remediation is needed, pass the current PR and caller scope to `ready-pr`
   and wait for its terminal result. A `ready-pr` human blocker becomes this
   workflow's `human-blocked` result. After `ready-pr` returns, repeat step 1
   and make every later decision from the refreshed PR head and state.

3. Resolve the repository-supported merge mode without inventing policy.
   Prefer an explicit mode in repository guidance. Otherwise inspect repository
   settings and use the sole enabled mode among merge commit, squash, and
   rebase. When more than one mode is enabled and guidance does not choose one,
   stop as `human-blocked` and ask the operator to choose. When the base branch
   uses a merge queue, let that queue own the strategy and omit a strategy flag.

   Refuse when repository auto-merge is disabled or unavailable. Enabling a
   setting, changing a ruleset, or weakening branch protection is outside this
   workflow.

4. Immediately before expressing merge intent, refresh the PR and local head.
   Require the PR to remain open, non-draft, on the same head branch, and at the
   same head SHA. Use that SHA as the optimistic concurrency guard:

   ```sh
   gh pr merge <pr-number-or-url> --auto --match-head-commit <head-sha> <repository-mode-flag>
   ```

   Use exactly one of `--merge`, `--squash`, or `--rebase` for a repository
   without a merge queue. Omit `<repository-mode-flag>` for a required merge
   queue. Never pass `--admin`, delete branches as part of this operation, or
   fall back to a direct or local merge.

5. Re-fetch GitHub state after the command. Use `gh pr view` for `state`,
   `mergedAt`, `headRefOid`, and `autoMergeRequest`; query GraphQL when needed
   to inspect `mergeQueueEntry`. Do not infer success from the command's exit
   code or prose output alone.

   - Report `merged` only when GitHub returns a non-null `mergedAt` or merged
     state for the captured PR.
   - Report `queued` only when the PR remains open and GitHub returns a current
     `autoMergeRequest` or `mergeQueueEntry` for it.
   - Otherwise report `human-blocked`: the requested state was not proven.

   If another actor changes the PR head before the outcome is observed, stop as
   `human-blocked` and report both SHAs. Never enable auto-merge again against
   an unreviewed replacement head.

## Final Report

Lead with `merged`, `queued`, or `human-blocked`, link the pull request, and
name the merge method or merge queue. For `queued`, state only the currently
visible requirements still governing completion. For `human-blocked`, give the
specific blocker and next human action. Do not claim a queued or open PR merged.
