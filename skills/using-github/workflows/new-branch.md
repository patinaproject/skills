# New Branch Routing Workflow

`using-github` no longer owns the branch procedure directly. For issue-linked
branch setup, use the first-class `new-branch` skill and follow
that skill's issue branch workflow.

Important defaults:

- Branches use `<issue-number>-<kebab-title>` from the repository default branch.
- Dirty worktrees are refused instead of stashed or committed.
- Empty branches remain local.
- Dependency installation, pushing, committing, PR creation, CI, and
  implementation work are out of scope for branch setup.
