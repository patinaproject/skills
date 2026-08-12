---
name: move-branch-here
description: "Take a branch that another worktree of this repository has checked out and attach it to the current worktree, carrying its polish review state. Use when a checkout is refused because the branch is already used by another worktree, or when the user asks to move a branch here."
---

# Move Branch Here

## Quick Start

Invoke from the worktree that should end up on the branch:

```text
/move-branch-here 350-add-a-move-branch-here-skill
/move-branch-here 350-add-a-move-branch-here-skill --from /tmp/other-session
```

The optional `--from` value is the temporary root of the session that reviewed
the branch elsewhere; it only affects the review-state step.

The move releases the branch from the worktree holding it and attaches it here.
That worktree keeps its files and lands on a detached HEAD at the same commit.
This skill commits nothing, pushes nothing, and removes no worktree.

Scope is the worktrees of one repository, which `git worktree list` enumerates.
A branch that lives in a separate clone is a fetch rather than a move: report
that and stop.

## Step 1 — Resolve the Holder

Resolve `<skill-directory>` to the directory containing this `SKILL.md`, then
run the bundled helper:

```sh
<skill-directory>/scripts/worktree-context.sh resolve <branch>
```

The tab-separated result carries `mode`, branch name, branch head, holder path,
holder head, and the count of untracked files in the holder. Keep every field
for the next step.

| Mode | Meaning | Next action |
| --- | --- | --- |
| `here` | This worktree already has the branch | Report the no-op and continue at Step 3 |
| `free` | No worktree holds the branch | Attach it in Step 2 |
| `held` | Another worktree holds the branch | Release and attach it in Step 2 |

The helper exits non-zero rather than moving a branch out from under work in
progress. Each message names the blocker and the command that clears it:
uncommitted tracked changes in either worktree, a merge, rebase, cherry-pick,
revert, or bisect in either worktree, a locked holder, or a holder path that no
longer exists. Report that blocker and stop; the operator decides whether to
commit, stash, finish, abort, or unlock.

## Step 2 — Move the Branch

```sh
<skill-directory>/scripts/worktree-context.sh move <branch> <branch-head> [holder-path]
```

Pass the holder path in `held` mode and omit it in `free` mode. The helper
revalidates the resolved context before touching either worktree, detaches the
holder, attaches the branch here, and restores the holder to the branch when
attaching fails. A failed move leaves the branch where it started.

Untracked files stay in the holder. When the resolved count is above zero, name
it in the final report so the operator knows work remains at that path.

## Step 3 — Carry the polish Review State

`polish` keys its disposable review record to the repository, the source
branch, and the target branch, so the record already follows a branch between
worktrees. A session that resolves a different temporary root cannot see it,
which costs a full re-review of an already reviewed branch.

Read [`polish/review-record.md`](../polish/review-record.md) before running its
commands, and resolve `<polish-skill-directory>` to the installed `polish`
directory beside this skill. When `polish` is not installed, report that the
review state was left alone and finish; the move itself still succeeded.

1. Resolve the target branch from `origin/HEAD` and read what this session can
   already see:

   ```sh
   node <polish-skill-directory>/scripts/review-state.mjs scope --target <target-branch>
   ```

   A `valid` state means the record carried with the branch. Report its `mode`
   and outstanding findings, and finish.

2. Otherwise the record is `missing` here. With a `--from` root supplied, copy
   it in and re-read the scope:

   ```sh
   node <polish-skill-directory>/scripts/review-state.mjs relocate \
     --from <other-temporary-root> --branch <branch>
   ```

3. With no `--from` root, report that this session sees no review state for the
   branch and name the `relocate` command above, so the operator can supply the
   other session's temporary root later.

## Final Report

Always include:

- The branch, its head commit, and the worktree it now lives in.
- The released worktree path and its detached HEAD, or the no-op that needed no
  release.
- Untracked files left behind in the released worktree, when there are any.
- The review state outcome: carried, relocated, absent, or unhandled because
  `polish` is not installed.
- The blocker that stopped the move, when one did.
