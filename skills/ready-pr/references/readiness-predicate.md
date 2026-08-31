# When to mark a draft ready

Mark an agent-created draft pull request ready for human review only when all
three checks pass:

1. Local `HEAD` equals the latest pull request commit, and the repository's
   required local review passed on that commit.
2. Every required GitHub check passes on that commit.
3. No unresolved GraphQL review thread started by a bot or GitHub App remains.

Immediately before `gh pr ready`, fetch local `HEAD`, the pull request
`headRefOid`, required checks, and every paginated GraphQL review thread. If any
value changes before the command runs, discard the result and check again.

Capture a check-epoch timestamp immediately before `gh pr ready`. The ready
transition starts a new epoch even when `headRefOid` stays the same. Wait for
required runs created in that epoch, then fetch a fresh merge state. An older
same-head pass cannot satisfy a pending replacement run.

Optional review services are not part of this decision. Their comments still
need the same fix or explanation as other bot feedback.

Human-started threads do not prevent moving an agent-created draft into human
review, but every one must be resolved by its author or the user before the pull
request is ready to merge. Leave a draft created by a person unchanged unless
the user asks the agent to take it over.

Never move a ready pull request back to draft.

## Required checks

Use the contexts returned by `gh pr checks --required` on the latest pull
request commit. GitHub treats `success`, `skipped`, and `neutral` as passing for
a required context.

The Checks API may also return:

- optional runs that branch protection does not require
- older runs replaced by a later run of the same context on the same commit

Those runs are history. Report them when useful, but do not count them as a
current required failure.

Required checks do not prove that the branch merges cleanly. Check
`mergeStateStatus` separately after the current epoch becomes terminal.
