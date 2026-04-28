# Superteam skill-improver quality gate

Repeatable quality gate for changes to `skills/superteam/SKILL.md` and adjacent
workflow-contract files (`agent-spawn-template.md`, `pre-flight.md`,
`routing-table.md`, `pr-body-template.md`, `loopback-trailers.md`).

The gate runs the Trail of Bits `skill-improver` loop against the live skill
directory. It produces explicit completion evidence that maintainers can attach
to a PR, and it has a documented fallback when the required dependencies are
not installed.

## When to run

Run the gate before publishing a PR that touches:

- `skills/superteam/**` — any file in the skill package
- `docs/superpowers/specs/**-design.md` or `docs/superpowers/plans/**-plan.md`
  whose subject is a Superteam workflow-contract surface

Other repository changes do not require this gate.

## Dependency probe

The gate has two modes. Detect which one applies before running:

1. Confirm the `skill-improver` plugin is available:

   ```bash
   ls "$HOME/.claude/plugins/cache/trailofbits/skill-improver"/*/skills/skill-improver/SKILL.md \
     2>/dev/null
   ```

2. Confirm the `plugin-dev` plugin (which provides the `skill-reviewer`
   subagent) is available:

   ```bash
   ls "$HOME/.claude/plugins/cache"/**/skills/plugin-dev/skill-reviewer 2>/dev/null
   ```

   In Claude Code, `/plugins` should also list `plugin-dev` as enabled.

If both probes succeed, run the **primary mode**. If either fails, run the
**fallback mode**.

## Primary mode: real skill-improver loop

Invoke the loop from a Claude Code session that has both plugins enabled:

```text
/skill-improver:skill-improver on superteam
```

The slash command resolves the skill path, calls the setup script to start a
session, and drives review-fix iterations until either:

- the assistant emits the explicit completion marker
  `<skill-improvement-complete>` on its own line, or
- max iterations are reached, or
- the operator cancels with `/skill-improver:cancel-skill-improver <session-id>`.

Each iteration calls the `plugin-dev:skill-reviewer` agent on the skill
directory and applies fixes to critical and major findings. Minor findings are
evaluated for usefulness rather than applied blindly.

### Required completion evidence

Capture the following from the run and include it in the PR:

- The exact dispatch command (`/skill-improver:skill-improver on superteam`).
- The session ID printed by the setup script
  (`Session ID: <YYYYMMDDhhmmss>-<short>`).
- The total iteration count reported on completion.
- A list of each Critical and Major finding from the final review pass with its
  disposition: `fixed` (with the file change summary) or `not applicable`
  (with a repo-specific rationale that cites repository conventions or
  authoring discipline such as `superpowers:writing-skills`).
- A brief evaluation note for any Minor finding the maintainer chose to skip.

A run is acceptable for the gate when the final reviewer pass reports zero
unresolved Critical and zero unresolved Major findings.

### Cancelling the loop

If the loop continues past a verified clean reviewer pass because the stop hook
does not detect the marker, cancel the session explicitly so the state file is
removed:

```text
/skill-improver:cancel-skill-improver <session-id>
```

Cancellation preserves all changes the loop made to the skill files. Note the
cancellation in the PR alongside the final reviewer disposition so the gate
result remains auditable.

## Fallback mode: writing-skills review

Use the fallback when `plugin-dev` or `skill-improver` is unavailable in the
maintainer's environment.

1. Load `superpowers:writing-skills` and review the diff against its
   discipline: RED/GREEN baseline obligation, rationalization-table coverage,
   red-flag bullets, token-efficiency targets, role ownership, and
   stage-gate bypass paths.
2. Pressure-test the changed sections by walking the relevant Superteam
   teammate contracts (Team Lead, Brainstormer, Planner, Executor, Reviewer,
   Finisher) and confirming the change does not weaken any gate.
3. Record the reviewer (self-review or another maintainer) and the dimensions
   checked.

The fallback is a known limitation: it does not produce a `skill-reviewer`
machine pass. PRs that use the fallback MUST state that the
`plugin-dev:skill-reviewer` agent was unavailable in the run environment and
that the review was performed against `superpowers:writing-skills` only.

## PR evidence

Every PR that touches a workflow-contract surface listed under [When to run]
(#when-to-run) must include the gate evidence in its body. Suggested layout:

```markdown
## Skill-improver quality gate

- Mode: primary | fallback
- Dispatch: `/skill-improver:skill-improver on superteam`
- Session: `<session-id>` (cancelled after verification | completed at
  iteration `<n>`)
- Final reviewer pass: 0 Critical, 0 Major; Minor evaluated below
- Findings:
  - `<finding>` — fixed: `<file:line>` `<short summary>`
  - `<finding>` — not applicable: `<rationale citing repo conventions>`
  - `<finding>` (minor) — skipped: `<evaluation note>`
- Fallback caveats (fallback mode only): `plugin-dev:skill-reviewer`
  unavailable in run environment; review performed against
  `superpowers:writing-skills` discipline.
```

Place this block under a `## Skill-improver quality gate` heading in the PR
body, in addition to the standard PR template sections.

## Reusing later

Future Superteam workflow-contract changes should reuse this document by
linking to it from the PR body and copying the evidence block. Do not
re-derive the procedure or invent new dispatch patterns. If the procedure needs
to change, update this document in the same PR that changes the procedure and
note the change in the rationale.
