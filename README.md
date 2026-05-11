# Patina Project Skills

This repository is the source of truth for Patina Project agent skills.
Five skills live under `skills/<name>/` at the repo root.

## Skills

| Skill | Description | Latest |
| --- | --- | --- |
| `scaffold-repository` | Scaffold or realign a repo to the Patina Project baseline | `v1.10.0` |
| `superteam` | Issue-driven orchestration: design → plan → execute → review | `v1.5.0` |
| `using-github` | GitHub workflow skill: issues, branches, PRs, changelogs | `v2.0.0` |
| `office-hours` | YC-style office hours partner for product ideation | — |
| `find-skills` | Helps users discover and install agent skills | — |

`scaffold-repository`, `superteam`, and `using-github` are versioned by
release-please. `office-hours` and `find-skills` are standalone skills that
resolve to the default-branch HEAD when installed without a `#<ref>` qualifier.

## Install via vercel-labs skills CLI

The primary install path uses the [vercel-labs/skills](https://github.com/vercel-labs/skills)
CLI. The `npm_config_ignore_scripts=true` prefix is the default — do not omit it.

### Claude Code

```sh
# scaffold-repository
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@scaffold-repository --agent claude-code -y

# superteam
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@superteam --agent claude-code -y

# using-github
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@using-github --agent claude-code -y

# office-hours (standalone skill)
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@office-hours --agent claude-code -y

# find-skills
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@find-skills --agent claude-code -y
```

### Codex

```sh
# scaffold-repository
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@scaffold-repository --agent codex -y

# superteam
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@superteam --agent codex -y

# using-github
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@using-github --agent codex -y
```

The CLI version (`skills@1.5.6`) is pinned at invocation. A future pin bump requires
re-running `bash scripts/verify-dogfood.sh` and the
[check-a verification](#local-iteration) before merging.

**Pinned version install:** To install a specific tagged release, pass the full
prefixed tag as the `#<git-ref>`:

```sh
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@scaffold-repository#scaffold-repository-v1.10.0 \
  --agent claude-code -y
```

**Standalone-skill resolution:** `patinaproject/skills@<name>` without a `#<ref>`
qualifier resolves to the default branch HEAD. Consumers wanting a pinned version
pass `patinaproject/skills@<name>#<git-ref>`.

## Clone-and-copy fallback

If the npm-distributed CLI is unavailable or distrusted, copy the skill files
directly:

```sh
git clone https://github.com/patinaproject/skills.git
cp -r skills/scaffold-repository ~/.claude/skills/scaffold-repository
# or for Codex:
cp -r skills/scaffold-repository ~/.codex/skills/scaffold-repository
```

Each skill directory contains a `SKILL.md` file and any supporting files the
agent needs. No build step is required.

## Use installed skills

```text
Use $scaffold-repository to align this repository with the Patina Project baseline.
```

```text
Use $superteam to take issue #123 from design through review-ready execution.
```

```text
Use $using-github for GitHub issue, branch, PR, and changelog work.
```

## Local iteration

Three falsifiable checks prove the in-repo skills are wired correctly. Run these
after any change to `skills/`, `scripts/`, `.agents/skills/`, or `.claude/skills/`.

### Check a — CLI resolves skills from local paths (exit 0)

```sh
# scaffold-repository skill
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add ./skills/scaffold-repository --list

# office-hours skill
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add ./skills/office-hours --list
```

Proves: the SKILL.md shape is compatible with the vercel-labs CLI (name, description
fields present, file resolvable). In CI, local path sources are used because the
branch may not be published at check time.

### Check b — scaffold-repository apply, no network (exit 0)

```sh
node scripts/apply-scaffold-repository.js skills/scaffold-repository --check
```

Proves: the scaffold-repository skill's templates can be applied idempotently
against a target repo without making any outbound network calls.

### Check c — dogfood verification, all five skills (exit 0)

```sh
bash scripts/verify-dogfood.sh
```

Proves: all five skills (`scaffold-repository`, `superteam`, `using-github`,
`find-skills`, `office-hours`) are discoverable through the flat `skills/<name>/`
layout and the dogfood overlay symlinks, with correct frontmatter names.

## Repository layout

```text
skills/                              Skill source-of-truth (one directory per skill)
  scaffold-repository/
  superteam/
  using-github/
  find-skills/
  office-hours/
.agents/skills/<name>/               Symlinks to ../../skills/<name>/ (5 in-repo)
.claude/skills/<name>/               Symlinks to ../../skills/<name>/ (5 in-repo)
scripts/                             Maintenance and verification scripts
skills-lock.json                     vercel-labs CLI install lockfile (commit it)
release-please-config.json           Per-skill release-please configuration
.release-please-manifest.json        Per-skill version manifest
```

See [docs/file-structure.md](docs/file-structure.md) for the full canonical-layout
reference and symlink hygiene requirements.

## Maintenance notes

- Keep skill names and folder names aligned
- Use lowercase names for skill folders
- Use GitHub issue-tagged conventional commits with no scopes:
  `type: #123 short description`
- Run `pnpm verify:dogfood` after any overlay change
- Run `pnpm apply:scaffold-repository:check` to confirm scaffolding is in sync
- See [docs/release-flow.md](docs/release-flow.md) for how skill releases work
- See [docs/wiki-index.md](docs/wiki-index.md) for the full wiki page index
