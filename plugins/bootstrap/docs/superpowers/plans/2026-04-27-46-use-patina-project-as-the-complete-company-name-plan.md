# Plan: Use Patina Project as the complete company name [#46](https://github.com/patinaproject/bootstrap/issues/46)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace shortened company-display prose with `Patina Project` while preserving identifiers, product names, and template/root baseline alignment.

**Architecture:** This is a documentation and template wording change. The source-of-truth edits happen in `skills/bootstrap/templates/**`; matching root mirrors and skill/docs prose are updated in the same branch, then verified with targeted searches and markdown linting.

**Tech Stack:** Markdown, JSON plugin manifests, ripgrep, pnpm markdownlint tooling.

---

## File Structure

- Modify `.codex-plugin/plugin.json`: update the Codex marketplace description wording so it uses `Patina Project baseline`.
- Modify `README.md`: update company-display wording in root docs.
- Modify `RELEASING.md`: mirror the release wording from the relevant template.
- Modify `skills/bootstrap/SKILL.md`: update skill-contract prose that uses shortened company-display wording.
- Modify `skills/bootstrap/templates/agent-plugin/README.md.tmpl`: update emitted README wording.
- Modify `skills/bootstrap/templates/core/RELEASING.md`: update emitted release wording for non-Patina Project repos.
- Modify `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md`: update emitted release wording for Patina Project repos.
- Modify historical Superpowers docs only when the sentence is ordinary company-display prose:
  - `docs/superpowers/specs/2026-04-24-1-create-bootstrap-claude-skill-for-repo-scaffolding-design.md`
  - `docs/superpowers/specs/2026-04-24-18-release-workflow-fails-to-create-github-release-design.md`
  - `docs/superpowers/plans/2026-04-24-18-release-workflow-fails-to-create-github-release-plan.md`
  - `docs/superpowers/specs/2026-04-25-26-release-workflow-dispatches-wrong-filename-design.md`
  - `docs/superpowers/plans/2026-04-25-26-release-workflow-dispatches-wrong-filename-plan.md`

## Task 1: Characterization Search

**Files:**

- Read only: repository Markdown and JSON files.

- [ ] **Step 1: Run the targeted candidate search**

Run:

```bash
rg -n "Patina Project|patina" README.md RELEASING.md .codex-plugin/plugin.json skills/bootstrap docs/superpowers
```

Expected: results include the known company-display candidates from issue #46 and may include historical Superpowers docs. The executor should record which hits are ordinary company-display prose and which are identifiers, product names, or immutable historical titles.

- [ ] **Step 2: Confirm product and identifier preservation boundaries**

Run:

```bash
rg -n "Patina Gallery|Patina Thunderdome|patinaproject|PATINAPROJECT|patina-project-automation" .
```

Expected: many hits remain. The executor should not edit these solely because they contain a product name or lowercase identifier.

## Task 2: Update Template-Owned Baseline Wording

**Files:**

- Modify: `skills/bootstrap/templates/agent-plugin/README.md.tmpl`
- Modify: `skills/bootstrap/templates/core/RELEASING.md`
- Modify: `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md`

- [ ] **Step 1: Update emitted README wording**

In `skills/bootstrap/templates/agent-plugin/README.md.tmpl`, update the
marketplace-registration headings and related-link sentence so they use:

```text
Register the Patina Project marketplace
marketplace distributing Patina Project plugins
```

Expected: both generated install snippets and the related-link sentence use `Patina Project`.

- [ ] **Step 2: Update core release wording**

In `skills/bootstrap/templates/core/RELEASING.md`, update company-display prose
so it uses:

```text
outside Patina Project
Patina Project-specific secret
Patina Project marketplace manifest
```

Expected: repository owner identifiers such as `patinaproject` and workflow names such as `plugin-release-bump.yml` remain unchanged.

- [ ] **Step 3: Update Patina Project supplement release wording**

Apply the same replacements from Step 2 to `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md`.

Expected: the supplement keeps `patinaproject` identifiers and GitHub App/workflow names unchanged.

## Task 3: Mirror Root Baseline and Skill Wording

**Files:**

- Modify: `.codex-plugin/plugin.json`
- Modify: `README.md`
- Modify: `RELEASING.md`
- Modify: `skills/bootstrap/SKILL.md`

- [ ] **Step 1: Update root README wording**

In `README.md`, update company-display prose so it uses:

```text
Patina Project marketplace plugins
Register the Patina Project marketplace
marketplace distributing Patina Project plugins
```

