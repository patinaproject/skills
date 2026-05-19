# Check and Feedback Triage

Use this shared state machine for failed PR checks, inline review threads,
top-level PR comments, and review bodies.

| State | Meaning | Action |
| --- | --- | --- |
| `fix-now` | Branch-local, actionable, in scope | Patch, verify, commit, push, and re-check |
| `explain` | Valid to answer without code | Reply or report with concise evidence |
| `stale` | No longer applies to latest head | Reply or report with current-head evidence |
| `defer` | Valid but outside this PR | Explain the scope decision; do not create an issue |
| `needs-human` | Requires judgment, permissions, secrets, or conflicting direction | Stop and ask |

## Required Evidence

- Latest PR head SHA used for the decision.
- Check name, thread URL, comment URL, or review URL.
- File and line context when feedback is inline.
- Fix commit SHA for `fix-now`.
- Concrete current-state evidence for `explain`, `stale`, and `defer`.
- Verified GraphQL resolution state when resolving inline threads.

## Review Feedback Rules

- Paginate GraphQL review threads; REST review comments alone are not enough.
- Replies do not equal resolution. Check `isResolved`.
- Verify line context against the latest head before replying or resolving.
- Route requirement, acceptance-criteria, scope, or user-visible behavior
  changes through the repository's planning owner before implementation.
- Reply concisely to every handled human comment.
- Resolve inline threads only after the fix or explanation is present on latest
  head and checks pass.
- Track handled top-level comments and review bodies in memory during the run so
  loop passes do not post duplicate replies.

## Check Failure Rules

- Wait for all checks with `gh pr checks --watch`; do not use fail-fast by
  default.
- Triage every non-pass, canceled, or otherwise problematic check result.
- Inspect logs before classifying.
- Fix branch-local failures in normal follow-up commits.
- Stop for missing secrets, permission failures, external outages, or flaky
  infrastructure that cannot be proven branch-local.
