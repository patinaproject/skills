---
name: new-branch
description: Branch for a GitHub issue locally from the repository default branch, named in GitHub's issue-branch style. Use when starting issue-linked work, or when an agent must move onto the correct issue branch before implementation.
---

# New Branch

Given an issue reference, follow [workflows/issue-branch.md](workflows/issue-branch.md)
end to end — it owns the steps, refusals, and shell.

Example: issue `#42` titled `Let agents use GitHub more ergonomically`
becomes local branch `42-let-agents-use-github-more-ergonomically`.

This skill only creates or switches to the local issue branch. It does not
install dependencies, push, commit, open a pull request, or start
implementation work.
