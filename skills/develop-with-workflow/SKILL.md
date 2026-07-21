---
name: develop-with-workflow
description: "Build one scope — an issue reference, free-form instructions, or both — into one converged branch by decomposing it into independent vertical slices and building them in parallel with the Claude Workflow tool. Use when you deliberately want a scope's independent slices built in parallel and converged onto one branch instead of building it serially."
---

# Develop With Workflow

## Quick Start

Invoke with a **scope** — an issue reference, free-form instructions, or both:

```text
/develop-with-workflow <issue-reference>
/develop-with-workflow "port the API handlers to the new client, one per resource"
```

Build one scope into **one converged branch** — destined for one PR — by
decomposing it into independent **vertical slices** and building them in
parallel. The scope is authoritative; any associated issue is resolved
best-effort by `working-on-issue` for the branch and tagging, exactly as
`develop` does.

This skill is the explicit **opt-in to the Claude Workflow tool**. Invoking it
authorizes the multi-agent fan-out; the heavy parallel build never runs unless
you deliberately reach for this skill. `develop` does not route here — it
builds with plain `implement` — so workflow fan-out is always a deliberate
choice.

Its deliverable is a converged branch: every slice integrated onto the one
branch, with repository verification passing. It does **not** polish the branch
or open a pull request. Follow it with `polish` then `ready-pr` to reach
a ready-for-review PR.

## Required Child Skills

- `working-on-issue`: resolve the issue from the scope or branch, land on its adapter-provided branch, and mark it started; best-effort, returns cleanly when there is no issue. Reaches `new-branch` for branch setup.
- `implement`: build each slice — reaches `tdd` at agreed seams and `code-review` when done.
- `resolving-merge-conflicts`: integrate each slice's worktree onto the one branch.
- The **Claude Workflow tool**: this skill is its authorization for this run.

Planning aid, read but not invoked: `to-tickets`' vertical-slice + `Blocked by`
methodology.

If any are missing, halt before building and report the missing skill names and
install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill working-on-issue new-branch -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@implement -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@code-review -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@resolving-merge-conflicts -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@to-tickets -y
```

The `implement`, `tdd`, `code-review`, `resolving-merge-conflicts`, and `to-tickets`
install hints track their source catalog's default branch; add `#<git-ref>` to
freeze.

The downstream handoff is separate from the build: this skill stops at the
converged branch, then directs you to `polish` (which reaches
`code-review` and deepens against the `codebase-design` vocabulary) and
`ready-pr`. Install those too so a standalone run does not dead-end at the
handoff:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill polish ready-pr -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@code-review -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@codebase-design -y
```

## Workflow

1. **Align.** Run `working-on-issue` unconditionally (it is idempotent):
   it resolves the issue from the scope or the current branch and aligns the
   branch, assignment, and started state, all best-effort. If it resolves no
   issue, warn that the converged branch cannot be issue-tagged downstream, then
   continue on the current branch.

2. **Decompose the scope into vertical slices — planning only.** Apply `to-tickets`'
   methodology: tracer-bullet vertical slices that each cut end-to-end through
   every layer, with `Blocked by` dependencies between them. Do **not** publish
   any issues. This decomposition is in-memory planning that shapes the
   workflow; the tracker stays clean (no sub-issues).

   **Wide refactors are the exception.** When the scope is one mechanical change
   whose blast radius fans across the codebase — renaming a shared symbol,
   retyping a widely-used interface — no vertical slice can land green, so
   sequence it **expand–contract** instead: an expand slice adds the new form
   beside the old, migrate slices move call sites in batches sized by blast
   radius (each blocked by the expand), and a contract slice deletes the old
   form once no caller remains (blocked by every migrate batch). The migrate
   batches are the independent slices the fan-out parallelizes; expand and
   contract are the serial edges. When even the batches cannot stay green
   alone, keep the sequence but converge them on a final integrate-and-verify
   slice that promises green.

3. **Approve the breakdown with the user.** Present the proposed slices as a
   numbered list — Title, `Blocked by`, what-to-build, acceptance criteria — and
   quiz the user on granularity and dependencies exactly as `to-tickets` does.
   Iterate until the user approves. Build nothing before approval.

4. **Check the parallel precondition.** The fan-out pays off only with **two or
   more independent slices** (slices with no `Blocked by` among them). If the
   approved breakdown has fewer than two independent slices, do not fan out:
   build the scope with plain `implement` (which reaches `tdd`) on the one
   branch, then go to step 6.

5. **Author and run the workflow.** Express the approved dependency DAG as
   topological **waves** and run it with the Claude Workflow tool:
   - Each wave's independent slices run as concurrent agents — one per slice,
     each with `isolation: 'worktree'` — so parallel builders never corrupt each
     other's working tree.
   - Each slice agent builds via `implement`/`tdd` scoped to that slice's
     what-to-build and acceptance criteria, nothing wider.
   - Each wave ends with an **integration stage** that merges every completed
     slice's worktree onto the one branch with `resolving-merge-conflicts`,
     then runs repository-documented verification. `resolving-merge-conflicts`
     resolves the mechanical conflicts; **escalate to the user** any conflict
     that needs product judgment rather than guessing semantics.
   - Dependent slices run in later waves, branched from the **integrated**
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
  // integrate this wave onto the one branch, then verify
  await agent(integratePrompt(wave), { label: `integrate:${wave.id}` })
}
```

## Final Report

- Converged branch, and which slices integrated onto it.
- Decomposition: number of slices and waves; note when it degraded to plain
  `implement` because there were fewer than two independent slices.
- Integration: conflicts resolved versus escalated, and the verification result.
- Human-owned blockers, such as a judgment-needed conflict, if any.
- The remaining pipeline to reach a PR: `polish` → `ready-pr`.
