# Plan: Prevent merges when required template checkboxes are unchecked [#64](https://github.com/patinaproject/bootstrap/issues/64)

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:subagent-driven-development` (recommended) or
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a required PR-body checklist gate that fails unchecked required
template rows, permits explicit optional rows and required choice groups, and
documents the exact status check maintainers must require before merge.

**Architecture:** Implement a small Node validator with fixture-first tests,
wire it into the existing `Lint PR` workflow as a job named
`Required template checkboxes`, and mark PR-template checklist semantics with
compact HTML comments. All baseline-owned root changes must start in
`skills/bootstrap/templates/**` and then be mirrored to the repo root.

**Tech Stack:** Node.js >=24, pnpm, built-in `node:test`, GitHub Actions YAML,
Markdown templates, `markdownlint-cli2`, and optional local `actionlint`.

---

## Workstreams

1. Validator ATDD: add failing fixtures and a Node test harness, then implement
   `scripts/check-pr-template-checkboxes.mjs` behavior.
2. Template-first workflow and PR-template changes: add machine-readable
   checklist markers and the `Required template checkboxes` workflow job under
   `skills/bootstrap/templates/core/**`.
3. Baseline realignment and documentation: mirror template changes to root
   files, document the required status check in `AGENTS.md`, and add root
   package scripts.
4. Review and Finisher evidence: run local verification, capture AC evidence,
   and publish a PR body that follows the repository template.

## File Structure

- Create `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs`
  as the shipped validator script.
- Create `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`
  as the shipped fixture test suite using `node:test`.
- Create fixture files under
  `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/`.
- Modify `skills/bootstrap/templates/core/package.json.tmpl` to add
  `"test:pr-template-checkboxes"`.
- Modify `skills/bootstrap/templates/core/.github/pull_request_template.md` to
  add checklist marker comments.
- Modify `skills/bootstrap/templates/core/.github/workflows/lint-pr.yml` to add
  the `Required template checkboxes` job.
- Modify `skills/bootstrap/templates/core/AGENTS.md.tmpl` to name the exact
  required status check.
- Mirror the same script, tests, fixtures, package script, PR template,
  workflow, and guidance into root paths:
  `scripts/**`, `package.json`, `.github/pull_request_template.md`,
  `.github/workflows/lint-pr.yml`, and `AGENTS.md`.

## Contract Decisions Executor Must Preserve

- The required status check name is `Required template checkboxes`.
- The workflow job id should be `template-checkboxes`; the job `name` must be
  `Required template checkboxes`.
- Use Node because the repository already uses Node and pnpm. Do not introduce
  Python for this implementation. If a helper later needs Python, call
  `python3`, not `python`.
- Product-surface implementation commits must use `feat: #64 ...` or
  `fix: #64 ...`, never `docs:` or `chore:`.
- Do not add a third-party checklist-parsing action. If `actions/checkout` is
  needed to run the local script in Actions, pin it to the full SHA and include
  the version comment required by `AGENTS.md`.
- Keep template edits first. Root edits are mirrors of
  `skills/bootstrap/templates/core/**`.

## Task 1: Write Failing Validator Fixtures

**Files:**

- Create:
  `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/unchecked-required.md`
- Create:
  `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/checked-required.md`
- Create:
  `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/optional-unchecked.md`
- Create:
  `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/docs-choice-none.md`
- Create:
  `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/docs-choice-one.md`
- Create:
  `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/docs-choice-two.md`
- Create:
  `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/e2e-gap-unchecked.md`
- Create:
  `skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/manual-unchecked.md`
- Create:
  `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`

- [ ] **Step 1: Add fixture files**

Create each fixture with complete PR-body content. Use the marker grammar below
so tests define the parser contract before implementation exists.

`unchecked-required.md`:

```markdown
## Acceptance criteria

### AC-64-1

Required unchecked evidence row should fail.

<!-- pr-checkbox: required -->
- [ ] Linux evidence -- runner | env | verifier | 2026-04-29T00:00:00Z

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Updated in this PR
```

`checked-required.md`:

```markdown
## Acceptance criteria

### AC-64-1

Required checked evidence row should pass.

<!-- pr-checkbox: required -->
- [x] Linux evidence -- runner | env | verifier | 2026-04-29T00:00:00Z

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Updated in this PR
```

`optional-unchecked.md`:

```markdown
## Acceptance criteria

### AC-64-2

Optional unchecked row should pass.

<!-- pr-checkbox: optional -->
- [ ] Optional reviewer note

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Updated in this PR
```

`docs-choice-none.md`:

```markdown
## Acceptance criteria

### AC-64-2

Docs choice group with no checked row should fail.

<!-- pr-checkbox: required -->
- [x] Linux evidence -- runner | env | verifier | 2026-04-29T00:00:00Z

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Updated in this PR
```

`docs-choice-one.md`:

```markdown
## Acceptance criteria

### AC-64-2

Docs choice group with exactly one checked row should pass.

<!-- pr-checkbox: required -->
- [x] Linux evidence -- runner | env | verifier | 2026-04-29T00:00:00Z

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Updated in this PR
```

`docs-choice-two.md`:

```markdown
## Acceptance criteria

### AC-64-2

Docs choice group with two checked rows should fail.

<!-- pr-checkbox: required -->
- [x] Linux evidence -- runner | env | verifier | 2026-04-29T00:00:00Z

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Updated in this PR
```

`e2e-gap-unchecked.md`:

```markdown
## Acceptance criteria

### AC-64-1

Included E2E gap acknowledgement should fail while unchecked.

<!-- pr-checkbox: required -->
- [x] Linux evidence -- runner | env | verifier | 2026-04-29T00:00:00Z
<!-- pr-checkbox: required -->
- [ ] E2E gap: browser behavior not covered by automation
<!-- pr-checkbox: required -->
- [x] Manual test: 1. Open the PR; 2. Confirm the gate fails.

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Updated in this PR
```

`manual-unchecked.md`:

```markdown
## Acceptance criteria

### AC-64-1

Manual test row should fail while unchecked.

<!-- pr-checkbox: required -->
- [x] Linux evidence -- runner | env | verifier | 2026-04-29T00:00:00Z
<!-- pr-checkbox: required -->
- [ ] Manual test: 1. Open the PR; 2. Confirm the gate fails.

## Docs updated

<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [x] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Updated in this PR
```

- [ ] **Step 2: Add the failing test harness**

Create
`skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`
with this structure:

```javascript
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { validatePrBody } from './check-pr-template-checkboxes.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureDir = join(__dirname, 'fixtures', 'pr-template-checkboxes');

function fixture(name) {
  return readFileSync(join(fixtureDir, name), 'utf8');
}

test('fails unchecked required checklist rows with row text', () => {
  const result = validatePrBody(fixture('unchecked-required.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Linux evidence/);
  assert.match(result.errors.join('\n'), /AC-64-1/);
});

test('passes checked required checklist rows', () => {
  assert.equal(validatePrBody(fixture('checked-required.md')).ok, true);
});

test('passes explicitly optional unchecked checklist rows', () => {
  assert.equal(validatePrBody(fixture('optional-unchecked.md')).ok, true);
});

test('fails docs choice group when no option is checked', () => {
  const result = validatePrBody(fixture('docs-choice-none.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /docs-updated/);
  assert.match(result.errors.join('\n'), /exactly one/);
});

test('passes docs choice group when exactly one option is checked', () => {
  assert.equal(validatePrBody(fixture('docs-choice-one.md')).ok, true);
});

test('fails docs choice group when more than one option is checked', () => {
  const result = validatePrBody(fixture('docs-choice-two.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /docs-updated/);
  assert.match(result.errors.join('\n'), /2 checked/);
});

test('fails included E2E gap acknowledgement while unchecked', () => {
  const result = validatePrBody(fixture('e2e-gap-unchecked.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /E2E gap/);
});

test('fails manual test row while unchecked', () => {
  const result = validatePrBody(fixture('manual-unchecked.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Manual test/);
});
```

- [ ] **Step 3: Run the test to verify RED**

Run:

```bash
node --test skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs
```

Expected: fail because
`skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs` does
not exist yet.

- [ ] **Step 4: Commit point**

Do not commit yet if Task 2 will immediately add the implementation. If the
Executor prefers strict RED commits, use:

```bash
git add skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes \
  skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs
git commit -m "feat: #64 add PR checklist gate fixtures"
```

## Task 2: Implement the Validator Script

**Files:**

- Create: `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs`

- [ ] **Step 1: Implement the parser and CLI**

Create `skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs`.
The implementation must export `validatePrBody(body)` and run as a CLI when
called directly. Required behavior:

```javascript
#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REQUIRED_MARKER = /^<!--\s*pr-checkbox:\s*required\s*-->$/i;
const OPTIONAL_MARKER = /^<!--\s*pr-checkbox:\s*optional\s*-->$/i;
const CHOICE_MARKER =
  /^<!--\s*pr-checkbox-choice:\s*([a-z0-9-]+)\s+exactly-one\s*-->$/i;
const CHECKBOX = /^\s*-\s+\[( |x|X)\]\s+(.+)$/;
const HEADING = /^\s{0,3}(#{2,6})\s+(.+?)\s*$/;

export function validatePrBody(body) {
  const errors = [];
  const choices = new Map();
  const lines = String(body ?? '').split(/\r?\n/);
  let pending = null;
  let section = 'PR body';

  for (const [index, line] of lines.entries()) {
    const lineNumber = index + 1;
    const heading = line.match(HEADING);
    if (heading) section = heading[2];

    const choiceMarker = line.match(CHOICE_MARKER);
    if (choiceMarker) {
      pending = { kind: 'choice', group: choiceMarker[1], lineNumber };
      continue;
    }
    if (REQUIRED_MARKER.test(line)) {
      pending = { kind: 'required', lineNumber };
      continue;
    }
    if (OPTIONAL_MARKER.test(line)) {
      pending = { kind: 'optional', lineNumber };
      continue;
    }

    const checkbox = line.match(CHECKBOX);
    if (!checkbox) continue;

    const checked = checkbox[1].toLowerCase() === 'x';
    const text = checkbox[2].trim();
    const marker = pending;
    pending = null;

    if (!marker) continue;
    if (marker.kind === 'optional') continue;

    if (marker.kind === 'required') {
      if (!checked) {
        errors.push(
          `line ${lineNumber}: ${section}: required checklist item is unchecked: ${text}`,
        );
      }
      continue;
    }

    const group = choices.get(marker.group) ?? {
      checked: 0,
      rows: [],
      firstLine: lineNumber,
    };
    group.rows.push({ checked, lineNumber, section, text });
    if (checked) group.checked += 1;
    choices.set(marker.group, group);
  }

  for (const [groupName, group] of choices.entries()) {
    if (group.checked !== 1) {
      const rows = group.rows.map((row) => row.text).join('; ');
      errors.push(
        `line ${group.firstLine}: ${groupName}: choice group must have exactly one checked item; ${group.checked} checked among: ${rows}`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}

function readBodyFromArgs() {
  const bodyFileIndex = process.argv.indexOf('--body-file');
  if (bodyFileIndex !== -1) {
    const bodyFile = process.argv[bodyFileIndex + 1];
    if (!bodyFile) {
      throw new Error('--body-file requires a path');
    }
    return readFileSync(bodyFile, 'utf8');
  }
  return process.env.PR_BODY ?? '';
}

function emitGithubError(message) {
  const escaped = message.replaceAll('%', '%25').replaceAll('\n', '%0A');
  console.error(`::error title=Required template checkbox::${escaped}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const result = validatePrBody(readBodyFromArgs());
  if (!result.ok) {
    for (const error of result.errors) emitGithubError(error);
    process.exit(1);
  }
  console.log('Required template checkboxes are satisfied.');
}
```

- [ ] **Step 2: Run the fixture test**

Run:

```bash
node --test skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs
```

Expected: all eight tests pass.

- [ ] **Step 3: Verify CLI failure output**

Run:

```bash
node skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs \
  --body-file skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/unchecked-required.md
```

Expected: exit code `1` and a GitHub Actions error containing
`Linux evidence` and `AC-64-1`.

- [ ] **Step 4: Verify CLI success output**

Run:

```bash
node skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs \
  --body-file skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes/docs-choice-one.md
```

Expected: exit code `0` and output
`Required template checkboxes are satisfied.`

- [ ] **Step 5: Commit**

```bash
git add skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs \
  skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs \
  skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes
git commit -m "feat: #64 add PR template checkbox validator"
```

## Task 3: Add Template Package Script

**Files:**

- Modify: `skills/bootstrap/templates/core/package.json.tmpl`

- [ ] **Step 1: Update the template package scripts**

In `skills/bootstrap/templates/core/package.json.tmpl`, add this script after
`"lint:md"`:

```json
"test:pr-template-checkboxes": "node --test scripts/check-pr-template-checkboxes.test.mjs",
```

Keep the surrounding scripts unchanged:

```json
"scripts": {
  "prepare": "husky",
  "commitlint": "commitlint",
  "lint:md": "markdownlint-cli2 \"**/*.md\" \"#node_modules\" \"#CHANGELOG.md\"",
  "test:pr-template-checkboxes": "node --test scripts/check-pr-template-checkboxes.test.mjs",
  "sync:versions": "node scripts/sync-plugin-versions.mjs",
  "check:versions": "node scripts/check-plugin-versions.mjs"
},
```

- [ ] **Step 2: Verify JSON syntax**

Run:

```bash
node -e "JSON.parse(require('node:fs').readFileSync('skills/bootstrap/templates/core/package.json.tmpl', 'utf8')); console.log('package template JSON ok')"
```

Expected: `package template JSON ok`.

- [ ] **Step 3: Commit**

```bash
git add skills/bootstrap/templates/core/package.json.tmpl
git commit -m "feat: #64 add PR checklist validator script entry"
```

## Task 4: Mark PR Template Checklist Semantics

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md`

