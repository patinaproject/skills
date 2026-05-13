# Skill Release Flow

The Patina Project skills repo releases via `release-please` with a single root package
(`release-type: simple`). Tag form: `v<X.Y.Z>` — no component prefix.

Skills live flat at `skills/<name>/` in this repo. Five in-repo skills ship as
`patinaproject-skills`: `scaffold-repository`, `superteam`, `using-github`,
`office-hours`, `plan-ceo-review`. All five are versioned together as a single
marketplace surface. On each release,
`release-please` also bumps `metadata.version` in `.claude-plugin/marketplace.json` via the
`extra-files` block in `release-please-config.json`. `find-skills` is no longer part of
`patinaproject-skills`; install it separately from `vercel-labs/skills` (see root README).

## Install via vercel-labs skills CLI

The primary install path for end users is the
[vercel-labs/skills](https://github.com/vercel-labs/skills) CLI:

```sh
npx skills@latest add patinaproject/skills
```

The CLI prompts for which skills to install and auto-detects your agent.

**Supply-chain note:** For environments where you want to prevent install scripts from
running, prefix with `npm_config_ignore_scripts=true`. The CLI internal stability target
is `skills@1.5.6` — see [CLI version pinning](#cli-version-pinning) for details.

**Standalone-skill resolution:** `npx skills add patinaproject/skills@<name>` (no `#<ref>`
qualifier) resolves to the default branch HEAD. Consumers wanting a pinned version pass
`patinaproject/skills@<name>#<git-ref>`.

**Supply-chain fallback:** If the upstream CLI is unavailable or distrusted, clone the repo
and copy `skills/<name>/` directly into the agent's skill directory. No build step required.

## Lifecycle

1. A contributor opens a PR against `main` with changes under `skills/<name>/` (bug fix,
   new feature, content update). The PR merges via squash merge.
2. `release-please` (`.github/workflows/release-please.yml`) runs on every push to `main`
   and maintains a standing Release PR for the root package. When a Release PR is merged,
   release-please:
   - Tags the commit with `v<X.Y.Z>` (e.g. `v1.1.0`).
   - Publishes a GitHub Release.
   - Updates the root `CHANGELOG.md`.
3. On every release, the `apply-scaffold-repository` job additionally runs
   `node scripts/apply-scaffold-repository.js skills/scaffold-repository` and commits any
   resulting scaffolding changes back to `main` (see
   [Scaffold-repository self-apply](#scaffold-repository-self-apply)). The apply script is
   idempotent — it exits 0 with no changes when there is no scaffolding drift.
4. Auto-merge (`gh pr merge --auto --squash`) is enabled on each open release-please PR
   after required checks pass.

Bot-generated release-please PRs from `release-please--*` branches are the only PRs that
may omit a GitHub issue ID in the commit subject.

## Tag shape

`release-please` emits a single root tag per release:

- `v1.0.0` (initial release)
- `v1.1.0` (minor bump from `feat:` commits)
- `v1.0.1` (patch bump from `fix:` commits)

The vercel-labs CLI consumer pins a specific tag via `#<git-ref>`:

```sh
npx skills@latest add patinaproject/skills@scaffold-repository#v1.0.0
```

The `v<X.Y.Z>` ref selects the state of the entire repo at that tag. Because all five
skills live under `skills/<name>/SKILL.md` in the same repo, one tag pins the full set.
`skills-lock.json`'s `computedHash` records per-skill content provenance for reproducible
re-installs within a given tag.

## Scaffold-repository self-apply

This repo dogfoods `scaffold-repository`: every release drives an update of this repo's own
scaffolding (commitlint config, husky hooks, issue templates, etc.). On each release-please
run that produces a tag, the scaffolding refresh runs unconditionally. The apply script is
idempotent — it writes nothing and exits 0 when there is no scaffolding diff.

`node scripts/apply-scaffold-repository.js skills/scaffold-repository` makes no
outbound network calls. The script applies the scaffold-repository baseline files from the
local `skills/scaffold-repository/templates/` tree. Run
`node scripts/apply-scaffold-repository.js skills/scaffold-repository --check`
to preview what would change.

**Intentional divergences from the template:** This skills repo is a monorepo root; it
does not have a single root `package.json` `version` field. As a result, two template
items are not applied by the self-apply script:

- `.husky/pre-commit` — the template hook calls `pnpm check:versions`, which checks
  plugin manifest versions against `package.json`. This repo has no root plugin manifests
  and no root `version` field, so the hook is skipped for self-apply.
- `.github/workflows/markdown.yml` — the template excludes `#plugins/**` for plugin
  wrapper directories, but this repo uses `#skills/**` for the flat skill layout.
  The in-repo version is intentionally customized and must not be reverted.

## Invariants

- An untagged skill is not pinnable. The first `v<X.Y.Z>` tag is what introduces the repo
  to the install path with a pinnable `#<ref>`.
- Standalone skills (`office-hours`, `plan-ceo-review`, `find-skills`) are not release-please packages.
  They are installed from the default branch or a specific `#<git-ref>`.
- `skills-lock.json` must be committed after any `npx skills add` invocation. The lockfile
  records provenance for vercel-labs CLI-managed installs.

## CLI version pinning

The vercel-labs CLI is pinned at `skills@1.5.6` in all documentation. To bump:

1. Update the version in `README.md`, `AGENTS.md`, and `docs/release-flow.md`.
2. Re-run `bash scripts/verify-dogfood.sh` — exits 0.
3. Run the [check-a local-path verification](../README.md#local-iteration) — exits 0.
4. Open a PR with the version bump.

## Token setup (required before first release)

`release-please-action` runs with `token: ${{ github.token }}` by default. This
works for opening release PRs, but has a known GitHub limitation:

> PRs created with `GITHUB_TOKEN` do not trigger subsequent workflow runs.

The repo's required PR checks (`lint`, `markdown`, `verify`, etc.) therefore do
NOT run on bot-created release PRs, so the auto-merge job in `release-please.yml`
will wait indefinitely.

To enable fully-automated release PRs:

1. Create a GitHub App or PAT with these scopes:
   - `contents: write` — to push tags
   - `pull-requests: write` — to open and update release PRs
   - `issues: write` — to manage `autorelease:*` labels
   - `workflows: write` — required if the scaffold-repository self-apply
     ever touches a file under `.github/workflows/**` (the default
     `GITHUB_TOKEN` cannot modify workflow files).
2. Add the token as a repository secret named `RELEASE_PLEASE_TOKEN`.
3. Edit `.github/workflows/release-please.yml`: replace
   `token: ${{ github.token }}` with `token: ${{ secrets.RELEASE_PLEASE_TOKEN }}`.

The scaffold-refresh step already falls back to `RELEASE_PLEASE_TOKEN` when
present (`${{ secrets.RELEASE_PLEASE_TOKEN || github.token }}`), so this scope
is consumed automatically once the secret exists.

Until that's done, release PRs need a manual `git commit --allow-empty` or
maintainer push to trigger checks, and any scaffold refresh that touches
`.github/workflows/**` will fail at the Contents API PUT. The first-release
fix can be deferred until either of those scenarios actually occurs.
