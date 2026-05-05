# Revert PR Checkbox Validation Behavior That Hides Blocking Test Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace broad PR checkbox failure messages with semantic readiness validation so canonical `⚠️ Test gap:` rows remain honest blockers and prose workarounds do not pass.

**Architecture:** Keep the existing local Node validator and workflow step, but make `validatePrBody()` classify AC sections, matrix warning cells, test-gap rows, operator checks, explicit checkbox markers, and choice groups. Template copies remain source-of-truth first, then mirrored root files are updated to match.

**Tech Stack:** Node.js ESM, `node:test`, Markdown PR-body parsing with local regexes, bootstrap template mirroring by direct parity.

---

## File Structure

- Modify `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs`: add semantic classification for `⚠️ Test gap:` rows and matrix `⚠️` cells.
- Modify `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`: add RED/GREEN fixtures and expectations.
- Add `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/test-gap-unchecked.md`: canonical unresolved gap fixture.
- Add `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/test-gap-prose-workaround.md`: prose bypass fixture.
- Modify `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/e2e-gap-unchecked.md`: update legacy `E2E gap:` wording to canonical `⚠️ Test gap:`.
- Modify `skills/bootstrap/templates/core/.github/pull_request_template.md`: clarify that test-gap checkboxes remain unchecked while unresolved and are readiness gaps, not generic required checkbox tasks.
- Mirror every changed template file to its root counterpart under `scripts/`, `.github/`, and `package.json` only if package scripts change.

## Task 1: RED Fixtures For The Current Conflict

**Files:**

- Add: `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/test-gap-unchecked.md`
- Add: `scripts/fixtures/pr-template-checkboxes/test-gap-unchecked.md`
- Add: `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/test-gap-prose-workaround.md`
- Add: `scripts/fixtures/pr-template-checkboxes/test-gap-prose-workaround.md`
- Modify: `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`
- Modify: `scripts/check-pr-template-checkboxes.test.mjs`

- [ ] **Step 1: Add canonical unresolved test-gap fixture**

Create the same fixture at both template and root paths:

```md
## Test coverage

| AC | Title | Unit | Linux |
| --- | --- | --- | --- |
| AC-86-1 | Canonical unresolved gap | ➖ | ⚠️ |

## Acceptance criteria

### AC-86-1

Canonical unresolved test gap should fail with a gap-specific readiness message.

- [ ] ⚠️ Test gap: Linux validation has not rerun after the validator fix.

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Updated in this PR
```

- [ ] **Step 2: Add prose-workaround fixture**

Create the same fixture at both template and root paths:

```md
## Test coverage

| AC | Title | Unit | Linux |
| --- | --- | --- | --- |
| AC-86-1 | Prose workaround | ➖ | ⚠️ |

## Acceptance criteria

### AC-86-1

Blocking validation gap: Linux validation has not rerun after the validator fix.

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Updated in this PR
```

- [ ] **Step 3: Add failing RED expectations**

Add these tests to both template and root test files:

```js
test('fails canonical unresolved test gaps with gap-specific text', () => {
  const result = validatePrBody(fixture('test-gap-unchecked.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unresolved validation gap/i);
  assert.match(result.errors.join('\n'), /Linux validation has not rerun/);
  assert.doesNotMatch(result.errors.join('\n'), /required checklist item is unchecked/i);
});

test('fails prose workaround when matrix warning lacks canonical test gap', () => {
  const result = validatePrBody(fixture('test-gap-prose-workaround.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /missing .*Test gap/i);
  assert.match(result.errors.join('\n'), /AC-86-1/);
});
```

- [ ] **Step 4: Run root RED tests**

Run: `node --test scripts/check-pr-template-checkboxes.test.mjs`

Expected: FAIL. The canonical test-gap fixture still reports `required checklist item is unchecked`, and the prose-workaround fixture currently passes.

- [ ] **Step 5: Run template RED tests**

Run: `node --test skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`

Expected: FAIL for the same reasons as the root tests.

## Task 2: Semantic Validator Implementation

