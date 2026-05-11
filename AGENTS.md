# Repository Guidelines

## Project Structure & Module Organization

This repository is the marketplace surface for Patina Project plugins and related install documentation.

- `.agents/plugins/marketplace.json`: repo-local Codex marketplace source of truth
- `.claude-plugin/marketplace.json`: repo-local Claude marketplace source of truth
- `plugins/`: optional vendored plugin packages when this repo carries local copies
- `docs/`: contributor docs plus planning artifacts; use paths such as `docs/file-structure.md`, `docs/release-flow.md`, and, when present, `docs/superpowers/`
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
- `pnpm lint:md`: lint all tracked Markdown files with `markdownlint-cli2`
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

## Issue and PR labels

Use `gh label list` to see the repository's canonical label set. Each label's `description` documents when to apply it. Rely on those descriptions when selecting labels for issues and PRs — do not invent new labels without updating the repository's label set first.

Verify every label has a non-empty description:

```bash
gh label list --json name,description --jq '.[] | select(.description == "")'
```

## Working with `.github/` templates

This repo ships canonical templates for issues and pull requests. Agents must use them — do not invent parallel structure.

- Pull requests: `.github/pull_request_template.md`. Read it before running `gh pr create`. The PR body must use the template's section headings in the order the template defines, even when the body is passed inline via `--body`.
- Issues: `.github/ISSUE_TEMPLATE/bug_report.md` and `.github/ISSUE_TEMPLATE/feature_request.md`. Pick the one that matches the report and reproduce its sections in order.

Recommended `gh` patterns:

- PRs: `gh pr create --body-file <path-to-rendered-body>` is the safest path. The rendered body must already follow the template. If you pass `--body` inline, copy every template section name and order verbatim before filling them in.
- Issues: `gh issue create --template bug_report.md` or `--template feature_request.md` lets `gh` start from the canonical file. If you pass `--body` inline, mirror the template's headings the same way.

## GitHub Actions pinning

Pin every action reference to a full 40-character commit SHA, not a tag. Tags are mutable; SHAs are not. Above each `uses:` line, leave a comment naming the action and version the SHA corresponds to, so updates remain reviewable.

```yaml
# actions/checkout@v4.3.1
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
```

`actionlint` runs in CI on `.github/workflows/**` changes and enforces workflow hygiene as part of its other checks.

Also enable **Settings → Actions → General → Require actions to be pinned to a full-length commit SHA** (at the repo or org level). GitHub then refuses to run any workflow that `uses:` an action by tag or branch, giving a hard gate on top of the CI check.

## Plugin Releases

The marketplace only publishes tagged (`vX.Y.Z`) plugin releases. Every plugin entry in both manifests must pin an explicit tag `ref` — branch refs such as `main` are not allowed.

This repo's `plugins/<name>/` owns the package for `name ∈ {scaffold-repository, superteam, using-github}`. Standalone skills (currently `office-hours`, `find-skills`) own themselves at `.agents/skills/<name>/` and are not marketplace entries.

Releases are driven by `release-please` via `.github/workflows/release-please.yml`, which maintains a standing per-package Release PR for each plugin with unreleased commits. Merging a Release PR tags the commit, rewrites the manifest `source.ref`, and publishes a GitHub Release. The release-please workflow also auto-merges Release PRs after required checks pass. See [docs/release-flow.md](./docs/release-flow.md).

## Commit & Pull Request Guidelines

Commits must use conventional commit types, no scopes, and a required GitHub issue tag:

`type: #123 short description`

Examples:

- `chore: #1 bootstrap marketplace repo`
- `feat: #12 add superteam marketplace entry`

For squash-and-merge workflows, PR titles must match the commitlint commit format:

`type: #123 short description`

Bot-generated release-please PRs from `release-please--*` branches and bot-generated release bump PRs from `bot/bump-*` branches are the only no-issue exceptions.

When an issue defines acceptance criteria, include an `Acceptance Criteria` section in the PR description.

- Use one `### AC-<issue>-<n>` heading per relevant AC
- Put a short outcome summary directly under each heading
- Put verification steps under the AC they validate
