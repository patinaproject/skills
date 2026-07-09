---
name: harden-branch
description: "Ready a branch for human review with two ordered settle-phases — deepen its architecture, then review it to green. Use when finishing issue work before a PR, when readying any branch for review on its own, or when a controller skill needs the pre-PR quality gate."
---

# Harden Branch

## Quick Start

Invoke on the branch you want to ready for review:

```text
/harden-branch
```

**Harden** the current branch into something a human only ever sees once it is
structurally settled and self-reviewed. Two ordered settle-phases run in
sequence:

1. **Deepen until settled** — improve the branch's architecture.
2. **Review until green** — review the branch's diff for standards and spec conformance.

Deepen runs **before** review so the review judges the final, structurally
settled code rather than an intermediate shape.

This skill assumes the branch's build is already complete and committed; it
fixes and deepens, it does not build the issue from scratch. It commits the
fixes its phases produce. It does not push or open a pull request — `finish-pr`
owns publishing.

## Required Child Skills

- `code-review`: two-axis Standards + Spec branch-diff review via parallel report-only sub-agents.
- `implement`: apply accepted deepenings and clear behavior-change findings — reaches `tdd` at agreed seams and `code-review` when done.
- `diagnosing-bugs`: unclear root cause, missing reproduction, flaky behavior, or performance regressions.
- `codebase-design`: the deep-module vocabulary and principles Phase 1 deepens against (reference, not invoked).

If any are missing, halt before running and report the missing skill names and
install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@implement -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@code-review -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@diagnosing-bugs -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@codebase-design -y
```

## Phase 1 — Deepen until settled

Surface architectural friction in the branch's changes and apply the deepenings
that clearly earn their place, re-running until a pass finds nothing more — that
zero is the settle signal. Deepening runs **before** review so Phase 2 judges the
settled shape.

Work in the **deep-module vocabulary** and its principles — **module**,
**interface**, **depth** (**deep**/**shallow**), **seam**, **adapter**,
**leverage**, **locality**, and the **deletion test** — from the vendored
`codebase-design` skill; use those terms exactly rather than drifting into
"component," "service," "API," or "boundary." Read the domain glossary
(`CONTEXT.md`, if any) and the ADRs in `docs/adr/` for the area you are touching
first, so deepenings use the project's names for seams and do not re-litigate
recorded decisions.

**Explore, branch-scoped.** Use the Agent tool with `subagent_type=Explore` to
walk the branch's changes plus the unchanged neighbours they interface with —
read past the diff hunks. Note where you feel friction:

- Understanding one concept means bouncing between many small modules.
- A module is **shallow** — its interface is nearly as complex as its
  implementation.
- Pure functions were extracted for testability, but the real bugs hide in how
  they are called (no **locality**).
- Tightly-coupled modules leak across their seams.
- Part of the change is untested or hard to test through its current interface.

Apply the **deletion test** to anything you suspect is shallow: would deleting
the module concentrate complexity across its callers, or just move it?
"Concentrates" is the signal to deepen.

**Accept conservatively, then loop.** Accept a deepening only when it passes the
deletion test, increases **depth**, improves **locality** or the test surface,
and folds into this branch without sprawling into unrelated code. Reject
speculative generality, pass-throughs that only move complexity, and anything
that complicates the interface instead of hiding complexity behind it. **Default
to reject when uncertain** — a conservative gate terminates instead of
gold-plating the branch. Route each accepted deepening to `implement` (which
reaches `tdd` at agreed seams), then re-run the pass; repeat until a pass accepts
**zero**.

- Run repository-documented verification after each round of applied deepenings.

## Phase 2 — Review until green

Run `code-review` against the branch diff. Route its findings through the
Finding Router below. Re-run `code-review` after applying fixes. Repeat until no
blocking findings remain — that is **green**.

- **Drive it unattended.** Compute the review base — resolve the repository
  default branch (`gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`,
  or `git rev-parse --abbrev-ref origin/HEAD` stripped of its leading `origin/`),
  then take its merge-base (`git merge-base origin/<default-branch> HEAD`) — and
  give it to `code-review` as the fixed point, so it never pauses to ask for one.
  Let its **Spec** axis auto-discover the originating issue from the branch's
  commit refs; when none is found, instruct `code-review` to **skip the Spec
  axis rather than prompt** — this overrides its default of asking where the spec
  is, keeping the run unattended. Invoking `harden-branch` (or a controller that
  reaches it) is sufficient approval to run it; do not ask for another
  confirmation.
- **Map the two axes to the gate.** `code-review` reports along **Standards**
  (documented conventions plus a Fowler smell baseline) and **Spec** (does the
  diff implement the issue). Treat as **blocking**: Standards hard violations
  (documented-standard breaches) and Spec missing, partial, or wrong-requirement
  findings. Treat as **non-blocking**: judgement-call smells and benign
  scope-creep notes (the diff did a little more than asked). A scope finding
  whose resolution needs a product or scope decision is different — route it
  `ready-for-human` per the Finding Router. Green is no blocking findings left.
- **Keep fixes out of the reviewer.** `code-review` runs its axes as
  report-only sub-agents; apply every fix through `implement` or
  `diagnosing-bugs`, never inside a reviewer sub-agent.
- Halt if `code-review` cannot resolve the fixed point or spawn its sub-agents.
- Run repository-documented verification before declaring the branch green.

This gate reviews standards and spec conformance, not general correctness:
correctness, security, and data-loss risks are covered after the PR opens by the
hosted review workflow and by the repository's tests.

Residual risk: a Phase-2 fix can in principle introduce new shallowness. Accept
that risk rather than re-coupling the phases into one interleaved loop — review
fixes rarely create `Strong` deepening opportunities, and the autonomous rubric
rejects when uncertain.

## Finding Router

Classify each finding into exactly one outcome:

| Outcome | Use When | Next Action |
|---|---|---|
| `ready-for-agent` | The expected behavior is clear or evidence can be gathered locally | Route clear behavior changes to `implement`; route unclear root cause, missing reproduction, flaky behavior, or performance regression to `diagnosing-bugs` |
| `ready-for-human` | The finding needs judgment, external access, manual testing, design input, missing information, changed scope, product decisions, permissions, conflicting direction, or valid work outside the branch | Stop the loop and report the blocker with evidence |
| `wontfix` | The finding is stale, incorrect, conflicts with repository rules, or is intentionally rejected | Explain politely in the report; add a concise code comment only when a future reviewer would otherwise re-raise the same concern |

Insufficient information maps to `ready-for-human`. A `ready-for-human` finding
stops Phase 2 before green; report it as a human-owned blocker.

## Final Report

Write for the caller, leading with whether the branch is hardened:

- Phase 1: rounds run and deepenings applied, or that it settled with zero
  candidates on the first pass.
- Phase 2: review result and finding dispositions; name the blocker if it
  stopped on a `ready-for-human` finding.
- Verification result, collapsed to one line when everything passed.
- Human-owned blockers, if any.
- `wontfix` explanations, if any.
- Residual risks or test gaps, only when concrete and relevant.
