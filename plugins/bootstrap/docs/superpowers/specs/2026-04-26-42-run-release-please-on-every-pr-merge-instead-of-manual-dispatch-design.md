# Design: Run release-please on every PR merge instead of manual dispatch [#42](https://github.com/patinaproject/bootstrap/issues/42)

## Context

The `Release` workflow is currently triggered by `workflow_dispatch` plus `pull_request: closed` filtered to PRs carrying `autorelease: pending`. Cutting any release therefore requires a maintainer to manually dispatch the workflow at least once to refresh the standing release PR. release-please is idempotent – it updates an existing standing PR or opens one if absent – so the manual step adds friction with no offsetting safety benefit.

This design reverses the explicit choice in [#31](https://github.com/patinaproject/bootstrap/issues/31) (commit d6a370b), which removed `push` triggering to suppress noisy `Release` runs against unrelated merges. The trade-off is being re-evaluated: noise from idempotent no-op runs is acceptable; missed refreshes (because someone forgot to dispatch) are not.

## Decision

Trigger the `Release` workflow exclusively on `push: branches: [main]`. Drop both `workflow_dispatch` and the `pull_request: closed` + `autorelease: pending` branch.

Rationale: every merge to `main` (including the release-PR merge itself) is a push event. On a regular feature/fix merge, release-please refreshes the standing release PR. On the release-PR merge, the same `push` runs release-please, which observes the merged release PR with `autorelease: pending` and cuts the tag, publishes the GitHub Release, and (on `patinaproject` repos) dispatches the marketplace bump. A single trigger covers both flows; no per-event `if:` gating is required.

`on:` block:

```yaml
on:
  push:
    branches: [main]
```

The job-level `if:` filter is removed; the job runs on every triggering `push`.

This applies to the root mirror `.github/workflows/release.yml` and to the two templates under `skills/bootstrap/templates/{agent-plugin,patinaproject-supplement}/.github/workflows/release.yml`.

`RELEASING.md` (root + both template variants) must be rewritten to drop the manual-dispatch ritual and describe the new single-trigger auto-refresh + auto-tag flow.

The `notify-patinaproject-skills` job (patinaproject-supplement template + root mirror) is unchanged – it still gates on `release_created == 'true'` and `github.repository_owner == 'patinaproject'`.

## Requirements

- R1: `Release` workflow auto-runs on every push to `main` and refreshes the standing release PR.
- R2: `Release` workflow continues to auto-cut the tag and (on `patinaproject` repos) dispatch the marketplace bump when the standing release PR is squash-merged.
- R3: `workflow_dispatch` and `pull_request` triggers are removed from all three release workflow surfaces (root + two templates); the only trigger is `push: branches: [main]`.
- R4: `RELEASING.md` (root + both template variants) describes the new flow with no manual-dispatch instructions.
- R5: Baseline round-trip preserved – templates are edited first, root mirrors match templates exactly except for repo-specific differences already encoded in the supplement variant.

## Acceptance criteria

- AC-42-1: Given a regular feature/fix PR is squash-merged into `main`, when the resulting `push` event fires, then `Release` runs and `release-please` opens or refreshes the standing release PR with no manual intervention.
- AC-42-2: Given the standing release PR is squash-merged, when the resulting `push` event fires, then `Release` runs, the tag is cut, the GitHub Release is published, and (on `patinaproject` repos) the marketplace bump is dispatched – without a second trigger.
- AC-42-3: Given any of the three release workflow files is inspected, when the `on:` block is read, then it contains exactly `push` (branches: `main`) as the sole trigger, and contains no `workflow_dispatch` or `pull_request` entries.
- AC-42-4: Given a maintainer reads `RELEASING.md` (root and both template variants), when they look for the release flow, then it describes a single-trigger auto-refresh plus automatic tag-cut-on-merge with no manual-dispatch instructions remaining.

## Non-goals

- Marketplace-bump path on `patinaproject/skills`.
- Label flow (`autorelease: pending` / `autorelease: tagged`).
- release-please commit-type/semver behavior.
- The `notify-patinaproject-skills` job structure or its App-token plumbing.

## Risks

- Increased number of `Release` workflow runs: every merge to `main` triggers a run, even when no releasable commits are present. Mitigated by release-please being fast and idempotent on no-op runs.
