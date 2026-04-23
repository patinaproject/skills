# Patina Project Marketplace

Marketplace catalogs for Patina Project plugins.

This repository is the marketplace surface, not the source repository for each plugin package. It is intentionally modeled on `obra/superpowers-marketplace`: keep the marketplace metadata obvious, keep the root small, and keep plugin implementation in the owning repositories.

## Repository Structure

- `.agents/plugins/marketplace.json`: Codex marketplace catalog
- `.claude-plugin/marketplace.json`: Claude marketplace catalog
- `docs/superpowers/`: issue-driven design and planning artifacts for marketplace maintenance
- `AGENTS.md`: contributor rules for working in this repository

## Ownership Boundaries

This repository owns:

- marketplace catalogs
- marketplace-facing install documentation
- contributor guidance for marketplace maintenance

Upstream plugin repositories own:

- plugin code and skills
- plugin manifests and package internals
- plugin-specific implementation details and release cadence

## Current Plugin

- `Superteam` (`superteam`): sourced from `patinaproject/superteam`

## Install In Codex

```bash
codex plugin marketplace add patinaproject/skills --ref main
codex plugin marketplace upgrade
```

Codex installs `Superteam` from the upstream repository path declared in `.agents/plugins/marketplace.json`, which now targets the repository root `.` in `patinaproject/superteam`.

## Install In Claude Code

Claude reads the marketplace definition from `.claude-plugin/marketplace.json`.

The `Superteam` marketplace entry points at the upstream `patinaproject/superteam` repository. Its Claude plugin manifest lives at the repository root, and its checked-in skill payload lives under `skills/superteam`.

## Install From A Local Checkout

```bash
codex plugin marketplace add ./skills
```

## Maintenance Notes

- Update marketplace entries in `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`
- Keep Git-backed entries pinned to an explicit `ref` or `sha`
- Keep upstream path references aligned with the canonical plugin location in the owning repository
