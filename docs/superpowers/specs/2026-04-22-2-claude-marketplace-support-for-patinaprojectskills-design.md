# Design: Claude Marketplace support for patinaproject/skills [#2](https://github.com/patinaproject/skills/issues/2)

## Summary

Add Claude Marketplace support to `patinaproject/skills` while copying the contributor-facing project standards established in `patinaproject/superteam`.

The repository should remain a marketplace catalog, not a second source of truth for plugin payloads. Claude installability stays owned by `patinaproject/superteam`; this repo owns marketplace metadata, catalog documentation, and contributor standards for maintaining that metadata.

## Goals

- Copy the project standards pattern from `patinaproject/superteam` into this repository
- Extend `patinaproject/skills` so the marketplace can represent Claude-compatible consumption for `superteam`
- Keep `patinaproject/superteam` as the source of truth for the installable Claude plugin package
- Document the install surfaces and maintenance workflow clearly for contributors

## Non-Goals

- Creating a local Claude plugin package in `patinaproject/skills`
- Duplicating `superteam` plugin payloads into this repository
- Reworking marketplace ownership so this repo becomes the package source of truth
- Generalizing a new publishing system for every Patina Project repository

## Acceptance Criteria

### AC-2-1

`patinaproject/skills` adopts the project-standards layer used in `patinaproject/superteam`, with repo-specific wording for this marketplace catalog.

### AC-2-2

The marketplace catalog contains the metadata needed for Claude Marketplace support while continuing to reference `patinaproject/superteam` as the source repository.

### AC-2-3

Contributor and installation documentation explain the repo responsibilities and the Claude-related consumption path without implying that this repo owns the plugin package.

## Repository Ownership

### `patinaproject/superteam`

Owns the installable plugin package and Claude-native metadata, including the root `.claude-plugin/plugin.json` manifest and any direct-install documentation tied to that plugin package.

### `patinaproject/skills`

Owns the marketplace catalog, contributor standards for maintaining the catalog, and docs that explain how marketplace consumers reach the upstream install surfaces.

## Approach Options

### Option 1: Minimal standards parity plus marketplace metadata updates

Copy the structure and expectations of the `superteam` standards files into this repo, but keep the content marketplace-specific. Update the catalog and docs to reference the upstream Claude plugin surface.

Pros:

- Keeps the repo-specific truth accurate
- Avoids copying `superteam`-specific packaging rules that do not belong here
- Solves both the standards request and issue `#2` without adding duplicate assets

Cons:

- Requires careful wording instead of a direct file transplant

### Option 2: Near-verbatim standards transplant

Copy `superteam` standards files almost as-is and replace a few repository names.

Pros:

- Fastest initial edit path

Cons:

- Likely to import incorrect assumptions about local skill authoring and packaged plugin copies
- Makes this marketplace repo look like a plugin source repo when it is not

### Option 3: Metadata-only Claude support

Leave current project standards mostly unchanged and only update the marketplace catalog plus minimal docs.

Pros:

- Lowest implementation surface

Cons:

- Does not satisfy the request to copy project standards
- Leaves contributor guidance inconsistent with the upstream repository pattern

## Chosen Approach

Use option 1.

Copy the standards pattern from `superteam` into `patinaproject/skills` by updating `AGENTS.md`, adding `CLAUDE.md`, and tightening supporting docs. In the same change, extend the marketplace catalog and documentation so Claude Marketplace support is represented through metadata that points at `patinaproject/superteam`, which remains the package source of truth.

## File Responsibilities

- `AGENTS.md`: contributor workflow, repo structure, validation commands, commit and PR standards, including the `AC-<issue>-<n>` convention
- `CLAUDE.md`: Claude-facing pointer to the root contributor instructions
- `README.md`: installation surfaces, marketplace behavior, and source-of-truth boundaries
- `docs/file-structure.md`: concise map of the repo and the marketplace workflow
- `.agents/plugins/marketplace.json`: marketplace entry updates for Claude Marketplace compatibility

## Data and Metadata Strategy

The `superteam` entry should continue to target `https://github.com/patinaproject/superteam.git` as the remote source. Any Claude-specific representation added here should describe or route to that upstream install surface rather than vendoring a second copy in `patinaproject/skills`.

This preserves a single plugin source of truth:

- `superteam` owns the installable plugin package
- `skills` owns discovery metadata and catalog documentation

## Error Handling and Guardrails

- Do not add `.claude-plugin/plugin.json` to this repository
- Do not change the existing Codex installation path away from the `git-subdir` source unless the marketplace format requires a separate Claude-specific field
- If the marketplace schema lacks a supported Claude-specific field, document the upstream Claude install surface and keep the catalog update limited to supported metadata
- Keep documentation explicit about which repository owns which install surface

## Verification

- Inspect edited docs with `sed -n '1,200p'`
- Search for standards references and AC IDs with `rg`
- Review `.agents/plugins/marketplace.json` to confirm the `superteam` entry still points at the upstream repo and includes the intended compatibility metadata
- Verify the upstream Claude manifest exists at `patinaproject/superteam:.claude-plugin/plugin.json`

## Open Question Resolved

The issue dependency on `patinaproject/superteam#5` is treated as resolved for this work. The implementation can therefore update `patinaproject/skills` to reference the upstream Claude install surface now.
