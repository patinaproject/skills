# Repository File Structure

This repository is the marketplace surface for Patina Project plugins and
related install documentation. Eight skills live under `skills/<name>/` in a
flat layout.

## Top level

- `skills/scaffold-repository/`: scaffold-repository skill
- `skills/using-github/`: using-github skill
- `skills/new-branch/`: issue branch preparation skill
- `skills/develop-issue/`: issue development orchestration skill
- `skills/finish-pr/`: PR finishing skill
- `skills/review-code/`: isolated local branch-diff review skill
- `skills/update-branch/`: local branch update skill
- `skills/install-skills/`: project-local skills CLI installation skill
- `.agents/skills/<name>/`: committed symlinks into `../../skills/<name>/`
- `.claude/skills/<name>/`: committed symlinks into `../../skills/<name>/`
- `.claude-plugin/marketplace.json`: Claude marketplace catalog
- `.claude-plugin/plugin.json`: Claude plugin manifest listing all eight skill paths
- `.codex-plugin/plugin.json`: Codex plugin manifest listing all eight skill paths
- `.agents/plugins/marketplace.json`: Codex marketplace catalog
- `.codex/environments/environment.toml`: Codex workspace setup for this repository
- `skills-lock.json`: vercel-labs CLI install lockfile
- `docs/`: contributor-facing docs for skill maintenance
- `package.json`, `commitizen.config.json`, `commitlint.config.js`: repo tooling
- `.husky/`: local git hooks
- `.lintstagedrc.js`: lint-staged config that excludes vendored skill files
  from root lint

## Flat skill layout

Eight skills are owned by this repository:

| Skill | Canonical path | Description |
| --- | --- | --- |
| `scaffold-repository` | `skills/scaffold-repository/` | Scaffold or realign a repo to the Patina Project baseline |
| `using-github` | `skills/using-github/` | GitHub workflow skill |
| `new-branch` | `skills/new-branch/` | Issue branch preparation |
| `develop-issue` | `skills/develop-issue/` | Issue development orchestration |
| `finish-pr` | `skills/finish-pr/` | Ready-for-merge PR finishing |
| `review-code` | `skills/review-code/` | Isolated local branch-diff review |
| `update-branch` | `skills/update-branch/` | Local branch update workflow |
| `install-skills` | `skills/install-skills/` | Project-local skills CLI installation workflow |

`find-skills` is a third-party vendored skill from `vercel-labs/skills`. It is
installed via the vercel-labs CLI and is not owned by this repository. Install
with: `npx skills@latest add vercel-labs/skills@find-skills`

Each `skills/<name>/` directory contains at minimum a `SKILL.md` with YAML
frontmatter including `name: <name>` and `description:` fields. Supporting
files such as templates, agents, and workflow docs live alongside `SKILL.md`.

## Dogfood overlay layout

The eight in-repo skills are also accessible through two overlay directories
via one-hop committed symlinks:

| Overlay path | Symlink target | Mode |
| --- | --- | --- |
| `.agents/skills/<name>` | `../../skills/<name>` | `120000` |
| `.claude/skills/<name>` | `../../skills/<name>` | `120000` |

These symlinks allow the agent runtime to discover the in-repo skills alongside
any third-party skills installed by the vercel-labs CLI.

Third-party CLI-installed skills are untracked; only the eight in-repo overlay
symlinks are committed.

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
