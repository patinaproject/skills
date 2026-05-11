# Allow Manual Dispatch For The Release Workflow Escape Hatch Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `workflow_dispatch` back to the release workflow as a recovery-only escape hatch while keeping push-to-main release automation as the normal path.

**Architecture:** The release workflow remains a single release-please path triggered by either `push` to `main` or manual dispatch. Template files under `skills/bootstrap/templates/**` are edited first, then root mirrors are aligned from those sources so this repository stays self-hosting.

**Tech Stack:** GitHub Actions YAML, release-please-action, Markdown release docs, PNPM markdownlint.

---

Approved design: [`docs/superpowers/specs/2026-04-27-49-allow-manual-dispatch-for-the-release-workflow-escape-hatch-design.md`](../specs/2026-04-27-49-allow-manual-dispatch-for-the-release-workflow-escape-hatch-design.md) at commit `6351ab9fa8d58f155c471fb6327d4a5c78982a67`.

## File Structure

- Modify: `skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml` – base emitted release workflow for plugin repos outside `patinaproject`.
- Modify: `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml` – Patina Project release workflow with marketplace notification.
- Modify: `.github/workflows/release.yml` – root mirror of the Patina Project supplement workflow.
- Modify: `skills/bootstrap/templates/core/RELEASING.md` – shared release docs emitted to repos.
- Modify: `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md` – Patina Project release docs with marketplace-distribution wording.
- Modify: `RELEASING.md` – root mirror of the Patina Project release docs.

## Task T49-1: Add the Manual Trigger To Release Workflow Templates

**Files:**

- Modify: `skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml`
- Modify: `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml`

- [ ] **Step 1: Inspect the current trigger blocks**

Run:

```bash
sed -n '1,24p' skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml
sed -n '1,24p' skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml
```

Expected: both files describe push-only release automation and have:

```yaml
on:
  push:
    branches: [main]
```

- [ ] **Step 2: Update the leading comments and trigger blocks**

Change both template files so the leading comment says the workflow is normally
triggered by pushes to `main` and can also be manually dispatched as a recovery
escape hatch. The trigger block in both files must become:

```yaml
on:
  workflow_dispatch:
  push:
    branches: [main]
```

Keep every job, permission, action SHA, and `with:` value unchanged.

- [ ] **Step 3: Verify the template trigger blocks**

Run:

```bash
sed -n '1,18p' skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml
sed -n '1,18p' skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml
```

Expected: each file includes `workflow_dispatch:` immediately under `on:` and
still includes `push` with `branches: [main]`.

## Task T49-2: Document Manual Dispatch As Recovery Only

**Files:**

- Modify: `skills/bootstrap/templates/core/RELEASING.md`
- Modify: `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md`

- [ ] **Step 1: Replace push-only wording in both release-doc templates**

In both files, replace the sentence:

```markdown
The `Release` workflow runs on every push to `main`. There is no manual dispatch. Cutting a release is the natural by-product of merging PRs:
```

with:

```markdown
The `Release` workflow runs on every push to `main`. Cutting a release is the natural by-product of merging PRs:
```

- [ ] **Step 2: Replace the no-manual-run conclusion**

In both files, replace:

```markdown
The result: every merge keeps the standing release PR fresh; merging that PR cuts the release. No `gh workflow run` step is ever required.
```

with:

```markdown
The result: every merge keeps the standing release PR fresh; merging that PR cuts the release. No manual step is required during the normal flow.
```

- [ ] **Step 3: Add a recovery section after the flow explanation**

Add this section in both files immediately after the paragraph from Step 2:

````markdown
## Manual recovery dispatch

Manual dispatch is an escape hatch, not the normal release path. Use it only when the latest automatic `Release` run was skipped, cancelled, failed for transient reasons, or needs to be retried after permissions or repository settings were fixed.

Start the same workflow from the GitHub Actions UI, or run:

```bash
gh workflow run Release
```

The manual run performs the same release-please evaluation as a push-triggered run. If releasable commits exist, it opens or refreshes the standing release PR. If the release PR has already been merged and the repository state calls for a release, it can cut the tag and GitHub Release. If there is nothing to release, it no-ops.

Do not use manual dispatch as the ordinary release process. Do not perform manual version bumps or local release commands.
````

- [ ] **Step 4: Verify recovery wording**

Run:

```bash
rg -n 'There is no manual dispatch|No `gh workflow run` step is ever required' skills/bootstrap/templates/core/RELEASING.md skills/bootstrap/templates/patinaproject-supplement/RELEASING.md
rg -n 'Manual recovery dispatch|gh workflow run Release|escape hatch' skills/bootstrap/templates/core/RELEASING.md skills/bootstrap/templates/patinaproject-supplement/RELEASING.md
```

