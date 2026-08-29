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

const schemaVersion = 4;
const axes = new Set(['architecture', 'spec', 'standards']);
const outcomes = new Set(['changes_requested', 'passed']);
// `skip` hands out no reviewable delta, so it mints no scope to complete.
const reviewableModes = new Set(['full', 'incremental', 'recheck']);

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

// Isolated test runs name the private root plainly. Named once here so the
// carry's read path can look for it beside the user-scoped name.
const isolatedRootName = 'patinaproject';

function privateRootName() {
  return process.env.PATINAPROJECT_POLISH_TMP_DIR
    ? isolatedRootName
    : userScopedRootName();
}

function reviewRoot() {
  return join(temporaryRoot(), privateRootName());
}

function reviewDirectory() {
  return join(reviewRoot(), 'polish-reviews');
}

function assertPrivateDirectory(path, { repairPermissions = true } = {}) {
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
    if (repairPermissions && process.platform !== 'win32') {
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

function isDigest(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
}

function isBasisReference(value) {
  return (
    isExactObject(value, ['content', 'source']) &&
    typeof value.source === 'string' &&
    value.source.length > 0 &&
    typeof value.content === 'string'
  );
}

function isReviewRuleReference(value) {
  return (
    isExactObject(value, ['axis', 'content', 'source']) &&
    axes.has(value.axis) &&
    typeof value.source === 'string' &&
    value.source.length > 0 &&
    typeof value.content === 'string'
  );
}

function isBasisManifest(value) {
  return (
    isExactObject(value, [
      'designSources',
      'manifestVersion',
      'reviewRules',
      'spec',
      'standards',
    ]) &&
    Number.isSafeInteger(value.manifestVersion) &&
    value.manifestVersion >= 1 &&
    Array.isArray(value.standards) &&
    value.standards.every(isBasisReference) &&
    Array.isArray(value.reviewRules) &&
    value.reviewRules.every(isReviewRuleReference) &&
    Array.isArray(value.designSources) &&
    value.designSources.every(isBasisReference) &&
    (value.spec === null || isBasisReference(value.spec))
  );
}

function assertUnicodeScalarString(value) {
  for (let index = 0; index < value.length; index += 1) {
    const unit = value.charCodeAt(index);
    if (unit >= 0xd800 && unit <= 0xdbff) {
      const next = value.charCodeAt(index + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) {
        throw new Error('Basis manifest contains an invalid Unicode string.');
      }
      index += 1;
    } else if (unit >= 0xdc00 && unit <= 0xdfff) {
      throw new Error('Basis manifest contains an invalid Unicode string.');
    }
  }
}

// RFC 8785 uses ECMAScript primitive serialization and recursively sorts
// object properties by UTF-16 code units. JSON input already excludes values
// outside the JSON data model; the remaining I-JSON constraints are checked
// here before hashing.
function canonicalizeJson(value) {
  if (value === null || typeof value === 'boolean') {
    return JSON.stringify(value);
  }
  if (typeof value === 'string') {
    assertUnicodeScalarString(value);
    return JSON.stringify(value);
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Basis manifest contains a non-finite number.');
    }
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalizeJson).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => {
        assertUnicodeScalarString(key);
        return `${JSON.stringify(key)}:${canonicalizeJson(value[key])}`;
      })
      .join(',')}}`;
  }
  throw new Error('Basis manifest contains a value outside the JSON data model.');
}

function readBasisManifest() {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(0, 'utf8'));
  } catch (error) {
    throw new Error(
      `Basis manifest on standard input is unreadable: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
  if (!isBasisManifest(manifest)) {
    throw new Error('Basis manifest on standard input has an invalid shape.');
  }
  const canonical = canonicalizeJson(manifest);
  return {
    digest: createHash('sha256').update(canonical).digest('hex'),
    manifestVersion: manifest.manifestVersion,
  };
}

function sameBasis(left, right) {
  return (
    left.basisDigest === right.digest &&
    left.manifestVersion === right.manifestVersion
  );
}

function isAuthoritativeReview(value) {
  if (value === null) {
    return true;
  }
  if (
    !isExactObject(value, [
      'findings',
      'outcome',
      'basisDigest',
      'reviewedHead',
      'scopedHead',
      'manifestVersion',
    ])
  ) {
    return false;
  }
  return (
    typeof value.reviewedHead === 'string' &&
    // Trusted as written, not verified: nothing here can tell a `scopedHead`
    // that `complete` produced from one a hand-edited or carried record simply
    // states. The `earned` gate reads it as self-consistency, not proof.
    typeof value.scopedHead === 'string' &&
    isDigest(value.basisDigest) &&
    Number.isSafeInteger(value.manifestVersion) &&
    value.manifestVersion >= 1 &&
    outcomes.has(value.outcome) &&
    isFindingArray(value.findings) &&
    ((value.outcome === 'passed' && value.findings.length === 0) ||
      (value.outcome === 'changes_requested' && value.findings.length > 0))
  );
}

