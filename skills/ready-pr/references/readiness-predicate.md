# When to mark a draft ready

Mark an agent-created draft pull request ready for human review only when all
three checks pass:

1. Local `HEAD` equals the latest pull request commit, and the repository's
   required local review passed on that commit.
2. Every known required GitHub check passes on that commit. This check may be
   deferred only when authoritative repository configuration shows that a
   required workflow cannot start until `ready_for_review`.
3. No unresolved GraphQL review thread started by a bot or GitHub App remains.

Immediately before `gh pr ready`, fetch local `HEAD`, the pull request
`headRefOid`, required checks, and every paginated GraphQL review thread. If any
value changes before the command runs, discard the result and check again.

Capture a check-epoch timestamp immediately before `gh pr ready`. The ready
transition starts a new epoch even when `headRefOid` stays the same. Wait for
required runs created in that epoch, then fetch a fresh merge state. An older
same-head pass cannot satisfy a pending replacement run.

## Discover the required context set

Use every row from `gh pr checks --required --json name,workflow` on the latest
pull request commit. Record each check name and workflow pair in the durable
controller. A nonempty result is the required context set for that commit.

A draft can have no rows when a required workflow listens only for
`ready_for_review`. Confirm that trigger from the repository's workflow and
target-branch protection or ruleset configuration. The agent may then mark its
own draft ready and start a new epoch while the controller's set is unknown.
Poll the live required-check query after the transition and record the rows as
soon as they appear. The unknown set keeps the epoch pending and cannot satisfy
the final ready predicate.

If the live query remains empty, inspect the target branch's protection with
`gh api repos/{owner}/{repo}/branches/{branch}/protection/required_status_checks`
and its active repository rulesets with
`gh api 'repos/{owner}/{repo}/rulesets?includes_parents=true&targets=branch' --paginate`.
Record a known empty set only when those sources prove that no required status
check or workflow applies to the target branch. Otherwise keep the set unknown
and investigate why the configured workflow did not create a run.

Read required runs with `gh pr checks --required --json
bucket,completedAt,event,link,name,startedAt,state,workflow`. A row belongs to the
current epoch only when `startedAt` is at or after the controller's
`checkEpochStartedAt`. Until every required context has a current-epoch row, the
epoch is pending. When they do, require every row to have a passing state, then
run the ordinary `gh pr checks --required` command as the final required-context
gate. Keep context identity by check name and workflow; do not substitute an
older row with the same head commit. A missing or invalid `startedAt` is pending,
not current-epoch evidence.

Within one context, a queued replacement takes precedence over completed
history. Otherwise select the row with the latest `startedAt`. Evaluate only
that selected row: an older failure cannot override its later pass, and an older
pass cannot override its queued or running replacement.

The durable controller's recorded required-context set defines what must
appear. A missing expected row is pending. An unknown set is pending.

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
