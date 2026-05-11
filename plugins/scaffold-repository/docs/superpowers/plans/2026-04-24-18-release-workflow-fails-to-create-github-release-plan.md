# Plan: Release workflow fails to create GitHub release: "Resource not accessible by integration" [#18](https://github.com/patinaproject/bootstrap/issues/18)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unblock `patinaproject/bootstrap`'s stuck `v1.0.0` release, fix the `bootstrap` skill templates so future repos succeed on first release, and codify "templates first, then realignment into root" as the self-update loop.

**Architecture:** Layered permissions fix (repo + workflow + job-level `permissions:`) with documented PAT/App fallback; outcome-based audit row in the skill plus a proactive static check that reads `actions/permissions/workflow` and tag rulesets; `AGENTS.md` "Source of truth" anchoring the templates-first loop; one-shot manual recovery runbook for `v1.0.0` since the release-please manifest already reads `1.0.0`.

**Tech Stack:** GitHub Actions, `googleapis/release-please-action@v4.4.1`, `gh` CLI, Markdown (`markdownlint-cli2`), bootstrap skill in `skills/bootstrap/`.

---

## Context

This plan implements the design at [`docs/superpowers/specs/2026-04-24-18-release-workflow-fails-to-create-github-release-design.md`](../specs/2026-04-24-18-release-workflow-fails-to-create-github-release-design.md) (commit `b8954d6`). It is authoritative for AC-18-1 through AC-18-9. Read it before starting any task.

## Resolutions to open questions

