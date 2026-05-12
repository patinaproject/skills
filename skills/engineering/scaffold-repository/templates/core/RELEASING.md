# Releasing

Releases are driven by [release-please](https://github.com/googleapis/release-please) and Conventional Commits. No manual version bumps, no local release commands.

## How it works

The `Release` workflow runs on every push to `main`. Cutting a release is the natural by-product of merging PRs:

1. **Merge any PR into `main`.** The push event runs `Release`. `release-please` scans Conventional Commits since the last tag and opens – or updates – a standing **"chore: release X.Y.Z"** PR that:

   - Bumps `package.json` version.
   - Syncs `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` to the new version (configured in `release-please-config.json`).
   - Appends generated entries to `CHANGELOG.md`.

   Release-please attaches the `autorelease: pending` label to this PR. If there are no releasable commits since the last tag, the run no-ops.

2. **Merge the release PR.** Squash-merging the PR is itself a push to `main`, so `Release` runs again. release-please now sees the merged release PR (still labeled `autorelease: pending`), creates the tag `vX.Y.Z`, publishes the GitHub Release with the Conventional-Commit-derived notes, and (when configured) dispatches the marketplace bump. The PR's label flips to `autorelease: tagged`.

The result: every merge keeps the standing release PR fresh; merging that PR cuts the release. No manual step is required during the normal flow.

## Manual recovery dispatch

Manual dispatch is an escape hatch, not the normal release path. Use it only when the latest automatic `Release` run was skipped, cancelled, failed for transient reasons, or needs to be retried after permissions or repository settings were fixed.

Start the same workflow from the GitHub Actions UI, or run:

```bash
gh workflow run Release
```

The manual run performs the same release-please evaluation as a push-triggered run. If releasable commits exist, it opens or refreshes the standing release PR. If the release PR has already been merged and the repository state calls for a release, it can cut the tag and GitHub Release. If there is nothing to release, it no-ops.

Do not use manual dispatch as the ordinary release process. Do not perform manual version bumps or local release commands.

## Prerequisites (one-time settings)

### Workflow permissions: read and write

`release-please` writes to the repo – it creates tags, publishes GitHub Releases via `POST /repos/.../releases`, relabels the release PR (`autorelease: pending` → `autorelease: tagged`), and comments on issues referenced in the changelog. The full canonical [permissions set from the release-please-action README](https://github.com/googleapis/release-please-action#workflow-permissions) is three scopes:

```yaml
permissions:
  contents: write
  issues: write
  pull-requests: write
```

`issues: write` is easy to miss – PR labels live on the Issues API, so relabeling the release PR needs it even though the target is a PR. Omitting any of the three causes `release-please-action` to fail with `Resource not accessible by integration` on the release step, regardless of how `contents: write` is declared elsewhere. The repo-level default of `read` additionally caps the workflow-level declarations, so both the repo toggle and the workflow YAML must agree.

Enable the read + write default:

- **Settings → Actions → General → Workflow permissions → Read and write permissions** (save).

Verify from the CLI:

```bash
gh api repos/<owner>/<repo>/actions/permissions/workflow \
  --jq .default_workflow_permissions
```

Expected output: `write`. If it prints `read`, the toggle did not stick (see "Recognizing an org-policy cap" below).

### Allow Actions to create and approve pull requests

`release-please` opens its standing release PR using `secrets.GITHUB_TOKEN`. This requires:

- **Settings → Actions → General → Workflow permissions → Allow GitHub Actions to create and approve pull requests**.

Without it, the workflow fails with `GitHub Actions is not permitted to create or approve pull requests.`

### Recognizing an org-policy cap

If either of the two checkboxes above is greyed out, or if the `gh api` verification above still returns `read` after you saved the UI toggle, the setting is being overridden by an organization-level policy. Org-level `Settings → Actions → General → Workflow permissions` takes precedence over repo-level defaults: when the org policy caps repo defaults at `read`, no repo-level change will take effect. Escalate to an org admin, or fall back to a PAT/App token (next section).

### PAT / GitHub App token fallback

Use this path when org policy caps repo-level workflow permissions below read + write, and raising the org policy is not possible.

Required token scopes:

- `contents: write` – to create tags and publish releases.
- `issues: write` – to relabel the release PR (PR labels are on the Issues API) and to comment on issues referenced in the changelog.
- `pull-requests: write` – to open and update the standing release PR.

A fine-grained PAT or a GitHub App installation token both work. Store it as an **org-level secret** (preferred, so every plugin repo inherits it) or a **repo-level secret**. Suggested name: `RELEASE_PLEASE_TOKEN`.

Wire it into `.github/workflows/release.yml` by replacing the `token:` input on the `release-please-action` step:

```yaml
# Before (default path, works when repo/org allows read + write):
          token: ${{ secrets.GITHUB_TOKEN }}
# After (fallback when org policy caps the default):
          token: ${{ secrets.RELEASE_PLEASE_TOKEN }}
```

The default code path stays `secrets.GITHUB_TOKEN` in the emitted template so forks outside Patina Project don't need to provision a Patina Project-specific secret.

### Tag ruleset caution

`release-please-action` creates **unsigned** tags. It has no signing path. If a repository or organization adds a tag-scoped ruleset that requires signatures on release tags, the release step will fail the moment release-please tries to push `vX.Y.Z`.

If signature enforcement is desired:

- Scope the signature rule to **branches only** (most common).
- Or scope to specific **non-release tag refs** (e.g. a pattern that excludes `v*`).

Verify no release-tag-scoped signature rule is in place:

```bash
gh api repos/<owner>/<repo>/rulesets \
  --jq '.[] | select(.target=="tag")'
```

### Require SHA-pinned actions

Also recommended (defense-in-depth, aligns with the SHA-pin convention in [`AGENTS.md`](AGENTS.md)):

- **Settings → Actions → General → Require actions to be pinned to a full-length commit SHA** (available at repo or org level).

When enabled, GitHub refuses to run workflows that `uses:` an action by tag or branch.

## Semver decision

Determined from releasable Conventional Commit types – no human choice:

- `fix:` → patch
- `feat:` → minor
- `<type>!:` or `BREAKING CHANGE:` footer → major
- `docs:`, `chore:`, and other non-releasable types → no version bump under this baseline

If a change should produce a release, do not use a non-bumping type. For example, a Markdown-only edit to `skills/**/SKILL.md` that changes installed skill behavior should use `feat:` or `fix:`, not `docs:`.

Mistyped commits silently suppress releases. See [`AGENTS.md` "Commit type selection"](AGENTS.md#commit-type-selection) for the path-first rule and the full rationalization table.

## Keeping versions aligned between releases

`package.json` is the canonical source. `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` are kept in lockstep.

- `scripts/check-plugin-versions.mjs` is run by the husky `pre-commit` hook and by CI, blocking drift.
- `scripts/sync-plugin-versions.mjs` force-rewrites the plugin manifests from `package.json` if needed.

`CHANGELOG.md` is owned by release-please. Do not hand-edit released sections.

`CHANGELOG.md` is excluded from `pnpm lint:md` (see the `#CHANGELOG.md` glob in `package.json`). release-please emits double blank lines between sections, which violates `MD012/no-multiple-blanks`, and its generator has no knob to change that. Fighting the generator is not worth the churn – the released sections are machine-written and not meant to be hand-edited, so linting them adds no value.

## Distribution via `patinaproject/skills`

When a release is published **and the repository owner is `patinaproject`**, the release workflow automatically dispatches `plugin-release-bump.yml` on `patinaproject/skills`. That marketplace repo opens (or updates) a PR bumping this plugin's pinned `ref` across every Patina Project marketplace manifest.

No per-repo opt-in is required – the `github.repository_owner == 'patinaproject'` check on the `notify-patinaproject-skills` job gates this behavior. Forks in other orgs skip the job entirely and don't need any of the setup below.

Prerequisites (org-level, one-time, already configured for `patinaproject`):

- A GitHub App owned by `patinaproject` named `patina-project-automation`, with **Actions: Read and write** permission, installed on `patinaproject/skills` only.
- Two org secrets exposing the App's identity to every plugin repo:
  - `PATINAPROJECT_AUTOMATION_APP_ID` – the App ID (small integer, not sensitive).
  - `PATINAPROJECT_AUTOMATION_PRIVATE_KEY` – the App's private key (PEM-encoded; sensitive).

The release workflow uses [`actions/create-github-app-token`](https://github.com/actions/create-github-app-token) to mint a per-job installation token from the App credentials, then passes that token to `benc-uk/workflow-dispatch` to fire `plugin-release-bump.yml` on `patinaproject/skills`.

Why an org-owned App rather than a personal access token: the App identity isn't tied to any individual user, survives organizational turnover, surfaces as `patina-project-automation[bot]` in audit logs, and scopes its capabilities to one repo with one permission. Rotation is "regenerate App key", not "regenerate user PAT."

If either secret is missing on a `patinaproject` plugin repo, the `Mint patina-project-automation App token` step will fail and the `notify-patinaproject-skills` job will surface that failure on the run page. The release itself (the `release-please` job) still completes regardless. To unblock, ensure both org secrets are set; or fire the marketplace bump manually with `gh workflow run plugin-release-bump.yml --repo patinaproject/skills -f plugin=<repo> -f tag=<tag>`.

## Writing commits for a clean changelog

- Use Conventional Commits: `feat: #<issue> …`, `fix: #<issue> …`, etc.
- Choose release-triggering types for product changes. Release Please can no-op when product changes are misclassified as `docs:` or `chore:`, which can skip downstream marketplace bump automation.
- Breaking changes: prefix the type with `!` (e.g. `feat!: #123 rename foo to bar`) **and** include a `BREAKING CHANGE: …` footer in the PR body.
- Squash-merge flow: PR titles must themselves be conventional-commit-shaped so the squash commit lands with the correct type/scope. Enforced by the `Lint PR` workflow.
