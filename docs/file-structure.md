# Repository File Structure

This repository keeps source skills in `skills/`, packaged plugin content in `plugins/`, and supporting documentation in `docs/`.

## Top level

- `.claude-plugin/`: Claude Code plugin manifest for the repository root
- `skills/`: installable or shareable skill packages
- `plugins/`: plugin packages for external install surfaces
- `docs/`: repository docs, design docs, and planning artifacts
- `.agents/plugins/marketplace.json`: local plugin catalog for Codex discovery
- `package.json`: minimal repo tooling managed with `pnpm`
- `commitlint.config.js`: commit message rules
- `.husky/`: git hooks, including `commit-msg`

## Skills

Each skill should live in its own directory under `skills/`.

Example:

```text
skills/
  superteam/
    SKILL.md
    agent-spawn-template.md
    pr-body-template.md
    agents/
      openai.yaml
```

- `SKILL.md`: the main skill contract, workflow, and routing rules
- `agent-spawn-template.md`: reusable spawn guidance for multi-agent roles
- `pr-body-template.md`: PR checklist and reporting template for finish-stage work
- `agents/openai.yaml`: skill UI metadata used when packaging the skill into a plugin

Keep skill directories self-contained. Prefer adjacent support files over hidden, tool-specific wrappers unless a runtime requires them.

## Plugins

The repository supports two plugin surfaces.

Claude Code loads the repository root through `.claude-plugin/plugin.json`, which points at the source skills in `./skills`.

Codex consumes the packaged plugin under `plugins/superteam/`.

Example:

```text
.claude-plugin/
  plugin.json
plugins/
  superteam/
    .codex-plugin/
      plugin.json
    skills/
      superteam/
        SKILL.md
        agent-spawn-template.md
        pr-body-template.md
        agents/
          openai.yaml
```

- `.claude-plugin/plugin.json`: Claude Code manifest for the repository root
- `.codex-plugin/plugin.json`: packaged plugin manifest and UI metadata
- `plugins/superteam/skills/`: packaged skills exposed by the Codex plugin
- `agents/openai.yaml`: optional skill UI metadata for Codex lists and chips

Use `.agents/plugins/marketplace.json` to register repo-local plugins for Codex discovery.
When publishing `superteam` to an external marketplace, treat `plugins/superteam/` as the Codex install surface and `skills/superteam/` as the authoring source. Refresh the packaged copy with `pnpm sync:plugin`.

## Docs

Use `docs/` for durable repository documentation and implementation artifacts.

Example:

```text
docs/
  file-structure.md
  superpowers/
    plans/
      2026-04-22-5-claude-plugin-support-able-to-be-imported-to-marketplace-plan.md
```

- `docs/file-structure.md`: contributor-facing layout guide
- `docs/superpowers/specs/`: design documents created during brainstorming
- `docs/superpowers/plans/`: implementation plans created after design approval

## Contributor expectation

When adding a new skill, mirror the `skills/superteam/` pattern. When making that skill importable as a Codex plugin, package it under `plugins/<name>/` with a plugin manifest and marketplace entry, and keep the packaged skill self-contained.
