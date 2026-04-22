# Patina Project Skills

This repository is the Codex marketplace for Patina Project plugins.

It is a marketplace catalog, not the source repo for every plugin. Marketplace entries can point at plugins packaged in this repo, or at Git-backed plugin sources maintained in other Patina Project repositories.

## Current plugin

- `superteam`: installed from `patinaproject/superteam` using a `git-subdir` source that targets `./plugins/superteam` on `main`

## Install Surfaces

- `patinaproject/skills` is the marketplace catalog
- `patinaproject/superteam` is the source of truth for the upstream plugin package
- Codex installs `superteam` through the marketplace entry that targets `./plugins/superteam` in `patinaproject/superteam`
- The Claude plugin packaging and install surface live in the upstream `patinaproject/superteam` repository through its root `.claude-plugin/plugin.json`

## How it works

Codex reads the marketplace definition from `.agents/plugins/marketplace.json`.

In this repo, the marketplace is named `patinaproject-skills` and exposed in the UI as `Patina Project Skills`.

The current `superteam` entry does not vendor plugin files in this repository. Instead, it tells Codex to fetch the plugin package from the `patinaproject/superteam` repository:

- repo: `patinaproject/superteam`
- source type: `git-subdir`
- plugin path: `./plugins/superteam`
- ref: `main`

That keeps the marketplace isolated while allowing plugin source repos to stay independent.

## Install In Codex

Install this marketplace from GitHub:

```bash
codex plugin marketplace add patinaproject/skills --ref main
```

Refresh tracked marketplaces:

```bash
codex plugin marketplace upgrade
```

Then open the Codex Plugin Directory, find `Patina Project Skills`, and install `superteam`.

## Install From A Local Checkout

If you are working locally in a checkout that contains this repo, add it by path instead:

```bash
codex plugin marketplace add ./skills
```

If Codex does not immediately show the updated marketplace catalog, restart Codex and re-open the Plugin Directory.

## Use Superteam

After installing the plugin, invoke the skill in Codex with:

```text
Use $superteam to take this issue from design through review-ready execution.
```

You can also use shorter task-specific prompts such as:

```text
Use $superteam to coordinate an implementation plan for issue #123.
```

## Maintenance Notes

- Update marketplace entries in `.agents/plugins/marketplace.json`
- Keep Git-backed entries pinned to an explicit `ref` or commit
- Maintain plugin source and packaging in the owning source repository
- For `superteam`, the source-of-truth repo is `patinaproject/superteam`
