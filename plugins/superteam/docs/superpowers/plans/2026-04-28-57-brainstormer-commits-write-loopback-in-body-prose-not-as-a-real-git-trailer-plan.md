# Plan: Brainstormer commits write `Loopback:` in body prose, not as a real git trailer [#57](https://github.com/patinaproject/superteam/issues/57)

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` when delegating independent
> implementation batches, or execute directly only when the operator explicitly
> requests inline work. Use `superpowers:writing-skills` before editing
> `skills/**/*.md` or workflow-contract docs.

**Goal:** Remove durable `Loopback:` trailer workflow state from Superteam while
preserving feedback classification, visible-state resume, and the required
Reviewer pass before publication.

**Architecture:** Documentation-only workflow-contract change. Delete
trailer-based routing and recovery; keep same-run feedback classification and
cross-session safety by rerunning or reconstructing Reviewer from visible state
when implementation exists without a PR.

**Tech Stack:** Markdown (`markdownlint-cli2` via `pnpm lint:md`), git, Husky
hooks.

---

## Context

The approved design at
`docs/superpowers/specs/2026-04-28-57-brainstormer-commits-write-loopback-in-body-prose-not-as-a-real-git-trailer-design.md`
is authoritative. It pivots #57 from hardening malformed `Loopback:` trailers to
removing the durable trailer mechanic entirely.

This plan intentionally implements only loopback-trailer removal. The design's
other speed opportunities are follow-ups and must not be mixed into this issue.

## File Structure

Files expected to change:

- `docs/superpowers/baselines/2026-04-28-57-loopback-trailer-removal-red-phase-baseline.md`
  - new RED baseline capturing the current trailer failure and surface-area cost
- `skills/superteam/SKILL.md`
  - remove trailer requirements, rationalizations, red flags, and active
    loopback-state wording; preserve feedback classification and Reviewer safety
- `skills/superteam/routing-table.md`
  - remove `active_loopback_class` precedence and route from visible state
- `skills/superteam/pre-flight.md`
  - remove loopback recovery from detection/output; preserve Reviewer-before-PR
    resume safety
- `skills/superteam/agent-spawn-template.md`
  - remove any delegated prompt guidance requiring `Loopback:` trailers
- `skills/superteam/loopback-trailers.md`
  - delete if references can be cleanly removed; otherwise replace with a short
    deprecation stub that is not an active workflow contract
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
  - remove trailer-specific pressure tests and add visible-state replacement
    scenarios

## Workstreams

### Workstream A -- RED baseline (T1)

#### T1 -- Capture current loopback-trailer failure and cost

**File:**

- Add:
  `docs/superpowers/baselines/2026-04-28-57-loopback-trailer-removal-red-phase-baseline.md`

Record:

1. The malformed issue example with a blank line between `Loopback:` and
   `Co-Authored-By:`.
2. The parser outcome: `git log %(trailers:only,key=Loopback)` is empty for
   that shape.
3. The current surface area an agent must consult for loopback handling:
   `SKILL.md`, `routing-table.md`, `pre-flight.md`,
   `loopback-trailers.md`, `agent-spawn-template.md`, and pressure tests.
4. The captured rationalization: "We can fix this with more trailer rules."
5. The target GREEN behavior: no required `Loopback:` trailer, no trailer scan,
   and visible-state routing preserved.

This satisfies the writing-skills RED baseline obligation before contract edits.

### Workstream B -- Remove trailer state from core contracts (T2, T3, T4)

#### T2 -- Rewrite loopback language in `SKILL.md`

**File:**

- Modify: `skills/superteam/SKILL.md`

Remove or rewrite all active workflow requirements for:

- intermediate commits carrying `Loopback: spec-level`, `Loopback: plan-level`,
  or `Loopback: implementation-level`
- resolving commits carrying `Loopback: resolved`
- branch-only `Loopback:` recovery as durable routing state
- active loopback routing precedence over normal phase routing
- rationalization rows and red flags that exist only to enforce trailer grammar

Preserve and clarify:

- `Reviewer` classifies local pre-publish findings as spec-level, plan-level, or
  implementation-level feedback
- `Finisher` classifies external feedback
- requirement-bearing feedback routes Brainstormer -> Planner -> Executor
- implementation-only feedback may route directly to Executor
- local pre-publish Reviewer findings are same-run state unless made visible in
  a committed artifact, plan update, commit, or PR comment
- when implementation exists without a PR and prior local findings cannot be
  proven resolved from visible state, rerun or reconstruct Reviewer before
  Finisher can publish

#### T3 -- Remove loopback precedence from routing

**File:**

- Modify: `skills/superteam/routing-table.md`

Remove:

- `active_loopback_class` precedence table
- prompt-classification rows that require trailer-emitting intermediate or
  resolving commits
- restart/resume rules that depend on active loopback trailers

Keep visible-state routing:

- execute + requirement change -> Brainstormer
- execute + task adjustment -> Planner
- execute + implementation question -> Executor
- finish + requirement-bearing feedback -> Brainstormer, then Planner, then
  Executor
- finish + status check -> Finisher latest-head sweep
- implementation state with no PR must pass through Reviewer before Finisher can
  publish when local review findings cannot be proven resolved

#### T4 -- Remove loopback recovery from pre-flight

**File:**

- Modify: `skills/superteam/pre-flight.md`

Remove:

- loopback-class recovery detection step
- `active_loopback_class` from the pre-flight output record
- references to `loopback-trailers.md` as a recovery algorithm

Keep:

- active issue resolution
- auto-switch to issue branch
- committed artifact inspection
- PR state inspection
- phase derivation
- prompt classification
- execution-mode capability detection

Add or preserve a visible-state resume rule: implementation state with no PR
must not skip local Reviewer before Finisher publication when prior local review
resolution is not visible.

### Workstream C -- Spawn prompt and trailer file cleanup (T5, T6)

#### T5 -- Remove trailer instructions from delegated prompts

**File:**

- Modify: `skills/superteam/agent-spawn-template.md`

Remove any instruction that tells Brainstormer, Planner, Executor, or Team Lead
to emit, verify, recover, or resolve `Loopback:` trailers. Keep normal
role-specific done reports and evidence requirements.

#### T6 -- Retire `loopback-trailers.md`

**File:**

- Delete or modify: `skills/superteam/loopback-trailers.md`

Preferred path: delete the file after removing internal references.

Fallback path: if deletion creates noisy broken references in the same PR,
replace the file with a short deprecation stub:

```markdown
# Loopback trailers

