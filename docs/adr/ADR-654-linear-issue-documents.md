# ADR-654: Linear issue artifacts live in Documents; comments ask a human to act

## Status

Accepted. Amends ADR-337 for Linear-tracked repositories.

## Context

On private repositories the vendored `triage` skill posted triage notes and agent briefs as issue comments. Linear notifies every subscriber of each comment, so maintainers received a steady stream of AI-written notes that needed no action, and the comments that did need a human got lost among them. Research had no home on the issue, and ADR-337 put proposed ADR text in a comment, adding more noise. Linear supports Documents attached to an issue, which hold long, revisable content without notifying subscribers.

## Decision

On Linear-native issues, durable issue artifacts (triage notes, agent briefs, issue-scoped research, and proposed ADRs) are saved as Documents attached to the issue, one per kind and found by exact title (`Triage notes`, `Agent brief`, `Research`, `ADR-<id>: <title>`), and updated in place on re-runs. A comment is written only when a human must act: the `needs-info` comment that @-mentions each person who must answer (the reporter or a developer), and the explanation posted with a `wontfix` closure. For proposed ADRs, the `ADR-<id>` Document replaces ADR-337's comment as the pre-merge home. `docs/adr/` remains the permanent record, and the implementing pull request copies the Document word for word. Public repositories keep GitHub comments, because GitHub is their source of issue truth and external reporters cannot see Linear Documents.

## Consequences

Issue subscribers stop getting notified about AI working notes. Reporters still learn when they are asked something. Triage output is read by opening a Document instead of scrolling the activity feed. The rule lives in the tracker adapter because the producing skills are upstream mirrors, and repositories adopt it through the `scaffold-repository` audit. Triage behaviour now depends on repository visibility, so public and private issues show triage output in different places.
