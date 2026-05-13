# Design: Superteam should finish only after PR comments are addressed and checks pass [#64](https://github.com/patinaproject/skills/issues/64)

## Summary

Tighten the `superteam` finish contract so `Finisher` cannot report the workflow
complete from a PR creation event, a stale status snapshot, or green CI alone.
Before any completion-style handoff, `Finisher` must run a latest-head PR
completion gate that proves all actionable PR feedback has been handled and all
reported checks/statuses for the latest pushed head are passing, skipped,
neutral, or explicitly classified non-blocking with evidence.

The change is intentionally conservative. It strengthens the existing
head-relative shutdown rules, external feedback ownership, and finish routing
without changing the design, plan, execute, or local review gates.

## Skill guidance

The Brainstormer contract recommends `superpowers:brainstorming`, and this
workflow-contract design also requires the `superpowers:writing-skills`
dimensions before authoring requirements.

At the start of authoring, neither helper was exposed as an active skill in this
Codex runtime. A later `pnpm install` restored vendored local copies under
`.agents/skills/brainstorming/` and `.agents/skills/writing-skills/`; those
files were read before finalizing this artifact. Because they still were not
active runtime skills for this teammate delegation, the artifact applies the
required dimensions manually:

- RED/GREEN baseline obligations
- rationalization resistance
- red flags
- token-efficiency targets
- role ownership
- stage-gate bypass paths

## Problem

Issue #64 reports that Superteam can declare work complete while a PR still has
unresolved review comments, failing checks, or pending checks. That creates
follow-up work for the operator after the workflow has already claimed success.

The existing `Finisher` contract already says shutdown is success-only and
head-relative, but it does not define a complete latest-head sweep for PR
comments, review threads, review states, and required checks. The missing
contract leaves room for unsafe interpretations such as "the PR was opened",
"one status snapshot was green", or "the last push completed" as completion.

## Goals

- Require a latest-head PR completion gate before `Finisher` can report complete.
- Treat unresolved actionable PR review threads, review comments, top-level PR
  comments, and bot findings as blockers until handled or conclusively
  non-blocking.
- Require every reported check/status for the latest pushed head to be passing,
  skipped, neutral, or evidence-classified non-blocking before completion.
- Preserve existing feedback routing: requirement-bearing feedback routes to
  `Brainstormer`, implementation feedback routes through `Executor`, and
  `Finisher` owns external feedback intake and publish-state follow-through.
- Keep the implementation surface scoped to `skills/superteam/**` workflow
  contracts and role prompts.

## Non-Goals

- Auto-merge PRs.
- Change GitHub branch protection or repository settings.
- Block purely informational signals or evidence-classified non-blocking checks
  after their non-blocking evidence has been recorded and surfaced.
- Add hidden workflow state, sidecar files, branch labels, or commit trailers.
- Redesign Gate 1, local pre-publish review, model selection, or execution-mode
  selection.

## Requirements

### R1: Latest-head completion gate

`Finisher` must run a PR completion gate after PR creation, after every push, on
finish-phase resume, after CI status changes, and immediately before any
completion-style handoff. The gate is bound to the latest pushed head SHA. If the
head changes during remediation or monitoring, all feedback and check signals
must be refreshed against the new head before completion.

### R2: PR feedback inventory

The completion gate must build a latest-head PR feedback inventory covering:

- unresolved review threads
- review comments
- pull request conversation comments
- review states such as requested changes
- bot comments or annotations that represent actionable review feedback

Each inventory item is classified as `addressed`, `routed`, `open_actionable`,
or `non_blocking`. Completion requires zero `open_actionable` items and zero
`routed` items awaiting a teammate return.

### R3: Comment handling standard

A PR comment is handled when the workflow has either:

- changed code, tests, docs, or workflow contracts to address it and verified the
  current head includes the fix
- replied or resolved the thread with a concrete explanation accepted by the
  classification
