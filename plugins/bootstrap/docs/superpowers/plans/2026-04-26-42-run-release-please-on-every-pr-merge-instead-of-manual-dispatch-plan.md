# Plan: Run release-please on every PR merge instead of manual dispatch [#42](https://github.com/patinaproject/bootstrap/issues/42)

Implements the design at [`docs/superpowers/specs/2026-04-26-42-run-release-please-on-every-pr-merge-instead-of-manual-dispatch-design.md`](../specs/2026-04-26-42-run-release-please-on-every-pr-merge-instead-of-manual-dispatch-design.md) (commit `40fb42fe37ec80775188811edb7d5e06c2a64d73`).

## Files to change

Workflow YAML (3 files):

1. `skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml` (base template)
2. `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml` (supplement, adds `notify-patinaproject-skills`)
3. `.github/workflows/release.yml` (root mirror; matches the supplement variant)

Docs (3 files):

1. `skills/bootstrap/templates/core/RELEASING.md` (base template)
2. `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md` (supplement variant)
3. `RELEASING.md` (root mirror; matches the supplement variant)

Per `AGENTS.md`, edit templates first, then mirror to root. Both sides of the loop ship in this PR.

## Workstreams

### W1 – Workflow YAML changes (T1, T2, T3 → release.yml × 3)

For all three release.yml files apply the same shape:

- Replace `on:` block with:

  ```yaml
  on:
    push:
      branches: [main]
  ```

- Remove the job-level `if:` filter on `release-please`. The job runs on every push to `main`.
- Update the leading comment (currently describes `workflow_dispatch` + `pull_request: closed` semantics) to describe push-only semantics: every push to `main` runs release-please; release-please refreshes the standing release PR on regular merges and cuts the tag when it sees the merged release PR.
- Leave `permissions:` blocks, the `release-please-action` step, and (in the supplement + root) the `notify-patinaproject-skills` job untouched.

### W2 – RELEASING.md changes (T4, T5, T6 → RELEASING.md × 3)

For all three RELEASING.md files:

- Rewrite the "How it works" section to describe a single trigger:
  - Every push to `main` (including PR merges) runs `Release`.
  - On regular feature/fix merges, release-please refreshes the standing `chore: release X.Y.Z` PR.
  - On the release-PR merge, the same push event causes release-please to cut the tag, publish the GitHub Release, and (where applicable) dispatch the marketplace bump.
- Remove all manual-dispatch instructions: the "Trigger the workflow via Actions → Release → Run workflow" step disappears; the two-step ritual collapses into "merge regular PRs as usual; merge the release PR when ready."
- Keep the prerequisite sections (workflow permissions, Allow Actions to create PRs, org-policy cap, PAT/App fallback, tag ruleset caution, SHA pinning) untouched – they are unrelated to the trigger surface.
- Keep the supplement-only and core-only paragraphs preserved as today (only the "How it works" prose changes; the marketplace-bump section in the supplement variant stays).

## Verification

- `pnpm lint:md` passes after edits.
- `actionlint` (CI) passes on all three release.yml files.
- Manual inspection per AC:
  - AC-42-1 / AC-42-3: each release.yml `on:` block contains `push: branches: [main]` and nothing else.
  - AC-42-2: workflow comment + RELEASING.md prose both describe the release-PR-merge tag-cut as a side effect of the same push trigger.
  - AC-42-4: each RELEASING.md contains no occurrence of `workflow_dispatch`, `Run workflow`, or `gh workflow run Release`.
- `git diff` confirms root mirror edits exactly match the supplement-template edits.

## Blockers

None.
