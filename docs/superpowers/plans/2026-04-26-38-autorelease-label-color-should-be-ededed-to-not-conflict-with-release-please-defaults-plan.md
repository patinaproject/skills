# Plan: autorelease label color should be #ededed to not conflict with release-please defaults [#38](https://github.com/patinaproject/bootstrap/issues/38)

Approved design: [2026-04-26-38-…-design.md](../specs/2026-04-26-38-autorelease-label-color-should-be-ededed-to-not-conflict-with-release-please-defaults-design.md).

## Workstream A — skill source edits

Single workstream; both edits change the same color literal in adjacent
sentences and ship together.

### Task A1 — Update `skills/bootstrap/SKILL.md`

In [skills/bootstrap/SKILL.md:252](../../../skills/bootstrap/SKILL.md), under
`### Reserved labels`, change:

```text
…verify that `autorelease: pending` exists with color `c5def5` and a non-empty description…
```

to:

```text
…verify that `autorelease: pending` exists with color `ededed` (the
release-please default) and a non-empty description…
```

The "(the release-please default)" parenthetical makes the rationale legible
in the audit prose so future readers don't have to chase the issue. Satisfies
**AC-38-1**.

### Task A2 — Update `skills/bootstrap/audit-checklist.md`

In [skills/bootstrap/audit-checklist.md:53](../../../skills/bootstrap/audit-checklist.md),
under `### Reserved GitHub labels`, change the `autorelease: pending` row's
"color `c5def5`" to "color `ededed`".

Satisfies **AC-38-2**.

### Task A3 — Repaint the live label

After the two doc edits land in the PR (or as a one-shot before merge — order
doesn't matter for the PR diff), run on `patinaproject/bootstrap`:

```bash
gh label edit "autorelease: pending" --color ededed
```

Note: `--color` ignores `#`. The edit is idempotent and safe to re-run.
Satisfies **AC-38-3**.

This is a live-repo administrative action, not a code change. It will be
performed once the PR merges (so the docs and live state align in the same
operator action), and verified with the AC-38-3 command. Note this in the PR
body's `Validation` section.

## Verification

Run from the worktree root:

```bash
grep -rn "c5def5" skills/        # expect: no matches
grep -n "ededed" skills/bootstrap/SKILL.md skills/bootstrap/audit-checklist.md
pnpm lint:md
```

After Task A3 (post-merge):

```bash
gh label list --json name,color --jq '.[] | select(.name | startswith("autorelease"))'
# expect: both labels report color ededed
```

## Blockers

None.

## Out of scope

- Editing historical `docs/superpowers/{specs,plans}/**` files that reference
  `c5def5`. Snapshots only.
- Adding `autorelease: tagged` to the audit-checklist row (its color is
  already `ededed` and it isn't currently audited).
- Any release-please configuration change.
