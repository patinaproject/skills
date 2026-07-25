# Check and Feedback Triage

Use this shared state machine for merge conflicts, failed PR checks, inline
review threads, top-level PR comments, and review bodies.

| State | Meaning | Action |
| --- | --- | --- |
| `fix-now` | Branch-local, actionable, in scope | Patch, verify, commit, push, and re-check |
| `explain` | Valid to answer without code, or a reportable check disposition | Reply or report with concise evidence |
| `stale` | No longer applies to latest head | Reply or report with current-head evidence |
| `defer` | Valid but outside this PR | Explain the scope decision; do not create an issue |
| `needs-human` | Non-check work requires judgment, permissions, secrets, or conflicting direction | Stop and ask |

For merge conflicts, apply the Merge Conflict Rules below when choosing and
executing the state action.

## Thread Authorship

Authorship decides who may speak in a review conversation and who may close it.
It never decides whether the feedback is valid: triage and fix both kinds the
same way.

Every review conversation (an inline thread, a top-level PR comment, or a
review body) is **agent-authored** when the comment that opened it comes from a
bot or a GitHub App, and **human-authored** otherwise. Read `author.__typename`
of that opening comment from the GraphQL inventory: `Bot` is agent-authored and
`User` is human-authored. An agent and its operator can share one GitHub
account, so an unclear author is human-authored.

Authorship is fixed when the conversation opens and later replies never change
it. A human replying on a bot's thread leaves it agent-authored, and a bot
replying on a human's thread leaves it human-authored.

- **Agent-authored conversations are the eligible ones.** Reply with evidence,
  then resolve them under the rules below.
- **A human-authored conversation belongs to its author.** Fix what the comment
  asks for, then hand the conversation to the operator through the brief below.
  The operator replies, resolves, dismisses, and re-requests review; the agent
  does none of those on a human's conversation, even when the fix is verified.

### Operator brief

Write one brief entry per unresolved human-authored conversation, in the run's
report rather than on the pull request:

- the thread or comment link;
- the finding or acceptance criterion it maps to;
- the state of that finding on the latest head, and the evidence behind that
  state: what changed, what verification ran, and where it ran;
- a suggested reply the operator edits before sending.

Grade the evidence rather than the intent. Report what has been observed on the
latest head and name what is still unverified, so the operator relays a claim
they can stand behind.

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
- Classify authorship before replying or resolving. Reply on agent-authored
  conversations; carry every human-authored one into the operator brief
  instead.
- Every resolved review thread must carry an evidence-bearing reply before
  `resolveReviewThread`, including code-fix dispositions. Silent resolution is
  not allowed for any disposition.
- For a code-fix disposition, the reply must name what changed, the commit or
  verification result when useful, and whether the fix covers only the
  commented line or the broader pattern.
- For pattern-based feedback that names a construct, helper, or anti-pattern
  (for example, feedback that `definedOrThrow` is unacceptable), run a direct
  semantic or pattern check before resolving when feasible: a repo search, an
  AST query, or a lint rule. Account for every remaining match in the reply,
  and do not resolve while unexplained matches remain.
- Resolve agent-authored inline threads only after both the disposition
  evidence (fix, explanation, stale evidence, or deferral evidence) is present
  on latest head and an evidence-bearing reply for that disposition is posted.
- Verify `isResolved: true` after calling `resolveReviewThread`; unresolved
  agent-authored threads remain blockers unless permission-blocked and
  explicitly reported. An unresolved human-authored thread is a blocker its
  operator clears, reported through the brief rather than acted on.
- Track handled top-level comments and review bodies in memory during the run so
  loop passes do not post duplicate replies.

## Check Failure Rules

- Wait for all checks only after currently available feedback has been handled.
- Use a tool-enforced 10-minute timeout around `gh pr checks --watch
  --fail-fast` in 10-minute observation windows. GNU `timeout`, Homebrew
  `gtimeout`, the portable `perl` fallback below, or an equivalent host timeout
  are acceptable.

  ```sh
  timeout 10m gh pr checks --watch --fail-fast
  gtimeout 10m gh pr checks --watch --fail-fast
  perl -e 'my $seconds = shift; my $pid = fork; die "fork failed: $!" unless defined $pid; if ($pid == 0) { setpgrp(0, 0); exec @ARGV } $SIG{ALRM}=sub { kill q(TERM), -$pid; exit 124 }; alarm $seconds; waitpid($pid, 0); exit(($? & 127) ? 128 + ($? & 127) : ($? >> 8))' 600 gh pr checks --watch --fail-fast
  ```

- Treat exit code 124 from the timeout tool as a watch timeout. Treat a
  non-zero `gh` exit before the timeout as a fail-fast watch exit.
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
- Do not classify a check as `needs-human` solely because it failed, was
  canceled, needs missing secrets, hit a permission failure, depends on an
  external outage, is flaky infrastructure, or is outside the PR's scope. Use
  `explain`, `stale`, or `defer` with evidence and continue to final reporting.
- Classify flaky, infrastructure-owned, external-outage, missing-secret, and
  permission-limited check failures as `explain` when evidence shows they are
  not branch-local.
- Only stop when check investigation reveals a separate non-check blocker, such
  as a required product decision, ambiguous branch scope, or conflicting human
  direction.
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
