# GitHub Copilot Instructions

This repository follows the conventions documented in [`AGENTS.md`](../AGENTS.md). Copilot should prefer guidance from that file for workflow, commit message, and file-layout rules.

Highlights:

- Commits use Conventional Commits with no scope and a required GitHub issue tag: `type: #123 short description`.
- PR titles match the commit format so squash merges reuse them verbatim.
- Markdown is linted with `markdownlint-cli2` via a husky `pre-commit` hook.
- Skills live under `skills/`, one directory per skill, with `SKILL.md` as the main contract.

## Commit type – path-first rule

If any file in the diff is under one of these globs, the commit type is `feat:` or `fix:` – never `docs:` or `chore:`:

- `skills/**`
- `skills/bootstrap/templates/**`
- `.claude-plugin/**`, `.codex-plugin/**`
- `.cursor/**`, `.windsurfrules`, `.github/copilot-instructions.md`
- `.github/workflows/**`, `.github/ISSUE_TEMPLATE/**`, `.github/pull_request_template.md`, `.github/LABELS.md`
- `AGENTS.md`, `AGENTS.md.tmpl`, `CONTRIBUTING.md`, `CONTRIBUTING.md.tmpl`, `RELEASING.md`, `RELEASING.md.tmpl`

Example – wording standardization across plugin manifests, skill bodies, and templates:

- WRONG: `docs: #46 standardize Patina Project name`
- RIGHT: `feat: #46 standardize Patina Project name across product surfaces`

Full rationalization table and red flags: see [`AGENTS.md` "Commit type selection"](../AGENTS.md#commit-type-selection).
