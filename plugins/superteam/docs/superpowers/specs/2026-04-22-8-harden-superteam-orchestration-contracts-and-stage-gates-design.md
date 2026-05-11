# Design: Harden superteam orchestration contracts and stage gates [#8](https://github.com/patinaproject/superteam/issues/8)

## Summary

Harden the `superteam` orchestration layer so each teammate operates within a clearer, more enforceable contract. The design focuses on repository-owned orchestration assets such as the main skill contract, stage prompts/templates, and pressure-test coverage. It replaces an action-oriented workflow layout with a teammate roster, standardizes role naming, makes approval and handoff gates explicit, removes brittle hard-coded rule references in favor of canonical rule discovery, tightens role boundaries and done reports, requires explicit recommendation of relevant `superpowers` skills for delegated teammates, and makes comment handling plus requirements-delta routing safer.

The repository should remain portable across runtimes. The design does not add runtime-specific mechanics, downstream-private repository assumptions, config files, or acceptance-criteria tracing/tooling beyond the durable artifacts needed for this repo's workflow.

## Goals

- Make teammate roles, owned artifacts, and handoff language consistent across the orchestration surface
- Require explicit approval before the workflow can advance from brainstorm to plan
- Replace hard-coded rule literals with a canonical-rule discovery pattern that can survive repo evolution
- Strengthen teammate boundaries so each role owns only its allowed artifacts and outputs
- Standardize done-report contracts so later stages can trust earlier-stage outputs
- Require delegated teammate prompts to explicitly recommend relevant `superpowers` plugin skills when applicable
- Make missing expected `superpowers` skill guidance explicit to the operator and delegated teammate when those skills are unavailable in the current environment
- Make comment handling and requirement-delta routing safer and less guess-based
- Update agent/orchestrator prompts, PR/review-facing templates, docs, and pressure tests that exercise the hardened contract

## Non-Goals

- Adding downstream or private-repo-specific workflow rules
- Introducing runtime-specific enforcement logic, tool adapters, or config files
- Building AC tracing systems, dashboards, or other workflow tooling outside the repo docs and prompts
- Expanding the skill into a general-purpose project-management framework beyond the current orchestration workflow

## Design

### Teammate Roster And Ownership

The orchestration surface should use a teammate-based roster as its canonical workflow layout. Prompts, templates, and docs should stop centering the workflow around action labels alone and instead describe who owns each responsibility, what artifact each teammate hands off, and which `superpowers` skills should be recommended when that teammate is delegated work.

The canonical teammate roster is:

- `Team Lead`: owns orchestration, stage routing, delegation, gates, and loopbacks
- `Brainstormer`: owns the design doc in `docs/superpowers/specs/`
- `Planner`: owns the implementation plan in `docs/superpowers/plans/`
- `Executor`: owns code and tests required by the approved plan
- `Reviewer`: owns local pre-push review findings before publish
- `Finisher`: owns publish-state follow-through such as branch, PR, CI, and review-feedback handling

The workflow may still describe brainstorm, plan, execute, review, and finish phases, but teammate names should be the primary organizing language across the orchestration surface.

### Approval Gate Hardening And Routing

Advancement from brainstorm to plan requires explicit operator approval of the design doc. The orchestrator and supporting prompts should treat silence, ambiguity, or a partial response as non-approval. Brainstorm output must therefore return the exact design doc path and ordered AC list in a stable shape so the operator can approve the actual artifact instead of an informal summary.

Before asking for approval, the orchestrator must verify that the design artifact actually exists at the reported path. The approval request itself must include:

- the exact artifact path under review
- a concise intent summary of what the artifact changes or decides
- the full requirement set currently under review

If the approval payload is too large to present cleanly, the orchestrator must split it into multiple approval messages or sections rather than collapsing it into a lossy fallback summary.

When revisions are requested after an approval pass, the re-fired approval request should include only the deltas and the requirements changed by those deltas. Already-approved content should remain authoritative and should not be replayed as if it were newly under review.

If requirements change after approval, active implementation work pauses and the change routes back through brainstorm whenever the authoritative design must change. Planner-only rerouting is reserved for implementation-detail changes that do not alter requirements, boundaries, or acceptance intent.

### Canonical Rule Discovery

The orchestration layer should stop relying on brittle hard-coded literals for contributor rules, artifact locations, or repo guidance when a canonical repository source exists. Instead, prompts should instruct stages to discover governing docs from the repository itself before acting, starting with root contributor guidance such as `AGENTS.md` and then any local docs that govern the files they touch.

