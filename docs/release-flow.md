# Skill Release Flow

The Patina Project skills repo releases via `release-please` with a single root package
(`release-type: simple`). Tag form: `v<X.Y.Z>` — no component prefix.

General skills live at `skills/<name>/`. Engineering skills live at
`plugins/engineering/skills/<name>/`. Both Patina plugins are versioned together
as one marketplace release. On each release,
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
and copy the selected skill directory into the agent's skill directory. No
build step is required.

## Lifecycle

1. A contributor opens a PR against `main` with changes under `skills/<name>/`
   or `plugins/<plugin>/skills/<name>/`. The PR merges via squash merge.
2. `release-please` (`.github/workflows/release-please.yml`) runs on every push to `main`
   and maintains a standing Release PR for the root package. When a Release PR is merged,
   release-please:
   - Tags the commit with `v<X.Y.Z>` (e.g. `v1.1.0`).
   - Publishes a GitHub Release.
   - Updates the root `CHANGELOG.md`.
3. Auto-merge (`gh pr merge --auto --squash`) is enabled on each open release-please PR
   after required checks pass.

Bot-generated release-please PRs from `release-please--*` branches are the only
PRs that may omit a GitHub issue reference in the commit subject.

## Tag shape

`release-please` emits a single root tag per release:

- `v1.0.0` (initial release)
- `v1.1.0` (minor bump from `feat:` commits)
- `v1.0.1` (patch bump from `fix:` commits)

The vercel-labs CLI consumer pins a specific tag via `#<git-ref>`:

```sh
npx skills@latest add patinaproject/skills#v1.0.0 --skill scaffold-repository
```

The `v<X.Y.Z>` ref selects the state of the entire repo at that tag. One tag
pins every Patina plugin and skill in the repository.
`skills-lock.json`'s `computedHash` records per-skill content provenance for reproducible
re-installs within a given tag.

### Historical tag migration

Releases through `2.20.0` were published as immutable GitHub Releases with
`patinaproject-skills-v<X.Y.Z>` tags. Keep those Releases and tags intact: their URLs,
publication dates, and attestations are historical release records. Each historical tag
also has a lightweight `v<X.Y.Z>` alias at the exact same commit. The unprefixed alias is
the canonical consumer pin; the prefixed tag remains a compatibility ref.

Do not move or delete either form of a historical tag, and do not create duplicate GitHub
Releases for the aliases. New releases use only the unprefixed form. During the one-time
migration, `bootstrap-sha` in `release-please-config.json` points to the commit recorded by
the last prefixed release so release-please does not reconsider commits already included
in the changelog. See
[ADR-293](adr/ADR-293-preserve-immutable-release-history-with-alias-tags.md).

## Invariants

- An untagged skill is not pinnable. The first `v<X.Y.Z>` tag is what introduces the repo
  to the install path with a pinnable `#<ref>`.
- In-repo plugins are not separate release-please packages. They share the
  single root release and tag.
  Third-party skills such as `find-skills` are installed separately from their
  source repo's default branch or a specific `#<git-ref>`.
- `skills-lock.json` must be committed after any `npx skills@latest add` invocation. The lockfile
  records provenance for vercel-labs CLI-managed installs.

## CLI update policy

The vercel-labs CLI is referenced as `skills@latest` in routine documentation and
scaffolded repo commands. To update examples after a CLI behavior change:

1. Update command examples in `README.md`, `AGENTS.md`, and `docs/release-flow.md`.
2. Re-run `bash scripts/tests/dogfood.test.sh` — exits 0.
3. Run the [check-a local-path verification](../README.md#local-iteration) — exits 0.
4. Open a PR with the CLI policy update.

The CI local-path smoke checks also use `skills@latest` deliberately. They are a
compatibility canary for the current marketplace protocol, so a future upstream
CLI break may fail PR checks even when the branch did not change skill files. In
that case, confirm the break against the local-path commands, then update the
examples, scaffolded wrappers, or policy here in the same PR that restores CI.

## Token setup (required)

`release-please.yml` authors its PRs with `token: ${{ secrets.RELEASE_PLEASE_TOKEN }}`.
This is required, not optional: the default `GITHUB_TOKEN` has a known GitHub
limitation:

> PRs created with `GITHUB_TOKEN` do not trigger subsequent workflow runs.

The repo's required PR checks (`lint`, `markdown`, `verify`, etc.) therefore
would NOT run on release PRs authored by `GITHUB_TOKEN`, and the auto-merge job
would wait indefinitely. GitHub has no per-actor trust allowlist that would let
you exempt `github-actions[bot]` from the workflow-approval gate, so the PRs
must be authored by a non-`GITHUB_TOKEN` identity.

There is deliberately no fallback to `GITHUB_TOKEN`. The workflow asserts the
secret in a `Require RELEASE_PLEASE_TOKEN` step and fails the run with a clear
error if it is missing, rather than silently degrading to the broken path.

Configure it once:

1. Create a GitHub App (preferred over a PAT, since it is not tied to a person)
   with these permissions, then install it on this repository and generate a
   token:
   - `contents: write` — to push tags
   - `pull-requests: write` — to open and update release PRs
   - `issues: write` — to manage `autorelease:*` labels
2. Add the token as a repository secret named `RELEASE_PLEASE_TOKEN`.

Once the secret exists, release PRs are authored by the App identity, their
required checks run automatically, and auto-merge proceeds once they pass.
