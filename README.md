# skills

Codex marketplace repo for Patina Project plugins and packaged skills.

This repo is the org-level marketplace catalog, not the source of truth for every plugin. It can expose local packaged plugins or Git-backed plugin sources from other Patina Project repositories.

## Current marketplace entries

- `superteam`: sourced from `patinaproject/superteam` via a `git-subdir` marketplace entry that points at `./plugins/superteam` on the `main` branch.

## Local usage

- Add this repo as a local marketplace root with `codex plugin marketplace add ./skills`.
- Restart Codex after marketplace changes so the plugin directory refreshes its catalog.
