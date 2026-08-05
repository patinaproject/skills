import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
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
  git(root, 'commit', '-m', 'chore: base');
  git(root, 'switch', '-c', '323-incremental-polish');
  writeFileSync(join(root, 'README.md'), 'base\nchange\n');
  git(root, 'add', 'README.md');
  git(root, 'commit', '-m', 'feat: change');

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

function commitChange(root, content, message = 'fix: change') {
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
    commitChange(rewritten.root, 'base\nrewritten\n', 'feat: rewritten');
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
      'sourceBranch',
      'targetBranch',
    ]);
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

  console.info('OK: incremental polish review-state contract passed');
} finally {
  findingsFileIndex = 0;
  for (const fixture of fixtures.reverse()) {
    rmSync(fixture, { force: true, recursive: true });
  }
}
