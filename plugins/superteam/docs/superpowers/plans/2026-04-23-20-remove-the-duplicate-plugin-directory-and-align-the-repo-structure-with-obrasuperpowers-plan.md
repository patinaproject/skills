# Plan: Remove the duplicate plugin directory and align the repo structure with obra/superpowers [#20](https://github.com/patinaproject/superteam/issues/20)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:writing-skills` when editing `skills/**/*.md` or install-surface docs.

**Goal:** Mirror the root-oriented `obra/superpowers` repository structure where it fits this repo by keeping `skills/superteam/` as the only checked-in skill content, moving the Codex plugin manifest to a root `.codex-plugin/` surface, removing `plugins/superteam/`, and updating contributor and install docs to describe the new source of truth accurately.

**Architecture:** Keep both runtime metadata surfaces at the repository root: `.claude-plugin/plugin.json` for Claude and `.codex-plugin/plugin.json` for Codex. Keep the skill payload only under `skills/superteam/`. Remove the mirrored plugin tree and sync script. Update `AGENTS.md`, `README.md`, and `docs/file-structure.md` so they match the simplified root-based structure.

**Tech Stack:** Markdown docs, plugin manifests, `rg`, `find`, `sed`

## File Structure

- `docs/superpowers/specs/2026-04-23-20-remove-the-duplicate-plugin-directory-and-align-the-repo-structure-with-obrasuperpowers-design.md`
  - Approved design doc and acceptance source.
- `docs/superpowers/plans/2026-04-23-20-remove-the-duplicate-plugin-directory-and-align-the-repo-structure-with-obrasuperpowers-plan.md`
  - This implementation plan.
- `.codex-plugin/plugin.json`
  - New root Codex plugin manifest.
- `.claude-plugin/plugin.json`
  - Existing root Claude plugin manifest that remains in place.
- `skills/superteam/`
  - Only checked-in `superteam` skill payload after the change.
- `AGENTS.md`
  - Contributor guidance for the new repo shape.
- `README.md`
  - User-facing install and structure docs for the new repo shape.
- `docs/file-structure.md`
  - Contributor-facing file structure reference.
- `package.json`
  - Remove the sync command that maintained the duplicate payload.
- `scripts/sync-plugin.sh`
  - Delete because the mirrored plugin payload is removed.
- `plugins/superteam/`
  - Delete entirely.

## Tasks

### Task 1: Move Codex metadata to the root

- Add `.codex-plugin/plugin.json` using the existing Codex manifest content, adjusted for the root install surface.
- Verify the manifest points at the canonical `./skills/` location from the repository root.

### Task 2: Remove the duplicate plugin tree and sync tooling

- Delete `plugins/superteam/`.
- Delete `scripts/sync-plugin.sh`.
- Remove `sync:plugin` from `package.json`.

### Task 3: Update docs to mirror the root-oriented structure

- Update `AGENTS.md` so the repo structure, commands, and verification guidance no longer mention `plugins/superteam/` or `pnpm sync:plugin`.
- Update `README.md` so Codex and install-surface guidance points at the repository root instead of `plugins/superteam/`.
- Update `docs/file-structure.md` so it describes root-level `.claude-plugin/` and `.codex-plugin/` surfaces plus the single `skills/superteam/` source tree.

### Task 4: Verify there are no stale references

- Search for `plugins/superteam`, `sync:plugin`, and `sync-plugin.sh`.
- Inspect the final tree for `.codex-plugin/`, `.claude-plugin/`, and `skills/superteam/`.
- Confirm `plugins/superteam/` is gone.