- routed requirement-bearing feedback through `Brainstormer`, then `Planner`,
  then `Executor`, and returned to `Finisher` for a fresh latest-head sweep
- classified it as `non_blocking` with evidence that it is stale, duplicate,
  informational, optional, or otherwise not applicable to the latest head

Silence, elapsed time, local intent, or "CI is green" is not enough to classify a
comment as handled.

### R4: Checks and statuses gate

The completion gate must inspect every reported check run, status context, and
required-check signal for the latest pushed head. Completion is allowed only
when each reported check/status is passing, skipped, neutral, or explicitly
classified `non_blocking` with evidence. Pending, queued, missing, failing,
cancelled, timed-out, stale, or unknown required checks always block completion.
Optional non-passing checks/statuses also block completion unless `Finisher`
records and surfaces evidence that they are non-blocking for the latest head.

If the runtime cannot determine required-check state or cannot enumerate latest
head check/status signals, `Finisher` must not report complete. It reports the
ambiguity as blocked or monitoring and includes the missing signal in the
wakeup/status payload.

### R5: Completion language

`Finisher` may use completion language only after the latest-head completion
gate passes. Otherwise the operator-facing response must use a non-complete
state such as `monitoring` or `blocked`, with concise counts for unresolved
actionable feedback and non-passing or unknown check/status signals.

### R6: Durable wakeup payload

Any durable wakeup or paused follow-through payload must include the branch, PR
URL or number, latest pushed SHA, current publish-state, unresolved actionable
feedback count, routed-feedback count, required-check state, check/status
inventory state, pending signals, and an instruction to resume the latest-head
PR completion gate.

### R7: Role ownership

`Finisher` owns PR feedback intake, check monitoring, PR replies, thread
resolution where the host supports it, and the final completion gate.
`Brainstormer`, `Planner`, and `Executor` own remediation after routing.
`Finisher` must not directly absorb requirement-bearing feedback or bypass the
approved design and plan path.

### R8: Scoped contract surfaces

The implementation should update only the `superteam` workflow-contract
surfaces needed to make the gate binding:

- `skills/superteam/SKILL.md` for cross-role invariants, external feedback
  ownership, rationalization table entries, red flags, and done/shutdown
  contract language
- `skills/superteam/agents/finisher.openai.yaml` for Finisher-owned
  non-negotiable rules in Codex-host delegation
- `skills/superteam/.claude/agents/finisher.md` for Finisher-owned
  non-negotiable rules in Claude Code delegation
- `skills/superteam/pre-flight.md` for finish substate signal collection and
  latest-head PR state vocabulary
- `skills/superteam/routing-table.md` for finish-phase routing through the
  latest-head sweep

`skills/superteam/project-deltas.md` should change only if implementation finds
that append-only delta linting needs a new literal-denylist token to prevent
project deltas from weakening this completion gate.

## Acceptance Criteria

### AC-64-1

Given a Superteam-managed PR has any unresolved actionable review thread, review
comment, PR conversation comment, requested-changes review, or bot finding tied
to the latest pushed head, when `Finisher` runs the shutdown path, then
Superteam does not report complete and instead routes or reports the open item.

### AC-64-2

Given a PR feedback item is stale, duplicate, informational, optional, or not
applicable to the latest pushed head, when `Finisher` classifies it as
non-blocking, then the classification includes evidence and the final completion
gate does not rely on silence or green CI as proof that the comment was handled.

### AC-64-3

Given PR feedback changes requirements, acceptance criteria, or what is being
built, when `Finisher` classifies the feedback, then it routes spec-first through
`Brainstormer`, then `Planner`, then `Executor`, and only resumes completion
after a fresh latest-head PR feedback and checks sweep.

### AC-64-4

Given any latest-head PR check/status is pending, queued, missing, failing,
cancelled, timed out, stale, unknown, or otherwise not known to be passing,
skipped, or neutral, when `Finisher` evaluates completion, then Superteam
remains in monitoring or blocked state and does not report complete unless the
non-passing optional signal is explicitly classified non-blocking with surfaced
evidence.