- [ ] **Step 1: Add marker comments to required rows**

Add `<!-- pr-checkbox: required -->` directly above each required evidence,
E2E gap, and manual-test checklist row. The resulting AC block should contain:

```markdown
<!-- pr-checkbox: required -->
- [ ] <Platform> evidence — <runner> | <env> | <verifier> | <ISO>
```

```markdown
<!-- pr-checkbox: required -->
- [ ] ⚠️ E2E gap: <what automated coverage does not verify>
```

```markdown
<!-- pr-checkbox: required -->
- [ ] Manual test: <concrete numbered steps; observed outcome>
```

- [ ] **Step 2: Add choice-group markers to Docs updated**

Replace the current `Docs updated` rows with this marked choice group:

```markdown
## Docs updated

<!-- Required choice group: exactly one row in this section must be checked. -->
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Not needed
<!-- pr-checkbox-choice: docs-updated exactly-one -->
- [ ] Updated in this PR
```

- [ ] **Step 3: Verify marker placement**

Run:

```bash
rg -n 'pr-checkbox' skills/bootstrap/templates/core/.github/pull_request_template.md
```

Expected: at least five marker lines: three `pr-checkbox: required` markers
and two `pr-checkbox-choice: docs-updated exactly-one` markers.

- [ ] **Step 4: Commit**