Expected: install commands and repository slugs remain unchanged.

- [ ] **Step 2: Update root release wording**

Mirror the relevant release wording from `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md` into `RELEASING.md`.

Expected: root `RELEASING.md` uses `outside Patina Project`, `Patina Project-specific secret`, and `Patina Project marketplace manifest`.

- [ ] **Step 3: Update skill-contract wording**

In `skills/bootstrap/SKILL.md`, update company-display prose so it uses:

```text
Patina Project organization supplement
repos outside Patina Project
Patina Project-specific plumbing
canonical Patina Project plugins
```

Expected: `patinaproject` owner detection and supplement paths remain unchanged.

- [ ] **Step 4: Update Codex plugin metadata wording**

In `.codex-plugin/plugin.json`, ensure `shortDescription` uses:

```json
"shortDescription": "Scaffold and realign repos to the Patina Project baseline"
```

Expected: valid JSON remains valid.

## Task 4: Update Historical Company-Display Prose

**Files:**

- Modify: `docs/superpowers/specs/2026-04-24-1-create-bootstrap-claude-skill-for-repo-scaffolding-design.md`
- Modify: `docs/superpowers/specs/2026-04-24-18-release-workflow-fails-to-create-github-release-design.md`
- Modify: `docs/superpowers/plans/2026-04-24-18-release-workflow-fails-to-create-github-release-plan.md`
- Modify: `docs/superpowers/specs/2026-04-25-26-release-workflow-dispatches-wrong-filename-design.md`
- Modify: `docs/superpowers/plans/2026-04-25-26-release-workflow-dispatches-wrong-filename-plan.md`

- [ ] **Step 1: Update ordinary company-display prose in historical docs**

Update ordinary company-display prose in these historical docs so it uses:

```text
canonical Patina Project plugins
The Patina Project marketplace
Patina Project-specific secret
The Patina Project supplement
Patina Project supplement variant
```

Expected: issue titles, links, generated filenames, product/domain names, and identifiers remain unchanged.

## Task 5: Verification

**Files:**

- Read only: repository Markdown and JSON files.

- [ ] **Step 1: Verify shortened company-display phrases are gone**

Run:

```bash
rg -n "Patina Project|patina" README.md RELEASING.md .codex-plugin/plugin.json skills/bootstrap docs/superpowers
```

Expected: no hits that are shortened company-display prose remain. Any remaining hit must be explained as a complete `Patina Project` company reference, product/domain name, identifier, immutable historical title, or intentionally documented search/audit instruction.

- [ ] **Step 2: Verify identifiers and product names still exist**

Run:

```bash
rg -n "Patina Gallery|Patina Thunderdome|patinaproject|PATINAPROJECT|patina-project-automation" .
```

Expected: relevant identifiers and product/domain terms still appear.

- [ ] **Step 3: Validate JSON**

Run:

```bash
node -e 'JSON.parse(require("fs").readFileSync(".codex-plugin/plugin.json", "utf8")); console.log("ok")'
```

Expected: prints `ok`.

- [ ] **Step 4: Run markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: passes. If `pnpm lint:md` cannot run because dependencies are missing, run `pnpm install` and then rerun `pnpm lint:md`.

## Task 6: Commit Implementation

**Files:**

- Commit all implementation and verification-relevant changes from Tasks 2-5.

- [ ] **Step 1: Review the diff**

Run:

```bash
git diff --check
git diff --stat
```

Expected: no whitespace errors; diff stat only includes docs/templates/plugin metadata touched by this issue.

- [ ] **Step 2: Commit implementation**

Run:

```bash
git add .codex-plugin/plugin.json README.md RELEASING.md skills/bootstrap/SKILL.md skills/bootstrap/templates/agent-plugin/README.md.tmpl skills/bootstrap/templates/core/RELEASING.md skills/bootstrap/templates/patinaproject-supplement/RELEASING.md docs/superpowers/specs/2026-04-24-1-create-bootstrap-claude-skill-for-repo-scaffolding-design.md docs/superpowers/specs/2026-04-24-18-release-workflow-fails-to-create-github-release-design.md docs/superpowers/plans/2026-04-24-18-release-workflow-fails-to-create-github-release-plan.md docs/superpowers/specs/2026-04-25-26-release-workflow-dispatches-wrong-filename-design.md docs/superpowers/plans/2026-04-25-26-release-workflow-dispatches-wrong-filename-plan.md
git commit -m "docs: #46 standardize Patina Project name"
```

Expected: commit succeeds with a conventional commit subject that includes issue `#46`.
