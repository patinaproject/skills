# Patina Project

This repository carries the Patina Project marketplace catalogs for both Codex and Claude plugins,
and vendors the plugin packages they distribute. It is both the marketplace catalog and the
source-of-truth for three packaged plugins plus two standalone skills.

## Plugins

| Plugin | Description | Latest |
| --- | --- | --- |
| `scaffold-repository` | Scaffold or realign a repo to the Patina Project baseline | `v1.10.0` |
| `superteam` | Issue-driven orchestration: design → plan → execute → review | `v1.5.0` |
| `using-github` | GitHub workflow skill: issues, branches, PRs, changelogs | `v2.0.0` |

## Standalone Skills

| Skill | Description |
| --- | --- |
| `office-hours` | YC-style office hours partner for product ideation (two modes: Startup / Builder) |
| `find-skills` | Helps users discover and install agent skills |

## Install via vercel-labs skills CLI (primary)

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

# find-skills (from vercel-labs/skills)
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add vercel-labs/skills@find-skills --agent claude-code -y
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

**Standalone-skill resolution:** `patinaproject/skills@<name>` without a `#<ref>` qualifier
resolves to the default branch HEAD. To pin a specific version, pass
`patinaproject/skills@<name>#<git-ref>` (e.g. `#scaffold-repository-v1.10.0`).

## Install via host-native CLI (fallback)

### Claude Code

Register the marketplace, then install by plugin name:

```text
/plugin marketplace add patinaproject/skills
/plugin install scaffold-repository@patinaproject-skills
/plugin install superteam@patinaproject-skills
/plugin install using-github@patinaproject-skills
```

### Codex

```sh
codex plugin marketplace add patinaproject/skills --ref main
codex plugin marketplace upgrade
```

Then open the Codex Plugin Directory and install `scaffold-repository`, `superteam`, or
`using-github`.

## Use installed plugins

```text
Use $scaffold-repository:scaffold-repository to align this repository with the Patina Project baseline.
```

```text
Use $superteam:superteam to take issue #123 from design through review-ready execution.
```

```text
Use $using-github for GitHub issue, branch, PR, and changelog work.
```

## Local iteration

Four falsifiable checks prove the in-repo skills are wired correctly. Run these after any
change to `plugins/`, `scripts/`, `.agents/skills/`, or `.claude/skills/`.

### Check a — CLI resolves skills from local paths (exit 0)

```sh
# scaffold-repository plugin
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add ./plugins/scaffold-repository --list

# office-hours standalone skill
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add ./.agents/skills/office-hours --list
```

Proves: the SKILL.md shape is compatible with the vercel-labs CLI (name, description
fields present, file resolvable). In CI, local path sources are used because the
branch may not be published at check time. Post-merge, use the `patinaproject/skills@<plugin>`
remote form.

### Check b — marketplace validator modes (exit 0 / non-zero)

```sh
# Dev overlay must be accepted
node scripts/validate-marketplace.js --dev

# Release mode must reject an overlay placed at a release-eligible path
cp .claude-plugin/marketplace.local.json plugins/scaffold-repository/marketplace.local.json
! node scripts/validate-marketplace.js   # expect non-zero
rm plugins/scaffold-repository/marketplace.local.json

# Released manifests must pass
node scripts/validate-marketplace.js
```

Proves: the released manifests carry correct `vX.Y.Z` refs; dev overlays are accepted in
dev mode and rejected in release mode; no pre-rename or standalone-skill slugs appear in
released manifests.

### Check c — scaffold-repository apply, no network (exit 0)

```sh
node scripts/apply-scaffold-repository.js plugins/scaffold-repository
```

Proves: the scaffold-repository plugin's templates can be applied idempotently against a
target repo without making any outbound network calls.

### Check d — dogfood verification, all five skills (exit 0)

```sh
bash scripts/verify-dogfood.sh
```

Proves: all five skills (`scaffold-repository`, `superteam`, `using-github`, `find-skills`,
`office-hours`) are discoverable through the canonical `.agents/skills/` overlay and the
`.claude/skills/` symlink layer, with correct frontmatter names and symlink shapes.

## Repository layout

```text
.agents/plugins/marketplace.json     Codex marketplace catalog (released)
.agents/plugins/marketplace.local.json  Codex dev overlay (path sources; not released)
.agents/skills/                      Canonical skill overlay — one directory per skill
.claude-plugin/marketplace.json      Claude marketplace catalog (released)
.claude-plugin/marketplace.local.json   Claude dev overlay (path sources; not released)
.claude/skills/                      Claude Code skill-loader symlinks into .agents/skills/
plugins/                             Vendored plugin packages
scripts/                             Maintenance and verification scripts
skills-lock.json                     vercel-labs CLI install lockfile (commit it)
release-please-config.json           Per-package release-please configuration
.release-please-manifest.json        Per-package version manifest
```

See [docs/file-structure.md](docs/file-structure.md) for the full canonical-layout reference
and symlink hygiene requirements.

## Maintenance notes

- Update marketplace entries in `.agents/plugins/marketplace.json` and
  `.claude-plugin/marketplace.json`
- Keep plugin names, folder names, and manifest names aligned
- Use GitHub issue-tagged conventional commits with no scopes:
  `type: #123 short description`
- Run `pnpm validate:marketplace` before opening marketplace PRs
- Run `pnpm validate:marketplace:remote` when validating release identity against in-tree plugin
  manifests
- See [docs/release-flow.md](docs/release-flow.md) for how plugin releases propagate via
  release-please
- See [docs/wiki-index.md](docs/wiki-index.md) for the full wiki page index
