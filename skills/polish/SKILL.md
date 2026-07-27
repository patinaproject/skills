---
name: polish
description: "Ready a completed branch for publication with a bounded architecture gate. Use when finishing issue work before a PR, when readying any branch for review on its own, or when a controller skill needs the pre-PR architecture gate."
---

# Polish Branch

## Quick Start

Invoke on the branch you want to ready for publication, with an **optional
scope** — an issue reference, free-form instructions, or both:

```text
/polish
/polish <issue-reference>
/polish "focus on the validation path"
/polish <issue-reference> focus on the parser
```

**Polish** the current branch into a deeper architectural shape before its pull
request opens. Run one architecture pass. Run a second only when the first
accepted and applied a deepening, then stop regardless. The pull request owns
the review loop.

This skill assumes the branch's build is already complete and committed; it
deepens the built work; it does not build the issue from scratch. It commits
the changes its passes produce. It does not push or open a pull request —
`ready-pr` owns publishing.

## Scope Contract

The parameter is an **optional scope** — a free-form string that may be an issue
reference, instructions, or both. It tells `polish` which issue to align to and
where its architecture passes should focus; it never adds build work.

- **Scope is authoritative for focus.** Free-form instructions weight each pass
  toward the modules they name, still deepening only what the branch's existing
  diff touches.
- **Issue association is best-effort.** `working-on-issue` resolves the
  issue from a reference in the scope, else the current branch, and aligns the
  branch, assignment, and started state. When it resolves **no issue**, warn and
  continue.
- **Divergence is surfaced, not silently absorbed.** When the branch's built
  work materially diverges from the resolved issue body, name it in the final
  report. Leave the issue body to the caller; this skill never edits it.

`polish` deepens an already-built branch, so it omits `develop`'s build-only
judgments — acceptance-criteria actionability gating and build-vs-issue
construction precedence. It needs the issue *resolved*, not interpreted for
construction.

## Required Child Skills

- `working-on-issue`: resolve the issue (from the scope or the current branch) and land on its issue-linked branch, best-effort; returns cleanly when there is no issue.
- `implement`: apply accepted deepenings through its build/TDD portion.
- `diagnosing-bugs`: unclear root cause, missing reproduction, flaky behavior, or performance regressions.
- `codebase-design`: the deep-module vocabulary and principles each pass
  deepens against (reference, not invoked).

`working-on-issue` reaches `new-branch`; confirm it is installed too.

If any are missing, halt before running and report the missing skill names and
install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill working-on-issue new-branch -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@implement -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@diagnosing-bugs -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@codebase-design -y
```

## Step 0 — Align to the scope

Before the first pass, run `working-on-issue` to resolve and align: it resolves
the issue from a reference in the scope, else the current branch, then lands on
the issue-linked branch and marks it started — all best-effort and idempotent.
Re-running it while already aligned changes nothing, so a controller such as
`develop` that already resolved the scope forwards it here as a cheap
re-confirmation of the same branch and issue. When it resolves **no issue**,
warn and continue.

Then the first architecture pass begins.

## Bounded architecture passes

Surface architectural friction in the branch's changes and apply the deepenings
that clearly earn their place.

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

**Accept conservatively.** Accept a deepening only when it passes the
deletion test, increases **depth**, improves **locality** or the test surface,
and folds into this branch without sprawling into unrelated code. Reject
speculative generality, pass-throughs that only move complexity, and anything
that complicates the interface instead of hiding complexity behind it. **Default
to reject when uncertain**. Route each accepted deepening through the build/TDD
portion of `implement`; the pull request owns review, so skip `implement`'s
standalone `code-review` tail.

- Run repository-documented verification after each pass that applies
  deepenings.

The sequence is bounded:

1. Run the first pass.
2. If it accepts zero deepenings, stop.
3. If it accepts and applies at least one deepening, run exactly one second
   pass, apply its accepted deepenings, verify, and stop. There is no third pass.

## Finding Router

Classify each architecture candidate into exactly one outcome:

| Outcome | Use When | Next Action |
|---|---|---|
| `ready-for-agent` | The deepening is clearly earned or its evidence can be gathered locally | Route a clear change to `implement`; route an unclear root cause, missing reproduction, flaky behavior, or performance regression to `diagnosing-bugs` |
| `ready-for-human` | The candidate needs judgment, external access, manual testing, design input, missing information, changed scope, product decisions, permissions, conflicting direction, or valid work outside the branch | Stop and report the blocker with evidence |
| `wontfix` | The candidate is stale, incorrect, conflicts with repository rules, or is intentionally rejected | Explain the disposition in the report; add a concise code comment only when a future maintainer would otherwise repeat the concern |

Insufficient information maps to `ready-for-human`. A `ready-for-human` candidate
stops the sequence; report it as a human-owned blocker.

## Final Report

Write for the caller, leading with whether the branch is polished:

- Resolved issue reference, or that Step 0 found no issue.
- Passes run and deepenings applied; explicitly say when the first pass accepted
  zero and skipped the second.
- Verification result, collapsed to one line when everything passed.
- Human-owned blockers, if any.
- `wontfix` explanations, if any.
- Scope divergence from the resolved issue body, if any.
- Residual risks or test gaps, only when concrete and relevant.