1. **Default token path (AC-18-1, AC-18-4).** Keep `secrets.GITHUB_TOKEN` as the default path. The current repo default (`gh api repos/patinaproject/bootstrap/actions/permissions/workflow` → `{"default_workflow_permissions":"read"}`) is repo-scoped, not org-policy-capped – a repo admin can raise it. The PAT/App fallback stays documented in `RELEASING.md` for restrictive orgs. **Caveat – needs operator confirmation before execution:** if `patinaproject` org policy later caps the repo default, Executor must switch the default to an App token; record this decision in the PR body's Validation section if it applies.
2. **`release-please-action` retry semantics.** The action is manifest-driven: `.release-please-manifest.json` already reads `{".":"1.0.0"}` (written by merged PR #9), so a fresh `workflow_dispatch` will **not** re-create `v1.0.0` – release-please believes `1.0.0` is already released. Recovery is a one-shot manual step: create the `v1.0.0` tag + GitHub Release directly (using the merge commit of PR #9 as the target) and relabel PR #9 from `autorelease: pending` to `autorelease: tagged`. No manifest rollback – that would diverge from the CHANGELOG and produce a confusing second `v1.0.0` PR. Recovery runbook lives in the PR body's Validation section (Task R1).
3. **AC-18-9 ownership.** Audit phase, not realignment phase. The static checks (`default_workflow_permissions == read`, tag-ruleset signature requirement) are classification-time reads against GitHub state, which belongs in `skills/bootstrap/audit-checklist.md` (Area 2 – GitHub metadata) and surfaces through the existing realignment batch for "GitHub metadata". This matches how Area 7 (repo merge settings) is already structured.

## Covered-files list (for AC-18-6 and AC-18-7)

The following paths are ships-from-template and must be named in `AGENTS.md`'s "Source of truth" section and covered by the skill's realignment batches:

- `.github/workflows/*`
- `.github/ISSUE_TEMPLATE/*`
- `.github/pull_request_template.md`
- `RELEASING.md`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `package.json`
- `.husky/*`
- `commitlint.config.js`
- `.markdownlint.jsonc`
- `release-please-config.json`
- `.release-please-manifest.json`
- `.claude-plugin/`
- `.codex-plugin/`
- `.cursor/`
- `.windsurfrules`
- `.github/copilot-instructions.md`
- `scripts/check-plugin-versions.mjs`
- `scripts/sync-plugin-versions.mjs`

## Workstream map

Ordered, independently applicable batches. Each workstream lists its tasks, ACs, and verification.

- **W1 – Template release workflow (AC-18-4).** Add job-level `permissions:` to `templates/agent-plugin/.github/workflows/release.yml` and `templates/patinaproject-supplement/.github/workflows/release.yml`.
- **W2 – Template `RELEASING.md` prerequisites (AC-18-3).** Expand the "Prerequisites" section in `skills/bootstrap/templates/core/RELEASING.md`.
- **W3 – Repo-root release workflow realignment (AC-18-1, AC-18-2, AC-18-4).** Mirror W1 into `.github/workflows/release.yml` via the skill's realignment loop.
- **W4 – Audit checklist end-to-end row (AC-18-5).** Add an outcome-based release-flow verification row to `skills/bootstrap/audit-checklist.md`.
- **W5 – Audit checklist proactive static checks (AC-18-9).** Add `default_workflow_permissions` and tag-ruleset-signature check rows to `skills/bootstrap/audit-checklist.md`.
- **W6 – `AGENTS.md` source-of-truth section (AC-18-6).** Add the new section naming the covered-files list and the templates-first rule. `CLAUDE.md` inherits via `@AGENTS.md`.
- **W7 – Skill realignment coverage (AC-18-7).** Update `skills/bootstrap/SKILL.md` realignment-mode batches so every covered file has a batch and there is no self-exclusion clause.
- **W8 – PR body demonstrates the loop (AC-18-8).** Structure the PR body to link template diff → realignment output → root diff, and cross-reference `AGENTS.md`.
- **W9 – Stuck-state recovery runbook (AC-18-1, AC-18-2).** Put the manual `v1.0.0` recovery steps in the PR body's Validation section.

## Tasks

### Task W1-1: Add job-level permissions to agent-plugin template release workflow

**Files:**

- Modify: `skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml`

**AC:** AC-18-4.

- [ ] **Step 1: Add job-level `permissions:` and explanatory comment**

In `jobs.release-please`, immediately below `runs-on: ubuntu-latest`, insert:

```yaml
    # Declared at both workflow and job level. The workflow-level block is the
    # upper bound for any job; the job-level block is what the runner actually
    # presents to GitHub when release-please calls POST /repos/.../releases.
    # Some org policies cap the workflow default below the workflow-level
    # declaration, so setting job-level permissions explicitly removes the
    # ambiguity that caused issue #18.
    permissions:
      contents: write
      pull-requests: write
```

- [ ] **Step 2: Verify markdown/YAML shape**

Run: `pnpm exec actionlint skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml` if `actionlint` is available; otherwise inspect visually that indentation matches the surrounding `runs-on` key and the file still ends with a newline.

### Task W1-2: Add job-level permissions to patinaproject-supplement release workflow

**Files:**

- Modify: `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml`

**AC:** AC-18-4.

- [ ] **Step 1: Mirror the block from Task W1-1 into the `release-please` job**

Insert the same `permissions:` block (with the same comment) below `runs-on: ubuntu-latest` in the `release-please` job. The `notify-patinaproject-skills` job does not need `contents: write`; it only dispatches via a PAT, so leave it without a job-level permissions block.

- [ ] **Step 2: Verify**

Same check as W1-1.

### Task W2-1: Expand `RELEASING.md` Prerequisites section

**Files:**

- Modify: `skills/bootstrap/templates/core/RELEASING.md`

**AC:** AC-18-3.

- [ ] **Step 1: Replace the single "Allow Actions to create pull requests" subsection with a broader "Prerequisites" structure**

Under `## Prerequisites (one-time settings)`, reorganize into these subsections in order:

1. **Workflow permissions: read and write** – explain `Settings → Actions → General → Workflow permissions → Read and write permissions`. Note that repo-level default of `read` causes `release-please-action` to fail with `Resource not accessible by integration` on `POST /repos/.../releases`. Include the one-line verification: `gh api repos/<owner>/<repo>/actions/permissions/workflow --jq .default_workflow_permissions` should print `write`.
2. **Allow Actions to create and approve pull requests** – existing content, kept.
3. **Recognizing an org-policy cap** – describe the "greyed-out checkbox" symptom and that org-level `Settings → Actions → General → Workflow permissions` overrides repo-level defaults. Link the verification command above.
4. **PAT / GitHub App token fallback** – when to use (org caps repo-level workflow permissions below read+write), what scopes are required (`contents: write`, `pull-requests: write`), how to store it (org or repo secret, suggested name `RELEASE_PLEASE_TOKEN`), and how to wire it: change `token: ${{ secrets.GITHUB_TOKEN }}` to `token: ${{ secrets.RELEASE_PLEASE_TOKEN }}` in the `release-please-action` step. Note that the default code path remains `GITHUB_TOKEN` so forks outside Patina Project don't need to provision a Patina Project-specific secret.
5. **Tag ruleset caution** – explicitly warn that adding a tag-scoped ruleset requiring signed tags will break `release-please-action`, which cannot sign tags. If signature enforcement is desired, scope the ruleset to branches only, or to specific non-release tag refs.

Keep the existing "Require SHA-pinned actions" subsection as the final prerequisite.

- [ ] **Step 2: Run markdown lint**

Run: `pnpm lint:md` and confirm the changed file produces zero warnings.

### Task W3-1: Mirror W1-1's template change into the repo-root release workflow

**Files:**

- Modify: `.github/workflows/release.yml`

**AC:** AC-18-1, AC-18-2, AC-18-4.

- [ ] **Step 1: Add the same job-level `permissions:` block to the `release-please` job**

Identical insertion to Task W1-2, since the repo root uses the patinaproject-supplement variant.

- [ ] **Step 2: Verify with actionlint**

If the Executor has `actionlint`: `actionlint .github/workflows/release.yml`. Otherwise visual diff against the template confirms structural parity.

- [ ] **Step 3: Record in PR body that this root change was produced by the skill's realignment mode**

See Task W8-1 for PR-body format.

### Task R1: One-shot v1.0.0 recovery runbook (manual, in PR body)

**Files:** none in-repo (instructions live in PR body).

**AC:** AC-18-1, AC-18-2.

This is a **manual** verification; no automation. Capture it verbatim in the PR body under `Validation`.

- [ ] **Step 1: Raise repo workflow permissions**

In GitHub UI for `patinaproject/bootstrap`: `Settings → Actions → General → Workflow permissions → Read and write permissions` (save). Verify:

```bash
gh api repos/patinaproject/bootstrap/actions/permissions/workflow \
  --jq .default_workflow_permissions
```

Expected output: `write`.

- [ ] **Step 2: Merge the PR that closes #18**

Standard squash merge. This lands the template + root workflow changes on `main`.

- [ ] **Step 3: Manually create the `v1.0.0` tag and GitHub Release**

`.release-please-manifest.json` already reads `{".":"1.0.0"}` from merged PR #9, so re-running `Release` will not retry the release – release-please believes `1.0.0` is already published. Recovery is a one-shot:

```bash
# Tag the merge commit of PR #9 (commit 270d51a per `git log`).
gh release create v1.0.0 \
  --repo patinaproject/bootstrap \
  --target 270d51a \
  --title "v1.0.0" \
  --notes-file <release-notes-extracted-from-CHANGELOG.md>
```

Extract the `## [1.0.0]` section of `CHANGELOG.md` into a file first and pass that to `--notes-file`. Then relabel PR #9:

```bash
gh pr edit 9 --repo patinaproject/bootstrap \
  --remove-label "autorelease: pending" \
  --add-label "autorelease: tagged"
```

- [ ] **Step 4: Confirm the `skills` dispatch fires for v1.0.0**

Because Step 3 creates the Release via `gh release create` (not via the workflow), the `notify-patinaproject-skills` job will **not** auto-fire for this one-shot recovery. Dispatch it manually:

```bash
gh workflow run bump-plugin-tags.yml \
  --repo patinaproject/skills \
  -f plugin=bootstrap \
  -f tag=v1.0.0
```

Confirm a marketplace bump PR opens on `patinaproject/skills`.

- [ ] **Step 5: Confirm the next release is self-serving**

For the next release (e.g. 1.0.1), the job-level `permissions:` block lets the workflow path complete end-to-end. No manual step required. Note this expectation in the PR body so reviewers understand the manual step was one-shot.

### Task W4-1: Add outcome-based release-flow verification row to audit checklist

**Files:**

- Modify: `skills/bootstrap/audit-checklist.md`

**AC:** AC-18-5.

- [ ] **Step 1: Add a new row under "Area 2 – GitHub metadata"**

Insert below the existing `.github/actionlint.yaml` row:

| File | Required | Check |
|---|---|---|
| End-to-end release smoke | yes | After realignment, run `gh workflow run Release --repo <owner>/<repo>` on a repo seeded with at least one `feat:` or `fix:` commit since its last tag. Verify release-please opens/updates a release PR; on merge, a tag and GitHub Release appear, and – when `<owner> == patinaproject` – a `bump-plugin-tags.yml` dispatch fires on `patinaproject/skills`. Report a gap if the target has no prior release **and** `gh api repos/<owner>/<repo>/actions/permissions/workflow --jq .default_workflow_permissions` returns `read`. |

- [ ] **Step 2: Run markdown lint**

Run: `pnpm lint:md`.

### Task W5-1: Add proactive static-check rows for workflow permissions and tag rulesets

**Files:**

- Modify: `skills/bootstrap/audit-checklist.md`

**AC:** AC-18-9.

- [ ] **Step 1: Add two new rows under "Area 2 – GitHub metadata", below the row added in Task W4-1**

| File | Required | Check |
|---|---|---|
| Default workflow permissions | yes | `gh api repos/<owner>/<repo>/actions/permissions/workflow --jq .default_workflow_permissions` must return `write`. When it returns `read`, emit a realignment-gap warning entry recommending `Settings → Actions → General → Workflow permissions → Read and write permissions`. This check runs regardless of whether the repo has ever cut a release, so the problem surfaces before the first 403. |
| Tag rulesets do not require signatures | yes | `gh api repos/<owner>/<repo>/rulesets --jq '.[] \| select(.target=="tag")'` must not return any ruleset whose `rules[].type == "required_signatures"` applies to the release-tag pattern. When it does, emit a realignment-gap warning entry: signed tags break `release-please-action`, which cannot sign; scope the signature rule to branches or to non-release tag refs. |

- [ ] **Step 2: Run markdown lint**

Run: `pnpm lint:md`.

### Task W6-1: Add "Source of truth" section to `AGENTS.md`

**Files:**

- Modify: `AGENTS.md`

**AC:** AC-18-6. `CLAUDE.md` inherits via its existing `@AGENTS.md` import – no separate edit needed.

- [ ] **Step 1: Insert a new H2 section immediately after "Project Structure & Module Organization"**

Heading: `## Source of truth for repo baseline`.

Body (verbatim structure, fill in the bullets from the covered-files list above):

```markdown
## Source of truth for repo baseline

`skills/bootstrap/templates/**` is the authoritative source for this repository's own baseline config. Every file in the list below is shipped from a template and must be edited in the template first, then mirrored into the repo root via the local `bootstrap` skill in realignment mode. Hand-editing a root file without a matching template change regresses the next bootstrapped repo.

Covered files (any change here must round-trip through a template edit):

- `.github/workflows/*`
- `.github/ISSUE_TEMPLATE/*`
- `.github/pull_request_template.md`
- `.github/copilot-instructions.md`
- `RELEASING.md`
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `package.json`
- `.husky/*`
- `commitlint.config.js`
- `.markdownlint.jsonc`
- `release-please-config.json`
- `.release-please-manifest.json`
- `.claude-plugin/`
- `.codex-plugin/`
- `.cursor/`
- `.windsurfrules`
- `scripts/check-plugin-versions.mjs`
- `scripts/sync-plugin-versions.mjs`

Workflow for baseline-config changes on this repo:

1. Edit the template under `skills/bootstrap/templates/**`.
2. Run the local `bootstrap` skill against this repo in realignment mode; accept the proposed root diff.
3. Commit the template change and the mirrored root change together.
4. Reference the loop in the PR body so reviewers see both sides of the change.
```

- [ ] **Step 2: Run markdown lint**

Run: `pnpm lint:md`.

### Task W7-1: Expand skill realignment batches to cover every source-of-truth file

**Files:**

- Modify: `skills/bootstrap/SKILL.md`

**AC:** AC-18-7.

- [ ] **Step 1: Replace the existing realignment batch list**

Locate the bullet inside `### Realignment mode` that currently reads:

```text
- Group recommendations into ordered batches that can be applied independently: manifests → commit/PR conventions → PNPM tooling → agent docs → docs/README → AI platform surfaces.
```

Replace with:

```text
- Group recommendations into ordered batches that can be applied independently. Each batch below must cover its listed files; no file from the "Source of truth for repo baseline" list in `AGENTS.md` may be skipped. `patinaproject/bootstrap` is a normal realignment target – the skill must not self-exclude when run against it.
  1. Plugin manifests: `.claude-plugin/`, `.codex-plugin/`, `release-please-config.json`, `.release-please-manifest.json`.
  2. Commit / PR conventions: `commitlint.config.js`, `.husky/*`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/*`.
  3. PNPM tooling: `package.json`, `.markdownlint.jsonc`, `scripts/check-plugin-versions.mjs`, `scripts/sync-plugin-versions.mjs`.
  4. Agent + repo docs: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `RELEASING.md`.
  5. AI platform surfaces: `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`.
  6. Workflows: `.github/workflows/*` (including `release.yml` with job-level `permissions:`).
```

- [ ] **Step 2: Audit for self-exclusion clauses**

Grep the file: `grep -i -n "self" skills/bootstrap/SKILL.md` and confirm no "skip this repo", "exclude bootstrap", or similar text remains.

- [ ] **Step 3: Run markdown lint**

Run: `pnpm lint:md`.

### Task W8-1: Shape the PR body to demonstrate the templates-first loop

**Files:** none in-repo (PR body only).

**AC:** AC-18-8.

- [ ] **Step 1: Build the PR body using `.github/pull_request_template.md`'s sections in order**

Required section order (from `AGENTS.md`): `Summary`, `Linked issue`, `Acceptance criteria`, `Validation`, `Docs updated`.

- [ ] **Step 2: Under `Summary`, narrate the loop**

Explicitly walk the reviewer through: (a) the template diff under `skills/bootstrap/templates/**`, (b) the realignment output produced by the local `bootstrap` skill against this repo, (c) the mirrored diff under the repo root. Link all three in-body.

- [ ] **Step 3: Under `Acceptance criteria`, produce one `### AC-18-<n>` heading per AC (1–9)**

Each heading contains only the AC ID. Below each heading, put a short outcome summary and any verification checkboxes. For AC-18-1 and AC-18-2, the verification steps are the Task R1 runbook items, copied verbatim. For AC-18-5 and AC-18-9, include a manual spot-check against `patinaproject/bootstrap`'s current `actions/permissions/workflow` state as evidence the new checklist rows would catch it.

- [ ] **Step 4: Under `Validation`, embed the Task R1 runbook**

Verbatim, as the post-merge manual recovery sequence.

- [ ] **Step 5: Under `Docs updated`, list the AGENTS.md/CLAUDE.md/RELEASING.md/SKILL.md/audit-checklist.md edits**

Link to each file for reviewer convenience.

## ATDD hooks

| AC | Mechanical test | Manual verification |
|---|---|---|
| AC-18-1 | None – inherently manual (human-merged release PR). | Task R1 Steps 1–3. |
| AC-18-2 | None – inherently manual (cross-repo dispatch). | Task R1 Step 4. |
| AC-18-3 | `pnpm lint:md` on `skills/bootstrap/templates/core/RELEASING.md`. | Reviewer reads all five new sub-sections. |
| AC-18-4 | `grep -A2 'release-please:' skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml .github/workflows/release.yml` returns the job-level `permissions:` block in all three files. | None. |
| AC-18-5 | `grep -n 'End-to-end release smoke' skills/bootstrap/audit-checklist.md` returns one hit. | Reviewer confirms the row's check text names tag + Release + `skills` dispatch. |
| AC-18-6 | `grep -n 'Source of truth for repo baseline' AGENTS.md` returns one hit; the covered-files bullet list is complete (21 entries). | Reviewer confirms the invariant wording. |
| AC-18-7 | `grep -n 'self-exclude' skills/bootstrap/SKILL.md` returns zero hits; the new numbered batch list is present. | Reviewer confirms every file in the AGENTS.md covered-files list maps to a batch. |
| AC-18-8 | None – PR body is the artifact. | Reviewer inspects the PR body for template diff link + realignment output + root diff link. |
| AC-18-9 | `grep -n 'default_workflow_permissions' skills/bootstrap/audit-checklist.md` and `grep -n 'required_signatures' skills/bootstrap/audit-checklist.md` each return a hit. | Reviewer confirms both new rows exist under Area 2. |

All "manual" cells are labeled manual because GitHub UI interactions and cross-repo dispatches cannot be stubbed from this repo.

## Risks and rollback

- **Risk R1 – permissions-only fix without raising repo/org setting.** If a future operator applies the workflow job-level `permissions:` change but does not raise `Settings → Actions → General → Workflow permissions` to read + write, the 403 persists: workflow-level declarations are capped by the repo default. **Mitigation:** Executor must sequence the settings change first (Task R1 Step 1) and verify with the `gh api ... --jq .default_workflow_permissions` command before merging the PR. The PR body's Validation section makes this ordering explicit.
- **Risk R2 – PAT fallback not needed here but plan documents it.** If Executor discovers org policy actually caps repo defaults, switch the default `token:` in `.github/workflows/release.yml` to the Patina Project App/PAT secret and note the decision in the PR body. Do not silently leave `GITHUB_TOKEN` in place when it cannot succeed.
- **Risk R3 – manual recovery drift.** Creating `v1.0.0` via `gh release create` (Task R1 Step 3) bypasses the workflow, so `notify-patinaproject-skills` does not fire automatically for this one release. **Mitigation:** Task R1 Step 4 dispatches `bump-plugin-tags.yml` manually; verify the marketplace PR opens on `patinaproject/skills`.
- **Rollback path.** All template and doc changes are single-commit, file-level edits; revert is `git revert <sha>`. The manual recovery (tag + release) is idempotent – if anything looks wrong, delete the tag and release (`gh release delete v1.0.0 --cleanup-tag`) and redo.

## Appendix A – v1.0.0 recovery runbook (paste into PR body Validation)

The ready-to-paste Markdown for the PR body's `Validation` section lives in [`2026-04-24-18-release-workflow-fails-to-create-github-release-recovery-runbook.md`](./2026-04-24-18-release-workflow-fails-to-create-github-release-recovery-runbook.md). Finisher copies that file's contents verbatim into the PR body under `Validation`.

## Blockers

- None. All three Brainstormer open questions are resolved above from repo state. If Executor observes `default_workflow_permissions` still reads `read` after toggling the UI setting – indicating an actual org-policy cap rather than a repo-level default – halt and switch to the PAT/App-token fallback path per Risk R2 before merging.
