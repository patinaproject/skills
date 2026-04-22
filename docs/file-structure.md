# Repository File Structure

This repository is the org-level Codex marketplace repo for Patina Project.

## Top level

- `.agents/plugins/marketplace.json`: the marketplace catalog Codex reads
- `plugins/`: optional packaged Codex plugins when this repo vendors local plugin copies
- `docs/`: contributor-facing docs for marketplace maintenance
- `package.json`, `commitizen.config.js`, `commitlint.config.js`: repo tooling
- `.husky/`: local git hooks

## Marketplace workflow

- Register each plugin in `.agents/plugins/marketplace.json`
- Use `source: "git-subdir"` for plugins that live in subdirectories of other repos
- Use `source: "url"` for plugins that live at the root of other repos
- Keep marketplace entries pointed at the owning repository for packaged plugin assets
- Do not vendor a duplicate Claude plugin package here when the upstream repository already owns that install surface
- Vendor a plugin under `plugins/<plugin-name>/` only when this repo should carry the package directly
- Keep plugin names, folder names, and manifest names aligned
- Use GitHub issue-tagged conventional commits with no scopes
- Use `AC-<issue>-<n>` identifiers for issue acceptance criteria in specs and plans, and use `AC-<issue>-<n>` headings in PR descriptions where required