Expected: the first command returns no matches; the second command returns the
new recovery section in both template files.

## Task T49-3: Mirror Template Changes Into Root Files

**Files:**

- Modify: `.github/workflows/release.yml`
- Modify: `RELEASING.md`

- [ ] **Step 1: Run the local bootstrap realignment loop for root mirrors**

Invoke the local `bootstrap` skill against this repository in realignment mode
after the template edits are complete. Accept the proposed release workflow and
release-doc root mirror updates for this repository. The accepted mirror updates
must make root `.github/workflows/release.yml` match
`skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml`
and root `RELEASING.md` match
`skills/bootstrap/templates/patinaproject-supplement/RELEASING.md`.

Expected: the realignment loop reports `.github/workflows/release.yml` and
`RELEASING.md` as root baseline files updated from the Patina Project
supplement templates.

- [ ] **Step 2: Verify root/template parity**

Run:

```bash
diff -u skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml .github/workflows/release.yml
diff -u skills/bootstrap/templates/patinaproject-supplement/RELEASING.md RELEASING.md
```

Expected: both commands produce no output and exit zero.

## Task T49-4: Run Acceptance Verification And Commit Implementation

**Files:**

- Verify: `skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml`
- Verify: `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml`
- Verify: `.github/workflows/release.yml`
- Verify: `skills/bootstrap/templates/core/RELEASING.md`
- Verify: `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md`
- Verify: `RELEASING.md`

- [ ] **Step 1: Verify AC-49-1 trigger coverage**

Run:

```bash
for file in \
  skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml \
  skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml \
  .github/workflows/release.yml; do
  printf '%s\n' "$file"
  sed -n '/^on:/,/^permissions:/p' "$file"
done
```

Expected: every printed `on:` block contains both `workflow_dispatch:` and
`push: branches: [main]`.

- [ ] **Step 2: Verify AC-49-2 same-path behavior**

Run:

```bash
rg -n 'github\.event_name|event_name|if:.*github\.event|workflow_dispatch' \
  skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml \
  skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml \
  .github/workflows/release.yml
```

Expected: matches are limited to the `workflow_dispatch:` trigger and comments;
there are no event-type conditionals such as `github.event_name` or
`if: ... github.event...`.

- [ ] **Step 3: Verify AC-49-3 documentation framing**

Run:

```bash
rg -n "Manual recovery dispatch|escape hatch|ordinary release process|normal flow" \
  skills/bootstrap/templates/core/RELEASING.md \
  skills/bootstrap/templates/patinaproject-supplement/RELEASING.md \
  RELEASING.md
```

Expected: all three files describe manual dispatch as an escape hatch and keep
normal releases push-driven.

- [ ] **Step 4: Verify AC-49-4 template/root round-trip**

Run:

```bash
diff -u skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml .github/workflows/release.yml
diff -u skills/bootstrap/templates/patinaproject-supplement/RELEASING.md RELEASING.md
```

Expected: both commands produce no output and exit zero.

- [ ] **Step 5: Run repository markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: exits zero with no markdownlint errors.

- [ ] **Step 6: Run release workflow syntax check if available**

Run:

```bash
command -v actionlint
```

Expected: if `actionlint` is installed, run:

```bash
actionlint .github/workflows/release.yml
actionlint skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml
actionlint skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml
```

If `actionlint` is not installed, record `actionlint not installed` in the
Executor verification report and rely on the trigger-block and diff checks.

- [ ] **Step 7: Commit implementation**

Run:

```bash
git add \
  skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml \
  skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml \
  .github/workflows/release.yml \
  skills/bootstrap/templates/core/RELEASING.md \
  skills/bootstrap/templates/patinaproject-supplement/RELEASING.md \
  RELEASING.md
git commit -m "ci: #49 add release workflow dispatch escape hatch"
```

Expected: commit succeeds, with Husky pre-commit checks passing.

## Plan Self-Review

- Spec coverage: T49-1 covers R1, R2, R3, AC-49-1, and AC-49-2. T49-2 covers
  R4 and AC-49-3. T49-3 covers R5 and AC-49-4. T49-4 verifies all acceptance
  criteria and commits the implementation.
- Placeholder scan: no incomplete markers or unspecified implementation steps.
- Scope check: one cohesive workflow/docs change; no decomposition needed.
