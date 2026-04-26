# Design: Align the marketplace repository structure with obra/superpowers marketplace [#9](https://github.com/patinaproject/skills/issues/9)

## Summary

Update the marketplace metadata and contributor-facing documentation in `patinaproject/skills` so the `superteam` entry matches the current upstream repository layout in `patinaproject/superteam`.

The upstream plugin no longer installs from `./plugins/superteam`. It now exposes its Codex and Claude plugin manifests at the repository root and keeps the skill content under `skills/superteam/`. This issue is the marketplace follow-up in the catalog repo: align this repo's install metadata and docs with that root-based structure without changing plugin ownership, plugin identity, or implementation behavior outside this repository.

## Goals

- Point marketplace metadata at the current root-based upstream install surface for `patinaproject/superteam`
- Remove repo-doc references that still describe `./plugins/superteam` as the install path
- Keep the marketplace catalog repo clearly separated from the upstream plugin source repo
- Preserve the existing plugin name, upstream repository, and source-of-truth ownership boundaries

## Non-Goals

- Editing the upstream `patinaproject/superteam` repository
- Reworking the `superteam` plugin's content, skills, prompts, or manifests
- Changing the marketplace slug, display name, or repository ownership model beyond what is required to describe the new root-based install surface
- Planning or implementing unrelated marketplace cleanup

## Acceptance Criteria

### AC-9-1

Codex marketplace metadata in `patinaproject/skills` points `superteam` at the current upstream install surface in `patinaproject/superteam` instead of the removed `./plugins/superteam` subdirectory.

### AC-9-2

Claude-facing catalog metadata and repository documentation describe `patinaproject/superteam` as a root-packaged plugin repository with root-level plugin manifests and `skills/superteam/`, with no stale references to `./plugins/superteam` as the active upstream install path.

### AC-9-3

Contributor-facing documentation preserves the source-of-truth boundary: `patinaproject/skills` owns marketplace catalogs and docs, while `patinaproject/superteam` owns the installable plugin package.

## Context

This repository is the marketplace catalog, not the source repo for the `superteam` plugin. Today, the live upstream repository layout no longer matches the catalog repo's metadata and docs:

- `.agents/plugins/marketplace.json` still points Codex at `./plugins/superteam` using `git-subdir`
- `README.md` still explains `./plugins/superteam` as the upstream install path
- the upstream `patinaproject/superteam` repository now exposes `.codex-plugin/plugin.json` at the root
- the upstream `patinaproject/superteam` repository now exposes `.claude-plugin/plugin.json` at the root
- the upstream `patinaproject/superteam` skill now lives at `skills/superteam/`
- the previous Codex manifest path at `plugins/superteam/.codex-plugin/plugin.json` returns `404`

The repo-local file-structure guidance already distinguishes between subdirectory-backed plugin sources and root-backed plugin sources:

- use `source: "git-subdir"` when the plugin lives in a subdirectory of another repo
- use `source: "url"` when the plugin lives at the root of another repo

This issue therefore needs a catalog-and-docs alignment pass, not an upstream plugin redesign.

## Approach Options

### Option 1: Minimal metadata correction plus doc refresh

Update the Codex marketplace entry to use the root-package source model for `patinaproject/superteam`, then revise docs so they describe the root manifests and `skills/superteam/` layout.

Pros:

- Directly matches the current upstream structure
- Keeps the change limited to the catalog repo surfaces that are currently stale
- Follows the repository's documented rule for root-packaged upstream plugins

Cons:

- Requires careful wording so users understand the plugin is owned upstream while the marketplace catalog remains here

### Option 2: Documentation-only correction

Leave marketplace metadata untouched and only revise the docs to explain that the upstream path moved.

Pros:

- Lowest edit surface

Cons:

- Leaves the Codex marketplace entry broken or misleading
- Fails the core requirement to align the install metadata with the real upstream package surface

### Option 3: Vendor or mirror the upstream plugin into this repository

