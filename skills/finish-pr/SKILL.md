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
request, watches checks fail-fast, handles existing review feedback, and stops
at ready-to-merge. It never merges the PR.

## Workflow

1. Read repository guidance, commit rules, and the PR template.
2. Infer the issue from the current branch or existing PR metadata; ask if
   ambiguous.
3. Inspect uncommitted changes and stage only relevant paths.
4. Run the repository's documented verification commands.
5. Commit using the repository's required commit format.
6. Push the branch when there is work to publish.
7. Create or update a ready-for-review PR using the repository template.
8. Watch checks fail-fast, triage failures, and fix branch-local failures.
9. Handle existing PR feedback with the shared triage workflow.
10. Report ready-to-merge status without merging.

## Guardrails

- Do not rewrite branch history or force-push by default.
- Do not create follow-up issues from PR feedback.
- Do not wait indefinitely for new human review comments.
- Do not add AI or agent attribution unless the repository requires it.
- Stop for secrets, permissions, product decisions, or ambiguous scope.
