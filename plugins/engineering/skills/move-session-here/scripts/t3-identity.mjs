import { createHash } from 'node:crypto';
import {
  closeSync,
  chmodSync,
  constants,
  existsSync,
  fstatSync,
  mkdtempSync,
  openSync,
  readFileSync,
  realpathSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

const SESSION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{2,127}$/;
const REQUIRED_COLUMNS = new Set([
  'thread_id',
  'provider_name',
  'adapter_key',
  'resume_cursor_json',
]);

class T3IdentityError extends Error {
  constructor(code, details, exitCode = 1) {
    super(code);
    this.name = 'T3IdentityError';
    this.code = code;
    this.details = details;
    this.exitCode = exitCode;
  }
}

function fingerprint(stats, digest, resolvedPath) {
  return {
    resolvedPath,
    dev: stats.dev.toString(),
    ino: stats.ino.toString(),
    size: stats.size.toString(),
    mtimeNs: stats.mtimeNs.toString(),
    ctimeNs: stats.ctimeNs.toString(),
    digest,
  };
}

function sameFingerprint(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function snapshotBusy(databasePath) {
  throw new T3IdentityError('t3_snapshot_busy', { databasePath });
}

function readStableFile(path, databasePath) {
  let descriptor;
  try {
    const resolvedPath = realpathSync(path);
    const pathStatsBefore = statSync(resolvedPath, { bigint: true });
    if (!pathStatsBefore.isFile()) {
      throw new T3IdentityError('invalid_t3_store', {
        databasePath,
        message: 'The T3 state file and its WAL must be regular files.',
      });
    }
    descriptor = openSync(resolvedPath, constants.O_RDONLY);
    const descriptorStatsBefore = fstatSync(descriptor, { bigint: true });
    if (
      descriptorStatsBefore.dev !== pathStatsBefore.dev ||
      descriptorStatsBefore.ino !== pathStatsBefore.ino
    ) {
      snapshotBusy(databasePath);
    }
    const bytes = readFileSync(descriptor);
    const descriptorStatsAfter = fstatSync(descriptor, { bigint: true });
    const pathStatsAfter = statSync(resolvedPath, { bigint: true });
    const resolvedPathAfter = realpathSync(path);
    const digest = createHash('sha256').update(bytes).digest('hex');
    const before = fingerprint(
      descriptorStatsBefore,
      digest,
      resolvedPath
    );
    const pathBefore = fingerprint(pathStatsBefore, digest, resolvedPath);
    const after = fingerprint(
      descriptorStatsAfter,
      digest,
      resolvedPathAfter
    );
    const pathAfter = fingerprint(pathStatsAfter, digest, resolvedPathAfter);
    if (
      !sameFingerprint(before, pathBefore) ||
      !sameFingerprint(before, after) ||
      !sameFingerprint(before, pathAfter)
    ) {
      snapshotBusy(databasePath);
    }
    return { bytes, fingerprint: before };
  } catch (error) {
    if (error instanceof T3IdentityError) {
      throw error;
    }
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
      snapshotBusy(databasePath);
    }
    throw new T3IdentityError('invalid_t3_store', {
      databasePath,
      path,
      cause: error.code,
      message: 'The T3 state file could not be read.',
    });
  } finally {
    if (descriptor !== undefined) {
      closeSync(descriptor);
    }
  }
}

function sourcePaths(databasePath) {
  if (existsSync(`${databasePath}-journal`)) {
    throw new T3IdentityError('t3_rollback_journal', { databasePath });
  }
  return [
    databasePath,
    ...(existsSync(`${databasePath}-wal`) ? [`${databasePath}-wal`] : []),
  ];
}

function readSourceSet(databasePath) {
  return sourcePaths(databasePath).map((path) => ({
    path,
    ...readStableFile(path, databasePath),
  }));
}

function sameSourceSet(left, right) {
  return (
    left.length === right.length &&
    left.every(
      (entry, index) =>
        entry.path === right[index].path &&
        sameFingerprint(entry.fingerprint, right[index].fingerprint)
    )
  );
}

function acquireSnapshot(databasePath) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), 'move-session-t3.'));
  chmodSync(temporaryDirectory, 0o700);
  try {
    const before = readSourceSet(databasePath);
    const copied = readSourceSet(databasePath);
    if (!sameSourceSet(before, copied)) {
      snapshotBusy(databasePath);
    }
    for (const [index, source] of copied.entries()) {
      const destination = join(
        temporaryDirectory,
        index === 0 ? 'state.sqlite' : 'state.sqlite-wal'
      );
      writeFileSync(destination, source.bytes, { mode: 0o600 });
      const copiedDigest = createHash('sha256')
        .update(readFileSync(destination))
        .digest('hex');
      if (copiedDigest !== source.fingerprint.digest) {
        snapshotBusy(databasePath);
      }
    }
    const after = readSourceSet(databasePath);
    if (!sameSourceSet(before, after)) {
      snapshotBusy(databasePath);
    }
    return {
      temporaryDirectory,
      databasePath: join(temporaryDirectory, 'state.sqlite'),
    };
  } catch (error) {
    rmSync(temporaryDirectory, { recursive: true, force: true });
    throw error;
  }
}

