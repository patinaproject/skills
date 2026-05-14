# Add Non-Interactive Superteam Command for GitHub Actions Design

Issue: #71

## Intent

Add a CI-safe Superteam entry point named `superteam-non-interactive` that ships
with the existing Patina Project skills plugin. The new skill must preserve the
Superteam workflow contract while replacing chat-time prompts with explicit
inputs and fail-fast blockers.

## Requirements

- AC-71-1: A new installable skill exists at
  `skills/superteam-non-interactive/` with `name: superteam-non-interactive`.
- AC-71-2: The skill is discoverable from both Claude and Codex plugin
  manifests, and from the local `.agents/skills/` and `.claude/skills/`
  overlays.
- AC-71-3: The skill defines a non-interactive input contract for issue
  resolution, design approval policy, publish permission, and draft PR policy.
- AC-71-4: The skill explicitly forbids prompts, implicit approvals, skipped
  adversarial review, and completion before the latest-head PR gate passes.
- AC-71-5: Repository docs and verification scripts describe six in-repo skills
  and include the new skill in marketplace packaging.

## Design

Implement `superteam-non-interactive` as a sibling skill rather than a new
plugin. This keeps the command discoverable as its own entry point while
packaging it with `patinaproject-skills`, the same distribution surface that
already ships `superteam`.

The new skill should not duplicate all Superteam role contracts. It should load
and reuse the existing `superteam` references, then layer the non-interactive
policy on top:

- resolve required context from prompt tokens, environment variables, or branch
  state;
- halt instead of asking the operator;
- require explicit CI policy inputs before advancing Gate 1 or publishing;
- preserve branch switching, dirty-worktree refusal, model selection, execution
  mode, project deltas, feedback routing, and Finisher shutdown.

This keeps RED/GREEN behavior narrow: an agent that would otherwise ask
"which issue?" or "approve this design?" now has a documented blocker format and
the exact input needed to proceed.

## Adversarial Review

Review dimensions checked: RED/GREEN baseline obligations, rationalization
resistance, red flags, token efficiency, role ownership, and stage-gate bypass
paths.

Findings:

- `clean`: The design adds a separate entry point without weakening existing
  `superteam` gates.
- `clean`: The CI approval path requires explicit policy input and clean or
  dispositioned Gate 1 evidence, avoiding silent approval.
- `clean`: Finisher remains the only publishing owner and publish requires an
  explicit non-interactive policy input.

## Decision

Proceed with a compact sibling skill, marketplace manifest updates, overlay
symlinks, documentation updates, and dogfood verification updates.
