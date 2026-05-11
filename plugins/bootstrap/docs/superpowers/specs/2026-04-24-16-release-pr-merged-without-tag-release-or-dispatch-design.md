# Design: v1.0.0 release PR merged but no tag, release, or marketplace dispatch occurred [#16](https://github.com/patinaproject/bootstrap/issues/16)

## Context

Merging release-please's standing release PR is supposed to produce a `vX.Y.Z` tag, a published GitHub Release, and a marketplace dispatch on `patinaproject/skills`. On 2026-04-24, PR [#9](https://github.com/patinaproject/bootstrap/pull/9) ("chore: release 1.0.0") merged into `main` but none of that happened.

Root cause: `.github/workflows/release.yml` listens only on `workflow_dispatch`. release-please needs a *second* workflow run after the release PR merges – that run is what sees the release commit on `main` and creates the tag + release. Without a `push` trigger, the second run never fires automatically, and `RELEASING.md` step 4 reinforces the wrong mental model by saying "Clicking Merge on that PR is the release action."

PR #4 / [#6](https://github.com/patinaproject/bootstrap/pull/6) introduced the dispatch-only trigger to avoid an earlier failure – GitHub Actions lacked permission to create PRs. That failure is now addressed by the `RELEASING.md` Prerequisites section (the org-level "Allow Actions to create pull requests" toggle and `PATINA_SKILLS_DISPATCH_TOKEN`). The dispatch-only constraint no longer serves its original purpose.

## Goals

- Restore the documented "merge = release" flow so that merging the release-please PR produces a tag, Release, and marketplace dispatch without a second manual action.
- Keep the behavior consistent between the root repo, its `RELEASING.md`, and the bootstrap-emitted templates so scaffolded repos do not inherit this gap.
- Unblock the stuck `v1.0.0` release.

## Non-goals

- Redesigning release-please configuration (`release-please-config.json`, manifest).
- Changing SemVer rules or changelog conventions.
- Changing the marketplace bump protocol on `patinaproject/skills`.
- Replacing release-please with an alternative releaser.

## Fix direction

**Recommended: option (a) – add `push: branches: [main]` alongside `workflow_dispatch`.**

```yaml
on:
  push:
    branches: [main]
  workflow_dispatch:
```

Rationale:

