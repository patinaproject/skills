# Repository Guidelines

## Project Structure & Module Organization

This repository is the marketplace surface for Patina Project plugins and related install documentation.

- `skills/scaffold-repository/`: scaffold-repository skill
- `skills/using-github/`: using-github skill
- `skills/new-branch/`: issue branch preparation skill
- `skills/working-on-github-issue/`: shared align skill (resolve issue from ref or branch, mark started, branch)
- `skills/develop/`: issue development orchestration skill
- `skills/develop-with-workflow/`: Claude Workflow-orchestrated parallel slice build skill
- `skills/finish-pr/`: PR finishing skill
- `skills/codex-pr-feedback-loop/`: Codex PR review feedback automation skill
- `skills/polish-branch/`: pre-PR deepen-then-review readiness gate skill
- `skills/update-branch/`: local branch update skill
- `skills/install-skills/`: project-local skills CLI installation skill
- `skills/write-docs/`: capture-only CONTEXT.md/ADR documentation skill
- `skills/write-release-changelog/`: operator-invoked release changelog and feedback loop-closing skill
- `.agents/skills/<name>/`: committed overlay. Repo-owned skills are symlinks
  into `../../skills/<name>/` (dogfood overlay); vendored third-party skills are
  real directories restored by `pnpm skills:install`. All entries are tracked.
- `.claude/skills/<name>/`: committed Claude Code overlay. Repo-owned skills
  symlink into `../../skills/<name>/`; vendored third-party skills are relative
  symlinks into `../../.agents/skills/<name>`. All entries are tracked.
- `.claude-plugin/marketplace.json`: repo-local Claude marketplace source of truth (plugin slug: `patinaproject-skills`)
- `.claude-plugin/plugin.json`: Claude plugin manifest listing skill paths
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

### Architecture decision records

Name and write ADRs by [`docs/adr/README.md`](docs/adr/README.md), the
single source of truth for ADR naming in this repository. It supersedes the
sequential `0001`-increment guidance still embedded in the vendored shared
skills (`domain-modeling`, `setup-matt-pocock-skills`): name every ADR after its
originating GitHub issue (`ADR-<issue>-<slug>.md`), never scan-and-increment, and
do not edit the vendored payloads under `.agents/skills/**`.

## Build, Test, and Development Commands

- `pnpm install` (alias `pnpm env:setup`): install dev tooling and initialize
  Husky. It does not restore skills — vendored skills are committed.
- `pnpm skills:install`: re-vendor locked project-local skills from
  `skills-lock.json` using the upstream skills CLI
  (`pnpm dlx skills@latest experimental_install --yes`), then commit the
  refreshed `.agents/skills/**` and `.claude/skills/**` overlays. This is a
  manual maintenance command, not a `pnpm install` hook. Each lock entry tracks
  its source's default branch (latest), so re-running picks up upstream updates.
  When a re-vendor changes `domain-modeling`'s `CONTEXT-FORMAT.md` or
  `ADR-FORMAT.md`, copy the changed file over the bundled `write-docs` copy by
  hand; `write-docs-format-sync.test.sh` fails until the two match again.
- `pnpm clean`: remove generated dependency and transient install files
  (`node_modules`, `.skills-install.lock*`); never prunes committed skill overlays
- `bash scripts/worktree-setup.sh`: shared worktree bootstrap (fast-forward onto
  `origin/main`, then `pnpm env:setup`), wired into the Claude `SessionStart`
  hook and the Codex `[setup]` block
- `pnpm commit`: create a guided conventional commit with issue tagging
- `pnpm exec commitlint --edit <path>`: validate commit messages manually
- `pnpm lint:md`: lint all tracked Markdown files with `markdownlint-cli2`
- `pnpm test`: run the full local verification suite
- `find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort`: inspect the skill entry points

## Coding Style & Naming Conventions

- Use lowercase names for skill folders
- Keep skill names and folder names aligned
- Use Markdown for docs and JSON for manifests
- Issue titles use plain language, not conventional commit formatting. Example:
  `Update README with Claude Code install instructions`

## Working on skills

When creating or editing any skill under `skills/`, first use the third-party
`writing-great-skills` skill as a structure and progressive-disclosure review. It
helps check trigger descriptions, concise `SKILL.md` shape, leading-word
terminology, and when to split reference material out of the main skill file.

If `writing-great-skills` is not installed in the local agent environment, install
it with:

```bash
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@writing-great-skills -y
```

## Testing Guidelines

- **Tests must not assert on the prose content of documentation files.** Tests
  validate code behavior and machine-consumed contracts only: shell/JS behavior,
  valid JSON/YAML config, `.md` *frontmatter* schema (for example `name:` matches
  the folder), symlink resolution, and required-file existence. A documentation
  file's prose body must be freely editable without breaking a test. Markdown
  *linting* (`pnpm lint:md`) is unaffected — linting is not testing. See
  [docs/adr/ADR-224-no-tests-on-documentation-content.md](docs/adr/ADR-224-no-tests-on-documentation-content.md).
- Run `pnpm test` to run the full suite, or use the targeted commands below while iterating.
- `pnpm test` includes network-backed skills CLI canaries and the
  committed-skill lifecycle check.