Deprecated. Superteam no longer uses `Loopback:` commit trailers for workflow
state. Feedback is classified at intake and routed from visible artifacts, PR
state, and operator prompts.
```

Choose the lowest-churn option that leaves no active workflow contract requiring
trailers.

### Workstream D -- Pressure tests and verification (T7, T8, T9)

#### T7 -- Update pressure-test scenarios

**File:**

- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

Remove trailer-specific scenarios, including scenarios that require:

- matching `Loopback:` trailers on active loopback commits
- `Loopback: resolved` trailer semantics
- branch-only loopback trailer recovery
- parseable trailer placement as a workflow gate

Add replacement scenarios:

1. Reviewer classifies a spec-level finding and Team Lead routes to Brainstormer
   immediately without requiring a commit trailer.
2. A later `/superteam` invocation resumes from visible artifact/PR state and
   does not scan branch-only commits for `Loopback:`.
3. A commit body contains `Loopback: spec-level`; workflow ignores it as
   obsolete text and does not derive routing from it.
4. Reviewer finds a spec-level issue after implementation, the session ends
   before remediation is committed, and a later run resumes with implementation
   commits but no PR; the workflow reruns or reconstructs Reviewer before
   Finisher can publish.

#### T8 -- Run verification

Run:

```bash
pnpm lint:md
```

Run targeted searches:

```bash
rg -n "Loopback|loopback-trailers|active_loopback_class" skills/superteam docs/superpowers/pressure-tests/superteam-orchestration-contract.md
```

Expected search result: no active trailer requirement or trailer recovery path
remains. Mentions are allowed only in the RED baseline, deprecation note if T6
uses one, or pressure tests that explicitly confirm obsolete text is ignored.

#### T9 -- Commit implementation

Stage only touched files explicitly. Commit with a release-triggering type
because this changes shipped skill behavior:

```bash
git commit -m "fix: #57 remove loopback trailer state"
```

Do not use `docs:` for the implementation commit because `skills/**` workflow
contract behavior changes.

## Verification

- `pnpm lint:md` exits clean.
- Targeted `rg` confirms no active `Loopback:` trailer requirement or recovery
  path remains.
- Pressure-test walkthrough confirms visible-state routing preserves Reviewer
  safety without hidden state.
- Commitlint accepts:
  `fix: #57 remove loopback trailer state`.

## Blockers

None.
