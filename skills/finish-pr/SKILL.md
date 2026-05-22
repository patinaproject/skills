---
name: finish-pr
description: Move completed local GitHub issue work to a ready-for-merge pull request. Use when development is complete, the user says finish PR, publish this branch, open a ready PR, or an agent has objective evidence the branch is ready for review.
---

# Finish PR

## Quick Start

When local work is complete, follow
[workflows/ready-for-merge.md](workflows/ready-for-merge.md).

Example: on branch `42-let-agents-use-github-more-ergonomically`, infer issue
`#42`, verify the diff, commit as `feat: #42 ...`, push, and create or update
the ready-for-review PR.

This skill verifies, commits, pushes, creates or reuses a ready-for-review pull
request, then loops through mergeability, currently available PR feedback,
eligible conversation resolution, and checks until the PR is ready-to-merge or
the current check state has been fully triaged and reported. Failing checks do
not halt the skill by themselves. It never merges the PR.

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
   re-query PR feedback after checks, re-query again after every watch exit or
   timeout, fix branch-local issues, push, and repeat. When a failing check is
   outside branch scope or cannot be fixed by the agent, record a concrete
   disposition and continue to final reporting instead of halting.
9. Mark draft PRs ready only when the loop reaches the ready state.
10. Report ready-to-merge status or concrete non-ready check dispositions
    without merging.

## Guardrails

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
- Stop for secrets, permissions, product decisions, or ambiguous scope that are
  not check-related.
