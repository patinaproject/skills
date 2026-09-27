---
name: move-branch-here
description: Move a branch from another worktree in the same repository to the current worktree. Use when Git refuses checkout because another worktree holds the branch or when the user asks to move it here.
---

# Move a branch here

Run this skill from the worktree that should receive the branch.
The helper requires Bash 4.4 or newer and Node.js 24 or newer. It checks the
Node runtime before changing either worktree.

```text
/move-branch-here 350-add-a-move-branch-here-skill
```

This skill moves branches only between worktrees of the same repository. If the
branch is in another clone, tell the user it must be fetched instead and stop.
The old worktree stays at the same commit on a detached HEAD. Leave commits,
pushes, and worktree removal to the user.

## Find the branch

Resolve `<skill-directory>` to this skill's installed directory, then run:

```sh
<skill-directory>/scripts/worktree-context.sh resolve <branch>
```

The tab-separated output contains the mode, branch, branch commit, untracked
file count, old worktree path, and old worktree commit.

| Mode | Meaning | Next step |
| --- | --- | --- |
| `here` | The current worktree already has the branch | Report this and continue to the final report |
| `free` | No worktree has the branch | Attach it here |
| `held` | Another worktree has the branch | Release it there and attach it here |

The helper transfers staged, unstaged, and non-ignored untracked files from the
old worktree. It preserves the staged and unstaged split. Ignored files stay
where they are, and unrelated destination files stay untouched.

The helper refuses tracked changes in the current worktree and active merge,
rebase, cherry-pick, revert, bisect, or patch operations in either worktree.
Missing, locked, or unreadable worktrees and colliding paths also stop the move.
Report the helper's refusal without changing those states.

Intent-to-add, split or sparse indexes, skip-worktree, assume-unchanged,
submodules, nested repositories, special filesystem entries, and file-content
conversion attributes require separate handling. Differing worktree settings
for file modes, ignored paths, attributes, or rename detection also stop the move.
The helper refuses these states
before transfer. Ordinary binary files, executable modes, symlinks, additions,
deletions, and renames are supported.

In `free` mode the helper checks every listed worktree for an operation that may
temporarily detach its branch. A deleted worktree directory can be pruned and
does not stop the move unless its state cannot be read safely.

## Move the branch

Run:

```sh
<skill-directory>/scripts/worktree-context.sh move <branch> <branch-commit> [old-worktree-path]
```

Pass the old worktree path in `held` mode and omit it in `free` mode. The helper
checks the earlier result again before changing either worktree. It captures
private recovery data without using the shared stash stack. After verification,
the old worktree is detached at its original commit, tracked-clean, and contains
none of the transferred untracked payload.

The four-column result stays on stdout. Quoted transferred paths appear on
stderr. Preserve those paths for the final report.

## Recover an interrupted move

Handled failures restore both worktrees and return the reason. An interrupted
move, an unexpected concurrent edit, or a failed restoration retains its
private recovery data and reports a transaction ID. Resolution is read-only
and reports pending transfers.

Run the reported recovery command from either worktree:

```sh
<skill-directory>/scripts/worktree-context.sh recover <transaction-id>
```

Recovery verifies ownership and known file states before restoration. If it
reports unexpected state, preserve the artifacts and report the conflicting
path. A committed move with incomplete artifact cleanup needs only recovery
cleanup. Repeating completed recovery is safe.

## Final report

Report the branch, branch commit, and current worktree. Include the old
worktree and its detached commit when one was released, every transferred path,
and any refusal or recovery requirement.
