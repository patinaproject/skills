# Design: autorelease label color should be #ededed to not conflict with release-please defaults [#38](https://github.com/patinaproject/bootstrap/issues/38)

## Problem

The bootstrap skill currently documents `autorelease: pending` as expected to
have color `c5def5`, in two places:

- [skills/bootstrap/SKILL.md:252](../../../skills/bootstrap/SKILL.md): "verify
  that `autorelease: pending` exists with color `c5def5`…"
- [skills/bootstrap/audit-checklist.md:53](../../../skills/bootstrap/audit-checklist.md):
  "present; color `c5def5`; description non-empty…"

release-please creates both autorelease labels with color `ededed` by default.
The live `patinaproject/bootstrap` repo is split today: `autorelease: pending`
is `c5def5` (because we explicitly set it that way) and `autorelease: tagged`
is `ededed` (release-please's default). Every newly bootstrapped repo will
either drift from release-please's default or be repainted by our audit, with
no observable benefit.

## Goals

- Align the documented expected color for `autorelease: pending` with
  release-please's default (`ededed`).
- Repaint the live label in `patinaproject/bootstrap` so the repo matches the
  new baseline.
- Keep the audit a no-op for any repo whose autorelease labels already match
  release-please defaults.

## Non-goals

- Changing release-please's own configuration or defaults.
- Editing historical Superpowers plan/spec files under `docs/superpowers/`
  that reference `c5def5` – point-in-time artifacts.
- Changing the `description` field of either autorelease label.
- Adding `autorelease: tagged` to the audit checklist (it's only listed in
  the documentation paragraph today, not the checklist row).

## Proposed change

1. Edit [skills/bootstrap/SKILL.md:252](../../../skills/bootstrap/SKILL.md)
   to specify color `ededed` for `autorelease: pending`.
2. Edit [skills/bootstrap/audit-checklist.md:53](../../../skills/bootstrap/audit-checklist.md)
   to specify color `ededed` for `autorelease: pending`.
3. Repaint the live `autorelease: pending` label in `patinaproject/bootstrap`
   via `gh label edit "autorelease: pending" --color ededed`.

These two source files live under `skills/bootstrap/` (the skill itself), not
under `skills/bootstrap/templates/**`, so the
template-round-trip workflow described in
[AGENTS.md](../../../AGENTS.md) does not apply here.

## Acceptance criteria

- **AC-38-1**: Given a fresh read of [skills/bootstrap/SKILL.md](../../../skills/bootstrap/SKILL.md),
  when the reader looks at the "Reserved labels" paragraph, then the
  documented expected color for `autorelease: pending` is `ededed`.
- **AC-38-2**: Given a fresh read of [skills/bootstrap/audit-checklist.md](../../../skills/bootstrap/audit-checklist.md),
  when the reader looks at the `autorelease: pending` row in
  "Reserved GitHub labels", then the expected color is `ededed`.
- **AC-38-3**: Given the live `patinaproject/bootstrap` repo, when running
  `gh label list --json name,color --jq '.[] | select(.name | startswith("autorelease"))'`,
  then both `autorelease: pending` and `autorelease: tagged` report color
  `ededed`.

## Out of scope

- Any change to release-please configuration.
- Any change to historical plan/spec files referencing `c5def5`.
- Any change to label descriptions.