```bash
git add skills/bootstrap/templates/core/.github/pull_request_template.md
git commit -m "feat: #64 mark required PR template checklist rows"
```

## Task 5: Wire the Required Status Check in the Workflow

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/workflows/lint-pr.yml`

- [ ] **Step 1: Add the workflow job**

Add this job after `closing-keyword` and before `mark-breaking-change`:

```yaml
  template-checkboxes:
    name: Required template checkboxes
    runs-on: ubuntu-latest
    if: "${{ !contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}"
    steps:
      - name: Check out repository
        # actions/checkout@v4.3.1
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5

      - name: Validate required template checkboxes
        env:
          PR_BODY: ${{ github.event.pull_request.body }}
        run: node scripts/check-pr-template-checkboxes.mjs
```

If the Executor finds that branch-protection check names include the workflow
prefix in the repository UI, keep the job name as written and document
`Required template checkboxes`; do not rename it to a vague variant.

- [ ] **Step 2: Verify pinned action convention**

Run:

```bash
rg -n 'actions/checkout@v4.3.1|34e114876b0b11c390a56381ad16ebd13914f8d5' \
  skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
```

Expected: both the version comment and full 40-character SHA are present.

- [ ] **Step 3: Run actionlint when available**

Run:

```bash
if command -v actionlint >/dev/null 2>&1; then
  actionlint skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
