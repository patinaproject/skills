# Plan: Superteam brainstorming step does not surface useful output [#82](https://github.com/patinaproject/skills/issues/82)

## Approved design

- Design artifact: `docs/superpowers/specs/2026-05-15-82-superteam-brainstorming-step-does-not-surface-useful-output-design.md`
- Gate 1 approval: operator explicitly approved on 2026-05-15.
- Handoff commit: `bde04f4`

## Goal

Make Superteam Gate 1 handoffs show Brainstormer's useful decision trail in a
concise, conversational approval request instead of a noisy status report.

## Workstreams

### W1: Add Brainstormer output to the cross-role contract

Update `skills/superteam/SKILL.md`.

Tasks:

- W1.1 Add `brainstorming_output` to the Gate 1 evidence required before asking
  for approval.
- W1.2 Define `brainstorming_output` in the Brainstormer done-report contract
  as problem framing, directions considered, recommended direction, notable
  tradeoffs, and open risks or questions.
- W1.3 Tighten Gate 1 rendering guidance so Team Lead keeps the required
  artifact path, full requirement set, adversarial-review result, reviewer
  context, and clean-pass rationale, but renders them as a short,
  decision-focused handoff rather than a field dump.
- W1.4 Add a rationalization-table entry and red flag for treating
  "conversational" as permission to omit required evidence.

Acceptance criteria covered: AC-82-1, AC-82-2, AC-82-3, AC-82-4.

### W2: Align Brainstormer role surfaces

Update both supported Brainstormer role files.

Files:

- `skills/superteam/.claude/agents/brainstormer.md`
- `skills/superteam/agents/brainstormer.openai.yaml`

Tasks:

- W2.1 Add a non-negotiable rule requiring Brainstormer to include
  `brainstorming_output` in the SKILL.md-owned done report.
- W2.2 State that the field is a concise decision trail, not a raw transcript.
- W2.3 Keep the role files pointing back to SKILL.md for the full done-report
  field set rather than restating every field.

Acceptance criteria covered: AC-82-1, AC-82-5.

### W3: Extend contract verification

Update `scripts/verify-superteam-contract.sh`.

Tasks:

- W3.1 Assert `skills/superteam/SKILL.md` contains `brainstorming_output`.
- W3.2 Assert both Brainstormer role surfaces contain
  `brainstorming_output`.
- W3.3 Assert `skills/superteam/SKILL.md` contains the conversational
  rendering guardrail.

Acceptance criteria covered: AC-82-4, AC-82-5, AC-82-6.

### W4: Verify

Tasks:

- W4.1 Run `pnpm lint:md`.
- W4.2 Run `pnpm verify:superteam`.
- W4.3 Inspect the modified contract text to confirm it keeps required Gate 1
  evidence while reducing operator-facing noise.

Acceptance criteria covered: AC-82-6.

## Blockers

None.
