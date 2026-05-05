# Clarify Non-Blocking Warning Semantics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the PR-template coverage grammar so `⚠️` means validated enough to merge with a known non-blocking gap, while blocking or pending validation uses `❌`.

**Architecture:** The canonical source is `skills/bootstrap/templates/core/.github/pull_request_template.md`; the root `.github/pull_request_template.md` must mirror it exactly. `docs/ac-traceability.md` remains a compact pointer to the template grammar, and the checkbox checker keeps its existing syntax-only responsibility.

**Tech Stack:** Markdown templates, `markdownlint-cli2`, Node.js built-in test runner for the existing checkbox checker.

---

## File Structure

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md`
  - Owns the canonical PR-template grammar shipped by bootstrap.
- Modify: `.github/pull_request_template.md`
  - Mirrors the canonical template for this repository.
- Modify: `docs/ac-traceability.md`
  - Summarizes that non-blocking gap explanations may be prose or explicitly optional checkboxes, without duplicating the full grammar.
- Optional test-only change: `scripts/fixtures/pr-template-checkboxes/non-blocking-gap-optional.md`
  - Demonstrates that an explicitly optional non-blocking gap checkbox does not fail the required checkbox gate.
- Optional test-only change: `scripts/check-pr-template-checkboxes.test.mjs`
  - Adds one regression assertion only if the executor chooses to add the fixture above.

## Task 1: Update Canonical PR Template

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md`

- [ ] **Step 1: Confirm RED baseline strings exist**

Run:

```bash
rg -n "failing/pending state|Every `⚠️` matrix cell|Every `⚠️ Test gap:`|tests that should exist are missing" \
  skills/bootstrap/templates/core/.github/pull_request_template.md
```

Expected: output includes the current issue-83 wording that conflates `⚠️`
with failing/pending states and reverse maps `⚠️ Test gap:` rows to matrix
`⚠️` cells.

- [ ] **Step 2: Edit the matrix legend and matrix-cell guidance**

In `skills/bootstrap/templates/core/.github/pull_request_template.md`, replace
the status-cell legend and the paragraph after it with:

```markdown
  ✅ = required validation passed, with no known relevant gap for this column
  ⚠️ = validation exists and is sufficient to merge, with a known non-blocking
       gap documented under this AC
  ❌ = required validation is missing, failing, pending, or blocked by a
       merge-blocking gap
  ➖ = not relevant to this AC

  Use `➖` only when that verification type is not relevant to the AC. If an AC
  includes evidence, a gap, or an operator check that clearly maps to a matrix
  column, that cell must not be `➖`. If a known non-blocking gap remains after
  sufficient validation, use `⚠️` and document the gap under the AC in prose or
  with an explicitly optional checkbox. If required validation is missing,
  failing, pending, blocked by an unresolved concern, or otherwise cannot yet
  be trusted for merge, use `❌` and add a required gap or operator-check
  checkbox when pre-merge action is needed.
```

- [ ] **Step 3: Edit the per-AC evidence and gap guidance**

In the same file, replace the evidence/gap comments and placeholder gap row
around the `- <Platform> test:` line with:

