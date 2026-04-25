# Design: Release workflow dispatches wrong filename on patinaproject/skills: bump-plugin-tags.yml vs plugin-release-bump.yml [#26](https://github.com/patinaproject/bootstrap/issues/26)

## Context

The Patina supplement variant of `release.yml` emits a `notify-patinaproject-skills` job that, after a successful release, dispatches a workflow on `patinaproject/skills` to open a marketplace-bump PR for the new tag. The dispatch currently targets `bump-plugin-tags.yml`, but the actual workflow file on `patinaproject/skills` is `plugin-release-bump.yml`. The mismatch was discovered during v1.0.0 recovery (issue #18): manual `gh workflow run bump-plugin-tags.yml --repo patinaproject/skills ...` returned HTTP 404, while `plugin-release-bump.yml` succeeded.

Left unfixed, every future release from `patinaproject/bootstrap` will fail the notify step and require manual operator action to open the marketplace-bump PR on `patinaproject/skills`.

Per `AGENTS.md`, `skills/bootstrap/templates/**` is the source of truth for this repo's own baseline config. Both the template and the mirrored root file must be updated together, along with any adjacent docs that name the workflow filename as part of current guidance (not historical plan records).

## Goals

- The `notify-patinaproject-skills` job dispatches the correct workflow filename (`plugin-release-bump.yml`) on `patinaproject/skills` so the marketplace-bump PR opens automatically after each release.
- The templates-first loop is honored: the supplement template is the authoritative edit, and the root is a mirror.
- Current operator-facing docs that name the dispatched workflow (RELEASING.md, SKILL.md, audit checklist) agree with the workflow file they describe.

## Non-goals

- Changing what the marketplace-bump workflow does on `patinaproject/skills`, or renaming it back to `bump-plugin-tags.yml` on that repo.
- Changing the dispatch action, token, or gating conditions on the notify job.
- Rewriting historical design/plan/runbook docs under `docs/superpowers/` that referenced the old filename at the time of writing. Those are point-in-time records and intentionally left intact.

## Approach

Pure rename. No behavior change, no permission change, no token change.

1. **Template edit (source of truth)** — In `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml`, change the `workflow:` input on the `benc-uk/workflow-dispatch` step from `bump-plugin-tags.yml` to `plugin-release-bump.yml`. No other lines change.
2. **Root mirror** — Apply the identical change to `.github/workflows/release.yml` so the root tracks the template.
3. **Doc alignment** — Update the operator-facing references to the dispatched workflow filename so they match the template. In scope:
   - `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md`
   - `skills/bootstrap/templates/core/RELEASING.md` (shared paragraph describing Patina auto-dispatch)
   - `RELEASING.md` (mirrored root)
   - `skills/bootstrap/SKILL.md` (describes the supplement's notify job)
   - `skills/bootstrap/audit-checklist.md` (if it names the filename as part of a check)
4. **Historical docs** — Leave `docs/superpowers/specs/**` and `docs/superpowers/plans/**` alone. They describe decisions made against the then-current filename and are not operator guidance.

## Acceptance criteria

### AC-26-1

The `notify-patinaproject-skills` job dispatches `plugin-release-bump.yml` on `patinaproject/skills`.

- **Given** the Patina supplement variant of `release.yml` is in effect on `patinaproject/bootstrap` and the `release-please` job reports `release_created == 'true'` for some tag `vX.Y.Z`,
- **When** the `notify-patinaproject-skills` job runs the `benc-uk/workflow-dispatch` step,
- **Then** the step posts to `POST /repos/patinaproject/skills/actions/workflows/plugin-release-bump.yml/dispatches` with inputs `{"plugin":"bootstrap","tag":"vX.Y.Z"}`, the call returns HTTP 204, and a corresponding run appears in `gh run list --workflow=plugin-release-bump.yml --repo patinaproject/skills`.

Verification (post-merge, next release):

- [ ] `gh run view --repo patinaproject/bootstrap <notify-run-id> --log` shows a successful dispatch step naming `plugin-release-bump.yml` (no 404).
- [ ] `gh run list --workflow=plugin-release-bump.yml --repo patinaproject/skills -L 3` shows a run with inputs `plugin=bootstrap` and the just-released tag.

### AC-26-2

The change ships through the templates-first source-of-truth loop.

- **Given** `AGENTS.md` designates `skills/bootstrap/templates/**` as the authoritative source for this repo's baseline config,
- **When** the fix for #26 lands,
- **Then** `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml` and the mirrored root `.github/workflows/release.yml` both reference `plugin-release-bump.yml`, no remaining operator-facing doc (RELEASING.md variants, SKILL.md, audit checklist) names `bump-plugin-tags.yml` as the current dispatch target, and the PR body references the templates-first loop so reviewers see both sides of the change.

Verification:

- [ ] `rg -n 'bump-plugin-tags\.yml' skills/bootstrap/templates .github/workflows RELEASING.md skills/bootstrap/SKILL.md skills/bootstrap/audit-checklist.md` returns no matches.
- [ ] `rg -n 'plugin-release-bump\.yml' skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml .github/workflows/release.yml` shows the new filename in both the template and the mirrored root.
- [ ] PR body's `Docs updated` section lists the template edit and the mirrored root edit as a matched pair.

## Open questions

None. The correct filename is established by the successful manual dispatch during #18 recovery.

## Out of scope

- Renaming the workflow on `patinaproject/skills`.
- Replacing `benc-uk/workflow-dispatch` with another dispatcher.
- Changes to the `PATINA_SKILLS_DISPATCH_TOKEN` secret, permissions, or the `github.repository_owner == 'patinaproject'` gate.
- Back-editing historical design, plan, or runbook documents under `docs/superpowers/` that referenced the old filename at the time of writing.

## Scope expansion

The v1.1.0 release run ([24921997515](https://github.com/patinaproject/bootstrap/actions/runs/24921997515)) cut the tag and published the GitHub Release successfully, but the `notify-patinaproject-skills` job failed with `Parameter token or opts.auth is required`. Root cause: the org-level dispatch secret is not configured, so the templated reference resolves to an empty string, and the dispatcher rejects the empty token. The renamed workflow (AC-26-1) is irrelevant to the failure — the job never reaches the dispatch call.

Today every release will keep ending in a red CI badge until the secret is configured. That is operator-visible noise on a successful release and conflates two distinct conditions (release broken vs. marketplace bump deferred). The graceful-degradation requirement: when the dispatch token is unavailable, the notify job should treat the marketplace bump as deferred, not as a release failure, and tell the operator how to recover manually.

### AC-26-3

The `notify-patinaproject-skills` job degrades gracefully when the dispatch token secret is unavailable.

- **Given** a release run on `patinaproject/bootstrap` where the `release-please` job reports `release_created == 'true'` and the org-level dispatch secret used by the notify job is unset (resolves to an empty string),
- **When** the `notify-patinaproject-skills` job runs,
- **Then** it logs a clear warning naming the missing secret and the manual remediation command, skips the dispatch step instead of invoking it, and the job ends in a success conclusion. The `release-please` job's tag and Release publication remain unaffected (independent job, independent conclusion).

Verification (post-merge, next release):

- [ ] `gh run view --repo patinaproject/bootstrap <run-id>` shows both `release-please` and `notify-patinaproject-skills` with conclusion `success` when the secret is unset.
- [ ] The notify-job log contains a `::warning::` line naming the missing secret and pointing the operator at the manual `gh workflow run plugin-release-bump.yml ...` recovery command.
- [ ] The release tag and GitHub Release for the version remain present and correct.
