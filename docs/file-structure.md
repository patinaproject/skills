# Repository File Structure

This repository carries the Patina Project marketplace catalogs and contributor docs for both Codex and Claude.

## Top level

- `.agents/plugins/marketplace.json`: the Codex marketplace catalog
- `.claude-plugin/marketplace.json`: the Claude marketplace catalog
- `.agents/plugins/marketplace.local.json`: dev-overlay Codex catalog (path sources; not released)
- `.claude-plugin/marketplace.local.json`: dev-overlay Claude catalog (path sources; not released)
- `.agents/skills/`: canonical workspace overlay — one directory per skill
- `.claude/skills/`: Claude Code skill-loader layer — relative symlinks into `.agents/skills/`
- `plugins/`: vendored plugin packages carrying their own SKILL.md trees
- `skills-lock.json`: vercel-labs CLI install lockfile (auto-generated; commit it)
- `docs/`: contributor-facing docs for marketplace maintenance
- `package.json`, `commitizen.config.js`, `commitlint.config.js`: repo tooling
- `.husky/`: local git hooks
- `.lintstagedrc.cjs`: lint-staged config that excludes vendored plugin files from root lint

## Marketplace workflow

- Register each plugin in `.agents/plugins/marketplace.json` for Codex and `.claude-plugin/marketplace.json` for Claude
- All three plugin entries point at this repo (`patinaproject/skills`) with a `vX.Y.Z` ref
- For local iteration, use the dev overlays: `.agents/plugins/marketplace.local.json` and
  `.claude-plugin/marketplace.local.json` with `source: "path"` entries
- Keep plugin names, folder names, and manifest names aligned
- Use GitHub issue-tagged conventional commits with no scopes
- Use `AC-<issue>-<n>` identifiers for issue acceptance criteria in specs and plans, and use an
  `Acceptance Criteria` section with one `### AC-<issue>-<n>` heading per relevant AC in PR descriptions

## Canonical skill overlay layout

Five skills are registered in the in-repo canonical overlay:

| Skill | Shape | Canonical path | Claude path |
| --- | --- | --- | --- |
| scaffold-repository | Plugin-scoped | `.agents/skills/scaffold-repository` → `plugins/scaffold-repository/skills/scaffold-repository` | `.claude/skills/scaffold-repository` → `.agents/skills/scaffold-repository` |
| superteam | Plugin-scoped | `.agents/skills/superteam` → `plugins/superteam/skills/superteam` | `.claude/skills/superteam` → `.agents/skills/superteam` |
| using-github | Plugin-scoped | `.agents/skills/using-github` → `plugins/using-github/skills/using-github` | `.claude/skills/using-github` → `.agents/skills/using-github` |
| find-skills | Standalone | `.agents/skills/find-skills/SKILL.md` (real file) | `.claude/skills/find-skills` → `.agents/skills/find-skills` |
| office-hours | Standalone | `.agents/skills/office-hours/SKILL.md` (real file) | `.claude/skills/office-hours` → `.agents/skills/office-hours` |

Standalone skills (`find-skills`, `office-hours`) are NOT marketplace entries. They are installed
directly into the canonical overlay and are not distributed as plugins.

## Symlink hygiene

All symlinks under `.agents/skills/` and `.claude/skills/` are relative (not absolute), so they
resolve correctly regardless of clone location.

Requirements:

- `git config --get core.symlinks` must return `true` (macOS default). If it returns `false`
  (common on Windows/WSL with misconfigured git), run `git config core.symlinks true` to fix.
- Symlinks are tracked as mode `120000` entries. Verify with:
  `git ls-files -s .agents/skills/ .claude/skills/`
- The `.gitattributes` rules `export-ignore` both directories so `git archive` release tarballs
  do not include the overlay surface.

### Gate G2 (Codex dev overlay source mode)

The Codex dev overlay uses `"source": "path"` with a repo-relative `path` field in
`.agents/plugins/marketplace.local.json`. If live Codex verification rejects `source: path`,
the fallback is `git+file://` URLs against the local clone. Record which mode is in effect here
when verification runs.