**Files:**

- Modify: `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs`
- Modify: `scripts/check-pr-template-checkboxes.mjs`
- Modify: `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/e2e-gap-unchecked.md`
- Modify: `scripts/fixtures/pr-template-checkboxes/e2e-gap-unchecked.md`
- Modify: `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`
- Modify: `scripts/check-pr-template-checkboxes.test.mjs`

- [ ] **Step 1: Replace validator logic in template script**

Replace `validatePrBody()` in `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs` with logic equivalent to this shape:

```js
const AC_HEADING = /^AC-\d+-\d+\b/;
const TEST_GAP = /^⚠️\s*Test gap:/i;
const OPERATOR_CHECK = /^Operator check:/i;
const WARNING_CELL = /(^|\|)\s*⚠️\s*(\||$)/;

function ensureAc(acMap, acId, section) {
  const entry = acMap.get(acId) ?? {
    section,
    hasWarning: false,
    testGaps: [],
  };
  if (section) entry.section = section;
  acMap.set(acId, entry);
  return entry;
}

function readMatrixAc(line) {
  if (!line.trim().startsWith('|')) return null;
  const cells = line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
  const acId = cells[0];
  if (!AC_HEADING.test(acId)) return null;
  return { acId, hasWarning: cells.slice(2).some((cell) => cell === '⚠️') || WARNING_CELL.test(line) };
}
```

Keep the existing marker, choice-group, comment, checkbox, CLI, and GitHub error plumbing. When an unchecked checkbox text starts with `⚠️ Test gap:`, push `line N: AC-X-Y: unresolved validation gap: <text after prefix>` instead of the generic required-checkbox message. Record that gap under the active AC. When a checked or unchecked operator check is seen, keep required checkbox semantics unless explicitly optional. At the end, fail every AC with a matrix warning and no recorded canonical test gap with `line N: AC-X-Y: missing ⚠️ Test gap for warning matrix cell`.

- [ ] **Step 2: Mirror validator logic to root script**

Copy the completed template script to `scripts/check-pr-template-checkboxes.mjs`.

- [ ] **Step 3: Update legacy E2E fixture wording**

In both E2E fixtures, change:

```md
- [ ] E2E gap: browser behavior not covered by automation
```

to:

```md
- [ ] ⚠️ Test gap: browser behavior not covered by automation
```

- [ ] **Step 4: Update legacy E2E test expectation**

In both test files, change the E2E test name and assertion to:

```js
test('fails included test gap while unchecked with gap-specific text', () => {
  const result = validatePrBody(fixture('e2e-gap-unchecked.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unresolved validation gap/i);
  assert.match(result.errors.join('\n'), /browser behavior not covered/);
});
```

- [ ] **Step 5: Run GREEN validator tests**

Run: `node --test scripts/check-pr-template-checkboxes.test.mjs`

Expected: PASS.

- [ ] **Step 6: Run template validator tests**

Run: `node --test skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`

Expected: PASS.

## Task 3: PR Template Wording

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md`
- Modify: `.github/pull_request_template.md`

- [ ] **Step 1: Clarify test-gap semantics in template source**

In the `⚠️ Test gap:` comment of `skills/bootstrap/templates/core/.github/pull_request_template.md`, add this compact wording:

```md
  Test-gap checkboxes are intentionally unchecked while unresolved. Do not
  convert a real gap to prose or mark it optional to satisfy PR validation; the
  readiness check reports unresolved validation gaps separately from operator
  action checkboxes.
```

- [ ] **Step 2: Clarify operator-check semantics in template source**

In the `Operator check:` comment, add this compact wording:

```md
  Operator-check checkboxes are completion tasks. Unchecked operator checks
  remain readiness blockers unless explicitly optional.
