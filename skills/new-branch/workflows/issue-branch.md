# Issue Branch Workflow

Prepare the local issue-linked branch without mixing work or triggering CI.

## Steps

1. Read `docs/issue-tracker.md` and fetch the explicit current ticket with
   relationships included.
2. Refuse a missing ticket or a completed ticket unless the user explicitly
   allows completed-issue work.
3. Inspect native blockers. Refuse when any blocker is non-completed unless the
   user explicitly says to start blocked work. If relationships cannot be read,
   refuse rather than assuming the issue is unblocked.
4. Take the fetched ticket's `gitBranchName` verbatim. Refuse an empty branch
   name; do not compose, normalize, shorten, or add a prefix.
5. Inspect `git branch --show-current` and `git status --porcelain`. Refuse a
   dirty worktree. If already on the target branch, report success. If on a
   different issue-linked branch, ask before changing issue context.
6. Resolve the default branch from `refs/remotes/origin/HEAD`, then fetch that
   branch from `origin`. Check whether the exact target branch exists on
   `origin`; when it does, fetch it into `refs/remotes/origin/<target-branch>`.
   Refuse when the default cannot be resolved or fetched, or when an existing
   remote target branch cannot be fetched.
7. If the target branch does not exist locally, create it from the fetched
   `origin/<target-branch>` when that remote exists; otherwise create it from
   `origin/<default-branch>`. If it exists locally, switch to it and fast-forward
   it from the fetched remote target when present. Then rebase it onto the
   fetched default branch. Stop and report a non-fast-forward update or rebase
   conflict.
8. Report the branch and base SHA.

Do not stash or commit a dirty worktree. Do not push an empty branch, install
dependencies, open a pull request, or begin implementation.
