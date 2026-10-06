# ADR-570: Sync upstream skills from one pinned manifest with a forks registry

## Status

Accepted. Supersedes ADR-541. Keeps ADR-541's regenerated merge base and the
rebrand transform from ADR-429.

## Context

The Engineering plugin ships skills from more than one upstream: pstack-claude
as a whole plugin, and individual skills from mattpocock/skills. `sync-pstack`
handled only pstack. The mattpocock skills were copied by hand with no recorded
upstream commit, so they could not be synced and their drift was invisible.
`skills-lock.json` cannot serve as the sync: it records content hashes, not
commits; it always installs the default branch tip; and it writes only into
agent directories.

## Decision

`pnpm sync-upstream-skills` syncs every source declared in one root manifest.
A source has a repo URL, a ref, a full-SHA pin, a rename map, a denylist, a
transforms hash, and targets. A target is either a subtree with excludes or one
named skill with a destination. New upstream skills never arrive without a
manifest edit.

Each run regenerates the merge base from the pinned commit and applies upstream
changes since the pin with `git cherry-pick --no-commit`. Overlaps with local
edits become real index conflicts. Transforms are limited to renames and a
denylist. If a source's transforms hash changed since the last sync, the sync
stops until the transform change is committed on its own at the current pin.

Every file under a synced destination that differs from its transformed
upstream needs an entry in the forks registry with its kind, reason, and
upstream status. CI runs a dry-run sync at the pin and fails on undeclared or
stale forks and on conflict markers under synced paths.

A skill fetched by the sync is never listed in `skills-lock.json`; the lock is
only for skills this repository uses locally. A contract test enforces the
split.

## Considered Options

- Fetch mattpocock skills with the skills CLI into a committed staging
  directory and merge from its git history. Rejected because it adds a second
  fetcher with no commit pin or destination flag.
- Sentence-level rewrite rules, as pstack-claude uses. Rejected because they
  stop matching silently when upstream rewords a sentence.

## Consequences

- Every deliberate Patina edit to upstream text has a written reason, and
  undeclared drift fails CI.
- The manifest pins and transforms hash are load-bearing; a wrong pin or an
  unrecorded transform change produces wrong conflicts.
- Adding an upstream skill is a manifest edit plus removing any lock entry for
  it.