else
  echo "actionlint not installed; CI lint-actions will validate workflow syntax"
fi
```

Expected: either no `actionlint` findings, or the explicit
`actionlint not installed` note.

- [ ] **Step 4: Commit**

```bash
git add skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
git commit -m "feat: #64 require PR template checklist gate"
```

## Task 6: Document the Required Status Check in Template Guidance

**Files:**

- Modify: `skills/bootstrap/templates/core/AGENTS.md.tmpl`

- [ ] **Step 1: Add branch-protection guidance**

In `skills/bootstrap/templates/core/AGENTS.md.tmpl`, add this short subsection
after the `## GitHub Actions pinning` section:

```markdown
## Required PR checks

Require the `Required template checkboxes` status check before merge. This
check fails when required pull request template checklist rows remain unchecked
and passes when required rows are checked or unchecked rows are explicitly
optional. Configure it in branch protection or a repository ruleset alongside
the other required PR checks.
```

- [ ] **Step 2: Verify the exact status-check name**

Run:

```bash
rg -n 'Required template checkboxes' \
  skills/bootstrap/templates/core/AGENTS.md.tmpl \
  skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
```

Expected: the same exact status-check name appears in the guidance and the
workflow job name.

- [ ] **Step 3: Commit**

```bash
git add skills/bootstrap/templates/core/AGENTS.md.tmpl
git commit -m "feat: #64 document required PR checkbox gate"
```

