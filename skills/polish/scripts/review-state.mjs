#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';

const schemaVersion = 1;
const axes = new Set(['architecture', 'spec', 'standards']);
const outcomes = new Set(['changes_requested', 'passed']);

function git(args, cwd = process.cwd()) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function tryGit(args, cwd = process.cwd()) {
  return spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function resolveTarget(targetBranch) {
  const candidates = [
    `refs/remotes/origin/${targetBranch}`,
    `refs/heads/${targetBranch}`,
  ];

  for (const candidate of candidates) {
    const result = tryGit(['show-ref', '--verify', '--hash', candidate]);
    if (result.status === 0) {
      return result.stdout.trim();
    }
  }

  throw new Error(`Target branch does not resolve: ${targetBranch}`);
}

function currentIdentity(targetBranch) {
  const root = git(['rev-parse', '--show-toplevel']);
  const commonDirectory = git(['rev-parse', '--git-common-dir']);
  const absoluteCommonDirectory = realpathSync(
    isAbsolute(commonDirectory)
      ? commonDirectory
      : resolve(root, commonDirectory)
  );
  const sourceBranch = git(['branch', '--show-current']);

  if (sourceBranch.length === 0) {
    throw new Error('Polish review state requires a named source branch.');
  }

  return {
    repository: createHash('sha256')
      .update(absoluteCommonDirectory)
      .digest('hex'),
    sourceBranch,
    targetBranch,
  };
}

function reviewDirectory() {
  const temporaryRoot = process.env.PATINAPROJECT_POLISH_TMP_DIR
    ? resolve(process.env.PATINAPROJECT_POLISH_TMP_DIR)
    : tmpdir();
  return join(temporaryRoot, 'patinaproject', 'polish-reviews');
}

function recordPath(identity) {
  const key = createHash('sha256')
    .update(JSON.stringify(identity))
    .digest('hex');
  return join(reviewDirectory(), `${key}.json`);
}

function hasExactKeys(value, keys) {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function isFinding(value) {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return (
    hasExactKeys(value, ['axis', 'id', 'location', 'summary']) &&
    axes.has(value.axis) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.location === 'string' &&
    value.location.length > 0 &&
    typeof value.summary === 'string' &&
    value.summary.length > 0
  );
}

function isAuthoritativeReview(value) {
  if (value === null) {
    return true;
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  const findingsAreValid =
    Array.isArray(value.findings) && value.findings.every(isFinding);
  return (
    hasExactKeys(value, ['findings', 'outcome', 'reviewedHead']) &&
    typeof value.reviewedHead === 'string' &&
    outcomes.has(value.outcome) &&
    findingsAreValid &&
    ((value.outcome === 'passed' && value.findings.length === 0) ||
      (value.outcome === 'changes_requested' && value.findings.length > 0))
  );
}

function isProvisionalReview(value) {
  if (value === null) {
    return true;
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  return (
    hasExactKeys(value, ['candidateHead', 'findings']) &&
    typeof value.candidateHead === 'string' &&
    value.candidateHead.length > 0 &&
    Array.isArray(value.findings) &&
    value.findings.every(isFinding)
  );
}

function isReviewRecord(value, identity) {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return (
    hasExactKeys(value, [
      'authoritative',
      'provisional',
      'repository',
      'schemaVersion',
      'sourceBranch',
      'targetBranch',
    ]) &&
    value.schemaVersion === schemaVersion &&
    value.repository === identity.repository &&
    value.sourceBranch === identity.sourceBranch &&
    value.targetBranch === identity.targetBranch &&
    isAuthoritativeReview(value.authoritative) &&
    isProvisionalReview(value.provisional)
  );
}

function loadRecord(identity) {
  const path = recordPath(identity);
  const directory = reviewDirectory();

  try {
    if (existsSync(directory)) {
      const directoryState = lstatSync(directory);
      if (!directoryState.isDirectory() || directoryState.isSymbolicLink()) {
        return { status: 'unavailable' };
      }
    }
    if (!existsSync(path)) {
      return { status: 'missing' };
    }
    const fileState = lstatSync(path);
    if (!fileState.isFile() || fileState.isSymbolicLink()) {
      return { status: 'unavailable' };
    }
    const value = JSON.parse(readFileSync(path, 'utf8'));
    if (!isReviewRecord(value, identity)) {
      return { status: 'corrupt' };
    }
    return { record: value, status: 'valid' };
  } catch (error) {
    return { status: error instanceof SyntaxError ? 'corrupt' : 'unavailable' };
  }
}

function writeRecord(identity, record) {
  const path = recordPath(identity);
  const directory = dirname(path);
  mkdirSync(directory, { mode: 0o700, recursive: true });
  if (process.platform !== 'win32') {
    chmodSync(directory, 0o700);
  }

  const temporaryPath = join(directory, `.${randomUUID()}.tmp`);
  let descriptor;

  try {
    descriptor = openSync(temporaryPath, 'wx', 0o600);
    writeFileSync(descriptor, `${JSON.stringify(record, null, 2)}\n`);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporaryPath, path);
    if (process.platform !== 'win32') {
      chmodSync(path, 0o600);
    }
  } finally {
    if (descriptor !== undefined) {
      closeSync(descriptor);
    }
    rmSync(temporaryPath, { force: true });
  }
}

function parseArguments(args) {
  const [command, ...rest] = args;
  const options = new Map();
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index];
    const value = rest[index + 1];
    if (!key?.startsWith('--') || value === undefined) {
      throw new Error(`Invalid argument list: ${rest.join(' ')}`);
    }
    const name = key.slice(2);
    if (options.has(name)) {
      throw new Error(`Duplicate option: --${name}`);
    }
    options.set(name, value);
  }
  return { command, options };
}

function requiredOption(options, name) {
  const value = options.get(name);
  if (!value) {
    throw new Error(`Missing required option: --${name}`);
  }
  return value;
}

function readFindings(path) {
  if (!path) {
    return [];
  }
  const absolutePath = resolve(path);
  let value;
  try {
    value = JSON.parse(readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(
      `Findings file is unreadable: ${absolutePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  if (!Array.isArray(value) || !value.every(isFinding)) {
    throw new Error(
      `Findings file must contain a valid finding array: ${absolutePath}`
    );
  }
  return value;
}

function headIsReviewedAncestor(reviewedHead, head) {
  const resolves = tryGit(['rev-parse', '--verify', `${reviewedHead}^{commit}`]);
  if (resolves.status !== 0) {
    return false;
  }
  return tryGit(['merge-base', '--is-ancestor', reviewedHead, head]).status === 0;
}

function assertCommittedWorktree() {
  if (git(['status', '--porcelain']).length > 0) {
    throw new Error('Polish review requires a clean, fully committed worktree.');
  }
}

function selectScope(targetBranch) {
  assertCommittedWorktree();
  const identity = currentIdentity(targetBranch);
  const target = resolveTarget(targetBranch);
  const head = git(['rev-parse', 'HEAD']);
  const mergeBase = git(['merge-base', target, head]);
  const loaded = loadRecord(identity);
  const fallback = {
    authoritativeFindings: [],
    base: mergeBase,
    head,
    mode: 'full',
    provisionalFindings: [],
    range: `${mergeBase}..${head}`,
    state: loaded.status,
  };

  if (loaded.status !== 'valid') {
    return fallback;
  }

  const { authoritative, provisional } = loaded.record;
  const provisionalFindings = provisional?.findings ?? [];
  if (
    authoritative === null ||
    !headIsReviewedAncestor(authoritative.reviewedHead, head)
  ) {
    return {
      ...fallback,
      provisionalFindings,
      state: 'valid',
    };
  }

  if (authoritative.reviewedHead !== head) {
    return {
      authoritativeFindings: authoritative.findings,
      base: authoritative.reviewedHead,
      head,
      mode: 'incremental',
      provisionalFindings,
      range: `${authoritative.reviewedHead}..${head}`,
      state: 'valid',
    };
  }

  const hasFindings =
    authoritative.findings.length > 0 || provisionalFindings.length > 0;
  if (authoritative.outcome === 'passed' && !hasFindings) {
    return {
      authoritativeFindings: [],
      base: head,
      head,
      mode: 'skip',
      provisionalFindings: [],
      range: null,
      state: 'valid',
    };
  }

  return {
    authoritativeFindings: authoritative.findings,
    base: head,
    head,
    mode: 'recheck',
    provisionalFindings,
    range: null,
    state: 'valid',
  };
}

function completeReview(targetBranch, candidateHead, outcome, findings) {
  assertCommittedWorktree();
  resolveTarget(targetBranch);
  const head = git(['rev-parse', 'HEAD']);
  if (candidateHead !== head) {
    throw new Error(
      `Review endpoint changed: candidate ${candidateHead} does not equal HEAD ${head}.`
    );
  }
  if (outcome === 'passed' && findings.length > 0) {
    throw new Error('A passing review cannot retain outstanding findings.');
  }
  if (outcome === 'changes_requested' && findings.length === 0) {
    throw new Error('A changes-requested review must retain its findings.');
  }

  const identity = currentIdentity(targetBranch);
  const record = {
    ...identity,
    authoritative: {
      findings,
      outcome,
      reviewedHead: head,
    },
    provisional: null,
    schemaVersion,
  };
  writeRecord(identity, record);
  return record;
}

function saveProvisional(targetBranch, candidateHead, findings) {
  resolveTarget(targetBranch);
  const identity = currentIdentity(targetBranch);
  const loaded = loadRecord(identity);
  const record = {
    ...identity,
    authoritative:
      loaded.status === 'valid' ? loaded.record.authoritative : null,
    provisional: { candidateHead, findings },
    schemaVersion,
  };
  writeRecord(identity, record);
  return record;
}

function main() {
  const { command, options } = parseArguments(process.argv.slice(2));
  const commands = new Set(['complete', 'provisional', 'scope']);
  if (!command || !commands.has(command)) {
    throw new Error(`Unknown command: ${command ?? '(missing)'}`);
  }

  const target = requiredOption(options, 'target');
  let result;

  if (command === 'scope') {
    result = selectScope(target);
  } else if (command === 'complete') {
    const candidate = requiredOption(options, 'candidate');
    const outcome = requiredOption(options, 'outcome');
    if (!outcomes.has(outcome)) {
      throw new Error(`Invalid review outcome: ${outcome}`);
    }
    result = completeReview(
      target,
      candidate,
      outcome,
      readFindings(options.get('findings'))
    );
  } else {
    result = saveProvisional(
      target,
      requiredOption(options, 'candidate'),
      readFindings(options.get('findings'))
    );
  }

  console.info(JSON.stringify(result));
}

main();
