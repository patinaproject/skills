# Design: Superteam Finisher Requires Addressed Review Threads to Be Resolved [#79](https://github.com/patinaproject/skills/issues/79)

## Intent

Close the remaining finish-phase loophole where `Finisher` can treat a GitHub
review thread as handled because the code changed, while the thread is still
unresolved in GitHub. A Superteam PR should not be called finish-ready until
review threads that were addressed by the latest head have also been resolved,
or until `Finisher` reports a concrete blocker explaining why it could not
resolve them.

## Problem

Issue #64 added the broad latest-head PR completion gate: `Finisher` must
inventory PR feedback, classify actionable items, and avoid completion language
until feedback and checks are clean. Issue #79 reports a narrower failure mode
inside that gate. The workflow can address inline review feedback in code, see
green CI, and report ready while GitHub still shows manually unresolved review
threads.

That is misleading because the code state and the GitHub review-thread state no
longer agree. The operator still has external feedback to close, but Superteam
has already used completion language.

## Brainstorming Output

- Problem framing: issue #64 made feedback inventory a blocker, but did not
  force the GitHub review-thread lifecycle to end when feedback is addressed.
- Direction considered: treat addressed-but-unresolved review threads as
  `open_actionable`. Rejected because it blurs code remediation with platform
  closure and makes "addressed" mean too many things.
- Direction considered: make `Finisher` resolve every unresolved thread
  unconditionally. Rejected because stale, requirement-bearing, or ambiguous
  threads still need classification and may need routing or a blocker.
- Recommended direction: add a separate thread-closure obligation to the
  latest-head completion gate. Addressed review threads require a resolve
  attempt where the host supports it; unresolved or unresolvable addressed
  threads block completion with surfaced evidence.
- Notable tradeoff: this is stricter than "code is fixed and CI is green", but
  it matches the operator-facing promise that finish-ready means no outstanding
  PR feedback chores remain.
- Open risk: GitHub APIs and host connectors differ in thread-resolution
  support, so the design must allow a clear blocker when resolution is not
  available instead of pretending the thread was closed.

## Requirements

### R1: Review-thread closure is a completion requirement

`Finisher` must treat unresolved GitHub review threads as latest-head finish
signals, even when their requested code or documentation changes have already
been made. Completion requires each unresolved review thread to be one of:

- resolved in GitHub after verifying the latest head addresses it;
- classified `non_blocking` with evidence that it is stale, duplicate,
  informational, optional, or not applicable to the latest head;
- routed as requirement-bearing feedback through `Brainstormer`, then
  `Planner`, then `Executor`, with `Finisher` resuming a fresh latest-head sweep
  after the route returns;
- reported as a blocker because `Finisher` cannot verify or resolve it.

### R2: Addressed is not the same as resolved

The latest-head PR completion gate must distinguish code remediation from
platform thread closure. A thread may be `addressed` only as remediation
evidence; it is not finish-complete until the corresponding GitHub thread is
resolved, explicitly classified non-blocking, routed, or blocked with a clear
reason.

### R3: Resolve addressed threads where the host supports it

When `Finisher` verifies that the latest head addresses an unresolved review
thread and the active GitHub surface supports thread resolution, `Finisher` must
resolve the thread through GitHub before reporting finish-ready. If the host
does not expose thread resolution, or resolution fails, `Finisher` must report a
blocker that names the unresolved thread and the missing or failed capability.

### R4: Latest-head verification before resolution

Before resolving a thread, `Finisher` must verify that the current branch head
matches the PR latest head and that the latest head contains the fix or
disposition for that thread. Comments tied to older code must not be resolved as
addressed unless the latest head evidence still supports the disposition.

### R5: Durable finish report includes unresolved thread closure state

The `Finisher` completion/status report and any durable wakeup payload must
surface review-thread closure state separately enough for an operator to know
whether unresolved threads remain. At minimum, finish reports should include a
count of unresolved review threads that still block completion or appear in
`pending_signals[]`.

### R6: Preserve issue #64 ownership and routing

This issue strengthens the existing latest-head PR completion gate. It must not
move external feedback ownership away from `Finisher`, let `Finisher` absorb
requirement-bearing feedback directly, or weaken the existing checks/statuses
gate from issue #64.

## Acceptance Criteria

### AC-79-1

Given a Superteam-managed PR has an unresolved review thread that has been
addressed by code, docs, tests, or workflow-contract changes on the latest head,
when `Finisher` runs the shutdown path, then Superteam resolves that GitHub
review thread where supported before reporting finish-ready.

### AC-79-2

