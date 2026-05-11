# Design: Restrict writing-skills review to skill file changes [#70](https://github.com/patinaproject/superteam/issues/70)

## Intent summary

Restrict Superteam's `superpowers:writing-skills` trigger so it applies to
actual installable skill changes, not every workflow, playbook, or operational
document change that can be described as a workflow-contract surface.

The current contract is too broad in the `Reviewer` role and nearby spawn
guidance. It says skill or workflow-contract changes should invoke
`superpowers:writing-skills`, which lets a reviewer rationalize that ordinary
workflow or operational playbook edits need skill pressure tests even when no
`skills/**/*.md` file changed. The fix should preserve the strong
writing-skills gate for real skill edits while routing non-skill workflow docs
through ordinary local review and any repository-specific gates that apply.

This is a workflow-contract change because it modifies the installed
`superteam` skill and its adjacent teammate prompt guidance.

## Requirements

- **AC-70-1**: When a change touches workflow, operational playbook, or other
  process-document files but no installable skill files, Superteam review does
  not invoke `superpowers:writing-skills` solely because those files are
  workflow-contract surfaces.
- **AC-70-2**: When a change touches installable skill files, Superteam review
  invokes `superpowers:writing-skills` according to the skill-change review
  contract.
- **AC-70-3**: When Superteam guidance mentions workflow-contract changes, the
  writing-skills trigger is scoped clearly to skill changes only.
- **AC-70-4**: Superteam guidance that couples "workflow-contract" with
  `superpowers:writing-skills` is inventoried and either updated to the
  narrowed Reviewer trigger or explicitly preserved as a design-time Gate 1
  review dimension, so stale wording cannot preserve the reported
  rationalization.

## Scope

The intended implementation surface is narrow:

- `skills/superteam/SKILL.md`
- `skills/superteam/agent-spawn-template.md`

The change should update the `Reviewer` contract, red flags, and spawn-template
instructions that currently say `skills/**/*.md` or workflow-contract docs both
trigger `superpowers:writing-skills`.

The implementation must inventory current `workflow-contract` plus
`writing-skills` wording across `skills/superteam/**` before editing. Reviewer
and spawn-template review-trigger language should be narrowed. Gate 1
Brainstormer design-time language may still require writing-skills dimensions
for workflow-contract designs, but any preserved wording must be explicitly
identified as design-review evidence rather than the Reviewer trigger for
non-skill workflow docs.

This issue does not remove the separate `docs/skill-improver-quality-gate.md`
requirement for `skills/superteam/**` changes. That gate remains required for
this PR because the implementation will touch the Superteam skill package. The
fix only narrows what counts as a `superpowers:writing-skills` trigger.

## Behavior design

### Skill-file changes

Use `superpowers:writing-skills` when the changed surface is an installable
skill file:

- `skills/**/SKILL.md`
- adjacent files inside a skill package when those files define installed skill
  behavior or teammate prompt contracts

For this repository, `skills/superteam/**` is an installable skill package, so
changes there still require writing-skills review and the Superteam
skill-improver quality gate.

### Non-skill workflow or playbook changes

Do not invoke `superpowers:writing-skills` only because a file is a workflow,
playbook, runbook, design artifact, plan artifact, PR template, or operational
process document outside an installable skill package.

Those files may still need careful review. The correct review is the ordinary
local pre-publish review for the surface, plus any explicit repository gate
documented for that file. The reviewer should not relabel them as
writing-skills work unless they actually change installed skill behavior.

### Ambiguous surfaces

If a changed file is adjacent to a skill package or could be consumed as part
of installed skill behavior, classify by the file's role:

- inside `skills/<skill-name>/`: skill-surface; writing-skills applies
- outside `skills/`: non-skill unless repository guidance explicitly says the
  file is packaged as skill behavior

This prevents "workflow-contract" from becoming a catch-all phrase that routes
everything through writing-skills.

## RED-phase baseline obligation

The observable failure is captured by the issue example:

```text
Reviewer's role for skill/workflow-contract changes invokes
superpowers:writing-skills pressure tests; #994 doesn't touch skills/**/*.md
directly, but the operational playbooks are workflow-contract surfaces and
warrant a careful read.
```

RED behavior:

1. A change updates operational playbooks or workflow docs outside
   `skills/**`.
2. Reviewer sees "workflow-contract" in the current contract.
3. Reviewer invokes or justifies invoking `superpowers:writing-skills` even
   though no installable skill file changed.

GREEN behavior:

1. The same change updates operational playbooks or workflow docs outside
   `skills/**`.
2. Reviewer performs local review for that surface and checks any explicit
   repo-specific gates.
3. Reviewer does not invoke `superpowers:writing-skills` unless the diff also
   changes `skills/**` or another file explicitly packaged as installed skill
   behavior.

## Loophole closure

