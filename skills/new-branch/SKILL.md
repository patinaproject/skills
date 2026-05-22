---
name: new-branch
description: Prepare local GitHub issue branches from the repository default branch using GitHub-style issue branch names. Use when starting issue-linked work, when the user says new branch for an issue, or when an agent must move onto the correct issue branch before implementation.
---

# New Branch

## Quick Start

Given an issue reference, follow [workflows/issue-branch.md](workflows/issue-branch.md).

Example: issue `#42` titled `Let agents use GitHub more ergonomically`
becomes local branch `42-let-agents-use-github-more-ergonomically`.

The skill creates or switches to the local issue branch only. It does not
install dependencies, push, commit, create a pull request, or start
implementation work.

## Workflow

1. Read the repository guidance first, especially branch and GitHub rules.
2. Resolve the issue in the current working directory's default `gh` repository.
3. Halt when open native GitHub `blockedBy` dependencies exist, unless the user
   explicitly asks to start blocked work anyway.
4. Compute the branch name as `<issue-number>-<kebab-title>`, matching
   GitHub's issue branch suggestion.
5. Refuse to switch branches when the worktree has uncommitted changes.
6. Fetch the repository default branch from `origin`.
7. Create the branch from `origin/<default-branch>`, switch to it, or warn
   before leaving a different issue branch.
8. Report the branch and base SHA.

## Guardrails

- Stay in the current `gh` repository; do not accept cross-repo flags.
- Never hardcode `main`; resolve the default branch through `gh repo view`.
- Keep empty issue branches local.
- Ask before switching away from a different issue branch.
- Use native GitHub issue relationships as the blocked-work source of truth.
- Stop on rebase conflicts and surface the manual resolution steps.
