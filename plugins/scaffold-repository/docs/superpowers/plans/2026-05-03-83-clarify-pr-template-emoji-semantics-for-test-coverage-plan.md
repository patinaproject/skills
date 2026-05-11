# Clarify PR Template Emoji Semantics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clarify PR template test coverage symbols so `❌` means missing tests, `⚠️` means acknowledged gap or warning, and every matrix `⚠️` has matching per-AC `⚠️ Test gap:` detail.

**Architecture:** Update the bootstrap template source first, mirror it to the root PR template, and keep `docs/ac-traceability.md` as a pointer to the template grammar. Verification is text-based because this is a workflow-contract wording change.

**Tech Stack:** Markdown, `rg`, `cmp`, `pnpm exec markdownlint-cli2`.

---

## Task 1: RED Baseline

**Files:**

- Read: `skills/bootstrap/templates/core/.github/pull_request_template.md`
- Read: `.github/pull_request_template.md`

- [ ] **Step 1: Capture the current stale symbol semantics**

Run:

```bash
rg -n "❌ = required validation missing, failing, or blocked by an unresolved gap|If required validation is still pending, use `❌`" \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  .github/pull_request_template.md
```

Expected: four matches total, proving the current template uses `❌` for
unresolved gaps or pending validation.

- [ ] **Step 2: Capture the missing matrix-warning linkage**

Run:

```bash
rg -n "every `⚠️`|matrix.*⚠️|⚠️.*matrix|corresponding.*Test gap" \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  .github/pull_request_template.md || true
```

Expected: no output, proving the current template does not explicitly require
every matrix warning to have corresponding per-AC `⚠️ Test gap:` detail.

## Task 2: Template Source Update

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md`

- [ ] **Step 1: Update the symbol legend in the template source**

In `skills/bootstrap/templates/core/.github/pull_request_template.md`, replace:

```markdown
  ✅ = required validation passed, with no blocking gap for this column
  ❌ = required validation missing, failing, or blocked by an unresolved gap
  ➖ = not relevant to this AC
```

with:

```markdown
  ✅ = required validation passed, with no blocking gap for this column
  ❌ = tests that should exist are missing
  ⚠️ = required validation has an acknowledged gap, warning, unresolved
       concern, or failing/pending state that needs reviewer attention
  ➖ = not relevant to this AC
```

- [ ] **Step 2: Update the follow-on matrix instruction**

In the same file, replace:

```markdown
  Use `➖` only when that verification type is not relevant to the AC. If an AC
  includes evidence, a test gap, or an operator check that clearly maps to a
  matrix column, that cell must not be `➖`. If required validation is still
  pending, use `❌` and add a test-gap checkbox until that validation passes.
```

with:

```markdown
  Use `➖` only when that verification type is not relevant to the AC. If an AC
  includes evidence, a test gap, or an operator check that clearly maps to a
  matrix column, that cell must not be `➖`. Every `⚠️` matrix cell must have
  one or more corresponding `⚠️ Test gap:` checkboxes under that AC. If required
  validation is failing, pending, blocked by an unresolved concern, or otherwise
  cannot yet be trusted, use `⚠️` and add a test-gap checkbox until that
  validation passes.
```

- [ ] **Step 3: Tighten the test-gap checkbox guidance**

In the same file, replace:

```markdown
  Example: - [ ] ⚠️ Test gap: <observable behavior or validation not verified>
```

with:

```markdown
  Every `⚠️ Test gap:` that maps to a matrix column must have a corresponding
  `⚠️` cell in that AC's matrix row.
  Example: - [ ] ⚠️ Test gap: <observable behavior or validation not verified>