### AC-64-5

Given all actionable PR feedback has been addressed or classified as
non-blocking and every latest-head check/status is passing, skipped, neutral, or
evidence-classified non-blocking, when `Finisher` runs the completion gate, then
Superteam may report complete with the latest head SHA and concise final counts.

### AC-64-6

Given a finish-phase Superteam run is paused or waiting on CI/review feedback,
when it emits a wakeup or status payload, then the payload includes the branch,
PR URL or number, latest pushed SHA, current publish-state, unresolved
actionable feedback count, routed-feedback count, required-check state, pending
signals, check/status inventory state, and instruction to resume the latest-head
PR completion gate.

## Design

Add a named `Latest-head PR completion gate` to the `superteam` contract. The
gate is a Finisher-owned shutdown prerequisite, not a new phase. It runs inside
the existing finish phase and preserves the current rule that PR feedback is
intake-classified by `Finisher` before being routed to the teammate that owns
the fix.

The gate has two halves.

First, `Finisher` builds a feedback inventory from the PR's latest observable
state. The implementation can use `gh`, GraphQL review-thread queries, REST
check APIs, or connector equivalents, but the workflow contract should stay
tool-agnostic: the required outcome is an inventory, not a specific API. The
inventory is head-relative. For review threads and comments tied to an older
diff, `Finisher` must verify whether the same issue still exists on the latest
head before classifying the item. Stale comments may be non-blocking, but only
with an explicit evidence note such as "the referenced line no longer exists and
the replacement code does X" or "superseded by commit <sha> and verified by
test <name>."

Second, `Finisher` evaluates every reported check/status for the latest pushed
head, including required checks, check runs, commit status contexts, mergeability
signals, and optional checks visible in the PR UI. Required means required by
branch protection, mergeability, or the platform's required status/check context
model. Non-passing optional checks may be classified as non-blocking only with
evidence, such as "experimental nightly job not required by branch protection
and unrelated to the changed paths." A PR UI with unexplained red, pending,
missing, cancelled, stale, or unknown signals is not complete. When check/status
discovery is unavailable, the safe result is `blocked` or `monitoring`, not
completion.

The gate output should be compact. The operator needs the current state and next
action, not a transcript of every comment. A normal non-complete status can say:
"blocked: 2 actionable PR comments unresolved, 1 required check failing, 1
optional check non-passing without non-blocking evidence on <sha>." The durable
state belongs in the PR, commits, and any wakeup payload.

## Finish substate behavior

The finish phase keeps the existing substates but makes their meaning sharper:

- `triage`: PR exists and feedback/check state has not yet been fully classified
  for the latest head.
- `monitoring`: no teammate action is currently needed, but checks/statuses or
  external signals are still pending for the latest head.
- `blocked`: actionable feedback, required-check failures, unexplained
  non-passing optional checks/statuses, ambiguous check/status state, or routed
  feedback prevents completion.
- `ready`: the latest-head PR completion gate has passed and the PR is ready for
  the final operator-facing handoff or merge policy.
- `merged`: the PR has merged after the latest-head gate passed or after an
  equivalent platform merge gate proved the same conditions.

`ready` is therefore not a synonym for "PR opened" or "all local work done." It
means the latest-head gate has passed.

## Pressure tests

1. A reviewer leaves an unresolved inline comment after the last push. The gate
   classifies it as `open_actionable`; `Finisher` cannot report complete.
2. A reviewer comment refers to code removed by a later commit. `Finisher`
   verifies the current head, records the stale evidence, and may classify it as
   `non_blocking`.
3. A check is optional and failing. `Finisher` blocks completion unless it
   records and surfaces evidence that the signal is non-blocking for the latest
   head.
4. A required check is pending. `Finisher` enters `monitoring` and emits a wakeup
   payload with the latest head SHA and pending check.
