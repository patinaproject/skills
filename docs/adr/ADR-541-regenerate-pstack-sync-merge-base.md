# ADR-541: Regenerate the pstack sync merge base from a recorded upstream commit

## Status

Accepted. Supersedes the carrier-branch mechanism in
[ADR-429](ADR-429-sync-pstack-carrier-branch.md). The rebrand transform that
ADR-429 defines stays in force.

## Context

[ADR-429](ADR-429-sync-pstack-carrier-branch.md) merged a script-managed
`pstack-sync` carrier branch into the working branch. The previous carrier
commit served as the 3-way merge base, which only works while carrier commits
become ancestors of `main`
([#541](https://github.com/patinaproject/skills/issues/541)).

This repository allows only squash merges. A squash merge lands the synced tree
as a new single-parent commit, so the carrier commit never reaches `main`. After
the base switch landed that way, `git merge-base origin/main pstack-sync`
resolved to a commit from before the switch. A simulated sync of pstack-claude
`5c036ce3` against `main` conflicted in 119 files. With the previous transformed
snapshot as the base, the same sync conflicted in 23 files, all of them files
Patina edited.

The carrier branch also lived in one operator's checkout and was never pushed.
No other clone could run the sync, which blocked an unattended weekly sync.

## Decision

`plugins/engineering/upstream.json` records the last synced pstack-claude
commit in its `commit` field. `pnpm sync-pstack` (`scripts/sync-pstack.sh`)
reads it, fetches the current tip of pstack-claude's `main`, and stops with
nothing to do when the two match.

Otherwise the script regenerates the merge base. The transform is byte-stable,
so transforming the recorded commit reproduces the snapshot the last sync
applied. The script builds two throwaway commits with a temporary index, leaving
the operator's worktree and index alone:

- The base is `HEAD`'s tree with `plugins/engineering/**` replaced by the
  transformed recorded commit.
- The tip is a child of the base with `plugins/engineering/**` replaced by the
  transformed upstream tip.

`git cherry-pick --no-commit` applies the tip onto `HEAD`. Only what upstream
changed since the recorded commit reaches the tree, and standard conflict
markers appear where it overlaps Patina's edits. Files that upstream never ships,
such as `upstream.json` and `NOTICE.md`, are absent from both snapshots and stay
unchanged. The script then writes the new tip into `upstream.json` and stages it.
It creates no commit and no branch. The operator commits the result with a
normal `type: #N` message.

With no recorded commit, the base holds an empty `plugins/engineering/**`, which
imports upstream from scratch.

## Consequences

- The sync works under squash merges and from any clone, because nothing depends
  on branch ancestry or a local branch.
- The sync writes no commit of its own, so it needs no `--no-verify` commit and
  no commitlint exception.
- `upstream.json` is load-bearing. A wrong `commit` value produces a wrong merge
  base, and the conflicts show it.
- The transform's byte-stability is now load-bearing twice. It must reproduce
  the previous snapshot exactly, or phantom conflicts appear.
  `scripts/tests/sync-pstack.test.sh` covers it and the squash-merge scenario.
- A cherry-pick with `--no-commit` leaves no `CHERRY_PICK_HEAD`. The operator
  aborts with `git reset --merge` instead of `git cherry-pick --abort`.
