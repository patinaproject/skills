# Plan: Omit empty Do before merging sections from PR bodies [#73](https://github.com/patinaproject/bootstrap/issues/73)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the PR body contract so `Do before merging` appears only when work-specific operator steps exist.

**Architecture:** This is a template-first documentation contract change. Edit the bootstrap source template first, mirror the root files, and verify root/template parity plus rendered PR body examples.

**Tech Stack:** Markdown templates, repository guidance, shell checks, `pnpm lint:md`.

---

## Workstreams

1. Template contract
   - Update `skills/bootstrap/templates/core/.github/pull_request_template.md`.
   - Mirror `.github/pull_request_template.md`.
   - Add a lightweight rendered-body check for both absent and present `Do before merging` cases.

2. Guidance alignment
   - Update `skills/bootstrap/templates/core/AGENTS.md.tmpl`.
   - Mirror `AGENTS.md`.
   - Keep canonical section-order wording conditional: when present, `Do before merging` sits between `What changed` and `Test coverage`.

3. Verification and PR handoff
   - Compare root and template PR templates.
   - Search for stale filler guidance.
   - Run markdown lint.
   - Render the PR body without `Do before merging` because this issue has no operator steps.

## Task Mapping

- T73-1 covers AC-73-1 and AC-73-2 by changing the PR template contract and rendered examples.
- T73-2 covers AC-73-3 by aligning root guidance with template guidance.
- T73-3 covers all ACs with parity, stale-text, and lint verification.

## Tasks

### Task T73-1: Template contract

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md`
- Modify: `.github/pull_request_template.md`

- [ ] **Step 1: Capture the current failing baseline**

Run:

```bash
rg -n "## Do before merging|Omit this section's checklist|No work-specific pre-merge operator steps" .github/pull_request_template.md skills/bootstrap/templates/core/.github/pull_request_template.md
```

Expected before implementation: both PR templates contain `## Do before merging`, and the comment only says to omit the checklist when no steps exist.

- [ ] **Step 2: Update the bootstrap source template**

In `skills/bootstrap/templates/core/.github/pull_request_template.md`, replace the visible `## Do before merging` heading plus comment with an HTML comment that instructs authors to add the whole section only when needed. Use this exact wording:

```markdown
<!--
  Include this section only when work-specific operator steps must happen after
  review and before merge:

  ## Do before merging

  - [ ] Rotate the production secret after deploy.

  Keep checklist items concrete and actionable. Do not add this section for
  placeholders such as `None`, `N/A`, or `No work-specific pre-merge operator
  steps.`
  Visible unchecked checkboxes are enforced by the `Required template
  checkboxes` status check. To include an intentionally optional checkbox, put
  `<!-- pr-checkbox: optional -->` immediately above that checkbox.
-->
```

- [ ] **Step 3: Mirror the root PR template**

Copy the same change into `.github/pull_request_template.md`.

- [ ] **Step 4: Verify template parity**

Run:

```bash
cmp -s .github/pull_request_template.md skills/bootstrap/templates/core/.github/pull_request_template.md
```

Expected: exit 0.

### Task T73-2: Guidance alignment

**Files:**

- Modify: `skills/bootstrap/templates/core/AGENTS.md.tmpl`
- Modify: `AGENTS.md`

- [ ] **Step 1: Update template guidance**

Change `skills/bootstrap/templates/core/AGENTS.md.tmpl` so:

- The `.github/pull_request_template.md` guidance lists `Do before merging` as conditional.
- The PR guideline says to include a `Do before merging` section only for work-specific operator pre-merge steps.

- [ ] **Step 2: Mirror root guidance**

Apply the same wording changes to `AGENTS.md`.

- [ ] **Step 3: Verify stale wording is gone**

Run:

```bash
rg -n "must use the template's section headings \\(`Linked issue`, `What changed`, `Do before merging`, `Test coverage`, `Acceptance criteria`\\)|what changed, a `Do before merging` section" AGENTS.md skills/bootstrap/templates/core/AGENTS.md.tmpl
```

Expected: no output.

### Task T73-3: Verification

**Files:** no additional modifications expected.

- [ ] **Step 1: Verify rendered no-steps PR body omits the section**

Run:

```bash
tmp=$(mktemp)
printf '%s\n' \
  '## Linked issue' '' 'Closes #73' '' \
  '## What changed' '' '- Updated PR body guidance.' '' \
  '## Test coverage' '' '| AC | Title | Unit |' '| --- | --- | --- |' '| AC-73-1 | Empty pre-merge section omitted | ✅ tested |' '' \
  '## Acceptance criteria' '' '### AC-73-1' '' 'The section is omitted when no operator steps exist.' > "$tmp"
! rg -n '^## Do before merging$|No work-specific pre-merge operator steps' "$tmp"
```

Expected: exit 0.

- [ ] **Step 2: Verify rendered steps PR body keeps the section in order**

Run:

```bash
tmp=$(mktemp)
printf '%s\n' \
  '## Linked issue' '' 'Closes #73' '' \
  '## What changed' '' '- Updated PR body guidance.' '' \
  '## Do before merging' '' '- [ ] Rotate the production secret after deploy.' '' \
  '## Test coverage' '' '| AC | Title | Unit |' '| --- | --- | --- |' '| AC-73-2 | Actionable steps retained | ✅ tested |' > "$tmp"
awk '/^## Linked issue$/{print "linked"} /^## What changed$/{print "changed"} /^## Do before merging$/{print "before"} /^## Test coverage$/{print "coverage"}' "$tmp" | paste -sd ' ' -
```

Expected output:

```text
linked changed before coverage
```

- [ ] **Step 3: Run repository checks**

Run:

```bash
cmp -s .github/pull_request_template.md skills/bootstrap/templates/core/.github/pull_request_template.md
git diff --check
pnpm lint:md
```

Expected: all commands pass.

## Blockers

None known.