This keeps the workflow portable while letting repositories define their own durable rules. The contract should emphasize discovery order and source authority rather than embedding repo-specific policy text directly into stage prompts.

### Teammate Boundaries And Done Contracts

Each teammate should have a tighter completion contract so later handoffs do not need to infer missing state:

- `Team Lead` routes work, sets gates, delegates to the correct teammate, and loops work back when a contract is not satisfied
- `Brainstormer` reports the design doc path and ordered active AC IDs
- `Planner` consumes the approved design doc and either produces a plan artifact or halts with a blocker
- `Executor` reports completion against explicit task IDs with concrete completion evidence, plus SHAs and verification evidence, but never pushes or publishes
- `Reviewer` validates artifact ownership, required verification, and role-rule compliance before publish, classifies failures into implementation-level, plan-level, or spec-level loopbacks, and reports findings locally
- `Finisher` reports pushed SHAs, origin branch state, PR state, and CI state, and remains the owner of external review-feedback handling

Done reports should be stable, minimal, and teammate-specific. They should not require downstream tooling, but they must contain enough structured evidence that another teammate can continue without guessing.

Loopback routing should be explicit rather than defaulting everything to execution. Implementation-level failures route back to `Executor`. Plan-level failures route back to `Planner`. Spec-level failures route back to `Brainstormer` so the design artifact can be updated before planning resumes.

### Delegated Skill Recommendations

When the `Team Lead` delegates work to a teammate, the prompt should explicitly recommend any relevant `superpowers` plugin skill or skills that the teammate should invoke for that role's work. Skill selection should not be left implicit when the repository's workflow already depends on those skills for design, planning, debugging, verification, review, finish discipline, or orchestration.

The expected recommendations for the canonical roster are:

- `Team Lead`: recommend `superpowers:using-superpowers`, plus `superpowers:dispatching-parallel-agents` when splitting independent work
- `Brainstormer`: recommend `superpowers:brainstorming`
- `Planner`: recommend `superpowers:writing-plans`
- `Executor`: recommend `superpowers:test-driven-development`, `superpowers:systematic-debugging`, `superpowers:writing-skills` when touching `skills/**/*.md`, and `superpowers:verification-before-completion` before claiming completion
- `Reviewer`: recommend `superpowers:requesting-code-review`
- `Finisher`: recommend `superpowers:finishing-a-development-branch`, plus `superpowers:receiving-code-review` when handling reviewer findings, PR comments, or bot feedback

If an expected skill for the delegated role is not available in the current environment, the teammate prompt should say so explicitly rather than silently omitting the guidance. That notice should make the missing skill visible to both the operator and the delegated teammate so they understand which expected workflow aid is unavailable and can account for the gap.

This is prompt discipline, not runtime enforcement. The contract should tell the operator and delegated teammate which skill guidance is expected to apply when relevant, and should explicitly warn when that guidance is unavailable, while keeping the workflow portable across hosts and toolchains.

### Comment Handling And Delta Routing

Comment handling should become an explicit shutdown gate rather than a best-effort courtesy step. Before the workflow can conclude, the `Finisher` checks unresolved inline review threads and recent PR-level bot findings after the latest push. If either remains, the run dispatches finish-owned comment handling and re-checks before shutdown.

Review feedback handling stays owned by `Finisher`, including when a local `Reviewer` has already surfaced findings. The `Reviewer` may identify risks before publish, but repository comments, PR feedback, bot findings, and the resulting loopbacks remain part of finish-owned follow-through rather than shifting ownership back to review.

Before resolving or replying to comments tied to a specific earlier state, the `Finisher` must verify the current branch state against the state that comment was about. Comments that no longer match the current branch should not be resolved or answered as if nothing changed.

Review comments that introduce new requirements do not route directly into execution. They route back through `Brainstormer` and the spec first, then through `Planner`, and only then back to `Executor`.

Requirements deltas should route conservatively. Any change that affects requirements, stage behavior, artifact ownership, or acceptance interpretation returns to brainstorm so the design doc becomes authoritative again. Only implementation-detail deltas that preserve the approved design may route directly to planner.

### Prompt, Template, And Pressure-Test Updates

The main `superteam` skill and its supporting prompt/template assets should be updated together with the repository docs that describe the workflow so the contract remains internally consistent. This includes both agent/orchestrator prompt templates and PR/review-facing templates as distinct deliverables, rather than assuming review-facing behavior is covered implicitly by generic template or docs wording.

