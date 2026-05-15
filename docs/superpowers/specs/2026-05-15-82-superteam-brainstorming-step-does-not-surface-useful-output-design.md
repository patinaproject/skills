# Design: Superteam brainstorming step does not surface useful output [#82](https://github.com/patinaproject/skills/issues/82)

## Summary

Make Gate 1 surface Brainstormer's actual brainstorming substance, not just the
branch, spec path, commit, verification status, and approval prompt. The
approval handoff should include the useful decision trail the operator needs to
review quickly: problem framing, directions considered, recommendation,
tradeoffs, risks, and open questions.

This is a workflow-contract change. The durable artifact still remains the
source of truth, but Team Lead must carry Brainstormer's user-facing
brainstorming output into the Gate 1 approval request in a conversational,
low-noise form.

## Skill guidance

This change uses the repo-required `write-a-skill` structure review. After
`pnpm install` restored the vendored Superpowers skills, the
`superpowers:writing-skills` guidance was also read before finalizing the
workflow-contract review dimensions:

- RED/GREEN baseline obligations
- rationalization resistance
- red flags
- token-efficiency targets
- role ownership
- stage-gate bypass paths

## Problem

Issue #82 reports that the current Gate 1 handoff can look complete while
omitting the actual brainstorming output. The operator sees a procedural status
report with a design path and verification results, then is asked to approve the
spec. That forces the operator to open the artifact just to understand what
Brainstormer thought through.

The existing contract already requires an artifact path, intent summary,
requirements, and adversarial-review evidence. Those are necessary, but they do
not guarantee that the default brainstorming output reaches the user. A concise
intent summary can compress away the useful design exploration: alternatives,
why the chosen direction won, tradeoffs, risks, and unresolved questions.

The first Gate 1 revision for this issue also exposed a second failure mode:
even when all required evidence is technically present, a rigid approval packet
can drown the operator in labels, lists, and workflow noise. The contract should
make clear that required evidence is not a license to dump every field into
chat. Team Lead should tell the operator what matters, why it matters, and what
decision is needed.

## Goals

- Require Brainstormer to hand off a concise `brainstorming_output` summary.
- Require Team Lead to include that output in the Gate 1 approval request.
- Make the Gate 1 handoff conversational and operator-useful by default.
- Preserve the durable design artifact as the authoritative review target.
- Keep the output natural and concise; avoid forcing raw transcripts or bulky
  status-report shells into chat.
- Keep Claude Code and Codex role surfaces aligned.

## Non-goals

- Do not make Gate 1 approval depend on raw brainstorming transcripts.
- Do not require every intermediate thought or discarded idea to be shown.
- Do not weaken the existing artifact path, requirement set, or adversarial
  review evidence requirements.
- Do not change Planner, Executor, Reviewer, or Finisher ownership.
- Do not alter branch, model-selection, execution-mode, or shutdown behavior.

## Requirements

### AC-82-1

Given Brainstormer completes a design artifact, when Brainstormer reports done,
then the done report includes `brainstorming_output` with problem framing,
directions considered, recommended direction, notable tradeoffs, and open risks
or questions.

### AC-82-2

Given Team Lead presents Gate 1 for approval, when the approval request reaches
the operator, then it includes the `brainstorming_output` substance in addition
to the exact artifact path, concise intent summary, full requirement set, and
adversarial-review result.

### AC-82-3

Given `brainstorming_output` would be too large for a clean approval message,
when Team Lead prepares the approval request, then Team Lead splits or condenses
the brainstorming output into reviewable sections rather than replacing it with
a vague fallback summary.

### AC-82-4

Given Team Lead presents Gate 1 for approval, when required evidence is included
in the operator-facing message, then it is rendered as a concise conversational
handoff focused on the approval decision, not as a verbose field dump or fixed
status-report template.

### AC-82-5

Given a teammate or future maintainer reads the Superteam role contracts, when
they inspect both Claude Code and Codex Brainstormer surfaces, then both surfaces
name the `brainstorming_output` handoff obligation consistently.

### AC-82-6

Given the workflow-contract change is implemented, when verification runs, then
the Superteam contract check and Markdown lint pass.

