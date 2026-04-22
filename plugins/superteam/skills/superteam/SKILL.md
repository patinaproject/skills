---
name: superteam
description: Use when taking a GitHub issue from design through execution and merged-ready review using a disciplined multi-agent workflow.
---

# superteam

`superteam` is an orchestration skill for running a structured issue workflow across design, planning, execution, review, and finish stages. It uses a public `skills/` and `docs/` artifact layout so the workflow stays portable across repositories.

## Core workflow

Use `superteam` when a single issue needs coordinated agent work from spec to review-ready branch state.

1. **Brainstorm**: produce or update the design doc.
2. **Plan**: turn the approved design into an implementation plan.
3. **Execute**: implement tasks in bounded batches.
4. **Pre-push review**: verify the executor output before publishing.
5. **Finish**: push, open or update the PR, and handle CI.
6. **Comment handling**: address unresolved review threads or bot findings before shutdown.

## Pre-flight

- Prefer the host runtime's normal multi-agent capabilities when available.
- Do not block solely because a preferred team feature is unavailable; fall back to direct subagent dispatch.
- Keep runtime-specific checks lightweight. Stage semantics and artifact ownership are the important part.

## Artifact ownership

`superteam` assumes each stage owns specific artifacts.

- Brainstorm owns the design doc in `docs/superpowers/specs/`.
- Plan owns the implementation plan in `docs/superpowers/plans/`.
- Execute owns code and test changes required by the plan.
- Finish owns branch publication, PR updates, and CI follow-through.

Do not write outside the artifact path owned by the current stage unless the plan explicitly requires it.

## Stage rules

### Stage 1: Brainstorm

- Brainstorm is required unless the operator explicitly resumes from a later stage and a valid design doc already exists.
- The brainstormer must return the exact design doc path and the ordered AC list.
- Approval must be explicit before planner work starts. Silence is not consent.

### Stage 2: Plan

- Planner consumes the approved design doc, not ad hoc chat summaries.
- If confidence is high and blockers are clear, the run may advance to execution.
- If the planner is blocked, halt and surface the blocker to the operator.

### Stage 3: Execute

- Executors implement only the assigned batch.
- Executors do not push, rebase, or open PRs.
- Executors must report SHAs and verification output before claiming completion.

### Stage 4: Pre-push review

- Review the executor's output before any publish step.
- Reject work that skips required verification, writes to the wrong artifact path, or edits skill files without the appropriate skill-authoring workflow.

### Stage 5: Finish

- Finisher owns push, PR creation or update, PR body generation, and CI triage.
- A finisher completion report must include pushed SHAs, branch state on origin, PR URL or update confirmation, and CI status.

### Stage 6: Comment handling

- Before shutdown, check unresolved review threads and PR-level bot findings.
- If either exists, dispatch a comment handler and re-check before shutdown.

## Requirements changes

Requirement changes always route through brainstorm before they reach planner.

1. Pause active implementation work.
2. Send the delta to brainstorm so the design doc becomes authoritative again.
3. Re-run planning from the updated design doc.
4. Resume execution only after the updated plan is accepted.

Implementation-detail changes that affect only how the work is done may route directly to planner.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "I can update the plan inline." | Design and plan synthesis belong to delegated stages. |
| "The executor can push after the last task." | Publishing belongs to finish, not execute. |
| "No one objected, so the design is approved." | Approval must be explicit. |
| "I can infer teammate state from `git` or `gh`." | Ask the teammate to re-report instead of guessing. |
| "The plan can map ACs to file:line pairs." | Keep AC mapping in tests and artifacts, not prose-heavy plan tables. |

## Red flags

- Editing or writing code inline when the current stage should delegate.
- Executor pushing a branch, rebasing, or opening a PR.
- Planner or executor editing `skills/**/*.md` without invoking `superpowers:writing-skills`.
- Teammates reporting completion without SHAs or verification evidence.
- Shutting down without checking unresolved review threads and bot findings.

## Shutdown

Before sending shutdown requests:

1. Query unresolved inline review threads for the active PR.
2. Query recent PR-level bot review comments after the latest push.
3. If any unresolved threads or bot findings remain, dispatch comment handling and loop.
4. Only request shutdown once both counts are zero.

Use repository placeholders such as `<owner>`, `<repo>`, `<pr>`, and `<branch>` in commands so the workflow stays portable across repositories.

## Failure handling

Any unsatisfied gate or failed stage should halt the run and report:

`superteam halted at stage <N>: <reason>`

Do not silently continue past failed checks, missing artifacts, or ambiguous repository state.

## Supporting files

- [agent-spawn-template.md](./agent-spawn-template.md): role-specific spawn guidance
- [pr-body-template.md](./pr-body-template.md): PR checklist template used by the finisher
