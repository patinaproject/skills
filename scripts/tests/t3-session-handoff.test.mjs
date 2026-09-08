import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  closeSync,
  ftruncateSync,
  openSync,
  readSync,
  writeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { test } from 'node:test';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const helper = join(
  repoRoot,
  'plugins/engineering/skills/move-session-here/scripts/session-handoff.mjs'
);
const fixtureRoot = realpathSync(
  mkdtempSync(join(tmpdir(), 't3-session-handoff-test.'))
);
const fixtureHome = join(fixtureRoot, 'home');
const privateTmp = join(fixtureRoot, 'tmp');
const sentinel = join(fixtureRoot, 'native-resume-ran');

function writeJsonLines(path, records) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${records.map((record) => JSON.stringify(record)).join('\n')}\n`);
}

function makeRuntimeDatabase(path, rows, { wal = false, primaryKey = true } = {}) {
  mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  if (wal) {
    database.exec('PRAGMA journal_mode = WAL');
  }
  database.exec(`
    CREATE TABLE provider_session_runtime (
      thread_id TEXT ${primaryKey ? 'PRIMARY KEY' : ''},
      provider_name TEXT NOT NULL,
      adapter_key TEXT NOT NULL,
      resume_cursor_json TEXT
    )
  `);
  if (wal) {
    database.exec('PRAGMA wal_checkpoint(TRUNCATE)');
  }
  const insert = database.prepare(
    'INSERT INTO provider_session_runtime (thread_id, provider_name, adapter_key, resume_cursor_json) VALUES (?, ?, ?, ?)'
  );
  for (const row of rows) {
    insert.run(row.threadId, row.providerName, row.adapterKey, row.cursor);
  }
  return database;
}

function fileDigest(path) {
  const descriptor = openSync(path, 'r');
  const hash = createHash('sha256');
  const buffer = Buffer.alloc(64 * 1024);
  try {
    let count;
    while ((count = readSync(descriptor, buffer)) > 0) {
      hash.update(buffer.subarray(0, count));
    }
    return hash.digest('hex');
  } finally {
    closeSync(descriptor);
  }
}

function expandWithSparseFreePages(path) {
  // SQLite freelist leaves carry no data. Link sparse leaves through real trunk
  // pages, excluding the reserved lock-byte page: https://sqlite.org/fileformat.html
  const pageSize = 4096;
  const pageCount = 524289;
  const firstFreePage = statSync(path).size / pageSize + 1;
  const lockPage = 0x40000000 / pageSize + 1;
  const freePages = [];
  for (let page = firstFreePage; page <= pageCount; page += 1) {
    if (page !== lockPage) freePages.push(page);
  }
  const descriptor = openSync(path, 'r+');
  try {
    ftruncateSync(descriptor, pageCount * pageSize);
    const header = Buffer.alloc(12);
    header.writeUInt32BE(pageCount, 0);
    header.writeUInt32BE(firstFreePage, 4);
    header.writeUInt32BE(freePages.length, 8);
    writeSync(descriptor, header, 0, header.length, 28);
    const leavesPerTrunk = pageSize / 4 - 8;
    for (let index = 0; index < freePages.length; index += leavesPerTrunk + 1) {
      const leaves = freePages.slice(index + 1, index + leavesPerTrunk + 1);
      const trunk = Buffer.alloc(pageSize);
      trunk.writeUInt32BE(freePages[index + leavesPerTrunk + 1] ?? 0, 0);
      trunk.writeUInt32BE(leaves.length, 4);
      leaves.forEach((page, leaf) => trunk.writeUInt32BE(page, 8 + leaf * 4));
      writeSync(descriptor, trunk, 0, trunk.length, (freePages[index] - 1) * pageSize);
    }
  } finally {
    closeSync(descriptor);
  }
}

function manifest(paths) {
  return paths.map((path) => {
    if (!existsSync(path)) {
      return { path, exists: false };
    }
    const stats = statSync(path, { bigint: true });
    return {
      path,
      exists: true,
      sha256: fileDigest(path),
      dev: stats.dev.toString(),
      ino: stats.ino.toString(),
      mode: stats.mode.toString(),
      size: stats.size.toString(),
      mtimeNs: stats.mtimeNs.toString(),
    };
  });
}

function writePreload(name, source) {
  const path = join(fixtureRoot, `${name}.mjs`);
  writeFileSync(path, `import fs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
