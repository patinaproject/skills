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

test('passes optional non-blocking gap checkbox rows', () => {
  assert.equal(validatePrBody(fixture('non-blocking-gap-optional.md')).ok, true);
});

test('passes ⚠️ matrix cell satisfied by Non-blocking gap prose', () => {
  assert.equal(validatePrBody(fixture('non-blocking-gap-prose.md')).ok, true);
});

test('passes ⚠️ matrix cell satisfied by optional Non-blocking gap checkbox', () => {
  assert.equal(
    validatePrBody(fixture('non-blocking-gap-optional-with-warning.md')).ok,
    true,
  );
});

test('fails Non-blocking gap checkbox missing the optional marker', () => {
  const result = validatePrBody(fixture('non-blocking-gap-required.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Non-blocking gap rows must be marked optional/i);
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

test('fails included test gap while unchecked with gap-specific text', () => {
  const result = validatePrBody(fixture('e2e-gap-unchecked.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unresolved validation gap/i);
  assert.match(result.errors.join('\n'), /browser behavior not covered/);
});

test('fails canonical unresolved test gaps with gap-specific text', () => {
  const result = validatePrBody(fixture('test-gap-unchecked.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /unresolved validation gap/i);
  assert.match(result.errors.join('\n'), /Linux validation has not rerun/);
  assert.doesNotMatch(
    result.errors.join('\n'),
    /required checklist item is unchecked/i,
  );
});

test('fails prose workaround when matrix warning lacks canonical test gap', () => {
  const result = validatePrBody(fixture('test-gap-prose-workaround.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /missing .*Test gap/i);
  assert.match(result.errors.join('\n'), /AC-86-1/);
});

test('fails checked test gaps because gaps are not completion tasks', () => {
  const result = validatePrBody(fixture('test-gap-checked.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /test gap checkbox must remain unchecked/i);
  assert.match(result.errors.join('\n'), /Linux validation has not rerun/);
});

test('fails prose workaround even without a matrix warning cell', () => {
  const result = validatePrBody(fixture('test-gap-prose-no-warning.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /use canonical ⚠️ Test gap/i);
  assert.match(result.errors.join('\n'), /Blocking validation gap/);
});

test('fails checked checkbox-wrapped prose workaround', () => {
  const result = validatePrBody(
    '## Acceptance criteria\n\n### AC-86-1\n\n- [x] Blocking validation gap: Linux validation has not rerun.\n',
  );
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /use canonical ⚠️ Test gap/i);
  assert.match(result.errors.join('\n'), /Blocking validation gap/);
});

test('fails optional checkbox-wrapped prose workaround', () => {
  const result = validatePrBody(
    '## Acceptance criteria\n\n### AC-86-1\n\n<!-- pr-checkbox: optional -->\n- [ ] Blocking validation gap: Linux validation has not rerun.\n',
  );
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /use canonical ⚠️ Test gap/i);
  assert.match(result.errors.join('\n'), /Blocking validation gap/);
});

test('fails manual test row while unchecked', () => {
  const result = validatePrBody(fixture('manual-unchecked.md'));
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Manual test/);
});

test('fails unmarked visible unchecked checklist rows by default', () => {
  const result = validatePrBody('- [ ] Rotate the production secret.');
  assert.equal(result.ok, false);
  assert.match(result.errors.join('\n'), /Rotate the production secret/);
});

test('ignores unchecked checklist examples inside HTML comments', () => {
  const body = `## Do before merging

<!--
  Example: - [ ] Rotate the production secret after deploy.
-->
`;
  assert.equal(validatePrBody(body).ok, true);
});
