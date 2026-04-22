# Repository File Structure

This repository is the org-level Codex marketplace repo for Patina Project.

## Top level

- `.agents/plugins/marketplace.json`: the marketplace catalog Codex reads
- `plugins/`: packaged Codex plugins such as `plugins/superteam/`
- `docs/`: contributor-facing docs for marketplace maintenance
- `package.json`, `commitizen.config.js`, `commitlint.config.js`: repo tooling
- `.husky/`: local git hooks

## Marketplace workflow

- Add each packaged plugin under `plugins/<plugin-name>/`
- Register it in `.agents/plugins/marketplace.json`
- Keep plugin names, folder names, and manifest names aligned
- Use GitHub issue-tagged conventional commits with no scopes

