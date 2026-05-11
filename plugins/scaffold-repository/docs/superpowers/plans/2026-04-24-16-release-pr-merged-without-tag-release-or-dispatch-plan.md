# Plan: v1.0.0 release PR merged but no tag, release, or marketplace dispatch occurred [#16](https://github.com/patinaproject/bootstrap/issues/16)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the "merge the release-please PR = ship a release" flow by adding a `push: branches: [main]` trigger to `release.yml` (root + both templates), realign `RELEASING.md` (root + core template) to describe that flow, and emit the v1.0.0 stuck-state recovery runbook for the PR body.

**Architecture:** Pure YAML + Markdown changes. Three workflow files gain a `push` trigger alongside the existing `workflow_dispatch`, each prefixed with an explanatory comment that documents why both triggers exist. Two `RELEASING.md` files have step 1 rewritten so the merge-triggered path is dominant and `workflow_dispatch` is described only as an escape hatch. The v1.0.0 recovery steps are not code – they are emitted as runbook text for the Finisher to paste into the PR body under `Validation`.

**Tech Stack:** GitHub Actions YAML, Markdown, `actionlint` (run in CI on workflow changes), `markdownlint-cli2` (run via Husky / `pnpm lint:md`).

---

## ATDD execution order

Each acceptance criterion has a manual verification command documented in the design doc. For every task below, run the verification command **first** (expect it to FAIL against the unedited file), then make the edit, then re-run to confirm PASS. This is the ATDD rhythm even though the "tests" are `grep`/`diff` invocations rather than a test runner.

## File structure

Files modified by this plan, each with a single responsibility:

- `.github/workflows/release.yml` – root release workflow. Adds `push` trigger + comment. **AC-16-1.**
- `skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml` – template mirroring root triggers. **AC-16-2.**
- `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml` – template mirroring root triggers. **AC-16-3.**
- `RELEASING.md` – root releasing doc. Rewrite step 1. **AC-16-4.**
- `skills/bootstrap/templates/core/RELEASING.md` – templated releasing doc. Mirror step 1 rewrite. **AC-16-5.**

No repo files are modified for **AC-16-6** – the runbook is emitted as text for `Finisher` to place in the PR body.

---

## Workstream 1: Workflow triggers

Goal: every `release.yml` (root + both templates) triggers on `push: branches: [main]` and `workflow_dispatch`, with a comment explaining why both are present.

### Task 1: Scope-check template references to release triggers

**Files:**

- Read-only scan of: `skills/**`, `.github/workflows/**`

- [ ] **Step 1: Confirm the design's three-file assumption**

Run:

```bash
grep -Rln 'workflow_dispatch' .github/workflows skills
```

Expected output (exactly these three files):

```text
.github/workflows/release.yml
skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml
skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml
```

If any additional release-related workflow appears, halt and route back to `Brainstormer` – the design scoped only these three.

- [ ] **Step 2: Confirm no other file documents the dispatch-only flow**

Run:

```bash
grep -Rln 'does not run on pushes\|Actions → Release → Run workflow' .
```

Expected: matches only in `RELEASING.md` and `skills/bootstrap/templates/core/RELEASING.md` (and possibly this plan + design doc). No other docs teach the dispatch-only ritual.

- [ ] **Step 3: No commit** – this is a scope check only.

### Task 2: Add `push` trigger to root `.github/workflows/release.yml` (AC-16-1)

**Files:**

- Modify: `.github/workflows/release.yml` (lines 1-5)

- [ ] **Step 1: Run the AC-16-1 verification command and expect FAIL**

Run:

```bash
grep -A5 '^on:' .github/workflows/release.yml
```

Expected (current, failing): `on:` block contains only `workflow_dispatch:`, no comment, no `push:` block.

- [ ] **Step 2: Edit the `on:` block**

Replace:

```yaml
name: Release

on:
  workflow_dispatch:
```

With:

