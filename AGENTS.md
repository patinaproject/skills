# Repository Guidelines

## Project Structure & Module Organization

This repo is the marketplace surface for Patina Project Codex plugins.

- `.agents/plugins/marketplace.json`: source of truth for plugin registration
- `plugins/`: optional vendored plugins when the marketplace carries local packaged copies
- `docs/`: marketplace and maintenance docs
- root tooling: `pnpm`, Commitizen, commitlint, and Husky

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

Issue titles do not use conventional commit formatting. Write issue titles in plain language that describes the work, for example `Update README with Claude Code install instructions`.
