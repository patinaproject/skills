# Repository Guidelines

## Project Structure & Module Organization

This repository is organized around reusable skill packages and supporting documentation.

- `skills/`: installable skill directories. Each skill should live in its own folder, for example `skills/superteam/`.
- `plugins/`: Codex plugin packages, for example `plugins/superteam/.codex-plugin/plugin.json`.
- If `.claude-plugin/plugin.json` exists, the repository root is the Claude plugin install surface.
- `docs/`: contributor-facing docs plus planning artifacts such as `docs/file-structure.md` and `docs/superpowers/plans/`.
- `.agents/plugins/marketplace.json`: repo-local plugin catalog for Codex discovery.
- root config: `package.json`, `commitlint.config.js`, and `.husky/` define local tooling and commit enforcement.

Keep each skill self-contained. Prefer adjacent support files like `agent-spawn-template.md` or `pr-body-template.md` over hidden tool-specific wrappers unless a runtime requires them.

For Superpowers-generated design and planning artifacts, use the current git branch name as the topic slug. Name files as:

- `docs/superpowers/specs/YYYY-MM-DD-<branch-name>-design.md`
- `docs/superpowers/plans/YYYY-MM-DD-<branch-name>-plan.md`

Use human-readable H1 titles inside those files:

- Design docs: `# Design: <exact issue title> [#<issue>](<issue-url>)`
- Plan docs: `# Plan: <exact issue title> [#<issue>](<issue-url>)`

Format acceptance criteria IDs as `AC-<issue-number>-<integer>`, for example `AC-5-1`.

## Build, Test, and Development Commands

- `pnpm install`: install local tooling and initialize Husky hooks.
- `pnpm sync:plugin`: refresh `plugins/superteam/skills/superteam/` from the source skill.
- `pnpm exec commitlint --edit <path>`: validate a commit message file against repo rules.
- `.husky/commit-msg <path>`: run the same commit-message validation through the active Git hook.
- `find skills -maxdepth 2 -type f | sort`: quick structure check for imported skills.
- `find plugins -maxdepth 5 -type f | sort`: inspect packaged Codex plugin contents.

There is no application build pipeline yet; changes are currently Markdown and repo-tooling focused.

## Coding Style & Naming Conventions

Use Markdown for skill and docs content. Keep sections short, imperative, and repository-specific.

- Skill directories: lowercase, concise names such as `skills/superteam/`
- Plugin directories: lowercase names matching the plugin manifest, such as `plugins/superteam/`
- Main skill file: `SKILL.md`
- Support files: descriptive kebab-case or clear template names
- Prefer ASCII unless an existing file already relies on Unicode

## Testing Guidelines

No formal test suite exists yet. Validate changes with targeted file checks and command output.

- Confirm paths with `find` or `rg`
- Check rewritten references with `rg '<pattern>'`
- Review rendered content with `sed -n '1,200p' <file>`
- Run `pnpm sync:plugin` after editing `skills/superteam/` and verify the packaged copy under `plugins/superteam/`

If you add executable tooling later, document the exact verification command in `docs/`.

## Commit & Pull Request Guidelines

Commits are enforced with Husky + commitlint. Use conventional commits with no scope and a required GitHub issue tag:

`type: #123 short description`

Examples:
- `docs: #12 add superteam skill guide`
- `chore: #34 bootstrap commit hooks`

Scopes like `feat(repo): ...` are rejected. Keep the subject within 72 characters.

Pull requests should include a short summary, linked issue, validation notes, and any updated docs when structure or workflow changes.
