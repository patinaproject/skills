#!/usr/bin/env node

import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

function fail(message) {
  throw new Error(message);
}

function git(...args) {
  const result = spawnSync('git', args, { encoding: 'utf8' });
  if (result.status !== 0) {
    fail(result.stderr.trim() || `git ${args.join(' ')} failed.`);
  }
  return result.stdout.trim();
}

function parseOptions(args) {
  const options = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index];
    const value = args[index + 1];
    if (!name?.startsWith('--') || value === undefined) {
      fail(`Expected --name value, received ${name ?? 'nothing'}.`);
    }
    const key = name.slice(2);
    const values = options.get(key) ?? [];
    values.push(value);
    options.set(key, values);
  }
  return options;
}

function requiredOption(options, name) {
  const values = options.get(name) ?? [];
  if (values.length !== 1 || !values[0].trim()) {
    fail(`--${name} requires one non-empty value.`);
  }
  return values[0].trim();
}

function optionalOption(options, name) {
  const values = options.get(name) ?? [];
  if (values.length > 1 || (values.length === 1 && !values[0].trim())) {
    fail(`--${name} accepts at most one non-empty value.`);
  }
  return values.length === 1 ? values[0].trim() : null;
}

const phaseTransitions = new Map([
  ['prerequisites', new Set(['implementation'])],
  ['implementation', new Set(['verification'])],
  ['verification', new Set(['implementation', 'polish'])],
  ['polish', new Set(['implementation', 'publication'])],
  ['publication', new Set(['implementation'])],
  ['readiness', new Set(['implementation'])],
]);

function pendingRequirementIds(state) {
  return state.requirements
    .filter(({ status }) => status !== 'complete')
    .map(({ id }) => id);
}

function requireCompleteRequirements(state, destination) {
  const pending = pendingRequirementIds(state);
  if (pending.length > 0) {
    fail(
      `Develop controller cannot enter ${destination}; requirements remain pending: ${pending.join(', ')}.`,
    );
  }
}

function statePath() {
  return join(
    git('rev-parse', '--path-format=absolute', '--git-dir'),
    'patinaproject-develop-controller.json',
  );
}

function writeState(path, state) {
  const temporaryPath = join(
    dirname(path),
    `.patinaproject-develop-controller-${process.pid}.tmp`,
  );
  writeFileSync(temporaryPath, `${JSON.stringify(state, null, 2)}\n`, {
    flag: 'wx',
    mode: 0o600,
  });
  renameSync(temporaryPath, path);
}

function loadState({ requireNonterminal = true } = {}) {
  const path = statePath();
  let state;
  try {
    state = JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    fail(`Develop controller state is missing or invalid at ${path}.`);
  }
  if (state.version !== 1) {
    fail(`Develop controller state version ${String(state.version)} is unsupported.`);
  }
  const currentBranch = git('branch', '--show-current');
  if (state.branch !== currentBranch) {
    fail(
      `Develop controller branch mismatch: expected ${state.branch}, found ${currentBranch || 'detached HEAD'}.`,
    );
  }
  if (requireNonterminal && state.status !== 'nonterminal') {
    fail(`Develop controller is already terminal: ${state.status}.`);
  }
  return { path, state };
}

function init(options) {
  const branch = requiredOption(options, 'branch');
  const currentBranch = git('branch', '--show-current');
  if (currentBranch !== branch) {
    fail(
      `Develop controller branch mismatch: expected ${branch}, found ${currentBranch || 'detached HEAD'}.`,
    );
  }
  const requirements = (options.get('requirement') ?? []).map((entry) => {
    const separator = entry.indexOf('=');
    if (separator < 1 || separator === entry.length - 1) {
      fail('--requirement must use ID=text with both values present.');
    }
    return {
      evidence: null,
      id: entry.slice(0, separator).trim(),
      status: 'pending',
      text: entry.slice(separator + 1).trim(),
    };
  });
  if (new Set(requirements.map(({ id }) => id)).size !== requirements.length) {
    fail('Develop controller requirement IDs must be unique.');
  }
  const path = statePath();
  if (existsSync(path)) {
    let existing;
    try {
      existing = JSON.parse(readFileSync(path, 'utf8'));
    } catch {
      fail(`Develop controller state is invalid at ${path}.`);
    }
    if (existing.status === 'nonterminal') {
      fail(
        `Develop controller is already nonterminal for ${existing.issue ?? 'an unknown issue'} on ${existing.branch ?? 'an unknown branch'}. Resume it instead of initializing another.`,
      );
    }
  }
  writeState(path, {
    blockerEvidence: null,
    branch,
    checkEpoch: 0,
    checkEpochStartedAt: null,
    headSha: null,
    issue: requiredOption(options, 'issue'),
    pendingAction: requiredOption(options, 'pending-action'),
    phase: 'prerequisites',
    pullRequest: null,
    requiredCheckContexts: [],
    requiredCheckContextsEvidence: null,
    requiredCheckContextsKnown: false,
    requirements,
    status: 'nonterminal',
    version: 1,
  });
  process.stdout.write(`${path}\n`);
}