```yaml
name: Release

# release-please requires a run on push to main to cut the tag after
# the release PR merges. workflow_dispatch is kept as a manual escape hatch.
on:
  push:
    branches: [main]
  workflow_dispatch:
```

- [ ] **Step 3: Re-run AC-16-1 verification and expect PASS**

Run:

```bash
grep -B2 -A5 '^on:' .github/workflows/release.yml
```

Expected: the two-line comment appears immediately above `on:`, and the `on:` block lists both `push: branches: [main]` and `workflow_dispatch:`.

- [ ] **Step 4: Lint the workflow**

Run (if `actionlint` is available locally):

```bash
actionlint .github/workflows/release.yml
```

Expected: no output (no findings). If `actionlint` is not on `PATH`, note that CI's `actionlint` job (triggered by `.github/workflows/**` changes) will enforce this.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/release.yml
git commit -m "fix: #16 trigger release workflow on push to main"
```

### Task 3: Mirror trigger change into agent-plugin template (AC-16-2)

**Files:**

- Modify: `skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml` (lines 1-5)

- [ ] **Step 1: Run the AC-16-2 verification command and expect FAIL**

Run:

```bash
diff \
  <(sed -n '/^on:/,/^$/p' .github/workflows/release.yml) \
  <(sed -n '/^on:/,/^$/p' skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml)
```

Expected (current, failing): a diff where the root file has `push:` and the template has only `workflow_dispatch:`.

- [ ] **Step 2: Edit the template's `on:` block**

Replace:

```yaml
name: Release

on:
  workflow_dispatch:
```

With:

```yaml
name: Release

# release-please requires a run on push to main to cut the tag after
# the release PR merges. workflow_dispatch is kept as a manual escape hatch.
on:
  push:
    branches: [main]
  workflow_dispatch:
```

- [ ] **Step 3: Re-run AC-16-2 verification and expect PASS (empty diff)**

Run the same `diff` command. Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml
git commit -m "fix: #16 mirror release push trigger into agent-plugin template"
```

### Task 4: Mirror trigger change into patinaproject-supplement template (AC-16-3)

**Files:**

- Modify: `skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml` (lines 1-5)

- [ ] **Step 1: Run the AC-16-3 verification command and expect FAIL**

Run:

```bash
diff \
  <(sed -n '/^on:/,/^$/p' .github/workflows/release.yml) \
  <(sed -n '/^on:/,/^$/p' skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml)
```

Expected: non-empty diff because the supplement template still has only `workflow_dispatch:`.

- [ ] **Step 2: Edit the template's `on:` block**

Replace:

```yaml
name: Release

on:
  workflow_dispatch:
```

With:

```yaml
name: Release

# release-please requires a run on push to main to cut the tag after
# the release PR merges. workflow_dispatch is kept as a manual escape hatch.
on:
  push:
    branches: [main]
  workflow_dispatch:
```

- [ ] **Step 3: Re-run AC-16-3 verification and expect PASS (empty diff)**

- [ ] **Step 4: Commit**

```bash
git add skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml
git commit -m "fix: #16 mirror release push trigger into supplement template"
```

---

## Workstream 2: `RELEASING.md` alignment

Goal: step 1 of both `RELEASING.md` docs describes the push-triggered flow as the primary path; `workflow_dispatch` survives only as an explicit escape hatch (manual re-run / first release / recovery). Step 4 ("Clicking Merge on that PR is the release action") is already accurate once the workflow change lands – leave it untouched.

### Task 5: Rewrite root `RELEASING.md` step 1 (AC-16-4)

**Files:**

- Modify: `RELEASING.md` (lines 5-15, specifically the `How it works` step 1 bullet)

- [ ] **Step 1: Run the AC-16-4 verification command and expect FAIL**

Run:

```bash
sed -n '5,15p' RELEASING.md
```

Expected (current, failing): step 1 reads "A maintainer manually triggers the `Release` workflow from **Actions → Release → Run workflow** on `main`. The workflow does not run on pushes."

- [ ] **Step 2: Rewrite step 1**

