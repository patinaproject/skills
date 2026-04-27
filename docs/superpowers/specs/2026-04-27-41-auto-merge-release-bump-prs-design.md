# Auto-Merge Release Bump PRs

## Problem

The plugin release-bump workflow opens narrow bot-generated PRs after tagged
member-plugin releases, but those PRs still require a maintainer to merge them
after checks pass. That manual step slows marketplace propagation even when the
PR only updates pinned marketplace refs and generated bootstrap scaffolding.

## Goals

- Enable auto-merge for trusted release-bump PRs produced by the existing
  plugin release-bump workflow.
- Keep auto-merge constrained to bot-generated `bot/bump-*` PRs that the
  workflow just created or updated.
- Re-enable auto-merge when the workflow updates an existing bump PR, so the
  release propagation path remains automatic after reruns or superseding bumps.
- Include bootstrap release-bump PRs in the auto-merge path, including any
  workflow-generated scaffold refreshes that land in those PRs.
- Preserve branch protection and required checks; automation must request
  auto-merge, not bypass checks.
- Fail with a clear, actionable workflow error if GitHub cannot enable
  auto-merge, such as when repository-level auto-merge is disabled or token
  permissions are insufficient.
- Document the release flow so maintainers understand when bump PRs merge
  automatically and when they remain open.

## Non-Goals

- Auto-merge contributor PRs, arbitrary bot PRs, or PRs from untrusted branches.
- Add admin bypass behavior or weaken branch protection.
- Replace the existing `peter-evans/create-pull-request` release-bump PR
  creation flow.
- Configure repository settings outside this repository, such as enabling
  repository-level auto-merge or changing required status checks.

## Acceptance Criteria

### AC-41-1

Given a bot-generated release bump PR from a `bot/bump-*` branch, when all
required checks and branch protection requirements pass, then the PR is
automatically merged.

### AC-41-2

Given a release bump PR has failing or pending required checks, when the
auto-merge path evaluates it, then the PR remains open until the checks pass.

### AC-41-3

Given a non-bump PR or a PR from an untrusted branch, when the auto-merge path
evaluates it, then it is not automatically merged.

### AC-41-4

Given auto-merge is configured, when maintainers inspect the release flow
documentation, then it documents the constraints and expected behavior.

## Design

Use GitHub's native pull request auto-merge through the GitHub CLI after
`peter-evans/create-pull-request` finishes. The create-pull-request step should
gain an `id`, and a following workflow step should run only when that action
reports a PR was `created` or `updated`. The auto-merge step should call
`gh pr merge <number> --auto --squash` using the action's
`pull-request-number` output.

This keeps trust boundaries simple. The workflow itself already controls the
branch name with `branch: bot/bump-${{ steps.inputs.outputs.plugin }}-${{
steps.inputs.outputs.tag }}` and only runs from the release-bump events. By
keying auto-merge to the PR output from that same step, the workflow avoids
searching for or modifying unrelated PRs. If the create-pull-request action
finds no PR work to do, the auto-merge step is skipped.

The merge method should be squash merge to match the repository's
squash-and-merge conventions and PR-title-driven commit format. The command must
not use `--admin`, because the desired behavior is to queue GitHub's regular
auto-merge path behind required checks and branch protection. If checks are
pending, GitHub CLI enables auto-merge for later completion; if checks fail,
GitHub leaves the PR open.

The auto-merge step should be intentionally loud on setup failures. If the
repository has not enabled auto-merge, or if the default workflow token cannot
enable auto-merge for the PR, the step should fail after the bump PR exists. The
failure is useful because it tells maintainers that repository settings or token
permissions must be corrected; silently continuing would leave the release flow
looking automated while still requiring manual merges.

The workflow should enable auto-merge for both newly created and updated bump
PRs. If a maintainer manually disables auto-merge on an existing bump PR, a later
workflow update may re-enable it. That is intentional for this issue because the
trusted `bot/bump-*` branch remains owned by the release-bump workflow, and the
desired release path is automatic whenever checks pass. Manual intervention
remains available by closing the PR, fixing the workflow, or changing branch
protection rather than relying on a disabled auto-merge toggle as persistent
state.

Bootstrap bump PRs are included in the same behavior. They can eventually carry
both marketplace ref changes and bootstrap scaffolding refreshes, but the trust
boundary is still the same release-bump workflow and protected-branch check set.
If bootstrap-generated scaffold changes become too broad for automatic release
propagation, that should be handled by a separate policy issue rather than a
hidden carve-out in this implementation.

The release-flow documentation should update the lifecycle step that currently
says a maintainer reviews and merges the PR. It should instead say the workflow
requests auto-merge for trusted bump PRs, while maintainers still inspect PRs
that fail checks, cannot enable auto-merge, or include unexpected changes.

## Alternatives Considered

1. **Enable auto-merge with `gh pr merge --auto --squash` in the existing
   workflow**: recommended. It is small, uses GitHub's native protected-branch
   behavior, and can be tightly scoped to the PR just created or updated.
2. **Add a separate workflow that reacts to pull request events**: rejected for
   this issue. It would need additional branch, actor, and payload filtering to
   avoid touching unrelated PRs, while the existing workflow already has the
   trusted PR number in hand.
3. **Use admin merge or a privileged token to merge immediately**: rejected. The
   issue asks for auto-merge after checks pass, not a bypass of branch
   protection.

## Verification

- Run `pnpm lint:md`.
- Run or inspect the workflow with `actionlint` if available.
- Inspect `.github/workflows/plugin-release-bump.yml` to confirm auto-merge is
  gated on `pull-request-operation` being `created` or `updated` and uses the
  `pull-request-number` output.
- Inspect the workflow to confirm it does not use `--admin`, does not suppress
  `gh pr merge` failures, and therefore surfaces missing auto-merge settings or
  token-permission problems.
- Inspect `docs/release-flow.md` to confirm the release lifecycle documents the
  auto-merge constraints and maintainer fallback path.
