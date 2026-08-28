# Reporter-Fidelity Handoff

Use this reference for behavioral observation context passed into `polish` and
`ready-pr`, and for the reporter-fidelity verdict in the operator handoff.

## Observation context

Carry every available field without inventing missing evidence:

- operator scope and most direct requested-change link;
- expected and actual behavior;
- reporter-perceived surface: visual, timing, ordering, interaction, layout,
  visibility, data, or another directly perceived property;
- exact reproduction and required environment, when known;
- gathered evidence and the target or head it covers;
- unavailable evidence; and
- known mismatches between tests or checks and the reported symptom.

The invoking controller decides whether an absent field blocks its own work.
For `ready-pr`, missing context or evidence is ordinary input state and never
changes the readiness predicate or draft behavior.

## Handoff verdict

Reporter-fidelity QA is `verified` only when direct evidence covers the
reporter-perceived behavior on the identified current target or head. It is
`pending` when direct evidence is missing, stale, unavailable, tied to another
head, or known to mismatch the symptom.

Passing CI, request shape, counts, eventual state, fixed delays, internal calls,
or element presence cannot verify a different reported property. Keep the
reporter-fidelity verdict separate from PR readiness.

Prefer the most specific link that identifies the requested change: the report
or review thread before its containing review, pull request, or issue. Apply the
consuming repository's reference rules when it maps pull-request feedback into
its issue tracker.

The handoff is informational. Leave invocation of `/fix`, reviewer notification
or requests, replies to human-authored conversations, and review-state changes
to the operator.
