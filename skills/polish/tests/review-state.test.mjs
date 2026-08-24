import assert from 'node:assert/strict';
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const commandPath = fileURLToPath(
  new URL('../scripts/review-state.mjs', import.meta.url)
);
const fixtures = [];
let findingsFileIndex = 0;

const standardsFinding = {
  axis: 'standards',
  id: 'ST1',
  location: 'README.md:2',
  summary: 'The changed line violates the documented example contract.',
};

function git(cwd, ...args) {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim();
}

function createRepository() {
  const root = mkdtempSync(join(tmpdir(), 'patinaproject-polish-repository-'));
  const temporaryRoot = mkdtempSync(
    join(tmpdir(), 'patinaproject-polish-state-')
  );
  fixtures.push(root, temporaryRoot);

  git(root, 'init', '--initial-branch=main');
  git(root, 'config', 'user.email', 'tests@patinaproject.com');
  git(root, 'config', 'user.name', 'patinaproject Tests');
  writeFileSync(join(root, 'README.md'), 'base\n');
  git(root, 'add', 'README.md');
  git(root, 'commit', '-m', 'chore: #323 base');
  git(root, 'switch', '-c', '323-incremental-polish');
  writeFileSync(join(root, 'README.md'), 'base\nchange\n');
  git(root, 'add', 'README.md');
  git(root, 'commit', '-m', 'feat: #323 change');

  return { root, temporaryRoot };
}

function reviewCommand(cwd, temporaryRoot, ...args) {
  return execFileSync(process.execPath, [commandPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATINAPROJECT_POLISH_TMP_DIR: temporaryRoot,
    },
  }).trim();
}

function reviewCommandResult(cwd, temporaryRoot, ...args) {
  return spawnSync(process.execPath, [commandPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATINAPROJECT_POLISH_TMP_DIR: temporaryRoot,
    },
  });
}

// `complete` accepts only an endpoint `scope` handed out, which is the whole
// point of the guard, so every completing test opens a scope the way the
// workflow does.
function openScope(cwd, temporaryRoot, target = 'main') {
  return JSON.parse(reviewCommand(cwd, temporaryRoot, 'scope', '--target', target));
}

function reviewCommandProcess(cwd, temporaryRoot, ...args) {
  return spawn(process.execPath, [commandPath, ...args], {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATINAPROJECT_POLISH_TMP_DIR: temporaryRoot,
    },
  });
}

function processResult(child) {
  return new Promise((resolve, reject) => {
    let stderr = '';
    let stdout = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.on('error', reject);
    child.on('close', (status) => resolve({ status, stderr, stdout }));
  });
}

