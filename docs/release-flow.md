# Skill Release Flow

The Patina Project skills repo releases three packaged skills via `release-please`
with `release-type: simple`. Tag shape: `<component>-v<X.Y.Z>`.

Current packaged skills tracked by this flow:

- `scaffold-repository` — repo scaffolding skill. Also **consumed by this repo**
  (see [Scaffold-repository self-apply](#scaffold-repository-self-apply) below).
- `superteam` — issue-driven orchestration skill.
- `using-github` — agent ergonomics for GitHub workflows.

Two standalone skills (`find-skills`, `office-hours`) are not release-please packages.
They are versioned outside release-please; consumers wanting a pinned version pass
`patinaproject/skills@<name>#<git-ref>`.

All five skills live under `skills/<name>/` in this repository.

## Install via vercel-labs skills CLI

The primary install path for end users is the
[vercel-labs/skills](https://github.com/vercel-labs/skills) CLI, pinned at invocation:

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
commands. Do not omit it. The CLI version (`skills@1.5.6`) is pinned at invocation — pass
`--yes` or `-y` to avoid the interactive prompt. Bumping the pinned CLI version requires
re-running `bash scripts/verify-dogfood.sh` and the
[check-a local-path verification](../README.md#local-iteration) before merging.

**Standalone-skill resolution:** `npx skills add patinaproject/skills@<name>` (no `#<ref>`
qualifier) resolves to the default branch HEAD. Consumers wanting a pinned version pass
`patinaproject/skills@<name>#<git-ref>`.

**Supply-chain fallback:** If the upstream CLI is unavailable or distrusted, clone the repo
and copy `skills/<name>/` directly into the agent's skill directory. No build step required.

## Lifecycle

1. A contributor opens a PR against `main` with changes under `skills/<name>/` (bug fix,
   new feature, content update). The PR merges via squash merge.
2. `release-please` (`.github/workflows/release-please.yml`) runs on every push to `main`
   and maintains a standing per-skill Release PR for each packaged skill with an unreleased
   commit. When a Release PR is merged, release-please:
   - Tags the commit with `<component>-v<X.Y.Z>` (e.g. `scaffold-repository-v1.10.1`).
   - Publishes a GitHub Release.
3. For `scaffold-repository` releases, the `apply-scaffold-repository` job additionally runs
   `node scripts/apply-scaffold-repository.js skills/scaffold-repository` and commits any
   resulting scaffolding changes onto the same release PR branch (see
   [Scaffold-repository self-apply](#scaffold-repository-self-apply)).
4. Auto-merge (`gh pr merge --auto --squash`) is enabled on each open release-please PR
   after required checks pass.

Bot-generated release-please PRs from `release-please--*` branches are the only PRs that
may omit a GitHub issue ID in the commit subject.

## Tag shape

`release-please` emits prefixed tags:

- `scaffold-repository-v1.11.0`
- `superteam-v1.6.0`
- `using-github-v2.1.0`

Config knobs that produce this shape: `release-type: simple`, `tag-separator: "-v"`,
`include-component-in-tag: true`, `include-v-in-tag: true`, `component: "<name>"`.

The vercel-labs CLI consumer passes the full prefixed tag as `#<git-ref>`:

```sh
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@scaffold-repository#scaffold-repository-v1.10.0 \
  --agent claude-code -y
```

## Scaffold-repository self-apply

This repo dogfoods `scaffold-repository`: the same tag that releases scaffold-repository
also drives an update of this repo's own scaffolding (commitlint config, husky hooks,
issue templates, etc.). On a scaffold-repository release, the scaffolding refresh lands
on the same release PR branch in the same workflow run.

`node scripts/apply-scaffold-repository.js skills/scaffold-repository` is idempotent and
makes no outbound network calls. The script applies the scaffold-repository baseline files
from the local `skills/scaffold-repository/templates/` tree. Run
`node scripts/apply-scaffold-repository.js skills/scaffold-repository --check` to preview
what would change.

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

- An untagged skill is not released. The first tagged release is what introduces it to
  the install path with a pinned `#<ref>`.
- Standalone skills (`office-hours`, `find-skills`) are not release-please packages.
  They are installed from the default branch or a specific `#<git-ref>`.
- `skills-lock.json` must be committed after any `npx skills add` invocation. The lockfile
  records provenance for vercel-labs CLI-managed installs.

## CLI version pinning

The vercel-labs CLI is pinned at `skills@1.5.6` in all documentation. To bump:

1. Update the version in `README.md`, `AGENTS.md`, and `docs/release-flow.md`.
2. Re-run `bash scripts/verify-dogfood.sh` — exits 0.
3. Run the [check-a local-path verification](../README.md#local-iteration) — exits 0.
4. Open a PR with the version bump.