```markdown
  For each supported platform that is relevant to this AC, include one evidence
  row, summarize missing tests in the outcome, or document a known gap below.
  Keep evidence rows compact and use a colon after the evidence label:
  `<Platform> test: <command, workflow job, tool, or harness>, <environment>[, <link, verifier, or ISO>]`.
  Name the concrete command, workflow job, tool, or harness when known. Use a
  neutral verifier value, such as a person, role, or run identifier. Add a unit
  evidence row only when unit evidence is the meaningful validation for this AC;
  otherwise keep unit details in the matrix or CI summary.
  If an unresolved critical or major review finding affects validation for this
  AC, describe the missing observable behavior or validation as a required gap
  checkbox unless it belongs in Do before merging.
-->
- <Platform> test: <command, workflow job, tool, or harness>, <environment>[, <link, verifier, or ISO>]
<!--
  Include every known blocking gap that the operator must consciously review
  or resolve before merge. Use `Test gap:` to describe missing coverage or an
  unresolved validation concern that keeps the matrix cell at `❌`. Do not use
  required unchecked `Test gap:` rows for non-blocking caveats. Treat CI that
  must rerun after a fix as a required test gap unless the operator must
  manually trigger or inspect a specific job. Delete unused placeholder
  checkbox rows.
  Example: - [ ] ⚠️ Test gap: <blocking observable behavior or validation not verified>
-->
- [ ] ⚠️ Test gap: <blocking observable behavior, missing coverage, or unresolved validation concern>
<!--
  For a non-blocking gap represented by a `⚠️` matrix cell, use prose or an
  explicitly optional checkbox. Optional checkboxes must include
  `pr-checkbox: optional` immediately above the row.
  Example prose: Non-blocking gap: <known caveat accepted for this PR>.
  Example optional checkbox:
  <!-- pr-checkbox: optional -->
  - [ ] ⚠️ Non-blocking gap: <known caveat accepted for this PR>
-->
```

Important: if the nested HTML comment example would make the template comment
hard to read, use prose instead of embedding the literal optional-marker block
inside another HTML comment. The final template must still plainly say that
optional checkbox rows require `pr-checkbox: optional` immediately above them.

- [ ] **Step 4: Verify stale canonical wording is gone**

Run:

```bash
rg -n "failing/pending state|Every `⚠️` matrix cell|Every `⚠️ Test gap:`|corresponding.*⚠️.*matrix|tests that should exist are missing" \
  skills/bootstrap/templates/core/.github/pull_request_template.md
```

Expected: no output.

## Task 2: Mirror Root PR Template

**Files:**

- Modify: `.github/pull_request_template.md`

- [ ] **Step 1: Copy the canonical template to the root template**

Run:

```bash
cp skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md
```

- [ ] **Step 2: Confirm exact parity**

Run:

```bash
diff -u skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md
```

Expected: no output.

- [ ] **Step 3: Confirm root stale wording is gone**

Run:

```bash
rg -n "failing/pending state|Every `⚠️` matrix cell|Every `⚠️ Test gap:`|corresponding.*⚠️.*matrix|tests that should exist are missing" \
  .github/pull_request_template.md
```

Expected: no output.

## Task 3: Align AC Traceability Summary

**Files:**

- Modify: `docs/ac-traceability.md`

- [ ] **Step 1: Replace the compact PR grammar sentence**

In `docs/ac-traceability.md`, update the paragraph beginning `Test coverage
and per-AC verification rows` so it mentions:

```markdown
Test coverage and per-AC verification rows – a `## Test coverage` matrix with
`Unit` plus the affected supported-platform columns, symbol-only status cells,
compact colon-style platform test rows (`- <Platform> test: <command, workflow
job, tool, or harness>, <environment>[, <link, verifier, or ISO>]`), required
gap checkboxes for merge-blocking missing/failing/pending validation, and prose
or explicitly optional checkbox explanations for known non-blocking gaps – are
defined by the canonical PR template at [`.github/pull_request_template.md`](../.github/pull_request_template.md).
The template comments are the source of truth for the coverage matrix,
slim-test grammar, per-AC unit-test detail rule, per-AC content order,
operator-check rule, checkbox imperative-style rule, status-symbol rule, matrix
consistency rule, platform-evidence-or-gap rule, observable test-gap rule,
optional non-blocking gap rule, placeholder deletion rule, and
gap-acknowledgement rule; do not duplicate that grammar here.
```

- [ ] **Step 2: Verify the summary mentions non-blocking optional detail**

Run:

```bash
rg -n "non-blocking gap|explicitly optional|merge-blocking" docs/ac-traceability.md
```

Expected: output includes the updated paragraph.

## Task 4: Optional Checkbox Regression Test

**Files:**

- Create: `scripts/fixtures/pr-template-checkboxes/non-blocking-gap-optional.md`
- Modify: `scripts/check-pr-template-checkboxes.test.mjs`

- [ ] **Step 1: Add fixture for optional non-blocking gap**

Create `scripts/fixtures/pr-template-checkboxes/non-blocking-gap-optional.md`
with:

```markdown
## Acceptance criteria

