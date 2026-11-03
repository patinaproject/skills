import assert from 'node:assert/strict';
import test from 'node:test';

const { excludedTools, isReadOnlyType } = await import(new URL('../../plugins/code/pi/read-only.ts', import.meta.url).pathname);

test('patina-reader types are read-only', () => {
  for (const type of ['patina-reader', 'patina-reader-low', 'patina-reader-medium', 'patina-reader-high', 'patina-reader-xhigh', 'patina-reader-max']) {
    assert.equal(isReadOnlyType(type), true, type);
  }
});

test('other types are not read-only', () => {
  for (const type of ['general-purpose', 'patina-agent', 'patina-agent-high', 'comment-sicko', 'effort-high', 'patina-reader-extreme', 'patina-readers']) {
    assert.equal(isReadOnlyType(type), false, type);
  }
});

test('a read-only dispatch excludes edit and write', () => {
  assert.deepEqual(excludedTools(isReadOnlyType('patina-reader'), false), ['edit', 'write']);
  assert.deepEqual(excludedTools(isReadOnlyType('patina-reader-max'), true), ['edit', 'write', 'agent']);
});

test('a writing dispatch keeps edit and write', () => {
  assert.deepEqual(excludedTools(isReadOnlyType('patina-agent'), false), []);
  assert.deepEqual(excludedTools(isReadOnlyType('general-purpose'), true), ['agent']);
});