Replace the current line 7 (the numbered list item `1.`) so it frames the merge trigger as the primary path and names `workflow_dispatch` only as an escape hatch. Keep the numbering and surrounding list structure intact. Use:

```markdown
1. On every push to `main`, the `Release` workflow runs `release-please`. The same workflow can also be triggered manually from **Actions → Release → Run workflow** as an escape hatch – use it to seed the very first release PR before any push to `main`, or to re-run after a transient failure.
```

Do not modify steps 2, 3, or 4. Step 4 ("Clicking Merge on that PR is the release action") becomes accurate the moment the Workstream 1 change ships.

- [ ] **Step 3: Re-run AC-16-4 verification and expect PASS**

Run:

```bash
sed -n '5,15p' RELEASING.md
```

Expected: step 1 now reads the push-triggered description; step 4 is unchanged and still says "Clicking Merge on that PR is the release action."

- [ ] **Step 4: Lint markdown**

Run:

```bash
pnpm lint:md
```

Expected: no findings on `RELEASING.md` (and no new findings elsewhere).

- [ ] **Step 5: Commit**

```bash
git add RELEASING.md
git commit -m "docs: #16 describe push-triggered release flow"
```

### Task 6: Mirror step 1 rewrite into `skills/bootstrap/templates/core/RELEASING.md` (AC-16-5)

**Files:**

- Modify: `skills/bootstrap/templates/core/RELEASING.md` (same line range – step 1 of `How it works`)

- [ ] **Step 1: Run the AC-16-5 verification command and expect FAIL with meaningful deltas in "How it works"**

Run:

```bash
diff RELEASING.md skills/bootstrap/templates/core/RELEASING.md
```

Expected (before edit): the diff includes the step 1 rewrite from Task 5 as a difference, plus the expected repo-specific org-callout paragraph in Prerequisites step 2. The step 1 delta is the failing signal.

- [ ] **Step 2: Apply the identical step 1 rewrite in the template**

Use the exact same replacement text as Task 5 step 2:

```markdown
1. On every push to `main`, the `Release` workflow runs `release-please`. The same workflow can also be triggered manually from **Actions → Release → Run workflow** as an escape hatch – use it to seed the very first release PR before any push to `main`, or to re-run after a transient failure.
```

- [ ] **Step 3: Re-run AC-16-5 verification and expect PASS (no deltas in `How it works`)**

Run:

```bash
diff RELEASING.md skills/bootstrap/templates/core/RELEASING.md
```