// The commit `scope` last handed out and has not yet consumed: the *open*
// endpoint. `complete` requires its candidate to match this, so `reviewedHead`
// records a head a reviewer was actually given rather than one the caller
// asserts about itself.
//
// Distinct from `authoritative.scopedHead`, which is the endpoint a completed
// outcome consumed. This one is live and re-minted by every reviewable `scope`;
// that one is durable evidence written only by `complete`. Reading the live one
// where the durable one belongs is what would let a record re-earn its own pass.
function isOpenScope(value) {
  return (
    value === null ||
    (isExactObject(value, ['basisDigest', 'head', 'manifestVersion']) &&
      typeof value.head === 'string' &&
      value.head.length > 0 &&
      isDigest(value.basisDigest) &&
      Number.isSafeInteger(value.manifestVersion) &&
      value.manifestVersion >= 1)
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
      'openScope',
      'sourceBranch',
      'targetBranch',
    ]) &&
    value.schemaVersion === schemaVersion &&
    value.repository === identity.repository &&
    value.sourceBranch === identity.sourceBranch &&
    value.targetBranch === identity.targetBranch &&
    isAuthoritativeReview(value.authoritative) &&
    isProvisionalReview(value.provisional) &&
    isOpenScope(value.openScope)
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

function selectScope(targetBranch, basis, hasReviewContext) {
  assertCommittedWorktree();
  const identity = currentIdentity(targetBranch);
  const target = resolveTarget(targetBranch);
  const head = git(['rev-parse', 'HEAD']);
  const mergeBase = git(['merge-base', target, head]);

  return withRecordLock(identity, () => {
    const loaded = loadRecord(identity);
    const authoritative =
      loaded.status === 'valid' ? loaded.record.authoritative : null;
    const reusable =
      authoritative !== null &&
      headIsReviewedAncestor(authoritative.reviewedHead, head);
    const basisChanged = reusable && !sameBasis(authoritative, basis);
    const selection =
      basisChanged || hasReviewContext
        ? {
            authoritativeFindings: [],
            base: mergeBase,
            head,
            mode: 'full',
            provisionalFindings: [],
            range: `${mergeBase}..${head}`,
            reason: basisChanged
              ? 'review_basis_changed'
              : 'review_context_present',
            state: loaded.status,
          }
        : computeScope(loaded, head, mergeBase);
    const selected = {
      ...selection,
      basisDigest: basis.digest,
      manifestVersion: basis.manifestVersion,
      skipDisabled: hasReviewContext,
    };

    // Recording the endpoint is what makes a later outcome earnable: `complete`
    // accepts only a candidate this call handed out.
    //
    // A `skip` selection hands out no delta and leaves the record untouched.
    // The durable endpoint in `authoritative.scopedHead` is the evidence that
    // earned the pass; the live open scope is irrelevant to that decision.
    if (reviewableModes.has(selection.mode)) {
      writeRecord(
        identity,
        buildRecord(identity, loaded, {
          openScope: {
            basisDigest: basis.digest,
            head,
            manifestVersion: basis.manifestVersion,
          },
        })
      );
    }

    return selected;
  });
}

// One shape for every write path, so a field added to the record cannot be
// dropped by whichever path forgets it.
function buildRecord(identity, loaded, overrides) {
  const previous = loaded.status === 'valid' ? loaded.record : null;

  return {
    ...identity,
    authoritative: previous?.authoritative ?? null,
    provisional: previous?.provisional ?? null,
    schemaVersion,
    openScope: previous?.openScope ?? null,
    ...overrides,
  };
}

function computeScope(loaded, head, mergeBase) {
  const fallback = {
    authoritativeFindings: [],
    base: mergeBase,
    head,
    mode: 'full',
    provisionalFindings: [],
    range: `${mergeBase}..${head}`,
    reason: `review_state_${loaded.status}`,
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
    fallback.reason =
      authoritative === null
        ? 'no_completed_review'
        : 'reviewed_head_unrelated';
  } else if (authoritative.reviewedHead !== head) {
    authoritativeFindings = authoritative.findings;
    base = authoritative.reviewedHead;
    mode = 'incremental';
    range = `${authoritative.reviewedHead}..${head}`;
    fallback.reason = 'later_commits';
  } else {
    const hasFindings =
      authoritative.findings.length > 0 || provisionalFindings.length > 0;
    // A pass only suppresses the next run when the record carries the endpoint
    // that earned it. Without that evidence the run that would notice a bad
    // record is exactly the run a `skip` would cancel, so degrade to `recheck`
    // rather than to a visible no-op.
    //
    // The evidence is `authoritative.scopedHead`, which only `complete` writes,
    // and never the live `openScope`. `scope` mints that on every
    // reviewable selection including the `recheck` this branch produces, so
    // reading it here would let the degraded record re-earn its own pass on the
    // next call with no review in between.
    const earned = authoritative.scopedHead === authoritative.reviewedHead;
    authoritativeFindings = authoritative.findings;
    base = head;
    mode =
      authoritative.outcome === 'passed' && !hasFindings && earned
        ? 'skip'
        : 'recheck';
    range = null;
    fallback.reason = mode === 'skip' ? 'earned_pass' : 'findings_at_head';
  }

  return {
    authoritativeFindings,
    base,
    head,
    mode,
    provisionalFindings: mode === 'skip' ? [] : provisionalFindings,
    range,
    reason: fallback.reason,
    state: 'valid',
  };
}

