# Design: Brainstormer commits write `Loopback:` in body prose, not as a real git trailer [#57](https://github.com/patinaproject/superteam/issues/57)

## Intent

Remove the durable `Loopback:` trailer mechanic instead of hardening it. The
reported bug is a symptom of too much hidden workflow state: agents must remember
loopback classes, trailer placement, parser behavior, branch-only recovery, and
resolution precedence before they can continue ordinary feedback routing.

The faster fix is to delete that state machine and keep the useful part:
Reviewer and Finisher classify feedback, then Team Lead routes the next action
to Brainstormer, Planner, or Executor immediately.

This is a workflow-contract and skill-surface change, so implementation must use
`superpowers:writing-skills`: capture the current RED behavior, verify the
simpler GREEN behavior through pressure-test walkthroughs, and avoid replacing
one hidden state machine with another.

## Problem

`Loopback:` trailers were added to make reroute state durable across sessions.
In practice they create a slow and brittle contract:

- teammates must add special commit trailers during reroutes
- `Team Lead` must recover state from branch-only commits
- routing precedence must override normal phase detection when a trailer exists
- resolution commits need special `Loopback: resolved` semantics
- malformed footer placement can silently erase the intended workflow state

The issue's concrete failure is that a teammate can write:

```text
fix: #57 update design

Body paragraph.

Loopback: spec-level

Co-Authored-By: teammate <noreply@example.com>
```

Git parses only the final contiguous `Key: value` paragraph as trailers, so the
`Loopback:` line is body prose. Hardening this would require more rules, more
checks, and more recovery logic around a mechanic that already hurts agent
speed.

## Decision

Delete durable loopback trailers and replace them with visible, immediate
rerouting.

1. Remove `Loopback:` commit-trailer requirements from teammate contracts,
   routing guidance, rationalization rows, red flags, and spawn prompts.
2. Remove `loopback-trailers.md` as an active workflow contract, or replace it
   with a short migration note if references need a transition commit.
3. Remove `active_loopback_class` recovery from pre-flight and routing.
4. Keep feedback classification as ordinary routing:
   - spec or requirement feedback routes to Brainstormer
   - plan or workstream feedback routes to Planner
   - implementation feedback routes to Executor
5. Across sessions, resume from visible durable state only:
   - committed design and plan artifacts
   - branch/PR state
   - unresolved PR review threads or comments
   - explicit operator prompts
6. If a run is interrupted after feedback is classified but before remediation
   is committed, the next run should inspect visible artifacts and PR feedback
   rather than infer hidden state from commit footers.
7. Local pre-publish Reviewer findings are same-run state unless captured in a
   visible artifact, plan update, commit, or PR comment. If a later run resumes
   after implementation but before PR publication and cannot verify that local
   review findings were resolved from visible state, it must rerun the relevant
   Reviewer pass before Finisher can publish.

The workflow should not add a replacement marker, sidecar file, branch label, or
new commit footer. The goal is less state, not different state.

## Simplification Scan

The highest-value speed improvements found in the current skill are:

1. **Remove loopback trailers first.** They touch `SKILL.md`,
   `routing-table.md`, `pre-flight.md`, `loopback-trailers.md`,
   `agent-spawn-template.md`, and pressure tests. Removing them deletes a broad
   state-recovery path while preserving the core feedback routing behavior.
2. **Collapse execution-mode probing later.** The current team-mode vs
   subagent-driven vs inline rules are verbose and easy to misapply. A follow-up
   should make the default simply "use the host's normal delegation tool when
   available; otherwise execute directly when explicitly requested."
3. **Shorten Finisher monitoring rules later.** The shutdown contract repeats
   latest-head and unresolved-feedback checks in several places. A follow-up can
   consolidate it into one checklist while keeping the important safety gates.
4. **Trim approval-packet ceremony later.** Gate 1 needs artifact path,
   requirements, findings, and explicit approval, but the current repeated
   clean-pass and delta-only wording could become one compact rule plus one
   pressure test.
5. **Keep pressure tests, but prune obsolete scenarios.** Removing loopback
   trailers should also remove trailer-specific pressure tests rather than
   converting them into more workaround coverage.

