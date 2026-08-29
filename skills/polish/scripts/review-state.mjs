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

const schemaVersion = 3;
const axes = new Set(['architecture', 'spec', 'standards']);
const outcomes = new Set(['changes_requested', 'passed']);
const reviewInputDecisions = new Set(['changed', 'uncertain', 'unchanged']);
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

function reviewInputEvidence(content) {
  return {
    content,
    digest: createHash('sha256').update(content).digest('hex'),
  };
}

function isReviewInputEvidence(value) {
  return (
    isExactObject(value, ['content', 'digest']) &&
    typeof value.content === 'string' &&
    typeof value.digest === 'string' &&
    value.digest === reviewInputEvidence(value.content).digest
  );
}

function isReviewInputs(value) {
  return (
    isExactObject(value, ['spec', 'standards']) &&
    isReviewInputEvidence(value.spec) &&
    isReviewInputEvidence(value.standards)
  );
}

function sameReviewInputs(left, right) {
  return (
    left.spec.digest === right.spec.digest &&
    left.spec.content === right.spec.content &&
    left.standards.digest === right.standards.digest &&
    left.standards.content === right.standards.content
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
      'reviewInputs',
      'reviewedHead',
      'scopedHead',
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
    isReviewInputs(value.reviewInputs) &&
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
function isOpenScopedHead(value) {
  return value === null || (typeof value === 'string' && value.length > 0);
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
      'openScopedHead',
      'openReviewInputs',
      'sourceBranch',
      'targetBranch',
    ]) &&
    value.schemaVersion === schemaVersion &&
    value.repository === identity.repository &&
    value.sourceBranch === identity.sourceBranch &&
    value.targetBranch === identity.targetBranch &&
    isAuthoritativeReview(value.authoritative) &&
    isProvisionalReview(value.provisional) &&
    isOpenScopedHead(value.openScopedHead) &&
    (value.openReviewInputs === null || isReviewInputs(value.openReviewInputs)) &&
    ((value.openScopedHead === null && value.openReviewInputs === null) ||
      (value.openScopedHead !== null && value.openReviewInputs !== null))
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

function readReviewInput(path, name) {
  const absolutePath = resolve(path);
  try {
    return reviewInputEvidence(readFileSync(absolutePath, 'utf8'));
  } catch (error) {
    throw new Error(
      `${name} review input is unreadable: ${absolutePath}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

function readReviewInputs(options) {
  return {
    spec: readReviewInput(requiredOption(options, 'spec'), 'Spec'),
    standards: readReviewInput(
      requiredOption(options, 'standards'),
      'Standards'
    ),
  };
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

function selectScope(targetBranch, reviewInputs, decision) {
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

    if (
      reusable &&
      !sameReviewInputs(authoritative.reviewInputs, reviewInputs) &&
      decision === undefined
    ) {
      writeRecord(
        identity,
        buildRecord(identity, loaded, {
          openReviewInputs: null,
          openScopedHead: null,
        })
      );
      return {
        base: mergeBase,
        currentInputs: reviewInputs,
        head,
        mode: null,
        range: null,
        reason: 'review_input_decision_required',
        reviewInputDecision: 'required',
        savedInputs: authoritative.reviewInputs,
        state: 'valid',
      };
    }

    const invalidates =
      reusable &&
      !sameReviewInputs(authoritative.reviewInputs, reviewInputs) &&
      (decision === 'changed' || decision === 'uncertain');
    let scopeLoaded = loaded;

    if (invalidates) {
      scopeLoaded = {
        record: buildRecord(identity, loaded, {
          authoritative: null,
          openReviewInputs: null,
          openScopedHead: null,
          provisional: null,
        }),
        status: 'valid',
      };
    } else if (
      reusable &&
      !sameReviewInputs(authoritative.reviewInputs, reviewInputs) &&
      decision === 'unchanged'
    ) {
      scopeLoaded = {
        record: buildRecord(identity, loaded, {
          authoritative: { ...authoritative, reviewInputs },
        }),
        status: 'valid',
      };
    }

    const selection = computeScope(scopeLoaded, head, mergeBase);
    const selected = {
      ...selection,
      reason:
        decision === 'changed'
          ? 'review_inputs_changed'
          : decision === 'uncertain'
            ? 'review_inputs_uncertain'
            : selection.reason,
      reviewInputDecision:
        reusable &&
        !sameReviewInputs(authoritative.reviewInputs, reviewInputs)
          ? decision
          : 'not_required',
    };
    const writeLoaded =
      selection.mode === 'full'
        ? {
            record: buildRecord(identity, scopeLoaded, {
              authoritative: null,
              openReviewInputs: null,
              openScopedHead: null,
              provisional: null,
            }),
            status: 'valid',
          }
        : scopeLoaded;

    // Recording the endpoint is what makes a later outcome earnable: `complete`
    // accepts only a candidate this call handed out.
    //
    // A `skip` selection hands out no delta and leaves the record untouched.
    // Its open endpoint is the evidence that earned the pass, so clearing it
    // would make the next `scope` on an untouched passing head degrade to
    // `recheck` — turning the sticky record the design wants into a re-review
    // every other run.
    if (reviewableModes.has(selection.mode)) {
      writeRecord(
        identity,
        buildRecord(identity, writeLoaded, {
          openReviewInputs: reviewInputs,
          openScopedHead: head,
        })
      );
    } else if (writeLoaded !== loaded) {
      writeRecord(identity, writeLoaded.record);
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
    openReviewInputs: previous?.openReviewInputs ?? null,
    openScopedHead: previous?.openScopedHead ?? null,
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
    // and never the live `openScopedHead`. `scope` mints that on every
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

function completeReview(targetBranch, candidateHead, outcome, findings) {
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
    const openScopedHead =
      loaded.status === 'valid' ? loaded.record.openScopedHead : null;
    const openReviewInputs =
      loaded.status === 'valid' ? loaded.record.openReviewInputs : null;

    if (openScopedHead === null) {
      throw new Error(
        `No review scope is open for ${head}. Run \`scope\` and review the delta it returns before recording an outcome.`
      );
    }
    if (openReviewInputs === null) {
      throw new Error(
        `No review inputs are open for ${head}. Run \`scope\` with the captured Standards and Spec before recording an outcome.`
      );
    }
    if (openScopedHead !== head) {
      throw new Error(
        `Review scope is stale: \`scope\` handed out ${openScopedHead}, but HEAD is now ${head}. Re-run \`scope\` and review the ${openScopedHead}..${head} delta before recording an outcome.`
      );
    }

    const record = buildRecord(identity, loaded, {
      // `scopedHead` records which open endpoint this outcome consumed. It is
      // the durable evidence the outcome was earned, written here and nowhere
      // else.
      authoritative: {
        findings,
        outcome,
        reviewInputs: openReviewInputs,
        reviewedHead: head,
        scopedHead: openScopedHead,
      },
      // One `complete` consumes one `scope`. Carrying the endpoint forward
      // would leave it open at this head, so a second `complete` could rewrite
      // the outcome — a pass into `changes_requested`, say — with no review
      // between. Nothing legitimate needs it: the next iteration re-scopes.
      openReviewInputs: null,
      openScopedHead: null,
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
    const decision = options.get('decision');
    if (decision !== undefined && !reviewInputDecisions.has(decision)) {
      throw new Error(`Invalid review input decision: ${decision}`);
    }
    result = selectScope(target, readReviewInputs(options), decision);
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
