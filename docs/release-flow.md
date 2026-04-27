# Plugin Release Flow

The Patina Project marketplace only publishes **tagged releases** (`vX.Y.Z`) of member plugins. The manifests in this repo never reference a branch — every plugin entry pins an explicit `ref`.

Current member plugins tracked by this flow:

- `patinaproject/bootstrap` — repo scaffolding skill. Also **consumed by this repo** (see [Consuming bootstrap](#consuming-bootstrap) below), so a bootstrap release both updates the marketplace entry and refreshes this repo's own scaffolding.
- `patinaproject/superteam` — issue-driven orchestration skill.
- `patinaproject/using-github` — agent ergonomics for GitHub workflows (`/edit-issue`, `/new-issue`, `/new-branch`).

## Lifecycle

1. A member plugin repo (for example `patinaproject/superteam`) uses `release-please` on its default branch. Merging the standing Release PR tags a new semver release and publishes a GitHub Release.
2. A workflow in that plugin repo fires a `repository_dispatch` into `patinaproject/skills` with event type `plugin-released` and payload `{ plugin, tag, repo }`.
3. [`.github/workflows/plugin-release-bump.yml`](../.github/workflows/plugin-release-bump.yml) receives the dispatch, updates both marketplace manifests, and opens a bot-generated bump PR titled `chore: bump <plugin> to <tag>`. These bot-generated `bot/bump-*` PRs are the only PRs that may omit an issue ID.
4. The workflow requests GitHub auto-merge for the trusted bump PR after it is
   created or updated. GitHub merges it only after required checks and branch
   protection requirements pass. The new version becomes the one users get on
   install.

New plugins are added by the same flow: the workflow inserts an entry if the plugin isn't already listed, so the first tagged release of a plugin is also what publishes it.

The release-bump PR workflow enables commit signing in `peter-evans/create-pull-request`, so commits are expected to be signed and verified as `github-actions[bot]` when the workflow uses the repository's default `GITHUB_TOKEN`. Do not switch this workflow to a PAT while expecting bot signature verification; PAT-created PRs are not the supported path for this signing mode.

The workflow also enables GitHub auto-merge for release-bump PRs that it creates
or updates from `bot/bump-*` branches. This uses
`gh pr merge --auto --squash` against the PR number returned by
`peter-evans/create-pull-request`; it does not use admin bypass and does not
merge unrelated PRs. If repository auto-merge is disabled, token permissions are
insufficient, required checks fail, or the PR contains unexpected changes,
maintainers should inspect the open PR and resolve the blocker manually.

## Required setup in each member plugin repo

Each plugin repo needs a workflow on `release: published` that fires the dispatch:

```yaml
name: Notify marketplace
on:
  release:
    types: [published]
permissions: {}
jobs:
  dispatch:
    runs-on: ubuntu-latest
    steps:
      - uses: peter-evans/repository-dispatch@v3
        with:
          token: ${{ secrets.MARKETPLACE_DISPATCH_TOKEN }}
          repository: patinaproject/skills
          event-type: plugin-released
          client-payload: |
            {
              "plugin": "${{ github.event.repository.name }}",
              "tag": "${{ github.event.release.tag_name }}",
              "repo": "${{ github.repository }}"
            }
```

`MARKETPLACE_DISPATCH_TOKEN` must be a PAT or GitHub App token with `repo` scope on `patinaproject/skills`.

## Manual fallback

If automation is down, a maintainer can run the workflow directly via **Actions → Plugin release bump → Run workflow**, supplying `plugin` and `tag` (and optionally `repo`). The workflow produces the same PR.

For a fully manual bump, edit `source.ref` for the plugin entry in both [.claude-plugin/marketplace.json](../.claude-plugin/marketplace.json) and [.agents/plugins/marketplace.json](../.agents/plugins/marketplace.json), then open a PR with `chore: #<issue> bump <plugin> to <tag>`.

## Consuming bootstrap

`patinaproject/skills` dogfoods `patinaproject/bootstrap`: the same tag that publishes bootstrap to the marketplace also drives an update of this repo's own scaffolding (commitlint config, husky hooks, issue templates, etc.). On a bootstrap release, the marketplace bump PR is opened as described above, and — in the same workflow run — the bootstrap skill is applied against this repo and any resulting scaffolding changes are committed to the same PR branch. Reviewing the PR therefore covers both the marketplace entry change and the scaffolding refresh in one place.

Other Patina Project repos that want to consume bootstrap this way should subscribe to its `repository_dispatch` the same way this repo does.

## Invariants

- Every plugin entry in both manifests has an explicit `ref` matching `vX.Y.Z`. Branches (`main`, `trunk`, etc.) are not allowed.
- An untagged plugin is not listed in the marketplace at all. The first tagged release is what introduces it.
