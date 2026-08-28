import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { decideOrchestrationAction } from '../scripts/orchestration-policy.mjs';

const activeDelegationFixture = JSON.parse(
  await readFile(
    new URL('./fixtures/idle-with-active-delegation.json', import.meta.url),
    'utf8'
  )
);

assert.deepEqual(decideOrchestrationAction(activeDelegationFixture), {
  action: 'leave-unchanged',
  reason: 'delegated-work-active',
});

assert.deepEqual(
  decideOrchestrationAction({
    parentState: 'idle',
    delegatedWorkState: 'unknown',
    nextActionState: 'unblocked',
  }),
  {
    action: 'leave-unchanged',
    reason: 'delegated-work-unknown',
  }
);

assert.deepEqual(
  decideOrchestrationAction({
    parentState: 'idle',
    delegatedWorkState: 'inactive',
    nextActionState: 'unblocked',
  }),
  {
    action: 'send-instruction',
    reason: 'idle-and-actionable',
  }
);

assert.deepEqual(
  decideOrchestrationAction({
    parentState: 'interrupted',
    delegatedWorkState: 'active',
    nextActionState: 'unblocked',
  }),
  {
    action: 'leave-unchanged',
    reason: 'delegated-work-active',
  }
);

assert.deepEqual(
  decideOrchestrationAction({
    parentState: 'interrupted',
    delegatedWorkState: 'inactive',
    nextActionState: 'unblocked',
  }),
  {
    action: 'leave-unchanged',
    reason: 'parent-not-idle',
  }
);

const policyScript = fileURLToPath(
  new URL('../scripts/orchestration-policy.mjs', import.meta.url)
);
const commandOutput = execFileSync(
  process.execPath,
  [
    policyScript,
    JSON.stringify({
      parentState: 'idle',
      delegatedWorkState: 'unknown',
      nextActionState: 'unblocked',
    }),
  ],
  { encoding: 'utf8' }
);
assert.deepEqual(JSON.parse(commandOutput), {
  action: 'leave-unchanged',
  reason: 'delegated-work-unknown',
});

const overlayPolicyScript = fileURLToPath(
  new URL(
    '../../../.agents/skills/orchestrate/scripts/orchestration-policy.mjs',
    import.meta.url
  )
);
const overlayCommandOutput = execFileSync(
  process.execPath,
  [
    overlayPolicyScript,
    JSON.stringify({
      parentState: 'idle',
      delegatedWorkState: 'inactive',
      nextActionState: 'unblocked',
    }),
  ],
  { encoding: 'utf8' }
);
assert.deepEqual(JSON.parse(overlayCommandOutput), {
  action: 'send-instruction',
  reason: 'idle-and-actionable',
});

console.log('OK: orchestration policy assertions passed');