function selectDatabasePath() {
  const override = process.env.T3_STATE_DB;
  const databasePath = override
    ? override
    : join(process.env.HOME || homedir(), '.t3', 'userdata', 'state.sqlite');
  if (override && !isAbsolute(override)) {
    throw new T3IdentityError('invalid_t3_store', {
      variable: 'T3_STATE_DB',
      path: override,
      message: 'T3_STATE_DB must be an absolute path to a regular file.',
    });
  }
  const absolutePath = resolve(databasePath);
  if (!existsSync(absolutePath)) {
    throw new T3IdentityError(
      't3_store_not_found',
      { databasePath: absolutePath },
      2
    );
  }
  if (!statSync(absolutePath).isFile()) {
    throw new T3IdentityError('invalid_t3_store', {
      variable: override ? 'T3_STATE_DB' : undefined,
      path: absolutePath,
      message: 'The T3 state database must be a regular file.',
    });
  }
  return realpathSync(absolutePath);
}

function parseCursor(row, threadId, databasePath) {
  let cursor;
  try {
    cursor = JSON.parse(row.resume_cursor_json);
  } catch {
    throw new T3IdentityError('t3_invalid_mapping', {
      threadId,
      databasePath,
      message: 'The provider resume cursor is not valid JSON.',
    });
  }
  if (cursor === null || Array.isArray(cursor) || typeof cursor !== 'object') {
    throw new T3IdentityError('t3_invalid_mapping', {
      threadId,
      databasePath,
      message: 'The provider resume cursor must be a JSON object.',
    });
  }
  return cursor;
}

function requireSessionId(value, threadId, databasePath) {
  if (typeof value !== 'string' || !SESSION_ID.test(value)) {
    throw new T3IdentityError('t3_invalid_mapping', {
      threadId,
      databasePath,
      message: 'The provider session identity is invalid.',
    });
  }
  return value;
}

function validateOptionalSessionId(value, threadId, databasePath) {
  if (value !== undefined && value !== null) {
    requireSessionId(value, threadId, databasePath);
  }
}

function mapRuntimeRow(row, threadId, databasePath) {
  const cursor = parseCursor(row, threadId, databasePath);
  if (row.provider_name === 'claudeAgent' && row.adapter_key === 'claudeAgent') {
    if (cursor.threadId !== threadId) {
      throw new T3IdentityError('t3_invalid_mapping', {
        threadId,
        databasePath,
        message: 'The Claude cursor belongs to a different T3 thread.',
      });
    }
    validateOptionalSessionId(cursor.resume, threadId, databasePath);
    validateOptionalSessionId(cursor.sessionId, threadId, databasePath);
    if (
      typeof cursor.resume === 'string' &&
      typeof cursor.sessionId === 'string' &&
      cursor.resume !== cursor.sessionId
    ) {
      throw new T3IdentityError('t3_invalid_mapping', {
        threadId,
        databasePath,
        message: 'The Claude cursor contains contradictory session identities.',
      });
    }
    const sessionId = requireSessionId(
      cursor.resume ?? cursor.sessionId,
      threadId,
      databasePath
    );
    return { format: 'claude', sessionId };
  }
  if (row.provider_name === 'codex' && row.adapter_key === 'codex') {
    return {
      format: 'codex',
      sessionId: requireSessionId(cursor.threadId, threadId, databasePath),
    };
  }
  throw new T3IdentityError('t3_unsupported_provider', {
    threadId,
    databasePath,
    providerName: row.provider_name,
    adapterKey: row.adapter_key,
  });
}

async function openSnapshot(snapshot, databasePath) {
  let DatabaseSync;
  try {
    ({ DatabaseSync } = await import('node:sqlite'));
  } catch {
    throw new T3IdentityError('t3_sqlite_unavailable', {
      databasePath,
      message: 'This Node.js runtime does not provide node:sqlite.',
    });
  }
  try {
    return new DatabaseSync(snapshot.databasePath, { readOnly: true });
  } catch {
    throw new T3IdentityError('invalid_t3_store', {
      databasePath,
      message: 'The T3 state database could not be opened.',
    });
  }
}

async function resolveThreadFromStore(threadId) {
  const databasePath = selectDatabasePath();
  const snapshot = acquireSnapshot(databasePath);
  let database;
  try {
    database = await openSnapshot(snapshot, databasePath);
    const columns = database
      .prepare('PRAGMA table_info(provider_session_runtime)')
      .all();
    const columnNames = new Set(columns.map((column) => column.name));
    if (
      columns.length === 0 ||
      [...REQUIRED_COLUMNS].some((column) => !columnNames.has(column))
    ) {
      throw new T3IdentityError('t3_unsupported_schema', { databasePath });
    }
    const rows = database
      .prepare(
        'SELECT thread_id, provider_name, adapter_key, resume_cursor_json FROM provider_session_runtime WHERE thread_id = ? LIMIT 2'
      )
      .all(threadId);
    if (rows.length === 0) {
      throw new T3IdentityError(
        't3_mapping_not_found',
        { threadId, databasePath },
        2
      );
    }
    if (rows.length > 1) {
      throw new T3IdentityError(
        't3_mapping_ambiguous',
        { threadId, databasePath },
        3
      );
    }
    const mapping = mapRuntimeRow(rows[0], threadId, databasePath);
    return {
      ...mapping,
      t3: { threadId, databasePath },
    };
  } catch (error) {
    if (error instanceof T3IdentityError) {
      throw error;
    }
    throw new T3IdentityError('invalid_t3_store', {
      databasePath,
      message: 'The T3 state database could not be read.',
    });
  } finally {
    database?.close();
    rmSync(snapshot.temporaryDirectory, { recursive: true, force: true });
  }
}

export async function resolveT3Thread(threadId) {
  try {
    return await resolveThreadFromStore(threadId);
  } catch (error) {
    if (error instanceof T3IdentityError) {
      throw error;
    }
    throw new T3IdentityError('t3_runtime_error', {
      threadId,
      message: 'The T3 identity lookup failed in this runtime.',
    });
  }
}
