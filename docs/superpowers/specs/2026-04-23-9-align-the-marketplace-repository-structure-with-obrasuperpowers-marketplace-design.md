# Design: Align the marketplace repository structure with obra/superpowers-marketplace

Date: 2026-04-23
Issue: #9

## Intent

Reshape `patinaproject/skills` so it reads like a marketplace repository first, using `obra/superpowers-marketplace` as the file-structure reference model, while preserving Patina-specific marketplace behavior for both Codex and Claude.

## Active Acceptance Criteria

### AC-9-1

`patinaproject/skills` uses `obra/superpowers-marketplace` as the deliberate file-structure model.

### AC-9-2

Marketplace metadata and contributor docs follow a clearer, more consistent layout.

### AC-9-3

The repo documents the ownership boundary between marketplace metadata and upstream plugin source repos.

### AC-9-4

Any structural changes preserve the intended marketplace install behavior.

## Current State

The current repository already separates marketplace catalogs from upstream plugin source code, but it still reads like a small tooling repo instead of a minimal marketplace repo:

- the README mixes marketplace explanation, install instructions, and structural notes
- `docs/file-structure.md` repeats structure guidance that could live in the primary marketplace documentation
- the root contains contributor tooling files that are valid for this repo, but the top-level narrative does not make clear which files are core marketplace artifacts and which are maintenance aids
- Patina supports two install surfaces, `.agents/plugins/marketplace.json` for Codex and `.claude-plugin/marketplace.json` for Claude, while the reference repo only needs one
- the current docs hard-code `superteam`'s upstream plugin path even though `patinaproject/superteam#20` is intended to change the upstream canonical directory layout

## Reference Model

`obra/superpowers-marketplace` is intentionally minimal:

- root `README.md` is the main documentation entrypoint
- `.claude-plugin/marketplace.json` is the primary marketplace artifact
- there is very little extra structure competing with the marketplace purpose

The relevant behavior to mirror is not exact file parity. It is the stronger hierarchy:

1. marketplace metadata is obvious
2. README is the primary source of truth for operators
3. upstream plugin ownership stays outside the marketplace repo

## Approaches Considered

### Option 1: Exact mirror

Reduce this repo to nearly the same shape as `obra/superpowers-marketplace`, removing Patina-specific additions until only the Claude marketplace catalog and README remain.

Why not chosen:

- this would break the Codex marketplace surface that this repo already owns
- it would fail the requirement to preserve intended marketplace install behavior

### Option 2: Functional mirror

Mirror the reference repository's structure philosophy while preserving the minimum extra files required for Patina's dual-surface marketplace support.

Chosen because:

- it keeps the repo recognizable as a marketplace-first repository
- it preserves both marketplace install surfaces
- it reduces custom layout decisions without pretending Patina and Obra have identical runtime needs

### Option 3: Docs-only cleanup

Keep the structure mostly as-is and only rewrite docs to say it is marketplace-first.

Why not chosen:

- it would leave the structural ambiguity in place
- it would not satisfy the issue's request to align the repository structure itself

## Chosen Design

Adopt a marketplace-first root layout that mirrors the reference model's priorities:

- keep `README.md` as the main operator and contributor entrypoint
- keep marketplace catalogs in dedicated top-level hidden directories
- minimize extra top-level documentation that duplicates README guidance
- keep Superpowers planning artifacts under `docs/superpowers/` because they are process artifacts, not marketplace surface area

The target repository shape is:

```text
skills/
├── .agents/
│   └── plugins/
│       └── marketplace.json
├── .claude-plugin/
│   └── marketplace.json
├── docs/
│   └── superpowers/
│       ├── plans/
│       └── specs/
├── README.md
├── AGENTS.md
├── CLAUDE.md
├── LICENSE
├── package.json
├── commitizen.config.js
├── commitlint.config.js
└── scripts/
    └── prepare.sh
```

## Structural Decisions

### 1. Make README the canonical structure guide

`README.md` should absorb the durable guidance currently split between the README and `docs/file-structure.md`.

That includes:

- what this repo owns
- what upstream plugin repos own
- where marketplace metadata lives
- how Codex and Claude install paths differ
- why `.agents/` exists even though the reference repo does not need it