### AC-87-4

Chrome validation is enough to merge; Safari is a known non-blocking gap.

<!-- pr-checkbox: optional -->
- [ ] ⚠️ Non-blocking gap: Safari persistence was not verified.
```

- [ ] **Step 2: Add test assertion**

In `scripts/check-pr-template-checkboxes.test.mjs`, add:

```js
test('passes optional non-blocking gap checkbox rows', () => {
  assert.equal(validatePrBody(fixture('non-blocking-gap-optional.md')).ok, true);
});
```

- [ ] **Step 3: Run checkbox tests**

Run:

```bash
node --test scripts/check-pr-template-checkboxes.test.mjs
```

Expected: all tests pass.

## Task 5: Full Verification

**Files:**

- Verify all changed files.

- [ ] **Step 1: Run targeted stale-wording checks**

Run:

```bash
rg -n "failing/pending state|Every `⚠️` matrix cell|Every `⚠️ Test gap:`|corresponding.*⚠️.*matrix|tests that should exist are missing" \
  .github/pull_request_template.md \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  docs/ac-traceability.md
```

Expected: no output.

- [ ] **Step 2: Run parity check**

Run:

```bash
diff -u skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md
```

Expected: no output.

- [ ] **Step 3: Run checkbox tests**

Run:

```bash
node --test scripts/check-pr-template-checkboxes.test.mjs
```

Expected: all tests pass.

- [ ] **Step 4: Run markdown lint**

If dependencies are not installed, first run:

```bash
pnpm install
```

Then run:

```bash
pnpm lint:md
```

Expected: lint passes.

- [ ] **Step 5: Review final diff**

Run:

```bash
git diff --check
git diff --stat
git diff -- .github/pull_request_template.md skills/bootstrap/templates/core/.github/pull_request_template.md docs/ac-traceability.md scripts/check-pr-template-checkboxes.test.mjs scripts/fixtures/pr-template-checkboxes/non-blocking-gap-optional.md
```

Expected: whitespace check passes; diff is limited to the planned files.

## Task 6: Commit Implementation

**Files:**

- Stage implementation and verification files.

- [ ] **Step 1: Stage changes**

Run:

```bash
git add \
  .github/pull_request_template.md \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  docs/ac-traceability.md \
  scripts/check-pr-template-checkboxes.test.mjs \
  scripts/fixtures/pr-template-checkboxes/non-blocking-gap-optional.md
```

If Task 4 was intentionally skipped because existing optional-checkbox tests
are sufficient, omit the two `scripts/` paths and document that decision in the
PR body.

- [ ] **Step 2: Commit changes**

Run:

```bash
git commit -m "feat: #87 clarify non-blocking coverage warnings"
```

Expected: commit succeeds. The type is `feat:` because the diff touches
product-surface files including the PR template and bootstrap template source.

## Spec Coverage

- AC-87-1: Tasks 1, 2, 3, and 5 verify `⚠️` is the visible matrix state for
  known non-blocking gaps.
- AC-87-2: Tasks 1 and 5 verify `❌` covers missing, failing, pending, and
  merge-blocking validation.
- AC-87-3: Tasks 1, 3, and 5 verify non-blocking gap explanations do not use
  required unchecked merge gates.
- AC-87-4: Task 4 verifies optional non-blocking gap checkboxes do not fail the
  required-template-checkbox gate; Task 5 reruns the checker.
- R9: Task 2 enforces canonical-template and root-template parity.
- R12: The design artifact records the observed RED pressure result; no
  implementation task removes or rewrites that evidence.

## Plan Self-Review

- Spec coverage: every AC and requirement maps to at least one task above.
- Placeholder scan: no unresolved placeholder text remains.
- Type consistency: no new code API is introduced; existing `validatePrBody`
  and fixture helper names are reused exactly.
