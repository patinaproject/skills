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

This skill is a goal-directed controller. It coordinates existing workflow
skills, preserves their contracts and repository guardrails, and never merges a
pull request.

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

Before branch setup or implementation, confirm these installed skills are
available in the agent environment:

- `new-branch`
- `tdd`
- `diagnose`
- `review-code`
- `finish-pr`

If any are missing, halt before implementation. Report the missing skill names
and install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add patinaproject/skills --skill new-branch --skill review-code --skill finish-pr -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@diagnose -y
```

The `tdd`, `diagnose`, `write-a-skill`, `zoom-out`, and `prototype` install
hints intentionally track their source catalog's default branch. Consumers who
need a frozen install can add `#<git-ref>` to those sources.

## Conditional Routes

Conditional routes are not blanket prerequisites. Check that the named skill is
available only when the issue triggers that route; halt with the missing skill
name and install guidance only for a triggered missing route.

Install guidance for triggered conditional routes:

```sh
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@write-a-skill -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@zoom-out -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@prototype -y
```

- Route through `write-a-skill` when the issue changes an installable skill
  package surface: skill entry instructions, frontmatter or description,
  workflow contract text, examples, reference material, or bundled helper
  scripts. For skill-package changes that include executable helper scripts,
  run `write-a-skill` before `tdd`, then use `tdd` for executable behavior.
- Use `zoom-out` for ad-hoc, read-only discovery when the agent cannot yet
  explain the relevant modules, callers, and domain vocabulary. It may run in a
  background explorer when the host supports that, but the main workflow must
  consume the result before choosing an implementation route.
- Use `prototype` only when the issue explicitly asks for throwaway exploration,
  state-model sanity checks, UI direction exploration, or equivalent prototype
  work. Delete or absorb prototype output before local review unless the issue
  explicitly asks to commit prototype artifacts.

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
- Local `review-code` findings are fixed or dispositioned.
- GitHub PR review comments and hosted review comments surfaced by `finish-pr`
  are fixed or dispositioned.
- After `finish-pr`, all currently visible required and optional PR checks pass
  for `goal-met`.
- PR check failures outside branch scope have a concrete disposition in a
  `human-blocked` final report; do not report `goal-met` while any visible PR
  check is still failing.
- Residual risks and test gaps are named, even when the answer is
  `none identified`.

For this skill, all visible PR checks include required and optional checks.

## Capability Map

- `new-branch`: issue-linked branch setup. Branch setup is an automatic
  precondition before implementation or publishing work begins. Run
  `new-branch` when the worktree is not already on the correct issue-linked
  branch. Skip `new-branch` when the current worktree is already correctly
  prepared.
- `tdd`: clear behavior implementation and behavior-level tests.
- `diagnose`: unclear root cause, missing reproduction, flaky behavior, or
  performance regressions.
- `review-code`: fresh-context local branch-diff review.
- `finish-pr`: commit, push, PR creation or update, PR checks, PR feedback
  loops, and ready-to-merge reporting.
- `write-a-skill`: installable skill package surface changes.
- `zoom-out`: read-only discovery when the agent cannot yet explain relevant
  modules, workflows, or vocabulary.
- `prototype`: only explicit throwaway exploration requests.

## Workflow

1. Read `AGENTS.md` and `CLAUDE.md` if present, plus any docs they import.
2. Validate the single same-repository issue reference and required child
   skills.
3. Satisfy the branch setup precondition using `new-branch` when needed.
4. Apply triggered conditional routes from the Conditional Routes section.
5. Choose the next capability by naming the current gap between actual state and
   the terminal goal.
6. Do not treat implementation, diagnosis, local review, or publishing as a
   fixed mandatory sequence. Invoke the capability that removes the current
   blocker or readiness gap.
7. Run repository-documented verification before local review and before final
   publishing readiness decisions.
8. Check for reviewable local changes: committed branch diff from the
   default-branch merge base, staged changes, unstaged changes, or untracked
   files.