${source}
syncBuiltinESMExports();
`);
  return path;
}

function runHandoff(reference, environment = {}, preload) {
  const env = {
    ...process.env,
    HOME: fixtureHome,
    PATH: `${join(fixtureRoot, 'bin')}:${process.env.PATH}`,
    TMPDIR: privateTmp,
    ...environment,
  };
  delete env.CLAUDE_CONFIG_DIR;
  delete env.CODEX_HOME;
  const args = [...(preload ? ['--import', preload] : []), helper, reference];
  const result = spawnSync(process.execPath, args, {
    encoding: 'utf8',
    env,
  });
  return result;
}

function parseSuccess(result) {
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stderr, '');
  return JSON.parse(result.stdout);
}

function expectError(result, code, status) {
  assert.equal(result.status, status, result.stderr || result.stdout);
  assert.equal(result.stdout, '');
  const error = JSON.parse(result.stderr);
  assert.equal(error.error, code);
  return error;
}

function writeSentinelCommand(name) {
  const path = join(fixtureRoot, 'bin', name);
  writeFileSync(path, `#!/usr/bin/env bash\nprintf '%s\\n' '${name}' >>'${sentinel}'\nexit 99\n`);
  chmodSync(path, 0o755);
}

mkdirSync(fixtureHome, { recursive: true });
mkdirSync(privateTmp, { recursive: true });
mkdirSync(join(fixtureRoot, 'bin'), { recursive: true });
for (const command of ['claude', 'codex', 't3']) {
  writeSentinelCommand(command);
}

const t3ClaudeId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const claudeId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const t3CodexId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const codexId = '019d1111-2222-7333-8444-555555555555';
const databasePath = join(fixtureRoot, 'state.sqlite');
const claudePath = join(
  fixtureHome,
  '.claude-t3',
  'projects/project',
  `${claudeId}.jsonl`
);
const codexPath = join(
  fixtureHome,
  '.codex-t3',
  'sessions/2026/09/05',
  `rollout-2026-09-05T12-00-00-${codexId}.jsonl`
);

writeJsonLines(claudePath, [
  {
    type: 'user',
    sessionId: claudeId,
    uuid: 'claude-user',
    parentUuid: null,
    isSidechain: false,
    message: { content: 'Inspect the synthetic repository.' },
  },
  {
    type: 'assistant',
    sessionId: claudeId,
    uuid: 'claude-assistant',
    parentUuid: 'claude-user',
    isSidechain: false,
    message: { content: 'The next action is read-only: run git status.' },
  },
]);
writeJsonLines(codexPath, [
  {
    timestamp: '2026-09-05T12:00:00Z',
    type: 'session_meta',
    payload: { id: codexId, cwd: '/synthetic/codex' },
  },
  {
    timestamp: '2026-09-05T12:00:01Z',
    type: 'response_item',
    payload: {
      type: 'message',
      role: 'user',
      content: [{ type: 'input_text', text: 'Check the repository state.' }],
    },
  },
  {
    timestamp: '2026-09-05T12:00:02Z',
    type: 'response_item',
    payload: {
      type: 'agent_message',
      message: 'The next action is read-only: run git status.',
    },
  },
]);

const liveDatabase = makeRuntimeDatabase(
  databasePath,
  [
    {
      threadId: t3ClaudeId,
      providerName: 'claudeAgent',
      adapterKey: 'claudeAgent',
      cursor: JSON.stringify({ threadId: t3ClaudeId, resume: claudeId }),
    },
    {
      threadId: t3CodexId,
      providerName: 'codex',
      adapterKey: 'codex',
      cursor: JSON.stringify({ threadId: codexId }),
    },
  ],
  { wal: true }
);