- Validate paths with `find` or `rg`
- Run `bash scripts/tests/skill-install-lifecycle.test.sh` after changing
  `scripts/clean.sh`, package lifecycle scripts, or the skill install/clean
  package scripts.
- Run `bash scripts/tests/worktree-setup.test.sh` after changing
  `scripts/worktree-setup.sh`.
- Run `bash scripts/tests/dogfood.test.sh` to confirm in-repo skills pass the flat-layout check
- Run `bash scripts/tests/esm-tooling.test.sh` after changing repo tooling configs or the package module type
- Run `bash scripts/tests/marketplace.test.sh` to confirm the `.claude-plugin/` catalog is valid
- Run `bash scripts/tests/code-review-workflow.test.sh` after changing `.github/workflows/code-review.yml`
- Run `bash scripts/tests/pull-request-workflow.test.sh` after changing `.github/workflows/pull-request.yml`
- Run `bash scripts/tests/workflow-cleanup.test.sh` after changing workflow cleanup behavior; it asserts only filesystem state and non-`.md` config targets
- Run `bash scripts/tests/scaffold-cleanup.test.sh` after changing scaffold baseline cleanup behavior; it asserts only filesystem state and non-`.md` config/code targets
- Run `bash scripts/tests/write-docs-format-sync.test.sh` after changing the
  `write-docs` bundled format files or the vendored `domain-modeling` originals;
  it asserts byte-equality between the two copies (a machine-consumed mirror
  contract, never their prose — see
  [docs/adr/ADR-232-format-sync-mirror-contract.md](docs/adr/ADR-232-format-sync-mirror-contract.md))

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
- Issues: body structure is owned by the skill creating the issue. Prefer `to-spec`
  for spec/PRD-shaped issues and `to-tickets` or `using-github` for implementation-slice
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

This repo owns these skills at flat paths:

| Skill | Path |
| --- | --- |
| scaffold-repository | `skills/scaffold-repository/` |
| using-github | `skills/using-github/` |
| new-branch | `skills/new-branch/` |
| working-on-github-issue | `skills/working-on-github-issue/` |
| develop | `skills/develop/` |
| develop-with-workflow | `skills/develop-with-workflow/` |
| finish-pr | `skills/finish-pr/` |
| codex-pr-feedback-loop | `skills/codex-pr-feedback-loop/` |
| polish-branch | `skills/polish-branch/` |
| update-branch | `skills/update-branch/` |
| install-skills | `skills/install-skills/` |
| write-docs | `skills/write-docs/` |
| write-release-changelog | `skills/write-release-changelog/` |

`find-skills` is a third-party skill from `vercel-labs/skills` and is not
a marketplace entry in this repo.

Releases are driven by `release-please` via `.github/workflows/release-please.yml`, which
maintains a single standing Release PR for the repo as a whole. Tag form: `v<X.Y.Z>` — no
component prefix. The marketplace only publishes tagged (`v<X.Y.Z>`) releases. See
[docs/release-flow.md](./docs/release-flow.md).

The in-repo skills share the single root `patinaproject-skills` release and
tag; they are not separate release-please packages. Third-party skills such as
`find-skills` are installed separately from their source repo's default branch
or a specific `#<git-ref>`.

Adding or removing a repo-owned skill is a normal catalog change, not a breaking
change: version it with the fitting conventional type (usually `feat:`), never a
breaking `type!` / major bump. Skills are agent instructions, not a runtime API —
a removed skill simply leaves the catalog (recorded in the marketplace tests'
`retired_marketplace_skills` guard) and breaks nothing at runtime for consumers,
who re-vendor from the lockfile. Reserve `type!` for changes that actually break
a machine-consumed contract (for example the plugin-manifest schema or the
install lockfile shape).

Merging a Release PR tags the commit and publishes a GitHub Release. The workflow also
auto-merges Release PRs after required checks pass.

Bot-generated release-please PRs from `release-please--*` branches and bot-generated release
bump PRs from `bot/bump-*` branches are the only no-issue exceptions to the issue-tag rule.

## Commit & Pull Request Guidelines

Commits must use conventional commit types, no scopes, and a required GitHub issue tag:

`type: #123 short description`

Examples:

- `chore: #1 bootstrap marketplace repo`
- `feat: #12 add GitHub workflow skill`

For squash-and-merge workflows, PR titles must match the commitlint commit format:

`type: #123 short description`

Bot-generated release-please PRs from `release-please--*` branches and bot-generated release
bump PRs from `bot/bump-*` branches are the only no-issue exceptions.

Use the PR template as written: a `Linked issue` closing keyword and a
`What changed` summary written for a reader who has not seen the work. There is
no `Context:` line or `- <change> - <why>` contract — write plain prose.
GitHub Checks are the source of truth for routine automated verification.
Add `Testing steps` only ad hoc, when a produced artifact needs human
inspection (rendered docs, generated files, a template, release notes); make
each unchecked item describe the expected outcome, and omit the section when no
human review judgment is needed. Put only pre-merge operational chores in
`Do before merging`.