## Proposed change

Update `skills/superteam/SKILL.md` in two places:

- Gate 1 approval evidence: add `brainstorming_output` as required approval
  evidence before asking the operator to approve the design.
- Brainstormer done-report contract: add a `brainstorming_output` field with a
  tight definition: problem framing, options or directions considered,
  recommendation, tradeoffs, and open risks or questions.
- Gate 1 rendering guidance: require Team Lead to render approval requests as
  natural, decision-focused conversation. Required evidence must be present, but
  implementation should avoid field labels, exhaustive checklist dumps, and
  verification noise unless those details affect the approval decision.

Update Brainstormer role surfaces in both supported hosts:

- `skills/superteam/.claude/agents/brainstormer.md`
- `skills/superteam/agents/brainstormer.openai.yaml`

The role surfaces should not restate every SKILL.md field, but they should add a
non-negotiable Brainstormer-specific rule that the default brainstorming output
must reach the done report and Gate 1 handoff through the SKILL.md-owned
`brainstorming_output` field.

If `scripts/verify-superteam-contract.sh` encodes the Brainstormer done-report
field list, update it so the contract check covers the new field. If the check
is pattern-based and already follows SKILL.md dynamically, no script change is
needed.

## Design notes

`brainstorming_output` should be concise, not exhaustive. It is the operator
facing decision trail, not a hidden chain-of-thought dump and not a replacement
for the design document. A good value is usually a short set of bullets covering:

- the problem framing Brainstormer used
- options or directions considered
- the recommended direction
- notable tradeoffs
- open risks or questions

This field belongs in the Brainstormer done report because Brainstormer owns the
design exploration. Team Lead owns rendering it in the Gate 1 approval request.
That split preserves role ownership: Brainstormer supplies the substance; Team
Lead ensures the operator sees it before approval.

The change should be phrased as evidence, not as a fixed chat template. The
existing operator-facing output rule still stands: handoffs should read
naturally and focus on the decision being requested.

A good Gate 1 handoff should usually read like a short note from Team Lead:
"I think this is ready to approve; here is the decision trail and the few
requirements that matter." It can mention the artifact path and review result,
but it should not make those mechanics the main event. Verification details
belong in the handoff only when they change the operator's decision.

## Adversarial review

### RED/GREEN baseline obligations

The RED case is the example in issue #82: Gate 1 can ask for approval while only
showing procedural status and a terse design coverage sentence. The GREEN case
requires a Gate 1 approval packet that includes the design decision trail in
chat before asking for approval.

### Rationalization resistance

The contract should close the loophole that "intent summary" is enough. Intent
summary states what the artifact changes; `brainstorming_output` states how the
design got there and what alternatives or risks matter.

### Red flags

- Gate 1 handoff includes a spec path but no options, tradeoffs, risks, or open
  questions.
- Gate 1 handoff includes the new field but buries it inside a noisy report
  shell that still makes the operator hunt for the decision.
- Brainstormer reports done without the new field.
- Team Lead treats `brainstorming_output` as optional because the design doc is
  linked.
- The implementation adds a verbose raw transcript requirement instead of a
  concise reviewable summary.

### Token-efficiency targets

The field should fit in a normal approval handoff. If it grows too large, Team
Lead should split or condense it into clean sections while preserving the useful
decision trail. The default output should prefer short prose over mechanical
field-by-field rendering.

### Role ownership

Brainstormer owns producing `brainstorming_output`. Team Lead owns verifying the
approval packet includes it. Planner must continue to consume the approved
design artifact, not ad hoc chat summaries.

### Stage-gate bypass paths

Gate 1 remains closed until the design artifact is committed, adversarial review
is clean or dispositioned, and the approval request includes the required
evidence. The new field does not allow Planner to start earlier; it makes the
approval request more useful before explicit approval.

## Verification

- Run `pnpm lint:md`.
- Run `pnpm verify:superteam`.
- Inspect `skills/superteam/SKILL.md` for the new Gate 1 evidence and
  conversational rendering guidance.
- Inspect both Brainstormer role surfaces for consistent handoff guidance.