**Current status:** `source: "path"` is the declared mode; live Codex verification against
the path overlay has not been run in this worktree. Update this section after W3.4 verification.

## Developer overlays

`marketplace.local.json` files declare path-based plugin sources for local iteration:

```json
{
  "source": "path",
  "path": "../../plugins/<slug>"
}
```

These files are excluded from `git archive` via `.gitattributes` `export-ignore` rules and
must never appear in a released manifest. The release-mode validator enforces this.

## Migration history

This repository was consolidated from three separate upstream plugin repositories in issue [#58](https://github.com/patinaproject/skills/issues/58) (approved design: `docs/superpowers/specs/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-design.md`, plan: `docs/superpowers/plans/2026-05-11-58-merge-superteam-bootstrap-using-github-skills-into-this-repository-for-easier-skill-iteration-plan.md`).

### Import mechanism

History was preserved using `git subtree add` for each source repository at its current tagged release. This keeps per-file blame intact and gives the SHA-256 round-trip check a defensible base.

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

| Plugin | Tag | Upstream commit SHA | Merge commit in this repo |
| --- | --- | --- | --- |
| bootstrap | v1.10.0 | `f65664c3e61336f7f79d735bec21025d2c3dc476` | `912d6d9` |
| superteam | v1.5.0 | `2dc88cb7e445b4661b473efc21678cae8c3a9c14` | `028165e` |
| using-github | v2.0.0 | `2aabdb36fe41342810753222e1848bc5ef01ebf4` | `54157bc` |

### SHA-256 round-trip (AC-58-7)

The `plugins/superteam/skills/superteam/SKILL.md` and the `executor.openai.yaml` non-negotiable-rules block were SHA-256 hashed before and after the subtree import. Both round-trips passed byte-equivalence:

| Surface | Pre-merge 8-char prefix | Post-merge 8-char prefix | Result |
| --- | --- | --- | --- |
| SKILL.md | `87867b66` | `87867b66` | MATCH |
| executor non-negotiable-rules block | `448fac05` | `448fac05` | MATCH |

### bootstrap → scaffold-repository rename (Workstream 9)

After the three subtree imports, the in-tree copy of the `bootstrap` plugin was renamed to
`scaffold-repository` in a single reviewable diff. The upstream `patinaproject/bootstrap`
repository is unchanged and retains its `v1.10.0` tag as the byte-for-byte reference for
pre-rename audits.

| Event | Commit SHA | Description |
| --- | --- | --- |
| W9 rename | `5f60d65` | `refactor: #58 rename bootstrap plugin to scaffold-repository` — `git mv plugins/bootstrap plugins/scaffold-repository`, SKILL.md frontmatter name updated, plugin.json names updated |

The rename covers only the in-tree copy and its consumer-visible surfaces in this repo
(marketplace manifests, release-please config, apply script, canonical overlay symlinks,
dogfood script). The upstream `patinaproject/bootstrap` repository name is preserved because
it is an independent archived repo.

### office-hours standalone skill port (Workstream 10)

The `office-hours` standalone skill was ported byte-for-byte from
`patinaproject/patinaproject` PR #1143 at head SHA
`02e6ebbdbef123bbeb211fad06aa86bd5e33528a`. It is installed as a real file at
`.agents/skills/office-hours/SKILL.md` (not a symlink), with a one-hop symlink at
`.claude/skills/office-hours` pointing into the canonical overlay.

#### Ported skills catalog

| Skill | Source repo | Source PR | Source head SHA | Target path | Port commit |
| --- | --- | --- | --- | --- | --- |
| `office-hours` | `patinaproject/patinaproject` | #1143 | `02e6ebbdbef123bbeb211fad06aa86bd5e33528a` | `.agents/skills/office-hours/SKILL.md` | `fab5458` |

### Archival timeline

The three upstream repositories (`patinaproject/bootstrap`, `patinaproject/superteam`,
`patinaproject/using-github`) are to be archived (not deleted) at least one full release
cycle after consolidation ships. Archiving is tracked as a post-merge action on issue #58.
The repos remain readable for older marketplace consumers and as a recovery path if a
botched merge must be unwound. Do not archive until release-please has shipped at least one
independent per-plugin release from this repository.
