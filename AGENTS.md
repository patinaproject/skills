# Repository Guidelines

## Project Structure & Module Organization

This repository is the marketplace surface for Patina Project plugins and related install documentation.

- `.agents/plugins/marketplace.json`: repo-local Codex marketplace source of truth
- `.claude-plugin/marketplace.json`: repo-local Claude marketplace source of truth
- `docs/`: contributor docs plus planning artifacts; use `docs/superpowers/` for Superpowers-generated specs and plans
- This repo owns marketplace metadata and install documentation; upstream plugin repos own plugin implementation and package internals
- If `CLAUDE.md` exists, it should point contributors back to `AGENTS.md`
- root config: `package.json`, `commitizen.config.js`, `commitlint.config.js`, and `.husky/`

For Superpowers-generated design and planning artifacts, use issue-based filenames and the following acceptance criteria format:

- `docs/superpowers/specs/YYYY-MM-DD-<issue-number>-<issue-title>-design.md`
- `docs/superpowers/plans/YYYY-MM-DD-<issue-number>-<issue-title>-plan.md`
- Acceptance criteria IDs: `AC-<issue-number>-<integer>`

## Build, Test, and Development Commands

- `pnpm install`: install dev tooling and initialize Husky
- `pnpm commit`: create a guided conventional commit with issue tagging
- `pnpm exec commitlint --edit <path>`: validate commit messages manually
- `sed -n '1,200p' .agents/plugins/marketplace.json`: inspect marketplace entries
- `find plugins -maxdepth 5 -type f | sort`: inspect vendored plugin contents when this repo carries local plugin copies

## Coding Style & Naming Conventions

- Use lowercase names for plugin folders
- Keep plugin names, manifest names, and marketplace entries aligned
- Use Markdown for docs and JSON for marketplace/plugin manifests
- For Git-backed entries, keep `source.path` relative to the remote repo root and pin an explicit `ref` or `sha`
- Issue titles use plain language, not conventional commit formatting. Example: `Update README with Claude Code install instructions`

## Testing Guidelines

- Validate paths with `find` or `rg`
- Review manifest files with `sed -n '1,200p' <file>`
- Review Git-backed marketplace entries in `.agents/plugins/marketplace.json`
- Run the relevant plugin validator when a packaged skill includes one

## Commit & Pull Request Guidelines

Commits must use conventional commit types, no scopes, and a required GitHub issue tag:

`type: #123 short description`

Examples:
- `chore: #1 bootstrap marketplace repo`
- `feat: #12 add superteam marketplace entry`

For squash-and-merge workflows, PR titles must match the commitlint commit format:

`type: #123 short description`

When an issue defines acceptance criteria, include an `Acceptance Criteria` section in the PR description.

- Use one `### AC-<issue>-<n>` heading per relevant AC
- Put a short outcome summary directly under each heading
- Put verification steps under the AC they validate
