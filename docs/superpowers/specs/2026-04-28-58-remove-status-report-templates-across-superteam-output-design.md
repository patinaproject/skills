# Design: Remove status report templates across Superteam output [#58](https://github.com/patinaproject/superteam/issues/58)

## Intent

Replace Superteam's operator-facing status-report style with a clearer
contract: teammates must communicate the decision, blocker, handoff, or next
step the operator needs, but they should not be forced to emit a fixed report
template when natural prose would be better.

This is a workflow-contract change. It should preserve durable internal state,
done-report fields, acceptance criteria, review evidence, and Finisher shutdown
checks. The change is about presentation and prompt contracts, not about making
Superteam less rigorous.

## Problem Framing

Superteam currently carries many fixed output shapes: approval packets, done
reports, Finisher status, review findings, and role-specific spawn guidance all
encourage field-heavy prose. Those fields are useful as internal handoff data,
but they can leak into normal operator-facing output as robotic status reports.

The motivating example was a Gate 1 approval prompt that was ready for operator
approval, yet still highlighted `findings dispositioned` and replayed closed
review findings. That made resolved process state feel like active work. The
broader problem is the same across the workflow: rigid templates can turn every
handoff into a report even when the operator only needs a calm explanation of
what changed, what is blocked, or what decision is requested.

The fix should move Superteam from template-first output to invariant-first
output. Structured bullets, headings, and explicit fields remain available when
they help. They should stop being the default voice of the system.

## Requirements

- Preserve the canonical teammate workflow, artifact ownership, stage gates,
  loopback routing, and publish-state shutdown requirements.
- Keep machine-readable and teammate-to-teammate handoff fields where later
  workflow steps depend on them.
- Remove or soften guidance that tells teammates to render fixed
  operator-facing status report templates by default.
- Define output invariants for each major operator-facing moment instead of a
  universal field list.
- Require operator-facing responses to state the requested decision, feedback,
  approval, next action, or blocker when one exists.
- Surface only actionable findings or blockers in normal operator-facing
  output.
- Keep closed, resolved, or dispositioned findings available in artifacts,
  explicit handoff data, or done-report evidence without replaying them by
  default.
- Preserve explicit evidence requirements for Gate 1, Reviewer pressure tests,
  and Finisher shutdown; do not let natural prose hide missing evidence.
- Keep required evidence durable whenever future teammates, future sessions, PR
  reviewers, or audit/debugging workflows depend on it. Volatile agent context
  may supplement that evidence, but must not be its only home.
- Update delegated teammate prompts so subagents are encouraged to write like
  collaborators while still satisfying role-specific contracts.
- Add pressure tests that catch robotic status-template output and the opposite
  failure mode: vague prose that omits required decisions or blockers.

## Design

### Output Contract: Invariants Over Templates

Superteam should distinguish two surfaces:

1. durable workflow data used by teammates and future sessions
2. operator-facing prose shown in chat

Durable workflow data can remain structured. Design docs, plans, done reports,
review evidence, AC verification, loopback trailers, PR bodies, and shutdown
checks need stable shapes because later teammates rely on them.

Operator-facing prose should satisfy invariants rather than templates. A
response is acceptable when it makes the current state and required operator
action clear. It can use a short paragraph, bullets, or headings based on the
moment, but it should not render every available internal field as a report.

### Natural Operator-Facing Moments

The implementation should identify and update the normal places where
Superteam talks to the operator:

- Gate 1 approval and revision prompts
- Brainstormer, Planner, Executor, Reviewer, and Finisher handoffs
- local review loopback routing
- Finisher publish-state updates
- explicit blockers and halt messages
- delegated teammate prompt guidance that shapes later replies

Each moment should keep its invariant:

- approval prompts ask for a clear decision and identify the artifact under
  review
- handoffs state what is ready, what changed, and what happens next
- blocker reports name the blocker and the safest next action
- review routing reports actionable findings and loopback ownership
- Finisher updates distinguish ready, monitoring, triage, and blocked states
  without turning every update into a full status table

### Findings Presentation

Normal operator-facing output should not enumerate resolved findings by
default. This applies to Gate 1 review findings, local review findings, and
external PR feedback once they are no longer relevant to the current decision.

