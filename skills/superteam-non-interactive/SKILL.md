---
name: superteam-non-interactive
description: Use when running Superteam in GitHub Actions, CI, headless automation, or any one-shot environment where prompts, confirmations, or interactive gate decisions would hang the job.
---

# superteam-non-interactive

`superteam-non-interactive` is the CI-safe Superteam entry point. It reuses the
`superteam` teammate contracts, but changes operator interaction into a strict
fail-fast input contract so GitHub Actions can run without hanging.

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
6. Before any place where `superteam` would ask the operator, require a
   provided input, deterministic default, or visible durable state. If none
   exists, halt with a machine-actionable blocker.

## Non-Interactive Rules

- Never ask a question, wait for approval, present choices, or rely on a future
  chat reply.
- Never infer missing required context from vibes. Halt instead.
- Use normal Superteam branch switching, dirty-worktree refusal, project delta
  handling, model selection, execution-mode binding, feedback routing, and
  latest-head shutdown.
- Treat ambiguous operator text as a blocker, not feedback.
- Prefer explicit invocation inputs over environment variables; prefer
  environment variables over repository state.
- Output concise status lines that CI logs can preserve: current phase, issue,
  branch, PR if any, blocker if any, and verification evidence.

## Inputs

At minimum, one issue source must be present:

- Prompt token: `#71`
- Environment: `SUPERTEAM_ISSUE=71`
- Branch: `71-kebab-title`

Optional CI policy inputs:

- `SUPERTEAM_APPROVE_CLEAN_DESIGN=1`: lets Gate 1 advance only when the design
  artifact exists, adversarial review is clean or dispositioned, and no
  approval-blocking finding remains.
- `SUPERTEAM_ALLOW_PUBLISH=1`: permits Finisher to push and open or update the
  PR after local review passes.
- `SUPERTEAM_DRAFT_PR=1`: asks Finisher to create a draft PR when publishing.

Unset optional policy inputs mean "not permitted." Do not prompt to enable them.

## Gate Behavior

Gate 1 remains real. In non-interactive mode:

- No design exists: Brainstormer may write and commit one.
- Design exists but no plan exists: Team Lead may advance to Planner only
  when `SUPERTEAM_APPROVE_CLEAN_DESIGN=1` and the normal Gate 1 evidence is
  clean or dispositioned.
- Gate 1 evidence is blocked, missing, or ambiguous: halt with
  `superteam halted at Gate 1: <reason>`.
- Plan exists: execution may continue from the committed plan without a chat
  approval prompt.

Publish behavior remains Finisher-owned. Finisher may push or open a PR only
when `SUPERTEAM_ALLOW_PUBLISH=1`; otherwise halt with the exact publish action
that would have been taken.

## Halt Format

Every non-interactive blocker must be explicit:

```text
superteam halted at <teammate or gate>: non-interactive input missing: <input>
```

For CI readability, include a final `next_input:` line when one value would
unblock the run.

## Red Flags

- Prompting the operator in a GitHub Actions run.
- Silently treating missing approval as approval.
- Skipping adversarial design review because the run is headless.
- Publishing without `SUPERTEAM_ALLOW_PUBLISH=1`.
- Reporting complete before the latest-head PR completion gate passes.
