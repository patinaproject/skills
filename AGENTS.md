# Repository Guidelines

## Project Structure & Module Organization

This repository is organized around reusable skill packages, root-level plugin metadata, and supporting documentation.

- `skills/`: installable skill directories. Each skill should live in its own folder, for example `skills/superteam/`.
- `.codex-plugin/`: Codex plugin manifest for the repository root.
- If `.claude-plugin/plugin.json` exists, the repository root is the Claude plugin install surface.
- `docs/`: contributor-facing docs plus planning artifacts such as `docs/file-structure.md` and `docs/superpowers/plans/`.
- root config: `package.json`, `commitlint.config.js`, and `.husky/` define local tooling and commit enforcement.

Keep each skill self-contained. Prefer adjacent support files like `agent-spawn-template.md` or `pr-body-template.md` over hidden tool-specific wrappers unless a runtime requires them.

For Superpowers-generated design and planning artifacts, use the issue number and issue title as the topic slug. Name files as:

- `docs/superpowers/specs/YYYY-MM-DD-<issue-number>-<issue-title>-design.md`
- `docs/superpowers/plans/YYYY-MM-DD-<issue-number>-<issue-title>-plan.md`

Use human-readable H1 titles inside those files:

- Design docs: `# Design: <exact issue title> [#<issue>](<issue-url>)`
- Plan docs: `# Plan: <exact issue title> [#<issue>](<issue-url>)`

Format acceptance criteria IDs as `AC-<issue-number>-<integer>`, for example `AC-5-1`.

## Build, Test, and Development Commands

- `pnpm install`: install local tooling and initialize Husky hooks.
- `pnpm exec commitlint --edit <path>`: validate a commit message file against repo rules.
- `.husky/commit-msg <path>`: run the same commit-message validation through the active Git hook.
- `find skills -maxdepth 2 -type f | sort`: quick structure check for imported skills.
- `find .codex-plugin skills -maxdepth 5 -type f | sort`: inspect root Codex metadata and skill contents.

There is no application build pipeline yet; changes are currently Markdown and repo-tooling focused.

## Coding Style & Naming Conventions

Use Markdown for skill and docs content. Keep sections short, imperative, and repository-specific.

- Skill directories: lowercase, concise names such as `skills/superteam/`
- Root plugin metadata directories: `.codex-plugin/` and `.claude-plugin/`
- Main skill file: `SKILL.md`
- Support files: descriptive kebab-case or clear template names
- Prefer ASCII unless an existing file already relies on Unicode

## Testing Guidelines

No formal test suite exists yet. Validate changes with targeted file checks and command output.

- Confirm paths with `find` or `rg`
- Check rewritten references with `rg '<pattern>'`
- Review rendered content with `sed -n '1,200p' <file>`
- Verify root install metadata with `sed -n '1,200p' .codex-plugin/plugin.json` and confirm there is no stale `plugins/superteam/` tree
- For changes to `skills/**/*.md` and workflow-contract guidance, do not claim production readiness from confidence language alone.
- Readiness claims for those changes must be backed by the required pressure tests, review loops, and role-specific verification that actually ran.
- If that evidence is incomplete, report the missing evidence or blocker explicitly instead of asserting readiness.

If you add executable tooling later, document the exact verification command in `docs/`.

## Commit & Pull Request Guidelines

Commits are enforced with Husky + commitlint. Use conventional commits with no scope and a required GitHub issue tag:

`type: #123 short description`

Examples:
- `docs: #12 add superteam skill guide`
- `chore: #34 bootstrap commit hooks`

Scopes like `feat(repo): ...` are rejected. Keep the subject within 72 characters.

Pull requests should include a short summary, linked issue, validation notes, and any updated docs when structure or workflow changes.

For squash-and-merge workflows, PR titles must exactly match the commitlint and commitizen commit format:

`type: #123 short description`

Use the final intended squash commit title as the PR title. Examples:
- `docs: #12 add superteam skill guide`
- `chore: #34 bootstrap commit hooks`

GitHub issue titles are different: write them as plain-language summaries of the problem or request. Do not use conventional-commit prefixes like `docs:` or `feat:` in issue titles.

When an issue defines acceptance criteria, include an `Acceptance Criteria` section in the PR description.

- Use one `### AC-<issue>-<n>` heading per relevant AC, with the heading containing only the AC ID.
- Put a short outcome summary on the line below the heading.
- Put verification steps directly under the AC they validate.
- Use checkboxes only for testing or verification steps.
- If an AC is deferred or out of scope for the repo, say so in the summary text and do not add fake verification checkboxes.
