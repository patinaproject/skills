---
name: superteam
description: Orchestrates a GitHub issue through design, planning, implementation, review, PR publication, and latest-head shutdown using the Team Lead, Brainstormer, Planner, Executor, Reviewer, and Finisher roster. Use when the operator runs `/superteam`, says "run superteam on #N", asks to drive an issue to PR, or needs Superteam to resume publish-state follow-through.
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TodoRead
  - TodoWrite
---

# superteam

`superteam` is an orchestration skill for running a structured issue workflow across a canonical teammate roster. It uses repository-owned artifacts in `skills/` and `docs/` so the workflow stays portable across repositories and runtimes.

## Quick start

1. Resolve the active issue: prefer an explicit `#<n>` in the prompt, then the issue number in the current branch name, then ask the operator.
2. Run pre-flight before delegating: branch state, committed design/plan artifacts, PR state, active host, execution mode, and model-override capability.
3. Route by observable state: no design -> `Brainstormer`; committed plan without PR -> `Executor` or `Reviewer`; open or merged PR -> `Finisher`.
4. Preserve gates: `Planner` starts only after explicit Gate 1 approval and a committed design; execution starts only from a committed plan; completion waits for `Finisher` latest-head shutdown.
5. Resume by default. Restart only when the operator explicitly asks or names a different issue and confirms the switch.

## Reference map

- [pre-flight.md](./pre-flight.md): active issue resolution, branch switching, phase detection, execution-mode detection, and finish-state fields.
- [routing-table.md](./routing-table.md): phase x prompt-classification routing and resume-vs-restart rules.
- [project-deltas.md](./project-deltas.md): project override schema, denylist, host probing, and audit/halt strings.
- [workflow-diagrams.md](./workflow-diagrams.md): chronological and orchestration diagrams.
- [.claude/agents/](./.claude/agents/): Claude Code role contracts.
- [agents/](./agents/): Codex role contracts and plugin metadata.

## Examples

- New issue: `/superteam run superteam on #64` resolves issue 64, switches to its issue branch if needed, and starts with `Brainstormer` when no committed design exists.
- Gate approval: `approve` during an open Gate 1 routes to `Planner` only after the design artifact exists, adversarial review is clean or dispositioned, and the approval is explicit.
- PR follow-through: `/superteam check PR comments and CI` during finish routes to `Finisher` for the latest-head PR completion gate, not to a new design or implementation phase.

## When to Use

- A GitHub issue needs design, planning, implementation, review, PR publication, and publish-state follow-through.
- An existing `superteam` issue workflow needs to resume from committed artifacts, branch state, or PR state.
- Operator feedback, review findings, CI state, or PR comments need routing to the correct teammate.
- Workflow-contract or skill changes need explicit gates, pressure-test evidence, and role-owned handoffs.

## When NOT to Use

- Simple GitHub issue or PR edits: use `using-github:using-github`.
- Local code changes that do not need the full issue-to-PR workflow: use the relevant `superpowers` implementation or debugging skill directly.
- One-off code review without teammate orchestration: use `superpowers:requesting-code-review` or `superpowers:receiving-code-review`.
- General skill architecture review: use `workflow-skill-design:designing-workflow-skills`.

## Canonical roster

Use teammate names as the primary organizing language across the workflow:

1. `Team Lead`: owns orchestration, delegation, gates, and feedback routing
2. `Brainstormer`: owns the design doc in `docs/superpowers/specs/`
3. `Planner`: owns the implementation plan in `docs/superpowers/plans/`
4. `Executor`: owns ATDD-driven implementation, code, and tests required by the approved plan
5. `Reviewer`: owns local pre-publish review findings
6. `Finisher`: owns publish-state follow-through, CI, and external feedback handling

The workflow may still reference brainstorm, plan, execute, review, and finish phases, but teammate names are the canonical contract language. See [workflow-diagrams.md](./workflow-diagrams.md) for the canonical Mermaid diagrams.

## Glossary

- `detected_phase`: the phase derived from committed artifacts and PR state during pre-flight.
- `open gate`: a required workflow decision that has not been satisfied, such as Gate 1 design approval.
- `latest-head sweep`: a fresh read of PR feedback and check/status state for the latest pushed head SHA.
- `completion-style handoff`: any response that claims the run is complete, ready, merged, or otherwise done.
- `project delta`: an optional `docs/superpowers/<role>.md` override in the consuming repo.
- `durable state`: committed artifacts, PR state, or other visible state that survives across sessions.

## Pre-flight

### Phase-detection and execution-mode pre-flight

At the top of every `/superteam` invocation, before any teammate delegation, `Team Lead` runs a deterministic detection sequence covering both phase detection and execution-mode capability detection. See `pre-flight.md` in this skill directory for the full algorithm.

Summary of the sequence:

- Resolve the active issue (explicit `#<n>` in prompt, then branch `<n>-<slug>`, then operator).
- When an explicit issue is supplied and the worktree is on the default branch,
  detached `HEAD`, or an unborn branch, auto-switch to the issue branch before
  artifact inspection. Normal issue-work prompts are enough; `new branch` is
  not required.