Copy or mirror the root-packaged upstream plugin into `patinaproject/skills` so the catalog can continue using a local or vendored package layout.

Pros:

- Could reduce cross-repo install indirection

Cons:

- Conflicts with the current source-of-truth boundary
- Expands scope into packaging ownership and duplication strategy
- Unnecessary given the upstream repo already owns the install surface

## Chosen Approach

Use option 1.

The marketplace catalog should describe the upstream plugin the way it exists now: as a root-packaged plugin repository. That means the Codex marketplace entry should stop targeting the deleted `./plugins/superteam` subdirectory, and the docs should stop teaching that outdated path. The catalog repo remains a catalog repo; the upstream plugin repo remains the install source of truth.

## Requirements

1. The Codex marketplace entry for `superteam` must stop referencing `./plugins/superteam` as the source path.
2. The Codex marketplace entry must use the source model that matches a root-level plugin package, consistent with `docs/file-structure.md`.
3. The Codex marketplace entry must continue to reference `https://github.com/patinaproject/superteam.git` on an explicit ref.
4. The `superteam` plugin name must remain `superteam`.
5. The upstream source repository must remain `patinaproject/superteam`.
6. Documentation in this repo must describe the upstream install surface as root-level `.codex-plugin/plugin.json`, root-level `.claude-plugin/plugin.json`, and `skills/superteam/`.
7. Documentation in this repo must remove or replace instructions that describe `./plugins/superteam` as the current upstream install path.
8. Documentation must preserve the boundary that `patinaproject/skills` owns marketplace catalogs and contributor docs, while `patinaproject/superteam` owns the plugin package itself.
9. The change must stay limited to marketplace metadata and docs in this repository.

## Affected Surfaces

- `.agents/plugins/marketplace.json`: Codex marketplace install metadata for `superteam`
- `.claude-plugin/marketplace.json`: Claude catalog metadata that should stay consistent with the upstream repository description
- `README.md`: user-facing install and maintenance guidance
- `docs/file-structure.md`: contributor guidance for marketplace source modeling, if needed for clarity or consistency

## Metadata Strategy

The catalog should model `superteam` as an upstream-owned root package.

For Codex, that means the entry should use the marketplace source type intended for plugins that live at the root of another repository rather than the source type intended for subdirectory-backed packages.

For Claude, the existing catalog entry already points at the upstream repository rather than a stale subdirectory path. The main requirement is descriptive consistency: any wording in this repo that explains the Claude install surface should align with the upstream root-level `.claude-plugin/plugin.json` manifest and `skills/superteam/` layout.

## Documentation Strategy

Docs should teach a single, current mental model:

- this repo publishes marketplace catalogs
- `patinaproject/superteam` is the installable upstream plugin repository
- Codex and Claude manifests now live at the root of that upstream repository
- `skills/superteam/` is the relevant skill directory in the upstream repo

The docs should avoid preserving historical path details unless explicitly framed as background. The primary install story should use only the active structure so new contributors are not sent to a deleted path.

## Risks and Guardrails

- Do not change the marketplace slug or plugin slug as part of this issue
- Do not broaden the issue into upstream repository restructuring
- Do not introduce conflicting documentation that mixes the deleted `./plugins/superteam` path with the new root-package structure as if both are current
- Do not vendor duplicate plugin files into this repository to work around the metadata mismatch
- Keep any metadata change aligned with the repo's own root-vs-subdirectory source guidance

## Verification

- Inspect `.agents/plugins/marketplace.json` to confirm the `superteam` entry no longer references `./plugins/superteam`
- Inspect `.agents/plugins/marketplace.json` to confirm the source type matches the root-package guidance in `docs/file-structure.md`
- Inspect `.claude-plugin/marketplace.json` to confirm it still references `patinaproject/superteam`
- Inspect `README.md` and any updated contributor docs to confirm they describe the active upstream root-package structure and no longer teach `./plugins/superteam` as the current install path
- Search the repo for `./plugins/superteam` and verify any remaining occurrences are either removed or intentionally framed as historical context rather than active instructions
