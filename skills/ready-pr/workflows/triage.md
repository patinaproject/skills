# Handle pull request checks and feedback

Use these rules for conflicts, failed checks, inline threads, top-level
comments, and review bodies.

| Decision | Use when | Action |
| --- | --- | --- |
| Fix now | The branch caused a clear problem covered by this pull request | Fix, verify, commit, push, and check again |
| Explain | The item is valid but needs no code change | Reply or report with current evidence |
| No longer applies | The latest commit removed the problem | Reply or report with current evidence |
| Outside this pull request | The item is valid but belongs to different work | Explain why it is not part of this pull request; do not create an issue |
| Ask the user | Progress needs judgment, permission, a secret, or conflicting instructions | Stop with the evidence and exact question |

## Who started the conversation

Read the opening comment's `author.__typename` from GraphQL. `Bot` means a bot
or GitHub App started it. `User` means a person started it. Treat an unclear
author as a person. Later replies do not change who started the conversation.

Fix valid feedback from either kind of thread.

- In a bot-started conversation, post a reply with evidence, then resolve it
  when the rules below allow.
- In a human-started conversation, leave all replies, resolution, dismissal,
  and new review requests to its author or the user. Report the thread in the
  Codex task.

## Repeated human bug report

When a person says a previously fixed bug remains or returned, reproduce the
new report before making another fix, even when the pull request commit did not
change. Re-read any changed expected or actual behavior and follow the
repository's bug-report instructions. Finish with a new failing-then-passing
reproduction or report what prevents it. Leave the human-started conversation
unchanged.

## Evidence to keep

- latest pull request commit
- check or comment name and URL
- file and line for inline feedback
- merge state, target branch, and local merge result for conflicts
- fix commit for code changes
- current facts for an explanation, outdated item, or excluded item
- GraphQL `isResolved` after resolving a thread

## Review feedback

- Paginate GraphQL review threads. REST review comments do not show complete
  thread state.
- A reply does not resolve a thread. Check `isResolved`.
- Compare the comment's path, line, and commit with the latest pull request
  commit before acting.
- Handle currently available feedback before waiting for checks. A clear code
  fix makes pending checks obsolete, so fix, verify, commit, and restart on the
  new commit.
- Ask the user before changing requirements, acceptance criteria, requested
  behavior, or the work included in the pull request.
- Apply the repeated human bug rule before other feedback handling.
- Before resolving a bot-started thread, post a reply with evidence. For a code
  fix, say what changed and include the useful commit or check result.
- When feedback names a repeated pattern, search for other matches and explain
  every remaining match before resolving the thread.
- After `resolveReviewThread`, verify `isResolved: true`. If permission is
  missing, leave the evidence reply and report the open thread.
- Keep handled top-level comments and review bodies in memory during the run so
  later passes do not post duplicate replies.

## Failed checks

Use the required contexts defined in
[the draft readiness checks](../references/readiness-predicate.md#required-checks).
Inspect logs before deciding what failed.

Wait in ten-minute windows with a tool-enforced timeout:

```sh
timeout 10m gh pr checks --required --watch --fail-fast
gtimeout 10m gh pr checks --required --watch --fail-fast
perl -e 'my $seconds = shift; my $pid = fork; die "fork failed: $!" unless defined $pid; if ($pid == 0) { setpgrp(0, 0); exec @ARGV } $SIG{ALRM}=sub { kill q(TERM), -$pid; exit 124 }; alarm $seconds; waitpid($pid, 0); exit(($? & 127) ? 128 + ($? & 127) : ($? >> 8))' 600 gh pr checks --required --watch --fail-fast
```

Exit 124 means the timeout ended the watch. Any earlier nonzero `gh` exit means
a check failed. After every exit, refresh all checks, the pull request commit,
unresolved review threads, comments, review bodies, and review decision.

Optional checks may post useful comments, but their status does not block the
pull request. Older replaced runs are history. Fix every failure caused by the
branch. Explain temporary infrastructure, an external outage, missing secrets,
missing permission, or unrelated failures with evidence. A failed check alone
does not require stopping. Stop only when its investigation finds a separate
problem that needs the user.

Stop waiting after two consecutive ten-minute windows with no change in check
states, timestamps, pull request commit, or feedback.

## Merge conflicts

- At the start of each pass, read `headRefOid`, `baseRefName`, `mergeable`, and
  `mergeStateStatus`, then test the merge locally.
- Fix a conflict when the correct result belongs to this pull request and can
  be checked locally.
- Keep both sides when that is clearly correct.
- After a clean target branch merge, follow
  [the clean merge instructions](../references/base-update-recovery.md).
- After resolving a conflict, run the relevant checks, commit, push, and restart
  pull request checks on the new commit.
- Ask the user when a conflict needs a product decision, secret, permission,
  destructive Git operation, unrelated work, or a guess about behavior.
- Run `git merge --abort` before stopping with an open merge.
- Do not rebase, force-push, use browser conflict tools, or merge the pull
  request itself.
