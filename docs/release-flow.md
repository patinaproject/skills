# Skill Release Flow

The Patina Project skills repo releases via `release-please` with a single root package
(`release-type: simple`). Tag form: `v<X.Y.Z>` — no component prefix.

All five skills live under `skills/<name>/` in this repository. The three packaged skills
(`scaffold-repository`, `superteam`, `using-github`) are versioned together as a single
marketplace surface. The two standalone skills (`find-skills`, `office-hours`) are not
release-please packages; consumers install them from the default branch or a specific
`#<git-ref>`.

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
npm_config_ignore_scripts=true npx skills@1.5.6 \
  add patinaproject/skills@scaffold-repository#v1.0.0 \
  --agent claude-code -y
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

`node scripts/apply-scaffold-repository.js skills/scaffold-repository` makes no outbound
network calls. The script applies the scaffold-repository baseline files from the local
`skills/scaffold-repository/templates/` tree. Run
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

- An untagged skill is not pinnable. The first `v<X.Y.Z>` tag is what introduces the repo
  to the install path with a pinnable `#<ref>`.
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