9. When reviewable local changes exist, invoke `review-code` and inherit its
   full contract. Explicit use of `develop-issue` is sufficient approval for
   this required local review gate: dispatch the fresh read-only reviewer
   without asking for another user confirmation. Preserve the `review-code`
   boundary exactly: no same-thread fallback and no file edits, staging,
   commits, pushes, PR comments, review-thread mutation, or other worktree
   mutation. Halt if fresh reviewer dispatch is unavailable or if `review-code`
   reports a halt condition.
10. Route local review findings through the Review Finding Router.
11. Use `finish-pr` for commit, push, PR creation or update, visible check
    observation, PR feedback loops, and ready-to-merge reporting. Invoke
    `finish-pr` only after local verification and `review-code` are clean,
    skipped because no reviewable local changes exist, or every local finding
    has a recorded `ready-for-agent`, `ready-for-human`, or `wontfix`
    disposition.
12. Loop until the terminal goal is met or a human-owned blocker prevents
    further progress.

During long-running or resumable execution, keep compact checkpoint state using
the final-report vocabulary: issue reference and URL, branch name, child skill
status, verification results, local review status, PR review status, check
status, finding dispositions, blockers, and PR readiness. Resume from that
state and continue until a terminal workflow state is reached:
production-readiness evidence supports `goal-met` or there is a documented
`human-blocked` stop.

## Review Finding Router

Classify findings into exactly one of these outcomes:

| Outcome | Use When | Next Action |
|---|---|---|
| `ready-for-agent` | The expected behavior is clear or evidence can be gathered locally | Route clear behavior changes to `tdd`; route unclear root cause, missing reproduction, flaky behavior, or performance regression to `diagnose` |
| `ready-for-human` | The finding needs judgment, external access, manual testing, design input, missing information, changed scope, product decisions, permissions, conflicting direction, or valid work outside the issue | Stop the loop and report the blocker with evidence checked |
| `wontfix` | The finding is stale, incorrect, conflicts with repository rules, or is intentionally rejected | Explain politely in the report; add concise code comments only when future reviewers would otherwise re-raise the same concern |

There is no `needs-info` state in v1. Insufficient information maps to
`ready-for-human`.

## Final Report

When the workflow stops, write for a human first, not as a process log. Lead with
the outcome. Keep the default report short, direct, and human-readable, and
surface only details that change what the reader needs to understand or do.

Include:

- What changed, in 1-3 meaningful bullets.
- Where the work ended up: include the issue, PR, and branch links. Link them
  when URLs are available; name them plainly when not.
- Terminal state: `goal-met` or `human-blocked`.
- Production-readiness case.
- Verification commands and results, summarized at the highest useful level.
  Collapse routine verification into one concise line when everything passed.
- Relevant tests added or updated.
- Child skill halt reasons, only when a halt changes what the human should do
  next.
- Local review result and finding dispositions.
- PR review and check feedback status.
- Latest `review-code` result, or that it was skipped because no reviewable
  local changes existed, only when it affects reviewer confidence or next
  action.
- Human-owned blockers, if any.
- `wontfix` explanations, if any.
- Residual risks or test gaps, or `none identified`.
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

### Good final output

```md
Done: [#190](https://github.com/patinaproject/skills/issues/190) is implemented
on [PR #197](https://github.com/patinaproject/skills/pull/197)
([branch `190-human-focused-final-output`](https://github.com/patinaproject/skills/tree/190-human-focused-final-output)).

Changed:
- `develop-issue` final reports now lead with outcome and meaningful changes.
- Routine verification is collapsed unless something failed, skipped, or needs
  human attention.

Verified: routine checks passed (targeted tests, lint, type-check, PR checks).

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

Child skills invoked: new-branch, write-a-skill, tdd, review-code, finish-pr.
No unrelated dirty files except local config. Goal marked complete.
```