function completeRequirement(options) {
  const { path, state } = loadState();
  const id = requiredOption(options, 'id');
  const requirement = state.requirements.find((item) => item.id === id);
  if (!requirement) {
    fail(`Develop controller has no requirement ${id}.`);
  }
  requirement.status = 'complete';
  requirement.evidence = requiredOption(options, 'evidence');
  state.pendingAction = requiredOption(options, 'pending-action');
  writeState(path, state);
  process.stdout.write(`${path}\n`);
}

function advance(options) {
  const { path, state } = loadState();
  const phase = requiredOption(options, 'phase');
  if (!phaseTransitions.has(phase)) {
    fail(`Unknown develop controller phase: ${phase}.`);
  }
  if (new Set(['polish', 'publication', 'readiness']).has(phase)) {
    requireCompleteRequirements(state, phase);
  }
  if (phase !== state.phase && !phaseTransitions.get(state.phase)?.has(phase)) {
    fail(
      `Develop controller cannot advance from ${state.phase} to ${phase}.`,
    );
  }
  state.phase = phase;
  state.pendingAction = requiredOption(options, 'pending-action');
  writeState(path, state);
  process.stdout.write(`${path}\n`);
}

function checkEpochStartedAt(options) {
  const value = requiredOption(options, 'check-epoch-started-at');
  const milliseconds = Date.parse(value);
  if (!Number.isFinite(milliseconds)) {
    fail('--check-epoch-started-at requires an ISO-8601 timestamp.');
  }
  return new Date(milliseconds).toISOString();
}

function publish(options) {
  const { path, state } = loadState();
  requireCompleteRequirements(state, 'publication');
  const headSha = requiredOption(options, 'head').toLowerCase();
  if (!/^[0-9a-f]{40}$/.test(headSha)) {
    fail('--head requires one full 40-character commit SHA.');
  }
  const pullRequest = optionalOption(options, 'pull-request');
  const pendingAction = requiredOption(options, 'pending-action');
  const epochStartedAt = checkEpochStartedAt(options);
  if (
    state.headSha === headSha &&
    ((state.phase === 'publication' && !state.pullRequest && !pullRequest) ||
      (state.phase === 'readiness' && state.pullRequest === pullRequest))
  ) {
    state.pendingAction = pendingAction;
    writeState(path, state);
    process.stdout.write(`${path}\n`);
    return;
  }
  if (state.phase !== 'publication') {
    fail(`Develop controller cannot publish from ${state.phase}.`);
  }
  if (state.headSha === headSha) {
    fail('A publication cycle requires a new head; use start-check-epoch for the same head.');
  }
  if (
    state.checkEpochStartedAt &&
    Date.parse(epochStartedAt) <= Date.parse(state.checkEpochStartedAt)
  ) {
    fail('A new published head requires a later check-epoch timestamp.');
  }
  state.checkEpoch += 1;
  state.checkEpochStartedAt = epochStartedAt;
  state.phase = pullRequest ? 'readiness' : 'publication';
  state.pullRequest = pullRequest;
  state.headSha = headSha;
  state.pendingAction = pendingAction;
  writeState(path, state);
  process.stdout.write(`${path}\n`);
}

function attachPullRequest(options) {
  const { path, state } = loadState();
  const pullRequest = requiredOption(options, 'pull-request');
  const pendingAction = requiredOption(options, 'pending-action');
  if (
    state.phase === 'readiness' &&
    state.pullRequest === pullRequest &&
    state.headSha
  ) {
    state.pendingAction = pendingAction;
    writeState(path, state);
    process.stdout.write(`${path}\n`);
    return;
  }
  if (state.phase !== 'publication' || !state.headSha || state.pullRequest) {
    fail('Develop controller can attach a pull request only to a published head without one.');
  }
  state.phase = 'readiness';
  state.pullRequest = pullRequest;
  state.pendingAction = pendingAction;
  writeState(path, state);
  process.stdout.write(`${path}\n`);
}

