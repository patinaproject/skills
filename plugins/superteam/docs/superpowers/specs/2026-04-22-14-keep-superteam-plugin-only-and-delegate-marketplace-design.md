# Design: Keep superteam plugin-only and delegate marketplace [#14](https://github.com/patinaproject/superteam/issues/14)

## Summary

Keep `patinaproject/superteam` as a plugin/package repository, not a repo-local marketplace. Remove the local Codex marketplace surface from this repository, align contributor and user-facing docs to that plugin-only model, and ensure the visible plugin name presented by packaged metadata is `Superteam`.

## Problem

This repository was exposing both a packaged Codex plugin and a repo-local marketplace surface. That created duplicate-discovery confusion and blurred the intended ownership boundary between:

- `patinaproject/superteam` as the source/plugin repo
- `patinaproject/skills` as the marketplace repo

The current requirement is simpler and stricter: this repository should be plugin-only, while marketplace registration lives in the separate `skills` repo.

## Goals

- Remove the repo-local Codex marketplace surface from this repository
- Keep `plugins/superteam/` as the packaged Codex plugin surface in this repository
- Ensure the packaged plugin's user-facing name is `Superteam`
- Keep docs consistent with the plugin-only ownership model
- Preserve the Claude plugin surface at the repository root

## Non-Goals

- Vendoring or editing the external `skills` marketplace repo from this repository
- Changing the underlying skill identifier from `superteam`
- Reworking the teammate workflow or packaged skill payload

## Current State

The repository currently contains:

- `plugins/superteam/.codex-plugin/plugin.json` for the packaged Codex plugin
- `.claude-plugin/plugin.json` for the Claude plugin surface
- repo docs that have drifted between plugin-only and marketplace-backed wording
- a deleted or pending-deletion repo-local `.agents/plugins/marketplace.json` that should no longer exist in the final state

The visible plugin name in packaged Codex metadata already uses `interface.displayName: "Superteam"`, but the repository still needs a full consistency pass so the packaging and docs match the intended ownership model.

## Approach

Treat this repository as owning only the plugin/package surfaces:

1. Delete the repo-local `.agents/plugins/marketplace.json` file and stop documenting this repository as a marketplace.
2. Keep `plugins/superteam/` as the packaged Codex plugin surface and `.claude-plugin/plugin.json` as the Claude surface.
3. Keep the packaged plugin metadata user-facing name as `Superteam`.
4. Update `README.md`, `docs/file-structure.md`, and `AGENTS.md` so they describe this repo as plugin-only and point marketplace responsibility conceptually to the external `skills` repo rather than a local marketplace file.
5. Verify that no live repo-facing docs still describe this repo as a local Codex marketplace.

## Files In Scope

- `AGENTS.md`
- `README.md`
- `docs/file-structure.md`
- `plugins/superteam/.codex-plugin/plugin.json`
- `.agents/plugins/marketplace.json`

## Acceptance Criteria

- AC-14-1: `.agents/plugins/marketplace.json` does not exist in this repository
- AC-14-2: `plugins/superteam/.codex-plugin/plugin.json` remains the packaged Codex plugin manifest for this repo
- AC-14-3: The packaged plugin presents the user-facing name `Superteam`
- AC-14-4: `README.md`, `docs/file-structure.md`, and `AGENTS.md` consistently describe this repo as plugin-only rather than a local marketplace
- AC-14-5: The repository root Claude plugin surface remains intact

## Verification Strategy

- Confirm `.agents/plugins/marketplace.json` is absent
- Inspect `plugins/superteam/.codex-plugin/plugin.json` for `interface.displayName: "Superteam"`
- Search live repo docs for stale local-marketplace wording
- Review the final diff to ensure the change stays focused on packaging/docs ownership

## Risks And Mitigations

- Risk: Docs could still point to outdated local marketplace behavior.
  Mitigation: Run targeted searches across the live contributor and user-facing docs.

- Risk: Changing naming too aggressively could break internal identifiers.
  Mitigation: Keep the plugin/skill machine name `superteam` and only require the visible display name to be `Superteam`.
