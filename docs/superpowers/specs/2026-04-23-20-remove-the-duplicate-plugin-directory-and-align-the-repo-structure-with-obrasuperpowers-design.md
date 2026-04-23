# Design: Remove the duplicate plugin directory and align the repo structure with obra/superpowers [#20](https://github.com/patinaproject/superteam/issues/20)

## Summary

Remove the entire checked-in `plugins/superteam/` tree and make `skills/superteam/` the only checked-in skill directory in the repository. Keep the repository-root Claude plugin surface at `.claude-plugin/plugin.json`, move the Codex plugin manifest to a root-level `.codex-plugin/plugin.json`, and update docs so they describe the simplified structure accurately. Eliminate `scripts/sync-plugin.sh` and the `pnpm sync:plugin` maintenance step, since the repo should no longer rely on a second checked-in copy of the same skill content or a separate plugin directory.

The resulting layout should follow the `obra/superpowers` pattern where it fits this repo: one source skill tree, root-level plugin metadata surfaces, and no mirrored payload maintained by sync.

## Problem

The repository currently stores the same `superteam` skill payload in two places:

- `skills/superteam/`
- `plugins/superteam/skills/superteam/`

That duplication is reinforced by `scripts/sync-plugin.sh` and the `pnpm sync:plugin` script, which makes the repo harder to understand and creates drift risk. The current structure also obscures the source of truth because contributors can see both a source skill tree and a packaged skill tree with the same files.

## Goals

- Remove the duplicate checked-in plugin directory under `plugins/superteam/`
- Keep exactly one checked-in source-of-truth skill directory for `superteam`
- Eliminate the sync-based maintenance model and the repo tooling that exists only to maintain the mirrored copy
- Keep the intended install surfaces working with the simplified root-based structure
- Align contributor guidance and user-facing docs with the new single-source layout
- Model the resulting repository structure on `obra/superpowers` where that pattern fits this repo

## Non-Goals

- Redesigning the `superteam` workflow itself
- Broadly changing issue #18 behavior beyond this repo-structure follow-up
- Reworking marketplace behavior inside `patinaproject/skills`
- Renaming the `superteam` skill or plugin identifiers

## Current State

The repository currently has three relevant surfaces:

1. `.claude-plugin/plugin.json`
   - Claude plugin surface at the repository root
2. `skills/superteam/`
   - authoring/source copy of the `superteam` skill
3. `plugins/superteam/`
   - packaged Codex plugin surface that currently contains both the Codex plugin manifest and a mirrored checked-in copy of the `superteam` skill payload under `plugins/superteam/skills/superteam/`

The duplication is maintained by:

- `scripts/sync-plugin.sh`
- `package.json` script: `pnpm sync:plugin`
- contributor guidance in `AGENTS.md`
- structure documentation in `docs/file-structure.md`

## Proposed Structure

Use one checked-in skill tree and root-level plugin metadata directories:

```text
.codex-plugin/
  plugin.json
.claude-plugin/
  plugin.json
docs/
  ...
skills/
  superteam/
    SKILL.md
    agent-spawn-template.md
    agents/
      openai.yaml
    pr-body-template.md
```

In this structure:

- `skills/superteam/` is the only checked-in `superteam` skill payload
- `.codex-plugin/plugin.json` becomes the Codex plugin manifest at the repository root
- the entire `plugins/superteam/` directory is removed
- the sync script and sync command are removed

This keeps both plugin metadata surfaces at the root while eliminating the duplicate payload and the extra plugin directory.

## Approach

1. Create a root-level `.codex-plugin/plugin.json` for the surviving Codex install surface.
2. Delete the entire `plugins/superteam/` directory.
3. Delete `scripts/sync-plugin.sh`.
4. Remove the `sync:plugin` script from `package.json`.
5. Update plugin metadata as needed so the root Codex manifest points at the single canonical skill location.
6. Update `AGENTS.md`, `README.md`, and `docs/file-structure.md` so they describe the new source of truth and remove sync-based contributor guidance.
7. Search the repo for stale references to `plugins/superteam/` or the sync command.

## Files In Scope

- `AGENTS.md`
- `README.md`
- `docs/file-structure.md`
- `package.json`
- `scripts/sync-plugin.sh`
- `.codex-plugin/plugin.json`
- `plugins/superteam/`
- `skills/superteam/`

## Acceptance Criteria

- AC-20-1: The repository contains one canonical checked-in `superteam` skill directory
- AC-20-2: The duplicate checked-in plugin directory under `plugins/superteam/` is removed
- AC-20-3: The repository no longer relies on `scripts/sync-plugin.sh` or `pnpm sync:plugin` to mirror skill files into a second checked-in directory
- AC-20-4: The repository structure makes the source-of-truth location obvious to contributors
- AC-20-5: `AGENTS.md`, `README.md`, and `docs/file-structure.md` describe the simplified structure accurately
- AC-20-6: The resulting layout intentionally follows the `obra/superpowers` structure where it fits this repo
- AC-20-7: The intended plugin consumers still have valid root-based install surfaces after `plugins/superteam/` is removed

## Verification Strategy

- Confirm `plugins/superteam/` no longer exists
- Confirm `scripts/sync-plugin.sh` no longer exists
- Confirm `package.json` no longer exposes `pnpm sync:plugin`
- Search for stale references to `plugins/superteam/` and `sync:plugin`
- Inspect `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` to ensure the surviving install surfaces remain coherent
- Review `README.md`, `docs/file-structure.md`, and `AGENTS.md` for consistency with the new structure

## Risks And Mitigations

- Risk: The Codex plugin manifest may need root-relative path changes when it moves from `plugins/superteam/.codex-plugin/` to `.codex-plugin/`.
  Mitigation: Inspect and update the manifest as part of implementation so the root Codex surface still points at a valid source.

- Risk: Contributor docs could drift and keep instructing people to use the removed sync step or removed plugin directory.
  Mitigation: Search for `sync:plugin`, `sync-plugin.sh`, and `plugins/superteam` across the repo and update every live reference.

- Risk: Some plugin consumer expectation may still depend on `plugins/superteam/` as the install surface.
  Mitigation: Verify the root-based install-surface assumptions before implementation, and halt if the root manifest model cannot support the intended consumers cleanly.