This issue should implement item 1 only. The other items are follow-up
opportunities so #57 stays focused and reviewable.

## Surfaces

### `skills/superteam/SKILL.md`

Remove or rewrite:

- `Loopback trailers`
- `Loopback:` rationalization rows and red flags
- requirements for intermediate loopback commits to carry trailers
- requirements for resolving commits to carry `Loopback: resolved`
- statements that active loopback class has routing precedence over normal
  phase routing

Keep:

- Reviewer classifies local findings as spec-level, plan-level, or
  implementation-level
- Finisher classifies external feedback
- requirement-bearing feedback routes Brainstormer -> Planner -> Executor
- implementation-only feedback can route straight to Executor

The language should describe these as feedback classifications, not durable
loopback states.

### `skills/superteam/routing-table.md`

Remove the `active_loopback_class` table and all trailer-based precedence.
Normal phase routing should decide from:

- detected phase
- prompt classification
- visible PR/review state
- explicit operator instruction

Execute and finish rows can still route requirement changes to Brainstormer,
task adjustments to Planner, and implementation questions to Executor.
When there is implementation state on the branch but no PR, routing must not
skip Reviewer solely because no loopback marker exists. Reviewer remains the
visible-state reconstruction point for local pre-publish findings.

### `skills/superteam/pre-flight.md`

Remove loopback-class recovery from the detection sequence, output record, and
halt/red-flag guidance. Pre-flight should not scan git trailers to recover
workflow state. It should continue to inspect issue, branch, artifacts, PR state,
phase, prompt class, and execution capability.

For cross-session safety, pre-flight or routing must preserve the existing
post-implementation requirement: if committed implementation changes exist and
no PR exists yet, the run resumes through Reviewer before Finisher publication.
This reruns or reconstructs local pre-publish review from visible state instead
of relying on hidden loopback state.

### `skills/superteam/loopback-trailers.md`

Delete the file if no repository rule requires preserving it. If deletion causes
too much churn for one PR, replace it with a short note:

```markdown
# Loopback trailers

Deprecated. Superteam no longer uses `Loopback:` commit trailers for workflow
state. Feedback is classified at intake and routed from visible artifacts, PR
state, and operator prompts.
```

Deletion is preferred because it removes a searchable contract future agents
might accidentally revive.

### `skills/superteam/agent-spawn-template.md`

Remove any instruction telling teammates to emit, verify, or resolve
`Loopback:` trailers. Keep role-specific done-report requirements, but make them
about artifacts, SHAs, and verification evidence only.

### `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

Remove trailer-placement and trailer-recovery pressure tests. Add simpler
replacement scenarios:

- Reviewer classifies a spec-level finding and Team Lead routes to Brainstormer
  immediately without requiring a commit trailer.
- A later `/superteam` invocation resumes from visible artifact/PR state and
  does not scan branch-only commits for `Loopback:`.
- A commit body contains `Loopback: spec-level`; workflow ignores it as obsolete
  text and does not derive routing from it.
- Reviewer finds a spec-level issue after implementation, the session ends
  before remediation is committed, and a later run resumes with implementation
  commits but no PR. Required behavior: rerun or reconstruct Reviewer before
  Finisher can publish; do not proceed directly to PR creation because no
  `Loopback:` marker exists.

### RED-phase baseline artifact

Add a baseline artifact under `docs/superpowers/baselines/` showing the current
cost of the mechanic:

- the bad trailer shape from the issue
- parser output showing empty `Loopback:` recovery
- the surfaces an agent must consult to handle loopbacks today
- the captured rationalization: "We can fix this with more trailer rules"
- the target GREEN behavior: no trailer scan and no trailer requirement

## Acceptance Criteria

### AC-57-1

Given Brainstormer is dispatched during spec-level feedback remediation, when it
commits the revised design artifact and reports done, then no `Loopback:` commit
trailer is required; the handoff relies on the committed artifact path, commit
SHA, and done-report evidence.

- [ ] Verify Brainstormer guidance no longer requires `Loopback: spec-level`.
- [ ] Verify done-report requirements still include artifact path and handoff
      commit SHA.

