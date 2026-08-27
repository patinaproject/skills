# Repository-Controlled Readiness Predicate

This reference is the single source of truth for an agent-authored draft pull
request's transition to ready for human review.

Flip an agent-owned draft only when all three conditions hold:

1. The exact current committed head equals the latest published pull-request
   head, and the repository-required local review passed on that commit.
2. Every check in the **required-check set** below passed on the latest
   published head.
3. Zero unresolved agent-authored GraphQL review threads remain.

Immediately before `gh pr ready`, recapture local `HEAD`, the pull request's
`headRefOid`, required-check results, and paginated GraphQL review threads.
Evaluate the three conditions from that snapshot. If any input changes during
the capture or before the command runs, discard the snapshot and restart the
predicate.

Capture the check condition with the bundled helper so the result is tied to
the exact published head:

```sh
<update-branch-directory>/scripts/current-head-required-checks.sh \
  --pr <pull-request-number> \
  --head <published-head-sha>
```

Only `outcome=required-checks-passed` satisfies condition 2. The helper is
bundled with the sibling `update-branch` skill. A non-pass outcome keeps the
pull request non-ready even when a target-owned local failure was already
dispositioned.

An optional review service's status, availability, completion, conclusion, or
latest-head coverage never enters the predicate. Feedback it posted remains an
ordinary agent-authored conversation and blocks while unresolved.

Human-authored threads sit outside this predicate because the transition puts
the work formally in front of people. They still block the separate
ready-to-merge gate until their author or the operator resolves them. Leave a
human's work-in-progress draft alone unless the operator asks the agent to take
it over.

The transition is one-way. Never convert a ready pull request back to draft.

## Required-check set

The required-check set is the contexts `gh pr checks --required` selects on the
latest published head. GitHub counts `success`, `skipped`, and `neutral` as
passing conclusions for a required context, so a required context passes on any
of the three.

The Checks API returns every run on that head, which is a wider list than the
CLI selects. Two kinds of run appear there and stay outside the set:

- **Optional runs**, which the branch protection does not require.
- **Superseded runs**, where a later run of the same context on the same head
  replaced an earlier one. Concurrency cancellation is the common source: the
  earlier run is retained as `cancelled` while the current run of that context
  succeeds.

Both are check **history**. Read them as history rather than as a current
required result, and keep the required-check evaluation on the CLI-selected
contexts. History is still reported, under the reporting rules in
[workflows/ready-for-merge.md](../workflows/ready-for-merge.md).

Passing this set is the check condition alone. GitHub decides mergeability
separately through `mergeStateStatus`, so a fully passing required-check set
never stands in for a `CLEAN` merge state.
