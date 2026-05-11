# Align superteam to the bootstrap baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Realign the repository with the approved Bootstrap baseline design for issue #47.

**Architecture:** This is a targeted repository realignment, not a scaffold rewrite. File changes are limited to the missing label policy and stale guidance, while remote label metadata is updated through `gh label edit`.

**Bootstrap 1.3.0 follow-up:** The original plan covered the bootstrap version
available at the time. Bootstrap `1.3.0` supersedes the release-flow guidance:
`workflow_dispatch` should be present as a recovery escape hatch, and
contributor docs should explain release-triggering commit types by product
impact.

**Tech Stack:** Markdown, GitHub Actions YAML, GitHub CLI, PNPM, Husky, commitlint, markdownlint-cli2.

---

## File Structure

- Create `.github/LABELS.md`: tracked source of truth for label selection and release-managed labels.
- Modify `.github/workflows/release.yml`: keep the push trigger and expose
  `workflow_dispatch` as a recovery escape hatch.
- Modify `RELEASING.md`: describe the push-to-main release flow and the manual
  recovery dispatch path.
- Modify `README.md`: remove the stale `@v0.1.0` Codex CLI install pin from the default install command.
- Modify `.github/pull_request_template.md`: replace the missing `docs/ac-traceability.md` reference with the existing `AGENTS.md` convention.
- Remote-only update: edit `autorelease: pending` and `autorelease: tagged` label descriptions.
- Bootstrap `1.3.0` follow-up: modify `.github/workflows/release.yml`,
  `RELEASING.md`, `AGENTS.md`, `CONTRIBUTING.md`, and `README.md` for recovery
  dispatch and commit-type guidance.

## Task 1: Add Label Policy Document

**Files:**

- Create: `.github/LABELS.md`

- [ ] **Step 1: Create `.github/LABELS.md`**

```markdown
# Labels

This file is the source of truth for when to apply each issue and pull-request label in this repository. It exists so reporters and agents can pick labels without guessing, and so label drift stays visible in review. For the authoritative runtime inventory, run `gh label list --json name,description`.

## Labels

| Name | Description |
| --- | --- |
| `bug` | Apply when the report describes a defect, regression, or unexpected behavior in shipped code or docs. |
| `documentation` | Apply when the change is primarily to Markdown, in-repo docs, or comments that describe behavior. |
| `duplicate` | Apply when another open or closed issue already tracks the same problem; link the canonical issue in the body. |
| `enhancement` | Apply when the report proposes a new capability or improves an existing one without fixing a defect. |
| `good first issue` | Apply when the work is small, well-scoped, and safe for a first-time contributor to pick up. |
| `help wanted` | Apply when maintainers are actively soliciting outside contributions on the issue. |
| `invalid` | Apply when the report is not actionable as filed (wrong repo, not reproducible, out of scope) and cannot be salvaged by editing. |
| `question` | Apply when the issue is a support request or clarification rather than a change request. |
| `wontfix` | Apply when the behavior described is intentional or the maintainers have decided not to act on it; leave a short rationale before closing. |

### Release-please (tool-managed)

`release-please` creates and applies these labels automatically on the standing release PR; do not apply or remove them by hand.

- `autorelease: pending`: Applied to the release PR while a release is in progress.
- `autorelease: tagged`: Applied to the release PR once the release has been tagged.

## Adding or changing labels

Use `gh label list --json name,description` as the canonical inventory and follow the label-hygiene rule in [`AGENTS.md`](../AGENTS.md) (every label must have a non-empty description). Do not introduce new labels in an issue or PR without first updating the repository label set and this file.
```

- [ ] **Step 2: Verify label table shape**

Run:

```bash
rg -n "^## Labels$|^\\| `bug`|^\\| `enhancement`|Release-please" .github/LABELS.md
```

Expected: output includes the `## Labels` heading, `bug`, `enhancement`, and the release-managed subsection.

## Task 2: Refresh Release Flow Guidance

**Files:**

- Modify: `.github/workflows/release.yml`
- Modify: `RELEASING.md`

- [x] **Step 1: Update `.github/workflows/release.yml` trigger comment and keep recovery dispatch**

Replace the current top comment and `on:` block with:

