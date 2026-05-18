<!-- Source: patinaproject/using-github @v2.0.0 -->

# using-github

One GitHub workflow skill for coding agents: file issues, edit issues, route
issue branches, write changelogs, and finish pull requests from repository
rules.

[![CI](https://github.com/patinaproject/using-github/actions/workflows/lint-md.yml/badge.svg)](https://github.com/patinaproject/using-github/actions/workflows/lint-md.yml)
[![Latest release](https://img.shields.io/github/v/release/patinaproject/using-github)](https://github.com/patinaproject/using-github/releases)
[![License](https://img.shields.io/github/license/patinaproject/using-github)](./LICENSE)

<!-- Hero asset: replace this comment with an <img src="docs/assets/hero.png" alt="using-github running in Claude Code" /> tag once docs/assets/hero.png lands. Tracked as a follow-up. -->

## What you get

- **`/using-github`** — The single supported entry point for GitHub work. It
  reads repository rules and routes issue, branch, PR, and changelog work to
  the right workflow.
- **`/new-branch`** — The issue branch setup path. It prepares a clean local
  branch from the repository default branch without pushing or installing.
- **`/finish-pr`** — The completed-work path. It verifies, publishes, opens or
  updates the PR, watches checks, handles existing feedback, and stops before
  merge.

## Install

Install just this skill via the [vercel-labs/skills](https://github.com/vercel-labs/skills) CLI:

```bash
npx skills@latest add patinaproject/skills --skill using-github
```

Or install the full `patinaproject-skills` plugin via your host's marketplace:

- Claude Code: `/plugin marketplace add patinaproject/skills` then `/plugin install patinaproject-skills@patinaproject-skills`
- Codex: `/marketplace add patinaproject/skills` then `/install patinaproject-skills`

See the [root README](../../README.md) for the full install guide.

## Quick start

Invoke the GitHub behavior guide from a target repository:

```text
/using-github

New issue: the homepage CTA button is broken.

Create a new branch then fix.
```

The guide applies the correct workflow for filing issues, routing branch setup
to `new-branch`, editing issues, writing changelogs, and routing completed work
to `finish-pr`.

## Breaking change

`using-github` replaces the former `github-flows` plugin identity. The issue and
changelog workflows remain under `using-github`; issue branch setup and PR
finishing are now first-class `new-branch` and `finish-pr` skills that
`using-github` routes to by default.

GitHub redirects old `patinaproject/github-flows` repository URLs after the
rename, but existing local checkouts should update their remotes:

```bash
git remote set-url origin git@github.com:patinaproject/using-github.git
```

## Development

This repository is the source for the plugin. Local workflow:

```bash
pnpm install           # installs dev deps and wires husky
pnpm lint:md           # markdownlint-cli2
pnpm check:versions    # enforce package.json ↔ plugin manifests lockstep
pnpm commitlint        # one-off commit-message validation
```

Commits and PR titles follow `type: #<issue> short description`.

Releases are driven by [release-please](https://github.com/googleapis/release-please) — merge the standing release PR to cut a new `vX.Y.Z`. See [`RELEASING.md`](./RELEASING.md).

## Related

- [Patina Project marketplace (`patinaproject/skills`)](https://github.com/patinaproject/skills)
- [Contributing](./CONTRIBUTING.md)
- [Security policy](./SECURITY.md)
- [Release process](./RELEASING.md)

## License

MIT — see [`LICENSE`](./LICENSE).
