# Design: Artifact-producing teammates should commit before handoff [#30](https://github.com/patinaproject/superteam/issues/30)

## Summary

Require artifact-producing teammates to commit their owned changes before they can report done or hand off to the next teammate. The workflow should treat committed branch state as the authority for downstream work, not uncommitted workspace state. This keeps design, planning, and execution handoffs anchored to inspectable commits and makes reported SHAs refer to real teammate handoff points instead of speculative local state.

The change stays narrow. It adds an explicit commit-before-handoff rule for `Brainstormer`, `Planner`, and `Executor`, reflects that rule in teammate prompts and done-report contracts, and adds pressure-test coverage for incomplete handoffs that depend on uncommitted artifact changes. It does not require `Reviewer` or `Finisher` to manufacture commits when they did not materially change durable artifacts.

## Goals

- Require each artifact-producing teammate to commit their owned changes before handoff
- Make handoffs depend on committed branch state rather than dirty workspace state
- Ensure teammate done reports reference real handoff commits for artifact-producing work
- Treat uncommitted artifact state as an incomplete handoff unless the run halts explicitly with a blocker
- Preserve flexibility for non-artifact-producing stages so they are not forced into meaningless commits
- Keep the canonical skill, delegated prompts, and pressure tests aligned on the same handoff rule

## Non-Goals

- Requiring `Reviewer` or `Finisher` to create commits when they did not materially change durable repo artifacts
- Changing PR publication, mergeability, or external feedback ownership
- Redesigning the canonical teammate roster or stage ordering
- Introducing a new artifact registry or generic state-tracking system
- Expanding beyond the workflow-contract surfaces that directly define or validate handoff behavior

## Approaches Considered

### Recommended: role-specific commit-before-handoff requirements

Add explicit commit-before-handoff language to the contracts and done reports for `Brainstormer`, `Planner`, and `Executor`, then add a workflow-level rule that any handoff depending on uncommitted durable artifact changes is incomplete. This is the clearest way to satisfy the issue because it names the affected roles directly and keeps the enforcement easy to audit.

### Alternative: one global handoff rule with role exceptions

Add a single top-level rule saying any teammate who materially updates durable artifacts must commit before handoff, then explain that some roles usually do not need to do so. This reduces repetition, but it also leaves more room for interpretation in the exact places where the issue wants clarity.

### Alternative: enforce only through done-report fields

Require handoff commit SHAs in the done reports but keep the prose requirements light. This is too implicit. The next teammate should not have to infer the workflow rule from schema alone.

## Design

### Artifact-producing teammates are not done until their changes are committed

`Brainstormer`, `Planner`, and `Executor` each produce or materially update durable repo artifacts that downstream teammates depend on. For those roles, the workflow should define completion and handoff in branch-state terms: the teammate is not done until their owned changes are committed on the current branch.

This means:

- a design doc written by `Brainstormer` is not handoff-ready while it exists only as uncommitted local changes
- an implementation plan written by `Planner` is not handoff-ready while it exists only as uncommitted local changes
- implementation and test changes produced by `Executor` are not handoff-ready while they remain only in the working tree

The rule should be phrased as a completion requirement, not a loose best practice. A teammate who has written the right files but has not committed them has not yet satisfied the handoff contract.

### The workflow should trust branch state, not workspace state

The workflow already depends on stable artifacts, SHAs, and publish-state follow-through. This issue should make explicit that downstream teammates rely on committed branch state instead of inferring intent from a dirty workspace.

At the workflow level, the canonical contract should state that handoffs depending on uncommitted durable artifact changes are incomplete unless the run halts explicitly with a blocker. That gives `Team Lead` and downstream teammates a clear rule for rejecting ambiguous handoffs:

- if the owned artifact changes are committed, handoff may proceed
- if the owned artifact changes are not committed, the run loops back to the owning teammate
- if the run cannot safely proceed, it halts explicitly rather than pretending the handoff succeeded

This keeps handoffs auditable and makes each reported SHA point to a real inspectable state.

### Done reports should include the handoff commit for artifact-producing roles

The role-specific done-report contracts for `Brainstormer`, `Planner`, and `Executor` should add a required handoff commit field so downstream teammates can anchor on a specific commit rather than a generic branch tip reference.

The field should be role-specific but semantically consistent:

- `Brainstormer`: report the commit containing the design artifact used for approval and planning
- `Planner`: report the commit containing the approved implementation plan used for execution
- `Executor`: report the commit containing the completed task batch and verification-backed implementation state

