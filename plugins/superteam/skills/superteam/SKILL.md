---
name: superteam
description: Use when taking a GitHub issue from design through execution and merged-ready review using a disciplined teammate-based multi-agent workflow.
---

# superteam

`superteam` is an orchestration skill for running a structured issue workflow across a canonical teammate roster. It uses repository-owned artifacts in `skills/` and `docs/` so the workflow stays portable across repositories and runtimes.

## Canonical roster

Use teammate names as the primary organizing language across the workflow:

1. `Team Lead`: owns orchestration, delegation, gates, and loopbacks
2. `Brainstormer`: owns the design doc in `docs/superpowers/specs/`
3. `Planner`: owns the implementation plan in `docs/superpowers/plans/`
4. `Executor`: owns ATDD-driven implementation, code, and tests required by the approved plan
5. `Reviewer`: owns local pre-publish review findings
6. `Finisher`: owns publish-state follow-through, CI, and external feedback handling

The workflow may still reference brainstorm, plan, execute, review, and finish phases, but teammate names are the canonical contract language.

## Pre-flight

- Prefer the host runtime's normal multi-agent capabilities when available.
- Do not block solely because a preferred team feature is unavailable; fall back to direct subagent dispatch.
- Keep runtime-specific checks lightweight. Teammate ownership, gate discipline, and artifact authority are the important parts.

## Canonical rule discovery

Before any teammate touches governed files, discover the canonical repository rules from repo guidance instead of relying on hard-coded literals:

1. Read root contributor guidance such as `AGENTS.md` when present.
2. Read any local docs that govern the files you will touch.
3. Treat repository guidance as authoritative over remembered workflow shortcuts.

If canonical guidance cannot be found, halt and surface the blocker instead of guessing.

## Gate 1: Brainstormer approval

Advancement from `Brainstormer` to `Planner` requires explicit approval of the design artifact. Silence, ambiguity, or partial replies are non-approval.

Before asking for approval:

1. Verify the design artifact exists at the exact reported path.
2. Return the exact artifact path under review.
3. Include a concise intent summary of what the artifact changes or decides.
4. Include the full requirement set currently under review.

If the approval packet is too large to present cleanly, split it into multiple approval requests or sections. Do not collapse it into a vague fallback summary.

If revisions are requested after an approval pass, re-fire approval with delta-only content:

1. Include only the changed sections or decisions.
2. Include only the requirements changed by those deltas.
3. Keep already-approved content authoritative unless it changed.

## Teammate contracts

### Team Lead

- Route work to the correct teammate.
- Enforce gates and halt on unsatisfied contracts.
- Route requirement-changing deltas back through `Brainstormer`.
- Recommend `superpowers:using-superpowers`.
- Also recommend `superpowers:dispatching-parallel-agents` when splitting independent work.

### Brainstormer

- Own the design doc in `docs/superpowers/specs/`.
- Return the exact design doc path.
- Return the ordered active AC list.
- Report the concise intent summary and the full requirement set used for approval.
- Recommend `superpowers:brainstorming`.

### Planner

- Consume the approved design doc, not ad hoc chat summaries.
- Produce the implementation plan or halt with a blocker.
- Recommend `superpowers:writing-plans`.

### Executor

- Drive implementation from acceptance criteria and approved plan tasks using ATDD, not ad hoc coding first.
- Implement only the assigned tasks from the approved plan.
- Report completion against explicit task IDs.
- Include concrete completion evidence, SHAs, and verification evidence before claiming completion.
- Never push, rebase, or open a PR.
- Recommend `superpowers:test-driven-development` as the ATDD execution skill.
- Recommend `superpowers:systematic-debugging` when debugging or failures appear.
- Recommend `superpowers:writing-skills` when touching `skills/**/*.md`.
- Recommend `superpowers:verification-before-completion` before claiming completion.

### Reviewer

- Review locally before publish.
- Validate artifact ownership, required verification, and role-rule compliance.
- Classify loopbacks explicitly as `implementation-level`, `plan-level`, or `spec-level`.
- Keep findings local; do not take ownership of external review feedback.
- Recommend `superpowers:requesting-code-review`.

### Finisher

