# Plugin Release Flow

The Patina Project marketplace only publishes **tagged releases** (`vX.Y.Z`) of member plugins.
The manifests in this repo never reference a branch — every plugin entry pins an explicit `ref`.

Current member plugins tracked by this flow:

- `scaffold-repository` — repo scaffolding skill. Also **consumed by this repo** (see
  [Scaffold-repository self-apply](#scaffold-repository-self-apply) below), so a
  scaffold-repository release both updates the marketplace entry and refreshes this repo's own
  scaffolding.
- `superteam` — issue-driven orchestration skill.
- `using-github` — agent ergonomics for GitHub workflows (`/edit-issue`, `/new-issue`,
  `/new-branch`).

All three plugins live under `plugins/<name>/` in this repository. This repo is the
source-of-truth for packaging; upstream repos (`patinaproject/bootstrap`,
`patinaproject/superteam`, `patinaproject/using-github`) are archived.

## Install via vercel-labs skills CLI

The primary install path for end users is the [vercel-labs/skills](https://github.com/vercel-labs/skills)
CLI, pinned at invocation time:

```sh
# Install scaffold-repository
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@scaffold-repository \
  --agent claude-code -y

# Install superteam
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@superteam \
  --agent claude-code -y

# Install using-github
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@using-github \
  --agent claude-code -y

# Install office-hours standalone skill
npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills@office-hours \
  --agent claude-code -y
```

**Supply-chain note:** `npm_config_ignore_scripts=true` is the default prefix for all install
commands in documentation. Do not omit it. The CLI version (`skills@1.5.6`) is pinned at
invocation — pass `--yes` or `-y` to avoid the interactive prompt. Bumping the pinned CLI
version requires re-running `bash scripts/verify-dogfood.sh` and the
[check-a local-path verification](../README.md#local-iteration) before merging.

**Standalone-skill resolution:** `npx skills add patinaproject/skills@<name>` (no `#<ref>`
qualifier) resolves to the default branch HEAD. Consumers wanting a pinned version pass
`patinaproject/skills@<name>#<git-ref>`.

## Lifecycle

1. A contributor opens a PR against `main` with changes under `plugins/<name>/` (bug fix,
   new feature, dependency bump). The PR merges via squash merge.
2. `release-please` (`.github/workflows/release-please.yml`) runs on every push to `main` and
   maintains a standing per-package Release PR for each plugin with an unreleased commit. When a
   Release PR is merged, release-please:
   - Tags the commit with `<prefix>-vX.Y.Z` (see [Gate G1](#gate-g1-tag-prefix-stripping) below).
   - Rewrites the matching plugin entry's `source.ref` in both marketplace manifests via
     `extra-files` JSONPath.
   - Publishes a GitHub Release.
3. The `validate-manifests` job runs after each release to confirm the new `ref` satisfies the
   `vX.Y.Z` validator before auto-merge fires.
4. For `scaffold-repository` releases, the `apply-scaffold-repository` job additionally runs
   `node scripts/apply-scaffold-repository.js plugins/scaffold-repository` and commits any
   resulting scaffolding changes onto the same release PR branch (see
   [Scaffold-repository self-apply](#scaffold-repository-self-apply)).
5. Auto-merge (`gh pr merge --auto --squash`) is enabled on each open release-please PR after
   required checks pass.

Bot-generated release-please PRs from `release-please--*` branches and bot-generated release
bump PRs from `bot/bump-*` branches are the only PRs that may omit a GitHub issue ID in the
commit subject.

## Gate G1: tag-prefix stripping

`release-please` emits prefixed tags:

- `scaffold-repository-v1.11.0`
- `superteam-v1.6.0`
- `using-github-v2.1.0`

The `extra-files` JSONPath rewrites use `release-please`'s `GenericJson` updater, which
applies a semver regex replacement against the **existing field value** rather than writing
the full tag string. Because the current `source.ref` values are already `v-prefixed`
(e.g., `v1.10.0`), the updater replaces only the numeric portion — producing `v1.11.0`,
not `scaffold-repository-v1.11.0`.

No post-step prefix-strip is needed. The `validate-manifests` job runs after release-please
and confirms that every `ref` still matches `^v\d+\.\d+\.\d+$` before auto-merge fires.

**Invariant:** As long as the canonical marketplace manifests always carry `v-prefixed` refs
(which the release-mode validator enforces), each release-please bump will produce the
correct `vX.Y.Z` ref automatically.

## Scaffold-repository self-apply

This repo dogfoods `scaffold-repository`: the same tag that publishes scaffold-repository to
the marketplace also drives an update of this repo's own scaffolding (commitlint config, husky
hooks, issue templates, etc.). On a scaffold-repository release, the marketplace manifest
update and the scaffolding refresh land in the same PR so the review covers both changes at
once.

`node scripts/apply-scaffold-repository.js plugins/scaffold-repository` is idempotent and
makes no outbound network calls. The script applies the scaffold-repository baseline files
from the local `plugins/scaffold-repository/skills/scaffold-repository/templates/` tree. Run
`node scripts/apply-scaffold-repository.js plugins/scaffold-repository --check` to preview
what would change.

**Intentional divergences from the template:** This marketplace repo is a monorepo root; it
does not have a single root `package.json` `version` field. As a result, two template items
are not applied by the self-apply script:

- `.husky/pre-commit` — the template hook calls `pnpm check:versions`, which runs
  `scripts/check-plugin-versions.mjs`. That script checks `.claude-plugin/plugin.json` and
  `.codex-plugin/plugin.json` version alignment with `package.json`. This repo has no root
  plugin manifests and no root `version` field, so the hook is skipped for self-apply.
  Downstream bootstrapped plugin repos apply it normally.
- `scripts/check-plugin-versions.mjs` is not in STATIC_FILES for the same reason.

The apply script documents these exclusions inline. Running `--check` exits 0 after excluding
these two items.

## Invariants

- Every plugin entry in both manifests has an explicit `ref` matching `vX.Y.Z`. Branches
  (`main`, `trunk`, etc.) are not allowed.
- An untagged plugin is not listed in the marketplace at all. The first tagged release is what
  introduces it.
- The pre-rename slug `bootstrap` must never appear in a released manifest. The release-mode
  validator enforces this.
- Standalone skills (`office-hours`, `find-skills`) are NOT marketplace entries. They are
  installed directly into `.agents/skills/<name>/` and distributed via the skills CLI without
  a marketplace entry.
- `marketplace.local.json` dev overlays must never appear in the released payload. The
  release-mode validator and `.gitattributes` export-ignore rules enforce this.

## Manual fallback

For a fully manual bump, edit `source.ref` for the plugin entry in both
[.claude-plugin/marketplace.json](../.claude-plugin/marketplace.json) and
[.agents/plugins/marketplace.json](../.agents/plugins/marketplace.json), then open a PR with
`chore: #<issue> bump <plugin> to <tag>`.
