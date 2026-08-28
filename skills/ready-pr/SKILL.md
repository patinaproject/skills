---
name: ready-pr
description: Publish completed branch work and keep fixing current pull request problems until it is ready to merge or needs a person. Use when the user asks to create, publish, finish, or ready a pull request.
---

# Ready a pull request

Read [the complete ready-for-merge instructions](workflows/ready-for-merge.md)
before starting. They define every command, timeout, retry, stop condition, and
final check. When feedback appears, also read
[the feedback instructions](workflows/triage.md).

This skill verifies and commits local work, pushes the branch, creates or
updates a draft pull request, handles available feedback, watches required
checks, and repeats after each fix. It never merges the pull request or enables
auto-merge.

A failed check does not stop the run by itself. Investigate it, fix any cause
introduced by the branch, and report causes that require a person. Open work
created by the agent as a draft while this process runs. Use the
[draft readiness checks](references/readiness-predicate.md) before changing it
to ready for human review.

## Steps

1. Read repository instructions, commit rules, and the pull request template.
2. Find the issue from the current branch or existing pull request. Ask when it
   is unclear.
3. Inspect every uncommitted path. Stage only files that belong to this work.
4. Run the repository's documented local checks.
5. Commit using the repository's required format. Run any required local review
   on that exact commit. Fix findings, verify again, and push only after the new
   commit passes.
6. Create or update the pull request with the repository template. Open
   agent-created work as a draft unless an existing eligible pull request is
   already ready.
7. Repeat the process in the linked instructions:
   - check whether the target branch merges cleanly
   - read all current review threads, comments, review bodies, and check results
   - fix problems introduced by the branch
   - reply to and resolve bot-created threads after posting evidence
   - leave human-created threads for the reviewer or user to answer and resolve
   - watch required checks in ten-minute windows and refresh all feedback after
     every exit or timeout
   - run local checks and review again before every new push
8. Apply the draft readiness checks and run `gh pr ready` when they pass. Leave
   issue status unchanged.
9. Immediately before reporting, fetch fresh local status, pull request state,
   required checks, and all paginated GraphQL review threads.

## Branch updates

Test target branch merges with local Git. Do not use GitHub's browser conflict
tools. For a clean merge that changes the branch, follow
[the clean target update instructions](references/base-update-recovery.md).
For conflicts, follow `update-branch` and the feedback instructions.

Run the repository checks that cover the changed code, conflict resolutions,
and affected dependencies. A separate full-repository check may be ignored only
when `update-branch` proves that the same problem already exists on the exact
target commit and the repository does not require that check for this change.

Abort an uncommitted merge before stopping. Do not rebase or force-push by
default.

## Review threads

Fix valid feedback regardless of who wrote it. Reply to and resolve a thread
only when a bot or GitHub App started it. A human-started thread belongs to its
reviewer. Report it to the user and leave it open.

Before resolving a bot-created thread, post a reply with current-commit
evidence. For a code fix, include what changed and the useful commit or check
result. Search for other matches when feedback names a repeated pattern. Verify
GraphQL `isResolved: true` after resolution.

If a human says a previously fixed bug remains or returned, reproduce the new
report before changing more code, even when the pull request commit did not
change.

## Ready to merge

Report `ready to merge` only when all of these are true in the final fresh
check:

- every file for this pull request is committed and pushed
- any remaining uncommitted file is proven to belong to a named different
  issue or branch
- the current local branch and commit match the pull request branch and commit
- GitHub reports `mergeStateStatus: CLEAN`
- the pull request is not a draft
- every context returned by `gh pr checks --required` passes on the latest
  commit
- every paginated GraphQL review thread is resolved
- no decision, permission, credential, or stopped check still needs a person

Optional checks and older replaced runs are history. They do not replace the
required-check result. A reply does not count as resolving a review thread.

When a condition fails, report `not ready to merge` and explain what remains.
When all conditions pass, summarize the evidence in one sentence instead of
listing every condition.

Do not create follow-up issues from review feedback, wait indefinitely for new
comments, or add agent attribution unless the repository requires it.
