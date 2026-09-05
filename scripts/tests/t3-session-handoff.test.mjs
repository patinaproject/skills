import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const helper = join(
  repoRoot,
  'plugins/engineering/skills/move-session-here/scripts/session-handoff.mjs'
);
const fixtureRoot = mkdtempSync(join(tmpdir(), 't3-session-handoff-test.'));
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

function manifest(paths) {
  return paths.map((path) => {
    if (!existsSync(path)) {
      return { path, exists: false };
    }
    const stats = statSync(path, { bigint: true });
    return {
      path,
      exists: true,
      sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
      dev: stats.dev.toString(),
      ino: stats.ino.toString(),
      mode: stats.mode.toString(),
      size: stats.size.toString(),
      mtimeNs: stats.mtimeNs.toString(),
    };
  });
}

function runHandoff(reference, environment = {}) {
  const env = {
    ...process.env,
    HOME: fixtureHome,
    PATH: `${join(fixtureRoot, 'bin')}:${process.env.PATH}`,
    TMPDIR: privateTmp,
    ...environment,
  };
  delete env.CLAUDE_CONFIG_DIR;
  delete env.CODEX_HOME;
  const result = spawnSync(process.execPath, [helper, reference], {
    encoding: 'utf8',
    env,
  });
  return result;
}

function parseSuccess(result) {
  assert.equal(result.status, 0, result.stderr);
  return JSON.parse(result.stdout);
}

function expectError(result, code, status) {
  assert.equal(result.status, status, result.stderr || result.stdout);
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
    `${databasePath}-shm`,
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

  const mutationPath = join(fixtureRoot, 'mutation.sqlite');
  const mutationDatabase = makeRuntimeDatabase(mutationPath, [
    {
      threadId: t3CodexId,
      providerName: 'codex',
      adapterKey: 'codex',
      cursor: JSON.stringify({ threadId: codexId }),
    },
  ]);
  mutationDatabase.close();
  const mutationHook = join(fixtureRoot, 'mutate-snapshot.mjs');
  writeFileSync(
    mutationHook,
    "import { readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs';\nconst path = process.argv[2];\nconst before = statSync(path);\nconst bytes = readFileSync(path);\nwriteFileSync(path, bytes);\nutimesSync(path, before.atime, before.mtime);\n"
  );
  expectError(
    runHandoff(`t3://threads/${t3CodexId}`, {
      T3_STATE_DB: mutationPath,
      MOVE_SESSION_HERE_TEST_SNAPSHOT_HOOK: mutationHook,
    }),
    't3_snapshot_busy',
    1
  );

  const replacementPath = join(fixtureRoot, 'replacement.sqlite');
  const replacementDatabase = makeRuntimeDatabase(replacementPath, [
    {
      threadId: t3CodexId,
      providerName: 'codex',
      adapterKey: 'codex',
      cursor: JSON.stringify({ threadId: codexId }),
    },
  ]);
  replacementDatabase.close();
  const replacementHook = join(fixtureRoot, 'replace-snapshot.mjs');
  writeFileSync(
    replacementHook,
    "import { copyFileSync, renameSync } from 'node:fs';\nconst path = process.argv[2];\nrenameSync(path, `${path}.old`);\ncopyFileSync(`${path}.old`, path);\n"
  );
  expectError(
    runHandoff(`t3://threads/${t3CodexId}`, {
      T3_STATE_DB: replacementPath,
      MOVE_SESSION_HERE_TEST_SNAPSHOT_HOOK: replacementHook,
    }),
    't3_snapshot_busy',
    1
  );

  expectError(
    runHandoff(`t3://threads/${t3ClaudeId}`, {
      T3_STATE_DB: databasePath,
      NODE_OPTIONS: '--no-experimental-sqlite',
    }),
    't3_sqlite_unavailable',
    1
  );
  expectError(
    runHandoff(`t3://threads/${t3ClaudeId}`, {
      T3_STATE_DB: databasePath,
      TMPDIR: join(fixtureRoot, 'missing-tmp-parent', 'tmp'),
    }),
    't3_runtime_error',
    1
  );

  assert.deepEqual(readdirSync(privateTmp), []);
  assert.equal(existsSync(sentinel), false);
  process.stdout.write('OK: T3 session handoff contract passed\n');
} finally {
  liveDatabase.close();
  rmSync(fixtureRoot, { recursive: true, force: true });
}
