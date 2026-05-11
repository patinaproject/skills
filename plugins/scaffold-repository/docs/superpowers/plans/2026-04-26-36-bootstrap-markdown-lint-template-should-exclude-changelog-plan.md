# Bootstrap markdown lint template should exclude CHANGELOG Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the bootstrap core markdown lint workflow template exclude `CHANGELOG.md`, matching the repository root workflow and package lint script.

**Architecture:** This is a baseline-template alignment change. The canonical source is `skills/bootstrap/templates/core/.github/workflows/lint-md.yml`; the root workflow is checked as the current generated mirror and only changes if verification shows drift.

**Tech Stack:** GitHub Actions YAML, `markdownlint-cli2`, pnpm scripts, repository-owned bootstrap templates.

---

## Task 1: Capture the Current Mismatch

**Files:**

- Inspect: `skills/bootstrap/templates/core/.github/workflows/lint-md.yml`
- Inspect: `.github/workflows/lint-md.yml`
- Inspect: `package.json`
- Inspect: `skills/bootstrap/templates/core/package.json.tmpl`

- [ ] **Step 1: Verify the template is missing the exclusion**

Run:

```bash
sed -n '1,80p' skills/bootstrap/templates/core/.github/workflows/lint-md.yml
```

Expected before implementation: the `globs` block contains `**/*.md` and `#node_modules`, but not `#CHANGELOG.md`.

- [ ] **Step 2: Verify the root workflow already has the exclusion**

Run:

```bash
sed -n '1,80p' .github/workflows/lint-md.yml
```

Expected before implementation: the `globs` block contains `#CHANGELOG.md`.

- [ ] **Step 3: Verify package lint scripts already exclude CHANGELOG**

Run:

```bash
rg -n '"lint:md"|#CHANGELOG.md' package.json skills/bootstrap/templates/core/package.json.tmpl
```

Expected before implementation: both package files contain `#CHANGELOG.md` in `lint:md`.

## Task 2: Align the Core Template Workflow

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/workflows/lint-md.yml`

- [ ] **Step 1: Add the missing template glob exclusion**

Change the `globs` block in `skills/bootstrap/templates/core/.github/workflows/lint-md.yml` to:

```yaml
          globs: |
            **/*.md
            #node_modules
            #CHANGELOG.md
```

- [ ] **Step 2: Verify root realignment is not needed**

Run:

```bash
diff -u skills/bootstrap/templates/core/.github/workflows/lint-md.yml .github/workflows/lint-md.yml
```

Expected after implementation: exit 0 and no output. If there is output, inspect whether it is a legitimate template-derived root drift; mirror only the required root workflow change and re-run this command.

## Task 3: Verify Acceptance Criteria and Commit

**Files:**

- Verify: `skills/bootstrap/templates/core/.github/workflows/lint-md.yml`
- Verify: `.github/workflows/lint-md.yml`
- Verify: `package.json`
- Verify: `skills/bootstrap/templates/core/package.json.tmpl`
- Verify: `docs/superpowers/specs/2026-04-26-36-bootstrap-markdown-lint-template-should-exclude-changelog-design.md`
- Verify: `docs/superpowers/plans/2026-04-26-36-bootstrap-markdown-lint-template-should-exclude-changelog-plan.md`

- [ ] **Step 1: Verify all workflow and package exclusions are present**

Run:

```bash
rg -n '#CHANGELOG.md|lint:md' skills/bootstrap/templates/core/.github/workflows/lint-md.yml .github/workflows/lint-md.yml package.json skills/bootstrap/templates/core/package.json.tmpl
```

Expected after implementation: output includes `#CHANGELOG.md` in both workflow files and both package lint scripts.

- [ ] **Step 2: Run markdown lint**

Run:

```bash
pnpm lint:md
```

Expected after implementation: exit 0 with `Summary: 0 error(s)`.

- [ ] **Step 3: Review the diff**

Run:

```bash
git diff -- skills/bootstrap/templates/core/.github/workflows/lint-md.yml docs/superpowers/plans/2026-04-26-36-bootstrap-markdown-lint-template-should-exclude-changelog-plan.md
```

Expected after implementation: the workflow template adds only `#CHANGELOG.md`, and the plan document is the only new planning artifact.

- [ ] **Step 4: Commit implementation handoff**

Run:

```bash
git add docs/superpowers/plans/2026-04-26-36-bootstrap-markdown-lint-template-should-exclude-changelog-plan.md skills/bootstrap/templates/core/.github/workflows/lint-md.yml
git commit -m "fix: #36 align markdown lint workflow template"
```

Expected after implementation: commit succeeds, including the plan and template alignment changes.

## Self-Review

- Spec coverage: Task 2 satisfies AC-36-1; Task 3 Step 1 and Step 2 satisfy AC-36-2.
- Placeholder scan: no deferred implementation work or ambiguous steps remain.
- Scope check: the plan changes one baseline template and verifies existing mirrors; no decomposition is needed.
