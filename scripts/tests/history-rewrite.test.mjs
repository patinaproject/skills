import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  collectReferences,
  rewriteText,
  validateInventory,
  validateLivePullInventory,
  validateMapping,
} from '../history-rewrite.mjs';

const inventory = JSON.parse(
  await readFile('docs/history-rewrite-inventory.json', 'utf8')
);
const mappingDocument = JSON.parse(
  await readFile('docs/history-rewrite-map.json', 'utf8')
);
const runbook = await readFile('docs/history-rewrite.md', 'utf8');
const references = Object.keys(inventory.references);

validateInventory(inventory);
validateMapping(references, mappingDocument.mappings);

assert.equal(inventory.immutablePullRefs.observedRefCount, 196);
assert.equal(inventory.immutablePullRefs.observedPullOnlyCommitCount, 738);
assert.equal(
  Object.values(inventory.references).flatMap(
    ({ writableCommitMessages }) => writableCommitMessages
  ).length,
  7
);
assert.equal(
  Object.values(inventory.references).flatMap(
    ({ immutablePullCommitMessages }) => immutablePullCommitMessages
  ).length,
  23
);
assert.throws(
  () =>
    validateInventory({
      ...inventory,
      immutablePullRefs: {
        ...inventory.immutablePullRefs,
        referencedCommitCount: 22,
      },
    }),
  /immutable pull reference inventory mismatch/
);
const livePullInventory = {
  refCount: inventory.immutablePullRefs.observedRefCount,
  pullOnlyCommitCount:
    inventory.immutablePullRefs.observedPullOnlyCommitCount,
  referencedCommitCount: inventory.immutablePullRefs.referencedCommitCount,
  references: Object.fromEntries(
    Object.entries(inventory.references)
      .filter(([, entry]) => entry.immutablePullCommitMessages.length > 0)
      .map(([reference, entry]) => [
        reference,
        [...entry.immutablePullCommitMessages],
      ])
  ),
};
validateLivePullInventory(livePullInventory, inventory);
assert.throws(
  () =>
    validateLivePullInventory(
      { ...livePullInventory, refCount: livePullInventory.refCount + 1 },
      inventory
    ),
  /live immutable pull reference inventory changed/
);
assert.throws(
  () =>
    validateLivePullInventory(
      {
        ...livePullInventory,
        pullOnlyCommitCount: livePullInventory.pullOnlyCommitCount + 1,
      },
      inventory
    ),
  /live immutable pull reference inventory changed/
);

assert.deepEqual(
  collectReferences([
    'feat: PAT-2776 release tags',
    'Related to PAT-971 and PAT-2776',
  ]),
  ['PAT-971', 'PAT-2776']
);
assert.equal(
  rewriteText(
    'feat: PAT-2776 release tags\n\nRelated to PAT-971',
    mappingDocument.mappings
  ),
  'feat: #293 release tags\n\nRelated to the prior org-wide tracker migration'
);
assert.throws(
  () => validateMapping([...references, 'PAT-9999'], mappingDocument.mappings),
  /missing=\[PAT-9999\]/
);
assert.match(runbook, /Never use `git push --mirror`/);
assert.match(runbook, /refspec_args/);
assert.match(runbook, /push \\\n     --atomic \\/);
assert.doesNotMatch(runbook, /^\s+--mirror\s*\\/m);

console.info('OK: history rewrite mapping contract passed');
