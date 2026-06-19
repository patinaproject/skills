---
name: finish-pr
description: Finish completed branch work into a ready-to-merge pull request. Use when development is complete, when the user says finish PR, publish this branch, or open a ready PR, or when an agent has objective evidence the branch is ready for review.
---

# Finish PR

## Quick Start

When local work is complete, follow
[workflows/ready-for-merge.md](workflows/ready-for-merge.md) — the authoritative
procedure for every step below.

Example: on branch `42-let-agents-use-github-more-ergonomically`, infer issue
`#42`, verify the diff, commit as `feat: #42 ...`, push, and create or update
the ready-for-review PR.

The skill verifies, commits, pushes, and creates or reuses a ready-for-review
PR, then runs the readiness loop until the PR is ready-to-merge or every
problematic check is triaged and reported. A failing check is evidence to
triage, not a halt. It never merges the PR.

End on a strict final ready-to-merge gate. If any gate fails, report the PR as
not ready-to-merge, name the blocker in human-friendly language, and do not
imply success or call it finished. If every gate passes, compress the
ready-to-merge evidence into one human line.

## Workflow

1. Read repository guidance, commit rules, and the PR template.
2. Infer the issue from the current branch or existing PR metadata; ask if
   ambiguous.
3. Inspect uncommitted changes and stage only relevant paths.
4. Run the repository's documented verification commands.
5. Commit using the repository's required commit format.
6. Push the branch when there is work to publish.
7. Create or update a ready-for-review PR using the repository template.
8. Enter the readiness loop: detect merge conflicts, triage currently
   available PR feedback, resolve eligible conversations, watch all checks in
   fail-fast bounded observation windows, triage every problematic check,
   re-query PR feedback after checks and after every watch exit or timeout, fix
   branch-local issues, push, and repeat. A check the agent cannot fix gets a
   concrete disposition and continues to reporting, not a halt.
9. Mark draft PRs ready for review once every visible failing check is fixed or
   dispositioned; ready-for-review is distinct from ready-to-merge.
10. Report ready-to-merge status or concrete non-ready check dispositions
    without merging.

## Guardrails

- Do not resolve a review thread without an evidence-bearing reply, including
  code-fix dispositions; verify pattern-based feedback with a direct search or
  check before resolving when feasible.
- Do not rewrite branch history or force-push by default.
- Do not use browser conflict resolution or merge the pull request itself.
- Do not create follow-up issues from PR feedback.
- Do not wait indefinitely for new human review comments.
- Do not use required-check-only watching; optional checks remain in scope.
- Stop after the documented no-progress threshold instead of watching
  indefinitely.
- Do not stop solely because a check failed, was canceled, or is out of scope;
  triage it, fix branch-local causes when possible, and otherwise report the
  check disposition.
- Do not add AI or agent attribution unless the repository requires it.
- Stop for non-check blockers involving secrets, permissions, product
  decisions, or ambiguous scope.