- release-please is idempotent. On non-release commits it is a no-op (no release PR update needed, or just a PR update). Only release commits produce `release_created == 'true'`, and the `notify-patinaproject-skills` job is already gated on that output. So a `push` trigger does not turn every merge to `main` into a release – it turns only release-producing commits into releases, which is the documented intent.
- The original reason to go dispatch-only (#4 / #6) was a permissions failure when Actions could not create PRs. That failure is resolved structurally by the `RELEASING.md` Prerequisites (org-level workflow permissions + org secret). The dispatch-only constraint outlived its cause.
- Operator ergonomics: the merge button is the natural "ship it" signal. Requiring a post-merge dispatch adds an undocumented step that is easy to miss (as #9 demonstrates) and hard to monitor for – there is no natural alert when the second dispatch is forgotten.
- `RELEASING.md` step 4 already promises this behavior. Aligning code with docs is cheaper than editing docs to describe a two-step ritual.
- Keeping `workflow_dispatch` alongside `push` preserves the manual escape hatch (e.g. to retry after a transient failure, or to seed the first release PR without waiting for the next push to `main`).

Option (b) – keep dispatch-only and document the two-step ritual – is rejected because it hard-codes the footgun. Even with a comment-bot reminder, a reminder that can be dismissed is a weaker guarantee than making the correct behavior the default. The "merge = release" mental model is well-understood and matches release-please's own docs.

## Stuck-state recovery for v1.0.0

Recovery is **in scope for this PR as a documented, manual operator runbook** – not as automation. The steps only need to run once, and writing tooling to re-run a one-shot history rewrite is not worth the surface area. The runbook ships in the PR description (under `Validation`) and the operator performs it after the workflow fix merges.

Recovery steps (to be executed by a maintainer with push / release permissions, after the fix merges):

1. On `main`, confirm the tip commit includes the release-please release commit of #9 (`270d51afe48e52dcf3672b7a03e67b7203e19f7a`).
2. Create and push the tag:
   - `git tag -a v1.0.0 270d51afe48e52dcf3672b7a03e67b7203e19f7a -m "v1.0.0"`
   - `git push origin v1.0.0`
3. Publish the GitHub Release for `v1.0.0` on that tag, with notes generated from the `CHANGELOG.md` entries for 1.0.0 (or via `gh release create v1.0.0 --generate-notes --target 270d51afe48e52dcf3672b7a03e67b7203e19f7a`).
4. Dispatch the marketplace bump manually:
   - From `patinaproject/skills` Actions → `bump-plugin-tags.yml` → Run workflow, with inputs `plugin=bootstrap`, `tag=v1.0.0`.
5. Verify:
   - `gh release view v1.0.0 -R patinaproject/bootstrap` shows the release.
   - `gh run list --workflow=bump-plugin-tags.yml -R patinaproject/skills` shows a new run with the `bootstrap` / `v1.0.0` inputs.
   - The resulting PR on `patinaproject/skills` bumps `bootstrap`'s pinned ref to `v1.0.0` across marketplace manifests.

This recovery happens **after** the workflow-trigger change lands so that future releases do not recreate the stuck state. Once recovered, the next release-please PR to merge exercises the restored `push`-triggered path end-to-end and confirms the fix.

## Doc alignment

`RELEASING.md` step 4 already reads "Clicking Merge on that PR is the release action." With option (a) that statement becomes true again. The supporting step 1 text currently says "A maintainer manually triggers the `Release` workflow from **Actions → Release → Run workflow** on `main`. The workflow does not run on pushes." That must be rewritten so the dominant flow is push-driven and the manual dispatch becomes an explicit escape hatch for the first release or for recovery.

Required edits:

- Rewrite step 1 to describe the push-triggered run and call out `workflow_dispatch` only as a manual re-run / bootstrap-first-release path.
- Leave step 4 as-is (it becomes accurate again under option (a)).
- No changes needed to Prerequisites, SemVer, version-alignment, distribution, or commit-writing sections.

## Template alignment

Two workflow templates and one doc template are affected:

- `skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml`
- `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml`
- `skills/bootstrap/templates/core/RELEASING.md`

All three must match the chosen direction so scaffolded repos do not inherit the bug. The two workflow YAML files currently mirror the root's `on: workflow_dispatch` and are updated to add `push: branches: [main]`. The templated `RELEASING.md` mirrors the root doc and is updated in lockstep.

Scope check: `grep -R` on the templates tree should find no other release-trigger references. The design assumes the three files above are exhaustive; the implementation plan verifies that before editing.

## Guardrails against regression

Keep this lightweight. The single guardrail is a short inline comment above the `on:` block in each `release.yml` (root + both templates) that documents **why both triggers are present**:

```yaml
# release-please requires a run on push to main to cut the tag after
# the release PR merges. workflow_dispatch is kept as a manual escape hatch.
on:
  push:
    branches: [main]
  workflow_dispatch:
```

No bot, no CI check, no custom tooling. A comment that survives file edits is enough to deter a future contributor from "cleaning up" the push trigger. If the gap recurs, a proper CI check can be added then – speculative tooling is out of scope for this fix.

## Acceptance criteria

### AC-16-1

`.github/workflows/release.yml` triggers on both `push: branches: [main]` and `workflow_dispatch`, with an explanatory comment above `on:`.

- Manual test: `grep -A5 '^on:' .github/workflows/release.yml` shows both triggers and the comment explaining why.
- Manual test: `actionlint` (or `pnpm lint:md` for whole-repo sanity) reports no new findings.

### AC-16-2

`skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml` matches the root workflow's trigger block (both `push` + `workflow_dispatch`, same explanatory comment).

- Manual test: `diff <(sed -n '/^on:/,/^$/p' .github/workflows/release.yml) <(sed -n '/^on:/,/^$/p' skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml)` shows no drift in the trigger section.

### AC-16-3

`skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml` matches the root workflow's trigger block.

- Manual test: same `diff` as AC-16-2 against the supplement template.

### AC-16-4

`RELEASING.md` step 1 describes the `push`-triggered flow, and keeps `workflow_dispatch` described only as an explicit manual re-run / first-release path. Step 4 ("Clicking Merge on that PR is the release action") remains and is now accurate.

- Manual test: `sed -n '5,15p' RELEASING.md` shows step 1 framed around the merge trigger and step 4 unchanged.

### AC-16-5

`skills/bootstrap/templates/core/RELEASING.md` mirrors the root `RELEASING.md` edits from AC-16-4 so scaffolded repos inherit consistent docs.

- Manual test: `diff RELEASING.md skills/bootstrap/templates/core/RELEASING.md` shows only the expected repo-specific deltas (the org-callout paragraph in step 2 of the root doc), and none in the "How it works" section.

### AC-16-6

Stuck-state recovery runbook for `v1.0.0` is included in the PR body under `Validation` with the exact commands for tag creation, GitHub Release publish, and marketplace dispatch. Executing the runbook is not automated; a maintainer runs it after merge.

- Manual test: the PR body contains the runbook commands verbatim from this design's "Stuck-state recovery for v1.0.0" section.
- Manual test (post-merge, by maintainer): `gh release view v1.0.0 -R patinaproject/bootstrap` returns the release; `gh run list --workflow=bump-plugin-tags.yml -R patinaproject/skills -L 3` shows a run with `plugin=bootstrap`, `tag=v1.0.0`.

## Risks and mitigations

- **Risk:** a non-release `push` to `main` runs the release workflow unnecessarily.
  **Mitigation:** release-please short-circuits cheaply (it only reads recent commits and updates/opens the standing release PR). The `notify-patinaproject-skills` job is already gated on `release_created == 'true'`. Cost is one ~30s Actions run per merge; acceptable.
- **Risk:** a future breakage of org-level "Allow Actions to create PRs" silently disables the release PR again, the same way #4 surfaced originally.
  **Mitigation:** outside this issue's scope. `RELEASING.md` Prerequisites already documents the toggle. A separate follow-up could add a smoke-test that release-please can open a PR, but is explicitly out of scope here.
- **Risk:** a scaffolded repo on a fork (`github.repository_owner != 'patinaproject'`) runs the push-triggered workflow without `PATINA_SKILLS_DISPATCH_TOKEN`.
  **Mitigation:** the existing `github.repository_owner == 'patinaproject'` gate (and the `release_created` gate) already short-circuit the notify job on forks; no new behavior here.

## Out of scope

- Changes to `release-please-config.json` or `.release-please-manifest.json`.
- Adding a reminder bot, status check, or other automation to warn if future edits revert `push:`.
- Adding tests to validate that release-please can open a PR from GitHub's side.
- Rewriting the marketplace dispatch protocol on `patinaproject/skills`.