try {
  const sourcePaths = [
    databasePath,
    `${databasePath}-wal`,
    claudePath,
    codexPath,
  ];
  assert.equal(existsSync(`${databasePath}-wal`), true);
  const before = manifest(sourcePaths);
  const databaseDirectoryBefore = readdirSync(dirname(databasePath)).sort();
  const claudeDirectoryBefore = readdirSync(dirname(claudePath)).sort();
  const codexDirectoryBefore = readdirSync(dirname(codexPath)).sort();

  const claudeResult = parseSuccess(
    runHandoff(`t3://threads/${t3ClaudeId}`, { T3_STATE_DB: databasePath })
  );
  assert.equal(claudeResult.schemaVersion, 1);
  assert.equal(claudeResult.format, 'claude');
  assert.equal(claudeResult.sessionId, claudeId);
  assert.deepEqual(claudeResult.t3, {
    threadId: t3ClaudeId,
    databasePath,
  });
  assert.equal(claudeResult.tracks[0].path, claudePath);

  const codexResult = parseSuccess(
    runHandoff(`t3://threads/${t3CodexId}`, { T3_STATE_DB: databasePath })
  );
  assert.equal(codexResult.schemaVersion, 1);
  assert.equal(codexResult.format, 'codex');
  assert.equal(codexResult.sessionId, codexId);
  assert.deepEqual(codexResult.t3, {
    threadId: t3CodexId,
    databasePath,
  });
  assert.equal(codexResult.tracks[0].path, codexPath);

  assert.deepEqual(manifest(sourcePaths), before);
  assert.deepEqual(
    readdirSync(dirname(databasePath)).sort(),
    databaseDirectoryBefore
  );
  assert.deepEqual(
    readdirSync(dirname(claudePath)).sort(),
    claudeDirectoryBefore
  );
  assert.deepEqual(
    readdirSync(dirname(codexPath)).sort(),
    codexDirectoryBefore
  );
  assert.equal(existsSync(sentinel), false);
  assert.deepEqual(readdirSync(privateTmp), []);

  const mainOnlyPath = join(fixtureRoot, 'main-only.sqlite');
  copyFileSync(databasePath, mainOnlyPath);
  expectError(
    runHandoff(`t3://threads/${t3ClaudeId}`, { T3_STATE_DB: mainOnlyPath }),
    't3_mapping_not_found',
    2
  );

  await test('a symlink store retains committed target WAL mappings', () => {
    const alias = join(fixtureRoot, 'alias.sqlite');
    symlinkSync(databasePath, alias);
    const before = manifest(sourcePaths);
    const result = parseSuccess(
      runHandoff(`t3://threads/${t3CodexId}`, { T3_STATE_DB: alias })
    );
    assert.equal(result.sessionId, codexId);
    assert.equal(result.t3.databasePath, databasePath);
    assert.deepEqual(manifest(sourcePaths), before);
    assert.equal(existsSync(`${alias}-wal`), false);
    assert.equal(existsSync(`${alias}-shm`), false);
  });

  await test('an unreadable database reports a sanitized store error', () => {
    const path = join(fixtureRoot, 'unreadable.sqlite');
    copyFileSync(databasePath, path);
    chmodSync(path, 0o000);
    try {
      expectError(runHandoff(`t3://threads/${t3CodexId}`, {
        T3_STATE_DB: path,
      }), 'invalid_t3_store', 1);
    } finally {
      chmodSync(path, 0o600);
    }
  });

  await test('the removed snapshot hook environment variable executes nothing', () => {
    const hookSentinel = join(fixtureRoot, 'snapshot-hook-ran');
    const hook = join(fixtureRoot, 'legacy-snapshot-hook.mjs');
    writeFileSync(hook, `import { writeFileSync } from 'node:fs';
writeFileSync(${JSON.stringify(hookSentinel)}, 'executed');
`);
    parseSuccess(runHandoff(`t3://threads/${t3CodexId}`, {
      T3_STATE_DB: databasePath,
      MOVE_SESSION_HERE_TEST_SNAPSHOT_HOOK: hook,
    }));
    assert.equal(existsSync(hookSentinel), false);
  });

  for (const [provider, threadId, path, ownerId] of [
    ['claude', t3ClaudeId, claudePath, claudeId],
    ['codex', t3CodexId, codexPath, codexId],
  ]) {
    await test(`${provider} rejects an owner replacement after lookup`, () => {
      const original = readFileSync(path);
      const replacement = original.toString().replaceAll(ownerId, 'replacement-owner');
      const marker = join(fixtureRoot, `${provider}-owner-replaced`);
      const preload = writePreload(`${provider}-replace-owner`, `
const readFileSync = fs.readFileSync;
let replaced = false;
fs.readFileSync = function (path, ...args) {
  const result = readFileSync(path, ...args);
  if (path === ${JSON.stringify(path)} && !replaced) {
    replaced = true;
    fs.renameSync(path, path + '.old');
    fs.writeFileSync(path, ${JSON.stringify(replacement)});
    fs.writeFileSync(${JSON.stringify(marker)}, 'replaced');
  }
  return result;
};`);
      try {
        expectError(runHandoff(`t3://threads/${threadId}`, {
          T3_STATE_DB: databasePath,
        }, preload), 't3_stale_binding', 2);
        assert.equal(readFileSync(marker, 'utf8'), 'replaced');
        assert.equal(readFileSync(path, 'utf8'), replacement);
      } finally {
        rmSync(path);
        renameSync(`${path}.old`, path);
      }
      const reference = provider === 'claude' ? ownerId : `codex://threads/${ownerId}`;
      const direct = parseSuccess(runHandoff(reference));
      assert.equal(direct.sessionId, ownerId);
      assert.equal(direct.t3, undefined);
    });
  }

  const noWalPath = join(fixtureRoot, 'no-wal.sqlite');
  const noWalDatabase = makeRuntimeDatabase(noWalPath, [
    {
      threadId: t3CodexId,
      providerName: 'codex',
      adapterKey: 'codex',
      cursor: JSON.stringify({ threadId: codexId }),
    },
  ]);
  noWalDatabase.close();
  assert.equal(existsSync(`${noWalPath}-wal`), false);
  const noWalResult = parseSuccess(
    runHandoff(`t3://threads/${t3CodexId}`, { T3_STATE_DB: noWalPath })
  );
  assert.equal(noWalResult.sessionId, codexId);

  await test('a valid database larger than 2 GiB resolves its exact binding', () => {
    const largePath = join(fixtureRoot, 'large.sqlite');
    copyFileSync(noWalPath, largePath);
    expandWithSparseFreePages(largePath);
    assert.ok(statSync(largePath).size > 2 ** 31);
    const check = spawnSync('sqlite3', ['-readonly', largePath, 'PRAGMA integrity_check;'], {
      encoding: 'utf8',
    });
    assert.equal(check.status, 0, check.stderr);
    assert.equal(check.stdout.trim(), 'ok');
    const before = manifest([largePath, codexPath]);
    const result = parseSuccess(
      runHandoff(`t3://threads/${t3CodexId}`, { T3_STATE_DB: largePath })
    );
    assert.equal(result.sessionId, codexId);
    assert.equal(result.t3.databasePath, largePath);
    assert.deepEqual(manifest([largePath, codexPath]), before);
    assert.equal(existsSync(sentinel), false);
  });

  await test('committed WAL without SHM works through an unusual symlink path', () => {
    const path = join(fixtureRoot, "WAL '?#\n state.sqlite");
    copyFileSync(databasePath, path);
    copyFileSync(`${databasePath}-wal`, `${path}-wal`);
    const alias = join(fixtureRoot, 'missing-shm-alias.sqlite');
    symlinkSync(path, alias);
    assert.equal(existsSync(`${path}-shm`), false);
    const before = manifest([path, `${path}-wal`, codexPath]);
    const result = parseSuccess(runHandoff(`t3://threads/${t3CodexId}`, {
      T3_STATE_DB: alias,
    }));
    assert.equal(result.sessionId, codexId);
    assert.equal(result.t3.databasePath, path);
    assert.deepEqual(manifest([path, `${path}-wal`, codexPath]), before);
    assert.equal(existsSync(`${alias}-shm`), false);
    assert.equal(existsSync(`${alias}-wal`), false);
  });

  await test('uncommitted WAL changes cannot replace the committed binding', () => {
    liveDatabase.exec('BEGIN');
    liveDatabase.prepare('UPDATE provider_session_runtime SET resume_cursor_json = ? WHERE thread_id = ?')
      .run(JSON.stringify({ threadId: 'uncommitted-owner' }), t3CodexId);
    const before = manifest(sourcePaths);
    try {
      const result = parseSuccess(runHandoff(`t3://threads/${t3CodexId}`, {
        T3_STATE_DB: databasePath,
      }));
      assert.equal(result.sessionId, codexId);
      assert.deepEqual(manifest(sourcePaths), before);
    } finally {
      liveDatabase.exec('ROLLBACK');
    }
  });

  await test('a commit between schema and binding reads stays outside the lookup snapshot', () => {
    const realSqlite = spawnSync('which', ['sqlite3'], { encoding: 'utf8' }).stdout.trim();
    assert.ok(realSqlite);
    const bin = join(fixtureRoot, 'concurrent-bin');
    mkdirSync(bin);
    const marker = join(fixtureRoot, 'concurrent-commit.json');
    const wrapper = join(bin, 'sqlite3');
    writeFileSync(wrapper, `#!${process.execPath}
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
const input = readFileSync(0, 'utf8');
const boundary = input.indexOf('SELECT\\n');
if (boundary < 0) throw new Error('Expected binding query');
const child = spawn(${JSON.stringify(realSqlite)}, process.argv.slice(2));
child.stdin.write(input.slice(0, boundary));
let output = '';
let committed = false;
child.stdout.on('data', (data) => {
  process.stdout.write(data);
  output += data;
  if (!committed && output.includes('\\n')) {
    committed = true;
    const writer = new DatabaseSync(${JSON.stringify(databasePath)});
    writer.prepare('UPDATE provider_session_runtime SET resume_cursor_json = ? WHERE thread_id = ?')
      .run(JSON.stringify({ threadId: 'later-committed-owner' }), ${JSON.stringify(t3CodexId)});
    writer.close();
    writeFileSync(${JSON.stringify(marker)}, JSON.stringify({ committed: true }));
    child.stdin.end(input.slice(boundary));
  }
});
child.stderr.pipe(process.stderr);
child.on('exit', (code) => { process.exitCode = code; });
`);
    chmodSync(wrapper, 0o755);
    try {
      const result = parseSuccess(runHandoff(`t3://threads/${t3CodexId}`, {
        T3_STATE_DB: databasePath,
        PATH: `${bin}:${process.env.PATH}`,
        NODE_OPTIONS: '--disable-warning=ExperimentalWarning',
      }));
      assert.equal(result.sessionId, codexId);
      assert.equal(JSON.parse(readFileSync(marker, 'utf8')).committed, true);
      assert.equal(JSON.parse(liveDatabase.prepare('SELECT resume_cursor_json FROM provider_session_runtime WHERE thread_id = ?')
        .get(t3CodexId).resume_cursor_json).threadId, 'later-committed-owner');
    } finally {
      liveDatabase.prepare('UPDATE provider_session_runtime SET resume_cursor_json = ? WHERE thread_id = ?')
        .run(JSON.stringify({ threadId: codexId }), t3CodexId);
    }
  });

  await test('SQLite startup files cannot run commands or change query output', () => {
    const startup = join(fixtureHome, '.sqliterc');
    writeFileSync(startup, `.shell touch ${sentinel}\n.mode csv\n`);
    const before = manifest(sourcePaths);
    try {
      assert.equal(parseSuccess(runHandoff(`t3://threads/${t3CodexId}`, {
        T3_STATE_DB: databasePath,
      })).sessionId, codexId);
      assert.equal(existsSync(sentinel), false);
      assert.deepEqual(manifest(sourcePaths), before);
    } finally {
      rmSync(startup);
    }
  });

  await test('missing SQLite reports an actionable dependency error without affecting direct inputs', () => {
    const bin = join(fixtureRoot, 'without-sqlite');
    mkdirSync(bin);
    symlinkSync(spawnSync('which', ['find'], { encoding: 'utf8' }).stdout.trim(), join(bin, 'find'));
    const environment = { T3_STATE_DB: databasePath, PATH: bin };
    const error = expectError(runHandoff(`t3://threads/${t3CodexId}`, environment),
      't3_sqlite_unavailable', 1);
    assert.match(error.message, /[Ii]nstall.*SQLite.*PATH/);
    assert.equal(parseSuccess(runHandoff(claudeId, environment)).sessionId, claudeId);
    assert.equal(parseSuccess(runHandoff(`codex://threads/${codexId}`, environment)).sessionId, codexId);
  });

  for (const unavailable of ['not-executable', 'unsupported-json']) {
    await test(`${unavailable} SQLite CLI reports the dependency`, () => {
      const bin = join(fixtureRoot, unavailable);
      mkdirSync(bin);
      const command = join(bin, 'sqlite3');
      writeFileSync(command, `#!${process.execPath}\nprocess.stderr.write('sqlite3: Error: unknown option: -json\\n'); process.exit(1);\n`);
      chmodSync(command, unavailable === 'not-executable' ? 0o600 : 0o700);
      const before = manifest(sourcePaths);
      const error = expectError(runHandoff(`t3://threads/${t3CodexId}`, {
        T3_STATE_DB: databasePath,
        PATH: bin,
      }), 't3_sqlite_unavailable', 1);
      assert.match(error.message, /[Ii]nstall.*SQLite.*PATH/);
      assert.deepEqual(manifest(sourcePaths), before);
    });
  }

  for (const column of ['provider_name', 'adapter_key', 'resume_cursor_json']) {
    await test(`a BLOB ${column} cannot masquerade as mapping text`, () => {
      const path = join(fixtureRoot, `blob-${column}.sqlite`);
      copyFileSync(noWalPath, path);
      const database = new DatabaseSync(path);
      database.exec(`UPDATE provider_session_runtime SET ${column} = CAST(${column} AS BLOB)`);
      database.close();
      const before = manifest([path, codexPath]);
      expectError(runHandoff(`t3://threads/${t3CodexId}`, { T3_STATE_DB: path }),
        column === 'resume_cursor_json' ? 't3_invalid_mapping' : 't3_unsupported_provider', 1);
      assert.deepEqual(manifest([path, codexPath]), before);
    });
  }

  await test('corrupt storage and oversized mapping output are structured errors', () => {
    const corrupt = join(fixtureRoot, 'corrupt.sqlite');
    writeFileSync(corrupt, 'synthetic invalid database');
    expectError(runHandoff(`t3://threads/${t3CodexId}`, { T3_STATE_DB: corrupt }),
      'invalid_t3_store', 1);
    const path = join(fixtureRoot, 'oversized.sqlite');
    copyFileSync(noWalPath, path);
    const database = new DatabaseSync(path);
    database.prepare('UPDATE provider_session_runtime SET resume_cursor_json = ?')
      .run(JSON.stringify({ threadId: codexId, padding: 'x'.repeat(1024 * 1024) }));
    database.close();
    const before = manifest([corrupt, path, codexPath]);
    expectError(runHandoff(`t3://threads/${t3CodexId}`, { T3_STATE_DB: path }),
      'invalid_t3_store', 1);
    assert.deepEqual(manifest([corrupt, path, codexPath]), before);
  });

  const defaultDatabasePath = join(
    fixtureHome,
    '.t3',
    'userdata',
    'state.sqlite'
  );
  mkdirSync(dirname(defaultDatabasePath), { recursive: true });
  copyFileSync(noWalPath, defaultDatabasePath);
  const defaultResult = parseSuccess(
    runHandoff(`t3://threads/${t3CodexId}`)
  );
  assert.equal(defaultResult.t3.databasePath, defaultDatabasePath);

  const missingStore = expectError(
    runHandoff(`t3://threads/${t3ClaudeId}`, {
      T3_STATE_DB: join(fixtureRoot, 'missing.sqlite'),
    }),
    't3_store_not_found',
    2
  );
  assert.equal(missingStore.databasePath, join(fixtureRoot, 'missing.sqlite'));

  const invalidOverride = expectError(
    runHandoff(`t3://threads/${t3ClaudeId}`, {
      T3_STATE_DB: 'relative.sqlite',
    }),
    'invalid_t3_store',
    1
  );
  assert.equal(invalidOverride.variable, 'T3_STATE_DB');

  const schemaPath = join(fixtureRoot, 'unsupported-schema.sqlite');
  const schemaDatabase = new DatabaseSync(schemaPath);
  schemaDatabase.exec('CREATE TABLE provider_session_runtime (thread_id TEXT)');
  schemaDatabase.close();
  expectError(
    runHandoff(`t3://threads/${t3ClaudeId}`, { T3_STATE_DB: schemaPath }),
    't3_unsupported_schema',
    1
  );

  const duplicatePath = join(fixtureRoot, 'duplicate.sqlite');
  const duplicateDatabase = makeRuntimeDatabase(
    duplicatePath,
    [
      {
        threadId: t3ClaudeId,
        providerName: 'claudeAgent',
        adapterKey: 'claudeAgent',
        cursor: JSON.stringify({ threadId: t3ClaudeId, resume: claudeId }),
      },
      {
        threadId: t3ClaudeId,
        providerName: 'claudeAgent',
        adapterKey: 'claudeAgent',
        cursor: JSON.stringify({ threadId: t3ClaudeId, resume: claudeId }),
      },
    ],
    { primaryKey: false }
  );
  duplicateDatabase.close();
  expectError(
    runHandoff(`t3://threads/${t3ClaudeId}`, { T3_STATE_DB: duplicatePath }),
    't3_mapping_ambiguous',
    3
  );

  const invalidRows = [
    {
      name: 'unsupported-provider',
      row: {
        threadId: t3ClaudeId,
        providerName: 'other',
        adapterKey: 'other',
        cursor: '{}',
      },
      code: 't3_unsupported_provider',
    },
    {
      name: 'mismatched-adapter',
      row: {
        threadId: t3ClaudeId,
        providerName: 'claudeAgent',
        adapterKey: 'codex',
        cursor: JSON.stringify({ threadId: t3ClaudeId, resume: claudeId }),
      },
      code: 't3_unsupported_provider',
    },
    {
      name: 'malformed-json',
      row: {
        threadId: t3ClaudeId,
        providerName: 'claudeAgent',
        adapterKey: 'claudeAgent',
        cursor: '{',
      },
      code: 't3_invalid_mapping',
    },
    {
      name: 'array-cursor',
      row: {
        threadId: t3ClaudeId,
        providerName: 'claudeAgent',
        adapterKey: 'claudeAgent',
        cursor: '[]',
      },
      code: 't3_invalid_mapping',
    },
    {
      name: 'wrong-t3-owner',
      row: {
        threadId: t3ClaudeId,
        providerName: 'claudeAgent',
        adapterKey: 'claudeAgent',
        cursor: JSON.stringify({
          threadId: t3CodexId,
          resume: claudeId,
        }),
      },
      code: 't3_invalid_mapping',
    },
    {
      name: 'invalid-codex-owner',
      row: {
        threadId: t3ClaudeId,
        providerName: 'codex',
        adapterKey: 'codex',
        cursor: JSON.stringify({ threadId: 'no' }),
      },
      code: 't3_invalid_mapping',
    },
    {
      name: 'contradictory-claude',
      row: {
        threadId: t3ClaudeId,
        providerName: 'claudeAgent',
        adapterKey: 'claudeAgent',
        cursor: JSON.stringify({
          threadId: t3ClaudeId,
          resume: claudeId,
          sessionId: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
        }),
      },
      code: 't3_invalid_mapping',
    },
  ];
  for (const { name, row, code } of invalidRows) {
    const path = join(fixtureRoot, `${name}.sqlite`);
    const database = makeRuntimeDatabase(path, [row]);
    database.close();
    expectError(
      runHandoff(`t3://threads/${t3ClaudeId}`, { T3_STATE_DB: path }),
      code,
      1
    );
  }

  const legacyId = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  const legacyPath = join(
    fixtureHome,
    '.claude-t3',
    'projects/project',
    `${legacyId}.jsonl`
  );
  writeJsonLines(legacyPath, [
    {
      type: 'user',
      sessionId: legacyId,
      uuid: 'legacy-user',
      parentUuid: null,
      message: { content: 'Legacy synthetic history.' },
    },
  ]);
  const legacyDatabasePath = join(fixtureRoot, 'legacy.sqlite');
  const legacyDatabase = makeRuntimeDatabase(legacyDatabasePath, [
    {
      threadId: t3ClaudeId,
      providerName: 'claudeAgent',
      adapterKey: 'claudeAgent',
      cursor: JSON.stringify({ threadId: t3ClaudeId, sessionId: legacyId }),
    },
  ]);
  legacyDatabase.close();
  const legacyResult = parseSuccess(
    runHandoff(`t3://threads/${t3ClaudeId}`, {
      T3_STATE_DB: legacyDatabasePath,
    })
  );
  assert.equal(legacyResult.sessionId, legacyId);

  const wrongOwnerId = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
  const wrongOwnerPath = join(
    fixtureHome,
    '.claude-wrong-owner',
    'projects/project',
    `${wrongOwnerId}.jsonl`
  );
  writeJsonLines(wrongOwnerPath, [
    {
      type: 'user',
      sessionId: claudeId,
      uuid: 'wrong-owner-user',
      parentUuid: null,
      message: { content: `Mention only: ${wrongOwnerId}` },
    },
  ]);
  const directWrongOwner = parseSuccess(runHandoff(wrongOwnerId));
  assert.equal(directWrongOwner.tracks[0].path, wrongOwnerPath);
  const wrongOwnerDatabasePath = join(fixtureRoot, 'wrong-owner.sqlite');
  const wrongOwnerDatabase = makeRuntimeDatabase(wrongOwnerDatabasePath, [
    {
      threadId: t3ClaudeId,
      providerName: 'claudeAgent',
      adapterKey: 'claudeAgent',
      cursor: JSON.stringify({ threadId: t3ClaudeId, resume: wrongOwnerId }),
    },
  ]);
  wrongOwnerDatabase.close();
  const stale = expectError(
    runHandoff(`t3://threads/${t3ClaudeId}`, {
      T3_STATE_DB: wrongOwnerDatabasePath,
    }),
    't3_stale_binding',
    2
  );
  assert.equal(stale.sessionId, wrongOwnerId);

  const ambiguousId = '99999999-9999-4999-8999-999999999999';
  for (const homeName of ['.claude-ambiguous-a', '.claude-ambiguous-b']) {
    writeJsonLines(
      join(fixtureHome, homeName, 'projects/project', `${ambiguousId}.jsonl`),
      [
        {
          type: 'user',
          sessionId: ambiguousId,
          uuid: `${homeName}-user`,
          parentUuid: null,
          message: { content: 'Duplicate synthetic owner.' },
        },
      ]
    );
  }
  const ambiguousDatabasePath = join(fixtureRoot, 'ambiguous-owner.sqlite');
  const ambiguousDatabase = makeRuntimeDatabase(ambiguousDatabasePath, [
    {
      threadId: t3ClaudeId,
      providerName: 'claudeAgent',
      adapterKey: 'claudeAgent',
      cursor: JSON.stringify({ threadId: t3ClaudeId, resume: ambiguousId }),
    },
  ]);
  ambiguousDatabase.close();
  expectError(
    runHandoff(`t3://threads/${t3ClaudeId}`, {
      T3_STATE_DB: ambiguousDatabasePath,
    }),
    't3_ambiguous_binding',
    3
  );

  const rollbackPath = join(fixtureRoot, 'rollback.sqlite');
  const rollbackDatabase = makeRuntimeDatabase(rollbackPath, [
    {
      threadId: t3CodexId,
      providerName: 'codex',
      adapterKey: 'codex',
      cursor: JSON.stringify({ threadId: codexId }),
    },
  ]);
  rollbackDatabase.close();
  writeFileSync(`${rollbackPath}-journal`, 'synthetic rollback journal');
  expectError(
    runHandoff(`t3://threads/${t3CodexId}`, { T3_STATE_DB: rollbackPath }),
    't3_rollback_journal',
    1
  );

  await test('a symlink store refuses the target rollback journal', () => {
    const alias = join(fixtureRoot, 'rollback-alias.sqlite');
    symlinkSync(rollbackPath, alias);
    const paths = [rollbackPath, `${rollbackPath}-journal`];
    const before = manifest(paths);
    expectError(
      runHandoff(`t3://threads/${t3CodexId}`, { T3_STATE_DB: alias }),
      't3_rollback_journal',
      1
    );
    assert.deepEqual(manifest(paths), before);
  });

  assert.deepEqual(readdirSync(privateTmp), []);
  assert.equal(existsSync(sentinel), false);
  process.stdout.write('OK: existing T3 session handoff checks passed\n');
} finally {
  liveDatabase.close();
  rmSync(fixtureRoot, { recursive: true, force: true });
}
