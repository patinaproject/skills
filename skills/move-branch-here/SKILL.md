---
name: move-branch-here
description: Move a branch from another worktree in the same repository to the current worktree, and copy its polish review record when available. Use when Git refuses checkout because another worktree holds the branch or when the user asks to move it here.
---

# Move a branch here

Run this skill from the worktree that should receive the branch.

```text
/move-branch-here 350-add-a-move-branch-here-skill
/move-branch-here 350-add-a-move-branch-here-skill --from /tmp/other-session
```

`--from` names the temporary directory of the session that reviewed the branch.
It is used only when copying the `polish` review record.

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
| `here` | The current worktree already has the branch | Report this and continue to the review record |
| `free` | No worktree has the branch | Attach it here |
| `held` | Another worktree has the branch | Release it there and attach it here |

The helper refuses to move the branch when either worktree has uncommitted
tracked changes or an active merge, rebase, cherry-pick, revert, bisect, or
patch operation. It also refuses a missing, locked, or unreadable worktree.
Report the helper's message and stop. The user decides whether to commit, stash,
finish, abort, unlock, or prune.

In `free` mode the helper checks every listed worktree for an operation that may
temporarily detach its branch. A deleted worktree directory can be pruned and
does not stop the move unless its state cannot be read safely.

## Move the branch

Run:

```sh
<skill-directory>/scripts/worktree-context.sh move <branch> <branch-commit> [old-worktree-path]
```

Pass the old worktree path in `held` mode and omit it in `free` mode. The helper
checks the earlier result again before changing either worktree. If attachment
fails, it restores the branch to the old worktree.

Untracked files stay in the old worktree. Record their count and path when the
count is greater than zero.

## Copy the polish review record

Read [`polish/review-record.md`](../polish/review-record.md). Resolve
`<polish-skill-directory>` to the installed `polish` skill next to this one.
If its `scripts/review-state.mjs` is missing, report that the branch moved but
the review record was not handled.

1. Resolve the target branch from `origin/HEAD`, then run:

   ```sh
   node <polish-skill-directory>/scripts/review-state.mjs scope --target <target-branch>
   ```

   A `valid` result means the record already moved with the branch. Report its
   mode and open findings. Treat `unavailable` or `corrupt` as `missing`.

   If the command refuses because the current worktree has uncommitted or
   untracked files, report that `polish` needs a clean worktree to read the
   record. The branch move still succeeded.

2. For `missing` with a `--from` directory, run:

   ```sh
   node <polish-skill-directory>/scripts/review-state.mjs relocate \
     --from <other-temporary-directory> --branch <branch>
   ```

   Read the record again with the `scope` command. An empty `relocated` list or
   a source directory with no review data means there is no record to copy.

3. For `missing` without `--from`, report that this session cannot find a
   review record. Show the `relocate` command above when the user can provide
   the other session's temporary directory.

## Final report

Report the branch, branch commit, and current worktree. Include the old
worktree and its detached commit when one was released, any untracked files
left there, the review record result, and any error that stopped the move.
