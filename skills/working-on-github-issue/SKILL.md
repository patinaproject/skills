---
name: working-on-github-issue
description: "Align GitHub state to the fact you are working an issue: resolve the issue from a reference or the current branch, land on its branch, and write its lifecycle Status. Use as the shared begin/resume step whenever a controller works a scope that may map to an issue, and as the single writer that advances the issue's board Status (started, in-review)."
---

# Working On GitHub Issue

## Quick Start

Invoke with an optional issue reference and an optional stage; run it whenever
you start, resume, or advance work:

```text
/working-on-github-issue #123                   # stage started (default)
/working-on-github-issue                        # resolve the issue from the current branch
/working-on-github-issue #123 stage in-review   # advance the board to In review
```

This is the shared **align** step: resolve which issue you are working, then make
GitHub reflect that — land on the issue-linked branch and write its **lifecycle
Status**. It is the **single writer of issue lifecycle state**: every board
Status transition an agent makes goes through this one door. It is
**idempotent** and **best-effort**, so a controller can call it unconditionally
every run: re-running while already aligned is a no-op, and it never blocks the
caller.

It is a mechanical aligner. It does not judge scope actionability, edit the issue
body, build, review, or open a pull request — the controller that calls it owns
those decisions.

## Stage

An optional `stage` selects which lifecycle Status this alignment writes. It
defaults to `started`, so every existing caller that passes no stage keeps
today's contract unchanged.

- `started` (default): the begin/resume alignment — land on the issue-linked
  branch, self-assign, and set Status to `In progress`.
- `in-review`: the work is now under review — set Status to `In review`. The
  branch and self-assignment are already settled from the `started` run, so
  re-confirm them idempotently; the meaningful change is the Status.

`started` and `in-review` are the only values; treat any other stage as an
unusable input and report it rather than guessing a Status.

## Required Child Skill

- `new-branch`: issue-linked branch setup.

If `new-branch` is missing, halt and report the install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add patinaproject/skills --skill new-branch -y
```

## Resolve the issue (best-effort)

Resolve exactly one issue to align, in order:

1. **Explicit reference.** If the caller supplies a bare issue number,
   `#<number>`, or same-repository GitHub issue URL, use it.
2. **Current branch.** Otherwise infer the issue from the current branch when its
   name encodes an issue number per the `<issue>-<slug>` convention `new-branch`
   produces.
3. **None.** Otherwise there is no issue to align. Report `no-issue` and return
   — do not reject, do not halt. The caller decides whether to warn and continue.

Resolution is best-effort **association**, not input gatekeeping. Reject only a
genuinely unusable *explicit* reference: multiple references, or a
cross-repository URL. Resolve through the current working directory's default
`gh` repository.

## Align (best-effort, idempotent)

When an issue resolves, align GitHub state. Branch, self-assignment, and Project
status are independent best-effort actions; none blocks the others or the caller,
and none causes a halt. When no issue resolves, skip this section entirely.

### Branch

Verify the current branch is the issue-linked branch for the resolved issue — its
name encodes the issue number per the `<issue>-<slug>` convention `new-branch`
produces.

- When it already matches, stay on it; do not run `new-branch`.
- Otherwise, run `new-branch` to establish the issue-linked branch. This is the
  default for **any** non-issue-linked starting branch, including a harness or
  session branch such as `claude/*` that the worktree merely started on. A
  branch being host-provided is not itself a reason to keep it.
- The one exception is a branch the caller has **explicitly declared
  immutable** — a ref it cannot rename, such as a CI-provided branch. This
  declaration must arrive as an explicit natural-language caller instruction in
  the invocation context — the scope or arguments you were invoked with; never
  infer it from the branch's name or origin, so a `claude/*` or other
  host-provided name is never a declaration on its own. When such a declaration
  applies, you **must** report the deviation (see Final Report), never keep the
  branch silently.

End on the issue-linked branch — or, only when the caller declared the current
branch immutable, on that branch with the deviation reported.

### Self-assignment

- Read the issue's current assignees from its `assignees` field (for example
  `gh issue view <number> --json assignees`). Assign only when that list is
  empty.
- When the issue has zero assignees, assign it to the current
  `gh`-authenticated user with a single issue-level call,
  `gh issue edit <number> --add-assignee @me`, run once. Resolve "myself" to
  `@me`; never hardcode a username, so the skill stays reusable across every
  consumer.
- When the issue already has one or more assignees — `@me` or anyone else — do
  nothing. Do not add `@me` as an additional assignee.
- This is one issue-level call, not a per-project-item operation.
- If the assignment call fails (permissions, missing write access, API error),
  skip and record the reason, then continue.

### GitHub Project status

- Inspect the issue's existing GitHub Projects through its GitHub Project items
  (the issue's `projectItems` data). For each existing GitHub Project item:
  - Use project-item inspection to find a compatible field where the stage's
    target Status is offered as an exact option, and update that project item to
    it. The target is `In progress` for stage `started` and `In review` for
    stage `in-review`.
  - Do not add the issue to projects. Do not create project fields or status
    options.
  - Skip incompatible project items and continue when the project lacks a
    compatible status field, lacks the target option, or project-item
    inspection or updates fail due to permissions.
- Record the project status update result and the self-assignment result,
  including each updated item and skipped item reason, for the caller's report.

## Do not touch the issue body

This skill aligns *mechanical* state only — branch, assignment, status. It never
edits the issue title or body. Requirement changes and scope divergence are the
controller's concern, not alignment.

## Final Report

Report for the caller:

- The resolved issue reference, URL, and title — or `no-issue` when none
  resolved, so the caller can warn and continue.
- Branch landed on, and whether `new-branch` ran.
- Self-assignment result only when it failed or created a human next action;
  stay silent on a successful assignment or one skipped because the issue was
  already assigned.
- Project status result — the stage's target Status and whether it was written —
  only when it changed readiness, failed, or was skipped for a reason the caller
  needs.
- Branch deviation, required whenever it happens: when the caller declared the
  current branch immutable and you kept it instead of the issue-linked branch,
  name the retained branch and why. This report is mandatory, not optional. Also
  surface any other ending on a non-issue-linked branch that needs human
  attention, such as `new-branch` failing to establish the issue-linked branch.
