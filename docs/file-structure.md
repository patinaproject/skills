# Repository File Structure

This repository is the marketplace surface for Patina Project plugins and related install
documentation. Five skills live under `skills/<category>/<name>/` organized by category.

## Top level

- `skills/engineering/`: engineering skills (`scaffold-repository`, `superteam`, `using-github`)
- `skills/productivity/`: productivity skills (`office-hours`, `find-skills`)
- `.agents/skills/<name>/`: committed symlinks into `../../skills/<category>/<name>/` (five in-repo)
- `.claude/skills/<name>/`: committed symlinks into `../../skills/<category>/<name>/` (five in-repo)
- `.claude-plugin/marketplace.json`: Claude marketplace catalog (plugin slug: `patinaproject-skills`)
- `.claude-plugin/plugin.json`: Claude plugin manifest listing all 5 skill paths
- `skills-lock.json`: vercel-labs CLI install lockfile (auto-generated; commit it)
- `docs/`: contributor-facing docs for skill maintenance
- `package.json`, `commitizen.config.js`, `commitlint.config.js`: repo tooling
- `.husky/`: local git hooks
- `.lintstagedrc.cjs`: lint-staged config that excludes vendored skill files and
  superpowers artifacts from root lint

## Category skill layout

Five skills are owned by this repository:

| Skill | Canonical path | Category | Description |
| --- | --- | --- | --- |
| `scaffold-repository` | `skills/engineering/scaffold-repository/` | engineering | Scaffold or realign a repo to the Patina Project baseline |
| `superteam` | `skills/engineering/superteam/` | engineering | Issue-driven orchestration |
| `using-github` | `skills/engineering/using-github/` | engineering | GitHub workflow skill |
| `find-skills` | `skills/productivity/find-skills/` | productivity | Helps users discover and install agent skills |
| `office-hours` | `skills/productivity/office-hours/` | productivity | YC-style office hours for product ideation |

Each `skills/<category>/<name>/` directory contains at minimum a `SKILL.md` with YAML
frontmatter including `name: <name>` and `description:` fields. Supporting files (templates,
agents, workflow docs) live alongside `SKILL.md` in the same directory.

Per-skill READMEs for the three engineering skills are now maintained in-repo at
`skills/engineering/<name>/README.md`, imported from upstream with source headers and
install-block reframes.

## Dogfood overlay layout

The five in-repo skills are also accessible through two overlay directories via one-hop
committed symlinks. The symlinks use the flat `<name>` key so agent runtimes see a
consistent namespace regardless of the on-disk category layout:

| Overlay path | Symlink target | Mode |
| --- | --- | --- |
| `.agents/skills/<name>` | `../../skills/<category>/<name>` | `120000` |
| `.claude/skills/<name>` | `../../skills/<category>/<name>` | `120000` |

These symlinks allow the agent runtime to discover the in-repo skills alongside any
third-party skills installed by the vercel-labs CLI.

Third-party CLI-installed skills are ignored via `.gitignore` patterns; only the five
in-repo overlay symlinks are tracked.

## Symlink hygiene

All symlinks are relative (not absolute), so they resolve correctly regardless of clone
location.

Requirements:

- `git config --get core.symlinks` must return `true` (macOS default). On Windows,
  run `git config core.symlinks true` in an admin shell before cloning, or use WSL.
- Symlinks are tracked as mode `120000` entries. Verify with:
  `git ls-files -s .agents/skills/ .claude/skills/`
- The `.gitattributes` rules `export-ignore` both overlay directories so `git archive`
  release tarballs do not include the overlay surface.

## Migration history

This repository was consolidated from three separate upstream repositories in issue
[#58](https://github.com/patinaproject/skills/issues/58) (approved design:
`docs/superpowers/specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md`,
plan:
`docs/superpowers/plans/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-plan.md`).

### Import mechanism

History was preserved using `git subtree add` for each source repository at its current
tagged release. This keeps per-file blame intact and gives the SHA-256 round-trip check
a defensible base.

### Command sequence actually run (Workstream 1)

```sh
# Bootstrap — imported at v1.10.0
git remote add upstream-bootstrap https://github.com/patinaproject/bootstrap.git
git fetch upstream-bootstrap --tags
git subtree add --prefix=plugins/bootstrap upstream-bootstrap v1.10.0
git remote remove upstream-bootstrap

# Superteam — imported at v1.5.0
git remote add upstream-superteam https://github.com/patinaproject/superteam.git
git fetch upstream-superteam --tags
git subtree add --prefix=plugins/superteam upstream-superteam v1.5.0
git remote remove upstream-superteam

# Using-github — imported at v2.0.0
git remote add upstream-using-github https://github.com/patinaproject/using-github.git
git fetch upstream-using-github --tags
git subtree add --prefix=plugins/using-github upstream-using-github v2.0.0
git remote remove upstream-using-github
```

