# Clarify Commit Types for Release-Triggering Product Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update Bootstrap-generated guidance so product-surface changes use release-triggering commit types and explanatory-only documentation keeps `docs:`.

**Architecture:** Edit the authoritative templates under `skills/bootstrap/templates/**` first, then mirror the generated baseline files in the repository root through the local bootstrap realignment loop. Keep the change policy-only: no commitlint or Release Please configuration changes.

**Tech Stack:** Markdown templates, Bootstrap skill realignment, PNPM, markdownlint-cli2, git.

---

## Task 1: Add Commit Type Selection Guidance

**Files:**

- Modify: `skills/bootstrap/templates/core/AGENTS.md.tmpl`
- Modify: `skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl`
- Modify: `skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md`
- Modify: `skills/bootstrap/templates/agent-plugin/README.md.tmpl`

- [ ] **Step 1: Update agent-facing commit guidance**

Add a "Commit type selection" subsection under the commit guidance in
`skills/bootstrap/templates/core/AGENTS.md.tmpl`. It must say:

```markdown
### Commit type selection

Choose the commit type by product impact, not by file extension.

| Change | Type |
|--------|------|
| Adds or changes shipped behavior, including behavior expressed in Markdown skill files, workflow gates, prompt contracts, plugin metadata, marketplace behavior, generated agent instructions, or other user-visible configuration | `feat:` |
| Corrects broken shipped behavior in those same product surfaces | `fix:` |
| Explains the product without changing shipped behavior or release semantics | `docs:` |
| Performs maintenance that does not alter user-facing behavior | `chore:` |

Edits to `skills/**/SKILL.md` and adjacent skill workflow contracts are product/runtime changes by default, not documentation edits. Use `docs:` for those files only when the change is clearly explanatory-only and does not alter installed skill behavior.

Changes that should produce a release must not use non-bumping types such as `docs:` or `chore:`. Use the release-triggering type that matches the product impact.
```

- [ ] **Step 2: Update human contributor guidance**

Add the same rule, with the same decision table, under `## Commit messages` in
`skills/bootstrap/templates/core/CONTRIBUTING.md.tmpl`.

- [ ] **Step 3: Update generated plugin README development guidance**

Replace the single sentence `Commits and PR titles follow...` in
`skills/bootstrap/templates/agent-plugin/README.md.tmpl` with a short paragraph
that points to `CONTRIBUTING.md`, includes the decision table, and states that
skill file edits are product/runtime changes by default.

- [ ] **Step 4: Update generated Copilot highlights**

Add one bullet to `skills/bootstrap/templates/agent-plugin/.github/copilot-instructions.md`
stating that behavior-changing skill, workflow, prompt, plugin metadata, and
marketplace changes must use release-triggering commit types even when the diff
is Markdown-only.

- [ ] **Step 5: Verify the template text**

Run:

```bash
rg -n "Commit type selection|product/runtime changes by default|must not use non-bumping|release-triggering" skills/bootstrap/templates
```

Expected: matches in `AGENTS.md.tmpl`, `CONTRIBUTING.md.tmpl`,
`README.md.tmpl`, and `.github/copilot-instructions.md`.

## Task 2: Document Release Please Bump Mapping

**Files:**

- Modify: `skills/bootstrap/templates/core/RELEASING.md`
- Modify: `skills/bootstrap/templates/patinaproject-supplement/RELEASING.md`

- [ ] **Step 1: Expand semver decision guidance**

Update `## Semver decision` in both release templates so it documents:

```markdown
Determined from releasable Conventional Commit types – no human choice:

- `fix:` -> patch
- `feat:` -> minor
- `<type>!:` or `BREAKING CHANGE:` footer -> major
- `docs:`, `chore:`, and other non-releasable types -> no version bump under this baseline

If a change should produce a release, do not use a non-bumping type. For example, a Markdown-only edit to `skills/**/SKILL.md` that changes installed skill behavior should use `feat:` or `fix:`, not `docs:`.
```

- [ ] **Step 2: Expand clean changelog guidance**

Update `## Writing commits for a clean changelog` in both release templates to
explain that Release Please can no-op when product changes are misclassified as
`docs:` or `chore:`, which can skip downstream marketplace bump automation.

- [ ] **Step 3: Verify release mapping text**

Run:

```bash
rg -n 'no version bump|If a change should produce a release|misclassified as `docs:`|marketplace bump' skills/bootstrap/templates/core/RELEASING.md skills/bootstrap/templates/patinaproject-supplement/RELEASING.md
```

Expected: both files include the no-bump rule, release-worthy warning, and
misclassification consequence.

## Task 3: Mirror Template Changes to Root Baseline

**Files:**

- Modify: `AGENTS.md`
- Modify: `CONTRIBUTING.md`
- Modify: `RELEASING.md`
- Modify: `README.md`
- Modify: `.github/copilot-instructions.md`

- [ ] **Step 1: Run local bootstrap realignment**

Run the repository's local bootstrap skill against this repo in realignment mode
and accept the proposed root diff so root generated files match the templates.

- [ ] **Step 2: Verify mirrored surfaces**

Run:

```bash
rg -n 'Commit type selection|product/runtime changes by default|no version bump|must not use non-bumping|misclassified as `docs:`' AGENTS.md CONTRIBUTING.md RELEASING.md README.md .github/copilot-instructions.md
```

Expected: the root files contain the same commit-type and release-mapping
guidance emitted by the templates.

## Task 4: Validate and Commit Implementation

**Files:**

- All modified templates, mirrored root files, design doc, and plan doc.

- [ ] **Step 1: Run markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: `Summary: 0 error(s)`.

- [ ] **Step 2: Review final diff**

Run:

```bash
git diff -- skills/bootstrap/templates AGENTS.md CONTRIBUTING.md RELEASING.md README.md .github/copilot-instructions.md docs/superpowers
```

Expected: only issue #48 guidance, design, and plan changes are present.

- [ ] **Step 3: Commit**

Run:

```bash
git add skills/bootstrap/templates AGENTS.md CONTRIBUTING.md RELEASING.md README.md .github/copilot-instructions.md docs/superpowers
git commit -m "feat: #48 clarify release-triggering commit types"
```

Expected: commit succeeds, including Husky markdown lint and plugin version
checks.

## Self-Review

- Spec coverage: Task 1 covers AC-48-1, AC-48-2, and AC-48-3. Task 2 covers
  AC-48-4 plus the approved deltas about Release Please bump mapping and
  avoiding non-bumping types for release-worthy changes. Task 3 covers the
  template-first/root-mirror repository rule.
- Placeholder scan: no TBD/TODO placeholders remain.
- Scope check: the plan is policy text only and avoids commitlint or Release
  Please configuration changes.
