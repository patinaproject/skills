# Repository Guidelines

## Project Structure & Module Organization

This repository is the marketplace surface for Patina Project plugins and related install documentation.

- `skills/scaffold-repository/`: scaffold-repository skill
- `skills/superteam/`: superteam skill
- `skills/using-github/`: using-github skill
- `skills/office-hours/`: office-hours skill
- `.agents/skills/<name>/`: symlinks into `../../skills/<name>/` (dogfood overlay)
- `.claude/skills/<name>/`: symlinks into `../../skills/<name>/` (Claude Code overlay)
- `.claude-plugin/marketplace.json`: repo-local Claude marketplace source of truth (plugin slug: `patinaproject-skills`)
- `.claude-plugin/plugin.json`: Claude plugin manifest listing all 4 skill paths
- `docs/`: contributor docs plus planning artifacts; use paths such as `docs/file-structure.md`,
  `docs/release-flow.md`, and, when present, `docs/superpowers/`
- If `CLAUDE.md` exists, it should point contributors back to `AGENTS.md`
- root config: `package.json`, `commitizen.config.js`, `commitlint.config.js`, and `.husky/`

For Superpowers-generated design and planning artifacts, use issue-based filenames and the
following acceptance criteria format:

- `docs/superpowers/specs/YYYY-MM-DD-<issue-number>-<issue-title>-design.md`
- `docs/superpowers/plans/YYYY-MM-DD-<issue-number>-<issue-title>-plan.md`
- Acceptance criteria IDs: `AC-<issue-number>-<integer>`

## Build, Test, and Development Commands

- `pnpm install`: install dev tooling and initialize Husky
- `pnpm commit`: create a guided conventional commit with issue tagging
- `pnpm exec commitlint --edit <path>`: validate commit messages manually
- `pnpm lint:md`: lint all tracked Markdown files with `markdownlint-cli2`
- `pnpm verify:dogfood`: assert all four in-repo skills are discoverable via flat layout
- `pnpm verify:marketplace`: assert `.claude-plugin/` catalog is valid
- `pnpm apply:scaffold-repository:check`: assert scaffolding is in sync (exit 0)
- `find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort`: inspect the four skill entry points

## Coding Style & Naming Conventions

- Use lowercase names for skill folders
- Keep skill names and folder names aligned
- Use Markdown for docs and JSON for manifests
- Issue titles use plain language, not conventional commit formatting. Example:
  `Update README with Claude Code install instructions`

## Working on skills

When creating or editing any skill under `skills/`, first use the third-party
`write-a-skill` skill as a structure and progressive-disclosure review. It helps
check trigger descriptions, concise `SKILL.md` shape, examples, helper scripts,
and when to split reference material out of the main skill file.

If `write-a-skill` is not installed in the local agent environment, install it with:

```bash
npm_config_ignore_scripts=true npx skills@1.5.6 add mattpocock/skills@write-a-skill -y
```

For workflow-contract changes, especially `skills/superteam/**`, also use
`writing-skills` to pressure-test RED/GREEN baseline behavior, rationalization
resistance, role ownership, and stage-gate bypass paths. `write-a-skill` is the
structure check; `writing-skills` is the workflow-contract quality gate.

## Testing Guidelines

- Validate paths with `find` or `rg`
- Run `bash scripts/verify-dogfood.sh` to confirm all four in-repo skills pass the flat-layout check
- Run `bash scripts/verify-marketplace.sh` to confirm the `.claude-plugin/` catalog is valid
- Run `node scripts/apply-scaffold-repository.js skills/scaffold-repository --check` to
  confirm the scaffold baseline is idempotent against the current tree

## Issue and PR labels

Use `gh label list` to see the repository's canonical label set. Each label's `description`
documents when to apply it. Rely on those descriptions when selecting labels for issues and
PRs — do not invent new labels without updating the repository's label set first.

Verify every label has a non-empty description:

```bash
gh label list --json name,description --jq '.[] | select(.description == "")'
```

## Working with `.github/` templates

This repo ships canonical templates for issues and pull requests. Agents must use them — do
not invent parallel structure.

- Pull requests: `.github/pull_request_template.md`. Read it before running `gh pr create`.
  The PR body must use the template's section headings in the order the template defines,
  even when the body is passed inline via `--body`.
- Issues: `.github/ISSUE_TEMPLATE/bug_report.md` and
  `.github/ISSUE_TEMPLATE/feature_request.md`. Pick the one that matches the report and
  reproduce its sections in order.

Recommended `gh` patterns:

- PRs: `gh pr create --body-file <path-to-rendered-body>` is the safest path. The rendered
  body must already follow the template. If you pass `--body` inline, copy every template
  section name and order verbatim before filling them in.
- Issues: `gh issue create --template bug_report.md` or `--template feature_request.md`
  lets `gh` start from the canonical file. If you pass `--body` inline, mirror the
  template's headings the same way.

## GitHub Actions pinning

Pin every action reference to a full 40-character commit SHA, not a tag. Tags are mutable;
SHAs are not. Above each `uses:` line, leave a comment naming the action and version the SHA
corresponds to, so updates remain reviewable.

```yaml
# actions/checkout@v4.3.1
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
```

`actionlint` runs in CI on `.github/workflows/**` changes and enforces workflow hygiene as
part of its other checks.

Also enable **Settings → Actions → General → Require actions to be pinned to a full-length
commit SHA** (at the repo or org level). GitHub then refuses to run any workflow that `uses:`
an action by tag or branch, giving a hard gate on top of the CI check.

## Skill Releases

This repo owns four skills at flat paths: `skills/scaffold-repository/`,
`skills/superteam/`, `skills/using-github/`, and `skills/office-hours/`.
`find-skills` is a third-party skill from `vercel-labs/skills` and is not
a marketplace entry in this repo.

Releases are driven by `release-please` via `.github/workflows/release-please.yml`, which
maintains a single standing Release PR for the repo as a whole. Tag form: `v<X.Y.Z>` — no
component prefix. The marketplace only publishes tagged (`v<X.Y.Z>`) releases. See
[docs/release-flow.md](./docs/release-flow.md).

The two standalone skills (`find-skills`, `office-hours`) are not release-please packages.
Consumers install them from the default branch or a specific `#<git-ref>`.

Merging a Release PR tags the commit and publishes a GitHub Release. The workflow also
auto-merges Release PRs after required checks pass.

Bot-generated release-please PRs from `release-please--*` branches and bot-generated release
bump PRs from `bot/bump-*` branches are the only no-issue exceptions to the issue-tag rule.

## Commit & Pull Request Guidelines

Commits must use conventional commit types, no scopes, and a required GitHub issue tag:

`type: #123 short description`

Examples:

- `chore: #1 bootstrap marketplace repo`
- `feat: #12 add superteam skill entry`

For squash-and-merge workflows, PR titles must match the commitlint commit format:

`type: #123 short description`

Bot-generated release-please PRs from `release-please--*` branches and bot-generated release
bump PRs from `bot/bump-*` branches are the only no-issue exceptions.

When an issue defines acceptance criteria, include an `Acceptance Criteria` section in the
PR description.

- Use one `### AC-<issue>-<n>` heading per relevant AC
- Put a short outcome summary directly under each heading
- Put verification steps under the AC they validate
