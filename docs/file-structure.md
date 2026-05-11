# Repository File Structure

This repository carries the Patina Project marketplace catalogs and contributor docs for both Codex and Claude.

## Top level

- `.agents/plugins/marketplace.json`: the Codex marketplace catalog
- `.claude-plugin/marketplace.json`: the Claude marketplace catalog
- `plugins/`: optional packaged Codex plugins when this repo vendors local plugin copies
- `docs/`: contributor-facing docs for marketplace maintenance
- `package.json`, `commitizen.config.js`, `commitlint.config.js`: repo tooling
- `.husky/`: local git hooks

## Marketplace workflow

- Register each plugin in `.agents/plugins/marketplace.json` for Codex and `.claude-plugin/marketplace.json` for Claude
- Use `source: "git-subdir"` for plugins that live in subdirectories of other repos
- Use `source: "url"` for plugins that live at the root of other repos
- Keep marketplace entries pointed at the owning repository for packaged plugin assets
- Do not vendor a duplicate Claude plugin package here when the upstream repository already owns that install surface
- Vendor a plugin under `plugins/<plugin-name>/` only when this repo should carry the package directly
- Keep plugin names, folder names, and manifest names aligned
- Use GitHub issue-tagged conventional commits with no scopes
- Use `AC-<issue>-<n>` identifiers for issue acceptance criteria in specs and plans, and use an `Acceptance Criteria` section with one `### AC-<issue>-<n>` heading per relevant AC in PR descriptions

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

### Archival timeline

The three upstream repositories (`patinaproject/bootstrap`, `patinaproject/superteam`, `patinaproject/using-github`) are to be archived (not deleted) at least one full release cycle after consolidation ships. Archiving is tracked as a post-merge action on issue #58. The repos remain readable for older marketplace consumers and as a recovery path if a botched merge must be unwound. Do not archive until release-please has shipped at least one independent per-plugin release from this repository.