5. A PR comment changes acceptance intent. `Finisher` routes the requirement
   delta to `Brainstormer`; completion cannot resume until the spec-plan-execute
   path returns and a fresh latest-head sweep passes.
6. A new push lands after comments were addressed. Prior green state is invalid;
   `Finisher` refreshes comments and checks against the new head before
   completion.
7. RED: the old Finisher sees a PR with unresolved latest-head review feedback,
   one pending required check, and one unexplained failing optional check, then
   reports complete because the PR exists and some checks are green. GREEN: the
   revised Finisher returns `blocked` for the unresolved feedback and unexplained
   failing optional check, or `monitoring` for pending required checks when no
   teammate action is available yet; it does not report complete.

## Workflow-contract considerations

### RED/GREEN baseline obligations

The RED baseline is the issue reproduction plus the explicit pressure scenario
above: Superteam reports complete while latest-head PR comments remain
unresolved or checks/statuses are pending, failing, unknown, stale, or otherwise
non-passing without evidence-backed non-blocking classification. The GREEN
behavior is a finish contract that returns `blocked` or `monitoring` in those
states and allows completion only after the latest-head gate passes.

### Rationalization resistance

The contract must reject these shortcuts:

- PR creation is not completion.
- One green status snapshot is not completion.
- Green CI alone is not proof that PR feedback was handled.
- A local plan to address a comment is not the same as an addressed comment.
- An old head SHA cannot prove the current head is ready.
- Unknown check/status state is not success.
- An unexplained optional failing check is not success.
- Updating only one host's Finisher prompt is not host parity.

### Red flags

- `Finisher` says complete while unresolved actionable feedback count is nonzero.
- `Finisher` says complete while any check/status is pending, failing, unknown,
  stale, or non-passing without surfaced non-blocking evidence.
- `Finisher` classifies comments as handled without evidence.
- Requirement-bearing PR feedback is fixed directly in finish without returning
  through `Brainstormer` and `Planner`.
- Wakeup payloads omit the latest pushed SHA or pending feedback/check signals.
- Codex and Claude Code Finisher role surfaces diverge on the completion gate.

### Token-efficiency targets

Finisher output should use counts, state names, latest head SHA, and next action.
It should not paste every PR comment into chat unless the operator needs that
detail to unblock the workflow.

### Role ownership

The design keeps ownership boundaries stable. `Finisher` owns PR state intake,
check monitoring, and shutdown. `Brainstormer`, `Planner`, and `Executor` own
requirement, plan, and implementation remediation after routing.

### Stage-gate bypass paths

The gate closes the finish-stage bypass where external feedback or CI can be
ignored after PR publication. It does not create a shortcut around Gate 1,
planning approval, ATDD implementation, local review, or spec-first routing.
Requiring both Codex and Claude Code Finisher role surfaces closes the host
parity bypass where one runtime would keep the older shutdown checklist.

## Verification

- Run `pnpm lint:md`.
- Run `pnpm verify:dogfood`.
- Run `pnpm verify:marketplace`.
- Inspect the changed `skills/superteam/**` files to confirm the latest-head PR
  completion gate is documented in cross-role contract language and both Codex
  and Claude Code Finisher role language.
- Exercise or script fixture scenarios for unresolved review comments, stale
  comments, pending required checks, failing required checks, optional
  non-passing checks with and without non-blocking evidence, and all-clear
  latest-head completion.

## Adversarial review

Reviewer context: original same-thread fallback plus fresh external adversarial
review for the Gate 1 delta. The fresh review produced Findings 5-7 below; this
revision dispositions them in the artifact.

### Finding 1

- Source: adversarial-review
- Severity: material
- Location: PR feedback inventory
- Finding: "Every PR comment" can be interpreted too broadly and make completion
  depend on responding to greetings, duplicate discussions, or already-stale
  context.
