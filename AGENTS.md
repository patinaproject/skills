# Repository Guidelines

## Project Structure & Module Organization

This repository is the marketplace surface for Patina Project plugins and related install documentation.

- `skills/scaffold-repository/`: scaffold-repository skill
- `skills/superteam/`: deprecated Superteam compatibility skill
- `skills/superteam-non-interactive/`: deprecated CI-safe Superteam compatibility skill
- `skills/using-github/`: using-github skill
- `skills/new-branch/`: issue branch preparation skill
- `skills/develop-issue/`: issue development orchestration skill
- `skills/finish-pr/`: PR finishing skill
- `skills/review-action/`: local AI review-action emulator skill
- `skills/office-hours/`: office-hours skill
- `skills/plan-ceo-review/`: plan-ceo-review skill
- `skills/install-skills/`: project-local skills CLI installation skill
- `.agents/skills/<name>/`: symlinks into `../../skills/<name>/` (dogfood overlay)
- `.claude/skills/<name>/`: symlinks into `../../skills/<name>/` (Claude Code overlay)
- `.claude-plugin/marketplace.json`: repo-local Claude marketplace source of truth (plugin slug: `patinaproject-skills`)
- `.claude-plugin/plugin.json`: Claude plugin manifest listing all eleven skill paths
- `.codex/environments/environment.toml`: Codex workspace setup for this repository
- `docs/`: contributor docs such as `docs/file-structure.md` and
  `docs/release-flow.md`
- If `CLAUDE.md` exists, it should point contributors back to `AGENTS.md`
- root config: `package.json`, `commitizen.config.json`, `commitlint.config.js`, and `.husky/`

Use GitHub issues as the durable product and design record. Do not add committed
design/plan artifacts for routine issue work; put durable context on the issue
or in normal docs when it is broadly useful beyond one issue.

## Agent skills

### Issue tracker

Issues and PRDs are tracked in this repository's GitHub Issues using `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage roles map to this repository's existing GitHub labels, without inventing new labels. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository; domain docs are optional and created lazily when useful. See `docs/agents/domain.md`.

## Build, Test, and Development Commands

- `pnpm install`: install dev tooling and initialize Husky
- `pnpm commit`: create a guided conventional commit with issue tagging
- `pnpm exec commitlint --edit <path>`: validate commit messages manually
- `pnpm lint:md`: lint all tracked Markdown files with `markdownlint-cli2`
- `pnpm test`: run the full local verification suite
- `find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort`: inspect the eleven skill entry points

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
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@write-a-skill -y
```

For workflow-contract changes, especially `skills/superteam/**`, also use
`writing-skills` to pressure-test RED/GREEN baseline behavior, rationalization
resistance, role ownership, and stage-gate bypass paths. `write-a-skill` is the
structure check; `writing-skills` is the workflow-contract quality gate.

## Testing Guidelines

- Run `pnpm test` to run the full suite, or use the targeted commands below while iterating.
- Validate paths with `find` or `rg`
- Run `bash scripts/verify-dogfood.sh` to confirm all eleven in-repo skills pass the flat-layout check
- Run `bash scripts/verify-esm-tooling.sh` after changing repo tooling configs or the package module type
- Run `bash scripts/verify-develop-issue-workflow.sh` after changing `skills/develop-issue/**`
- Run `bash scripts/verify-finish-pr-workflow.sh` after changing `skills/finish-pr/**`
- Run `bash scripts/verify-marketplace.sh` to confirm the `.claude-plugin/` catalog is valid
- Run `bash scripts/verify-superteam-contract.sh` after changing `skills/superteam/**`
- Run `bash scripts/verify-code-review-workflow.sh` after changing `.github/workflows/code-review.yml`
- Run `bash scripts/verify-workflow-cleanup.sh` after changing workflow cleanup behavior
- Run `bash scripts/verify-scaffold-cleanup.sh` after changing scaffold baseline cleanup behavior

## Issue and PR labels

Use `gh label list` to see the repository's canonical label set. Each label's `description`
documents when to apply it. Rely on those descriptions when selecting labels for issues and
PRs — do not invent new labels without updating the repository's label set first.

Verify every label has a non-empty description:

```bash
gh label list --json name,description --jq '.[] | select(.description == "")'
```

## Working with `.github/` templates

This repo ships a canonical pull request template. Agents must use it — do
not invent parallel PR structure.

- Pull requests: `.github/pull_request_template.md`. Read it before running `gh pr create`.
  The PR body must use the template's section headings in the order the template defines,
  even when the body is passed inline via `--body`.
- Issues: body structure is owned by the skill creating the issue. Prefer `to-prd`
  for PRD-shaped issues and `to-issues` or `using-github` for implementation-slice
  issues. Manual GitHub issues are allowed when they contain enough context to act on.

Recommended `gh` patterns:

- PRs: `gh pr create --body-file <path-to-rendered-body>` is the safest path. The rendered
  body must already follow the template. If you pass `--body` inline, copy every template
  section name and order verbatim before filling them in.
- Issues: `gh issue create --title <title> --body-file <path-to-rendered-body>` keeps
  the creating skill responsible for the issue body shape. Select labels from the remote
  label inventory instead of hardcoding defaults.

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

This repo owns eleven skills at flat paths: `skills/scaffold-repository/`,
`skills/using-github/`, `skills/new-branch/`, `skills/develop-issue/`,
`skills/finish-pr/`,
`skills/review-action/`, `skills/office-hours/`, `skills/plan-ceo-review/`,
`skills/install-skills/`, plus deprecated compatibility skills at
`skills/superteam/` and `skills/superteam-non-interactive/`.
`find-skills` is a third-party skill from `vercel-labs/skills` and is not
a marketplace entry in this repo.

Releases are driven by `release-please` via `.github/workflows/release-please.yml`, which
maintains a single standing Release PR for the repo as a whole. Tag form: `v<X.Y.Z>` — no
component prefix. The marketplace only publishes tagged (`v<X.Y.Z>`) releases. See
[docs/release-flow.md](./docs/release-flow.md).

The eleven in-repo skills share the single root `patinaproject-skills` release
and tag; they are not separate release-please packages. Deprecated Superteam
skills remain in the release while they are kept for compatibility. Third-party
skills such as `find-skills` are installed separately from their source repo's
default branch or a specific `#<git-ref>`.

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

Use the PR template as written: linked issues, what changed, and verification
evidence. Put operator-owned manual verification decisions in `Testing steps`,
and omit that section when no operator-owned manual verification is needed. Put
only pre-merge operational chores in `Do before merging`.