### AC-57-2

Given any teammate emits a commit while remediating classified feedback, when
they report done, then their done report includes role-appropriate evidence
without any `git log %(trailers)` loopback check.

- [ ] Verify Brainstormer, Planner, and Executor contracts no longer require
      loopback trailer parseability evidence.
- [ ] Verify Reviewer and Finisher still classify feedback before routing it.

### AC-57-3

Given the agent-spawn template is updated, when a fresh agent reads it, then it
contains no worked example or instruction for `Loopback:` trailers.

- [ ] Inspect `skills/superteam/agent-spawn-template.md` and confirm delegated
      teammate prompts do not mention `Loopback:`.

### AC-57-4

Given Team Lead runs pre-flight, when branch-only commits contain old
`Loopback:` text in a body or trailer, then pre-flight does not recover routing
state from that text and instead routes from visible issue, artifact, branch,
PR, and prompt state.

- [ ] Verify `pre-flight.md` no longer includes loopback-class recovery.
- [ ] Verify `routing-table.md` no longer gives active loopback state routing
      precedence.
- [ ] Verify pressure tests cover ignoring obsolete `Loopback:` text.

### AC-57-5

Given the simplification scan found other speed opportunities, when this issue
is planned, then only loopback-trailer removal is in scope and the other
opportunities are documented as follow-ups, not implemented opportunistically.

- [ ] Verify the implementation plan preserves follow-up ideas without adding
      unrelated edits to execution-mode probing, Finisher shutdown, or Gate 1
      approval ceremony.

### AC-57-6

Given Reviewer classified a local pre-publish finding after implementation, and
the session ended before remediation was committed or a PR existed, when a later
run resumes, then the workflow reruns or reconstructs Reviewer from visible
state before Finisher can publish.

- [ ] Verify routing/pre-flight guidance requires Reviewer before PR publication
      when implementation state exists without a PR and prior local findings
      cannot be proven resolved from visible state.
- [ ] Verify pressure tests cover the interrupted local-review case without
      reintroducing any hidden loopback marker.

## Requirements

- Remove durable `Loopback:` trailer workflow state.
- Preserve feedback classification and correct teammate routing.
- Resume across sessions from visible committed artifacts, PR state, and
  operator prompts.
- Treat local pre-publish Reviewer findings as same-run state unless captured in
  visible durable state.
- Rerun or reconstruct Reviewer before publication when a later run resumes from
  implementation state without a PR and cannot prove local findings were
  resolved.
- Do not add replacement hidden state.
- Remove obsolete trailer pressure tests instead of adding more trailer
  hardening.
- Capture a RED baseline before changing the workflow contract.
- Keep this issue scoped to loopback-trailer removal; document other speed wins
  as follow-ups only.

## Non-Goals

- Do not redesign the whole `superteam` workflow in this issue.
- Do not remove Reviewer or Finisher ownership boundaries.
- Do not weaken the rule that requirement-bearing feedback routes through
  Brainstormer before implementation.
- Do not change branch creation, PR publication, or commit-title conventions.
- Do not implement the execution-mode, Finisher, or Gate 1 simplifications in
  this PR.

## Writing-Skills Review Dimensions

- RED baseline obligation: capture today's trailer failure and surface-area cost
  before edits.
- GREEN verification path: pressure tests show no trailer scan, no trailer
  requirement, and preserved feedback routing.
- Rationalization resistance: close "just add more trailer checks" and "replace
  trailers with another hidden marker."
- Red flags: any remaining required `Loopback:` trailer, any pre-flight trailer
  recovery, or any new sidecar state.
- Token efficiency: delete more contract text than this change adds.
- Role ownership: Reviewer and Finisher classify feedback; Team Lead routes;
  Brainstormer, Planner, and Executor remediate their owned surfaces.
- Stage-gate bypass paths: visible state must still prevent skipping required
  design, plan, review, and finish gates.

## Open Questions

Should `loopback-trailers.md` be deleted outright or replaced by a short
deprecation note for one release? Deletion is cleaner, but Planner may choose the
lowest-churn option that leaves no active workflow contract requiring trailers.
