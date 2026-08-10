# Repository-Controlled Readiness Predicate

This reference is the single source of truth for an agent-authored draft pull
request's transition to ready for human review.

Flip an agent-owned draft only when all three conditions hold:

1. The exact current committed head equals the latest published pull-request
   head, and the repository-required local review passed on that commit.
2. Every required GitHub check passed on the latest published head, as reported
   by `gh pr checks --required`.
3. Zero unresolved agent-authored GraphQL review threads remain.

Immediately before `gh pr ready`, recapture local `HEAD`, the pull request's
`headRefOid`, required-check results, and paginated GraphQL review threads.
Evaluate the three conditions from that snapshot. If any input changes during
the capture or before the command runs, discard the snapshot and restart the
predicate.

An optional review service's status, availability, completion, conclusion, or
latest-head coverage never enters the predicate. Feedback it posted remains an
ordinary agent-authored conversation and blocks while unresolved.

Human-authored threads sit outside this predicate because the transition puts
the work formally in front of people. They still block the separate
ready-to-merge gate until their author or the operator resolves them. Leave a
human's work-in-progress draft alone unless the operator asks the agent to take
it over.

The transition is one-way. Never convert a ready pull request back to draft.