Expected: the only remaining diff is the repo-specific wording in the Prerequisites section (the root file's org-callout paragraph about "For repos under `patinaproject`, enable it once at the org level…" which the template phrases generically). No deltas in `How it works` step 1, 2, 3, or 4.

- [ ] **Step 4: Lint markdown**

Run:

```bash
pnpm lint:md
```

Expected: no new findings.

- [ ] **Step 5: Commit**

```bash
git add skills/bootstrap/templates/core/RELEASING.md
git commit -m "docs: #16 mirror push-triggered release flow into core template"
```

---

## Workstream 3: PR body runbook (AC-16-6)

Goal: supply the v1.0.0 stuck-state recovery runbook verbatim for inclusion in the PR body under the template's `Validation` section. **This workstream modifies no repo files.** It is a `Finisher` responsibility; the plan's role is to emit the exact text and flag the handoff.

### Task 7: Emit runbook text for Finisher (AC-16-6)

**Files:** none modified in the repo. This task produces text the `Finisher` pastes into the PR body.

- [ ] **Step 1: Confirm the runbook source of truth**

The runbook text is the numbered list under "Stuck-state recovery for v1.0.0" in `docs/superpowers/specs/2026-04-24-16-release-pr-merged-without-tag-release-or-dispatch-design.md` (lines 49-61 of the committed design at `23706fcf4bde3ec7a90eda52610cc9debe2f8bad`). Copy it verbatim; do not paraphrase or re-number.

- [ ] **Step 2: Emit the runbook block**

The `Finisher` places the following under the PR body's `Validation` heading, following the template's existing section order (`Summary`, `Linked issue`, `Acceptance criteria`, `Validation`, `Docs updated`). Preserve the commit SHA, tag name, and command flags exactly as written.

Text to emit:

```markdown
### Stuck-state recovery runbook for v1.0.0

Executed manually by a maintainer with push / release permissions **after** this PR merges. Not automated.

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
```

- [ ] **Step 3: Flag handoff**

The `Finisher` must:

- Use `gh pr create --body-file <path>` with a rendered body that follows `.github/pull_request_template.md` section order.
- Place the runbook block above inside the `Validation` section.
- Include the AC-16-1 … AC-16-6 `### AC-16-n` headings in the `Acceptance criteria` section, with verification steps under each AC as checkboxes where appropriate. AC-16-6's verification steps are the post-merge `gh release view` and `gh run list` commands – these are maintainer-executed, not CI.

- [ ] **Step 4: No commit** – nothing in this workstream touches the repo.

---

## Workstream 4: Final verification (reproduces AC manual tests)

Goal: before reporting done, Executor reproduces every AC manual-test command from the design doc in one pass. This catches regressions where a later task silently undid an earlier change.

### Task 8: Run all AC verification commands end-to-end

**Files:** none modified.

- [ ] **Step 1: AC-16-1 – root workflow triggers**

Run:

```bash
grep -B2 -A5 '^on:' .github/workflows/release.yml
```

Expected: two-line comment above `on:`; `push: branches: [main]` and `workflow_dispatch:` both present.

- [ ] **Step 2: AC-16-2 – agent-plugin template matches root**

Run:

```bash
diff \
  <(sed -n '/^on:/,/^$/p' .github/workflows/release.yml) \
  <(sed -n '/^on:/,/^$/p' skills/bootstrap/templates/agent-plugin/.github/workflows/release.yml)
```

Expected: empty output.

- [ ] **Step 3: AC-16-3 – supplement template matches root**

Run:

```bash
diff \
  <(sed -n '/^on:/,/^$/p' .github/workflows/release.yml) \
  <(sed -n '/^on:/,/^$/p' skills/bootstrap/templates/patinaproject-supplement/.github/workflows/release.yml)
```

Expected: empty output.

- [ ] **Step 4: AC-16-4 – root `RELEASING.md` step 1 / step 4**

Run:

```bash
sed -n '5,15p' RELEASING.md
```

Expected: step 1 frames the push-triggered flow; step 4 still reads "Clicking Merge on that PR is the release action."

- [ ] **Step 5: AC-16-5 – template `RELEASING.md` mirrors root**

Run:

```bash
diff RELEASING.md skills/bootstrap/templates/core/RELEASING.md
```

Expected: the only differences are the repo-specific paragraphs (the org-callout in Prerequisites), none in the `How it works` section.

- [ ] **Step 6: AC-16-6 – runbook hand-off confirmed**

Confirm the runbook text from Task 7 Step 2 is captured verbatim in the Finisher's handoff notes / PR body draft. No repo file change is expected here.

- [ ] **Step 7: Markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: no new findings.

- [ ] **Step 8: No commit** – this is verification only. If any step fails, fix in its originating workstream and re-run this task.

---

## Self-review notes

- **Spec coverage:** every AC-16-n has at least one task. AC-16-1 → Task 2; AC-16-2 → Task 3; AC-16-3 → Task 4; AC-16-4 → Task 5; AC-16-5 → Task 6; AC-16-6 → Task 7. Task 8 re-runs all six.
- **Placeholders:** none – every step shows exact commands, exact replacement text, and exact expected output.
- **Consistency:** the comment text above `on:` is identical across Tasks 2, 3, and 4. The step 1 rewrite is identical across Tasks 5 and 6. The runbook text in Task 7 matches the design doc verbatim.
- **Out of scope (confirmed from design):** no changes to `release-please-config.json`, no new CI guardrails, no reminder bots, no changes to the marketplace protocol.