- Disposition: Addressed by R2 and R3. The gate inventories comments but blocks
  only on `open_actionable` or still-routed items. Non-actionable, duplicate,
  stale, optional, and informational comments can be classified as
  `non_blocking` with evidence.

### Finding 2

- Source: adversarial-review
- Severity: material
- Location: Required checks gate
- Finding: "Checks pass" can be interpreted as all checks, including optional
  experiments, or as any one green check.
- Disposition: Addressed by R4. The gate distinguishes required checks from
  optional reported signals while inventorying all latest-head checks/statuses.
  Optional non-passing checks may be conclusively non-blocking only with
  surfaced evidence. Unknown required-check state or unenumerable reported
  signals block completion.

### Finding 3

- Source: adversarial-review
- Severity: material
- Location: Latest-head completion gate
- Finding: The workflow could address comments, push again, and then rely on the
  earlier review/check snapshot.
- Disposition: Addressed by R1 and the pressure tests. Every push invalidates
  prior completion evidence and requires a fresh latest-head sweep.

### Finding 4

- Source: adversarial-review
- Severity: material
- Location: Role ownership
- Finding: Finisher might directly absorb requirement-bearing PR feedback to
  make the PR green faster, bypassing Brainstormer and Planner.
- Disposition: Addressed by R7, AC-64-3, and the stage-gate bypass section.
  Requirement-bearing feedback remains spec-first.

### Finding 5

- Source: adversarial-review
- Severity: material
- Location: R8 scoped contract surfaces
- Finding: R8 scoped Finisher prompt changes to
  `skills/superteam/agents/finisher.openai.yaml`, but Superteam also ships
  `skills/superteam/.claude/agents/finisher.md`, and `SKILL.md` names the
  Claude role surface as the shutdown checklist reference.
- Disposition: Addressed by R8, the red flags, stage-gate bypass notes, and
  verification. The implementation scope now requires both Codex and Claude Code
  Finisher role surfaces so the completion gate cannot be bypassed by host
  selection.

### Finding 6

- Source: adversarial-review
- Severity: material
- Location: R4 checks gate
- Finding: The design narrowed "PR checks fully passing" to required checks and
  allowed optional failing checks to be non-blocking, which could leave a
  failing PR UI after Superteam claims completion.
- Disposition: Addressed by R4, AC-64-4, AC-64-5, the design section, pressure
  tests, and clean-pass rationale. The gate now inventories every reported
  latest-head check/status. Required failing or unknown signals always block;
  optional non-passing signals also block unless `Finisher` records and surfaces
  evidence that they are non-blocking for the latest head.

### Finding 7

- Source: adversarial-review
- Severity: minor
- Location: Pressure tests and RED/GREEN baseline
- Finding: The artifact lacked an explicit RED pressure scenario and GREEN
  expectation for the old Finisher reporting complete with unresolved
  latest-head feedback or pending/failing/non-passing checks.
- Disposition: Addressed by pressure test 7 and the RED/GREEN baseline section.
  The expected GREEN behavior is `blocked` or `monitoring`, not completion.

## Clean pass rationale

After dispositioning the same-thread and fresh external findings above, no
approval-blocking design issue remains in this Brainstormer revision. The manual
`writing-skills` dimensions were checked as follows:

- RED/GREEN baseline: the failing behavior and passing gate are both
  falsifiable, including the explicit old-Finisher RED and new-Finisher GREEN
  pressure scenario.
- Rationalization resistance: the design names and rejects the likely shortcuts.
- Red flags: finish-stage false-completion signals are explicit.
- Token efficiency: the operator surface uses counts and state names instead of
  dumping PR transcripts.
- Role ownership: Finisher intakes and gates; other teammates remediate by
  existing ownership; both host-specific Finisher role surfaces must carry the
  same gate.
- Stage-gate bypass paths: requirement feedback still routes spec-first, and the
  finish gate cannot bypass earlier workflow gates; host selection and optional
  check/status failures no longer provide bypass paths.
