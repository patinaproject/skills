# Prepare an issue branch

1. Read `docs/issue-tracker.md` and fetch the requested issue with its
   relationships. If the file is missing, stop and say that
   `scaffold-repository` provides it.
2. Stop when the issue is missing or complete unless the user explicitly allows
   work on a completed issue.
3. Read the issue's blockers. Stop when any blocker is incomplete unless the
   user explicitly allows blocked work. If relationships cannot be read, do not
   assume the issue is unblocked.
4. Get the branch name from `docs/issue-tracker.md` and use it exactly. Stop on
   an empty name. Do not create a different spelling or prefix.
5. Run `git branch --show-current` and `git status --porcelain`. Stop when the
   worktree has changes. If already on the requested branch, report success. If
   another issue branch is checked out, ask before switching to different issue
   work.
6. Resolve the default branch from `refs/remotes/origin/HEAD` and fetch it from
   `origin`. Check whether the requested issue branch exists on `origin` and
   fetch it when present. Stop when the default branch or existing remote issue
   branch cannot be fetched.
7. If the branch does not exist locally, create it from the fetched remote issue
   branch when available, otherwise from the fetched default branch. If it
   exists locally, switch to it and fast-forward it from its remote branch when
   available. Rebase it onto the fetched default branch. Stop on a
   non-fast-forward update or rebase conflict.
8. Report the branch name and starting commit.

Do not stash or commit existing changes. Do not push an empty branch, install
dependencies, open a pull request, or begin implementation.