```yaml
name: Release

# Triggered on every push to `main`, with workflow_dispatch available as a
# recovery escape hatch. release-please is idempotent: on regular feature/fix
# merges it opens or refreshes the standing release PR; on the release-PR merge
# it sees the merged PR (label `autorelease: pending`) and cuts the tag,
# publishes the release, and dispatches the marketplace bump on
# patinaproject/skills. Manual dispatch runs the same path. See RELEASING.md.
on:
  workflow_dispatch:
  push:
    branches: [main]
```

- [x] **Step 2: Update `RELEASING.md` release flow and recovery section**

Replace only the numbered list under `## How it works` before `## Prerequisites (one-time settings)` with:

```markdown
The `Release` workflow runs on every push to `main`. Cutting a release is the natural by-product of merging PRs:

1. **Merge any PR into `main`.** The push event runs `Release`. `release-please` scans Conventional Commits since the last tag and opens — or updates — a standing **"chore: release X.Y.Z"** PR that:

   - Bumps `package.json` version.
   - Syncs `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` to the new version (configured in `release-please-config.json`).
   - Appends generated entries to `CHANGELOG.md`.

   Release-please attaches the `autorelease: pending` label to this PR. If there are no releasable commits since the last tag, the run no-ops.

2. **Merge the release PR.** Squash-merging the PR is itself a push to `main`, so `Release` runs again. release-please now sees the merged release PR (still labeled `autorelease: pending`), creates the tag `vX.Y.Z`, publishes the GitHub Release with the Conventional-Commit-derived notes, and (on `patinaproject` plugin repos) dispatches the marketplace bump on `patinaproject/skills`. The PR's label flips to `autorelease: tagged`.

The result: every merge keeps the standing release PR fresh; merging that PR cuts the release. No manual step is required during the normal flow.

## Manual recovery dispatch

Manual dispatch is an escape hatch, not the normal release path. Use it only when the latest automatic `Release` run was skipped, cancelled, failed for transient reasons, or needs to be retried after permissions or repository settings were fixed.

Start the same workflow from the GitHub Actions UI, or run:

```bash
gh workflow run Release
```

The manual run performs the same release-please evaluation as a push-triggered run. If releasable commits exist, it opens or refreshes the standing release PR. If the release PR has already been merged and the repository state calls for a release, it can cut the tag and GitHub Release. If there is nothing to release, it no-ops.

Do not use manual dispatch as the ordinary release process. Do not perform manual version bumps or local release commands.

- [x] **Step 3: Verify recovery dispatch wording is present**

Run:

```bash
rg -n "workflow_dispatch|Manual recovery dispatch|gh workflow run Release" .github/workflows/release.yml RELEASING.md
```

Expected: output includes `workflow_dispatch`, the recovery section, and the
manual recovery command.

## Task 3: Refresh Install and PR Guidance

**Files:**

- Modify: `README.md`
- Modify: `.github/pull_request_template.md`

- [ ] **Step 1: Update Codex CLI install command**

In `README.md`, replace:

```bash
codex plugin marketplace add patinaproject/superteam@v0.1.0
```

with:

```bash
codex plugin marketplace add patinaproject/superteam
```

- [ ] **Step 2: Update the PR-template AC comment**

In `.github/pull_request_template.md`, replace:

```markdown
<!-- One heading per relevant AC. AC IDs follow the convention in docs/ac-traceability.md. -->
```

with:

```markdown
<!-- One heading per relevant AC. AC IDs follow the AC-<issue>-<n> convention in AGENTS.md. -->
```

- [ ] **Step 3: Verify stale references are gone**

Run:

```bash
rg -n "v0\\.1\\.0|docs/ac-traceability\\.md" README.md .github/pull_request_template.md
```

Expected: no output and exit code 1.

## Task 4: Update Release-Reserved Label Metadata

**Files:**

- Remote-only GitHub label metadata

- [ ] **Step 1: Update `autorelease: pending` description**

Run:

```bash
gh label edit "autorelease: pending" --description "Reserved for Release Please while release PR is pending; do not apply or remove manually."
```

Expected: exit code 0.

- [ ] **Step 2: Update `autorelease: tagged` description**

Run:

```bash
gh label edit "autorelease: tagged" --description "Reserved for Release Please after release PR is tagged; do not apply or remove manually."
```

Expected: exit code 0.

- [ ] **Step 3: Verify release label descriptions**

Run:

```bash
gh label list --json name,color,description --jq '.[] | select(.name=="autorelease: pending" or .name=="autorelease: tagged")'
```

Expected: both labels have color `ededed` and non-empty descriptions.

## Task 5: Verify and Commit Implementation

**Files:**

- All files changed in Tasks 1-3

- [ ] **Step 1: Verify Markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: exit code 0 and `Summary: 0 error(s)`.

- [ ] **Step 2: Verify plugin versions**

Run:

```bash
node scripts/check-plugin-versions.mjs
```

Expected: `check-plugin-versions: all manifests at 1.1.0`.

- [ ] **Step 3: Verify commitlint rejects a missing issue**

Run:

```bash
printf 'feat: bad\n' | pnpm exec commitlint
```

Expected: non-zero exit with `ticket-required` failure.

- [ ] **Step 4: Verify commitlint accepts an issue-tagged title**

Run:

```bash
printf 'feat: #47 align bootstrap 1.3 release guidance\n' | pnpm exec commitlint
```

Expected: exit code 0.

- [ ] **Step 5: Confirm already-aligned surfaces were preserved**

Run:

```bash
git diff --name-only HEAD
```

Expected changed tracked files are limited to:

```text
.github/LABELS.md
.github/pull_request_template.md
.github/workflows/release.yml
AGENTS.md
CONTRIBUTING.md
README.md
RELEASING.md
docs/superpowers/specs/2026-04-27-47-align-superteam-to-the-bootstrap-baseline-design.md
docs/superpowers/plans/2026-04-27-47-align-superteam-to-the-bootstrap-baseline-plan.md
```

- [ ] **Step 6: Commit implementation**

Run:

```bash
git add .github/workflows/release.yml AGENTS.md CONTRIBUTING.md README.md RELEASING.md docs/superpowers/specs/2026-04-27-47-align-superteam-to-the-bootstrap-baseline-design.md docs/superpowers/plans/2026-04-27-47-align-superteam-to-the-bootstrap-baseline-plan.md
git commit -m "feat: #47 align bootstrap 1.3 release guidance"
```

Expected: commit succeeds after Husky runs markdownlint and plugin-version checks.

## Self-Review

- Spec coverage: Tasks 1-5 cover AC-47-1 through AC-47-6.
- Red-flag scan: no incomplete implementation steps remain.
- Type consistency: not applicable; this plan changes Markdown, YAML, and remote label metadata only.

## Task 6: Apply Bootstrap 1.3.0 Follow-up

**Files:**

- Modify: `.github/workflows/release.yml`
- Modify: `RELEASING.md`
- Modify: `AGENTS.md`
- Modify: `CONTRIBUTING.md`
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-04-27-47-align-superteam-to-the-bootstrap-baseline-design.md`
- Modify: `docs/superpowers/plans/2026-04-27-47-align-superteam-to-the-bootstrap-baseline-plan.md`

