---
name: polish
description: "Ready a branch for human review with two ordered settle-phases — deepen its architecture, then review it to green. Use when finishing issue work before a PR, when readying any branch for review on its own, or when a controller skill needs the pre-PR quality gate."
---

# Polish Branch

## Quick Start

Invoke on the branch you want to ready for review, with an **optional scope** —
an issue reference, free-form instructions, or both:

```text
/polish
/polish #123
/polish "focus on the validation path"
/polish #123 focus on the parser
```

**Polish** the current branch into something a human only ever sees once it is
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

## Scope Contract

The parameter is an **optional scope** — a free-form string that may be an issue
reference, instructions, or both. It tells `polish` which issue to align to and
what its phases attend to; it never adds build work.

- **Scope is authoritative for focus.** When the scope carries free-form
  instructions, they narrow what Phase 1 deepens and what Phase 2 prioritizes.
  They scope attention within the branch's existing diff — `polish` deepens and
  reviews what is already built rather than expanding the change.
- **Issue association is best-effort.** `working-on-github-issue` resolves the
  issue from a reference in the scope, else the current branch, and aligns the
  branch, assignment, and status. When it resolves **no issue**, warn and
  continue — Phase 2 simply skips the Spec axis; do not halt.
- **Divergence is surfaced, not silently absorbed.** When the branch's built
  work materially diverges from the resolved issue body, name it in the final
  report rather than quietly reviewing around it. Leave the issue body to the
  caller; this skill never edits it.

`polish` deepens and reviews an already-built branch, so it omits `develop`'s
build-only judgments — acceptance-criteria actionability gating and
build-vs-issue construction precedence. It needs the issue *resolved*, not
interpreted for construction.

## Required Child Skills

- `working-on-github-issue`: resolve the issue (from the scope or the current branch) and land on its issue-linked branch, best-effort; returns cleanly when there is no issue.
- `code-review`: two-axis Standards + Spec branch-diff review via parallel report-only sub-agents.
- `implement`: apply accepted deepenings and clear behavior-change findings — reaches `tdd` at agreed seams and `code-review` when done.
- `diagnosing-bugs`: unclear root cause, missing reproduction, flaky behavior, or performance regressions.
- `codebase-design`: the deep-module vocabulary and principles Phase 1 deepens against (reference, not invoked).

`working-on-github-issue` reaches `new-branch`; confirm it is installed too.

If any are missing, halt before running and report the missing skill names and
install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add patinaproject/skills --skill working-on-github-issue new-branch -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@implement -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@code-review -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@diagnosing-bugs -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@codebase-design -y
```

## Step 0 — Align to the scope

Before Phase 1, run `working-on-github-issue` to resolve and align: it resolves
the issue from a reference in the scope, else the current branch, then lands on
the issue-linked branch and marks it started — all best-effort and idempotent.
Re-running it while already aligned changes nothing, so a controller such as
`develop` that already resolved the scope forwards it here as a cheap
re-confirmation of the same branch and issue.

- When it resolves an issue, carry that reference into Phase 2's Spec axis.
- When it resolves **no issue**, warn that Spec conformance cannot be checked
  against an issue, then continue — both phases still run, with the Spec axis
  skipped.

Then Phase 1 begins.

## Phase 1 — Deepen until settled

Surface architectural friction in the branch's changes and apply the deepenings
that clearly earn their place, re-running until a pass finds nothing more — that
zero is the settle signal. Deepening runs **before** review so Phase 2 judges the
settled shape. When the scope carried free-form instructions, weight each pass
toward the modules they name, still deepening only what the branch's own diff
touches.

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
  Give its **Spec** axis the issue resolved in Step 0 as the originating issue,
  superseding commit-ref archaeology; when Step 0 resolved **no issue**, instruct
  `code-review` to **skip the Spec axis rather than prompt** — this overrides its
  default of asking where the spec is, keeping the run unattended. Invoking
  `polish` (or a controller that reaches it) is sufficient approval to run it; do
  not ask for another confirmation.
- **Map the two axes to the gate.** `code-review` reports along **Standards**
  (documented conventions plus a Fowler smell baseline) and **Spec** (does the
  diff implement the issue). Treat as **blocking**: Standards hard violations
  (documented-standard breaches) and Spec missing, partial, or wrong-requirement
  findings. Treat as **non-blocking**: judgement-call smells and benign
  scope-creep notes (the diff did a little more than asked). A scope finding
  whose resolution needs a product or scope decision is different — route it
  `ready-for-human` per the Finding Router. When the scope carried free-form
  instructions, prioritize findings on the modules they name. Green is no
  blocking findings left.
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

Write for the caller, leading with whether the branch is polished:

- Resolved issue reference, or that Step 0 found no issue and the Spec axis was
  skipped.
- Phase 1: rounds run and deepenings applied, or that it settled with zero
  candidates on the first pass.
- Phase 2: review result and finding dispositions; name the blocker if it
  stopped on a `ready-for-human` finding.
- Verification result, collapsed to one line when everything passed.
- Human-owned blockers, if any.
- `wontfix` explanations, if any.
- Scope divergence from the resolved issue body, if any.
- Residual risks or test gaps, only when concrete and relevant.
