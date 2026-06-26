---
name: develop-issue
description: "Drive one same-repository GitHub issue to an evidence-backed production-ready PR outcome. Use when the user invokes `/develop-issue #123`, `/develop-issue https://github.com/<owner>/<repo>/issues/123`, or asks to develop exactly one issue end to end."
---

# Develop Issue

## Quick Start

Invoke with exactly one same-repository GitHub issue reference:

```text
/develop-issue #123
/develop-issue https://github.com/<owner>/<repo>/issues/123
```

This skill is a thin, goal-directed **controller**. It drives one issue to a
ready-for-review PR through a predictable pipeline of named, reusable skills:

```text
start-on-issue → build (implement) → harden-branch → finish-pr
   (begin)         (build the change)   (make ready)    (publish)
```

It coordinates those skills, preserves their contracts and repository
guardrails, and never merges a pull request.

`develop-issue` builds with plain `implement`; it never triggers multi-agent
workflow fan-out on its own. Parallel slice builds are a separate, deliberate
opt-in: invoke `develop-issue-with-workflow` directly when you want them.

## Terminal Goal

Production-ready implementation, all visible PR checks passing, and all local
review findings plus PR review comments addressed.

Treat production-ready as an evidence-backed readiness case, not a guarantee of
zero risk. Do not make unsupported certainty claims such as absolute certainty
or similar wording.

## Terminal States

- `goal-met`: production-readiness evidence supports `goal-met`; all required
  exit gates are satisfied and all visible required and optional PR checks pass.
- `human-blocked`: progress requires human judgment, external access, product
  or design decisions, permissions, secrets, conflicting direction, or valid
  work outside the issue.

Do not report `goal-met` while unresolved human-owned blockers remain.

## Required Child Skills

Before building, confirm these installed skills are available in the agent
environment:

- `start-on-issue`: begin work — validate the issue, mark it started, land on the issue-linked branch.
- `implement`: build the change from acceptance criteria — reaches `tdd` at agreed seams.
- `harden-branch`: pre-PR gate — deepen architecture until settled, then review to green.
- `finish-pr`: commit, push, PR creation or update, checks, PR feedback loops, and ready-to-merge reporting.

`start-on-issue` reaches `new-branch`; `harden-branch` reaches
`improve-branch-architecture`, `review-branch`, `implement`, and
`diagnosing-bugs`; `implement` reaches `tdd` and `review`. Confirm those are
installed too.

If any are missing, halt before building. Report the missing skill names and
install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add patinaproject/skills --skill start-on-issue new-branch review-branch harden-branch finish-pr -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@implement -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@review -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@diagnosing-bugs -y
```

The `implement`, `tdd`, `review`, `diagnosing-bugs`, `writing-great-skills`, and
`prototype` install hints intentionally track their source catalog's default
branch. Consumers who need a frozen install can add `#<git-ref>` to those
sources.

## Conditional Routes

Conditional routes are not blanket prerequisites. Check that the named skill is
available only when the issue triggers that route; halt with the missing skill
name and install guidance only for a triggered missing route.

- Consult `writing-great-skills` when the issue changes an installable skill
  package surface: skill entry instructions, frontmatter or description,
  workflow contract text, examples, reference material, or bundled helper
  scripts. Apply its review before the build route builds the change.
- Use `prototype` only when the issue explicitly asks for throwaway exploration,
  state-model sanity checks, UI direction exploration, or equivalent prototype
  work. Delete or absorb prototype output before `harden-branch` unless the issue
  explicitly asks to commit prototype artifacts.

Install guidance for these triggered routes:

```sh
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@writing-great-skills -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@prototype -y
```

Do not add normal `/develop-issue` routes for upstream planning, triage,
architecture review, handoff, or conversation-mode skills unless the issue
explicitly asks for them.

## Input Contract

1. Accept one bare issue number, `#<number>`, or same-repository GitHub issue
   URL.
2. Reject missing issue references.
3. Reject multiple issue references.
4. Reject cross-repository issue URLs.
5. Resolve the issue through the current working directory's default `gh`
   repository.
6. Treat the issue as prior approval for implementation only when acceptance
   criteria, scope, repository rules, and design decisions are actionable.

Pause for a human when the issue lacks actionable acceptance criteria, conflicts
with repository rules, requires a design decision, depends on external access,
or otherwise needs judgment not recorded in the issue.

## Required Exit Gates

- Issue scope and acceptance criteria are covered.
- Repository-documented verification has run and results are recorded.
- Relevant tests are added or updated when the change has executable behavior.
- `harden-branch` ran and reached a settled, green branch: architecture deepened
  until settled, and `review-branch` findings fixed or dispositioned.
- GitHub PR review comments and hosted review comments surfaced by `finish-pr`
  are fixed or dispositioned.
- After `finish-pr`, all currently visible required and optional PR checks pass
  for `goal-met`.
- PR check failures outside branch scope have a concrete disposition in a
  `human-blocked` final report; do not report `goal-met` while any visible PR
  check is still failing.
- Residual risks and test gaps are reported only when they are concrete,
  relevant to the issue, and useful for a human decision.

For this skill, all visible PR checks include required and optional checks.

## Workflow

1. Read `AGENTS.md` and `CLAUDE.md` if present, plus any docs they import.
2. Validate the single same-repository issue reference and required child
   skills.
3. Run `start-on-issue` to begin work: it validates the reference, marks the
   issue started (self-assignment and GitHub Project status, both best-effort
   and non-blocking), and lands you on the issue-linked branch.
