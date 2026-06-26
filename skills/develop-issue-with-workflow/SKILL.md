---
name: develop-issue-with-workflow
description: "Build one GitHub issue into one converged branch by decomposing it into independent vertical slices and building them in parallel with the Claude Workflow tool. Use when you deliberately want an issue's independent slices built in parallel and converged onto one branch instead of building it serially."
---

# Develop Issue With Workflow

## Quick Start

Invoke with exactly one same-repository GitHub issue reference:

```text
/develop-issue-with-workflow #123
```

Build one issue into **one converged branch** — destined for one PR — by
decomposing it into independent **vertical slices** and building them in
parallel.

This skill is the explicit **opt-in to the Claude Workflow tool**. Invoking it
authorizes the multi-agent fan-out; the heavy parallel build never runs unless
you deliberately reach for this skill. `develop-issue` does not route here — it
builds with plain `implement` — so workflow fan-out is always a deliberate
choice.

Its deliverable is a converged branch: every slice integrated onto the one issue
branch, with repository verification passing. It does **not** harden the branch
or open a pull request. Follow it with `harden-branch` then `finish-pr` to reach
a ready-for-review PR.

## Required Child Skills

- `start-on-issue`: shared begin-work step (validate, mark started, land on the issue branch).
- `implement`: build each slice — reaches `tdd` at agreed seams.
- `resolving-merge-conflicts`: integrate each slice's worktree onto the one branch.
- The **Claude Workflow tool**: this skill is its authorization for this run.

Planning aid, read but not invoked: `to-issues`' vertical-slice + `Blocked by`
methodology.

If any are missing, halt before building and report the missing skill names and
install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add patinaproject/skills --skill start-on-issue new-branch -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@implement -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@resolving-merge-conflicts -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@to-issues -y
```

The `implement`, `tdd`, `resolving-merge-conflicts`, and `to-issues` install
hints track their source catalog's default branch; add `#<git-ref>` to freeze.

## Workflow

1. **Begin work.** Ensure `start-on-issue`'s postcondition: on the issue's
   branch, with the issue marked started. `start-on-issue` is idempotent, so run
   it unconditionally — it does the real begin-work, and is a no-op when you are
   already started and on the issue branch.

2. **Decompose into vertical slices — planning only.** Apply `to-issues`'
   methodology: tracer-bullet vertical slices that each cut end-to-end through
   every layer, with `Blocked by` dependencies between them. Do **not** publish
   any issues. This decomposition is in-memory planning that shapes the
   workflow; the tracker stays clean (no sub-issues).

3. **Approve the breakdown with the user.** Present the proposed slices as a
   numbered list — Title, `Blocked by`, what-to-build, acceptance criteria — and
   quiz the user on granularity and dependencies exactly as `to-issues` does.
   Iterate until the user approves. Build nothing before approval.

4. **Check the parallel precondition.** The fan-out pays off only with **two or
   more independent slices** (slices with no `Blocked by` among them). If the
   approved breakdown has fewer than two independent slices, do not fan out:
   build the issue with plain `implement` (which reaches `tdd`) on the one
   branch, then go to step 6.

5. **Author and run the workflow.** Express the approved dependency DAG as
   topological **waves** and run it with the Claude Workflow tool:
   - Each wave's independent slices run as concurrent agents — one per slice,
     each with `isolation: 'worktree'` — so parallel builders never corrupt each
     other's working tree.
   - Each slice agent builds via `implement`/`tdd` scoped to that slice's
     what-to-build and acceptance criteria, nothing wider.
   - Each wave ends with an **integration stage** that merges every completed
     slice's worktree onto the one issue branch with `resolving-merge-conflicts`,
     then runs repository-documented verification. `resolving-merge-conflicts`
     resolves the mechanical conflicts; **escalate to the user** any conflict
     that needs product judgment rather than guessing semantics.
   - Dependent slices run in later waves, branched from the **integrated** issue
     branch, so each dependent builds on its blockers' merged work.

6. **Hand back the converged branch.** Report the integrated branch and the
   remaining pipeline.

## Workflow shape

Illustrative skeleton — the real waves come from the approved slices:

```js
// waves: an ordered list of independent-slice groups, blockers first
for (const wave of waves) {
  // build each independent slice concurrently, each in its own worktree
  await parallel(wave.slices.map(slice => () =>
    agent(buildPrompt(slice), { isolation: 'worktree', label: `build:${slice.id}` })))
  // integrate this wave onto the one issue branch, then verify
  await agent(integratePrompt(wave), { label: `integrate:${wave.id}` })
}
```

## Final Report

- Converged branch, and which slices integrated onto it.
- Decomposition: number of slices and waves; note when it degraded to plain
  `implement` because there were fewer than two independent slices.
- Integration: conflicts resolved versus escalated, and the verification result.
- Human-owned blockers, such as a judgment-needed conflict, if any.
- The remaining pipeline to reach a PR: `harden-branch` → `finish-pr`.