## Task 7: Realign Root Files from Templates

**Files:**

- Create: `scripts/check-pr-template-checkboxes.mjs`
- Create: `scripts/check-pr-template-checkboxes.test.mjs`
- Create: `scripts/fixtures/pr-template-checkboxes/*.md`
- Modify: `package.json`
- Modify: `.github/pull_request_template.md`
- Modify: `.github/workflows/lint-pr.yml`
- Modify: `AGENTS.md`

- [ ] **Step 1: Invoke bootstrap realignment**

Use the local `bootstrap:bootstrap` skill in realignment mode against this
repository and accept the proposed diffs for only these mirrored paths:

```text
scripts/check-pr-template-checkboxes.mjs
scripts/check-pr-template-checkboxes.test.mjs
scripts/fixtures/pr-template-checkboxes/*.md
package.json
.github/pull_request_template.md
.github/workflows/lint-pr.yml
AGENTS.md
```

Expected: the root files mirror the template intent. If the runtime cannot
invoke the bootstrap skill interactively, stop and report
`superteam halted at Executor: bootstrap realignment unavailable`; do not
hand-edit root files as a substitute without explicit operator approval.

- [ ] **Step 2: Verify template/root parity for exact files**

Run:

```bash
diff -u skills/bootstrap/templates/core/.github/pull_request_template.md \
  .github/pull_request_template.md
diff -u skills/bootstrap/templates/core/.github/workflows/lint-pr.yml \
  .github/workflows/lint-pr.yml
diff -u skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs \
  scripts/check-pr-template-checkboxes.mjs
diff -u skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs \
  scripts/check-pr-template-checkboxes.test.mjs
diff -ru skills/bootstrap/templates/core/scripts/fixtures/pr-template-checkboxes \
  scripts/fixtures/pr-template-checkboxes
```

Expected: no diff output for these files and directories.

- [ ] **Step 3: Verify package script parity**

