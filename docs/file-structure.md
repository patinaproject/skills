# Repository File Structure

This repository is the marketplace surface for Patina Project plugins and
related install documentation. Skills live under `skills/<name>/` in a flat
layout.

## Top level

- `skills/scaffold-repository/`: scaffold-repository skill
- `skills/using-github/`: using-github skill
- `skills/new-branch/`: issue branch preparation skill
- `skills/working-on-github-issue/`: shared begin-work skill (validate, mark started, branch)
- `skills/develop/`: issue development orchestration skill
- `skills/develop-with-workflow/`: Claude Workflow-orchestrated parallel slice build skill
- `skills/finish-pr/`: PR finishing skill
- `skills/codex-pr-feedback-loop/`: Codex PR review feedback automation skill
- `skills/review-branch/`: isolated local branch-diff review skill
- `skills/harden-branch/`: pre-PR deepen-then-review readiness gate skill
- `skills/update-branch/`: local branch update skill
- `skills/install-skills/`: project-local skills CLI installation skill
- `skills/write-docs/`: capture-only CONTEXT.md/ADR documentation skill
- `skills/improve-branch-architecture/`: branch-scoped deepening recommendation skill
- `skills/write-release-changelog/`: operator-invoked release changelog and feedback loop-closing skill
- `.agents/skills/<name>/`: committed overlay; repo-owned skills are symlinks
  into `../../skills/<name>/`, vendored third-party skills are real directories
- `.claude/skills/<name>/`: committed overlay; repo-owned skills symlink into
  `../../skills/<name>/`, vendored third-party skills symlink into
  `../../.agents/skills/<name>`
- `.claude-plugin/marketplace.json`: Claude marketplace catalog
- `.claude-plugin/plugin.json`: Claude plugin manifest listing skill paths
- `.codex-plugin/plugin.json`: Codex plugin manifest listing skill paths
- `.agents/plugins/marketplace.json`: Codex marketplace catalog
- `.codex/environments/environment.toml`: Codex workspace setup for this repository
- `skills-lock.json`: vercel-labs CLI install lockfile
- `docs/`: contributor-facing docs for skill maintenance
- `package.json`, `commitizen.config.json`, `commitlint.config.js`: repo tooling
- `.husky/`: local git hooks
- `.lintstagedrc.js`: lint-staged config that excludes vendored skill files
  from root lint

## Flat skill layout

Skills owned by this repository:

| Skill | Canonical path | Description |
| --- | --- | --- |
| `scaffold-repository` | `skills/scaffold-repository/` | Scaffold or realign a repo to the Patina Project baseline |
| `using-github` | `skills/using-github/` | GitHub workflow skill |
| `new-branch` | `skills/new-branch/` | Issue branch preparation |
| `working-on-github-issue` | `skills/working-on-github-issue/` | Shared begin-work step: validate, mark started, branch |
| `develop` | `skills/develop/` | Issue development orchestration |
| `develop-with-workflow` | `skills/develop-with-workflow/` | Parallel vertical-slice build converged onto one branch |
| `finish-pr` | `skills/finish-pr/` | Ready-for-merge PR finishing |
| `codex-pr-feedback-loop` | `skills/codex-pr-feedback-loop/` | Codex app PR review feedback automation |
| `review-branch` | `skills/review-branch/` | Isolated local branch-diff review |
| `harden-branch` | `skills/harden-branch/` | Pre-PR deepen-then-review readiness gate |
| `update-branch` | `skills/update-branch/` | Local branch update workflow |
| `install-skills` | `skills/install-skills/` | Project-local skills CLI installation workflow |
| `write-docs` | `skills/write-docs/` | Capture-only CONTEXT.md glossary and ADR documentation |
| `improve-branch-architecture` | `skills/improve-branch-architecture/` | Branch-scoped deepening recommendations |
| `write-release-changelog` | `skills/write-release-changelog/` | Release changelog and product-feedback loop-closing ceremony |

`find-skills` is a third-party vendored skill from `vercel-labs/skills`. It is
installed via the vercel-labs CLI and is not owned by this repository. Install
with: `npx skills@latest add vercel-labs/skills@find-skills`

Each `skills/<name>/` directory contains at minimum a `SKILL.md` with YAML
frontmatter including `name: <name>` and `description:` fields. Supporting
files such as templates, agents, and workflow docs live alongside `SKILL.md`.

## Overlay layout

The agent runtime discovers skills through two committed overlay directories.
Both repo-owned and vendored third-party skills are committed, so they load
immediately in a fresh clone or worktree with no install step.

Repo-owned skills in `skills/` appear as one-hop symlinks:

| Overlay path | Symlink target | Mode |
| --- | --- | --- |
| `.agents/skills/<name>` | `../../skills/<name>` | `120000` |
| `.claude/skills/<name>` | `../../skills/<name>` | `120000` |

Vendored third-party skills (recorded in `skills-lock.json`) are committed as
real directories under `.agents/skills/<name>`, with `.claude/skills/<name>`
as a relative symlink into `../../.agents/skills/<name>`. `pnpm skills:install`
re-vendors them from their sources via the upstream skills CLI
(`skills experimental_install`); the refreshed overlays are then committed.
`scripts/clean.sh` never prunes these committed overlays.

## Symlink hygiene

All symlinks are relative, so they resolve correctly regardless of clone
location.

Requirements:

- `git config --get core.symlinks` must return `true` (macOS default). On
  Windows, run `git config core.symlinks true` in an admin shell before cloning,
  or use WSL.
- Symlinks are tracked as mode `120000` entries. Verify with:
  `git ls-files -s .agents/skills/ .claude/skills/`
- The `.gitattributes` rules `export-ignore` both overlay directories so
  `git archive` release tarballs do not include the overlay surface.

## Migration history

This repository was consolidated from separate upstream repositories in issue
[#58](https://github.com/patinaproject/skills/issues/58). Historical design
context now lives on related GitHub issues rather than in committed planning
artifacts.

Release history remains available in [CHANGELOG.md](../CHANGELOG.md). Current
release mechanics are documented in [release-flow.md](./release-flow.md).
