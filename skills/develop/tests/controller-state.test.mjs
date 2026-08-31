import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const script = resolve(
  import.meta.dirname,
  '../scripts/controller-state.mjs',
);

function run(command, args, cwd) {
  return spawnSync(process.execPath, [script, command, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function git(cwd, ...args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function createRepository() {
  const repository = mkdtempSync(join(tmpdir(), 'develop-controller-'));
  git(repository, 'init', '--initial-branch=409-controller');
  return repository;
}

{
  const repository = createRepository();
  const result = run(
    'init',
    [
      '--issue',
      '#409',
      '--branch',
      '409-controller',
      '--requirement',
      'R1=Persist progress outside the model turn',
      '--pending-action',
      'Verify publication prerequisites',
    ],
    repository,
  );

  assert.equal(result.status, 0, result.stderr);
  const statePath = result.stdout.trim();
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.deepEqual(state, {
    blockerEvidence: null,
    branch: '409-controller',
    checkEpoch: 0,
    checkEpochStartedAt: null,
    headSha: null,
    issue: '#409',
    pendingAction: 'Verify publication prerequisites',
    phase: 'prerequisites',
    pullRequest: null,
    requiredCheckSet: { status: 'unknown' },
    requirements: [
      {
        evidence: null,
        id: 'R1',
        status: 'pending',
        text: 'Persist progress outside the model turn',
      },
    ],
    status: 'nonterminal',
    version: 1,
  });

  const duplicateInit = run(
    'init',
    [
      '--issue',
      '#409',
      '--branch',
      '409-controller',
      '--pending-action',
      'Restart implementation',
    ],
    repository,
  );
  assert.equal(duplicateInit.status, 1);
  assert.match(duplicateInit.stderr, /already nonterminal/);

  const prematurePolish = run(
    'advance',
    [
      '--phase',
      'polish',
      '--pending-action',
      'Review the complete implementation',
    ],
    repository,
  );
  assert.equal(prematurePolish.status, 1);
  assert.match(prematurePolish.stderr, /R1/);

  const completed = run(
    'complete-requirement',
    [
      '--id',
      'R1',
      '--evidence',
      'Controller state survives a separate process',
      '--pending-action',
      'Run polish',
    ],
    repository,
  );
  assert.equal(completed.status, 0, completed.stderr);
  const skippedImplementation = run(
    'advance',
    [
      '--phase',
      'polish',
      '--pending-action',
      'Run the current-head review',
    ],
    repository,
  );
  assert.equal(skippedImplementation.status, 1);
  assert.match(skippedImplementation.stderr, /prerequisites to polish/);

  for (const [phase, pendingAction] of [
    ['implementation', 'Implement the complete requirement ledger'],
    ['verification', 'Run repository verification'],
    ['polish', 'Run the current-head review'],
    ['publication', 'Publish the reviewed head'],
  ]) {
    const advanced = run(
      'advance',
      ['--phase', phase, '--pending-action', pendingAction],
      repository,
    );
    assert.equal(advanced.status, 0, advanced.stderr);
  }

  const polished = run(
    'show',
    [],
    repository,
  );
  assert.equal(polished.status, 0, polished.stderr);

  const advancedState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(advancedState.phase, 'publication');
  assert.equal(advancedState.pendingAction, 'Publish the reviewed head');
  assert.deepEqual(advancedState.requirements[0], {
    evidence: 'Controller state survives a separate process',
    id: 'R1',
    status: 'complete',
    text: 'Persist progress outside the model turn',
  });

  const firstHead = 'a'.repeat(40);
  const publicationEpoch = '2026-08-31T08:00:00.000Z';
  const published = run(
    'publish',
    [
      '--head',
      firstHead,
      '--check-epoch-started-at',
      publicationEpoch,
      '--pending-action',
      'Wait for required checks',
    ],
    repository,
  );
  assert.equal(published.status, 0, published.stderr);
  let publishedState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(publishedState.phase, 'publication');
  assert.equal(publishedState.pullRequest, null);
  assert.equal(publishedState.headSha, firstHead);
  assert.equal(publishedState.checkEpoch, 1);
  assert.equal(publishedState.checkEpochStartedAt, publicationEpoch);

  const replayedPublication = run(
    'publish',
    [
      '--head',
      firstHead,
      '--check-epoch-started-at',
      '2026-08-31T08:05:00.000Z',
      '--pending-action',
      'Resume waiting for required checks',
    ],
    repository,
  );
  assert.equal(replayedPublication.status, 0, replayedPublication.stderr);
  publishedState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(publishedState.checkEpoch, 1);
  assert.equal(publishedState.checkEpochStartedAt, publicationEpoch);
  assert.equal(
    publishedState.pendingAction,
    'Resume waiting for required checks',
  );

  const attached = run(
    'attach-pull-request',
    [
      '--pull-request',
      '123',
      '--pending-action',
      'Observe the required check contexts',
    ],
    repository,
  );
  assert.equal(attached.status, 0, attached.stderr);
  publishedState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(publishedState.phase, 'readiness');
  assert.equal(publishedState.pullRequest, '123');

  const recordedContexts = run(
    'record-check-contexts',
    [
      '--context',
      'CI=test',
      '--evidence',
      'gh pr checks --required returned the CI test context',
      '--pending-action',
      'Start the ready-for-review epoch',
    ],
    repository,
  );
  assert.equal(recordedContexts.status, 0, recordedContexts.stderr);
  publishedState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.deepEqual(publishedState.requiredCheckSet, {
    contexts: [{ name: 'test', workflow: 'CI' }],
    evidence: 'gh pr checks --required returned the CI test context',
    status: 'known',
  });

  const readyReviewEpoch = '2026-08-31T08:10:00.000Z';
  const readyEpoch = run(
    'start-check-epoch',
    [
      '--pending-action',
      'Wait for checks triggered by the ready-for-review transition',
      '--check-epoch-started-at',
      readyReviewEpoch,
    ],
    repository,
  );
  assert.equal(readyEpoch.status, 0, readyEpoch.stderr);
  publishedState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(publishedState.headSha, firstHead);
  assert.equal(publishedState.checkEpoch, 2);
  assert.equal(publishedState.checkEpochStartedAt, readyReviewEpoch);
  assert.equal(
    publishedState.pendingAction,
    'Wait for checks triggered by the ready-for-review transition',
  );

  const staleEpoch = run(
    'start-check-epoch',
    [
      '--pending-action',
      'Do not replace the current epoch',
      '--check-epoch-started-at',
      publicationEpoch,
    ],
    repository,
  );
  assert.equal(staleEpoch.status, 1);
  assert.match(staleEpoch.stderr, /later check-epoch timestamp/);

  const resumedImplementation = run(
    'advance',
    [
      '--phase',
      'implementation',
      '--pending-action',
      'Repair the branch-caused check failure',
    ],
    repository,
  );
  assert.equal(resumedImplementation.status, 0, resumedImplementation.stderr);
  const secondHead = 'b'.repeat(40);
  const prematureRepublish = run(
    'publish',
    [
      '--pull-request',
      '123',
      '--head',
      secondHead,
      '--check-epoch-started-at',
      '2026-08-31T08:20:00.000Z',
      '--pending-action',
      'Recheck the new published head',
    ],
    repository,
  );
  assert.equal(prematureRepublish.status, 1);
  assert.match(prematureRepublish.stderr, /cannot publish from implementation/);

  for (const [phase, pendingAction] of [
    ['verification', 'Verify the repaired branch'],
    ['polish', 'Review the repaired branch'],
    ['publication', 'Publish the repaired branch'],
  ]) {
    const advanced = run(
      'advance',
      ['--phase', phase, '--pending-action', pendingAction],
      repository,
    );
    assert.equal(advanced.status, 0, advanced.stderr);
  }

  const sameHeadPublication = run(
    'publish',
    [
      '--pull-request',
      '123',
      '--head',
      firstHead,
      '--check-epoch-started-at',
      '2026-08-31T08:20:00.000Z',
      '--pending-action',
      'Do not create a publication epoch without a new head',
    ],
    repository,
  );
  assert.equal(sameHeadPublication.status, 1);
  assert.match(sameHeadPublication.stderr, /requires a new head/);

  const republished = run(
    'publish',
    [
      '--pull-request',
      '123',
      '--head',
      secondHead,
      '--check-epoch-started-at',
      '2026-08-31T08:20:00.000Z',
      '--pending-action',
      'Recheck the new published head',
    ],
    repository,
  );
  assert.equal(republished.status, 0, republished.stderr);
  publishedState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(publishedState.headSha, secondHead);
  assert.equal(publishedState.checkEpoch, 3);

  const terminal = run('ready', [], repository);
  assert.equal(terminal.status, 0, terminal.stderr);
  const terminalState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(terminalState.status, 'ready-to-merge');
  assert.equal(terminalState.pendingAction, null);

  const lateAdvance = run(
    'advance',
    ['--phase', 'implementation', '--pending-action', 'Make another change'],
    repository,
  );
  assert.equal(lateAdvance.status, 1);
  assert.match(lateAdvance.stderr, /already terminal/);
}

{
  const repository = createRepository();
  const statePath = run(
    'init',
    [
      '--issue',
      '#409',
      '--branch',
      '409-controller',
      '--pending-action',
      'Publish the draft',
    ],
    repository,
  ).stdout.trim();
  for (const [phase, pendingAction] of [
    ['implementation', 'Implement'],
    ['verification', 'Verify'],
    ['polish', 'Review'],
    ['publication', 'Publish'],
  ]) {
    const advanced = run(
      'advance',
      ['--phase', phase, '--pending-action', pendingAction],
      repository,
    );
    assert.equal(advanced.status, 0, advanced.stderr);
  }
  const published = run(
    'publish',
    [
      '--pull-request',
      '456',
      '--head',
      'c'.repeat(40),
      '--check-epoch-started-at',
      '2026-08-31T09:00:00.000Z',
      '--pending-action',
      'Mark the draft ready to trigger required workflows',
    ],
    repository,
  );
  assert.equal(published.status, 0, published.stderr);

  const started = run(
    'start-check-epoch',
    [
      '--pending-action',
      'Discover required contexts after the ready-for-review transition',
      '--check-epoch-started-at',
      '2026-08-31T09:05:00.000Z',
    ],
    repository,
  );
  assert.equal(started.status, 0, started.stderr);
  const state = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(state.checkEpoch, 2);
  assert.deepEqual(state.requiredCheckSet, { status: 'unknown' });

  const prematureReady = run('ready', [], repository);
  assert.equal(prematureReady.status, 1);
  assert.match(prematureReady.stderr, /required check contexts are known/);
}

{
  const repository = createRepository();
  const initialized = run(
    'init',
    [
      '--issue',
      '#409',
      '--branch',
      '409-controller',
      '--pending-action',
      'Check durable continuation',
    ],
    repository,
  );
  assert.equal(initialized.status, 0, initialized.stderr);

  const shown = run('show', [], repository);
  assert.equal(shown.status, 0, shown.stderr);
  assert.equal(JSON.parse(shown.stdout).status, 'nonterminal');

  const blocked = run(
    'block',
    [
      '--pending-action',
      'Install a task heartbeat capability and resume this develop task',
      '--evidence',
      'The host exposes no same-task event or heartbeat mechanism',
    ],
    repository,
  );
  assert.equal(blocked.status, 0, blocked.stderr);
  const blockedState = JSON.parse(run('show', [], repository).stdout);
  assert.equal(blockedState.status, 'blocked');
  assert.equal(
    blockedState.blockerEvidence,
    'The host exposes no same-task event or heartbeat mechanism',
  );
  assert.equal(
    blockedState.pendingAction,
    'Install a task heartbeat capability and resume this develop task',
  );
}

{
  const repository = createRepository();
  const initialized = run(
    'init',
    [
      '--issue',
      '#409',
      '--branch',
      '409-controller',
      '--pending-action',
      'Begin implementation',
    ],
    repository,
  );
  assert.equal(initialized.status, 0, initialized.stderr);
  git(repository, 'branch', '-m', 'different-branch');

  const shown = run('show', [], repository);
  assert.equal(shown.status, 1);
  assert.match(shown.stderr, /branch mismatch/);
}

console.info('OK: develop controller state contract passed');