Run:

```bash
node -e "const root=require('./package.json'); const tmpl=JSON.parse(require('node:fs').readFileSync('skills/bootstrap/templates/core/package.json.tmpl','utf8')); if (root.scripts['test:pr-template-checkboxes'] !== tmpl.scripts['test:pr-template-checkboxes']) process.exit(1); console.log(root.scripts['test:pr-template-checkboxes']);"
```

Expected:

```text
node --test scripts/check-pr-template-checkboxes.test.mjs
```

- [ ] **Step 4: Verify guidance parity by exact check name**

Run:

```bash
rg -n 'Required template checkboxes' AGENTS.md \
  skills/bootstrap/templates/core/AGENTS.md.tmpl
```

Expected: both files name `Required template checkboxes`.

- [ ] **Step 5: Commit**

```bash
git add scripts/check-pr-template-checkboxes.mjs \
  scripts/check-pr-template-checkboxes.test.mjs \
  scripts/fixtures/pr-template-checkboxes \
  package.json \
  .github/pull_request_template.md \
  .github/workflows/lint-pr.yml \
  AGENTS.md
git commit -m "feat: #64 mirror PR checklist gate baseline"
```

## Task 8: Run Full Local Verification

**Files:**

- Read: all files changed in Tasks 1-7

- [ ] **Step 1: Run template validator tests**

Run:

```bash
node --test skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs
```

Expected: all tests pass.

- [ ] **Step 2: Run root validator tests through pnpm**

Run:

```bash
pnpm test:pr-template-checkboxes
```

Expected: all tests pass.

- [ ] **Step 3: Run Markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: `markdownlint-cli2` exits `0`.

- [ ] **Step 4: Run workflow lint when available**

Run:

```bash
if command -v actionlint >/dev/null 2>&1; then
  actionlint .github/workflows/lint-pr.yml \
    skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
else
  echo "actionlint not installed; CI lint-actions will validate workflow syntax"
fi
```

Expected: either no `actionlint` findings, or the explicit
`actionlint not installed` note.

- [ ] **Step 5: Run targeted contract greps**

Run:

```bash
rg -n 'Required template checkboxes|template-checkboxes|pr-checkbox' \
  .github/pull_request_template.md \
  .github/workflows/lint-pr.yml \
  AGENTS.md \
  scripts/check-pr-template-checkboxes.mjs \
  skills/bootstrap/templates/core/.github/pull_request_template.md \
  skills/bootstrap/templates/core/.github/workflows/lint-pr.yml \
  skills/bootstrap/templates/core/AGENTS.md.tmpl \
  skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.mjs
```

Expected: the PR template has required and choice markers, both workflows have
the `template-checkboxes` job, both guidance files name the exact status check,
and both scripts contain the validator implementation.

- [ ] **Step 6: Commit verification-only fixes if needed**

If verification uncovers implementation defects, fix only those defects and
commit with:

```bash
git add <fixed-files>
git commit -m "fix: #64 correct PR checklist gate verification"
```

If no fixes are needed, do not create an empty commit.

## Task 9: Local Review Evidence for Reviewer

**Files:**

- Read: `git diff origin/main...HEAD`
- Read: changed workflow, template, script, test, and guidance files

- [ ] **Step 1: Prepare Reviewer handoff evidence**

Collect these exact outputs for Reviewer:

```bash
git log --oneline origin/main..HEAD
git diff --name-only origin/main...HEAD
node --test skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs
pnpm test:pr-template-checkboxes
pnpm lint:md
if command -v actionlint >/dev/null 2>&1; then
  actionlint .github/workflows/lint-pr.yml \
    skills/bootstrap/templates/core/.github/workflows/lint-pr.yml
else
  echo "actionlint not installed; CI lint-actions will validate workflow syntax"
fi
```

Expected: commits use `feat: #64` or `fix: #64` for product-surface changes;
validator tests pass in template and root locations; Markdown lint passes;
workflow lint either passes locally or is explicitly deferred to CI.

- [ ] **Step 2: Reviewer pressure-test checklist**

