# Patina Project

This repository carries the Patina Project marketplace catalogs for both Codex and Claude plugins.

It is a marketplace catalog, not the source repo for every plugin. Marketplace entries can point at plugins packaged in this repo, or at Git-backed plugin sources maintained in other Patina Project repositories.

## Current plugins

The marketplace only lists plugins that have published a tagged release (`vX.Y.Z`). See [docs/release-flow.md](docs/release-flow.md) for how releases propagate here.

Tracked member plugins:

- `patinaproject/bootstrap` — repo scaffolding skill, currently `v1.2.0`
- `patinaproject/superteam` — issue-driven orchestration skill, currently `v1.1.0`
- `patinaproject/using-github` — GitHub workflow skill, currently `v2.0.0`

## Install Surfaces

- `patinaproject/skills` owns the marketplace catalogs and contributor docs
- `patinaproject/bootstrap`, `patinaproject/superteam`, and `patinaproject/using-github` own their upstream plugin packages
- Codex marketplace metadata lives in `.agents/plugins/marketplace.json`
- Claude marketplace metadata lives in `.claude-plugin/marketplace.json`
- Codex reads upstream package metadata from `.codex-plugin/plugin.json`
- Claude reads upstream package metadata from `.claude-plugin/plugin.json`
- Upstream skill content lives under each plugin repo's `skills/` directory

## How it works

Codex reads the marketplace definition from `.agents/plugins/marketplace.json`, and Claude reads the companion marketplace definition from `.claude-plugin/marketplace.json`.

In this repo, the marketplace is named `patinaproject-skills` and exposed in the UI as `Patina Project`.

Plugin entries do not vendor plugin files in this repository. Each entry points at a Git-backed plugin source repo pinned to an explicit release tag (`vX.Y.Z`). Branch refs such as `main` are not allowed — see [docs/release-flow.md](docs/release-flow.md).

In each upstream plugin repository, the active install surfaces are:

- Codex manifest: `.codex-plugin/plugin.json`
- Claude manifest: `.claude-plugin/plugin.json`
- Skill directory: `skills/`

That keeps the marketplace catalogs isolated while allowing plugin source repos to stay independent.

## Install In Codex

Install this marketplace from GitHub:

```bash
codex plugin marketplace add patinaproject/skills --ref main
```

Refresh tracked marketplaces:

```bash
codex plugin marketplace upgrade
```

Then open the Codex Plugin Directory, find `Patina Project`, and install the plugin you need: `bootstrap`, `superteam`, or `using-github`.

## Install In Claude Code

Register the Patina Project marketplace in Claude Code:

```text
/plugin marketplace add patinaproject/skills
```

Then install the plugin you need:

```text
/plugin install bootstrap@patinaproject-skills
/plugin install superteam@patinaproject-skills
/plugin install using-github@patinaproject-skills
```

## Use Installed Plugins

After installing a plugin, invoke the relevant skill:

```text
Use $bootstrap:bootstrap to align this repository with the Patina Project baseline.
```

```text
Use $superteam:superteam to take issue #123 from design through review-ready execution.
```

```text
Use $using-github for GitHub issue, branch, PR, and changelog work.
```

## Install From A Local Checkout

If you are working locally in a checkout that contains this repo, add it by path instead:

```bash
codex plugin marketplace add ./skills
```

If Codex does not immediately show the updated marketplace catalog, restart Codex and re-open the Plugin Directory.

## Maintenance Notes

- Update marketplace entries in `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`
- Keep Git-backed entries pinned to an explicit tag `ref` (`vX.Y.Z`). Branch refs are not allowed.
- Maintain plugin source and packaging in the owning source repository
- For `bootstrap`, the source-of-truth repo is `patinaproject/bootstrap`
- For `superteam`, the source-of-truth repo is `patinaproject/superteam`
- For `using-github`, the source-of-truth repo is `patinaproject/using-github`
- Run `pnpm validate:marketplace` before opening marketplace PRs
- Run `pnpm validate:marketplace:remote` when validating release identity against upstream tags
- See [docs/release-flow.md](docs/release-flow.md) for how plugin releases propagate into the marketplace