### Upstream tags imported

| Skill | Tag | Upstream commit SHA | Merge commit in this repo |
| --- | --- | --- | --- |
| bootstrap | v1.10.0 | `f65664c3e61336f7f79d735bec21025d2c3dc476` | `912d6d9` |
| superteam | v1.5.0 | `2dc88cb7e445b4661b473efc21678cae8c3a9c14` | `028165e` |
| using-github | v2.0.0 | `2aabdb36fe41342810753222e1848bc5ef01ebf4` | `54157bc` |

### SHA-256 round-trip (AC-58-7)

The `superteam/SKILL.md` was SHA-256 hashed before and after the subtree import and
again after the delta-4 flatten. All round-trips passed byte-equivalence:

| Surface | 8-char prefix | Result |
| --- | --- | --- |
| SKILL.md (pre-import) | `87867b66` | — |
| SKILL.md (post-import at plugins/) | `87867b66` | MATCH |
| SKILL.md (post-flatten at skills/) | `87867b66` | MATCH |

### bootstrap → scaffold-repository rename (Workstream 9)

After the three subtree imports, the in-tree copy of the `bootstrap` plugin was renamed
to `scaffold-repository` in a single reviewable diff. The upstream `patinaproject/bootstrap`
repository is unchanged and retains its `v1.10.0` tag as the byte-for-byte reference for
pre-rename audits.

| Event | Commit SHA | Description |
| --- | --- | --- |
| W9 rename | `5f60d65` | `refactor: #58 rename bootstrap plugin to scaffold-repository` |

### office-hours standalone skill port (Workstream 10)

The `office-hours` standalone skill was ported byte-for-byte from
`patinaproject/patinaproject` PR #1143 at head SHA
`02e6ebbdbef123bbeb211fad06aa86bd5e33528a`.

| Skill | Source repo | Source PR | Source head SHA | Port commit |
| --- | --- | --- | --- | --- |
| `office-hours` | `patinaproject/patinaproject` | #1143 | `02e6ebbdbef123bbeb211fad06aa86bd5e33528a` | `fab5458` |

### Delta-4 flat-skills restructure (Workstream 12)

The plugin wrapper directories and marketplace catalogs were deleted, and all five skills
were moved to `skills/<name>/` at the repo root in a single `git mv` chain. One-hop
dogfood overlay symlinks replaced the prior two-hop chain.

| Event | Description |
| --- | --- |
| `git mv plugins/scaffold-repository/skills/scaffold-repository skills/scaffold-repository` | Flatten scaffold-repository |
| `git mv plugins/superteam/skills/superteam skills/superteam` | Flatten superteam |
| `git mv plugins/using-github/skills/using-github skills/using-github` | Flatten using-github |
| `git mv .agents/skills/find-skills skills/find-skills` | Flatten find-skills |
| `git mv .agents/skills/office-hours skills/office-hours` | Flatten office-hours |

The upstream `patinaproject/bootstrap`, `patinaproject/superteam`, and
`patinaproject/using-github` repos remain archived as the byte-for-byte references for
pre-flatten audits. Do not archive them until release-please has shipped at least one
`v<X.Y.Z>` release from this repository.

### Archival timeline

The three upstream repositories are to be archived (not deleted) at least one full release
cycle after consolidation ships. Archiving is tracked as a post-merge action on issue #58.

### Delta 6 — mattpocock structure (Workstreams W20–W25)

The flat `skills/<name>/` layout was reorganized into a category layout to match the
mattpocock plugin structure and enable a host-native install path via `.claude-plugin/`.

| Event | Description |
| --- | --- |
| W20 category restructure | `git mv skills/<name>/ skills/<category>/<name>/` for all 5 skills; overlay symlinks updated to three-segment paths |
| W21 marketplace catalog | `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json` added; `release-please-config.json` updated with `extra-files` for `metadata.version` |
| W22 per-skill READMEs | `skills/engineering/<name>/README.md` imported from upstream repos with source headers and install-block reframes |
| W23 root README | `README.md` rewritten in mattpocock format (100–200 lines, quickstart-first, per-skill blurbs, skills table) |
| W24 doc sweep | `AGENTS.md`, `docs/release-flow.md`, `docs/file-structure.md`, `docs/wiki-index.md` updated for category paths and plugin slug |
| W25 final verification | Full suite passed: `pnpm lint:md`, `actionlint`, `verify-dogfood.sh`, `verify-marketplace.sh`, SHA round-trip |
