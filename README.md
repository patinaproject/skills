# Superteam

Agentic engineering skills from the Patina Project team.

This repo exposes two install surfaces for the same `superteam` skill.

## Install Surfaces

- The repository root is the Claude Code plugin surface discovered via `.claude-plugin/plugin.json`.
- `plugins/superteam/` is the packaged Codex install surface.
- Author the skill in `skills/superteam/`, then refresh the packaged plugin with `pnpm sync:plugin` before publishing Codex-facing changes.

## Local Development

Use the repository root as the Claude plugin directory during local testing:

```bash
claude --plugin-dir .
```

The skill is exposed as `/superteam:superteam` once the plugin is loaded.
