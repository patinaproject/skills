---
name: move-branch-here
description: Move a branch between worktrees of the same repository while preserving its working state, and copy its polish review record when available. Use when Git refuses checkout because another worktree holds the branch or when the user asks to move it here.
---

# Move a branch here

Run this skill from the worktree that should receive the branch.

This is a same-repository worktree transfer. Inspect the current worktree and
every worktree that can hold the requested branch, then choose the Git
operations that produce the contract below. Report the observed mode before
changing either worktree.

## Transfer contract

- In `held` mode, move the branch from the other worktree here. Transfer every
  staged change, unstaged change, and non-ignored untracked path, preserving the
  staged/unstaged split. Leave ignored files in their original worktree.
- In `free` mode, attach the branch here when this worktree is tracked-clean.
- In `here` mode, report that the branch is already here and continue to the
  review-record step.
- After a held transfer, this worktree has the branch and the same working
  state. The old worktree is detached at its original commit, tracked-clean,
  and contains none of the transferred untracked paths.
- Unrelated destination files remain untouched. Inspect only the paths needed
  to establish the contract; a large ignored tree must not make the transfer
  scale with the number of ignored files.
- A branch that exists only in another clone must be fetched there first. Tell
  the operator to fetch it and stop without changing either worktree.

## Safe stops

Stop before mutation and name the condition when:

- this worktree has tracked changes;
- either worktree is in a merge, rebase, cherry-pick, revert, bisect, or patch
  application;
- a worktree is missing, locked, unreadable, or belongs to another repository;
- an incoming path would overwrite an untracked destination path; checkpoint
  for the operator instead of inventing destructive overwrite behavior;
- the index or repository state is ambiguous, including intent-to-add, split or
  sparse indexes, skip-worktree or assume-unchanged entries, submodules,
  nested repositories, special filesystem entries, unsupported conversion
  attributes, or differing worktree settings.

When a safe stop applies, leave both worktrees unchanged. Do not ask the
operator to approve a state that the contract already requires transferring;
ask for a checkpoint only where the contract does not define safe handling.

Leave commits, pushes, and worktree removal to the operator. Do not create a
transaction journal, lease, recovery command, or replacement helper engine.

## Copy the polish review record

Resolve `<polish-skill-directory>` to an installed `polish` skill. If no
`polish` skill is installed or its `scripts/review-state.mjs` is missing,
report that the branch moved but the review record was not handled.

1. Resolve the target branch from `origin/HEAD`, then run:

   ```sh
   node <polish-skill-directory>/scripts/review-state.mjs status --target <target-branch>
   ```

   A `valid` result means the record already moved with the branch. Report its
   reviewed head and open findings. Treat `unavailable` or `corrupt` as
   `missing`.

2. For `missing` with a `--from` directory, run:

   ```sh
   node <polish-skill-directory>/scripts/review-state.mjs relocate \
     --from <other-temporary-directory> --branch <branch>
   ```

   Read the record again with the `status` command. An empty `relocated` list or
   a source directory with no review data means there is no record to copy.

3. For `missing` without `--from`, report that this session cannot find a
   review record. Show the `relocate` command above when the user can provide
   the other session's temporary directory.

## Final report

Report the branch, branch commit, and current worktree. Include the old
worktree and its detached commit when one was released, every transferred path,
the review record result, and any refusal or recovery requirement.