| Excuse | Reality |
|--------|---------|
| "It is a workflow contract, so writing-skills applies." | Writing-skills applies to installable skill changes. Workflow-contract wording outside `skills/**` is not enough by itself. |
| "Operational playbooks teach agents what to do, so they are basically skills." | A playbook can need careful review without being an installable skill. Use the surface's own review gate unless it is packaged as skill behavior. |
| "The contract says skill/workflow-contract changes, so I should keep using both triggers." | The slash is the bug. The trigger must distinguish skill changes from non-skill workflow docs. |
| "If writing-skills no longer applies, review can be light." | No. Reviewer still owns local pre-publish review, artifact ownership, verification, and role-rule compliance for every changed surface. |
| "Superteam skill package files are workflow docs too, so they can skip writing-skills." | Files under `skills/superteam/**` are part of an installable skill package. Writing-skills and the skill-improver quality gate still apply. |

## Red flags

- Reviewer justifies `superpowers:writing-skills` for a diff that touches only
  `docs/**`, `.github/**`, or operational playbooks outside `skills/**`.
- Guidance still says "`skills/**/*.md` or workflow-contract docs" as a single
  trigger for writing-skills.
- The fix weakens review for actual skill-package files under
  `skills/superteam/**`.
- The fix removes the skill-improver quality gate for Superteam skill-package
  changes.
- The fix relies on fuzzy phrases like "agent-facing docs" instead of a clear
  packaged-skill boundary.

## Token-efficiency target

Keep the runtime skill changes small. Prefer replacing the broad trigger text
with scoped wording instead of adding a new general taxonomy of every possible
workflow document. The expected `SKILL.md` change should be a handful of
targeted lines plus one rationalization-table row or red-flag bullet if needed.

## Pressure tests

### PT-70-1: Operational playbook only

Scenario: A PR changes `docs/dev-onboarding-for-admins.md` and no files under
`skills/**`.

Expected behavior: Reviewer performs local pre-publish review and any explicit
repo-specific checks for that document. Reviewer does not invoke
`superpowers:writing-skills` solely because the document is a workflow or
operational playbook.

Failure signal: Reviewer says the document is a workflow-contract surface and
therefore needs writing-skills pressure tests.

### PT-70-2: Superteam skill package change

Scenario: A PR changes `skills/superteam/SKILL.md` or
`skills/superteam/agent-spawn-template.md`.

Expected behavior: Reviewer invokes `superpowers:writing-skills`, runs the
relevant pressure-test walkthrough, and runs the Superteam skill-improver
quality gate or documented fallback.

Failure signal: Reviewer treats the narrowed trigger as permission to skip
writing-skills for actual Superteam skill-package changes.

### PT-70-3: Mixed skill and non-skill workflow change

Scenario: A PR changes both `skills/superteam/SKILL.md` and a non-skill
workflow document under `docs/**`.

Expected behavior: Writing-skills applies because the PR touches an installable
skill package. The non-skill document receives appropriate local review, but it
is not independently used as the reason writing-skills applies.

Failure signal: Reviewer cannot explain which changed files caused the
writing-skills trigger.

## Out of scope

- Changing Brainstormer Gate 1 requirements for workflow-contract designs.
  This issue is about the Reviewer and spawn-guidance trigger that caused the
  reported mistake.
- Removing local pre-publish review for workflow or operational documents.
- Changing the Superteam skill-improver quality gate for `skills/superteam/**`.
- Defining a universal taxonomy for all process documentation across
  repositories.

## Adversarial review

Reviewer context: same-thread fallback for the initial design draft. A fresh
review pass is still required before Gate 1 approval is presented.

### Checked dimensions

- **RED/GREEN baseline obligation**: Present. The issue example is converted
  into before/after observable behavior.
- **Rationalization resistance**: Present. The design closes the broad
  "workflow contract equals skill" rationalization and the opposite "skip real
  skill review" rationalization.
- **Red flags**: Present. The list names both over-triggering and
  under-triggering failure modes.
- **Token-efficiency targets**: Present. The implementation is constrained to
  targeted wording replacements.
- **Role ownership**: Present. Reviewer owns the narrowed trigger; ordinary
  local review remains intact for non-skill docs.
- **Stage-gate bypass paths**: Present. Actual skill-package changes still
  require writing-skills and skill-improver evidence.

### Findings

| Source | Severity | Location | Finding | Disposition |
|---|---|---|---|---|
| brainstormer | material | `## Scope` | The first pass could be misread as removing the skill-improver quality gate from Superteam package changes. | Resolved by stating that the gate remains required for `skills/superteam/**` and this issue only narrows the writing-skills trigger. |
| adversarial-review | material | `AC-70-2` | `may invoke` weakened the preserved skill-change gate. A later teammate could satisfy the AC while making writing-skills optional for installable skill changes. | Resolved by changing AC-70-2 to mandatory `invokes` language. |
| adversarial-review | material | `## Scope`, `AC-70-3` | The design did not require an inventory or disposition of other `workflow-contract` plus `writing-skills` wording, so stale guidance could preserve the reported rationalization. | Resolved by adding AC-70-4 and an implementation note requiring inventory, trigger narrowing, and explicit preservation only for Gate 1 design-review dimensions. |

After these revisions, the adversarial-review result is `findings dispositioned`.
The design retains the checked writing-skills dimensions: RED/GREEN baseline
obligation, rationalization resistance, red flags, token-efficiency target, role
ownership, and stage-gate bypass protection for real skill-package changes.
