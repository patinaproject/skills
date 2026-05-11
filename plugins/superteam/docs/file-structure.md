# Repository File Structure

Contributor reference for the repository layout. For user-facing install and usage, start with [`../README.md`](../README.md).

## Top level

- `.claude/`: project-level Claude Code configuration
- `.claude-plugin/`: Claude Code plugin manifest for the repository root
- `.codex-plugin/`: Codex plugin manifest for the repository root
- `.cursor/`, `.windsurfrules`: Cursor and Windsurf editor surfaces
- `.github/`: PR + issue templates, workflows, `CODEOWNERS`, `copilot-instructions.md`
- `.husky/`: Git hooks (`commit-msg`, `pre-commit`)
- `skills/`: installable skill packages
- `docs/`: repository docs, design docs, planning artifacts
- `scripts/`: repo-tooling scripts (e.g. plugin version sync)
- Root tooling: `package.json`, `pnpm-lock.yaml`, `commitlint.config.js`, `.markdownlint.jsonc`, `.markdownlintignore`, `release-please-config.json`, `.release-please-manifest.json`
- Root docs: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `RELEASING.md`, `SECURITY.md`

## Skills

Each skill lives in its own directory under `skills/` with `SKILL.md` as the main contract. Support files (e.g. `pre-flight.md`, `routing-table.md`) sit alongside `SKILL.md`.

## Docs

Use `docs/` for durable repository documentation. For Superpowers-driven work:

- `docs/superpowers/specs/` — design documents
- `docs/superpowers/plans/` — implementation plans