4. Judge actionability against the Input Contract. Pause for a human when the
   issue is not actionable; do not invent scope.
5. Apply triggered conditional routes.
6. Build the change with `implement` (which reaches `tdd` at agreed seams), to
   the issue's acceptance criteria, then run repository-documented verification.
7. Run `harden-branch` to ready the branch: it deepens the architecture until
   settled, then reviews to green via `review-branch`, routing findings through
   its Finding Router. Invoking `develop-issue` is sufficient approval for
   `harden-branch`'s review gate; dispatch it without asking for another
   confirmation. A `ready-for-human` finding stops the loop as `human-blocked`.
8. Run `finish-pr` for commit, push, PR creation or update, visible check
   observation, PR feedback loops, and ready-to-merge reporting. Invoke
   `finish-pr` only after `harden-branch` reports the branch settled and green,
   or every finding has a recorded `ready-for-agent`, `ready-for-human`, or
   `wontfix` disposition.
9. Loop until the terminal goal is met or a human-owned blocker prevents further
   progress.

During long-running or resumable execution, keep compact checkpoint state using
the final-report vocabulary: issue reference and URL, branch name, terminal
state, meaningful changes, readiness, blockers, and next action. Resume from
that state and continue until a terminal workflow state is reached:
production-readiness evidence supports `goal-met` or there is a documented
`human-blocked` stop.

## Terminal-state routing

`harden-branch` classifies review findings through its Finding Router
(`ready-for-agent` → `implement`/`diagnosing-bugs`; `ready-for-human` → stop;
`wontfix` → explain). At the controller level, any `ready-for-human` blocker —
from `start-on-issue`, the actionability judgment, the build, `harden-branch`,
or `finish-pr` — stops the pipeline in the `human-blocked` terminal state. There
is no `needs-info` state; insufficient information maps to `ready-for-human`.

## Final Report

### Reporting Guidance

Progress updates, resumable checkpoints, and final handoffs should report what
changed, whether the work is ready or blocked, and what the human should do
next. Keep verification evidence internally for decisions. Report verification
details when they failed, skipped, interrupted, changed readiness, explain a
blocker, identify residual risk, or create a human next action.

Translate child-skill output into outcome, readiness, blocker, and next-action
language. Progress updates name the current checkpoint and next action without
repeating check lists.

When the workflow stops, write for a human first, not as a process log. Lead with
the outcome, and surface only details that change what the reader needs to
understand or do.

Include:

- What changed, in 1-3 meaningful bullets.
- Where the work ended up: include the issue, PR, and branch links. Link them
  when URLs are available; name them plainly when not.
- Project status update result only when it changed readiness, failed, skipped,
  explains a blocker, or creates a human next action.
- Issue self-assignment result only when it failed, changed readiness, or
  created a human next action. Stay silent on successful assignment.
- Terminal state: `goal-met` or `human-blocked`.
- Production-readiness case.
- Verification commands and results, summarized at the highest useful level.
  Collapse routine verification into one concise line when everything passed.
- Relevant tests added or updated.
- Child skill halt reasons, only when a halt changes what the human should do
  next.
- `harden-branch` result: architecture deepenings applied and `review-branch`
  finding dispositions.
- PR review and check feedback status.
- Latest `review-branch` result from `harden-branch`, or that the gate found
  nothing to change, only when it changes reviewer confidence or next action.
- Human-owned blockers, if any.
- `wontfix` explanations, if any.
- Residual risks or test gaps, only when they are concrete and relevant.
- PR URL and readiness status, when `finish-pr` runs.

Keep visible and specific:

- Failed checks, skipped checks, unresolved risks, or human action still needed.
- The exact command and blocker for any verification that did not run or did not
  pass.
- Runtime-required token or budget reporting, but place token or budget
  reporting after the result so it does not dominate the message.

Remove or minimize:

- Long lists of every command run when all passed.
- Repeated statements that lint, typecheck, tests, hooks, and PR checks were
  each verified.
- Generic process narration such as "I inspected status, reviewed diffs, ran
  checks."
- Full PR check inventories when they are all green.
- Mergeability, review, or unrelated dirty-file status unless it changes what
  the human should do next.
- `finish-pr` readiness gates such as clean worktree, head SHA equality, merge
  state, check inventory, or review-thread count when they all passed; collapse
  them into the verification line unless a failed gate changes the human next
  action.

### Good final output

Example for issue 190:

```md
Done: [#190](https://github.com/patinaproject/skills/issues/190) is implemented
on [PR #197](https://github.com/patinaproject/skills/pull/197)
([branch `190-human-focused-final-output`](https://github.com/patinaproject/skills/tree/190-human-focused-final-output)).

Changed:
- `develop-issue` final reports now lead with outcome and meaningful changes.
- Routine verification is collapsed unless something failed, skipped, or needs
  human attention.

Verified: routine checks passed.

Needs human attention: none before review.
```

### Bad final output

Avoid final output shaped like a process transcript:

```md
Implemented issue #190.

Verification:
- develop-issue workflow test passed.
- markdownlint passed.
- type-check passed.
- commit hook passed.
- PR check Test Gate passed.
- PR check code-review passed.
- PR is MERGEABLE and CLEAN.

Child skills invoked: start-on-issue, implement, harden-branch, finish-pr.
No unrelated dirty files except local config. Goal marked complete.
```

Use the bad shape only as an anti-example; do not mirror its structure.
