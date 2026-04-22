# skills

Agentic engineering skills from the Patina Project team.

This repo is the source of truth for the `superteam` Codex plugin and its bundled skill.

## Plugin packaging

- Author the skill in `skills/superteam/`.
- Publish the install surface from `plugins/superteam/`.
- Refresh the packaged plugin with `pnpm sync:plugin` before pushing marketplace-facing changes.
- Downstream marketplaces should consume `plugins/superteam/` rather than the authoring path under `skills/`.
