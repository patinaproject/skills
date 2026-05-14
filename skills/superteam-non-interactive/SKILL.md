---
name: superteam-non-interactive
description: Use when running Superteam in GitHub Actions, CI, headless automation, or any one-shot environment where prompts, confirmations, or interactive gate decisions would hang the job.
---

# superteam-non-interactive

`superteam-non-interactive` is the CI-safe Superteam entry point. It reuses the
`superteam` teammate contracts, but removes human-in-the-loop pauses so GitHub
Actions can keep running without waiting for chat approval, confirmation, or
follow-up choices.

## Quick start

Use this skill when the operator invokes `/superteam-non-interactive`, asks for
Superteam in GitHub Actions, or requests a headless one-shot Superteam run.

1. Load the sibling Superteam files from `skills/superteam/`: `SKILL.md`,
   `pre-flight.md`, `routing-table.md`, and `project-deltas.md`.
2. Resolve the issue from an explicit `#<number>`, `SUPERTEAM_ISSUE`, or the
   current branch name. If none exists, halt.
3. Run the normal Superteam pre-flight with `interaction_mode=non-interactive`.
4. Route to the owning teammate using the normal Superteam routing table.
5. Before delegation, load the routed teammate contract from
   `skills/superteam/agents/` or `skills/superteam/.claude/agents/`.
6. Before any place where `superteam` would ask the operator, use the
   non-interactive autonomy rules below. Do not stop solely to wait for a human
   approval, confirmation, or policy choice.

## Non-Interactive Rules

- Never ask a question, wait for approval, present choices, or rely on a future
  chat reply.
- Never infer missing required context from vibes. Use only invocation inputs,
  environment variables, repository state, host capabilities, and the autonomy
  defaults documented here.
- Never halt just because an interactive Superteam run would have asked a human
  to approve, choose, confirm, or continue. In non-interactive mode, convert
  those points into deterministic action, explicit safe defaults, or a
  machine-actionable blocker.
- Use normal Superteam branch switching, dirty-worktree refusal, project delta
  handling, model selection, execution-mode binding, feedback routing, and
  latest-head shutdown.
- Treat ambiguous operator text or conflicting durable state as a blocker, not
  as a request for clarification.
- Prefer explicit invocation inputs over environment variables; prefer
  environment variables over repository state.
- Output concise status lines that CI logs can preserve: current phase, issue,
  branch, PR if any, blocker if any, and verification evidence.

## Autonomy Defaults

Unset policy inputs must not create a human approval stop. Apply these defaults
unless an explicit input overrides them:

- Gate 1: auto-advance a clean or fully dispositioned design. The normal
  Superteam evidence remains required, including a real adversarial review and
  no approval-blocking finding.
- Design findings: route fixable design findings back to `Brainstormer` in the
  same run. Halt only when a finding remains blocked after the routed teammate
  has acted or the blocker is not resolvable by the workflow.
- Publishing: allow `Finisher` to push, create, or update the PR when the host
  token and branch permissions allow it. `SUPERTEAM_ALLOW_PUBLISH=0` is the
  opt-out for dry-run or diagnosis jobs.
- PR shape: create draft PRs by default. `SUPERTEAM_DRAFT_PR=0` requests a
  ready-for-review PR after local review passes.
- CI and feedback: if checks are pending, queued, or temporarily unavailable,
  report `monitoring` with latest-head evidence and exit without asking for a
  human. A later run resumes the latest-head gate.
- Merge: do not merge by default. Merging requires an explicit repository
  automation outside this skill or a future documented input.

## Inputs

At minimum, one issue source must be present:

- Prompt token: `#71`
- Environment: `SUPERTEAM_ISSUE=71`
- Branch: `71-kebab-title`

Optional CI policy inputs:

- `SUPERTEAM_APPROVE_CLEAN_DESIGN=0`: disables automatic Gate 1 advancement and
  turns a clean design into a blocker for diagnosis. The default is `1`.
- `SUPERTEAM_ALLOW_PUBLISH=0`: prevents Finisher from pushing or opening/updating
  a PR. The default is `1`.
- `SUPERTEAM_DRAFT_PR=0`: asks Finisher to create a ready-for-review PR when
  publishing. The default is `1` (draft).

Unset optional policy inputs use the autonomy defaults above. Do not prompt to
enable or confirm them.

## Gate Behavior

Gate 1 remains real. In non-interactive mode:

- No design exists: Brainstormer may write and commit one.
- Design exists but no plan exists: Team Lead advances to Planner when the
  normal Gate 1 evidence is clean or dispositioned. This is the non-interactive
  replacement for a human `approve` token.
- Gate 1 evidence is missing: generate or rerun the missing evidence when the
  workflow can do so. Halt only if the evidence cannot be produced by the
  current run.
- Gate 1 evidence is blocked or ambiguous: route fixable issues back to
  `Brainstormer`; halt only for unresolved material blockers with
  `superteam halted at Gate 1: <reason>`.
- Plan exists: execution may continue from the committed plan without a chat
  approval prompt.

Publish behavior remains Finisher-owned. Finisher may push or open a PR only
when local review has passed and host permissions allow the operation. If
`SUPERTEAM_ALLOW_PUBLISH=0`, halt with the exact publish action that would have
been taken.

## Halt Format

Every non-interactive blocker must be explicit and machine-actionable:

```text
superteam halted at <teammate or gate>: non-interactive blocker: <reason>
```

For CI readability, include a final `next_run:` line when a later run could
resume automatically, or `next_input:` only when a concrete machine-provided
input (not a human approval) would unblock the run.

## Red Flags

- Prompting the operator in a GitHub Actions run.
- Silently treating missing approval as approval.
- Halting for `SUPERTEAM_APPROVE_CLEAN_DESIGN` or `SUPERTEAM_ALLOW_PUBLISH`
  being unset.
- Skipping adversarial design review because the run is headless.
- Treating a blocked or ambiguous Gate 1 review as approved.
- Publishing after `SUPERTEAM_ALLOW_PUBLISH=0`.
- Reporting complete before the latest-head PR completion gate passes.
