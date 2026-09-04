# ADR-429: Sync open-pstack via a rebrand transform and a carrier branch

## Status

Accepted

## Context

`plugins/engineering/**` is a rebrand of an upstream pstack plugin. Its base is
moving from `pstack-claude` to `ericlitman/open-pstack`, and thereafter we need
a repeatable way to pull open-pstack's changes in
([#429](https://github.com/patinaproject/skills/issues/429)). Patina edits the
plugin locally, so a resync must preserve those edits: it must land upstream's
changes and stop on a real merge conflict wherever an upstream change overlaps a
local edit — not silently overwrite, and not skip files by an exclude list.

The obstacle is that upstream and our tree share no ancestor for these files.
The plugin is vendored at `plugins/engineering/**` (not upstream's
`plugins/pstack/**`), and the transform renames `poteto-mode` → `patina-mode`
and `poteto-agent` → `patina-agent` in both paths and content. A raw `git merge` of
open-pstack against our tree therefore refuses (`fatal: refusing to merge
unrelated histories`) or treats every file as an add/add collision. A
`git merge` writes true `<<<<<<<`/`=======`/`>>>>>>>` markers only where both
sides changed the same region *relative to a shared merge base*, so a stable
merge base carrying the vendored layout is required. `git subtree` and
`-X subtree` only shift paths, never file contents; Copybara and josh do not
hand back native git conflict markers; rsync+sed runs no merge at all.

## Decision

`pnpm sync-pstack` (`scripts/sync-pstack.sh`) imports the current tip of
`open-pstack/main`, applies a byte-stable transform
(`scripts/pstack-transform.sh`), and merges it through a single script-managed
**carrier branch** (`pstack-sync`) that holds the vendored upstream over time.

- The transform is exactly two renames, `poteto-mode` → `patina-mode` and
  `poteto-agent` → `patina-agent`, applied to both path segments and text
  contents in a single `LC_ALL=C` pass. Everything else stays upstream-named on
  purpose — the fewer things the fork rebrands, the less surface a resync has to
  conflict on. Applying the renames to content keeps each renamed thing
  consistent with how the tree refers to it (a skill folder and its `SKILL.md`
  `name:`, an agent file and its references). No replacement contains a source
  token and the two source tokens are distinct, so the pass cannot double-apply
  and is byte-stable across upstream versions. Binary files are copied verbatim.
- The carrier branch is seeded from the working branch on first run, so that
  run's merge base is the current HEAD: the tree has not diverged yet, so the
  merge cleanly takes the rebranded open-pstack content. That first merge is the
  base switch.
- Each later run commits the freshly rebranded snapshot as a child of the
  previous carrier commit, so the previous rebranded snapshot is the merge base.
  The merge then conflicts only where local edits overlap what upstream changed
  since the last sync. The carrier is updated in an isolated worktree, so the
  operator's checkout is never switched underneath them.

`open-pstack/main` is the target on every run — the sync follows the branch tip
rather than a pinned SHA.

## Consequences

- Resync leaves standard conflict markers in the working tree; the operator
  resolves them with normal git tooling (the repository's
  `resolving-merge-conflicts` skill applies) and commits.
- The mechanism depends only on git plus a small POSIX shell transform — no
  JVM, Bazel, or extra vendoring tool — which fits this pnpm/Node repository.
- Byte-stability is load-bearing: any drift in the transform (locale, an extra
  pass) would manufacture phantom conflicts. It is locked by a fixed rule under
  `LC_ALL=C` and covered by
  `scripts/tests/sync-pstack.test.sh`, which also asserts that a diverged sync
  produces real conflict markers.
- The carrier branch's history must stay lineal; it is script-managed and must
  not be re-seeded or rebased, or the shared merge base is lost and the whole
  tree collides again.
