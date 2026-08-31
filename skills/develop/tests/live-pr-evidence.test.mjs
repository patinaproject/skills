import assert from 'node:assert/strict';
import {
  chmodSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const controllerScript = resolve(
  import.meta.dirname,
  '../scripts/controller-state.mjs',
);
const evidenceScript = resolve(
  import.meta.dirname,
  '../scripts/live-pr-evidence.mjs',
);

function run(command, args, cwd, env = process.env) {
  return spawnSync(command, args, { cwd, encoding: 'utf8', env });
}

function git(cwd, ...args) {
  const result = run('git', args, cwd);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

const repository = mkdtempSync(join(tmpdir(), 'develop-live-evidence-'));
git(repository, 'init', '--initial-branch=409-controller');
git(repository, 'config', 'user.name', 'Develop evidence test');
git(repository, 'config', 'user.email', 'develop-evidence@example.com');
writeFileSync(join(repository, 'changed.md'), 'current\n');
git(repository, 'add', 'changed.md');
git(repository, 'commit', '-m', 'test fixture');
const headSha = git(repository, 'rev-parse', 'HEAD');

let result = run(
  process.execPath,
  [
    controllerScript,
    'init',
    '--issue',
    '#409',
    '--branch',
    '409-controller',
    '--requirement',
    'R1=Join the controller to live pull-request state',
    '--pending-action',
    'Build the evidence seam',
  ],
  repository,
);
assert.equal(result.status, 0, result.stderr);

for (const args of [
  [
    'complete-requirement',
    '--id',
    'R1',
    '--evidence',
    'The live evidence helper covers the joined state',
    '--pending-action',
    'Verify the evidence helper',
  ],
  ['advance', '--phase', 'implementation', '--pending-action', 'Implement'],
  ['advance', '--phase', 'verification', '--pending-action', 'Verify'],
  ['advance', '--phase', 'polish', '--pending-action', 'Review'],
  ['advance', '--phase', 'publication', '--pending-action', 'Publish'],
  [
    'publish',
    '--pull-request',
    '77',
    '--head',
    headSha,
    '--check-epoch-started-at',
    '2026-08-31T08:00:00.000Z',
    '--pending-action',
    'Collect live evidence',
  ],
  [
    'record-check-contexts',
    '--context',
    'CI=test',
    '--context',
    'CI=lint',
    '--context',
    'CI=replacement-pending',
    '--context',
    'CI=replacement-passed',
    '--evidence',
    'The pull request required-check query returned four contexts',
    '--pending-action',
    'Collect live evidence',
  ],
]) {
  result = run(process.execPath, [controllerScript, ...args], repository);
  assert.equal(result.status, 0, result.stderr);
}

const fakeBin = join(repository, 'fake-bin');
mkdirSync(fakeBin);
const fakeGh = join(fakeBin, 'gh');
writeFileSync(
  fakeGh,
  `#!/usr/bin/env node
const fs = require('node:fs');
const args = process.argv.slice(2);
const head = process.env.FAKE_PR_HEAD;
if (args[0] === 'repo' && args[1] === 'view') {
  console.log(JSON.stringify({ nameWithOwner: 'patinaproject/skills' }));
} else if (args[0] === 'pr' && args[1] === 'view') {
  const counterPath = process.env.FAKE_PR_VIEW_COUNTER;
  const viewCount = Number(fs.readFileSync(counterPath, 'utf8') || '0') + 1;
  fs.writeFileSync(counterPath, String(viewCount));
  console.log(JSON.stringify({
    number: 77,
    url: 'https://github.com/patinaproject/skills/pull/77',
    headRefName: '409-controller',
    headRefOid: head,
    baseRefName: 'main',
    isDraft: false,
    mergeable: 'MERGEABLE',
    mergeStateStatus: viewCount > 1 ? 'CLEAN' : 'BLOCKED',
    reviewDecision: '',
  }));
} else if (args[0] === 'pr' && args[1] === 'diff') {
  console.log('changed.md');
} else if (args[0] === 'pr' && args[1] === 'checks') {
  const historicalChecks = [
    {
      bucket: 'pass', completedAt: '2026-08-31T08:02:00Z', event: 'pull_request',
      link: 'https://example.com/check/current', name: 'test',
      startedAt: '2026-08-31T08:01:00Z', state: 'SUCCESS', workflow: 'CI',
    },
    {
      bucket: 'pass', completedAt: '2026-08-31T07:57:00Z', event: 'pull_request',
      link: 'https://example.com/check/replaced', name: 'test',
      startedAt: '2026-08-31T07:56:00Z', state: 'SUCCESS', workflow: 'CI',
    },
    {
      bucket: 'pass', completedAt: '2026-08-31T07:59:00Z', event: 'pull_request',
      link: 'https://example.com/check/old', name: 'lint',
      startedAt: '2026-08-31T07:58:00Z', state: 'SUCCESS', workflow: 'CI',
    },
    {
      bucket: 'pass', completedAt: '2026-08-31T07:59:00Z', event: 'pull_request',
      link: 'https://example.com/check/pending-old', name: 'replacement-pending',
      startedAt: '2026-08-31T07:58:00Z', state: 'SUCCESS', workflow: 'CI',
    },
    {
      bucket: 'pending', completedAt: null, event: 'pull_request',
      link: 'https://example.com/check/pending-new', name: 'replacement-pending',
      startedAt: null, state: 'QUEUED', workflow: 'CI',
    },
    {
      bucket: 'fail', completedAt: '2026-08-31T08:02:00Z', event: 'pull_request',
      link: 'https://example.com/check/passed-old', name: 'replacement-passed',
      startedAt: '2026-08-31T08:01:00Z', state: 'FAILURE', workflow: 'CI',
    },
    {
      bucket: 'pass', completedAt: '2026-08-31T08:04:00Z', event: 'pull_request',
      link: 'https://example.com/check/passed-new', name: 'replacement-passed',
      startedAt: '2026-08-31T08:03:00Z', state: 'SUCCESS', workflow: 'CI',
    },
  ];
  const terminalChecks = [
    ['test', '2026-08-31T08:01:00Z'],
    ['lint', '2026-08-31T08:02:00Z'],
    ['replacement-pending', '2026-08-31T08:03:00Z'],
    ['replacement-passed', '2026-08-31T08:04:00Z'],
  ].map(([name, startedAt]) => ({
    bucket: 'pass', completedAt: '2026-08-31T08:05:00Z',
    event: 'pull_request', link: 'https://example.com/check/' + name,
    name, startedAt, state: 'SUCCESS', workflow: 'CI',
  }));
  const mode = process.env.FAKE_CHECK_MODE;
  if (mode !== 'empty-output') {
    console.log(JSON.stringify(
      mode === 'empty' ? [] : mode === 'terminal' ? terminalChecks : historicalChecks,
    ));
  }
  if (!mode) process.exitCode = 1;
} else if (args[0] === 'api' && args[1] === 'graphql') {
  const page = (hasNextPage, endCursor, thread) => ({
    data: { repository: { pullRequest: { reviewThreads: {
      pageInfo: { hasNextPage, endCursor }, nodes: [thread],
    } } } },
  });
  const thread = (id, isResolved) => ({
    id, isResolved, isOutdated: false, path: 'changed.md', line: 1, startLine: 1,
    comments: { nodes: [{
      url: 'https://example.com/thread/' + id,
      databaseId: id === 'thread-1' ? 1 : 2,
      body: 'Review comment',
      author: { login: 'review-bot', __typename: 'Bot' },
      commit: { oid: head },
    }] },
  });
  console.log(JSON.stringify([
    page(true, 'cursor-1', thread('thread-1', true)),
    page(false, null, thread('thread-2', false)),
  ]));
} else {
  console.error('Unexpected gh arguments: ' + args.join(' '));
  process.exit(1);
}
`,
);
chmodSync(fakeGh, 0o755);

const env = {
  ...process.env,
  FAKE_PR_HEAD: headSha,
  FAKE_PR_VIEW_COUNTER: join(repository, 'pr-view-count'),
  PATH: `${fakeBin}:${process.env.PATH}`,
};
writeFileSync(env.FAKE_PR_VIEW_COUNTER, '0');
result = run(
  process.execPath,
  [evidenceScript, '--task', 'task-409'],
  repository,
  env,
);
assert.equal(result.status, 0, result.stderr);
const evidence = JSON.parse(result.stdout);
assert.equal(evidence.task, 'task-409');
assert.equal(evidence.local.headSha, headSha);
assert.equal(evidence.pullRequest.headRefOid, headSha);
assert.deepEqual(evidence.diffPaths, ['changed.md']);
assert.equal(evidence.requiredChecks.currentEpoch.length, 2);
assert.deepEqual(evidence.requiredChecks.awaitingContexts, [
  { name: 'lint', workflow: 'CI' },
  { name: 'replacement-pending', workflow: 'CI' },
]);
assert.equal(
  evidence.requiredChecks.currentEpoch.find(
    ({ name }) => name === 'replacement-passed',
  ).bucket,
  'pass',
);
assert.equal(evidence.requiredChecks.history.length, 7);
assert.equal(evidence.requiredChecks.terminal, false);
assert.equal(evidence.reviewThreads.pageCount, 2);
assert.equal(evidence.reviewThreads.nodes.length, 2);

writeFileSync(env.FAKE_PR_VIEW_COUNTER, '0');
result = run(
  process.execPath,
  [evidenceScript, '--task', 'task-409'],
  repository,
  { ...env, FAKE_CHECK_MODE: 'empty' },
);
assert.equal(result.status, 0, result.stderr);
const emptyEvidence = JSON.parse(result.stdout);
assert.equal(emptyEvidence.requiredChecks.terminal, false);
assert.equal(emptyEvidence.requiredChecks.passing, false);
assert.equal(emptyEvidence.requiredChecks.awaitingContexts.length, 4);
assert.equal(emptyEvidence.pullRequest.mergeStateStatus, 'BLOCKED');

writeFileSync(env.FAKE_PR_VIEW_COUNTER, '0');
result = run(
  process.execPath,
  [evidenceScript, '--task', 'task-409'],
  repository,
  { ...env, FAKE_CHECK_MODE: 'empty-output' },
);
assert.equal(result.status, 0, result.stderr);
const emptyOutputEvidence = JSON.parse(result.stdout);
assert.equal(emptyOutputEvidence.requiredChecks.terminal, false);
assert.equal(emptyOutputEvidence.requiredChecks.passing, false);
assert.equal(emptyOutputEvidence.requiredChecks.awaitingContexts.length, 4);

writeFileSync(env.FAKE_PR_VIEW_COUNTER, '0');
result = run(
  process.execPath,
  [evidenceScript, '--task', 'task-409'],
  repository,
  { ...env, FAKE_CHECK_MODE: 'terminal' },
);
assert.equal(result.status, 0, result.stderr);
const terminalEvidence = JSON.parse(result.stdout);
assert.equal(terminalEvidence.requiredChecks.terminal, true);
assert.equal(terminalEvidence.requiredChecks.passing, true);
assert.equal(terminalEvidence.pullRequest.mergeStateStatus, 'CLEAN');
assert.equal(readFileSync(env.FAKE_PR_VIEW_COUNTER, 'utf8'), '2');

writeFileSync(env.FAKE_PR_VIEW_COUNTER, '0');
result = run(
  process.execPath,
  [evidenceScript, '--task', 'task-409'],
  repository,
  { ...env, FAKE_PR_HEAD: 'f'.repeat(40) },
);
assert.equal(result.status, 1);
assert.match(result.stderr, /pull-request head mismatch/);

console.info('OK: live develop pull-request evidence contract passed');