- Inspect committed artifacts on the branch (design doc, plan doc) at the canonical specs and plans paths.
- Inspect PR state on origin (open / merged / absent).
- Derive the detected phase per the rules below.
- Classify the operator prompt per `routing-table.md`.
- Resolve execution mode per `pre-flight.md` `## Execution-mode capability detection`, then route per `routing-table.md`.
- Probe active host deterministically (env-var families → runtime self-id; first match wins); log `superteam active host: <name> (probe=<source>)`. Out-of-set hosts halt. Probe order in [`project-deltas.md` `## Active-host probe order`](./project-deltas.md#active-host-probe-order).
- Scan `docs/superpowers/*.md` once: any filename whose role-slug does not match a shipped role emits a single `superteam delta orphan: docs/superpowers/<file> does not match any shipped role` warning. Run continues.

Phase derivation rules:

- no design doc, no plan, no PR -> `brainstorm`
- design doc present, no plan doc on branch, no PR -> `brainstorm` (Gate 1 still open per R15)
- plan doc present on branch, no PR -> `execute`
- PR open or merged -> `finish`, with `Finisher` substate derived from PR / CI / review state
- artifacts and PR state cannot be reconciled -> halt per `pre-flight.md` `## Halt conditions`

Ambiguous or contradictory state halts with `superteam halted at Team Lead: <reason>` per `## Failure handling`. Missing execution capability halts only routes that require execute-phase delegation; non-execute routes continue. Runtime capabilities are execution aids, not replacement contracts.

## Execution-mode injection

`Team Lead` probes execution capability in pre-flight and binds every execute-phase delegation to the resolved mode (R14):

- Prefer **team mode** (R17 detection); fall back to **subagent-driven** (`superpowers:subagent-driven-development`). NEVER route through `superpowers:executing-plans` on default paths.
- **Never auto-select inline.** Only an explicit `inline` / `run inline` / `execute in this session` token in the operator prompt may route through `superpowers:executing-plans`.
- Missing capability blocks only execute-phase routes; approval, review, and Finisher status work continue.

Team Lead duties: detect team-mode in pre-flight; bind directly; inject resolved mode into delegation prompt; carry suppression into nested delegations; do not prompt the developer to choose.

Operator override: explicit `inline` (or equivalent) switches mode for that delegation only. Ambiguous framing is NOT an override.

## Model selection

`Team Lead` resolves an explicit per-role model at delegation time and binds it via the host's model-override mechanism. Silent inheritance of the parent session model is forbidden except where noted.

### Per-teammate model defaults

Per-role defaults live in the shipped agent file (the `model:` field is authoritative across both host formats — Claude frontmatter and Codex top-level YAML). `inherit` for `Team Lead` is a literal value; every other delegation MUST resolve to `opus`, `sonnet`, or `haiku`. Defaults are deliberately static.

### Operator override grammar

The override grammar mirrors R14's discipline: only unambiguous tokens count. The matching rule is the same as R14 inline override — substring match on the canonical token forms only, no fuzzy interpretation.

Canonical override tokens (`model: opus`, `model: sonnet`, `model: haiku`, or `use <model>` / `with <model>`) override the per-role default for the next delegation only. Targeted form: `model: <model> for <role>`. Matching is case-insensitive; token applies to the next teammate delegation only; does NOT persist. The full grammar examples and the non-override phrase list live in [`project-deltas.md` `## Model-override grammar examples`](./project-deltas.md#model-override-grammar-examples).

Override scope: operator override always wins for its targeted delegation; subsequent delegations revert to the per-role default. There is no implicit "remember the last override" behavior.

### Binding mechanism

Resolution order per delegation: (1) canonical operator override token targeting this delegation; (2) per-role default from agent file frontmatter; (3) `inherit` → no model parameter passed. Binding surface for Claude Code: `model` parameter on the `Agent` tool call. Other host runtimes use the analogous dispatch parameter.

### Capability fallback

When the host lacks a model-override mechanism, `Team Lead` records `model_override_capability=unavailable` in pre-flight output, proceeds without binding a model, and surfaces a single warning per run (inherit-and-warn, not halt). Model selection is a cost/fit gate; execution mode is a correctness gate — these behave differently when the capability is unavailable.

### Loophole closure

Model selection is binding; per-role defaults are not advisory. Ambiguous framing is NOT an override. Operator silence is NOT permission to inherit. Override always wins for its targeted delegation only; no persistent override memory. The enumerated loophole-closure rules live in [`project-deltas.md` `## Model-override loophole closure`](./project-deltas.md#model-override-loophole-closure).

## Project deltas (Team Lead lookup)

Project-level behavior modifications live at `docs/superpowers/<role>.md` in the consuming project. The role-name slug matches the kebab-case agent filename. Empty or missing means "use shipped default unchanged."

### Delta file schema

A delta file is a Markdown file with up to four optional sections:

```markdown
---
agent: <role>
---

## Model
<one of: opus | sonnet | haiku | inherit>

## Tools
allow:
  - <Tool>
deny:
  - <Tool>

## System prompt append
<free-form Markdown appended verbatim after the shipped system prompt>
```

### Closed model enum

The only legal `## Model` values in a delta are `{ opus, sonnet, haiku, inherit }`. `inherit` resolves to "use the shipped default model for this role." For non-`team-lead` roles, a delta of `inherit` is allowed but logs `superteam delta inherit-redundant: <role>`. Invalid values halt (see halt strings below).

### Precedence

1. **Shipped default** (agent file frontmatter).
2. **Project delta** (`docs/superpowers/<role>.md` in the consuming repo).
3. **Operator-prompt R26 override** — model layer only. Tool allow/deny and system-prompt-append layers are NOT operator-prompt-overridable.

### Append-only system prompt (LC2)

System-prompt deltas are append-only by design. There is no `replace` mode. A project cannot redact shipped guardrails via a delta. The `## Model` and `## System prompt append` layers are enforced on both supported hosts; the `## Tools` allow/deny layer is enforced on Claude Code and is currently a parity target on Codex (see [`project-deltas.md` `## Host-enforcement asymmetry`](./project-deltas.md#host-enforcement-asymmetry)).

### Closed denylist (LC5)

Team Lead lints every system-prompt-append against a closed denylist of forbidden-intent tokens; matches halt dispatch. The literal token list lives in [`project-deltas.md` `## Forbidden-append denylist (LC5)`](./project-deltas.md#forbidden-append-denylist-lc5).

### `resolve_role_config` algorithm (D5)

Team Lead executes the `resolve_role_config` algorithm at delegation time to merge shipped + delta + operator-prompt config, lint LC5, compute the non-negotiable-rules SHA-256 prefix (LC4), and emit the audit line. The algorithm body lives in [`project-deltas.md` `## resolve_role_config algorithm`](./project-deltas.md#resolve_role_config-algorithm).

### Audit-log strings (N9, LC3)

Team Lead emits one of the documented audit lines for every delegation (chat-first, stderr fallback per N9). The literal format strings live in [`project-deltas.md` `## Audit-log strings`](./project-deltas.md#audit-log-strings-team-lead-emits-these-verbatim). Every applied-line carries `non-negotiable-rules-sha=<8-char-prefix>` (LC4).

### Halt strings

On any of the documented failure modes (invalid model value, agent-disagreement, missing frontmatter, denylist match, unsupported host) Team Lead emits a verbatim halt string; the literal strings live in [`project-deltas.md` `## Halt strings`](./project-deltas.md#halt-strings-team-lead-emits-these-verbatim).

### Deterministic active-host probe (D3)

Pre-flight probes the active host deterministically (env-var families first, runtime self-id last; first match wins). The literal probe order lives in [`project-deltas.md` `## Active-host probe order`](./project-deltas.md#active-host-probe-order).

### Empty / frontmatter-only / body-only cases (N6)

- Zero-byte or all-whitespace → `superteam delta empty: <role>` (no-op; logged).
- Valid frontmatter `agent: <role>` but no body sections → `superteam delta empty: <role>` (no-op; logged). Frontmatter-only is a legitimate anchor file.
- Body sections present but no frontmatter (or frontmatter missing required `agent:` field) → halt with missing-frontmatter blocker string above.

## Canonical rule discovery

Before touching governed files, read root contributor guidance (`AGENTS.md` when present) and any local docs that govern the files; treat repository guidance as authoritative over remembered shortcuts. If canonical guidance cannot be found, halt and surface the blocker instead of guessing.

## Artifact handoff authority

Handoffs depending on uncommitted artifact changes are incomplete unless the run halts explicitly with a blocker. Trust committed branch state; downstream teammates rely on inspectable commits, not uncommitted local changes.

## Operator-facing output

Superteam chat output should satisfy workflow invariants rather than render a fixed status-report template by default. Teammates should write the shortest natural response that makes the current state, requested operator action, active blocker, or next step clear.

Structured bullets and headings are allowed when they help the operator act. They are not mandatory report shells.

Separate durable workflow data from chat rendering: keep required evidence in durable artifacts and PR surfaces, not volatile agent context; surface active blockers, findings, and next steps clearly; do not dump every durable field or enumerate closed findings unless they affect the current operator decision.

## Gate 1: Brainstormer approval

Advancement from `Brainstormer` to `Planner` requires explicit approval of the design artifact. Silence, ambiguity, or partial replies are non-approval.

Before asking for approval:

1. Verify the design artifact exists at the exact reported path.
2. Return the exact artifact path under review.
3. Include a concise intent summary of what the artifact changes or decides.
4. Include the full requirement set currently under review.
5. Include `adversarial_review_findings[]` as the single approval-finding surface, including Brainstormer-originated concerns and adversarial-review findings.
6. Preserve finding provenance with `source: brainstormer | adversarial-review`.
7. Require an explicit adversarial-review result before approval can advance: `clean`, `findings dispositioned`, or `blocked`.
8. Include `reviewer_context`: `fresh subagent`, `parallel specialists`, or `same-thread fallback`.
9. Include `clean_pass_rationale` with checked dimensions when no blocker or material findings remain.
10. Halt approval when any blocker or material finding is still open.

The evidence above is required gate data, not a required chat template. The operator-facing approval request should read naturally and focus on the decision being requested. It may summarize a clean review as no approval-blocking findings remaining instead of replaying closed or dispositioned findings.

Before Gate 1 approval is presented, `Team Lead` must run or dispatch an adversarial design review against the committed design artifact. Fresh-context or parallel specialist review is preferred for workflow-critical or broad designs when the runtime supports it; same-thread review is the portable fallback. Brainstormer-originated findings alone do not satisfy this gate.

For designs that touch `skills/**/*.md` or any workflow-contract surface, the adversarial review must check the `superpowers:writing-skills` dimensions: RED/GREEN baseline obligations, rationalization resistance, red flags, token-efficiency targets, role ownership, and stage-gate bypass paths.

If adversarial review changes the design, `Brainstormer` must commit the revised artifact before approval. Material requirement, ownership, pressure-test, or gate-order changes require rerunning the affected review dimensions or recording why rerun is unnecessary.

If the approval packet is too large to present cleanly, split it into multiple approval requests or sections. Do not collapse it into a vague fallback summary.

If revisions are requested after an approval pass, re-fire approval with delta-only content: include only changed sections or decisions, only requirements changed by those deltas; keep already-approved content authoritative unless it changed.

## Routing table

Every `/superteam` invocation, after pre-flight, routes via an explicit `(detected_phase, prompt_classification)` table. See `routing-table.md` in this skill directory for the complete table, prompt-classification heuristic, resume-not-restart default, and Gate 1 durability rule.

Headline behaviors:

- Default for repeated `/superteam` invocations is **resume**, not restart (R7).
- Ambiguous prompts during an open gate or in-flight phase are classified as **feedback for the active teammate**, never as silent phase advance (R6).
- **Gate 1 is durably observable iff a plan doc has been committed on the branch.** Prior in-session "approve" without a committed plan doc is treated as not-yet-approved on subsequent invocations (R15).

## Teammate contracts

Per-role contracts ship in host-native agent files. SKILL.md owns the orchestration contracts (gates, routing, halt conditions, done-report fields, model-selection grammar) that cross all roles. Each role ships parity files at `agents/<role>.openai.yaml` for Codex; the canonical Claude paths are linked below.

- `Team Lead` — see [.claude/agents/team-lead.md](./.claude/agents/team-lead.md).
- `Brainstormer` — see [.claude/agents/brainstormer.md](./.claude/agents/brainstormer.md).
- `Planner` — see [.claude/agents/planner.md](./.claude/agents/planner.md).
- `Executor` — see [.claude/agents/executor.md](./.claude/agents/executor.md).
- `Reviewer` — see [.claude/agents/reviewer.md](./.claude/agents/reviewer.md).
- `Finisher` — see [.claude/agents/finisher.md](./.claude/agents/finisher.md).

## Missing skill warnings

When `Team Lead` delegates work, the prompt must explicitly recommend the expected `superpowers` skills for that role when relevant. If an expected skill is unavailable in the current environment, say so explicitly in the delegated prompt so both the operator and teammate can see the gap.

Do not silently omit expected skill guidance.

## Done-report contracts

Artifact-producing teammate done reports must anchor on committed handoff state rather than uncommitted workspace state.

### Brainstormer done report

- `design_doc_path`: exact path to the written design doc
- `ac_ids[]`: ordered list of active AC IDs
- `intent_summary`: concise summary of what the artifact changes or decides
- `requirements[]`: full requirement set currently under review
- `adversarial_review_status`: `clean` | `findings dispositioned` | `blocked`
- `reviewer_context`: `fresh subagent` | `parallel specialists` | `same-thread fallback`
- `adversarial_review_findings[]`: findings relevant to approval, with `source`, `severity`, `location`, `finding`, and `disposition`
- `clean_pass_rationale`: required with checked dimensions when no blocker or material findings remain
- `handoff_commit_sha`: commit containing the design artifact used for approval and planning

### Planner done report

- `plan_path`: exact path to the written implementation plan
- `workstreams[]`: short summary of planned batches or workstreams
- `blockers[]`: any blockers preventing execution, or an explicit empty result when none exist
- `handoff_commit_sha`: commit containing the approved implementation plan used for execution

### Executor done report

- `completed_task_ids[]`: explicit task IDs completed in this batch
- `completion_evidence[]`: concrete evidence per completed task
- `head_sha`: current HEAD SHA for the committed implementation and test state being handed to `Reviewer`
- `verification[]`: verification commands and outcomes

### Finisher completion/status report

- `publish_state`: `triage` | `monitoring` | `blocked` | `ready` | `merged`
- `branch`: branch under finish follow-through
- `pr`: PR URL or number
- `latest_pushed_sha`: latest pushed head SHA used for the gate
- `unresolved_actionable_feedback_count`: count of `open_actionable` latest-head feedback items
- `routed_feedback_count`: count of routed feedback items awaiting teammate return
- `required_check_state`: `passing` | `pending` | `failing` | `missing` | `unknown` | `not_applicable`
- `check_status_inventory_state`: `passing` | `non_blocking_with_evidence` | `pending` | `failing` | `missing` | `unknown` | `stale`
- `pending_signals[]`: concise names of checks, statuses, feedback items, or discovery gaps preventing completion
- `completion_gate`: `passed` | `blocked` | `monitoring`
- `completion_evidence[]`: concise evidence for handled feedback and non-blocking classifications when `completion_gate=passed`

## Review and feedback routing

Feedback classifications must be explicit:

1. `implementation-level` findings route to `Executor`
2. `plan-level` findings route to `Planner`
3. `spec-level` findings route to `Brainstormer`

Requirement-bearing feedback does not route straight to implementation. It returns to `Brainstormer`, then to `Planner`, and only then back to `Executor`. This applies to PR feedback, human-test feedback, and direct operator prompts in any detected phase, including `finish`.

Implementation-detail deltas that preserve requirements, ownership, and acceptance intent may route directly to `Planner`.

Feedback routing is same-run state unless the finding is captured in visible durable state such as a committed artifact, plan update, implementation commit, or PR comment. Do not use commit trailers, sidecar files, branch labels, or other hidden markers to persist feedback routing state across sessions.

When a later run resumes with committed implementation work and no PR, and prior local pre-publish findings cannot be proven resolved from visible state, route through `Reviewer` before `Finisher` can publish. `Reviewer` reruns or reconstructs the local pre-publish review from visible artifacts and classifies any remaining findings before routing.

Review interpretation happens at the intake point: `Reviewer` classifies local pre-publish findings; `Finisher` classifies external post-publish PR feedback; `Brainstormer`, `Planner`, and `Executor` own remediation after routing, not primary review intake.

## External feedback ownership

External PR comments, review threads, bot findings, and other repository feedback remain owned by `Finisher`, even when local `Reviewer` findings already exist.

Before resolving comments tied to a prior branch state: verify current state matches the state the comment referred to; do not respond as if nothing changed; re-route requirement-bearing feedback through the spec-first path.

`Finisher` owns PR feedback intake, check monitoring, PR replies, thread resolution where the host supports it, and the final latest-head PR completion gate. Requirement-bearing PR feedback still routes to `Brainstormer`, then `Planner`, then `Executor`; `Finisher` resumes only after that path returns and a fresh latest-head feedback and checks/status sweep passes.

## Latest-head PR completion gate

`Finisher` must run the latest-head PR completion gate after PR creation, after every push, on finish-phase resume, after CI status changes, and immediately before any completion-style handoff. The gate is bound to the latest pushed head SHA. If the head changes during remediation or monitoring, all PR feedback and check/status signals must be refreshed against the new head before completion.

The gate has two required inventories:

1. `latest_head_feedback_inventory`: unresolved review threads, review comments, pull request conversation comments, requested-changes review states, and bot comments or annotations that represent actionable review feedback.
2. `latest_head_check_status_inventory`: every reported check run, status context, required-check signal, mergeability signal, and optional check/status visible for the latest pushed head.

Feedback inventory items are classified as `addressed`, `routed`, `open_actionable`, or `non_blocking`. Completion requires zero `open_actionable` items and zero `routed` items awaiting teammate return.

A PR feedback item is handled only when the workflow has addressed it in code, tests, docs, or workflow contracts and verified the latest head includes the fix; replied to or resolved the thread with a concrete explanation accepted by the classification; routed requirement-bearing feedback through `Brainstormer`, then `Planner`, then `Executor`, and returned to `Finisher` for a fresh latest-head sweep; or classified it as `non_blocking` with evidence that it is stale, duplicate, informational, optional, or not applicable to the latest head. Silence, elapsed time, local intent, PR creation, and green CI are never proof that feedback was handled.

Check/status inventory items must be passing, skipped, neutral, or `non_blocking` with surfaced evidence before completion. Pending, queued, missing, failing, cancelled, timed-out, stale, unknown, or unenumerable required-check state blocks completion. Optional non-passing checks/statuses also block completion unless `Finisher` records and surfaces evidence that they are non-blocking for the latest head.

Completion language is allowed only after the latest-head PR completion gate passes. Otherwise `Finisher` must report `monitoring` or `blocked` with concise counts for unresolved actionable feedback, routed feedback awaiting teammate return, non-passing or unknown check/status signals, and the latest pushed head SHA.

## Rationalization table

| Excuse | Reality |
|--------|---------|
| "The design file probably exists if Brainstormer says it does." | Gate 1 requires verifying the artifact exists at the reported path before approval. |
| "I can summarize the approval request in one short fallback blurb." | Approval packets must include artifact path, concise intent summary, and full requirement set; split oversized packets instead of collapsing them. |
| "I can replay the whole approval request after a small revision." | Re-fired approval after revisions must be delta-only. |
| "Just pick the most likely interpretation and proceed." | Ambiguous or contradictory observable state halts the run with an explicit blocker per `## Failure handling`. Resume requires explicit operator clarification of the intended issue, branch, or phase. Not even when there is a deadline. Not even when an authority claim is cited. |
| "The prompt is short/ambiguous, but the operator clearly meant approval — just advance the gate." | Ambiguous prompts during an open gate are feedback to the active teammate per `routing-table.md`. Approval requires an explicit token (`approve`, `lgtm`, etc.). Not even when an authority claim is cited. Not even when the prior in-session approval feels binding. |
| "We've already done a lot of work on this — restarting would waste it, so let me just keep going from a fresh top-of-workflow." | The default for repeated `/superteam` invocations is **resume**. Restart requires an explicit operator token (`restart`, `start over`, `new run`) per R7. "Pivot, no need to re-confirm" in the prompt is itself the disallowed shortcut. |
| "Gate 1 was approved last session; the operator just told me so — no need to re-open it." | Gate 1 is durably observable iff a plan doc has been committed on the branch (R15). Ephemeral in-session approval is NOT durable. Operator memory is not the durable signal; the committed plan doc is. |
| "Removing `Loopback:` trailers means we can skip local review on a later run." | When implementation exists without a PR and prior local findings cannot be proven resolved from visible state, route through `Reviewer` before `Finisher` can publish. |
| "A direct operator requirement change during finish is not PR feedback, so Finisher can handle it." | Requirement-bearing deltas route spec-first regardless of source. PR feedback, human-test feedback, and direct operator prompts all return to `Brainstormer`, then `Planner`, then `Executor` before `Finisher` ready/shutdown can resume. |
| "The PR exists, so Superteam can report complete." | PR creation is not completion. `Finisher` must run the latest-head PR completion gate before completion language. |
| "CI is green, so the review comments must be handled." | Green CI alone is not evidence that PR feedback was addressed. Latest-head feedback inventory must have zero `open_actionable` items and zero routed items awaiting teammate return. |
| "One status snapshot was green before the last push." | Completion evidence is head-relative. Every new push invalidates older feedback/check snapshots and requires a fresh latest-head sweep. |
| "The optional check is failing, but required checks passed." | Optional non-passing reported checks/statuses still block completion unless `Finisher` records and surfaces evidence that they are non-blocking for the latest head. |
| "The check API was ambiguous, so assume it is fine." | Unknown, unenumerable, stale, missing, or ambiguous required-check state is not success. Report `monitoring` or `blocked` instead of complete. |
| "No execution-mode tool is available, so every `/superteam` invocation must halt." | Missing execution capability blocks only routes that require execute-phase delegation. Approval, review, and `Finisher` status work can continue through their owning teammate. |
| "We can replace `Loopback:` trailers with another hidden marker." | Feedback routing must resume from visible artifacts, PR state, and operator prompts; do not add sidecar state, branch labels, or new commit footers. |
| "The operator said 'faster' / 'this is taking forever' — that's basically asking for inline." | Inline is auto-selected NEVER. Only unambiguous tokens (`inline`, `run inline`, `execute in this session`) are operator overrides per R14. Ambiguous framing is not. Not even when the CTO is cited. Not even under deadline pressure. |
| "It's simpler to just route through `superpowers:executing-plans` and let it ask the developer." | Execute-phase delegations bind directly to the chosen execution-mode skill per R14. Routing through `superpowers:executing-plans` on default paths surfaces a redundant prompt to the developer and is forbidden when the resolved mode is `team mode` or `subagent-driven`. |
| "The parent model is fine, just inherit." | Per-role defaults are binding (R26). Silent inheritance is forbidden for every role except `Team Lead`. The operator's silence on which model to use is NOT permission to inherit — it means "use the per-role default". The only path to inheritance is the host runtime lacking a model-override mechanism, in which case `Team Lead` inherits-and-warns once per run. |
| "The operator said 'go faster' — that's basically asking for Sonnet." | Ambiguous framing is NOT an operator override (R26, parallel to R14). Only canonical tokens (`model: opus`, `model: sonnet`, `model: haiku`, or `use <model>` / `with <model>`) override the per-role default. "Go faster" routes to the per-role default; for `Executor` that is already Sonnet. |
| "Brainstormer's default is Opus, but the operator typed `model: sonnet`, so I'll keep Opus because the design needs reasoning." | Operator override always wins for the delegation it targets. `Team Lead` does not second-guess the operator's explicit token. Override scope is the next delegation only. |
| "The operator is on the default branch on purpose; they clearly meant to start work here." | When the active issue resolves from the operator prompt and the current branch is the repository default branch, pre-flight MUST auto-switch to the per-issue branch before committed-artifact inspection. Operator intent is captured by the `#<n>` reference, not by the branch they happened to be on. Not even when the operator is the maintainer. Not even under deadline pressure. |
| "The operator forgot to type `new branch`, so stay on detached HEAD or an unborn worktree." | `new branch` is not the trigger. An explicit issue in a normal Superteam prompt is enough. Detached `HEAD`, unborn branch, and default-branch states MUST auto-switch before committed-artifact inspection. |
| "This non-default branch is not for the issue, but auto-switching is probably fine." | A conflicting non-default branch is not a brand-new worktree signal. Halt for disambiguation instead of silently replacing the operator's branch context. |
| "Skipping the auto-switch saves a step; we can branch later." | Skipping authors Gate 1 artifacts on the wrong base and forces `Finisher` to rewrite history or push from the default branch. The rule is not optional. |
| "Dirty working tree? I can stash and continue." | The `superteam` issue-branch procedure refuses on a dirty working tree. `superteam` halts with `superteam halted at Team Lead: dirty working tree blocks auto-switch to issue branch`. Pre-flight does NOT stash on the operator's behalf. |
| "Rebase conflict on the existing issue branch is fine; I'll abort and try again." | The `superteam` issue-branch procedure forbids `git rebase --abort` on the operator's behalf. `superteam` halts and surfaces the conflict. |
| "We can skip the self-contained branch procedure because another plugin probably has it." | `superteam` pre-flight is portable and owns its issue-branch procedure. Do not depend on another workflow skill being installed. |
| "`adversarial_review_findings[]` already has Brainstormer entries, so review happened." | Brainstormer-originated findings are useful but not sufficient. Gate 1 requires an explicit adversarial-review pass against the committed artifact. |
| "No findings means no review evidence is needed." | A clean adversarial-review result must include `reviewer_context`, checked dimensions, and `clean_pass_rationale`; silence is not evidence. |
| "This is a workflow-contract design, but a generic review is enough." | Designs touching `skills/**/*.md` or workflow-contract surfaces require the `superpowers:writing-skills` review dimensions: RED/GREEN baseline obligations, rationalization resistance, red flags, token-efficiency targets, role ownership, and stage-gate bypass paths. |
| "A finding changed the design, but the earlier review still applies." | Material requirement, ownership, pressure-test, or gate-order changes require rerunning affected review dimensions or recording why rerun is unnecessary. |
| "Natural prose means we can omit required Gate 1 evidence." | Natural prose changes rendering, not evidence. Required review status, reviewer context, checked dimensions, and clean-pass rationale must still exist before planning. |
| "The shipped agent file already says it; I can prune it from SKILL.md too." | Orchestration invariants (gates, done-report contracts, routing, halt conditions) STAY in SKILL.md and are referenced from agent files. Per-role procedure moves; cross-role invariants do not. |
| "The project delta replaces the shipped system prompt because the project knows better." | Deltas are append-only. There is no `replace` mode. Stripping shipped guardrails is forbidden by design. |
| "I applied a delta but it's the same as the default, so I don't need to log it." | Delta application is always logged: `superteam delta applied`, `superteam delta empty`, or (during pre-flight) `superteam delta orphan`. Silent layering is forbidden. |
| "The host doesn't have a per-role agent file shipped yet, so I'll just guess from the Claude file." | Missing host-file is a logged fallback to portable defaults plus plugin-level prompt only. Do not silently apply a different host's agent file. |
| "The malformed delta probably means model: sonnet — I'll just use that." | Malformed delta values halt with `superteam halted at Team Lead: project delta for <role> has invalid model value <value>`. No interpretation, no guess, no default-substitution. |
| "Empty delta file means the project is unfinished — I'll fall back to no override and not log." | Empty deltas are an intentional anchor; they are a no-op AND they log `superteam delta empty: <role>` so future operators see the file was inspected. |
| "A project delta append treats acceptance-criteria IDs as advisory — it's a project preference, I should respect it." | Forbidden by LC5 + the D1 non-negotiable-rules block. The denylist lint halts dispatch on any forbidden-intent token (see [`project-deltas.md`](./project-deltas.md#forbidden-append-denylist-lc5)); paraphrase-bypass is countered by the agent file's first-body-section structural defense. |
| "The active host probe is ambiguous, I'll guess Claude Code." | Forbidden. D3 specifies a deterministic probe order (`CLAUDECODE` env vars → `CODEX_*` env vars → runtime self-id). First match wins; result logged. No guessing. |
| "The append redefines a done-report field, but it's clearer than SKILL.md's version." | Forbidden by LC5. Done-report contracts are SKILL.md-owned invariants. Lint halts. |
| "An append-only delta tells Executor it may push for our repo's special workflow." | Forbidden by LC4. Push authority is in Executor's non-negotiable rules block; denylist lint matches `may push` / `may open PR` / `may merge`. |
| "The host has no shipped per-role file, I'll fall back to the plugin-level prompt for every role." | Out-of-supported-set hosts halt at pre-flight; there is no silent per-delegation degradation. |

## Red flags

- Using older stage-only language where the canonical teammate roster should be used.
- Asking for design approval before verifying the cited artifact exists.
- Approval requests that omit the artifact path, concise intent summary, or full requirement set.
- Gate 1 approval packet has `adversarial_review_findings[]` entries but no evidence that an adversarial-review pass occurred.
- Adversarial review reports `clean` without `reviewer_context`, checked dimensions, or `clean_pass_rationale`.
- `Planner` starts while a blocker or material `adversarial_review_findings[]` item remains open.
- Brainstormer-originated findings are treated as a replacement for adversarial review.
- Workflow-contract design approval proceeds without the `superpowers:writing-skills` adversarial-review dimensions.
- Oversized approval requests collapsed into a vague summary instead of split into clean sections.
- Approval requests that hide real approval-relevant findings.
- Replaying already-approved content instead of sending delta-only approval after revisions.
- Touching governed files without canonical-rule discovery from repository guidance.
- Delegated teammate prompts that omit expected `superpowers` recommendations or fail to warn when an expected skill is unavailable.
- `Team Lead` continuing past contradictory branch / artifact / PR state without halting.
- Resolving execution-mode capability without running the deterministic probe order in `pre-flight.md`.
- Classifying an ambiguous prompt during an open gate as approval rather than feedback.
- Restarting a run on a repeated `/superteam` invocation without an explicit operator restart token or an unambiguous new-issue signal.
- Treating a prior in-session "approve" as Gate 1 approval when no plan doc has been committed on the branch.
- Silently switching issues mid-run when the prompt names a different issue without explicit operator confirmation.
- Reintroducing required `Loopback:` commit trailers or another hidden workflow-state marker.
- Fresh-session resume from implementation work with no PR skipping `Reviewer` before `Finisher` publication when local review resolution is not visible.
- `Finisher` reports complete while any latest-head feedback inventory item is `open_actionable` or `routed` awaiting teammate return.
- `Finisher` reports complete while any latest-head required check/status is pending, queued, missing, failing, cancelled, timed out, stale, unknown, or unenumerable.
- `Finisher` reports complete while an optional non-passing check/status lacks surfaced non-blocking evidence.
- `Finisher` classifies PR feedback as handled based on silence, elapsed time, local intent, PR creation, or green CI.
- A new push lands after feedback/check inventory and `Finisher` does not refresh the latest-head gate before completion.
- Codex and Claude Code Finisher role surfaces diverge on the latest-head PR completion gate.
- An execute-phase delegation prompt that names `superpowers:executing-plans` as the entry skill when the resolved mode is `team mode` or `subagent-driven`.
- An execute-phase delegation that omits the resolved execution mode and asks the developer to choose.
- Treating ambiguous "faster" / "inline-ish" / "forever" framing as an inline override.
- Halting a non-execute route solely because execution-mode capability is unavailable.
- `Team Lead` proceeding to committed-artifact inspection while the current branch is the repository default branch and the active issue was resolved from an explicit `#<n>` in the prompt.
- `Team Lead` proceeding to committed-artifact inspection while the current branch is detached `HEAD` or unborn and the active issue was resolved from an explicit `#<n>` in the prompt.
- `Team Lead` requiring the operator to type `new branch` before auto-switching from a default, detached, or unborn worktree state for an explicit issue.
- `Team Lead` silently switching away from a conflicting non-default branch instead of halting for issue disambiguation.
- `Team Lead` performing `git stash` or any auto-stash variant as part of the auto-switch path.
- `Team Lead` running `git rebase --abort` after a rebase conflict on the existing issue branch.
- `pre-flight.md` depending on an external branch workflow instead of the self-contained issue-branch procedure.
- `Team Lead` silently continuing on the default branch after `gh repo view` fails to resolve the default branch.
- A `superteam` run authoring `docs/superpowers/specs/...` on the default branch.
- A teammate delegation that omits a resolved `model` value (or omits the host's model-override parameter on the dispatch surface) when the per-role default is `opus`, `sonnet`, or `haiku`. Inheritance is reserved for `Team Lead` and for the inherit-and-warn capability fallback; every other delegation MUST carry an explicit model on the dispatch surface.
- Treating "go faster" / "use the cheap model" / "use the better model" / similar fuzzy framing as an operator model override.
- An execute-phase delegation that resolves `{model}` to the parent session model by default rather than to the per-role `Executor` default (`sonnet`).
- A per-role procedural rule appears in `SKILL.md` after the refactor (it should be in the role's agent file under [`## Teammate contracts`](#teammate-contracts)).
- A delta applied silently (no `superteam delta applied: <role> (...); non-negotiable-rules-sha=<prefix>` audit line on the operator-facing chat surface, with stderr fallback only when chat is unavailable).
- A project delta uses a section heading outside the closed documented set `{ ## Model, ## Tools, ## System prompt append }`. Any other top-level heading is "undocumented" and is ignored with a warn — the determination is mechanical, not judgmental.
- A malformed delta is interpreted ("looks like sonnet") instead of halting.
- Team Lead delegates without first probing and logging the active host. "Active host" is determined deterministically by D3's probe order (`CLAUDECODE` env vars → `CODEX_*` env vars → runtime self-id) and the result is logged at pre-flight as `superteam active host: <name> (probe=<source>)`. A delegation with no preceding probe-log line is a red flag.
- The active host is outside the supported set `{ claude-code, codex }` and Team Lead delegates anyway instead of halting at pre-flight.
- The plugin-level `agents/openai.yaml` is treated as a per-role config surface (it is plugin-level metadata; per-role files are `agents/<role>.openai.yaml`).
- An orphan `docs/superpowers/<unknown>.md` file is silently used to override an unintended role.
- A dispatch audit line is missing the `non-negotiable-rules-sha=<prefix>` field.
- A delta append textually contains a denylist token and dispatch did NOT halt.

## Shutdown

Finisher owns shutdown; no run is complete until the shutdown contract returns success on the latest pushed head. The shutdown checklist lives in [.claude/agents/finisher.md](./.claude/agents/finisher.md). Team Lead enforces shutdown as an orchestration gate: a run that has not produced a Finisher success-only shutdown is not complete, regardless of in-session signals.

## Failure handling

Any unsatisfied gate or failed teammate contract should halt the run and report:

`superteam halted at <teammate or gate>: <reason>`

Do not silently continue past failed checks, missing artifacts, ambiguous repository state, or unresolved publish-state feedback.

## Success criteria

A successful run routes from observable state, preserves committed handoffs, publishes a PR, and either reaches latest-head shutdown readiness or halts with an explicit blocker.

## Supporting files

- [.claude/agents/](./.claude/agents/): shipped per-role Claude Code subagent files.
- [agents/](./agents/): plugin metadata (`openai.yaml`) and per-role Codex parity files (`<role>.openai.yaml`).
- `docs/superpowers/<role>.md` in the consuming repo: project override surface (see `## Project deltas (Team Lead lookup)`).
- `docs/project-overrides.md` in this repo: operator-facing authoring guide for project delta files (schema, examples, edge-case table).
- [project-deltas.md](./project-deltas.md): Team Lead supporting reference — literal denylist tokens, halt/audit-log format strings, active-host probe order, and the `resolve_role_config` algorithm body. SKILL.md names every rule; this file carries the literal bodies.
- [pre-flight.md](./pre-flight.md): phase-detection sequence, execution-mode capability detection, halt conditions
- [routing-table.md](./routing-table.md): phase x prompt-class routing, classification heuristic, resume vs restart, Gate 1 durability
- [workflow-diagrams.md](./workflow-diagrams.md): canonical chronological and orchestration diagrams