function recordCheckContexts(options) {
  const { path, state } = loadState();
  if (state.phase !== 'readiness' || !state.pullRequest || !state.headSha) {
    fail('Develop controller can record required checks only during published readiness.');
  }
  const contexts = (options.get('context') ?? []).map((entry) => {
    const separator = entry.indexOf('=');
    if (separator < 1 || separator === entry.length - 1) {
      fail('--context must use WORKFLOW=NAME with both values present.');
    }
    const context = {
      name: entry.slice(separator + 1).trim(),
      workflow: entry.slice(0, separator).trim(),
    };
    if (!context.name || !context.workflow) {
      fail('--context must use WORKFLOW=NAME with both values present.');
    }
    return context;
  });
  const identities = contexts.map(({ name, workflow }) => `${workflow}\0${name}`);
  if (new Set(identities).size !== identities.length) {
    fail('Develop controller required check contexts must be unique.');
  }
  state.requiredCheckContexts = contexts;
  state.requiredCheckContextsEvidence = requiredOption(options, 'evidence');
  state.requiredCheckContextsKnown = true;
  state.pendingAction = requiredOption(options, 'pending-action');
  writeState(path, state);
  process.stdout.write(`${path}\n`);
}

function startCheckEpoch(options) {
  const { path, state } = loadState();
  if (state.phase !== 'readiness' || !state.pullRequest || !state.headSha) {
    fail('Develop controller cannot start a check epoch before publication.');
  }
  if (!state.requiredCheckContextsKnown) {
    fail('Develop controller must record required check contexts before starting a new epoch.');
  }
  const epochStartedAt = checkEpochStartedAt(options);
  const pendingAction = requiredOption(options, 'pending-action');
  if (epochStartedAt === state.checkEpochStartedAt) {
    state.pendingAction = pendingAction;
    writeState(path, state);
    process.stdout.write(`${path}\n`);
    return;
  }
  if (Date.parse(epochStartedAt) < Date.parse(state.checkEpochStartedAt)) {
    fail('A new check epoch requires a later check-epoch timestamp.');
  }
  state.phase = 'readiness';
  state.checkEpoch += 1;
  state.checkEpochStartedAt = epochStartedAt;
  state.pendingAction = pendingAction;
  writeState(path, state);
  process.stdout.write(`${path}\n`);
}

function ready() {
  const { path, state } = loadState();
  requireCompleteRequirements(state, 'ready-to-merge');
  if (state.phase !== 'readiness' || !state.pullRequest || !state.headSha) {
    fail('Develop controller cannot become ready before published readiness.');
  }
  if (!state.requiredCheckContextsKnown) {
    fail('Develop controller cannot become ready before required check contexts are known.');
  }
  state.status = 'ready-to-merge';
  state.pendingAction = null;
  writeState(path, state);
  process.stdout.write(`${path}\n`);
}

function block(options) {
  const { path, state } = loadState();
  state.status = 'blocked';
  state.blockerEvidence = requiredOption(options, 'evidence');
  state.pendingAction = requiredOption(options, 'pending-action');
  writeState(path, state);
  process.stdout.write(`${path}\n`);
}

function show() {
  const { state } = loadState({ requireNonterminal: false });
  process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
}

try {
  const [command, ...args] = process.argv.slice(2);
  const options = parseOptions(args);
  if (command === 'init') {
    init(options);
  } else if (command === 'complete-requirement') {
    completeRequirement(options);
  } else if (command === 'advance') {
    advance(options);
  } else if (command === 'publish') {
    publish(options);
  } else if (command === 'attach-pull-request') {
    attachPullRequest(options);
  } else if (command === 'record-check-contexts') {
    recordCheckContexts(options);
  } else if (command === 'start-check-epoch') {
    startCheckEpoch(options);
  } else if (command === 'ready') {
    ready();
  } else if (command === 'block') {
    block(options);
  } else if (command === 'show') {
    show();
  } else {
    fail(`Unknown controller command: ${command ?? 'none'}.`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
