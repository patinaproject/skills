# Repository File Structure

This document is a contributor reference for the repository layout. For user-facing installation and workflow onboarding, start with `README.md`.

## Top level

- `.codex-plugin/`: Codex plugin manifest for the repository root
- `.claude-plugin/`: Claude Code plugin manifest for the repository root
- `skills/`: installable or shareable skill packages
- `docs/`: repository docs, design docs, planning artifacts, and repo-local pressure tests
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
- `agent-spawn-template.md`: teammate-based delegation guidance that tells spawned teammates to discover repo rules before edits and follow the correct ownership contract
- `pr-body-template.md`: finish-owned PR reporting template for publish-state follow-through, branch and PR reporting, and external feedback handling
- `agents/openai.yaml`: skill UI metadata used when packaging the skill into a plugin

Keep skill directories self-contained. Prefer adjacent support files over hidden, tool-specific wrappers unless a runtime requires them.

## Plugin Metadata

The repository supports two plugin surfaces.

Claude Code loads the repository root through `.claude-plugin/plugin.json`, which makes the repository root the Claude Code plugin surface and points at the source skills in `./skills`.

Codex also uses the repository root through `.codex-plugin/plugin.json`, which points at the same source skills in `./skills`.

Example:

```text
.codex-plugin/
  plugin.json
.claude-plugin/
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
- `.codex-plugin/plugin.json`: Codex plugin manifest and UI metadata for the repository root
- `skills/superteam/`: canonical checked-in `superteam` skill content used by both root plugin surfaces
- `agents/openai.yaml`: optional skill UI metadata for Codex lists and chips

Treat the repository root as the install surface for both `.claude-plugin/` and `.codex-plugin/`, and `skills/superteam/` as the only checked-in `superteam` skill source.

## Docs

Use `docs/` for durable repository documentation and implementation artifacts.

Example:

```text
docs/
  file-structure.md
  superpowers/
    pressure-tests/
      superteam-orchestration-contract.md
    specs/
      2026-04-22-8-harden-superteam-orchestration-contracts-and-stage-gates-design.md
    plans/
      2026-04-22-5-claude-plugin-support-able-to-be-imported-to-marketplace-plan.md
```

- `docs/file-structure.md`: contributor-facing layout guide
- `docs/superpowers/specs/`: design documents created during brainstorming
- `docs/superpowers/plans/`: implementation plans created after design approval
- `docs/superpowers/pressure-tests/`: repo-local orchestration pressure tests that document expected halt and reroute behavior
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`: the current pressure-test doc for teammate contracts, approval gates, review routing, and shutdown checks

## Contributor expectation

When adding a new skill, mirror the `skills/superteam/` pattern. Keep install metadata at the repository root and keep each skill self-contained under `skills/`.