The requirement is not only about recording a SHA after the fact. The presence of the handoff commit in the done report confirms the ownership rule: artifact-producing work must exist in committed branch history before the teammate can finish.

### Delegated teammate prompts must mirror the same rule

The repository-owned teammate prompt template should repeat the commit-before-handoff requirement anywhere it instructs `Brainstormer`, `Planner`, or `Executor` on their done contracts. Otherwise the canonical skill and delegated prompts can drift apart and recreate the same ambiguity in practice.

The delegated prompt guidance should make two things explicit:

- artifact-producing teammates must commit their owned changes before reporting done or handing off
- done reports for those roles must include the handoff commit SHA alongside the existing artifact path, task IDs, evidence, or verification fields already required

This keeps subagent execution aligned with the same branch-state authority as the foreground workflow.

### Non-artifact-producing stages should not be forced into meaningless commits

`Reviewer` and `Finisher` should not be required to create commits merely because they participate in the workflow. Their work is often evaluative, routing-oriented, or publish-oriented rather than artifact-producing.

The design should therefore distinguish between:

- artifact-producing roles, which must commit before handoff whenever they materially update owned durable artifacts
- non-artifact-producing roles, which are not required to create a commit unless their own remediation actually changes durable artifacts they own or are responsible for updating in that moment

This preserves the issue intent without turning the workflow into a commit ritual divorced from real artifact changes.

### Pressure tests should cover incomplete handoffs and the non-artifact exception

The pressure-test doc should add scenarios that exercise the contract directly:

- `Brainstormer` attempts to hand off an uncommitted design doc
- `Planner` attempts to hand off an uncommitted plan doc
- `Executor` attempts to hand off uncommitted implementation or test changes
- a handoff depending on those uncommitted changes is treated as incomplete and loops back or halts explicitly
- `Reviewer` or `Finisher` is not forced to create a meaningless commit when no durable artifact changes were made

These scenarios should be framed as workflow-contract checks, not tool-specific git tricks. The point is to validate the handoff authority model: branch state is authoritative for artifact-producing handoffs.

### Scope of repository changes

Keep the implementation narrow and update only the surfaces that directly govern or validate this behavior:

- `skills/superteam/SKILL.md`
  - add the workflow-level incomplete-handoff rule for uncommitted artifact changes
  - add explicit commit-before-handoff requirements for `Brainstormer`, `Planner`, and `Executor`
  - add role-appropriate handoff commit reporting to those done contracts
- `skills/superteam/agent-spawn-template.md`
  - mirror the same artifact-producing commit-before-handoff requirements
  - add the corresponding handoff commit fields to delegated done-report contracts
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
  - add scenarios that fail uncommitted artifact-producing handoffs
  - add a scenario confirming non-artifact-producing stages are not forced into meaningless commits

Inspect other docs only if they materially contradict the intended handoff rule. Avoid broad cleanup outside the directly relevant workflow-contract surfaces.

## Testing And Verification

- verify the canonical `superteam` contract says handoffs depending on uncommitted durable artifact changes are incomplete unless the run halts explicitly with a blocker
- verify `Brainstormer`, `Planner`, and `Executor` each require a commit before reporting done or handing off
- verify the role-specific done-report contracts for those teammates require a handoff commit SHA
- verify the delegated prompt template mirrors the same commit-before-handoff rule and handoff commit fields
- verify the pressure-test doc covers uncommitted handoff attempts for design, plan, and implementation artifacts
- verify the pressure-test doc covers the non-artifact-producing exception for `Reviewer` and `Finisher`

## Acceptance Criteria

- AC-30-1: Given `Brainstormer`, `Planner`, or `Executor` materially updates their owned durable artifacts, when that teammate reports done or hands off, then the owned changes already exist in a commit on the current branch
- AC-30-2: Given a downstream handoff depends on uncommitted durable artifact changes from an artifact-producing teammate, when the workflow evaluates that handoff, then it treats the handoff as incomplete unless the run halts explicitly with a blocker
- AC-30-3: Given the workflow defines teammate prompts and done-report contracts for artifact-producing roles, when those roles are described, then the commit-before-handoff expectation and handoff commit reporting are explicit
- AC-30-4: Given `Reviewer` or `Finisher` did not materially change durable artifacts, when they complete their stage responsibilities, then the workflow does not require a meaningless commit solely to satisfy the handoff rule
