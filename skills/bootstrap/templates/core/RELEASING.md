# Releasing

Releases are driven by [release-please](https://github.com/googleapis/release-please) and Conventional Commits. No manual version bumps, no local release commands.

## How it works

1. Every push to `main` runs the `Release` workflow.
2. `release-please` scans Conventional Commits since the last tag.
3. It opens (or updates) a standing **"chore: release X.Y.Z"** PR that:
   - Bumps `package.json` version.
   - Syncs `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` to the new version (configured in `release-please-config.json`).
   - Appends generated entries to `CHANGELOG.md`.
4. **Clicking Merge on that PR** is the release action. It tags `vX.Y.Z` and publishes a GitHub Release with notes generated from the same commits.

## Semver decision

Determined from commit types — no human choice:

- `fix:` → patch
- `feat:` → minor
- `feat!:` or `BREAKING CHANGE:` footer → major

## Keeping versions aligned between releases

`package.json` is the canonical source. `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` are kept in lockstep.

- `scripts/check-plugin-versions.mjs` is run by the husky `pre-commit` hook and by CI, blocking drift.
- `scripts/sync-plugin-versions.mjs` force-rewrites the plugin manifests from `package.json` if needed.

`CHANGELOG.md` is owned by release-please. Do not hand-edit released sections.

## Distribution via `patinaproject/skills`

When a release is published **and the repository owner is `patinaproject`**, the release workflow automatically dispatches `bump-plugin-tags.yml` on `patinaproject/skills`. That marketplace repo opens (or updates) a PR bumping this plugin's pinned `ref` across every Patina marketplace manifest.

No per-repo opt-in is required — the `github.repository_owner == 'patinaproject'` check in the workflow gates this behavior. Forks in other orgs skip the step automatically.

Prerequisite (org-level, one-time):

- Org secret on `patinaproject`: `PATINA_SKILLS_DISPATCH_TOKEN` — a fine-grained PAT (or GitHub App installation token) with `actions: write` on `patinaproject/skills`. Available to every plugin repo in the org.

If the token is missing, the dispatch step fails but the release itself still completes (the notify step runs in a separate job). Marketplace bumps can also be kicked off manually from `patinaproject/skills`' Actions tab.

## Writing commits for a clean changelog

- Use Conventional Commits: `feat: #<issue> …`, `fix: #<issue> …`, etc.
- Breaking changes: prefix the type with `!` (e.g. `feat!: #123 rename foo to bar`) **and** include a `BREAKING CHANGE: …` footer in the PR body.
- Squash-merge flow: PR titles must themselves be conventional-commit-shaped so the squash commit lands with the correct type/scope. Enforced by the `Lint PR` workflow.
