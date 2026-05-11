# Plan: Release Please PR titles include `(main)` scope and fail PR-title lint [#10](https://github.com/patinaproject/bootstrap/issues/10)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop Release Please PRs from failing `lint-pr` by (a) dropping the empty `(main)` scope from the release-PR title and (b) gating lint-pr jobs on the `autorelease: pending` label that Release Please already applies, then mirror the fix into the `bootstrap` skill templates and docs.

**Architecture:** Two small config edits (live + template `release-please-config.json` get `pull-request-title-pattern`; live + template `lint-pr.yml` get an `if:` guard on all three jobs). One live GitHub write (`gh label edit` to backfill the reserved label's description). Documentation in `AGENTS.md`, `skills/bootstrap/SKILL.md`, and `skills/bootstrap/audit-checklist.md` so agents know the label is reserved and the bootstrap audit verifies it on scaffolded repos.

**Tech Stack:** Release Please config JSON, GitHub Actions YAML, `amannn/action-semantic-pull-request`, `gh` CLI, `markdownlint-cli2`, `actionlint`.

**Design reference:** `docs/superpowers/specs/2026-04-24-10-release-please-pr-titles-include-main-scope-and-fail-pr-title-lint-design.md` @ `aa24b02`.

**Acceptance Criteria mapped in this plan:**

- AC-10-1 → T1, T2 (title-pattern in live + template config)
- AC-10-2 → T3, T4, T5 (label-gate three jobs in live + template lint-pr.yml)
- AC-10-3 → T6 (live `gh label edit` – operator-gated)
- AC-10-4 → T7, T8, T9, T10 (docs + audit-checklist row + skill audit step, in live + template surfaces)

**Sequencing:**

- Workstream A (Config) – T1, T2 – independent, can run in parallel.
- Workstream B (Workflows) – T3, T4, T5 – T3 first so the live workflow is the source of truth; T4 mirrors; T5 verifies parity.
- Workstream C (Docs) – T7, T8, T9, T10 – can run after A + B land; internally can run in any order but commit together per workstream for clean history.
- Workstream D (Label backfill) – T6 – **operator-gated live write**. Executor prepares exact command; Team Lead / operator runs it. Can be scheduled any time after the repo rules in T7 are agreed; prefer doing it alongside docs so the verifying `gh label list` command passes on the same pass.

**ATDD entry point:** There is no runtime test harness. The acceptance check is a set of deterministic repo-state assertions: `jq` and `rg` against the config/workflow files, `pnpm lint:md` for docs, `actionlint` for workflow edits, and `gh label list --json ... --jq ...` for the live label. Each task below begins with a failing assertion (grep/jq command that returns non-zero or empty before the change) and ends with the same assertion passing.

---

## Workstream A – Release Please title pattern

### Task T1: Add `pull-request-title-pattern` to repo `release-please-config.json`

**ACs:** AC-10-1

**Files:**

- Modify: `release-please-config.json`

- [ ] **Step 1: Write the failing assertion**

Run:

```bash
jq -r '."pull-request-title-pattern" // "MISSING"' release-please-config.json
```

Expected before change: `MISSING`.

- [ ] **Step 2: Add the key at top level**

Edit `release-please-config.json` so the top-level object includes a new key `"pull-request-title-pattern": "chore: release ${version}"`. Place it directly after the `"include-component-in-tag": false` line. Result:

```json
{
  "$schema": "https://raw.githubusercontent.com/googleapis/release-please/main/schemas/config.json",
  "release-type": "node",
  "include-component-in-tag": false,
  "pull-request-title-pattern": "chore: release ${version}",
  "packages": {
    ".": {
      "release-type": "node",
      "extra-files": [
        {
          "type": "json",
          "path": ".claude-plugin/plugin.json",
          "jsonpath": "$.version"
        },
        {
          "type": "json",
          "path": ".codex-plugin/plugin.json",
          "jsonpath": "$.version"
        }
      ]
    }
  }
}
```

- [ ] **Step 3: Verify JSON is valid and the key is set**

Run:

```bash
jq -e '."pull-request-title-pattern" == "chore: release ${version}"' release-please-config.json
```

Expected: prints `true`, exit code `0`.

Also confirm the pattern contains no `${scope}`:

```bash
jq -r '."pull-request-title-pattern"' release-please-config.json | grep -qv '\${scope}' && echo OK
```

Expected: `OK`.

- [ ] **Step 4: Commit**

```bash
git add release-please-config.json
git commit -m "chore: #10 drop scope from release-please title pattern"
```

### Task T2: Mirror the title pattern into the agent-plugin template

**ACs:** AC-10-1

**Files:**

- Modify: `skills/bootstrap/templates/agent-plugin/release-please-config.json`

- [ ] **Step 1: Failing assertion**

```bash
jq -r '."pull-request-title-pattern" // "MISSING"' skills/bootstrap/templates/agent-plugin/release-please-config.json
```

Expected: `MISSING`.

- [ ] **Step 2: Apply the same key**

Add `"pull-request-title-pattern": "chore: release ${version}"` at the top level, directly after `"include-component-in-tag": false`. The file body must match the live `release-please-config.json` from T1 byte-for-byte.

- [ ] **Step 3: Verify parity with live file**

```bash
diff release-please-config.json skills/bootstrap/templates/agent-plugin/release-please-config.json
```

Expected: no output (files identical).

- [ ] **Step 4: Commit**

```bash
git add skills/bootstrap/templates/agent-plugin/release-please-config.json
git commit -m "chore: #10 mirror release-please title pattern to template"
```

---

## Workstream B – `lint-pr.yml` label guard

Shared fragment used in this workstream – the skip expression:

```yaml
if: ${{ !contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}
```

For the `closing-keyword` job, combine with the existing dependabot guard using `&&`:

```yaml
if: ${{ github.event.pull_request.user.login != 'dependabot[bot]' && !contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}
```

### Task T3: Guard all three jobs in live `.github/workflows/lint-pr.yml`

**ACs:** AC-10-2

**Files:**

- Modify: `.github/workflows/lint-pr.yml` (job `title-format` line 13 area; job `closing-keyword` line 55-58; job `mark-breaking-change` line 86-89)

- [ ] **Step 1: Failing assertion (count of guarded jobs)**

```bash
grep -c "autorelease: pending" .github/workflows/lint-pr.yml
```

Expected before change: `0`.

- [ ] **Step 2: Add `if:` to `title-format`**

Insert under `runs-on: ubuntu-latest` of the `title-format` job so the job header reads:

```yaml
  title-format:
    name: Validate PR title
    runs-on: ubuntu-latest
    if: ${{ !contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}
    steps:
```

- [ ] **Step 3: Replace `if:` on `closing-keyword`**

The existing line is:

```yaml
    if: github.event.pull_request.user.login != 'dependabot[bot]'
```

Replace with:

```yaml
    if: ${{ github.event.pull_request.user.login != 'dependabot[bot]' && !contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}
```

- [ ] **Step 4: Add `if:` to `mark-breaking-change`**

Insert under its `runs-on: ubuntu-latest`:

```yaml
  mark-breaking-change:
    name: Mark breaking change
    runs-on: ubuntu-latest
    if: ${{ !contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}
    steps:
```

- [ ] **Step 5: Verify guard is present on all three jobs**

```bash
grep -c "autorelease: pending" .github/workflows/lint-pr.yml
```

Expected: `3`.

Also verify the dependabot guard is preserved:

```bash
grep -c "dependabot\[bot\]" .github/workflows/lint-pr.yml
```

Expected: `1` (the `closing-keyword` combined expression).

- [ ] **Step 6: Run actionlint**

```bash
actionlint .github/workflows/lint-pr.yml
```

Expected: exit code `0`, no findings. (If `actionlint` isn't installed locally, rely on the CI `lint-actions` workflow as the authoritative check, but still run it locally when available.)

- [ ] **Step 7: Commit**

```bash
git add .github/workflows/lint-pr.yml
git commit -m "ci: #10 skip lint-pr on release-please PRs"
```

### Task T4: Mirror the guard into `skills/bootstrap/templates/core/.github/workflows/lint-pr.yml`

**ACs:** AC-10-2

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/workflows/lint-pr.yml`

- [ ] **Step 1: Failing assertion**

```bash
grep -c "autorelease: pending" skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
```

Expected before change: `0`.

- [ ] **Step 2: Apply the same three edits from T3**

Use the same edit content from T3 steps 2-4. The template file's structure matches the live file line-for-line.

- [ ] **Step 3: Verify parity**

```bash
diff .github/workflows/lint-pr.yml skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
```

Expected: no output (files identical – this is currently true for the base file; the mirrored edits must preserve that).

- [ ] **Step 4: Run actionlint**

```bash
actionlint skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
```

Expected: exit code `0`.

- [ ] **Step 5: Commit**

```bash
git add skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
git commit -m "ci: #10 mirror release-please lint-pr skip to template"
```

### Task T5: Verify end-to-end workflow parity

**ACs:** AC-10-2

**Files:** none (verification only)

- [ ] **Step 1: Confirm live and template lint-pr.yml are byte-identical**

```bash
diff .github/workflows/lint-pr.yml skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
```

Expected: no output.

- [ ] **Step 2: Confirm the guard appears exactly 3× in each file**

```bash
grep -c "autorelease: pending" .github/workflows/lint-pr.yml
grep -c "autorelease: pending" skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
```

Expected: each prints `3`.

- [ ] **Step 3: No commit (verification task)**

---

## Workstream D – Live label backfill (operator-gated)

### Task T6: Backfill description on `autorelease: pending` label

**ACs:** AC-10-3

**Files:** none (GitHub API write)

> **Operator confirmation required.** This step writes to the live GitHub repository. The Executor MUST NOT run the `gh label edit` command. Instead, stage the exact command for the Team Lead / operator to review and run.

- [ ] **Step 1: Failing assertion (pre-check)**

```bash
gh label list --repo patinaproject/bootstrap --json name,color,description \
  --jq '.[] | select(.name=="autorelease: pending")'
```

Expected before write: `{"color":"c5def5","description":"","name":"autorelease: pending"}` (empty description).

- [ ] **Step 2: Stage the exact command for operator review**

Command to be run by the operator (not the Executor):

```bash
gh label edit "autorelease: pending" \
  --repo patinaproject/bootstrap \
  --color c5def5 \
  --description "Reserved for Release Please. Applied automatically to the open release PR; do not apply manually."
```

- [ ] **Step 3: Post-write verification (run by operator or Executor after the write lands)**

```bash
gh label list --repo patinaproject/bootstrap --json name,color,description \
  --jq '.[] | select(.name=="autorelease: pending")'
```

Expected: `color` remains `c5def5`; `description` is the non-empty string from Step 2.

Also run the AGENTS.md empty-description audit:

```bash
gh label list --repo patinaproject/bootstrap --json name,description \
  --jq '.[] | select(.description == "")'
```

Expected: no output for `autorelease: pending` (any other empty-description labels are out of scope for this issue).

- [ ] **Step 4: No commit**

This task produces no repo diff. Record the post-write `gh label list` output in the PR description under `### AC-10-3` as verification evidence.

---

## Workstream C – Docs, skill guidance, audit checklist

### Task T7: Document reserved labels in live `AGENTS.md`

**ACs:** AC-10-4

**Files:**

- Modify: `AGENTS.md` (append to the `## Issue and PR labels` section, which currently ends after the `gh label list ... --jq '.[] | select(.description == "")'` code block around line 72).

- [ ] **Step 1: Failing assertion**

```bash
grep -c "autorelease: pending" AGENTS.md
```

Expected before change: `0`.

- [ ] **Step 2: Append the reservation paragraph**

After the existing empty-description check code block in the `## Issue and PR labels` section, append:

```markdown
The `autorelease: pending` and `autorelease: tagged` labels are reserved for Release Please automation. Release Please applies `autorelease: pending` to the open release PR and `autorelease: tagged` after the release tag is cut. Never apply or remove these labels manually; PR-title lint is intentionally skipped while `autorelease: pending` is present so release PRs can keep their `chore: release <version>` title.
```

- [ ] **Step 3: Verify**

```bash
grep -c "autorelease: pending" AGENTS.md
grep -c "autorelease: tagged" AGENTS.md
```

Expected: each prints at least `1`.

- [ ] **Step 4: Lint markdown**

```bash
pnpm lint:md
```

Expected: exit code `0`.

- [ ] **Step 5: Commit**

```bash
git add AGENTS.md
git commit -m "docs: #10 reserve autorelease labels in AGENTS.md"
```

### Task T8: Mirror the reservation into the core template `AGENTS.md.tmpl`

**ACs:** AC-10-4

**Files:**

- Modify: `skills/bootstrap/templates/core/AGENTS.md.tmpl` (the `## Issue and PR labels` section ends at line 64 area with the same empty-description check code block).

- [ ] **Step 1: Failing assertion**

```bash
grep -c "autorelease: pending" skills/bootstrap/templates/core/AGENTS.md.tmpl
```

Expected: `0`.

- [ ] **Step 2: Append the same paragraph as T7 step 2**

Use the identical wording from T7 step 2, appended after the empty-description code block in the template.

- [ ] **Step 3: Verify**

```bash
grep -c "autorelease: pending" skills/bootstrap/templates/core/AGENTS.md.tmpl
```

Expected: `1` or more.

- [ ] **Step 4: Lint markdown**

```bash
pnpm lint:md
```

Expected: exit code `0`.

- [ ] **Step 5: Commit**

```bash
git add skills/bootstrap/templates/core/AGENTS.md.tmpl
git commit -m "docs: #10 reserve autorelease labels in AGENTS template"
```

### Task T9: Document reserved labels + audit step in `skills/bootstrap/SKILL.md`

**ACs:** AC-10-4

**Files:**

- Modify: `skills/bootstrap/SKILL.md`

- [ ] **Step 1: Read the file and pick the right section**

Read `skills/bootstrap/SKILL.md` end-to-end. Pick the section that describes audit behaviour for labels or GitHub metadata. If no label-specific section exists, add a short `### Reserved labels` subsection under the existing audit guidance (e.g. under the "GitHub repository settings" or "Realignment" section – whichever exists; locate via `grep -n '^##' skills/bootstrap/SKILL.md`).

- [ ] **Step 2: Failing assertion**

```bash
grep -c "autorelease: pending" skills/bootstrap/SKILL.md
```

Expected: `0`.

- [ ] **Step 3: Add the guidance**

Insert the following block in the chosen section:

```markdown
### Reserved labels

The `autorelease: pending` and `autorelease: tagged` labels are owned by Release Please. In realignment mode, verify that `autorelease: pending` exists with color `c5def5` and a non-empty description explaining the reservation; if either is missing or divergent, recommend a `gh label edit` fix. Never instruct agents to apply or remove these labels manually.
```

- [ ] **Step 4: Verify**

```bash
grep -c "autorelease: pending" skills/bootstrap/SKILL.md
```

Expected: `1` or more.

- [ ] **Step 5: Lint markdown**

```bash
pnpm lint:md
```

Expected: exit code `0`.

- [ ] **Step 6: Commit**

```bash
git add skills/bootstrap/SKILL.md
git commit -m "docs: #10 document reserved autorelease labels in SKILL.md"
```

### Task T10: Add audit row for `autorelease: pending` to `skills/bootstrap/audit-checklist.md`

**ACs:** AC-10-4

**Files:**

- Modify: `skills/bootstrap/audit-checklist.md` – extend Area 2 (GitHub metadata) with a new row, or add a dedicated sub-table for labels below the Area 2 table.

- [ ] **Step 1: Failing assertion**

```bash
grep -c "autorelease: pending" skills/bootstrap/audit-checklist.md
```

Expected: `0`.

- [ ] **Step 2: Add the row**

Immediately after the Area 2 table (after the `.github/actionlint.yaml` row), insert the following sub-section:

```markdown
### Reserved GitHub labels

| Label | Required | Check |
|---|---|---|
| `autorelease: pending` | yes | present; color `c5def5`; description non-empty and documents that the label is reserved for Release Please automation; confirm via `gh label list --repo <owner>/<repo> --json name,color,description --jq '.[] | select(.name=="autorelease: pending")'` |
```

- [ ] **Step 3: Verify**

```bash
grep -c "autorelease: pending" skills/bootstrap/audit-checklist.md
```

Expected: `1` or more.

- [ ] **Step 4: Lint markdown**

```bash
pnpm lint:md
```

Expected: exit code `0`.

- [ ] **Step 5: Commit**

```bash
git add skills/bootstrap/audit-checklist.md
git commit -m "docs: #10 audit autorelease pending label in checklist"
```

---

## End-to-end verification

Run these from the repo root after all tasks land. A reviewer uses this block to confirm every AC.

- [ ] **AC-10-1 – title pattern in both configs**

```bash
jq -e '."pull-request-title-pattern" == "chore: release ${version}"' release-please-config.json
jq -e '."pull-request-title-pattern" == "chore: release ${version}"' skills/bootstrap/templates/agent-plugin/release-please-config.json
diff release-please-config.json skills/bootstrap/templates/agent-plugin/release-please-config.json
```

Expected: both `jq -e` print `true`, `diff` shows no output.

- [ ] **AC-10-2 – lint-pr guarded in both workflows**

```bash
grep -c "autorelease: pending" .github/workflows/lint-pr.yml
grep -c "autorelease: pending" skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
diff .github/workflows/lint-pr.yml skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
grep -c "dependabot\[bot\]" .github/workflows/lint-pr.yml
actionlint .github/workflows/lint-pr.yml skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
```

Expected: both `grep -c "autorelease: pending"` print `3`; `diff` shows no output; dependabot guard count is `1`; `actionlint` exits `0`. After the next Release Please PR opens, confirm in the GitHub Actions UI that `title-format`, `closing-keyword`, and `mark-breaking-change` report "skipped" on it.

- [ ] **AC-10-3 – label description present**

```bash
gh label list --repo patinaproject/bootstrap --json name,color,description \
  --jq '.[] | select(.name=="autorelease: pending")'
gh label list --repo patinaproject/bootstrap --json name,description \
  --jq '.[] | select(.description == "")'
```

Expected: first command shows `color` `c5def5` and a non-empty `description`; second command produces no row containing `"name":"autorelease: pending"`.

- [ ] **AC-10-4 – docs + audit checklist carry the reservation**

```bash
grep -l "autorelease: pending" \
  AGENTS.md \
  skills/bootstrap/templates/core/AGENTS.md.tmpl \
  skills/bootstrap/SKILL.md \
  skills/bootstrap/audit-checklist.md
pnpm lint:md
```

Expected: all four paths print; `pnpm lint:md` exits `0`.

---

## Notes for the Executor

- Start with Workstream A (cheapest, unlocks nothing else) or Workstream B (most risk – get actionlint feedback early). Both are independent.
- T6 (label backfill) is a live GitHub write – do not run `gh label edit` yourself. Prepare the exact command and wait for operator confirmation.
- Commit frequently using `type: #10 short description` (≤72 chars, no scope). See the per-task commit commands.
- If `pnpm lint:md` fails on any doc task, fix the markdown (list spacing, table pipes, trailing newline) and re-run before committing.
- Do not modify `release.yml`, `.release-please-manifest.json`, or `CHANGELOG.md` – this plan deliberately leaves the Release Please workflow and manifest untouched.
