import { fileURLToPath } from 'node:url';

const resumableParentStates = new Set(['idle', 'interrupted']);

export function decideOrchestrationAction({
  parentState,
  delegatedWorkState,
  nextActionState,
}) {
  if (delegatedWorkState === 'active') {
    return {
      action: 'leave-unchanged',
      reason: 'delegated-work-active',
    };
  }

  if (delegatedWorkState !== 'inactive') {
    return {
      action: 'leave-unchanged',
      reason: 'delegated-work-unknown',
    };
  }

  if (nextActionState === 'operator-required') {
    return {
      action: 'report-operator',
      reason: 'operator-required',
    };
  }

  if (
    resumableParentStates.has(parentState) &&
    nextActionState === 'unblocked'
  ) {
    return {
      action: 'send-instruction',
      reason: 'idle-and-actionable',
    };
  }

  return {
    action: 'leave-unchanged',
    reason:
      parentState === 'active'
        ? 'parent-active'
        : 'no-unblocked-next-action',
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const input = JSON.parse(process.argv[2] ?? '{}');
  process.stdout.write(`${JSON.stringify(decideOrchestrationAction(input))}\n`);
}