async function waitForLock(temporaryRoot) {
  const directory = join(temporaryRoot, 'patinaproject', 'polish-reviews');
  for (let attempt = 0; attempt < 1_000; attempt += 1) {
    let lockName;
    try {
      lockName = readdirSync(directory).find((name) =>
        name.endsWith('.lock')
      );
    } catch (error) {
      if (!(error && typeof error === 'object' && error.code === 'ENOENT')) {
        throw error;
      }
    }
    if (lockName) {
      let contents;
      try {
        contents = readFileSync(join(directory, lockName), 'utf8');
      } catch (error) {
        if (!(error && typeof error === 'object' && error.code === 'ENOENT')) {
          throw error;
        }
        continue;
      }
      assert.match(contents, /^\d+\n$/);
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  assert.fail('Timed out waiting for the review-state lock.');
}

function commitChange(root, content, message = 'fix: #323 change') {
  writeFileSync(join(root, 'README.md'), content);
  git(root, 'add', 'README.md');
  git(root, 'commit', '-m', message);
  return git(root, 'rev-parse', 'HEAD');
}

function findingsFile(findings) {
  const directory = mkdtempSync(
    join(tmpdir(), 'patinaproject-polish-findings-')
  );
  fixtures.push(directory);
  const path = join(directory, `findings-${findingsFileIndex}.json`);
  findingsFileIndex += 1;
  writeFileSync(path, JSON.stringify(findings));
  return path;
}

function recordFiles(temporaryRoot) {
  const directory = join(temporaryRoot, 'patinaproject', 'polish-reviews');
  return {
    directory,
    names: readdirSync(directory).filter((name) =>
      /^[a-f0-9]{64}\.json$/.test(name)
    ),
  };
}

try {
  {
    const { root, temporaryRoot } = createRepository();
    const head = git(root, 'rev-parse', 'HEAD');
    const mergeBase = git(root, 'merge-base', 'main', 'HEAD');

    const result = JSON.parse(
      reviewCommand(root, temporaryRoot, 'scope', '--target', 'main')
    );

    assert.deepEqual(result, {
      authoritativeFindings: [],
      base: mergeBase,
      head,
      mode: 'full',
      provisionalFindings: [],
      range: `${mergeBase}..${head}`,
      state: 'missing',
    });
  }

  {
    const { root, temporaryRoot } = createRepository();
    const reviewedHead = git(root, 'rev-parse', 'HEAD');
    const findingPath = findingsFile([standardsFinding]);

    openScope(root, temporaryRoot);
    const record = JSON.parse(
      reviewCommand(
        root,
        temporaryRoot,
        'complete',
        '--target',
        'main',
        '--candidate',
        reviewedHead,
        '--outcome',
        'changes_requested',
        '--findings',
        findingPath
      )
    );
    assert.deepEqual(record.authoritative, {
      findings: [standardsFinding],
      outcome: 'changes_requested',
      reviewedHead,
    });

    const head = commitChange(root, 'base\nchange\nfix\n');
    const scope = JSON.parse(
      reviewCommand(root, temporaryRoot, 'scope', '--target', 'main')
    );
    assert.deepEqual(scope, {
      authoritativeFindings: [standardsFinding],
      base: reviewedHead,
      head,
      mode: 'incremental',
      provisionalFindings: [],
      range: `${reviewedHead}..${head}`,
      state: 'valid',
    });
  }

  {
    const passing = createRepository();
    const passingHead = git(passing.root, 'rev-parse', 'HEAD');
    openScope(passing.root, passing.temporaryRoot);
    reviewCommand(
      passing.root,
      passing.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      passingHead,
      '--outcome',
      'passed'
    );
    assert.equal(
      JSON.parse(
        reviewCommand(
          passing.root,
          passing.temporaryRoot,
          'scope',
          '--target',
          'main'
        )
      ).mode,
      'skip'
    );

    const blocked = createRepository();
    const blockedHead = git(blocked.root, 'rev-parse', 'HEAD');
    openScope(blocked.root, blocked.temporaryRoot);
    reviewCommand(
      blocked.root,
      blocked.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      blockedHead,
      '--outcome',
      'changes_requested',
      '--findings',
      findingsFile([standardsFinding])
    );
    const scope = JSON.parse(
      reviewCommand(
        blocked.root,
        blocked.temporaryRoot,
        'scope',
        '--target',
        'main'
      )
    );
    assert.equal(scope.mode, 'recheck');
    assert.deepEqual(scope.authoritativeFindings, [standardsFinding]);
  }

  {
    const corrupt = createRepository();
    const corruptHead = git(corrupt.root, 'rev-parse', 'HEAD');
    openScope(corrupt.root, corrupt.temporaryRoot);
    reviewCommand(
      corrupt.root,
      corrupt.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      corruptHead,
      '--outcome',
      'passed'
    );
    const { directory, names } = recordFiles(corrupt.temporaryRoot);
    assert.equal(names.length, 1);
    writeFileSync(join(directory, names[0]), '{bad json');
    assert.equal(
      JSON.parse(
        reviewCommand(
          corrupt.root,
          corrupt.temporaryRoot,
          'scope',
          '--target',
          'main'
        )
      ).state,
      'corrupt'
    );

    const incompatible = createRepository();
    const incompatibleHead = git(incompatible.root, 'rev-parse', 'HEAD');
    openScope(incompatible.root, incompatible.temporaryRoot);
    reviewCommand(
      incompatible.root,
      incompatible.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      incompatibleHead,
      '--outcome',
      'passed'
    );
    const incompatibleFiles = recordFiles(incompatible.temporaryRoot);
    assert.equal(incompatibleFiles.names.length, 1);
    const incompatiblePath = join(
      incompatibleFiles.directory,
      incompatibleFiles.names[0]
    );
    const incompatibleRecord = JSON.parse(
      readFileSync(incompatiblePath, 'utf8')
    );
    incompatibleRecord.authoritative.findings = [standardsFinding];
    writeFileSync(incompatiblePath, JSON.stringify(incompatibleRecord));
    const incompatibleMergeBase = git(
      incompatible.root,
      'merge-base',
      'main',
      'HEAD'
    );
    assert.deepEqual(
      JSON.parse(
        reviewCommand(
          incompatible.root,
          incompatible.temporaryRoot,
          'scope',
          '--target',
          'main'
        )
      ),
      {
        authoritativeFindings: [],
        base: incompatibleMergeBase,
        head: incompatibleHead,
        mode: 'full',
        provisionalFindings: [],
        range: `${incompatibleMergeBase}..${incompatibleHead}`,
        state: 'corrupt',
      }
    );

    const rewritten = createRepository();
    const oldHead = git(rewritten.root, 'rev-parse', 'HEAD');
    openScope(rewritten.root, rewritten.temporaryRoot);
    reviewCommand(
      rewritten.root,
      rewritten.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      oldHead,
      '--outcome',
      'passed'
    );
    git(rewritten.root, 'reset', '--hard', 'main');
    commitChange(rewritten.root, 'base\nrewritten\n', 'feat: #323 rewritten');
    assert.equal(
      JSON.parse(
        reviewCommand(
          rewritten.root,
          rewritten.temporaryRoot,
          'scope',
          '--target',
          'main'
        )
      ).mode,
      'full'
    );
  }

  {
    const isolated = createRepository();
    const head = git(isolated.root, 'rev-parse', 'HEAD');
    openScope(isolated.root, isolated.temporaryRoot);
    reviewCommand(
      isolated.root,
      isolated.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      head,
      '--outcome',
      'passed'
    );
    git(isolated.root, 'branch', 'release', 'main');
    assert.equal(
      JSON.parse(
        reviewCommand(
          isolated.root,
          isolated.temporaryRoot,
          'scope',
          '--target',
          'release'
        )
      ).state,
      'missing'
    );
    git(isolated.root, 'switch', '-c', '324-other-work');
    assert.equal(
      JSON.parse(
        reviewCommand(
          isolated.root,
          isolated.temporaryRoot,
          'scope',
          '--target',
          'main'
        )
      ).state,
      'missing'
    );
  }

  {
    const moving = createRepository();
    const reviewedHead = git(moving.root, 'rev-parse', 'HEAD');
    openScope(moving.root, moving.temporaryRoot);
    reviewCommand(
      moving.root,
      moving.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      reviewedHead,
      '--outcome',
      'passed'
    );
    const candidate = commitChange(moving.root, 'base\nchange\nattempt\n');
    const newHead = commitChange(moving.root, 'base\nchange\nattempt\nmoved\n');

    const incomplete = reviewCommandResult(
      moving.root,
      moving.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      candidate,
      '--outcome',
      'passed'
    );
    assert.equal(incomplete.status, 1);
    assert.equal(
      incomplete.stderr.trim(),
      `Review endpoint changed: candidate ${candidate} does not equal HEAD ${newHead}.`
    );

    reviewCommand(
      moving.root,
      moving.temporaryRoot,
      'provisional',
      '--target',
      'main',
      '--candidate',
      candidate,
      '--findings',
      findingsFile([standardsFinding])
    );
    const scope = JSON.parse(
      reviewCommand(
        moving.root,
        moving.temporaryRoot,
        'scope',
        '--target',
        'main'
      )
    );
    assert.equal(scope.base, reviewedHead);
    assert.equal(scope.head, newHead);
    assert.deepEqual(scope.provisionalFindings, [standardsFinding]);
  }

  {
    const secure = createRepository();
    const head = git(secure.root, 'rev-parse', 'HEAD');
    openScope(secure.root, secure.temporaryRoot);
    reviewCommand(
      secure.root,
      secure.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      head,
      '--outcome',
      'passed'
    );
    const { directory, names } = recordFiles(secure.temporaryRoot);
    assert.equal(names.length, 1);
    if (process.platform !== 'win32') {
      assert.equal(statSync(directory).mode & 0o777, 0o700);
      assert.equal(statSync(join(directory, names[0])).mode & 0o777, 0o600);
    }
    const record = JSON.parse(readFileSync(join(directory, names[0]), 'utf8'));
    assert.deepEqual(Object.keys(record).sort(), [
      'authoritative',
      'provisional',
      'repository',
      'schemaVersion',
      'scoped',
      'sourceBranch',
      'targetBranch',
    ]);

    const traversed = createRepository();
    const outside = mkdtempSync(join(tmpdir(), 'patinaproject-polish-outside-'));
    fixtures.push(outside);
    symlinkSync(outside, join(traversed.temporaryRoot, 'patinaproject'));
    const traversalResult = reviewCommandResult(
      traversed.root,
      traversed.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      git(traversed.root, 'rev-parse', 'HEAD'),
      '--outcome',
      'passed'
    );
    assert.equal(traversalResult.status, 1);
    assert.match(traversalResult.stderr, /not a private directory/);
    assert.deepEqual(readdirSync(outside), []);
  }

  {
    const concurrent = createRepository();
    const head = git(concurrent.root, 'rev-parse', 'HEAD');
    openScope(concurrent.root, concurrent.temporaryRoot);
    const largeFindings = findingsFile(
      Array.from({ length: 50_000 }, (_, index) => ({
        ...standardsFinding,
        id: `ST${index}`,
      }))
    );
    const provisional = reviewCommandProcess(
      concurrent.root,
      concurrent.temporaryRoot,
      'provisional',
      '--target',
      'main',
      '--candidate',
      head,
      '--findings',
      largeFindings
    );
    const provisionalResult = processResult(provisional);
    await waitForLock(concurrent.temporaryRoot);
    const completed = reviewCommandProcess(
      concurrent.root,
      concurrent.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      head,
      '--outcome',
      'passed'
    );
    const [provisionalOutcome, completedOutcome] = await Promise.all([
      provisionalResult,
      processResult(completed),
    ]);
    assert.equal(provisionalOutcome.status, 0, provisionalOutcome.stderr);
    assert.equal(completedOutcome.status, 0, completedOutcome.stderr);
    assert.equal(
      JSON.parse(
        reviewCommand(
          concurrent.root,
          concurrent.temporaryRoot,
          'scope',
          '--target',
          'main'
        )
      ).mode,
      'skip'
    );

    const { directory, names } = recordFiles(concurrent.temporaryRoot);
    const staleLock = join(directory, `${names[0]}.lock`);
    writeFileSync(staleLock, '99999999\n', { mode: 0o600 });
    const staleResult = reviewCommandResult(
      concurrent.root,
      concurrent.temporaryRoot,
      'provisional',
      '--target',
      'main',
      '--candidate',
      head
    );
    assert.equal(staleResult.status, 1);
    assert.match(staleResult.stderr, /Review state lock is stale/);
    assert.equal(readFileSync(staleLock, 'utf8'), '99999999\n');

    const releasing = createRepository();
    const releasingHead = git(releasing.root, 'rev-parse', 'HEAD');
    openScope(releasing.root, releasing.temporaryRoot);
    reviewCommand(
      releasing.root,
      releasing.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      releasingHead,
      '--outcome',
      'passed'
    );
    const releasingFiles = recordFiles(releasing.temporaryRoot);
    const heldLock = join(
      releasingFiles.directory,
      `${releasingFiles.names[0]}.lock`
    );
    writeFileSync(heldLock, `${process.pid}\n`, { mode: 0o600 });
    const waiting = processResult(
      reviewCommandProcess(
        releasing.root,
        releasing.temporaryRoot,
        'provisional',
        '--target',
        'main',
        '--candidate',
        releasingHead
      )
    );
    await new Promise((resolve) => setTimeout(resolve, 120));
    rmSync(heldLock);
    const waitingOutcome = await waiting;
    assert.equal(waitingOutcome.status, 0, waitingOutcome.stderr);
  }

  {
    const invalidTarget = createRepository();
    const result = reviewCommandResult(
      invalidTarget.root,
      invalidTarget.temporaryRoot,
      'scope',
      '--target',
      'HEAD~1'
    );
    assert.equal(result.status, 1);
    assert.equal(
      result.stderr.trim(),
      'Target branch does not resolve: HEAD~1'
    );

    const publicationGate = reviewCommandResult(
      invalidTarget.root,
      invalidTarget.temporaryRoot,
      'gate',
      '--target',
      'main'
    );
    assert.equal(publicationGate.status, 1);
    assert.equal(publicationGate.stderr.trim(), 'Unknown command: gate');

    const sensitiveFindings = findingsFile([
      { ...standardsFinding, sourceExcerpt: 'private source text' },
    ]);
    const sensitiveResult = reviewCommandResult(
      invalidTarget.root,
      invalidTarget.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      git(invalidTarget.root, 'rev-parse', 'HEAD'),
      '--outcome',
      'changes_requested',
      '--findings',
      sensitiveFindings
    );
    assert.equal(sensitiveResult.status, 1);
    assert.match(sensitiveResult.stderr, /valid finding array/);
  }

  {
    const carried = createRepository();
    const reviewedHead = git(carried.root, 'rev-parse', 'HEAD');
    openScope(carried.root, carried.temporaryRoot);
    reviewCommand(
      carried.root,
      carried.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      reviewedHead,
      '--outcome',
      'changes_requested',
      '--findings',
      findingsFile([standardsFinding])
    );

    const session = mkdtempSync(join(tmpdir(), 'patinaproject-polish-session-'));
    fixtures.push(session);
    assert.equal(
      JSON.parse(
        reviewCommand(carried.root, session, 'scope', '--target', 'main')
      ).state,
      'missing'
    );

    const relocated = JSON.parse(
      reviewCommand(
        carried.root,
        session,
        'relocate',
        '--from',
        carried.temporaryRoot
      )
    );
    assert.deepEqual(relocated.relocated, ['main']);
    assert.deepEqual(relocated.kept, []);
    assert.equal(relocated.branch, '323-incremental-polish');

    const head = commitChange(carried.root, 'base\nchange\nfix\n');
    const scope = JSON.parse(
      reviewCommand(carried.root, session, 'scope', '--target', 'main')
    );
    assert.deepEqual(scope, {
      authoritativeFindings: [standardsFinding],
      base: reviewedHead,
      head,
      mode: 'incremental',
      provisionalFindings: [],
      range: `${reviewedHead}..${head}`,
      state: 'valid',
    });
    // The source root keeps its copy: relocation copies rather than empties.
    assert.equal(recordFiles(carried.temporaryRoot).names.length, 1);

    const keeping = JSON.parse(
      reviewCommand(
        carried.root,
        session,
        'relocate',
        '--from',
        carried.temporaryRoot
      )
    );
    assert.deepEqual(keeping.kept, ['main']);
    assert.deepEqual(keeping.relocated, []);

    assert.deepEqual(
      JSON.parse(
        reviewCommand(
          carried.root,
          session,
          'relocate',
          '--from',
          carried.temporaryRoot,
          '--branch',
          'another-branch'
        )
      ).relocated,
      []
    );

    const foreign = createRepository();
    const foreignHead = git(foreign.root, 'rev-parse', 'HEAD');
    openScope(foreign.root, foreign.temporaryRoot);
    reviewCommand(
      foreign.root,
      foreign.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      foreignHead,
      '--outcome',
      'passed'
    );
    const isolated = mkdtempSync(
      join(tmpdir(), 'patinaproject-polish-isolated-')
    );
    fixtures.push(isolated);
    assert.deepEqual(
      JSON.parse(
        reviewCommand(
          carried.root,
          isolated,
          'relocate',
          '--from',
          foreign.temporaryRoot
        )
      ).relocated,
      []
    );

    const sameRoot = reviewCommandResult(
      carried.root,
      session,
      'relocate',
      '--from',
      session
    );
    assert.equal(sameRoot.status, 1);
    assert.match(sameRoot.stderr, /already this session's review state/);

    const absent = reviewCommandResult(
      carried.root,
      session,
      'relocate',
      '--from',
      join(session, 'absent')
    );
    assert.equal(absent.status, 1);
    assert.match(absent.stderr, /No polish review state directory beneath/);
  }

  {
    const advancing = createRepository();
    const olderHead = git(advancing.root, 'rev-parse', 'HEAD');
    openScope(advancing.root, advancing.temporaryRoot);
    reviewCommand(
      advancing.root,
      advancing.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      olderHead,
      '--outcome',
      'passed'
    );

    const newerHead = commitChange(advancing.root, 'base\nchange\nmore\n');
    const local = mkdtempSync(join(tmpdir(), 'patinaproject-polish-local-'));
    fixtures.push(local);
    openScope(advancing.root, local);
    reviewCommand(
      advancing.root,
      local,
      'complete',
      '--target',
      'main',
      '--candidate',
      newerHead,
      '--outcome',
      'passed'
    );

    // An older carried record never displaces coverage this session already has.
    assert.deepEqual(
      JSON.parse(
        reviewCommand(
          advancing.root,
          local,
          'relocate',
          '--from',
          advancing.temporaryRoot
        )
      ),
      {
        branch: '323-incremental-polish',
        kept: ['main'],
        relocated: [],
        source: join(advancing.temporaryRoot, 'patinaproject', 'polish-reviews'),
      }
    );

    reviewCommand(
      advancing.root,
      advancing.temporaryRoot,
      'provisional',
      '--target',
      'main',
      '--candidate',
      newerHead,
      '--findings',
      findingsFile([standardsFinding])
    );

    // The reverse carry advances the older session to the newer reviewed head.
    assert.deepEqual(
      JSON.parse(
        reviewCommand(
          advancing.root,
          advancing.temporaryRoot,
          'relocate',
          '--from',
          local
        )
      ).relocated,
      ['main']
    );
    // Diverged history is kept: neither head covers the other.
    const diverged = createRepository();
    const shared = git(diverged.root, 'rev-parse', 'HEAD');
    const localHead = commitChange(diverged.root, 'base\nchange\nlocal\n');
    openScope(diverged.root, diverged.temporaryRoot);
    reviewCommand(
      diverged.root,
      diverged.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      localHead,
      '--outcome',
      'passed'
    );
    const divergedRoot = mkdtempSync(
      join(tmpdir(), 'patinaproject-polish-diverged-')
    );
    fixtures.push(divergedRoot);
    git(diverged.root, 'reset', '--hard', shared);
    const otherHead = commitChange(diverged.root, 'base\nchange\nother\n');
    openScope(diverged.root, divergedRoot);
    reviewCommand(
      diverged.root,
      divergedRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      otherHead,
      '--outcome',
      'passed'
    );
    git(diverged.root, 'reset', '--hard', localHead);
    assert.deepEqual(
      JSON.parse(
        reviewCommand(
          diverged.root,
          diverged.temporaryRoot,
          'relocate',
          '--from',
          divergedRoot
        )
      ).kept,
      ['main']
    );

    const carriedScope = JSON.parse(
      reviewCommand(
        advancing.root,
        advancing.temporaryRoot,
        'scope',
        '--target',
        'main'
      )
    );
    assert.equal(carriedScope.head, newerHead);
    // The carry keeps this session's provisional findings to revalidate.
    assert.deepEqual(carriedScope.provisionalFindings, [standardsFinding]);
    assert.equal(carriedScope.mode, 'recheck');
  }

  {
    // The reported failure: fix a finding, commit, and record `passed` at the
    // new head without restarting the review loop. `reviewedHead` would name a
    // head no reviewer was ever given, and two downstream gates consume it as
    // proof.
    const skipped = createRepository();
    const firstHead = git(skipped.root, 'rev-parse', 'HEAD');
    openScope(skipped.root, skipped.temporaryRoot);
    reviewCommand(
      skipped.root,
      skipped.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      firstHead,
      '--outcome',
      'changes_requested',
      '--findings',
      findingsFile([standardsFinding])
    );

    const fixedHead = commitChange(skipped.root, 'base\nchange\nfix\n');
    const unearned = reviewCommandResult(
      skipped.root,
      skipped.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      fixedHead,
      '--outcome',
      'passed'
    );
    assert.equal(unearned.status, 1);
    assert.match(unearned.stderr, /Review scope is stale/);
    assert.match(unearned.stderr, new RegExp(firstHead));
    assert.match(unearned.stderr, new RegExp(fixedHead));

    // The authoritative record is untouched by the rejected write.
    const afterRejection = JSON.parse(
      reviewCommand(skipped.root, skipped.temporaryRoot, 'scope', '--target', 'main')
    );
    assert.equal(afterRejection.mode, 'incremental');
    assert.deepEqual(afterRejection.authoritativeFindings, [standardsFinding]);

    // Restarting the loop is what earns the pass. `scope` above reopened it.
    reviewCommand(
      skipped.root,
      skipped.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      fixedHead,
      '--outcome',
      'passed'
    );
    assert.equal(
      JSON.parse(
        reviewCommand(skipped.root, skipped.temporaryRoot, 'scope', '--target', 'main')
      ).mode,
      'skip'
    );
  }

  {
    // Completing with no scope open at all is the same unearned record.
    const unscoped = createRepository();
    const head = git(unscoped.root, 'rev-parse', 'HEAD');
    const result = reviewCommandResult(
      unscoped.root,
      unscoped.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      head,
      '--outcome',
      'passed'
    );
    assert.equal(result.status, 1);
    assert.match(result.stderr, /No review scope is open/);
  }

  {
    // A passing record that lost the endpoint which earned it degrades to
    // `recheck`, not to a `skip` that would cancel the run able to notice it.
    const sticky = createRepository();
    const head = git(sticky.root, 'rev-parse', 'HEAD');
    openScope(sticky.root, sticky.temporaryRoot);
    reviewCommand(
      sticky.root,
      sticky.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      head,
      '--outcome',
      'passed'
    );

    const { directory, names } = recordFiles(sticky.temporaryRoot);
    const recordPath = join(directory, names[0]);
    const record = JSON.parse(readFileSync(recordPath, 'utf8'));
    assert.equal(record.scoped.head, record.authoritative.reviewedHead);

    record.scoped = null;
    writeFileSync(recordPath, `${JSON.stringify(record, null, 2)}\n`);

    const degraded = JSON.parse(
      reviewCommand(sticky.root, sticky.temporaryRoot, 'scope', '--target', 'main')
    );
    assert.equal(degraded.mode, 'recheck');
  }

  {
    // A provisional write must not close the open scope: the stage that saved
    // it can still complete once it finishes.
    const interrupted = createRepository();
    const head = git(interrupted.root, 'rev-parse', 'HEAD');
    openScope(interrupted.root, interrupted.temporaryRoot);
    reviewCommand(
      interrupted.root,
      interrupted.temporaryRoot,
      'provisional',
      '--target',
      'main',
      '--candidate',
      head,
      '--findings',
      findingsFile([standardsFinding])
    );
    const completed = reviewCommandResult(
      interrupted.root,
      interrupted.temporaryRoot,
      'complete',
      '--target',
      'main',
      '--candidate',
      head,
      '--outcome',
      'passed'
    );
    assert.equal(completed.status, 0, completed.stderr);
  }

  console.info('OK: incremental polish review-state contract passed');
} finally {
  findingsFileIndex = 0;
  for (const fixture of fixtures.reverse()) {
    rmSync(fixture, { force: true, recursive: true });
  }
}
