# Begin-Work Routing Workflow

`using-github` no longer owns the branch procedure directly. Beginning issue
work is owned by the first-class `working-on-github-issue` skill: it validates the issue
reference, marks the issue started (best-effort self-assign and Project status),
and lands on the issue-linked branch. `working-on-github-issue` delegates the actual
branch creation to the low-level `new-branch` skill; route a bare branch-only
request straight to `new-branch`.

Important branch-setup defaults (owned by `new-branch`):

- Branches use `<issue-number>-<kebab-title>` from the repository default branch.
- Dirty worktrees are refused instead of stashed or committed.
- Empty branches remain local.
- Dependency installation, pushing, committing, PR creation, CI, and
  implementation work are out of scope for branch setup.