function completeReview(targetBranch, candidateHead, outcome, findings, basis) {
  assertCommittedWorktree();
  resolveTarget(targetBranch);
  const head = git(['rev-parse', 'HEAD']);
  // Catches a head that moved during review.
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
    // Catches the easier and likelier failure the endpoint guard cannot: a head
    // that moved *before* the record was written. Fixing a finding, committing,
    // and recording the outcome at the new head skips the iteration that would
    // have reviewed the fix, and `reviewedHead` would name a head no reviewer
    // was ever given. Only an endpoint `scope` handed out can be completed.
    const loaded = loadRecord(identity);
    const openScope =
      loaded.status === 'valid' ? loaded.record.openScope : null;

    if (openScope === null) {
      throw new Error(
        `No review scope is open for ${head}. Run \`scope\` and review the delta it returns before recording an outcome.`
      );
    }
    if (openScope.head !== head) {
      throw new Error(
        `Review scope is stale: \`scope\` handed out ${openScope.head}, but HEAD is now ${head}. Re-run \`scope\` and review the ${openScope.head}..${head} delta before recording an outcome.`
      );
    }
    if (!sameBasis(openScope, basis)) {
      throw new Error(
        'Basis manifest does not match the open review scope. Re-run `scope` with this manifest before recording an outcome.'
      );
    }

    const record = buildRecord(identity, loaded, {
      // `scopedHead` records which open endpoint this outcome consumed. It is
      // the durable evidence the outcome was earned, written here and nowhere
      // else.
      authoritative: {
        basisDigest: openScope.basisDigest,
        findings,
        manifestVersion: openScope.manifestVersion,
        outcome,
        reviewedHead: head,
        scopedHead: openScope.head,
      },
      // One `complete` consumes one `scope`. Carrying the endpoint forward
      // would leave it open at this head, so a second `complete` could rewrite
      // the outcome — a pass into `changes_requested`, say — with no review
      // between. Nothing legitimate needs it: the next iteration re-scopes.
      openScope: null,
      provisional: null,
    });
    writeRecord(identity, record);
    return record;
  });
}

function saveProvisional(targetBranch, candidateHead, findings) {
  resolveTarget(targetBranch);
  const identity = currentIdentity(targetBranch);
  return withRecordLock(identity, () => {
    const loaded = loadRecord(identity);
    const record = buildRecord(identity, loaded, {
      provisional: { candidateHead, findings },
    });
    writeRecord(identity, record);
    return record;
  });
}

function reviewStatus(targetBranch) {
  resolveTarget(targetBranch);
  const identity = currentIdentity(targetBranch);
  const loaded = loadRecord(identity);

  if (loaded.status !== 'valid') {
    return {
      authoritativeFindings: [],
      provisionalFindings: [],
      reviewedHead: null,
      state: loaded.status,
    };
  }

  return {
    authoritativeFindings: loaded.record.authoritative?.findings ?? [],
    provisionalFindings: loaded.record.provisional?.findings ?? [],
    reviewedHead: loaded.record.authoritative?.reviewedHead ?? null,
    state: 'valid',
  };
}

function resolveSourceDirectory(from) {
  const root = resolve(from);
  const candidates = [
    ...(basename(root) === 'polish-reviews' ? [root] : []),
    join(root, 'polish-reviews'),
    // The other session's root name is not ours to assume, so try both.
    join(root, userScopedRootName(), 'polish-reviews'),
    join(root, isolatedRootName, 'polish-reviews'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      assertPrivateDirectory(candidate, { repairPermissions: false });
      return candidate;
    }
  }

  throw new Error(`No polish review state directory beneath: ${root}`);
}

// The source root belongs to another session, which may still be writing it, so
// a record that vanishes mid-scan is skipped rather than failing the carry.
function readSourceRecord(path) {
  try {
    const state = lstatSync(path);
    if (!state.isFile() || state.isSymbolicLink()) {
      return null;
    }
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
// further along the same history. This session keeps its record when the heads
// are equal, when their histories diverged, and when the carried head does not
// resolve here; an unresolvable local head has no coverage left to keep.
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
      writeRecord(identity, {
        ...value,
        // A carry that brings no provisional data keeps this session's own
        // findings: they are advisory locations to revalidate, not coverage.
        provisional:
          value.provisional ??
          (loaded.status === 'valid' ? loaded.record.provisional : null),
      });
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
  const commands = new Set([
    'complete',
    'provisional',
    'relocate',
    'scope',
    'status',
  ]);
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

  if (command === 'status') {
    result = reviewStatus(target);
  } else if (command === 'scope') {
    const reviewContext = options.get('review-context');
    if (reviewContext !== undefined && reviewContext !== 'present') {
      throw new Error(`Invalid review context marker: ${reviewContext}`);
    }
    result = selectScope(
      target,
      readBasisManifest(),
      reviewContext === 'present'
    );
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
      readFindings(options.get('findings')),
      readBasisManifest()
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
