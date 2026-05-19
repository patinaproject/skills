# Skill Release Flow

The Patina Project skills repo releases via `release-please` with a single root package
(`release-type: simple`). Tag form: `v<X.Y.Z>` — no component prefix.

Skills live flat at `skills/<name>/` in this repo. Eleven in-repo skills ship as
`patinaproject-skills`: active skills `scaffold-repository`, `using-github`,
`new-branch`, `finish-pr`, `review-action`, `execute`, `office-hours`,
`plan-ceo-review`, `install-skills`, plus deprecated compatibility skills `superteam` and
`superteam-non-interactive`. All eleven are
versioned together as a single marketplace surface. On each release,
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
running, prefix with `npm_config_ignore_scripts=true`. Use `skills@latest` for install
and update examples so consumers get the current marketplace protocol.

**Standalone-skill resolution:** pass the marketplace repository as the source and the
skill name through `--skill`:

```sh
npx skills@latest add patinaproject/skills --skill scaffold-repository
```

Consumers wanting a pinned version keep the skill name separate from the repository ref:

```sh
npx skills@latest add patinaproject/skills#v1.0.0 --skill scaffold-repository
```

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
3. Auto-merge (`gh pr merge --auto --squash`) is enabled on each open release-please PR
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
npx skills@latest add patinaproject/skills#v1.0.0 --skill scaffold-repository
```

The `v<X.Y.Z>` ref selects the state of the entire repo at that tag. Because all eleven
skills live under `skills/<name>/SKILL.md` in the same repo, one tag pins the full set.
`skills-lock.json`'s `computedHash` records per-skill content provenance for reproducible
re-installs within a given tag.

## Invariants

- An untagged skill is not pinnable. The first `v<X.Y.Z>` tag is what introduces the repo
  to the install path with a pinnable `#<ref>`.
- In-repo skills (`scaffold-repository`, `using-github`, `new-branch`,
  `finish-pr`, `review-action`, `execute`, `office-hours`, `plan-ceo-review`,
  `install-skills`, plus
  deprecated `superteam` and `superteam-non-interactive`) are not separate release-please packages;
  they share the single root `patinaproject-skills` release and tag.
  Third-party skills such as `find-skills` are installed separately from their
  source repo's default branch or a specific `#<git-ref>`.
- `skills-lock.json` must be committed after any `npx skills@latest add` invocation. The lockfile
  records provenance for vercel-labs CLI-managed installs.

## CLI update policy

The vercel-labs CLI is referenced as `skills@latest` in routine documentation and
scaffolded repo commands. To update examples after a CLI behavior change:

1. Update command examples in `README.md`, `AGENTS.md`, and `docs/release-flow.md`.
2. Re-run `bash scripts/verify-dogfood.sh` — exits 0.
3. Run the [check-a local-path verification](../README.md#local-iteration) — exits 0.
4. Open a PR with the CLI policy update.

The CI local-path smoke checks also use `skills@latest` deliberately. They are a
compatibility canary for the current marketplace protocol, so a future upstream
CLI break may fail PR checks even when the branch did not change skill files. In
that case, confirm the break against the local-path commands, then update the
examples, scaffolded wrappers, or policy here in the same PR that restores CI.

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
2. Add the token as a repository secret named `RELEASE_PLEASE_TOKEN`.
3. Edit `.github/workflows/release-please.yml`: replace
   `token: ${{ github.token }}` with `token: ${{ secrets.RELEASE_PLEASE_TOKEN }}`.

Until that's done, release PRs need a manual `git commit --allow-empty` or
maintainer push to trigger checks. The first-release fix can be deferred until
that scenario actually occurs.