- [x] **Step 1: Restore release recovery dispatch**

Update `.github/workflows/release.yml` so the `Release` workflow has both
`push` and `workflow_dispatch` triggers. The workflow comment should state that
manual dispatch is a recovery escape hatch and runs the same release-please path.

- [x] **Step 2: Document manual recovery dispatch**

Update `RELEASING.md` with a `## Manual recovery dispatch` section. It should
say manual dispatch is not the normal release path, show `gh workflow run
Release`, and explain the run is idempotent.

- [x] **Step 3: Document release-triggering commit types**

Update `AGENTS.md`, `CONTRIBUTING.md`, and `README.md` so contributors choose
commit types by product impact rather than file extension. Product/runtime
changes should use `feat:` or `fix:` even when the diff is Markdown-only.

- [x] **Step 4: Verify follow-up changes**

Run:

```bash
pnpm lint:md
node scripts/check-plugin-versions.mjs
printf 'feat: bad\n' | pnpm exec commitlint
printf 'feat: #47 align bootstrap 1.3 release guidance\n' | pnpm exec commitlint
```

Expected: Markdown lint and plugin-version checks pass; commitlint rejects the
missing-issue sample and accepts the issue-tagged sample.

## Follow-up Self-Review

- Spec coverage: Task 6 covers the bootstrap `1.3.0` delta and adds AC-47-7.
- Red-flag scan: The release workflow now keeps manual dispatch only as a
  recovery path, not as the ordinary release process.
- Type consistency: This branch intentionally uses a release-triggering type
  because it changes workflow behavior and contributor runtime guidance.
