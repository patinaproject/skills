# ADR-692: Triage assigns priority from the repository's rubric

## Status

Accepted

## Context

Triage set priority only for a live fault that was affecting users and left the rest to a person, so 42% of Patina's Linear issues had none. Set priorities strongly predicted what shipped. GitHub Issues has no priority field, and the tracker adapter forbade edits to the Linear mirror of a public repository.

## Decision

Both triage paths assign priority on every outcome that leaves the issue open, except a duplicate, from the `## Priority rubric` section of the repository's tracker adapter. A present section replaces the default, and `setup-work-skills` writes the default. The rubric reads only evidence in the issue, never labels, the reporter, or effort. Urgent is a closed list of triggers, and an issue where one holds is never High. An agent-set priority needs no approval, is recorded with its matched rule in the triage notes, and is overwritten only by triage while it still equals that record. Public repositories write priority to the Linear mirror, an exception to the rule against editing the mirror, limited to Linear-only fields.

## Consequences

"No priority" means not yet triaged. Without a rubric section, triage keeps the older rule and asks for a `setup-work-skills` re-run. Inflated Urgent values are visible and easy to correct, because each one names its trigger. A bulk backfill writes only after a maintainer approves its table. For a public repository, triage notes and the agent brief, which carry the priority record, live as Documents on the synced Linear issue rather than as GitHub comments, amending [ADR-654](ADR-654-linear-issue-documents.md). Extends [ADR-675](ADR-675-automated-triage-playbook.md) and builds on [ADR-682](ADR-682-issue-type-and-outcome-labels.md).