Pressure tests should cover exact failure and anti-rationalization paths, including:

- approval requested before the design artifact exists at the cited path
- approval request omits the artifact path, concise intent summary, or full requirement set under review
- approval payload is too large and gets condensed into a vague fallback summary instead of being split
- post-revision approval replay re-sends already-approved content instead of only deltas and changed requirements
- delegated teammate prompt omits a required `superpowers` skill recommendation for that role
- delegated teammate prompt silently omits an expected skill because that skill is unavailable in the current environment
- executor reports completion without explicit task IDs or without concrete completion evidence
- executor attempts to publish or skip required verification
- reviewer fails to classify findings into implementation-level, plan-level, or spec-level loopbacks
- missing or malformed done-report fields at stage handoff
- reviewer findings incorrectly take ownership of PR comment handling away from finisher
- finisher resolves or replies to comments tied to a prior state without checking current branch state first
- review comments that add new requirements are routed straight to execution instead of spec, then plan, then execute
- hard-coded repo rules drifting from canonical docs
- shutdown with unresolved review threads or bot findings
- requirement deltas that should route back to brainstorm

The pressure tests should stay repository-local and documentation/prompt focused. They exist to validate the orchestration contract, not to introduce runtime-specific harnesses.

## Testing And Verification

- inspect the updated orchestration skill, support templates, and docs for naming and contract consistency
- verify teammate prompts instruct canonical-rule discovery before file changes
- verify approval requests require artifact existence checks, exact artifact paths, concise intent summaries, and the full requirement set under review
- verify revision approval re-fires send only deltas and changed requirements, and large approval packets split instead of collapsing into fallback summaries
- verify each teammate's done-report requirements are explicit and non-overlapping
- verify executor completion requires explicit task IDs and concrete completion evidence
- verify reviewer outputs classify failures into implementation-level, plan-level, and spec-level loopbacks
- verify delegated teammate prompts explicitly recommend the expected `superpowers` skills for that role when applicable
- verify delegated teammate prompts explicitly warn when an expected `superpowers` skill for that role is unavailable in the current environment
- verify PR/review-facing templates are updated distinctly from agent/orchestrator prompt templates
- verify finisher-owned comment handling checks current branch state before resolving or replying to state-bound comments
- verify requirement-bearing review comments route through spec, then plan, then execute
- verify docs describe the teammate-based roster and finish-owned feedback handling consistently with the prompts/templates
- review pressure-test coverage to confirm the intended halt conditions and rerouting behavior are exercised

## Acceptance Criteria

- AC-8-1: The orchestration surface uses a consistent teammate-based roster with canonical role naming, owned artifacts, and handoff language across the main skill and supporting prompts/templates
- AC-8-2: Brainstorm-to-plan advancement requires explicit design approval, and requirement-changing deltas route back through brainstorm
- AC-8-3: Gate 1 approval hardening requires design artifact existence checks, approval packets with path plus intent plus full requirements, split large approval payloads, and delta-only re-fire requests after revisions
- AC-8-4: Repository-rule lookup uses canonical-rule discovery from repo guidance instead of brittle hard-coded literals where a canonical source exists
- AC-8-5: Teammate boundaries and done-report contracts are explicit enough that each role can continue without inferring missing state, including executor task-ID completion evidence and reviewer loopback classification
- AC-8-6: Comment handling is a required shutdown gate that re-checks unresolved review threads and PR-level bot findings before completion, verifies current branch state before replying to state-bound comments, and routes requirement-bearing review comments back through spec then plan before execution
- AC-8-7: Delegated teammate prompts explicitly recommend the expected relevant `superpowers` plugin skills for each canonical role when those skills apply to the assigned work, and explicitly warn when an expected skill is unavailable in the current environment
- AC-8-8: Review feedback handling remains owned by `Finisher`, including when local `Reviewer` findings already exist
- AC-8-9: Agent/orchestrator prompt templates, PR/review-facing templates, and repository-local pressure tests cover the hardened orchestration contract and its exact failure modes
- AC-8-10: Repository docs are updated to describe the revised teammate-based workflow contract consistently with the skill and templates

## Implementation Notes

- Keep the changes focused on reusable orchestration-layer assets owned by this repository
- Prefer small, durable contract changes over verbose prompt expansions
- Preserve portability by describing authority and handoff rules, not tool-specific mechanics
