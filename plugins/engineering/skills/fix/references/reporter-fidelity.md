# Reporter-fidelity handoff

Use this reference for behavioral observation context passed into `polish` and
`ready-pr`, and for the reporter-fidelity verdict in the operator handoff.

## Observation context

Carry every available field without inventing missing evidence:

- operator scope and most direct requested-change link
- expected and actual behavior
- property the reporter observed, such as visual, timing, ordering, interaction,
  layout, visibility, or data behavior
- exact reproduction and required environment, when known
- gathered evidence and the target or head it covers
- unavailable evidence
- known mismatches between tests or checks and the reported symptom

The invoking controller decides whether an absent field blocks its own work.
For `ready-pr`, missing context or evidence never changes the readiness
predicate or draft behavior.

## Matching evidence to the report

For a reported defect, compare each regression assertion with the property the
reporter observed. The test must fail when that property fails. A proxy may add
context, but it cannot replace direct evidence.

These checks do not prove the named reported property:

- eventual state or a fixed delay for timing
- request shape or counts for ordering
- internal calls for a public interaction
- element presence for visibility or layout
- indirect requests or counts for directly reported data behavior

Match the observation to the report. Measure time or sequence for timing and
ordering. Exercise the same public interaction for interaction reports. Inspect
visual output or measure geometry for visibility and layout. Compare data
results directly for data reports.

## Handoff verdict

Reporter-fidelity QA is `verified` only when direct evidence shows the expected
behavior and no reported failure on the identified current target or head. It
is `pending` when direct evidence is missing, stale, unavailable, tied to
another head, or known to mismatch the symptom.

A passing CI result or proxy evidence alone does not change the verdict. Keep
it separate from pull request readiness.

Use the most specific link that identifies the requested change. Prefer the
report or review thread over its containing review, pull request, or issue.
Apply the consuming repository's rules when it maps pull request feedback into
its issue tracker.

The operator owns `/fix` invocation, reviewer contact, replies to human-authored
conversations, and changes to a human review's state. Report the handoff without
taking those actions.