Reviewer must confirm:

- `Required template checkboxes` is the exact job name and is documented
  verbatim in `AGENTS.md` and the PR body evidence.
- Unchecked required evidence, E2E gap, and manual rows fail with clear errors.
- Explicitly optional unchecked rows pass.
- `docs-updated` passes with exactly one checked choice and fails with zero or
  two checked choices.
- Root files were produced from template-first edits and parity commands show
  no drift for exact mirrored files.
- No unpinned action was added.

## Task 10: Finisher PR Body Evidence

**Files:**

- Read: `.github/pull_request_template.md`

- [ ] **Step 1: Render the PR body with repository headings**

Finisher must use `.github/pull_request_template.md` headings in this order:

```markdown
## Summary

- Adds a template-aware required checklist validator for PR bodies.
- Wires the gate into `Lint PR` as `Required template checkboxes`.
- Documents the status check maintainers must require and mirrors the bootstrap
  template changes into root files.

## Linked issue

- Closes #64

## Acceptance criteria

### AC-64-1

Required unchecked checklist rows fail with clear GitHub Actions errors naming
the row and section.

- [ ] Linux evidence -- <runner> | <env> | <verifier> | <ISO>
- [ ] Manual test: 1. Open the PR checks; 2. Confirm `Required template checkboxes` ran on this PR; 3. Confirm branch protection can select that exact status check.

### AC-64-2

Checked required rows and explicitly optional unchecked rows pass, while the
Docs updated choice group requires exactly one checked row.

- [ ] Linux evidence -- <runner> | <env> | <verifier> | <ISO>
- [ ] Manual test: 1. Review fixture test output; 2. Confirm pass/fail cases cover optional rows and docs choices.

### AC-64-3

Repository guidance names the exact status check maintainers must require:
`Required template checkboxes`.

- [ ] Linux evidence -- <runner> | <env> | <verifier> | <ISO>
- [ ] Manual test: 1. Open `AGENTS.md`; 2. Confirm the required check name matches the workflow job name exactly.

### AC-64-4

Template source and mirrored root files remain in sync for the new gate.

- [ ] Linux evidence -- <runner> | <env> | <verifier> | <ISO>
- [ ] Manual test: 1. Review template/root parity command output; 2. Confirm no drift for PR template, workflow, scripts, fixtures, package script, and guidance.

## Validation

- `node --test skills/bootstrap/templates/core/scripts/check-pr-template-checkboxes.test.mjs`
- `pnpm test:pr-template-checkboxes`
- `pnpm lint:md`
- `actionlint .github/workflows/lint-pr.yml skills/bootstrap/templates/core/.github/workflows/lint-pr.yml` or `actionlint not installed; CI lint-actions will validate workflow syntax`
- Template/root parity commands from Task 7

## Docs updated

- [ ] Updated in this PR
```

Finisher should replace `<runner>`, `<env>`, `<verifier>`, and `<ISO>` with
real evidence values. Keep the manual rows unchecked until a human reviewer
performs them in GitHub.

- [ ] **Step 2: PR title**

Use this PR title:

```text
feat: #64 enforce required PR template checkboxes
```

Expected: title satisfies commitlint and uses `feat:` because product-surface
files under `skills/**`, `.github/**`, `AGENTS.md`, and `package.json` changed.

## Acceptance Criteria Traceability

- `AC-64-1`: Tasks 1, 2, 4, 5, and 8 cover unchecked required rows, E2E gap
  rows, manual rows, and clear GitHub Actions errors.
- `AC-64-2`: Tasks 1, 2, 4, and 8 cover optional unchecked rows and the
  required `docs-updated` exactly-one choice group.
- `AC-64-3`: Tasks 5, 6, 8, and 10 cover the exact status check name:
  `Required template checkboxes`.
- `AC-64-4`: Tasks 3, 4, 5, 6, 7, and 8 enforce template-first edits and
  mirrored root parity.

## Blockers

No known blockers. If bootstrap realignment cannot be invoked by the runtime,
Executor must halt before root edits and ask the operator how to proceed.
