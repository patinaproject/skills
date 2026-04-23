# Patina Project

This repository carries the Patina Project marketplace catalogs for both Codex and Claude plugins.

It is a marketplace catalog, not the source repo for every plugin. Marketplace entries can point at plugins packaged in this repo, or at Git-backed plugin sources maintained in other Patina Project repositories.

## Current plugin

- `superteam`: installed from the root-packaged `patinaproject/superteam` plugin repository on `main`

## Install Surfaces

- `patinaproject/skills` owns the marketplace catalogs and contributor docs
- `patinaproject/superteam` is the source of truth for the upstream plugin package
- Codex marketplace metadata lives in `.agents/plugins/marketplace.json`
- Claude marketplace metadata lives in `.claude-plugin/marketplace.json`
- Codex installs `superteam` from the repository root in `patinaproject/superteam`
- The upstream Codex manifest lives at `.codex-plugin/plugin.json`
- The Claude plugin packaging and install surface live in the upstream `patinaproject/superteam` repository through its root `.claude-plugin/plugin.json`
- The upstream `superteam` skill content lives at `skills/superteam/`

## How it works

Codex reads the marketplace definition from `.agents/plugins/marketplace.json`, and Claude reads the companion marketplace definition from `.claude-plugin/marketplace.json`.

In this repo, the marketplace is named `patinaproject-skills` and exposed in the UI as `Patina Project`.

The current `superteam` entry does not vendor plugin files in this repository. Instead, it tells Codex to fetch the plugin package from the `patinaproject/superteam` repository:

- repo: `patinaproject/superteam`
- source type: `url`
- plugin root: `.`
- ref: `main`

In the upstream repository, the active install surfaces are:

- Codex manifest: `.codex-plugin/plugin.json`
- Claude manifest: `.claude-plugin/plugin.json`
- Skill directory: `skills/superteam/`

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

Then open the Codex Plugin Directory, find `Patina Project`, and install `superteam`.

## Install In Claude Code

This repository tracks the Claude marketplace catalog entry, but the installable Claude plugin package lives upstream in `patinaproject/superteam`.

For a direct setup in Claude Code today, add `superteam` as a custom subagent. Anthropic's official Claude Code docs describe project subagents in `.claude/agents/` and user subagents in `~/.claude/agents/`.

Create a project subagent file at `.claude/agents/superteam.md` with `/agents`, or create it manually and copy in the contents of:

```text
https://github.com/patinaproject/superteam/blob/main/skills/superteam/SKILL.md
```

Claude Code loads project subagents from `.claude/agents/`, so after adding that file you can use prompts such as:

```text
Use the superteam subagent to take issue #123 from design through review-ready execution.
```

If you want the workflow available across all projects instead, place the file in `~/.claude/agents/superteam.md`.

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

- Update marketplace entries in `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`
- Keep Git-backed entries pinned to an explicit `ref` or commit
- Maintain plugin source and packaging in the owning source repository
- For `superteam`, the source-of-truth repo is `patinaproject/superteam`
