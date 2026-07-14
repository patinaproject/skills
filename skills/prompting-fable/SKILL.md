---
name: prompting-fable
description: Guidelines for prompting and configuring Claude Fable 5. Use when the user asks how to prompt Fable or get more out of it, picks a reasoning effort, writes a run-until-done goal prompt, chooses between a workflow, subagents, or session-orchestrated worktrees, or tunes a CLAUDE.md glossary or model-routing rules for Fable-driven work.
---

# Prompting Fable

Check the work at hand against every section below, not only the one that
prompted the lookup.

## Prompt for distance, not difficulty

Fable is not a better Opus, and Opus-era prompts underuse it. Its edge is
**distance** — how far one prompt travels end to end (implement, test, verify,
decompose to subagents) — not how hard a single step can be. Shape prompts for
distance:

- State the outcome, then enumerate the exact categories the answer must sort
  into ("ready to merge / needs a rebase / trumped / scrap and rewrite"), so
  the report comes back decision-shaped.
- Grant orchestration explicitly: "use a workflow to break the work across
  multiple reviewers."
- Unsure how to structure the work? Ask the model to lay out the streams of
  work before starting any of them — it pushes back well ("a single workflow
  is the wrong tool for this umbrella"), and the answer aligns you both
  before tokens are spent.

## Cap reasoning effort at high

Effort is per-step, not per-run: any effort can work for hours, and xhigh/max
only think more per step. Most steps need no deep thought, so those tiers
second-guess themselves in loops and return overdone diffs at a multiple of
the cost. Even Ultracode runs its fleets on high. Stay in low–high; default
high.

## Goals: run until the conditions pass

For a backlog-sized program of work, prompt a **goal** — keep going until the
conditions pass — with three parts:

- **Conditions**: a checkable done-state, e.g. every item in `to-do.md` done,
  marked off and committed as the work lands.
- **Permissions**: enumerate what it may do unasked — create worktrees,
  branch, rebase, merge, close PRs. An unlisted permission is a stall waiting
  to happen.
- **Gates**: the checkpoints that stay non-negotiable — automated reviewers
  must approve before any merge; production deploys stay human. The autonomy
  is safe because the gates are, not because the model is.

## Match orchestration to checkpoints

- **Workflow** for deterministic fan-out-and-verify: triage N items, judge
  panels, multi-agent review passes. Don't pre-define reviewer subagent
  archetypes; Fable invents the right ones per task.
- **Session-orchestrated worktrees** for checkpoint-driven programs, where
  each unit needs CI, human review, or a product call before the next step.
  One giant workflow either barrels past the checkpoints or stalls at the
  first one.
- Inside a checkpointed program, drop back to workflows only where they are
  strong: the multi-agent review pass before each merge.

## Route models by glossary, not price

The highest-value CLAUDE.md addition is a **glossary**: the terms you judge
work by, written down so the model applies your meanings instead of guessing.
This skill ships one — [glossary.md](glossary.md) defines the judging axes
(cost, intelligence, taste) and carries Theo's worked model scores. When
setting up routing, copy it into the CLAUDE.md and re-score it for the models
and subscriptions at hand, then route:

- Bulk mechanical work — clear-spec implementation, log digging, giant PDFs,
  migrations, computer use — goes to the cheapest model that clears the
  intelligence bar, shelled out through its CLI.
- Anything user-facing — UI, copy, API design — needs high taste.
- Plan and implementation reviews need top intelligence; a cheaper model is
  optionally one extra independent perspective.

Scores are defaults, not limits: give standing permission to rerun with a
smarter model when a cheaper one's output misses the bar. Judge the output,
not the price tag — escalating costs less than shipping mediocre work. Spend
cheap tokens gathering information; never let cost pick the model for what
ships.

When work actually leaves Claude — shell-outs, and the wrapper pattern that
gets a non-Claude model into workflows and subagents — wire it per
[delegation.md](delegation.md).

## Read time-to-fix as an architecture signal

Judge a spawned fix by how long it took, not only by its diff: a few minutes —
simple, merge without guilt; a quarter hour — pay attention; an hour or more —
the problem is architectural, don't blindly merge. A suspiciously fast fix
that describes things the codebase doesn't have is the same signal inverted —
interrogate it.

## Grow the harness from failures

Get a CLAUDE.md section or skill roughly working in half an hour, then let
failures write the rest: when the model misfires, ask it what it got wrong and
what line would have prevented it, cut the suggestion in half, and append. Pin
exact CLI commands in skills — the occasional wrong invocation costs more than
the lines. And put the whole fire/don't-fire decision in a skill's
description: the model sees nothing else until it fires.