```

## Task 3: Mirror and Traceability Check

**Files:**

- Modify: `.github/pull_request_template.md`
- Read or modify: `docs/ac-traceability.md`

- [ ] **Step 1: Mirror the template source to the root PR template**

Run:

```bash
cp skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md
```

Expected: no output.

- [ ] **Step 2: Verify template parity**

Run:

```bash
cmp -s .github/pull_request_template.md skills/bootstrap/templates/core/.github/pull_request_template.md
```

Expected: exit 0.

- [ ] **Step 3: Check `docs/ac-traceability.md` for contradictions**

Run:

```bash
rg -n "❌|⚠️|required validation missing|unresolved gap|pending" docs/ac-traceability.md
```

Expected: no stale `❌` semantics. If the file only delegates grammar to the PR
template without defining symbol meanings, do not edit it.

## Task 4: GREEN Verification

**Files:**

- Read: `skills/bootstrap/templates/core/.github/pull_request_template.md`
- Read: `.github/pull_request_template.md`
- Read: `docs/ac-traceability.md`
- Read: `docs/superpowers/specs/2026-05-03-83-clarify-pr-template-emoji-semantics-for-test-coverage-design.md`
- Read: `docs/superpowers/plans/2026-05-03-83-clarify-pr-template-emoji-semantics-for-test-coverage-plan.md`

- [ ] **Step 1: Verify clarified symbol meanings exist in both templates**

Run:

```bash
rg -n "❌ = tests that should exist are missing|⚠️ = required validation has an acknowledged gap|Every `⚠️` matrix cell must have" \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  .github/pull_request_template.md
```

Expected: each pattern appears in both files.

- [ ] **Step 2: Verify stale `❌` gap semantics are gone**

Run:

```bash
rg -n "❌ = required validation missing|use `❌` and add a test-gap|blocked by an unresolved gap" \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  .github/pull_request_template.md
```

Expected: no output and exit 1.

- [ ] **Step 3: Pressure-test a sample PR excerpt**

Inspect this sample against the updated template instructions:

```markdown
| AC | Title | Unit |
| --- | --- | --- |
| AC-83-1 | Missing expected unit tests | ❌ |
| AC-83-2 | Acknowledged coverage warning | ⚠️ |

### AC-83-1

Tests that should exist are missing.

### AC-83-2

Required validation has an acknowledged warning.

- [ ] ⚠️ Test gap: Unit test does not exercise the warning path yet.
```

Expected: `AC-83-1` uses `❌` with no `⚠️ Test gap:` requirement because tests
that should exist are missing. `AC-83-2` uses `⚠️` and includes matching
per-AC `⚠️ Test gap:` detail.

- [ ] **Step 4: Run Markdown lint**

Run:

```bash
pnpm exec markdownlint-cli2 \
  docs/superpowers/specs/2026-05-03-83-clarify-pr-template-emoji-semantics-for-test-coverage-design.md \
  docs/superpowers/plans/2026-05-03-83-clarify-pr-template-emoji-semantics-for-test-coverage-plan.md \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  .github/pull_request_template.md \
  docs/ac-traceability.md
```

Expected: zero errors.

## Task 5: Implementation Commit

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md`
- Modify: `.github/pull_request_template.md`
- Modify: `docs/ac-traceability.md` only if Task 3 finds stale contradictory wording
- Create: `docs/superpowers/plans/2026-05-03-83-clarify-pr-template-emoji-semantics-for-test-coverage-plan.md`

- [ ] **Step 1: Review the final diff**

Run:

```bash
git diff --stat && git diff -- \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  .github/pull_request_template.md \
  docs/ac-traceability.md \
  docs/superpowers/plans/2026-05-03-83-clarify-pr-template-emoji-semantics-for-test-coverage-plan.md
```

Expected: diff is limited to the planned files.

- [ ] **Step 2: Commit the plan and implementation**

Run:

```bash
git add \
  docs/superpowers/plans/2026-05-03-83-clarify-pr-template-emoji-semantics-for-test-coverage-plan.md \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  .github/pull_request_template.md \
  docs/ac-traceability.md
git commit -m "feat: #83 clarify PR template test coverage symbols"
```

Expected: commit succeeds.

## Planner Self-Review

- Spec coverage: Task 2 covers R1-R6 and R9-R11, Task 3 covers R7-R8, Task 4
  covers all ACs plus RED/GREEN pressure-test verification.
- Placeholder scan: no `TBD`, `TODO`, or deferred implementation placeholders
  remain.
- Scope check: no plan task introduces automated PR-body linting or template
  section redesign.
