---
name: move-branch-here
description: "Attach a branch another worktree holds to the current worktree, carrying its polish review state. Use when a checkout is refused because the branch is already used by another worktree, or when the user asks to move a branch here."
---

# Move Branch Here

## Quick Start

Invoke from the worktree that should end up on the branch:

```text
/move-branch-here 350-add-a-move-branch-here-skill
/move-branch-here 350-add-a-move-branch-here-skill --from /tmp/other-session
```

`--from` names the temporary root of the session that reviewed the branch
elsewhere, and reaches only Step 3.

The move releases the branch from the worktree holding it and attaches it here.
The released worktree keeps its files on a detached HEAD at the same commit.
Leave committing, pushing, and worktree removal to the operator.

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
holder head, and the count of untracked files in the holder. Step 2 consumes
those fields.

| Mode | Meaning | Next action |
| --- | --- | --- |
| `here` | This worktree already has the branch | Report the no-op and continue at Step 3 |
| `free` | No worktree holds the branch | Attach it in Step 2 |
| `held` | Another worktree holds the branch | Release and attach it in Step 2 |

The helper exits non-zero rather than moving a branch out from under work in
progress — uncommitted tracked changes, an operation in progress, a locked
holder, or a holder path that no longer exists. Its message names the blocker
and the command that clears it. Report that message and stop; committing,
stashing, finishing, aborting, or unlocking is the operator's call.

## Step 2 — Move the Branch

```sh
<skill-directory>/scripts/worktree-context.sh move <branch> <branch-head> [holder-path]
```

Pass the holder path in `held` mode and omit it in `free` mode. The helper
revalidates the resolved context before touching either worktree, releases the
holder, attaches the branch here, and restores the holder to the branch when
attaching fails. A failed move leaves the branch where it started.

Untracked files stay in the released worktree. When the resolved count is above
zero, name it in the final report so the operator knows work remains at that
path.

## Step 3 — Carry the polish Review State

A `polish` review record follows its branch between the worktrees of one
repository, and a session that resolves a different temporary root sees none of
it — paying a full re-review of an already reviewed branch. Read
[`polish/review-record.md`](../polish/review-record.md) for the record's
identity and commands, resolving `<polish-skill-directory>` to the installed
`polish` directory beside this skill. A missing
`<polish-skill-directory>/scripts/review-state.mjs` means `polish` is not
installed: report that the review state was left alone and finish, because the
move itself still succeeded.

1. Resolve the target branch from `origin/HEAD` and read what this session sees:

   ```sh
   node <polish-skill-directory>/scripts/review-state.mjs scope --target <target-branch>
   ```

   A `valid` state carried with the branch. Report its `mode` and outstanding
   findings, and finish.

2. A `missing` state with a `--from` root copies the record in, then re-reads
   the scope above:

   ```sh
   node <polish-skill-directory>/scripts/review-state.mjs relocate \
     --from <other-temporary-root> --branch <branch>
   ```

3. A `missing` state with no `--from` root finishes on the report: this session
   sees no review state for the branch, and the `relocate` command above takes
   the other session's temporary root whenever the operator has it.

## Final Report

Always include:

- The branch, its head commit, and the worktree it now lives in.
- The released worktree path and its detached HEAD, or the no-op that needed no
  release.
- Untracked files left behind in the released worktree, when there are any.
- The review state outcome: carried, relocated, absent, or unhandled because
  `polish` is not installed.
- The blocker that stopped the move, when one did.
