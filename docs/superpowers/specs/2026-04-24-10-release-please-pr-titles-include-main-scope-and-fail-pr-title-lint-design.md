# Design: Release Please PR titles include `(main)` scope and fail PR-title lint [#10](https://github.com/patinaproject/bootstrap/issues/10)

## Problem

Release Please opens release PRs (e.g. [PR #9](https://github.com/patinaproject/bootstrap/pull/9)) with titles like `chore(main): release 1.0.0`. The repo's `lint-pr.yml` rejects these on three independent jobs:

- `title-format` → `disallowScopes: .+` rejects the `(main)` scope.
- `title-format` → `subjectPattern: '^#\d+ .+$'` rejects subjects without `#<issue>`; release PRs have no issue.
- `closing-keyword` requires `Closes #...` in the body; release PR bodies have none.

The same problem will reproduce in every repo scaffolded from `skills/bootstrap/templates/`, because both the Release Please config and the `lint-pr.yml` workflow are shipped as templates.

## Root Cause

1. Release Please's default `pull-request-title-pattern` is `chore${scope}: release${component} ${version}`. On the default branch, `${scope}` expands to `(main)`. Since the repo has a single package and `include-component-in-tag: false`, the scope carries no information.
2. The repo's `lint-pr.yml` enforces issue-backed conventional commits with no exempt path for release automation PRs.

## Chosen Approach

Fix the title at its source, and let lint-pr skip automation-authored release PRs by label.

1. **Strip `${scope}` from the title pattern.** Set `pull-request-title-pattern` to `chore: release ${version}` in both `release-please-config.json` files (repo + `skills/bootstrap/templates/agent-plugin/release-please-config.json`). Result: `chore: release 1.0.0`.
2. **Gate lint-pr jobs on the `autorelease: pending` label.** Release Please automatically applies this label to every release PR it opens. Add an `if:` guard to each of the three jobs (`title-format`, `closing-keyword`, `mark-breaking-change`) in both `.github/workflows/lint-pr.yml` and `skills/bootstrap/templates/core/.github/workflows/lint-pr.yml`:

   ```yaml
   if: ${{ !contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}
   ```

   Preserve the existing `dependabot` guard on `closing-keyword` by combining with `&&`.
3. **Backfill the label description.** The `autorelease: pending` label exists but has an empty description. Update it via `gh label edit` to document the reservation and keep color `#c5def5`. Verification command from AGENTS.md (`gh label list --json name,description --jq '.[] | select(.description == "")'`) will return empty.
4. **Document the reservation.** Update `AGENTS.md` (repo + `skills/bootstrap/templates/core/AGENTS.md` if it exists there, otherwise the appropriate template surface), `skills/bootstrap/SKILL.md`, and `skills/bootstrap/audit-checklist.md` so that:
   - Agents never manually apply `autorelease: pending` / `autorelease: tagged`.
   - The bootstrap audit verifies the label exists with the documented description and color in freshly scaffolded repos.

## Rejected Alternatives

- **Relax `disallowScopes` to allow `(main)`.** Opens the door to all scopes repo-wide — the strict rule exists for a reason.
- **Loosen `subjectPattern` to make the `#<issue>` reference optional.** Breaks the repo's traceability guarantee for human PRs.
- **Exempt release PRs by author (`github.actions[bot]`).** Fragile; token identities vary (GITHUB_TOKEN vs PATs vs GitHub App installs), and author-based gating has been a known footgun for Release Please users.
- **Exempt by title prefix (`startsWith(title, 'chore: release')`).** Trivially spoofable by a human PR title; label-gating is stronger because only Release Please can attach `autorelease: pending`.
- **Add `ignoreLabels` to the semantic-PR action only.** Only covers one of three jobs; `closing-keyword` and `mark-breaking-change` still fail.
- **Keep scope, add `feat(main)` etc. to the allowed set.** The scope is semantically empty here; removing it is cleaner than whitelisting.

## Affected Files

Live files (repo):

- `release-please-config.json`
- `.github/workflows/lint-pr.yml`
- `AGENTS.md`
- The `autorelease: pending` GitHub label (description backfill, via `gh label edit`).

Skill templates (mirror the live changes):

- `skills/bootstrap/templates/agent-plugin/release-please-config.json`
- `skills/bootstrap/templates/core/.github/workflows/lint-pr.yml`
- `skills/bootstrap/SKILL.md` (agent guidance; audit step for the reserved label)
- `skills/bootstrap/audit-checklist.md` (verify label presence, description, color)
- Any AGENTS.md template under `skills/bootstrap/templates/` that ships the labels/PR guidance (mirror the live `AGENTS.md` update there).

## Acceptance Criteria

### AC-10-1

Release Please opens release PRs with titles of the form `chore: release <version>` (no `(main)` scope), driven by `pull-request-title-pattern` in both the repo's and the agent-plugin template's `release-please-config.json`.

### AC-10-2

All three lint-pr jobs (`title-format`, `closing-keyword`, `mark-breaking-change`) skip on PRs carrying the `autorelease: pending` label. The guard is mirrored in `skills/bootstrap/templates/core/.github/workflows/lint-pr.yml`. Human PRs without the label continue to be enforced exactly as today.

### AC-10-3

The `autorelease: pending` label in `patinaproject/bootstrap` has a non-empty description documenting its Release Please ownership, color stays `#c5def5`, and `gh label list --json name,description --jq '.[] | select(.description == "")'` returns nothing for this label.

### AC-10-4

`AGENTS.md` (and its template equivalent), `skills/bootstrap/SKILL.md`, and `skills/bootstrap/audit-checklist.md` document that `autorelease: pending` and `autorelease: tagged` are reserved for Release Please automation, instruct agents never to apply them manually, and the bootstrap audit checklist includes a step verifying the label's presence, description, and color in a newly scaffolded repo.

## Verification Strategy

- **AC-10-1:** After merge, observe the next Release Please PR's title. For local confidence, inspect the updated `pull-request-title-pattern` strings in both config files and confirm `${scope}` is absent.
- **AC-10-2:** Inspect the workflow files. Confirm each of the three jobs has an `if:` expression using `!contains(github.event.pull_request.labels.*.name, 'autorelease: pending')`, that the `closing-keyword` job preserves its dependabot guard via `&&`, and that the template file is byte-for-byte consistent on these lines with the live workflow (modulo template-only placeholders). Re-run the next Release Please PR end-to-end and confirm the three jobs report "skipped" while other checks pass; confirm a human PR without the label still triggers the jobs.
- **AC-10-3:** `gh label list --json name,color,description --jq '.[] | select(.name=="autorelease: pending")'` shows color `c5def5` and a non-empty description. The AGENTS.md empty-description audit command returns nothing.
- **AC-10-4:** `rg 'autorelease: pending'` surfaces the reservation text in `AGENTS.md`, `SKILL.md`, and `audit-checklist.md`. The audit checklist contains an explicit step covering label name, color, and description, and running through the bootstrap audit against a scaffolded repo passes that step.
- **Markdown lint:** `pnpm lint:md` passes for the new/updated docs.
