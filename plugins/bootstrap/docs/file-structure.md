# Repository File Structure

Contributor reference for the repository layout. For user-facing install and usage, start with [`README.md`](../README.md).

## Top level

- `.claude/`: project-level Claude Code configuration (`settings.json` with `enabledPlugins`)
- `.claude-plugin/`: Claude Code plugin manifest for the repository root
- `.codex-plugin/`: Codex plugin manifest for the repository root
- `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`: additional AI editor surfaces emitted when the repo is an AI agent plugin
- `.github/`: PR + issue templates and `CODEOWNERS`
- `.husky/`: Git hooks (`commit-msg`, `pre-commit`)
- `skills/`: installable skill packages (one directory per skill)
- `docs/`: repository docs, design docs, planning artifacts
- `package.json`, `pnpm-lock.yaml`, `commitlint.config.js`, `.markdownlint.jsonc`, `.markdownlintignore`: repo tooling
- `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `README.md`: contributor and user docs

## Skills

Each skill lives in its own directory under `skills/`.

Example:

```text
skills/
  bootstrap/
    SKILL.md
    audit-checklist.md
    templates/
    agent-spawn-template.md
    pr-body-template.md
```

- `SKILL.md`: the skill contract and workflow.
- `audit-checklist.md`: canonical checklist the skill walks in realignment mode.
- `templates/`: the files the skill emits into target repos.
- `agent-spawn-template.md`, `pr-body-template.md`: optional support files.

Keep skill directories self-contained. Prefer adjacent support files over hidden, tool-specific wrappers unless a runtime requires them.

## Plugin Metadata

The repository root is the install surface for every supported AI coding tool that has a plugin/extension model.

```text
.claude-plugin/plugin.json
.codex-plugin/plugin.json
.cursor/rules/<repo>.mdc
.windsurfrules
.github/copilot-instructions.md
```

`AGENTS.md` at the repo root is the portable surface consumed by Aider, Zed, Cline, Codex CLI, Opencode, and others.

## Docs

Use `docs/` for durable repository documentation and implementation artifacts.

Example:

```text
docs/
  file-structure.md
  superpowers/
    specs/
      2026-04-24-1-create-bootstrap-claude-skill-for-repo-scaffolding-design.md
    plans/
      2026-04-24-1-create-bootstrap-claude-skill-for-repo-scaffolding-plan.md
```

- `docs/file-structure.md`: this file, the contributor layout guide.
- `docs/superpowers/specs/`: design documents created during brainstorming.
- `docs/superpowers/plans/`: implementation plans created after design approval.

## Contributor expectation

When adding a new skill, mirror the `skills/bootstrap/` pattern. Keep install metadata at the repository root and keep each skill self-contained under `skills/`.
