#!/usr/bin/env node

import { createHash, randomUUID } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  closeSync,
  constants,
  existsSync,
  fchmodSync,
  fstatSync,
  fsyncSync,
  linkSync,
  lstatSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir, userInfo } from 'node:os';
import { basename, isAbsolute, join, resolve } from 'node:path';

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

function repositoryIdentity() {
  const root = git(['rev-parse', '--show-toplevel']);
  const commonDirectory = git(['rev-parse', '--git-common-dir']);
  const absoluteCommonDirectory = realpathSync(
    isAbsolute(commonDirectory)
      ? commonDirectory
      : resolve(root, commonDirectory)
  );

  // Linked worktrees share one common directory, so this identity follows a
  // branch between the worktrees of one repository.
  return createHash('sha256').update(absoluteCommonDirectory).digest('hex');
}

function currentBranch() {
  const sourceBranch = git(['branch', '--show-current']);

  if (sourceBranch.length === 0) {
    throw new Error('Polish review state requires a named source branch.');
  }

  return sourceBranch;
}

function currentIdentity(targetBranch) {
  return {
    repository: repositoryIdentity(),
    sourceBranch: currentBranch(),
    targetBranch,
  };
}

function temporaryRoot() {
  return process.env.PATINAPROJECT_POLISH_TMP_DIR
    ? resolve(process.env.PATINAPROJECT_POLISH_TMP_DIR)
    : realpathSync(tmpdir());
}

function userScopedRootName() {
  return `patinaproject-${
    typeof process.getuid === 'function'
      ? process.getuid()
      : createHash('sha256').update(userInfo().username).digest('hex')
  }`;
}

function reviewRoot() {
  return join(
    temporaryRoot(),
    process.env.PATINAPROJECT_POLISH_TMP_DIR
      ? 'patinaproject'
      : userScopedRootName()
  );
}

function reviewDirectory() {
  return join(reviewRoot(), 'polish-reviews');
}

function assertPrivateDirectory(path, { repairMode = true } = {}) {
  let descriptor;
  try {
    descriptor = openSync(
      path,
      constants.O_RDONLY |
        (constants.O_DIRECTORY ?? 0) |
        (constants.O_NOFOLLOW ?? 0)
    );
    const state = fstatSync(descriptor);
    if (!state.isDirectory()) {
      throw new Error(`Review state path is not a private directory: ${path}`);
    }
    if (
      typeof process.getuid === 'function' &&
      state.uid !== process.getuid()
    ) {
      throw new Error(`Review state directory has a foreign owner: ${path}`);
    }
    if (repairMode && process.platform !== 'win32') {
      fchmodSync(descriptor, 0o700);
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith('Review state ')
    ) {
      throw error;
    }
    throw new Error(`Review state path is not a private directory: ${path}`);
  } finally {
    if (descriptor !== undefined) {
      closeSync(descriptor);
    }
  }
}

function ensurePrivateDirectory(path) {
  try {
    mkdirSync(path, { mode: 0o700 });
  } catch (error) {
    if (!(error && typeof error === 'object' && error.code === 'EEXIST')) {
      throw error;
    }
  }
  assertPrivateDirectory(path);
}

function prepareReviewDirectory() {
  if (process.env.PATINAPROJECT_POLISH_TMP_DIR) {
    assertPrivateDirectory(temporaryRoot());
  }
  ensurePrivateDirectory(reviewRoot());
  ensurePrivateDirectory(reviewDirectory());
  return reviewDirectory();
}

function recordPath(identity) {
  const canonicalIdentity = {
    repository: identity.repository,
    sourceBranch: identity.sourceBranch,
    targetBranch: identity.targetBranch,
  };
  const key = createHash('sha256')
    .update(JSON.stringify(canonicalIdentity))
    .digest('hex');
  return join(reviewDirectory(), `${key}.json`);
}

function isExactObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function isFinding(value) {
  return (
    isExactObject(value, ['axis', 'id', 'location', 'summary']) &&
    axes.has(value.axis) &&
    typeof value.id === 'string' &&
    value.id.length > 0 &&
    typeof value.location === 'string' &&
    value.location.length > 0 &&
    typeof value.summary === 'string' &&
    value.summary.length > 0
  );
}

function isFindingArray(value) {
  return Array.isArray(value) && value.every(isFinding);
}

function isAuthoritativeReview(value) {
  if (value === null) {
    return true;
  }
  if (!isExactObject(value, ['findings', 'outcome', 'reviewedHead'])) {
    return false;
  }
  return (
    typeof value.reviewedHead === 'string' &&
    outcomes.has(value.outcome) &&
    isFindingArray(value.findings) &&
    ((value.outcome === 'passed' && value.findings.length === 0) ||
      (value.outcome === 'changes_requested' && value.findings.length > 0))
  );
}

