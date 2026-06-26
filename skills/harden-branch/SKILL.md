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
2. **Review until green** — review the branch for correctness.

Deepen runs **before** review so the review judges the final, structurally
settled code rather than an intermediate shape.

This skill assumes the branch's build is already complete and committed; it
fixes and deepens, it does not build the issue from scratch. It commits the
fixes its phases produce. It does not push or open a pull request — `finish-pr`
owns publishing.

## Required Child Skills

- `improve-branch-architecture`: branch-scoped deepening, run in autonomous-accept mode.
- `review-branch`: fresh-context, read-only branch-diff correctness review.
- `implement`: apply accepted deepenings and clear behavior-change findings — reaches `tdd` at agreed seams.
- `diagnosing-bugs`: unclear root cause, missing reproduction, flaky behavior, or performance regressions.

If any are missing, halt before running and report the missing skill names and
install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add patinaproject/skills --skill review-branch improve-branch-architecture -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@implement -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@diagnosing-bugs -y
```

## Phase 1 — Deepen until settled

Run `improve-branch-architecture` in **autonomous-accept** mode. Route every
accepted deepening to `implement` (which reaches `tdd` at agreed seams). Re-run
the architecture pass after applying the accepted deepenings. Repeat until a
pass accepts **zero** candidates — that zero is the settle signal.

- Autonomous-accept mode applies a conservative rubric: accept deletion-test-passing
  depth gains that improve locality or test surface and fit the foldable radius —
  `Strong`, or `Worth exploring` only when it clearly passes the deletion test;
  reject `Speculative` and overengineering; default to reject when uncertain. The
  full rubric is owned by `improve-branch-architecture`; that conservatism is what
  makes this loop terminate instead of gold-plating the branch.
- Run repository-documented verification after each round of applied deepenings.

## Phase 2 — Review until green

Run `review-branch`. Route its findings through the Finding Router below. Re-run
`review-branch` after applying fixes. Repeat until no blocking findings remain —
that is **green**.

- Invoking `harden-branch` (or a controller that reaches it) is sufficient
  approval to dispatch the fresh read-only reviewer; do not ask for another
  confirmation. Inherit `review-branch`'s full contract and preserve its
  boundary exactly: it never edits files, stages, commits, pushes, comments on
  GitHub, or mutates review threads. Apply fixes through `implement` or
  `diagnosing-bugs`, never inside the reviewer.
- Halt if fresh reviewer dispatch is unavailable or `review-branch` reports a
  halt condition.
- Run repository-documented verification before declaring the branch green.

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
