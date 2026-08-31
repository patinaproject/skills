#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

function fail(message) {
  throw new Error(message);
}

function requiredArgument(name) {
  const index = process.argv.indexOf(`--${name}`);
  const value = index >= 0 ? process.argv[index + 1] : null;
  if (!value?.trim()) {
    fail(`--${name} requires one non-empty value.`);
  }
  return value.trim();
}

function run(command, args, acceptedStatuses = new Set([0])) {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (!acceptedStatuses.has(result.status)) {
    fail(result.stderr.trim() || `${command} ${args.join(' ')} failed.`);
  }
  return result;
}

function json(command, args, acceptedStatuses) {
  const result = run(command, args, acceptedStatuses);
  try {
    return JSON.parse(result.stdout);
  } catch {
    fail(`Expected JSON from ${command} ${args.join(' ')}.`);
  }
}

function git(...args) {
  return run('git', args).stdout.trim();
}

const controllerScript = resolve(
  import.meta.dirname,
  'controller-state.mjs',
);

const task = requiredArgument('task');
const controller = json(process.execPath, [controllerScript, 'show']);
if (!controller.pullRequest || !controller.headSha || !controller.checkEpochStartedAt) {
  fail('The develop controller has no published pull request epoch to inspect.');
}

const repository = json('gh', [
  'repo',
  'view',
  '--json',
  'nameWithOwner',
]).nameWithOwner;
function readPullRequest() {
  return json('gh', [
    'pr',
    'view',
    controller.pullRequest,
    '--json',
    'number,url,headRefName,headRefOid,baseRefName,isDraft,mergeable,mergeStateStatus,reviewDecision',
  ]);
}

let pullRequest = readPullRequest();
const local = {
  branch: git('branch', '--show-current'),
  headSha: git('rev-parse', 'HEAD'),
};

function requireMatchingHeads(currentPullRequest) {
  for (const [name, actual, expected] of [
    ['branch', local.branch, controller.branch],
    ['local head', local.headSha, controller.headSha],
    ['pull-request branch', currentPullRequest.headRefName, controller.branch],
    ['pull-request head', currentPullRequest.headRefOid, controller.headSha],
  ]) {
    if (actual !== expected) {
      fail(`Develop evidence ${name} mismatch: expected ${expected}, found ${actual}.`);
    }
  }
}

requireMatchingHeads(pullRequest);

const diffPaths = run('gh', [
  'pr',
  'diff',
  controller.pullRequest,
  '--name-only',
]).stdout.trim().split('\n').filter(Boolean);

const checkResult = run(
  'gh',
  [
    'pr',
    'checks',
    controller.pullRequest,
    '--required',
    '--json',
    'bucket,completedAt,event,link,name,startedAt,state,workflow',
  ],
  new Set([0, 1, 8]),
);
const requiredChecks = checkResult.stdout.trim()
  ? JSON.parse(checkResult.stdout)
  : [];
const epochStartedAt = Date.parse(controller.checkEpochStartedAt);

function selectCurrentContextRuns(checks) {
  const contexts = new Map();
  for (const check of checks) {
    const identity = `${check.workflow}\0${check.name}`;
    const candidates = contexts.get(identity) ?? [];
    candidates.push(check);
    contexts.set(identity, candidates);
  }
  return [...contexts.values()].map((candidates) => {
    const queued = candidates.find(
      ({ completedAt, startedAt }) => !completedAt && !startedAt,
    );
    if (queued) {
      return queued;
    }
    return candidates.toSorted(
      (left, right) => Date.parse(right.startedAt) - Date.parse(left.startedAt),
    )[0];
  });
}

const selectedChecks = selectCurrentContextRuns(requiredChecks);
const checkIdentity = ({ name, workflow }) => `${workflow}\0${name}`;
const selectedByIdentity = new Map(
  selectedChecks.map((check) => [checkIdentity(check), check]),
);
const requiredCheckSet = controller.requiredCheckSet ?? { status: 'unknown' };
const contextsKnown = requiredCheckSet.status === 'known';
const expectedContexts = contextsKnown ? requiredCheckSet.contexts : [];
const contextByIdentity = new Map(
  expectedContexts.map((context) => [checkIdentity(context), context]),
);
for (const check of selectedChecks) {
  contextByIdentity.set(checkIdentity(check), {
    name: check.name,
    workflow: check.workflow,
  });
}
const currentEpochChecks = [];
const awaitingContexts = [];
for (const [identity, context] of contextByIdentity) {
  const check = selectedByIdentity.get(identity);
  if (
    !check ||
    !Number.isFinite(Date.parse(check.startedAt)) ||
    Date.parse(check.startedAt) < epochStartedAt
  ) {
    awaitingContexts.push(context);
  } else {
    currentEpochChecks.push(check);
  }
}
const terminalBuckets = new Set(['pass', 'fail', 'skipping', 'cancel']);
const passingBuckets = new Set(['pass', 'skipping']);
const epochTerminal =
  contextsKnown &&
  awaitingContexts.length === 0 &&
  currentEpochChecks.every(({ bucket }) => terminalBuckets.has(bucket));
const epochPassing =
  contextsKnown &&
  awaitingContexts.length === 0 &&
  currentEpochChecks.every(({ bucket }) => passingBuckets.has(bucket));

if (epochTerminal) {
  pullRequest = readPullRequest();
  requireMatchingHeads(pullRequest);
}

const [owner, name] = repository.split('/');
const reviewQuery = `
  query($owner: String!, $name: String!, $number: Int!, $endCursor: String) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        reviewThreads(first: 100, after: $endCursor) {
          pageInfo { hasNextPage endCursor }
          nodes {
            id isResolved isOutdated path line startLine
            comments(first: 1) {
              nodes {
                url databaseId body
                author { login __typename }
                commit { oid }
              }
            }
          }
        }
      }
    }
  }
`;
const reviewPages = json('gh', [
  'api',
  'graphql',
  '--paginate',
  '--slurp',
  '-f',
  `query=${reviewQuery}`,
  '-F',
  `owner=${owner}`,
  '-F',
  `name=${name}`,
  '-F',
  `number=${pullRequest.number}`,
]);
const reviewThreads = reviewPages.flatMap(
  ({ data }) => data.repository.pullRequest.reviewThreads.nodes,
);

process.stdout.write(`${JSON.stringify({
  controller,
  diffPaths,
  local,
  pullRequest,
  repository,
  requiredChecks: {
    awaitingContexts,
    contextsEvidence: contextsKnown ? requiredCheckSet.evidence : null,
    contextsKnown,
    currentEpoch: currentEpochChecks,
    expectedContexts,
    history: requiredChecks,
    passing: epochPassing,
    terminal: epochTerminal,
  },
  reviewThreads: {
    nodes: reviewThreads,
    pageCount: reviewPages.length,
  },
  task,
}, null, 2)}\n`);
