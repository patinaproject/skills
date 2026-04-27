# Use Patina Project As The Complete Company Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update incomplete public-facing company-name prose from `Patina` to `Patina Project` while preserving all `patina` and `patinaproject` identifiers.

**Architecture:** Keep the change scoped to documentation prose. Use repository-wide text searches as the verification boundary so implementation can prove the known wording is fixed and identifier strings remain intentional.

**Tech Stack:** Markdown documentation, ripgrep, markdownlint-cli2 via `pnpm`.

---

Issue: [patinaproject/skills#33](https://github.com/patinaproject/skills/issues/33)
Design: [2026-04-27-33-use-patina-project-as-the-complete-company-name-design.md](../specs/2026-04-27-33-use-patina-project-as-the-complete-company-name-design.md)

## File Structure

- Modify: `docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md`
  - Responsibility: historical planning artifact containing the known incomplete public-facing phrase.
- Preserve: `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, `package.json`, `README.md`, `AGENTS.md`, and other docs containing intentional identifiers.
  - Responsibility: provide audit evidence that identifiers and already-complete `Patina Project` prose remain unchanged.

## Workstreams

Single linear workstream: audit, update one prose phrase, verify.

## Tasks

### Task 1: Audit Existing Company-Name And Identifier Matches

**Files:**

- Inspect: `docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md`
- Inspect: `docs/`
- Inspect: `.agents/plugins/marketplace.json`
- Inspect: `.claude-plugin/marketplace.json`
- Inspect: `README.md`
- Inspect: `AGENTS.md`
- Inspect: `CLAUDE.md`
- Inspect: `package.json`

- [ ] **Step 1: Search for complete and incomplete company-name wording**

Run:

```bash
rg -n '\bPatina\b|patina' docs .agents .claude-plugin README.md AGENTS.md CLAUDE.md package.json
```

Expected: output includes the known incomplete phrase `other Patina plugins` in
`docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md`.
Other `patina` matches are identifiers such as `patinaproject/skills`,
`patinaproject-skills`, GitHub URLs, package metadata, domains, or already
complete `Patina Project` wording.

### Task 2: Update Incomplete Public-Facing Prose

**Files:**

- Modify: `docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md`

- [ ] **Step 1: Replace the known incomplete company-name phrase**

Change this acceptance criteria line:

```markdown
- **AC-22-1** (manifest lists `github-flows` alongside other Patina plugins with the same shape): satisfied by the automated bump PR opened when `v0.1.0` is published, **not by this PR**. This PR documents the contract that the bump PR must fulfill.
```

To:

```markdown
- **AC-22-1** (manifest lists `github-flows` alongside other Patina Project plugins with the same shape): satisfied by the automated bump PR opened when `v0.1.0` is published, **not by this PR**. This PR documents the contract that the bump PR must fulfill.
```

### Task 3: Verify Acceptance Criteria

**Files:**

- Verify: `docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md`
- Verify: `docs/`
- Verify: `.agents/plugins/marketplace.json`
- Verify: `.claude-plugin/marketplace.json`
- Verify: `README.md`
- Verify: `AGENTS.md`
- Verify: `CLAUDE.md`
- Verify: `package.json`

- [ ] **Step 1: Confirm the changed sentence uses the complete company name**

Run:

```bash
rg -n 'other Patina Project plugins|other Patina plugins' docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md
```

Expected: one match for `other Patina Project plugins` and no match for
`other Patina plugins`.

- [ ] **Step 2: Confirm remaining `Patina` prose is complete company-name wording**

Run:

```bash
rg -n 'other Patina plugins' docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md
```

Expected: no output. Then run this broader audit:

```bash
rg -n '\bPatina\b' docs README.md AGENTS.md CLAUDE.md .agents .claude-plugin package.json
```

Expected broader audit interpretation: capitalized prose matches are either
complete `Patina Project` wording, issue #33 meta-documentation describing the
old wording under correction, or already-approved historical design discussion
whose active target line has been corrected.

- [ ] **Step 3: Confirm identifier uses remain intentionally unchanged**

Run:

```bash
rg -n 'patinaproject|patinaproject-skills|patinaproject\.com' docs README.md AGENTS.md CLAUDE.md .agents .claude-plugin package.json
```

Expected: matches remain as slugs, URLs, package/catalog identifiers, or email
and domain values. Do not modify them for this issue.

- [ ] **Step 4: Run Markdown lint**

Run:

```bash
pnpm exec markdownlint-cli2 docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md docs/superpowers/specs/2026-04-27-33-use-patina-project-as-the-complete-company-name-design.md docs/superpowers/plans/2026-04-27-33-use-patina-project-as-the-complete-company-name-plan.md
```

Expected: `Summary: 0 error(s)`.

### Task 4: Commit Implementation

**Files:**

- Commit: `docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md`
- Commit: `docs/superpowers/plans/2026-04-27-33-use-patina-project-as-the-complete-company-name-plan.md`

- [ ] **Step 1: Review the diff**

Run:

```bash
git diff -- docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md docs/superpowers/plans/2026-04-27-33-use-patina-project-as-the-complete-company-name-plan.md
```

Expected: diff shows the one wording change plus this implementation plan.

- [ ] **Step 2: Commit the plan and implementation**

Run:

```bash
git add docs/superpowers/specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md docs/superpowers/plans/2026-04-27-33-use-patina-project-as-the-complete-company-name-plan.md
git commit -m "docs: #33 use complete company name"
```

Expected: commit succeeds after lint-staged Markdown checks.

## Blockers

None.

## Out Of Scope

- Renaming GitHub organization or repository slugs.
- Renaming marketplace identifiers such as `patinaproject-skills`.
- Renaming package names, URLs, domains, or email addresses.
- General copyediting of unrelated historical planning artifacts.
