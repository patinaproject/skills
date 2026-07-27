# Triage Workflow

This tracker-agnostic workflow delegates every mutation to
[the issue-tracker adapter](issue-tracker.md).

## Vendored role translation

The vendored `triage` skill uses the stable roles `bug`, `enhancement`,
`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and
`wontfix`. Translate every role through the adapter instead of assuming it is
a label or lifecycle state. Duplicate work and blocking use the selected
provider's native relationships.

In vendored triage guidance, interpret “GitHub issue” as the canonical tracker
issue and route example commands through the adapter. Pull requests remain
forge objects.

## Shaping and ready bar

New work enters the adapter's triage state or role. Work that needs more
evidence or a maintainer decision carries the applicable shaping roles. An
issue becomes ready only when its shaping set is empty and an implementation
brief can be written without new decisions or missing evidence.

When a shaping activity resolves:

1. post its outcome on the issue;
2. remove only that activity's shaping label;
3. preserve every other label; and
4. choose the next justified state from the remaining evidence.

## Ready-state side effects

When an issue becomes ready, use the adapter to:

1. apply the adapter's ready state;
2. select `ready-for-agent` or `ready-for-human`;
3. choose the justified native priority; and
4. set a project and milestone together when it belongs to a named effort.

Release attachment is not a triage side effect. Releases describe what shipped.
A blocked issue may still be ready; record its dependency with the native
blocked-by relationship.