function isProvisionalReview(value) {
  if (value === null) {
    return true;
  }
  return (
    isExactObject(value, ['candidateHead', 'findings']) &&
    typeof value.candidateHead === 'string' &&
    value.candidateHead.length > 0 &&
    isFindingArray(value.findings)
  );
}

function isReviewRecord(value, identity) {
  return (
    isExactObject(value, [
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
    if (existsSync(reviewRoot())) {
      assertPrivateDirectory(reviewRoot());
    }
    if (existsSync(directory)) {
      assertPrivateDirectory(directory);
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
  const directory = prepareReviewDirectory();

  const temporaryPath = join(directory, `.${randomUUID()}.tmp`);
  let descriptor;

  try {
    descriptor = openSync(temporaryPath, 'wx', 0o600);
    if (process.platform !== 'win32') {
      fchmodSync(descriptor, 0o600);
    }
    writeFileSync(descriptor, `${JSON.stringify(record, null, 2)}\n`);
    fsyncSync(descriptor);
    closeSync(descriptor);
    descriptor = undefined;
    renameSync(temporaryPath, path);
  } finally {
    if (descriptor !== undefined) {
      closeSync(descriptor);
    }
    rmSync(temporaryPath, { force: true });
  }
}

function wait(milliseconds) {
  // Atomics.wait provides a synchronous sleep without spawning a child process.
  Atomics.wait(
    new Int32Array(new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT)),
    0,
    0,
    milliseconds
  );
}

function lockIsStale(path) {
  let contents;

  try {
    const state = lstatSync(path);
    if (!state.isFile() || state.isSymbolicLink()) {
      throw new Error(`Review state lock is not a regular file: ${path}`);
    }
    if (
      typeof process.getuid === 'function' &&
      state.uid !== process.getuid()
    ) {
      throw new Error(`Review state lock has a foreign owner: ${path}`);
    }
    contents = readFileSync(path, 'utf8');
  } catch (error) {
    // The holder released the lock mid-check, so the caller retries the link.
    if (error && typeof error === 'object' && error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }

  const owner = Number.parseInt(contents, 10);
  if (!Number.isInteger(owner) || owner <= 0) {
    throw new Error(`Review state lock is corrupt: ${path}`);
  }
  try {
    process.kill(owner, 0);
    return false;
  } catch (error) {
    if (error && typeof error === 'object' && error.code === 'ESRCH') {
      return true;
    }
    return false;
  }
}

function acquireRecordLock(identity) {
  const directory = prepareReviewDirectory();
  const path = `${recordPath(identity)}.lock`;
  const temporaryPath = join(directory, `.${randomUUID()}.lock.tmp`);
  let descriptor;

  try {
    descriptor = openSync(temporaryPath, 'wx', 0o600);
    if (process.platform !== 'win32') {
      fchmodSync(descriptor, 0o600);
    }
    writeFileSync(descriptor, `${process.pid}\n`);
    fsyncSync(descriptor);

    for (let attempt = 0; attempt < 400; attempt += 1) {
      try {
        linkSync(temporaryPath, path);
        rmSync(temporaryPath);
        return { descriptor, path };
      } catch (error) {
        if (!(error && typeof error === 'object' && error.code === 'EEXIST')) {
          throw error;
        }
        if (lockIsStale(path)) {
          throw new Error(
            `Review state lock is stale; discard the disposable state root before retrying: ${path}`
          );
        }
        wait(25);
      }
    }

    throw new Error(`Timed out waiting for review state lock: ${path}`);
  } catch (error) {
    if (descriptor !== undefined) {
      closeSync(descriptor);
    }
    rmSync(temporaryPath, { force: true });
    throw error;
  }
}

function releaseRecordLock(lock) {
  const descriptorState = fstatSync(lock.descriptor);
  closeSync(lock.descriptor);
  try {
    const pathState = lstatSync(lock.path);
    if (
      pathState.isFile() &&
      !pathState.isSymbolicLink() &&
      pathState.dev === descriptorState.dev &&
      pathState.ino === descriptorState.ino
    ) {
      rmSync(lock.path);
    }
  } catch (error) {
    if (!(error && typeof error === 'object' && error.code === 'ENOENT')) {
      throw error;
    }
  }
}

function withRecordLock(identity, transition) {
  const lock = acquireRecordLock(identity);
  try {
    return transition();
  } finally {
    releaseRecordLock(lock);
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
  if (!isFindingArray(value)) {
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
  let authoritativeFindings;
  let base;
  let mode;
  let range;

  if (
    authoritative === null ||
    !headIsReviewedAncestor(authoritative.reviewedHead, head)
  ) {
    authoritativeFindings = [];
    base = mergeBase;
    mode = 'full';
    range = `${mergeBase}..${head}`;
  } else if (authoritative.reviewedHead !== head) {
    authoritativeFindings = authoritative.findings;
    base = authoritative.reviewedHead;
    mode = 'incremental';
    range = `${authoritative.reviewedHead}..${head}`;
  } else {
    const hasFindings =
      authoritative.findings.length > 0 || provisionalFindings.length > 0;
    authoritativeFindings = authoritative.findings;
    base = head;
    mode =
      authoritative.outcome === 'passed' && !hasFindings ? 'skip' : 'recheck';
    range = null;
  }

  return {
    authoritativeFindings,
    base,
    head,
    mode,
    provisionalFindings: mode === 'skip' ? [] : provisionalFindings,
    range,
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
  return withRecordLock(identity, () => {
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
  });
}

function saveProvisional(targetBranch, candidateHead, findings) {
  resolveTarget(targetBranch);
  const identity = currentIdentity(targetBranch);
  return withRecordLock(identity, () => {
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
  });
}

function resolveSourceDirectory(from) {
  const root = resolve(from);
  const candidates = [
    ...(basename(root) === 'polish-reviews' ? [root] : []),
    join(root, 'polish-reviews'),
    join(root, userScopedRootName(), 'polish-reviews'),
    join(root, 'patinaproject', 'polish-reviews'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      assertPrivateDirectory(candidate, { repairMode: false });
      return candidate;
    }
  }

  throw new Error(`No polish review state directory beneath: ${root}`);
}

function readSourceRecord(path) {
  const state = lstatSync(path);
  if (!state.isFile() || state.isSymbolicLink()) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function commitResolves(head) {
  return (
    typeof head === 'string' &&
    tryGit(['rev-parse', '--verify', `${head}^{commit}`]).status === 0
  );
}

// The carried record replaces this session's only when it reviewed strictly
// further along the same history; equal or unknown heads keep what is here.
function carriedAdvancesCoverage(local, carried) {
  const carriedHead = carried.authoritative?.reviewedHead;
  if (!commitResolves(carriedHead)) {
    return false;
  }
  const localHead = local.authoritative?.reviewedHead;
  if (!commitResolves(localHead)) {
    return true;
  }
  return (
    localHead !== carriedHead &&
    tryGit(['merge-base', '--is-ancestor', localHead, carriedHead]).status === 0
  );
}

function relocateRecords(from, branch) {
  const sourceDirectory = resolveSourceDirectory(from);
  const destinationDirectory = reviewDirectory();
  if (
    existsSync(destinationDirectory) &&
    realpathSync(destinationDirectory) === realpathSync(sourceDirectory)
  ) {
    throw new Error(
      `Source review state is already this session's review state: ${sourceDirectory}`
    );
  }

  const repository = repositoryIdentity();
  const kept = [];
  const relocated = [];

  for (const name of readdirSync(sourceDirectory).sort()) {
    if (!/^[a-f0-9]{64}\.json$/.test(name)) {
      continue;
    }
    const value = readSourceRecord(join(sourceDirectory, name));
    if (
      !value ||
      typeof value !== 'object' ||
      typeof value.targetBranch !== 'string'
    ) {
      continue;
    }
    const identity = {
      repository,
      sourceBranch: branch,
      targetBranch: value.targetBranch,
    };
    // Identity equality keeps another repository's findings out of this one.
    if (!isReviewRecord(value, identity)) {
      continue;
    }

    withRecordLock(identity, () => {
      const loaded = loadRecord(identity);
      if (
        loaded.status === 'valid' &&
        !carriedAdvancesCoverage(loaded.record, value)
      ) {
        kept.push(value.targetBranch);
        return;
      }
      writeRecord(identity, value);
      relocated.push(value.targetBranch);
    });
  }

  return {
    branch,
    kept: kept.sort(),
    relocated: relocated.sort(),
    source: sourceDirectory,
  };
}

function main() {
  const { command, options } = parseArguments(process.argv.slice(2));
  const commands = new Set(['complete', 'provisional', 'relocate', 'scope']);
  if (!command || !commands.has(command)) {
    throw new Error(`Unknown command: ${command ?? '(missing)'}`);
  }

  let result;

  if (command === 'relocate') {
    console.info(
      JSON.stringify(
        relocateRecords(
          requiredOption(options, 'from'),
          options.get('branch') || currentBranch()
        )
      )
    );
    return;
  }

  const target = requiredOption(options, 'target');

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

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
