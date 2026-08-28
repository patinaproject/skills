import { realpathSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

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

  if (parentState === 'idle' && nextActionState === 'unblocked') {
    return {
      action: 'send-instruction',
      reason: 'idle-and-actionable',
    };
  }

  if (parentState === 'active') {
    return {
      action: 'leave-unchanged',
      reason: 'parent-active',
    };
  }

  if (parentState !== 'idle') {
    return {
      action: 'leave-unchanged',
      reason: 'parent-not-idle',
    };
  }

  return {
    action: 'leave-unchanged',
    reason: 'no-unblocked-next-action',
  };
}

const isDirectInvocation =
  process.argv[1] !== undefined &&
  realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectInvocation) {
  const input = JSON.parse(process.argv[2] ?? '{}');
  process.stdout.write(`${JSON.stringify(decideOrchestrationAction(input))}\n`);
}