### 2. Remove duplicate general-structure documentation

Delete `docs/file-structure.md` after its useful content is merged into the README.

This makes the repo closer to the reference model by keeping the primary structure explanation at the root instead of in a secondary doc.

### 3. Keep only justified top-level deviations from the reference model

Keep these deviations and document them explicitly:

- `.agents/plugins/marketplace.json` because Patina supports Codex marketplace installs
- `AGENTS.md` and `CLAUDE.md` because contributor workflow guidance is required for this repo
- lightweight commit tooling files because they support the repo's documented contribution rules
- `docs/superpowers/` because issue-driven design and planning artifacts belong to the workflow used in this repo

Anything else should not be introduced unless it directly supports marketplace maintenance.

### 4. Clarify ownership boundaries

The README should state that this repo owns:

- marketplace catalogs
- marketplace-facing installation documentation
- contributor guidance for maintaining the marketplace

The README should also state that upstream plugin repos own:

- plugin code and skills
- plugin manifests and package internals
- plugin-specific release cadence and implementation details

### 5. Preserve install behavior while updating to the canonical upstream path

This issue should preserve working marketplace installs, but it should not preserve legacy upstream paths for compatibility once the canonical `superteam` path is known.

That means:

- `.claude-plugin/marketplace.json` should continue to list the same upstream plugin repository
- `.agents/plugins/marketplace.json` should continue to point at the `superteam` plugin package in the upstream repository
- any path references in docs or marketplace metadata should be updated to the single canonical upstream location chosen by `patinaproject/superteam#20`

This issue is about structure clarity in the marketplace repo, but path updates that follow the upstream canonical layout are in scope.

### 6. Follow the upstream path change in `superteam#20` directly

`patinaproject/superteam#20` is expected to remove the duplicated plugin directory and choose one canonical checked-in plugin surface.

Because of that upcoming change, this repo should:

- distinguish the upstream repository from any obsolete checked-in path
- update docs and marketplace metadata to the single canonical upstream location instead of carrying both old and new path language
- avoid any backwards-compatibility wording that implies the duplicated path layout remains supported

If `superteam#20` has not landed by implementation time, this issue should still target the intended canonical path rather than preserving the duplicated layout in prose.

## Implementation Outline

1. Rewrite `README.md` to behave like the reference marketplace README while covering Patina's dual-surface model.
2. Fold in ownership-boundary wording that stays accurate after `superteam#20` removes the duplicated upstream path.
3. Remove `docs/file-structure.md` after folding its durable content into the README.
4. Update `AGENTS.md` so its structure guidance matches the simplified marketplace-first layout.
5. Update path references in marketplace docs and metadata to the canonical upstream `superteam` location with no backwards-compatibility wording.
6. Verify the marketplace JSON files point to the intended install sources after the path update.

## Testing And Verification

- inspect both marketplace manifests with `sed -n '1,200p'`
- confirm `docs/file-structure.md` is removed and no docs still point to it unexpectedly
- review the README and `AGENTS.md` for consistent ownership-boundary wording
- verify marketplace source URLs, paths, and refs match the canonical upstream `superteam` layout with no stale duplicate-path references left behind

## Risks And Mitigations

### Risk: Over-mirroring the reference repo

If the repo is forced into exact parity with `obra/superpowers-marketplace`, Patina could lose its Codex-specific marketplace surface.

Mitigation:

Treat the reference as a structural model, not a literal file list.

### Risk: Leaving contributor guidance fragmented

If some structure guidance stays in secondary docs while other parts move to README, maintainers still have to hunt for the source of truth.

Mitigation:

Make README the canonical structure and ownership document, and keep AGENTS focused on contributor rules.

### Risk: Accidental behavior changes during cleanup

Editing marketplace docs alongside manifests can create subtle source-path drift.

Mitigation:

Update only the path references needed to follow the upstream canonical layout, and verify manifest contents explicitly before closing.

### Risk: The marketplace repo points at the wrong new path

If `superteam#20` is still in motion while this issue is implemented, the marketplace repo could be updated to the wrong final canonical path.

Mitigation:

Verify the final intended upstream canonical path directly from `patinaproject/superteam` issue and repository state before implementation closes, then update all path references consistently with no compatibility aliases.