If findings require operator feedback, they must be visible and specific enough
to act on. If findings are closed or dispositioned, the response may summarize
the result briefly, such as "no approval-blocking findings remain." The detailed
history should stay in a durable surface when later teammates or reviewers may
need it: the design artifact, plan, review report, PR discussion, explicit
handoff data, or Finisher state. Volatile agent context can help during the
current run, but it is not enough for required evidence.

This should not remove required evidence. Gate 1 still needs adversarial review
status, reviewer context, checked dimensions, and clean-pass rationale before
planning can start. The change is that the operator-facing prose should not
replay closed findings merely because the internal evidence exists.

### Done Reports And Handoff Data

Role-specific done-report contracts should remain enforceable. They are
handoff data, not necessarily the exact chat prose.

The contract should say that a teammate may satisfy the done-report fields as
structured data for the Team Lead while the Team Lead renders the operator
handoff naturally. When a later teammate or future session needs a precise
field, the field must exist. When the operator only needs the current decision
or next step, the response should not dump the entire field list.

### Scope Of Repository Changes

The likely implementation surface is:

- `skills/superteam/SKILL.md`
- `skills/superteam/agent-spawn-template.md`
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

The implementation should avoid broad rewrites of the workflow. It should focus
on removing status-report-template pressure from operator-facing output while
protecting the contract requirements that make Superteam resumable and
auditable.

`skills/superteam/pr-body-template.md` should remain mostly out of scope unless
an instruction there directly forces chat output to become a status report. PR
bodies are durable review artifacts and benefit from stable structure.

### RED-Phase Baseline Obligation

Before implementation edits the workflow surfaces, capture inspection-based
baseline evidence that the current contract encourages fixed operator-facing
status templates.

The baseline should show at least:

1. Gate 1 approval instructions require a fixed approval packet with explicit
   fields that can force internal review state into chat output.
2. `agent-spawn-template.md` tells Team Lead and teammate roles to produce
   field-heavy approval or done-report output without distinguishing internal
   handoff data from operator-facing prose.
3. Existing pressure tests catch missing fields and skipped evidence, but do
   not catch robotic status-report output or natural prose that hides required
   actions.

The baseline cannot be inspection-only. Before changing the workflow contract,
the plan should include behavioral pressure scenarios that demonstrate current
failure. At minimum, capture RED behavior for:

1. a Gate 1 approval prompt that replays dispositioned findings into
   operator-facing output when no operator feedback is needed
2. a teammate handoff or Finisher update that is forced into report shape even
   though a concise natural handoff would satisfy the operator need
3. a counter-pressure case where natural prose sounds pleasant but omits an
   actionable blocker, requested decision, or required next step

GREEN verification should rerun those same scenario classes after the contract
edits and show that Superteam distinguishes required workflow data from natural
operator-facing rendering without hiding blockers.

### Loophole-Closure Language

The workflow must close these rationalizations:

| Excuse | Reality |
|--------|---------|
| "Natural prose means we can omit required Gate 1 evidence." | Natural prose changes rendering, not gate evidence. Required review status, reviewer context, checked dimensions, and clean-pass rationale still exist before planning. |
| "The operator might want audit history, so replay every closed finding." | Audit history stays available in artifacts or context. Normal operator-facing output should show actionable findings and current decisions. |
| "Removing templates means no bullets or headings." | Structure is allowed when it helps the operator act. The rule removes mandatory report shape, not useful formatting. |
| "Done-report contracts are templates, so we can delete them." | Done reports are durable handoff data. The change separates internal data contracts from chat rendering. |
| "A friendly paragraph is enough even if it hides a blocker." | Operator-facing prose must clearly state blockers, required decisions, and next steps. Vague warmth is still a contract failure. |
| "Finisher can avoid status details because status reports are discouraged." | Finisher still owns latest-head readiness, monitoring, blockers, and shutdown evidence; only unnecessary report boilerplate is discouraged. |
| "The evidence is in agent context, so it is traceable enough." | Required evidence must live in durable artifacts, explicit handoff data, PR state, or other inspectable surfaces when future teammates or reviewers depend on it. |

## Red Flags

- Operator-facing Superteam output repeats closed or dispositioned findings
  when no operator action is required.
- A prompt requires fields such as status, branch, findings, rationale, or
  verification to be rendered in chat even when the operator only needs a
  concise decision prompt.
- A teammate uses "natural prose" to omit the artifact, decision, blocker,
  active finding, or next action the operator needs.
