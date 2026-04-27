# Sign Automation Commits for Release Bump PRs

## Problem

The plugin release-bump workflow opens automated marketplace PRs by committing
manifest updates through `peter-evans/create-pull-request`. The action is pinned
to `v6.1.0`, and the workflow does not request signed commits. If Patina Project
enables or inherits a branch protection rule that requires signed commits, these
automation-created PR branches may fail mergeability checks or require manual
repair.

## Goals

- Make release-bump workflow commits signed and verified when created with
  supported bot-generated credentials.
- Preserve the repository rule that every GitHub Action is pinned to a full
  40-character commit SHA with a nearby version comment.
- Document the token behavior clearly enough that maintainers do not
  accidentally switch the workflow to an unsigned PAT path while expecting
  verified bot commits.

## Non-Goals

- Introduce a new release-bump workflow or change the marketplace manifest update
  logic.
- Configure repository or organization branch protection settings.
- Add custom GPG signing keys or repository secrets.

## Acceptance Criteria

### AC-29-1

`.github/workflows/plugin-release-bump.yml` uses a version of
`peter-evans/create-pull-request` that supports `sign-commits`, pins the action
to a full 40-character SHA, and keeps the version comment aligned with that SHA.

### AC-29-2

The release-bump PR creation step sets `sign-commits: true` without adding custom
`author` or `committer` inputs that would conflict with bot signature behavior.

### AC-29-3

`docs/release-flow.md` documents that release-bump commits are expected to be
signed by `github-actions[bot]` when the workflow uses the default
`GITHUB_TOKEN`, and notes that PAT-created PRs are not the expected path for bot
commit signature verification.

### AC-29-4

Validation covers the workflow and documentation changes with repository-local
checks, including Markdown linting and inspection of the pinned action reference.

## Design

Use the action's built-in bot commit signing rather than introducing custom GPG
key management. The current workflow already uses the default token implicitly,
which is the simplest supported credential path for signing as
`github-actions[bot]`. The implementation should update only the
`peter-evans/create-pull-request` action reference and its inputs:

- bump from the current pinned `v6.1.0` SHA to a current pinned release that
  includes `sign-commits`;
- add `sign-commits: true` under the existing `with:` block;
- avoid setting `author` or `committer`, because the action ignores those inputs
  when bot signing is enabled and custom identity settings would make the
  intended signing behavior less obvious.

The release-flow documentation should gain a short note in the automation
lifecycle or setup area. The note should explain what is guaranteed by the
workflow configuration, and what is not: supported bot-generated tokens can
produce verified bot signatures, while PATs are not the intended token type for
this feature.

## Alternatives Considered

1. **Built-in bot signing on `create-pull-request`**: recommended. It keeps the
   workflow small, avoids secret management, and matches the existing default
   token flow.
2. **Custom GPG signing with a PAT-backed bot account**: rejected for this issue.
   It requires private key storage and additional secret rotation policy for a
   workflow that can use platform-managed bot signing.
3. **Leave automation unsigned**: rejected. It keeps today's behavior but does
   not satisfy the issue goal or prepare the repo for signed-commit branch
   protection.

## Verification

- Run `pnpm lint:md`.
- Inspect `.github/workflows/plugin-release-bump.yml` to confirm the action
  reference is a full 40-character SHA with the correct version comment.
- Inspect the PR creation step to confirm `sign-commits: true` is present and no
  custom `author` or `committer` inputs were added.