Given a Superteam-managed PR has an addressed review thread that remains
unresolved because the active GitHub surface cannot resolve it or the resolve
operation fails, when `Finisher` runs the shutdown path, then Superteam reports
`blocked` or `monitoring` with the unresolved thread named in `pending_signals[]`
and does not use completion language.

### AC-79-3

Given a review thread is stale, duplicate, informational, optional, or not
applicable to the latest head, when `Finisher` classifies it as non-blocking,
then the classification includes evidence and does not rely on green CI,
elapsed time, or local intent as proof.

### AC-79-4

Given a review thread changes requirements, acceptance criteria, or what is
being built, when `Finisher` classifies it, then the feedback routes through
`Brainstormer`, then `Planner`, then `Executor`, and `Finisher` resumes only
after a fresh latest-head feedback, thread-closure, and checks/status sweep.

### AC-79-5

Given all actionable PR feedback is addressed, all required checks are passing,
and only resolved or evidence-classified non-blocking review threads remain,
when `Finisher` runs the completion gate, then Superteam may report finish-ready
with the latest head SHA and concise final counts for feedback, review-thread
closure, and checks/status inventories.

## Proposed Contract Changes

- Update `skills/superteam/SKILL.md` so the latest-head feedback inventory
  explicitly separates review-thread closure from remediation and blocks
  completion on addressed-but-unresolved threads.
- Update the `Finisher` completion/status report fields or field descriptions
  so unresolved review-thread closure state is visible in completion and wakeup
  handoffs.
- Update both host-specific Finisher role files:
  `skills/superteam/agents/finisher.openai.yaml` and
  `skills/superteam/.claude/agents/finisher.md`.
- Update `skills/superteam/pre-flight.md` if finish substate vocabulary needs a
  durable unresolved-thread signal for resume detection.
- Update `skills/superteam/routing-table.md` only if the finish-phase routing
  text needs to name review-thread closure explicitly.

## Non-Goals

- Do not auto-resolve unresolved review threads whose latest-head disposition is
  unclear.
- Do not resolve requirement-bearing feedback instead of routing it spec-first.
- Do not weaken the latest-head checks/statuses gate from issue #64.
- Do not add hidden state, commit trailers, branch labels, or sidecar files to
  remember thread closure.
- Do not require `Finisher` to merge the PR.

## Pressure Tests

1. RED: A PR has an inline review thread, Executor changes the code, checks
   pass, and the thread remains unresolved in GitHub. Old behavior can report
   ready because remediation and CI are clean. GREEN: `Finisher` resolves the
   addressed thread or reports blocked/monitoring if resolution is unavailable.
2. RED: A PR has an addressed thread, but the GitHub connector cannot resolve
   review threads. A naive implementation reports ready because the code fix is
   present. GREEN: the unresolved thread appears in `pending_signals[]` and
   completion language is withheld.
3. RED: A stale thread points at code removed by the latest head. A broad
   implementation tries to resolve it as "addressed" without evidence. GREEN:
   `Finisher` records a non-blocking stale/not-applicable classification with
   latest-head evidence before completion.
4. RED: A review thread asks for a new acceptance criterion. A shallow fix
   resolves it as addressed after a quick code change. GREEN: requirement-
   bearing feedback routes through `Brainstormer`, `Planner`, and `Executor`
   before `Finisher` performs a fresh latest-head sweep.
5. RED: A new push lands after `Finisher` inventories and resolves threads. Old
   evidence is reused. GREEN: the latest-head gate refreshes feedback,
   review-thread closure, and checks/status inventories before any completion
   handoff.

## Workflow-Contract Considerations

This changes `skills/superteam/**` workflow-contract surfaces, so
`writing-skills` dimensions apply.

- RED/GREEN baseline obligations: the pressure tests name the unsafe baseline
  and the expected corrected behavior.
- Rationalization resistance: the design blocks "fixed in code", "CI is
  green", and "thread resolution is not exposed" as completion shortcuts.
- Red flags: completion language while addressed review threads remain
  unresolved; resolving stale or requirement-bearing threads without evidence or
  routing; host parity drift between Codex and Claude Code Finisher prompts.
- Token efficiency: keep detailed thread-closure rules in `SKILL.md` and the
  Finisher role files; keep routing/pre-flight edits to concise vocabulary.
- Role ownership: `Finisher` owns external PR feedback intake, thread
  resolution, and completion gating; requirement-bearing feedback still routes
  through `Brainstormer`, `Planner`, and `Executor`.
- Stage-gate bypass paths: thread resolution cannot bypass Gate 1, the approved
  plan, local review, or the latest-head checks/statuses gate.

## Verification

- Run `rg -n "review thread|thread closure|pending_signals|completion gate|resolve" skills/superteam`.
- Run `bash scripts/verify-superteam-contract.sh`.
- Run `pnpm lint:md`.
