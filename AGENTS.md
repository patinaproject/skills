# Repository Guidelines

## Project Structure & Module Organization

This repo is the marketplace surface for Patina Project Codex plugins.

- `.agents/plugins/marketplace.json`: source of truth for plugin registration
- `plugins/`: packaged plugins ready for Codex discovery
- `docs/`: marketplace and maintenance docs
- root tooling: `pnpm`, Commitizen, commitlint, and Husky

## Build, Test, and Development Commands

- `pnpm install`: install dev tooling and initialize Husky
- `pnpm commit`: create a guided conventional commit with issue tagging
- `pnpm exec commitlint --edit <path>`: validate commit messages manually
- `find plugins -maxdepth 5 -type f | sort`: inspect packaged plugin contents

## Coding Style & Naming Conventions

- Use lowercase names for plugin folders
- Keep plugin names, manifest names, and marketplace entries aligned
- Use Markdown for docs and JSON for marketplace/plugin manifests

## Testing Guidelines

- Validate paths with `find` or `rg`
- Review manifest files with `sed -n '1,200p' <file>`
- Run the relevant plugin validator when a packaged skill includes one

## Commit & Pull Request Guidelines

Commits must use conventional commit types, no scopes, and a required GitHub issue tag:

`type: #123 short description`

Examples:
- `chore: #1 bootstrap marketplace repo`
- `feat: #12 add superteam marketplace entry`