- Own push, branch publication, PR updates, PR body rendering, CI triage, and external review/comment handling.
- Report pushed SHAs, current branch state on origin, PR state, and CI state.
- Verify current branch state before resolving or replying to comments tied to prior state.
- Route requirement-bearing feedback through `Brainstormer` first, then `Planner`, then `Executor`.
- Recommend `superpowers:finishing-a-development-branch`.
- Also recommend `superpowers:receiving-code-review` when handling reviewer findings, PR comments, or bot feedback.

## Missing skill warnings

When `Team Lead` delegates work, the prompt must explicitly recommend the expected `superpowers` skills for that role when relevant. If an expected skill is unavailable in the current environment, say so explicitly in the delegated prompt so both the operator and teammate can see the gap.

Do not silently omit expected skill guidance.

## Review and loopback routing

Loopbacks must be explicit:

1. `implementation-level` findings route to `Executor`
2. `plan-level` findings route to `Planner`
3. `spec-level` findings route to `Brainstormer`

Requirement-bearing feedback does not route straight to implementation. It returns to `Brainstormer`, then to `Planner`, and only then back to `Executor`.

Implementation-detail deltas that preserve requirements, ownership, and acceptance intent may route directly to `Planner`.

## External feedback ownership

External PR comments, review threads, bot findings, and other repository feedback remain owned by `Finisher`, even when local `Reviewer` findings already exist.

Before resolving or replying to comments tied to a prior branch state:

1. Verify the current branch state against the state the comment referred to.
2. Do not respond as if nothing changed when the comment no longer matches the current branch.
3. Re-route requirement-bearing feedback through the spec-first path.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "The design file probably exists if Brainstormer says it does." | Gate 1 requires verifying the artifact exists at the reported path before approval. |
| "I can summarize the approval request in one short fallback blurb." | Approval packets must include artifact path, concise intent summary, and full requirement set; split oversized packets instead of collapsing them. |
| "I can replay the whole approval request after a small revision." | Re-fired approval after revisions must be delta-only. |
| "I remember the repo rules already." | Discover canonical repository guidance before touching governed files. |
| "Executor finished the spirit of the task." | `Executor` must report completion against explicit task IDs with evidence. |
| "Reviewer can just send everything back to execution." | `Reviewer` must classify implementation-level, plan-level, and spec-level loopbacks. |
| "Reviewer already found it, so Reviewer can own PR comment handling too." | External review feedback stays with `Finisher`. |
| "That comment is old, but I can still resolve it." | `Finisher` must verify current branch state before resolving prior-state comments. |

## Red flags

- Using older stage-only language where the canonical teammate roster should be used.
- Asking for design approval before verifying the cited artifact exists.
- Approval requests that omit the artifact path, concise intent summary, or full requirement set.
- Oversized approval requests collapsed into a vague summary instead of split into clean sections.
- Replaying already-approved content instead of sending delta-only approval after revisions.
- Touching governed files without canonical-rule discovery from repository guidance.
- Delegated teammate prompts that omit expected `superpowers` recommendations or fail to warn when an expected skill is unavailable.
- `Executor` claiming completion without explicit task IDs, SHAs, or verification evidence.
- `Reviewer` failing to classify findings as `implementation-level`, `plan-level`, or `spec-level`.
- Local review findings taking ownership of external PR feedback away from `Finisher`.
- `Finisher` resolving prior-state comments without checking current branch state first.
- Shutting down with unresolved review threads or bot findings still open.

## Shutdown

Before shutdown:

1. Check unresolved inline review threads for the active PR after the latest push.
2. Check recent PR-level bot findings after the latest push.
3. If either remains, dispatch `Finisher`-owned feedback handling and re-check.
4. Only request shutdown when unresolved external feedback is cleared or a blocker is reported explicitly.

Use repository placeholders such as `<owner>`, `<repo>`, `<pr>`, and `<branch>` in commands so the workflow stays portable across repositories.

## Failure handling

Any unsatisfied gate or failed teammate contract should halt the run and report:

`superteam halted at <teammate or gate>: <reason>`

Do not silently continue past failed checks, missing artifacts, ambiguous repository state, or unresolved publish-state feedback.

## Supporting files

- [agent-spawn-template.md](./agent-spawn-template.md): teammate-specific spawn guidance
- [pr-body-template.md](./pr-body-template.md): PR checklist template used by `Finisher`