```

- [ ] **Step 3: Mirror template to root**

Copy the changed template PR template to `.github/pull_request_template.md`.

- [ ] **Step 4: Verify template parity**

Run: `cmp -s skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md && echo ok`

Expected: `ok`.

## Task 4: Guidance And Search Verification

**Files:**

- Modify only if needed: `docs/ac-traceability.md`
- Modify only if needed: `AGENTS.md`
- Modify only if needed: `skills/bootstrap/templates/core/AGENTS.md.tmpl`

- [ ] **Step 1: Search for stale broad-checkbox claims**

Run: `rg -n 'every visible unchecked checkbox|unchecked visible checkbox|required template checkbox|Required template checkboxes|pr-checkbox|Test gap' AGENTS.md docs/ac-traceability.md .github/pull_request_template.md skills/bootstrap/templates/core/AGENTS.md.tmpl skills/bootstrap/templates/core/.github/pull_request_template.md scripts skills/bootstrap/templates/core/scripts`

Expected: Any remaining broad checkbox wording is either removed or narrowed to semantic readiness, operator checks, explicit required markers, or test-gap readiness messages.

- [ ] **Step 2: Patch stale guidance only where the search shows contradictions**

If `docs/ac-traceability.md`, `AGENTS.md`, or `skills/bootstrap/templates/core/AGENTS.md.tmpl` still says unchecked test-gap checkboxes are ordinary required checkboxes, replace that wording with:

```md
Canonical `⚠️ Test gap:` rows stay unchecked while unresolved and are treated
as validation-gap readiness blockers. `Operator check:` rows are completion
checkboxes and remain unchecked until the named operator action is done.
```

- [ ] **Step 3: Verify mirrored AGENTS guidance if edited**

If `AGENTS.md` or `skills/bootstrap/templates/core/AGENTS.md.tmpl` changed, run:

```bash
diff -u skills/bootstrap/templates/core/AGENTS.md.tmpl AGENTS.md
```

Expected: no output, or only intentional repository-local differences already documented by this repo.

## Task 5: Final Verification And Commit

**Files:**

- All changed files from Tasks 1-4.

- [ ] **Step 1: Run root validator tests**

Run: `node --test scripts/check-pr-template-checkboxes.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run template validator tests**

Run: `node --test skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`

Expected: PASS.

- [ ] **Step 3: Verify script parity**

Run:

```bash
cmp -s skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs scripts/check-pr-template-checkboxes.mjs && echo script-ok
cmp -s skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs scripts/check-pr-template-checkboxes.test.mjs && echo test-ok
diff -ru skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes scripts/fixtures/pr-template-checkboxes
```

Expected: `script-ok`, `test-ok`, and no fixture diff.

- [ ] **Step 4: Run Markdown lint**

Run: `pnpm lint:md`

Expected: PASS. If dependencies are missing, run `pnpm install` once and rerun.

- [ ] **Step 5: Run workflow lint if available**

Run: `pnpm exec actionlint .github/workflows/*.yml`

Expected: PASS or report that `actionlint` is unavailable from installed project tooling.

- [ ] **Step 6: Commit implementation**

Run:

```bash
git add .github/pull_request_template.md scripts/check-pr-template-checkboxes.mjs scripts/check-pr-template-checkboxes.test.mjs scripts/fixtures/pr-template-checkboxes skills/bootstrap/templates/core/.github/pull_request_template.md skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes docs/superpowers/plans/2026-05-03-86-revert-pr-checkbox-validation-behavior-that-hides-blocking-test-gaps-plan.md
git commit -m "fix: #86 restore honest PR validation gaps"
```

Expected: Commit succeeds. Include `docs/ac-traceability.md`, `AGENTS.md`, or `skills/bootstrap/templates/core/AGENTS.md.tmpl` in `git add` if Task 4 changed them.

## Self-Review

- Spec coverage: R1-R11 map to Tasks 1-4; AC-86-1 and AC-86-2 map to test-gap fixtures and semantic messages; AC-86-3 maps to retained operator-check behavior; AC-86-4 maps to parity checks.
- Placeholder scan: no placeholder tasks remain; every code-changing step includes concrete snippets or exact commands.
- Type consistency: the plan uses the existing `validatePrBody(body)` API and keeps the current CLI contract.
