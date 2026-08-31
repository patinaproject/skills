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
    branch: '409-controller',
    checkEpoch: 0,
    checkEpochStartedAt: null,
    headSha: null,
    issue: '#409',
    pendingAction: 'Verify publication prerequisites',
    phase: 'prerequisites',
    pullRequest: null,
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
  const polished = run(
    'advance',
    [
      '--phase',
      'polish',
      '--pending-action',
      'Run the current-head review',
    ],
    repository,
  );
  assert.equal(polished.status, 0, polished.stderr);

  const advancedState = JSON.parse(readFileSync(statePath, 'utf8'));
  assert.equal(advancedState.phase, 'polish');
  assert.equal(advancedState.pendingAction, 'Run the current-head review');
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
      '--pull-request',
      '123',
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
  assert.equal(publishedState.phase, 'readiness');
  assert.equal(publishedState.pullRequest, '123');
  assert.equal(publishedState.headSha, firstHead);
  assert.equal(publishedState.checkEpoch, 1);
  assert.equal(publishedState.checkEpochStartedAt, publicationEpoch);

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
    ],
    repository,
  );
  assert.equal(blocked.status, 0, blocked.stderr);
  const blockedState = JSON.parse(run('show', [], repository).stdout);
  assert.equal(blockedState.status, 'blocked');
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
