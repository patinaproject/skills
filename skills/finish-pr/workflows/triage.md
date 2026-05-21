# Check and Feedback Triage

Use this shared state machine for merge conflicts, failed PR checks, inline
review threads, top-level PR comments, and review bodies.

| State | Meaning | Action |
| --- | --- | --- |
| `fix-now` | Branch-local, actionable, in scope | Patch, verify, commit, push, and re-check |
| `explain` | Valid to answer without code | Reply or report with concise evidence |
| `stale` | No longer applies to latest head | Reply or report with current-head evidence |
| `defer` | Valid but outside this PR | Explain the scope decision; do not create an issue |
| `needs-human` | Requires judgment, permissions, secrets, or conflicting direction | Stop and ask |

For merge conflicts, apply the Merge Conflict Rules below when choosing and
executing the state action.

## Required Evidence

- Latest PR head SHA used for the decision.
- Check name, thread URL, comment URL, or review URL.
- Mergeability state, base branch, and local merge result for merge conflicts.
- File and line context when feedback is inline.
- Fix commit SHA for `fix-now`.
- Concrete current-state evidence for `explain`, `stale`, and `defer`.
- Verified GraphQL resolution state when resolving inline threads.

## Review Feedback Rules

- Paginate GraphQL review threads; REST review comments alone are not enough.
- Replies do not equal resolution. Check `isResolved`.
- Verify line context against the latest head before replying or resolving.
- Handle currently available feedback before watching checks. A `fix-now`
  feedback item restarts the readiness loop on the new head even when checks are
  pending; treat `fix-now` as pending-check-interrupting feedback.
- Reply to or record `explain`, `stale`, and `defer` dispositions before checks
  when the evidence does not depend on check results.
- Route requirement, acceptance-criteria, scope, or user-visible behavior
  changes through the repository's planning owner before implementation.
- Reply concisely to every handled human comment.
- Resolve inline threads only after the fix, explanation, stale evidence, or
  deferral evidence is present on latest head.
- Verify `isResolved: true` after calling `resolveReviewThread`; unresolved
  threads remain blockers unless permission-blocked and explicitly reported.
- Track handled top-level comments and review bodies in memory during the run so
  loop passes do not post duplicate replies.

## Check Failure Rules

- Wait for all checks only after currently available feedback has been handled.
- Use a tool-enforced 10-minute timeout around `gh pr checks --watch
  --fail-fast` in 10-minute observation windows. GNU `timeout`, Homebrew
  `gtimeout`, or an equivalent host timeout are acceptable.

  ```sh
  timeout 10m gh pr checks --watch --fail-fast
  gtimeout 10m gh pr checks --watch --fail-fast
  ```

- Keep optional checks in scope; do not switch to required-check-only watching.
- Perform a full PR state resync after every watch exit or timeout: all check
  buckets, unresolved review threads, top-level PR comments, review bodies,
  review decision, and current PR head.
- Stop after two consecutive 10-minute no-progress windows. No progress means
  no meaningful change in check buckets, check start or completion timestamps,
  PR head SHA, or feedback inventory between observation windows.
- Triage every failed, canceled, skipped-problematic, or otherwise non-pass
  check result before starting another watch window.
- Inspect logs before classifying.
- Fix branch-local failures in normal follow-up commits.
- Stop for missing secrets, permission failures, external outages, or flaky
  infrastructure that cannot be proven branch-local.
- Re-query the full feedback surface after checks finish, fail fast, or time out
  so CI-authored review comments are triaged before final readiness reporting.

## Merge Conflict Rules

- Capture `headRefOid`, `baseRefName`, `mergeable`, and `mergeStateStatus` with
  `gh pr view` at the start of each readiness-loop pass.
- Fetch the PR base branch and test the merge locally; local git results govern
  when GitHub mergeability is stale or unknown.
- Classify branch-local, in-scope, verifiable conflicts as `fix-now`.
- Preserve both sides of a conflict when that is clearly correct.
- Commit clean base merges and conflict resolutions with the repository's normal
  issue-tagged commit format, push, and restart the readiness loop.
- Classify conflicts as `needs-human` when resolution requires product judgment,
  secrets, permissions, destructive git operations, unrelated scope, or
  unverifiable semantic choices.
- Run `git merge --abort` before stopping when an uncommitted or conflicted
  merge is still in the working tree.
- Do not rebase or force-push by default. Do not use browser conflict
  resolution or merge the pull request itself.