- Implementation deletes durable done-report fields instead of separating them
  from chat rendering.
- Finisher presents an easygoing update while required checks, review threads,
  mergeability, or PR metadata are still pending or blocked.
- Pressure tests only verify that rigid fields exist and never test whether the
  output is unnecessarily report-like.

## Token-Efficiency Targets

- Prefer short invariant bullets over long reusable output templates.
- Keep role guidance focused on when to use natural prose and what must still
  be clear.
- Avoid adding a new universal response format to replace the old report
  format.
- Keep examples brief and contrast-oriented: robotic report shape versus
  acceptable natural handoff.

## Acceptance Criteria

### AC-58-1

**Given** any Superteam phase or handoff output can satisfy its workflow
invariants with natural prose,
**When** the teammate reports to the operator,
**Then** the contract does not require a fixed status-report template.

### AC-58-2

**Given** Superteam output needs operator action,
**When** the response is presented,
**Then** the requested decision, feedback, approval, next step, or blocker is
clear without relying on boilerplate status fields.

### AC-58-3

**Given** active blockers or findings require operator feedback,
**When** Superteam reports them,
**Then** the actionable items are surfaced with enough context for the operator
to respond.

### AC-58-4

**Given** findings are resolved, closed, or otherwise dispositioned,
**When** they do not affect the current operator decision,
**Then** normal operator-facing output does not enumerate them by default.

### AC-58-5

**Given** Superteam needs traceability for audit, future teammates, or
debugging,
**When** structured workflow state exists internally,
**Then** required evidence remains available in durable artifacts, done-report
data, explicit handoff state, PR surfaces, or other inspectable records without
forcing chat output into a status report.

### AC-58-6

**Given** the implementation changes `skills/**/*.md` or workflow-contract
guidance,
**When** verification runs,
**Then** it includes pressure tests for robotic status-template output,
actionable findings still being shown, resolved findings being quiet by
default, durable evidence remaining available, and natural prose not hiding
blockers.

## Verification Strategy

- Inspect `skills/superteam/SKILL.md` for output-invariant language and the
  preserved stage-gate evidence requirements.
- Inspect `skills/superteam/agent-spawn-template.md` for delegated prompt
  guidance that separates internal done-report contracts from natural
  operator-facing prose.
- Add pressure tests to
  `docs/superpowers/pressure-tests/superteam-orchestration-contract.md` for:
  robotic status report output when no operator feedback is needed; natural
  prose hiding required decisions; resolved findings replayed by default;
  durable evidence removed under the banner of natural output; and Finisher
  status updates hiding latest-head blockers.
- Capture RED behavior with realistic pressure scenarios before editing the
  workflow surfaces, then rerun matching GREEN scenarios after edits.
- Run `rg` checks for status-report-template terms and new invariant language.
- Run `pnpm lint:md`.

## Adversarial Review

Reviewer context: fresh subagent.

Dimensions checked: requirement completeness, AC clarity, RED/GREEN baseline
obligations, rationalization resistance, red flags, token-efficiency targets,
role ownership, stage-gate bypass paths, plan readiness, and the risk that
natural prose could either lose evidence or hide actionable blockers.

Findings:

- `source: adversarial-review`, material finding: the first draft allowed an
  inspection-only RED/GREEN baseline. Disposition: fixed in design by requiring
  behavioral pressure-test baselines for Gate 1 replaying closed findings,
  report-shaped handoffs, and natural prose hiding blockers, plus matching
  GREEN reruns.
- `source: adversarial-review`, material finding: the first draft allowed
  required traceability to live in ephemeral agent context. Disposition: fixed
  in design by tightening the requirements, findings presentation, AC-58-5, and
  rationalization table so required evidence remains in durable or explicit
  handoff surfaces when future teammates or reviewers depend on it.

Rerun note: these findings changed baseline obligations and traceability
requirements. The affected review dimensions must be rerun against the revised
committed artifact before Gate 1 approval.

## Out Of Scope

- Changing the canonical teammate roster.
- Removing done-report contracts, AC verification, loopback trailers, or
  Finisher shutdown evidence.
- Redesigning the PR body template as conversational prose.
- Replacing Superteam's phase-detection or routing model.
- Requiring a specific friendly voice or adding a new mandatory prose template.
