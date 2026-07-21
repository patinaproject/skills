# Repository File Structure

This repository is the marketplace surface for Patina Project plugins and
related install documentation. Skills live under `skills/<name>/` in a flat
layout.

## Top level

- `skills/scaffold-repository/`: scaffold-repository skill
- `skills/using-github/`: using-github skill
- `skills/new-branch/`: issue branch preparation skill
- `skills/working-on-issue/`: shared align skill (resolve issue from ref or branch, mark started, branch)
- `skills/new-issue/`: tracker-agnostic issue filing skill
- `skills/edit-issue/`: tracker-agnostic issue update skill
- `skills/develop/`: issue development orchestration skill
- `skills/develop-with-workflow/`: Claude Workflow-orchestrated parallel slice build skill
- `skills/ready-pr/`: PR readiness and publication skill
- `skills/merge-pr/`: repository-managed auto-merge skill
- `skills/finish-pr/`: deprecated compatibility alias for `ready-pr`
- `skills/codex-pr-feedback-loop/`: Codex PR review feedback automation skill
- `skills/polish/`: pre-PR deepen-then-review readiness gate skill
- `skills/update-branch/`: local branch update skill
- `skills/install-skills/`: project-local skills CLI installation skill
- `skills/write-docs/`: capture-only CONTEXT.md/ADR documentation skill
- `skills/write-changelog/`: tracker-backed milestone and Release changelog skill
- `skills/prompting-fable/`: Claude Fable 5 prompting and configuration guidelines skill
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
- `.codex/config.toml`: Codex hosted Linear MCP registration
- `.mcp.json`: hosted Linear MCP registration for supported agent hosts
- `skills-lock.json`: vercel-labs CLI install lockfile
- `docs/`: contributor-facing docs for skill maintenance
- `docs/issue-tracker.md`: sole provider-specific tracker adapter
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
| `working-on-issue` | `skills/working-on-issue/` | Shared align step: resolve issue (ref or branch), mark started, branch |
| `new-issue` | `skills/new-issue/` | Draft and publish issues through the tracker adapter |
| `edit-issue` | `skills/edit-issue/` | Safely update issues through the tracker adapter |
| `develop` | `skills/develop/` | Issue development orchestration |
| `develop-with-workflow` | `skills/develop-with-workflow/` | Parallel vertical-slice build converged onto one branch |
| `ready-pr` | `skills/ready-pr/` | Publish and prove a PR ready to merge |
| `merge-pr` | `skills/merge-pr/` | Enable repository-managed auto-merge |
| `finish-pr` | `skills/finish-pr/` | Deprecated compatibility alias for `ready-pr` |
| `codex-pr-feedback-loop` | `skills/codex-pr-feedback-loop/` | Codex app PR review feedback automation |
| `polish` | `skills/polish/` | Pre-PR deepen-then-review readiness gate |
| `update-branch` | `skills/update-branch/` | Local branch update workflow |
| `install-skills` | `skills/install-skills/` | Project-local skills CLI installation workflow |
| `write-docs` | `skills/write-docs/` | Capture-only CONTEXT.md glossary and ADR documentation |
| `write-changelog` | `skills/write-changelog/` | Render milestone or shipped Release notes from tracker issues |
| `prompting-fable` | `skills/prompting-fable/` | Guidelines for prompting and configuring Claude Fable 5 |

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

This repository was consolidated from separate upstream repositories in legacy
issue [#58](https://github.com/patinaproject/skills/issues/58). Current design
context lives on related Linear issues rather than in committed planning
artifacts; legacy GitHub issues remain read-only historical references.

Release history remains available in [CHANGELOG.md](../CHANGELOG.md). Current
release mechanics are documented in [release-flow.md](./release-flow.md).
