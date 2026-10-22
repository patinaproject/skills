# ADR-675: Unattended triage is a patina-mode playbook built on Benny

## Status

Accepted

## Context

Goodyear triages issues without a person present, but `team:triage` is an interactive skill that recommends and waits. Upstream pstack's Benny pack has an unattended intake skill, `triage-issue-reports`, that Patina's `pstack-claude` mirror does not carry, and it is built around Slack threads and new tickets rather than existing tracker issues.

## Decision

Unattended triage is a bundled patina-mode playbook, declared as a Patina fork of the Engineering mirror, adapted from Benny's `triage-issue-reports` to work entirely inside the issue tracker. Benny is credited, not vendored, and no upstream source is added for it. `team:triage` stays the interactive skill for people. Both apply the same readiness check: `READINESS.md` is kept as two identical copies, one per plugin, and a lint fails when they differ, because cross-plugin links are forbidden and neither plugin should depend on the other being installed.

## Consequences

The playbook ships to every repository with the Engineering plugin and needs fork entries that each pstack sync reconciles. A change to the readiness check edits both copies in the same pull request. Benny upstream fixes do not flow in automatically.
