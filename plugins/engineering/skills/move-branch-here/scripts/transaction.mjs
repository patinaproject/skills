#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { setImmediate as yieldTurn } from 'node:timers/promises';

process.umask(0o077);
const absent = { kind: 'absent' };
const directory = { kind: 'directory', mode: 0o755 };
const encode = value => Buffer.from(value).toString('base64');
const decode = value => Buffer.from(value, 'base64');
const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const split = bytes => {
  const result = [];
  let start = 0;
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] === 0) { result.push(bytes.subarray(start, i)); start = i + 1; }
  }
  return result;
};
const nul = values => Buffer.concat(values.flatMap(value => [Buffer.from(value), Buffer.from([0])]));
const display = key => `"${[...decode(key)].map(byte => {
  if (byte >= 32 && byte <= 126 && byte !== 34 && byte !== 92) return String.fromCharCode(byte);
  return ({ 9: '\\t', 10: '\\n', 13: '\\r', 34: '\\"', 92: '\\\\' })[byte] || `\\x${byte.toString(16).padStart(2, '0')}`;
}).join('')}"`;
let tx;
let location;
let common;
let objectFormat;
let interrupted;
const counts = new Map();
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { interrupted = signal; });

function git(root, args, input, env = {}, expectedCodes = []) {
  const result = spawnSync('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'submodule.recurse=false', '-c', 'core.fsync=all', '-c', 'core.fsyncMethod=fsync', '-C', root, ...args], {
    input, env: { ...process.env, GIT_OPTIONAL_LOCKS: '0', ...env }, maxBuffer: 128 * 1024 * 1024,
  });
  if (!result.error && expectedCodes.includes(result.status)) return Buffer.alloc(0);
  if (result.error || result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.error?.message || result.stderr.toString().trim()}`);
  }
  return result.stdout;
}
const text = (root, args, input, env) => git(root, args, input, env).toString().trim();
function maybe(root, args) {
  return git(root, args, undefined, {}, [1]).toString().trim();
}
function syncDir(folder) {
  const fd = fs.openSync(folder, 'r');
  try { fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
}
function mkdirDurable(folder) {
  if (fs.existsSync(folder)) return;
  mkdirDurable(path.dirname(folder));
  fs.mkdirSync(folder, { mode: 0o700 });
  syncDir(folder); syncDir(path.dirname(folder));
}
function processIdentity(pid) {
  const result = spawnSync('ps', ['-p', String(pid), '-o', 'lstart='], { encoding: 'utf8', env: { ...process.env, LC_ALL: 'C', TZ: 'UTC' } });
  if (result.status === 1 && !result.stdout.trim()) return '';
  if (result.status !== 0 || !result.stdout.trim()) throw new Error('could not verify transaction process identity');
  return result.stdout.trim();
}
function durable(file, bytes) {
  const temporary = `${file}.new`;
  const fd = fs.openSync(temporary, 'w', 0o600);
  try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
  fs.renameSync(temporary, file);
  syncDir(path.dirname(file));
}
function save() { durable(path.join(location, 'journal.json'), JSON.stringify(tx)); }
function boundary(name) {
  const count = (counts.get(name) || 0) + 1;
  counts.set(name, count);
  if (interrupted && tx?.phase !== 'rollback') throw new Error(`interrupted by ${interrupted}`);
  if ((count === 1 && process.env.MOVE_BRANCH_HERE_FAULT === name) || process.env.MOVE_BRANCH_HERE_FAULT === `${name}:${count}`) throw new Error(`injected failure at ${name}:${count}`);
  if ([name, `${name}:${count}`].includes(process.env.MOVE_BRANCH_HERE_KILL)) process.kill(process.pid, 'SIGKILL');
  if ([name, `${name}:${count}`].includes(process.env.MOVE_BRANCH_HERE_SIGNAL)) process.kill(process.pid, 'SIGTERM');
}
function filePath(root, key) {
  const relative = decode(key);
  const pieces = relative.toString('latin1').split('/');
  if (pieces.some(part => !part || part === '.' || part === '..' || part.toLowerCase() === '.git')) {
    throw new Error(`unsafe path ${display(key)}`);
  }
  return Buffer.concat([Buffer.from(`${root}/`), relative]);
}
function parents(key) {
  const bytes = decode(key);
  const result = [];
  for (let i = 0; i < bytes.length; i++) if (bytes[i] === 47) result.push(encode(bytes.subarray(0, i)));
  return result;
}
function lstat(root, key) {
  for (const ancestor of parents(key)) {
    try {
      if (!fs.lstatSync(filePath(root, ancestor)).isDirectory()) return undefined;
    } catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
  }
  try { return fs.lstatSync(filePath(root, key)); }
  catch (error) { if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return undefined; throw error; }
}
function blob(root, bytes, write = false) {
  if (write) return text(root, ['hash-object', '--no-filters', '-w', '--stdin'], bytes);
  return crypto.createHash(objectFormat).update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
}
function image(root, key, write = false) {
  const stat = lstat(root, key);
  if (!stat) return absent;
  if (stat.isDirectory()) return { kind: 'directory', mode: stat.mode & 0o777 };
  if (stat.isSymbolicLink()) return { kind: 'symlink', blob: blob(root, fs.readlinkSync(filePath(root, key), { encoding: 'buffer' }), write) };
  if (stat.isFile()) return { kind: 'file', blob: blob(root, fs.readFileSync(filePath(root, key)), write), mode: stat.mode & 0o777 };
  throw new Error(`unsupported special filesystem entry ${display(key)}`);
}
function tree(root, oid) {
  const entries = {};
  for (const row of split(git(root, ['ls-tree', '-rz', oid]))) {
    const tab = row.indexOf(9);
    const [mode, type, object] = row.subarray(0, tab).toString().split(' ');
    if (type !== 'blob') throw new Error('submodules are unsupported; move them separately');
    entries[encode(row.subarray(tab + 1))] = mode === '120000'
      ? { kind: 'symlink', blob: object }
      : { kind: 'file', blob: object, mode: mode === '100755' ? 0o755 : 0o644 };
  }
  return entries;
}
function expand(entries, keys) {
  const result = { ...entries };
  for (const key of keys) {
    result[key] ??= absent;
    for (const parent of parents(key)) result[parent] ??= directory;
  }
  return result;
}
function head(root) {
  return { oid: text(root, ['rev-parse', 'HEAD']), ref: maybe(root, ['symbolic-ref', '-q', 'HEAD']) };
}
function endpoint(root) {
  return { root, gitDir: text(root, ['rev-parse', '--absolute-git-dir']), head: head(root) };
}
function guard(root) {
  for (const setting of ['core.sparseCheckout', 'index.sparse']) {
    if (maybe(root, ['config', '--bool', setting]) === 'true') throw new Error(`${setting} is unsupported`);
  }
  if (text(root, ['rev-parse', '--shared-index-path'])) throw new Error('split index is unsupported');
  const flags = split(git(root, ['ls-files', '-v', '-z']));
  if (flags.some(row => row[0] !== 72)) throw new Error('skip-worktree, assume-unchanged, or unmerged index is unsupported');
  const details = git(root, ['ls-files', '--debug', '-z']).toString('latin1');
  if ([...details.matchAll(/\0  ctime:[^\0]*?\n  size: [^\n]*?flags: ([0-9a-f]+)/g)].some(match => parseInt(match[1], 16) & 0x20000000)) {
    throw new Error('intent-to-add is unsupported');
  }
  if (maybe(root, ['config', '--bool', 'core.symlinks']) === 'false') throw new Error('core.symlinks=false is unsupported');
  if (['true', 'input'].includes(maybe(root, ['config', 'core.autocrlf']))) throw new Error('core.autocrlf conversion is unsupported');
  if (git(root, ['ls-files', '--stage', '-z']).includes(Buffer.from('160000 '))) throw new Error('submodules are unsupported');
  attributes(root, split(git(root, ['ls-files', '-z'])).map(encode));
}
function filesystemGuard(root) {
  const ignored = split(git(root, ['ls-files', '--others', '--ignored', '--exclude-standard', '--directory', '-z']));
  function visit(prefix) {
    const absolute = prefix.length ? Buffer.concat([Buffer.from(`${root}/`), prefix]) : Buffer.from(root);
    for (const name of fs.readdirSync(absolute, { encoding: 'buffer' })) {
      if (name.equals(Buffer.from('.git'))) {
        if (prefix.length) throw new Error('nested repository is unsupported');
        continue;
      }
      const relative = prefix.length ? Buffer.concat([prefix, Buffer.from('/'), name]) : name;
      if (ignored.some(entry => entry.equals(relative) || entry.equals(Buffer.concat([relative, Buffer.from('/')])))) continue;
      const stat = fs.lstatSync(Buffer.concat([Buffer.from(`${root}/`), relative]));
      if (stat.isDirectory()) visit(relative);
      else if (!stat.isFile() && !stat.isSymbolicLink()) throw new Error(`unsupported special filesystem entry ${JSON.stringify(relative.toString())}`);
    }
  }
  visit(Buffer.alloc(0));
}
function attributes(root, keys, env = {}, cached = false) {
  const result = split(git(root, ['check-attr', ...(cached ? ['--cached'] : []), '-z', '--stdin', 'filter', 'text', 'eol', 'working-tree-encoding', 'ident'], nul(keys.map(decode)), env));
  for (let i = 0; i < result.length; i += 3) {
    if (!['unspecified', 'unset'].includes(result[i + 2].toString())) {
      throw new Error(`conversion attribute ${result[i + 1]} is unsupported for ${JSON.stringify(result[i].toString())}`);
    }
  }
}
function indexBytes(ep) { return fs.readFileSync(path.join(ep.gitDir, 'index')); }
function logicalIndex(ep) { return encode(git(ep.root, ['ls-files', '--stage', '-z'])); }
function capture(ep, keys) {
  const result = {};
  for (const key of new Set(keys.flatMap(key => [key, ...parents(key)]))) result[key] = image(ep.root, key, true);
  return result;
}
function snapshotIndex(ep) {
  const bytes = indexBytes(ep);
  ep.index = blob(ep.root, bytes, true);
  ep.logicalIndex = logicalIndex(ep);
  const alternate = path.join(location, `capture-${ep.name}`);
  try {
    fs.writeFileSync(alternate, bytes);
    ep.tree = text(ep.root, ['write-tree'], undefined, { GIT_INDEX_FILE: alternate });
  } finally { if (fs.existsSync(alternate)) fs.unlinkSync(alternate); }
}
function buildIndex(ep, oid) {
  const alternate = path.join(location, `index-${ep.name}-${oid}`);
  try {
    git(ep.root, ['read-tree', oid], undefined, { GIT_INDEX_FILE: alternate });
    attributes(ep.root, Object.keys(tree(ep.root, oid)), { GIT_INDEX_FILE: alternate }, true);
    return { blob: blob(ep.root, fs.readFileSync(alternate), true), logical: encode(git(ep.root, ['ls-files', '--stage', '-z'], undefined, { GIT_INDEX_FILE: alternate })) };
  } finally { if (fs.existsSync(alternate)) fs.unlinkSync(alternate); }
}
function collision(root, incoming, owned) {
  for (const key of incoming) {
    const existing = lstat(root, key);
    if (existing && !owned.has(key) && ![...owned].some(child => parents(child).includes(key))) {
      throw new Error(`path collision at ${display(key)}`);
    }
    for (const ancestor of parents(key)) {
      const stat = lstat(root, ancestor);
      if (stat && !stat.isDirectory() && !owned.has(ancestor)) throw new Error(`path collision at ${display(ancestor)}`);
    }
  }
  const others = split(git(root, ['ls-files', '--others', '-z'])).map(encode);
  for (const other of others) {
    if (decode(other).at(-1) === 47) throw new Error(`nested repository is unsupported: ${display(other)}`);
    for (const key of incoming) {
      if (owned.has(other)) continue;
      if (other === key || parents(other).includes(key) || parents(key).includes(other)) {
        throw new Error(`path collision at ${display(other)}`);
      }
    }
  }
}
function leasePath(ep) { return path.join(common, 'move-branch-here', 'leases', crypto.createHash('sha256').update(ep.gitDir).digest('hex')); }
function pending(ep) {
  const lease = leasePath(ep);
  if (fs.existsSync(lease)) throw new Error(`pending transfer ${fs.readFileSync(lease, 'utf8').trim()}; run recover with that transaction ID`);
}
function checkEndpoints() {
  for (const ep of tx.endpoints) {
    if (text(ep.root, ['rev-parse', '--absolute-git-dir']) !== ep.gitDir) throw new Error('endpoint identity changed');
    if (ep.head.ref && text(ep.root, ['rev-parse', ep.head.ref]) !== ep.head.oid) throw new Error('original branch changed');
  }
  if (text(tx.destination.root, ['rev-parse', `refs/heads/${tx.branch}`]) !== tx.oid) throw new Error('incoming branch changed');
}
async function journalMutation(record, action) {
  tx.events.push(record); save();
  await yieldTurn();
  boundary(`before-${record.kind}`);
  action();
  await yieldTurn();
  boundary(`after-${record.kind}`);
}
function knownImages(ep, key) {
  return [ep.before[key], ...tx.events.filter(event => event.kind === 'file' && event.endpoint === ep.name && event.path === key).flatMap(event => [event.before, event.after])];
}
function assertKnown(ep) {
  const currentHead = head(ep.root);
  const heads = [ep.head, ...tx.events.filter(event => event.kind === 'head' && event.endpoint === ep.name).flatMap(event => [event.before, event.after])];
  if (!heads.some(value => equal(value, currentHead))) throw new Error(`unexpected HEAD at ${ep.root}`);
  const indexes = [ep.index, ...tx.events.filter(event => event.kind === 'index' && event.endpoint === ep.name).flatMap(event => [event.before, event.after])];
  if (!indexes.includes(blob(ep.root, indexBytes(ep)))) throw new Error(`unexpected index at ${ep.root}`);
  for (const key of Object.keys(ep.before)) {
    if (!knownImages(ep, key).some(value => equal(value, image(ep.root, key)))) throw new Error(`unexpected file at ${ep.root}/${display(key)}`);
  }
}
async function setHead(ep, target) {
  const before = head(ep.root);
  const known = [ep.head, ...tx.events.filter(event => event.kind === 'head' && event.endpoint === ep.name).flatMap(event => [event.before, event.after])];
  if (!known.some(value => equal(value, before))) throw new Error(`unexpected HEAD at ${ep.root}`);
  await journalMutation({ kind: 'head', endpoint: ep.name, before, after: target }, () => {
    if (!equal(before, head(ep.root))) throw new Error('HEAD changed before update');
    if (target.ref) {
      if (text(ep.root, ['rev-parse', target.ref]) !== target.oid) throw new Error('branch changed before attachment');
      const holders = text(ep.root, ['worktree', 'list', '--porcelain']).split('\n\n').filter(record => record.includes(`\nbranch ${target.ref}\n`) || record.endsWith(`\nbranch ${target.ref}`));
      if (holders.some(record => !record.startsWith(`worktree ${ep.root}\n`))) throw new Error('another worktree owns the branch');
      git(ep.root, ['symbolic-ref', 'HEAD', target.ref]);
    }
    else git(ep.root, ['update-ref', '--no-deref', 'HEAD', target.oid, before.oid]);
    if (!equal(head(ep.root), target)) throw new Error('HEAD update verification failed');
  });
}
async function installIndex(ep, object) {
  const before = blob(ep.root, indexBytes(ep));
  const known = [ep.index, ...tx.events.filter(event => event.kind === 'index' && event.endpoint === ep.name).flatMap(event => [event.before, event.after])];
  if (!known.includes(before)) throw new Error(`unexpected index at ${ep.root}`);
  await journalMutation({ kind: 'index', endpoint: ep.name, before, after: object }, () => {
    const filename = path.join(ep.gitDir, 'index');
    const lock = `${filename}.lock`;
    const fd = fs.openSync(lock, 'wx', 0o600);
    try {
      if (blob(ep.root, indexBytes(ep)) !== before) throw new Error('index changed before update');
      fs.writeFileSync(fd, git(ep.root, ['cat-file', 'blob', object])); fs.fsyncSync(fd);
      boundary('index-write');
    } catch (error) { fs.closeSync(fd); fs.unlinkSync(lock); throw error; }
    fs.closeSync(fd); fs.renameSync(lock, filename); boundary('index-renamed'); syncDir(ep.gitDir);
  });
}
async function replace(ep, key, target) {
  const before = image(ep.root, key);
  if (equal(before, target)) return;
  if (!knownImages(ep, key).some(value => equal(value, before))) throw new Error(`unexpected edit at ${display(key)}`);
  const parent = decode(key).subarray(0, decode(key).lastIndexOf(47) + 1);
  const temporaryKey = encode(Buffer.concat([parent, Buffer.from(`.move-${tx.id}-${tx.events.length}`)]));
  if (lstat(ep.root, temporaryKey)) throw new Error(`temporary path collision at ${display(temporaryKey)}`);
  await journalMutation({ kind: 'file', endpoint: ep.name, path: key, before, after: target, temporary: temporaryKey }, () => {
    if (!equal(before, image(ep.root, key))) throw new Error(`file changed before update ${display(key)}`);
    const filename = filePath(ep.root, key);
    for (const ancestor of parents(key)) if (!lstat(ep.root, ancestor)?.isDirectory()) throw new Error(`unsafe ancestor ${display(ancestor)}`);
    if (target.kind === 'absent') {
      if (before.kind === 'directory') fs.rmdirSync(filename); else fs.unlinkSync(filename);
    } else if (target.kind === 'directory') {
      if (before.kind === 'directory') fs.chmodSync(filename, target.mode);
      else { fs.mkdirSync(filename, { mode: target.mode }); fs.chmodSync(filename, target.mode); }
    } else {
      if (before.kind === 'directory') fs.rmdirSync(filename);
      const temporary = filePath(ep.root, temporaryKey);
      const bytes = git(ep.root, ['cat-file', 'blob', target.blob]);
      if (target.kind === 'symlink') fs.symlinkSync(bytes, temporary);
      else {
        const fd = fs.openSync(temporary, 'wx', target.mode);
        try { fs.writeFileSync(fd, bytes); fs.fchmodSync(fd, target.mode); fs.fsyncSync(fd); }
        catch (error) { fs.closeSync(fd); fs.unlinkSync(temporary); throw error; }
        fs.closeSync(fd);
      }
      boundary('temporary');
      fs.renameSync(temporary, filename);
    }
    syncDir(filename.subarray(0, filename.lastIndexOf(47)));
  });
}
async function materialize(ep, target) {
  const keys = Object.keys(target).sort((a, b) => decode(b).length - decode(a).length);
  for (const key of keys) {
    const current = image(ep.root, key);
    if (current.kind !== 'absent' && (target[key].kind === 'absent' || (current.kind !== target[key].kind && [current.kind, target[key].kind].includes('directory')))) {
      await replace(ep, key, absent);
    }
  }
  for (const key of keys.reverse()) if (target[key].kind !== 'absent') await replace(ep, key, target[key]);
}
function verifyImages(ep, expected) {
  for (const [key, value] of Object.entries(expected)) if (!equal(image(ep.root, key), value)) throw new Error(`verification failed at ${ep.root}/${display(key)}`);
}
function verifyOriginal() {
  checkEndpoints();
  for (const ep of tx.endpoints) {
    if (!equal(head(ep.root), ep.head) || blob(ep.root, indexBytes(ep)) !== ep.index) throw new Error('original endpoint verification failed');
    verifyImages(ep, ep.before);
  }
}
function reconcileTemporaryFiles() {
  for (const event of tx.events) {
    const ep = tx.endpoints.find(value => value.name === event.endpoint);
    if (event.kind === 'file') {
      const current = image(ep.root, event.temporary);
      if (current.kind !== 'absent') {
        if (!equal(current, event.after)) throw new Error(`unexpected temporary content ${display(event.temporary)}`);
        fs.unlinkSync(filePath(ep.root, event.temporary));
      }
    }
    if (event.kind === 'index') {
      const lock = path.join(ep.gitDir, 'index.lock');
      if (fs.existsSync(lock)) {
        if (blob(ep.root, fs.readFileSync(lock)) !== event.after) throw new Error('unexpected index lock; preserve it for manual recovery');
        fs.unlinkSync(lock); syncDir(ep.gitDir);
      }
    }
  }
}
function cleanup() {
  boundary('cleanup');
  for (const [ref, oid] of Object.entries(tx.refs)) {
    const current = maybe(tx.destination.root, ['rev-parse', '--verify', '--quiet', ref]);
    if (current) git(tx.destination.root, ['update-ref', '-d', ref, oid]);
  }
  for (const ep of tx.endpoints) {
    const lease = leasePath(ep);
    if (fs.existsSync(lease)) {
      if (fs.readFileSync(lease, 'utf8') === tx.id) { fs.unlinkSync(lease); syncDir(path.dirname(lease)); }
    }
  }
  for (const filename of fs.readdirSync(location)) {
    if (/^(capture-(source|destination)|index-(source|destination)-[a-f0-9]+)(\.lock)?$/.test(filename)) fs.unlinkSync(path.join(location, filename));
  }
  tx.retired = true;
  durable(path.join(location, 'journal.json'), JSON.stringify({ version: tx.version, id: tx.id, phase: tx.phase, retired: true }));
}
async function rollback(reason) {
  checkEndpoints();
  for (const ep of tx.endpoints) assertKnown(ep);
  reconcileTemporaryFiles();
  tx.phase = 'rollback'; save();
  boundary('rollback');
  await setHead(tx.destination, tx.destination.head);
  if (tx.source) await setHead(tx.source, tx.source.head);
  for (const ep of tx.endpoints) { await materialize(ep, ep.before); await installIndex(ep, ep.index); }
  verifyOriginal();
  tx.phase = 'restored'; save(); cleanup();
  return `${reason}; both worktrees restored`;
}
function prepare(branch, oid, sourceRoot) {
  const destination = { ...endpoint(fs.realpathSync(text(process.cwd(), ['rev-parse', '--show-toplevel']))), name: 'destination' };
  const source = sourceRoot ? { ...endpoint(sourceRoot), name: 'source' } : undefined;
  const endpoints = [destination, ...(source ? [source] : [])];
  if (source) {
    for (const setting of ['core.filemode', 'core.ignorecase', 'core.excludesFile', 'core.attributesFile', 'status.renames', 'diff.renames']) {
      if (maybe(source.root, ['config', '--get', setting]) !== maybe(destination.root, ['config', '--get', setting])) {
        throw new Error(`incompatible worktree configuration is unsupported: ${setting}`);
      }
    }
  }
  if (source && !equal(source.head, { oid, ref: `refs/heads/${branch}` })) throw new Error('source ownership changed');
  if (text(destination.root, ['status', '--porcelain', '--untracked-files=no'])) throw new Error('destination has tracked changes');
  for (const ep of endpoints) { guard(ep.root); pending(ep); filesystemGuard(ep.root); }
  const incomingHead = tree(destination.root, oid);
  const destinationHead = tree(destination.root, destination.head.oid);
  const sourceIndex = source ? split(git(source.root, ['ls-files', '-z'])).map(encode) : [];
  const untracked = source ? split(git(source.root, ['ls-files', '--others', '--exclude-standard', '-z'])).map(encode) : [];
  const incoming = [...new Set([...Object.keys(incomingHead), ...sourceIndex, ...untracked])];
  for (const ep of endpoints) attributes(ep.root, incoming);
  collision(destination.root, incoming, new Set(Object.keys(destinationHead)));
  if (source) collision(source.root, Object.keys(incomingHead), new Set([...sourceIndex, ...untracked]));
  const id = crypto.randomUUID();
  location = path.join(common, 'move-branch-here', 'transactions', id);
  mkdirDurable(location);
  tx = { version: 1, id, branch, oid, owner: process.pid, ownerIdentity: processIdentity(process.pid), phase: 'preparing', destination, source, endpoints, events: [], refs: {}, transferred: [] };
  save();
  mkdirDurable(path.join(common, 'move-branch-here', 'leases'));
  for (const ep of [...endpoints].sort((a, b) => a.gitDir.localeCompare(b.gitDir))) {
    const fd = fs.openSync(leasePath(ep), 'wx', 0o600);
    try { fs.writeFileSync(fd, id); fs.fsyncSync(fd); } finally { fs.closeSync(fd); }
    syncDir(path.dirname(leasePath(ep)));
  }
  for (const ep of endpoints) snapshotIndex(ep);
  const keys = [...new Set([...incoming, ...Object.keys(destinationHead)])];
  destination.before = capture(destination, keys);
  if (source) {
    source.before = capture(source, incoming);
    source.target = expand(incomingHead, Object.keys(source.before));
    for (const key of Object.keys(source.target)) {
      if (source.target[key].kind === 'directory' && !Object.keys(incomingHead).some(child => parents(child).includes(key))) source.target[key] = absent;
    }
    const sourceStatus = [...split(git(source.root, ['diff', '--cached', '--name-only', '-z', 'HEAD'])), ...split(git(source.root, ['diff', '--name-only', '-z']))];
    tx.transferred = [...new Set([...sourceStatus.map(encode), ...untracked])];
    destination.target = expand({ ...source.before }, keys);
    for (const key of Object.keys(destination.target)) if (!Object.hasOwn(source.before, key)) destination.target[key] = absent;
  } else destination.target = expand(incomingHead, keys);
  for (const ep of endpoints) {
    const others = split(git(ep.root, ['ls-files', '--others', '-z'])).map(encode);
    for (const other of others) {
      if (ep === source && untracked.includes(other)) continue;
      for (const parent of parents(other)) {
        if (ep.target[parent]?.kind === 'absent' && ep.before[parent]?.kind === 'directory') ep.target[parent] = directory;
      }
    }
    for (const key of Object.keys(ep.target)) {
      if (ep.target[key].kind === 'directory' && ep.before[key]?.kind === 'directory') ep.target[key] = ep.before[key];
    }
  }
  destination.newIndex = buildIndex(destination, source ? source.tree : oid);
  if (source) source.newIndex = buildIndex(source, oid);
  const objects = new Map();
  for (const ep of endpoints) {
    objects.set(ep.index, 'blob'); objects.set(ep.tree, 'tree'); objects.set(ep.newIndex.blob, 'blob');
    for (const value of [...Object.values(ep.before), ...Object.values(ep.target)]) if (value.blob) objects.set(value.blob, 'blob');
  }
  const manifestTree = text(destination.root, ['mktree'], [...objects].map(([object, type], i) => `${type === 'tree' ? '040000' : '100644'} ${type} ${object}\t${i}\n`).join(''));
  tx.refs[`refs/move-branch-here/${id}/snapshot`] = manifestTree;
  for (const ep of endpoints) tx.refs[`refs/move-branch-here/${id}/base-${ep.name}`] = ep.head.oid;
  save();
  for (const [ref, object] of Object.entries(tx.refs)) git(destination.root, ['update-ref', ref, object, '0'.repeat(object.length)]);
  tx.phase = 'prepared'; save();
  if (text(destination.root, ['status', '--porcelain', '--untracked-files=no'])) throw new Error('destination changed during capture');
  verifyOriginal();
  boundary('prepared');
  return tx;
}
async function move(branch, oid, sourceRoot) {
  try {
    prepare(branch, oid, sourceRoot);
    tx.phase = 'moving'; save();
    if (tx.source) await setHead(tx.source, { oid, ref: '' });
    boundary('detached');
    await setHead(tx.destination, { oid, ref: `refs/heads/${branch}` });
    boundary('attached');
    await installIndex(tx.destination, tx.destination.newIndex.blob);
    await materialize(tx.destination, tx.destination.target);
    boundary('destination');
    verifyImages(tx.destination, tx.destination.target);
    if (tx.source) {
      await materialize(tx.source, tx.source.target);
      await installIndex(tx.source, tx.source.newIndex.blob);
    }
    boundary('source');
    checkEndpoints();
    if (!equal(head(tx.destination.root), { oid, ref: `refs/heads/${branch}` })) throw new Error('destination HEAD verification failed');
    if (tx.source && !equal(head(tx.source.root), { oid, ref: '' })) throw new Error('source HEAD verification failed');
    for (const ep of tx.endpoints) {
      verifyImages(ep, ep.target);
      if (logicalIndex(ep) !== ep.newIndex.logical) throw new Error('logical index verification failed');
    }
    boundary('verify');
    tx.phase = 'committed'; save();
    try { cleanup(); } catch (error) { console.error(`Committed transfer ${tx.id}; run recover to finish cleanup: ${error.message}`); }
    for (const key of tx.transferred) console.error(`Transferred ${display(key)}`);
    console.log(tx.source ? `moved\t${branch}\t${tx.source.root}\t${oid}` : `attached\t${branch}\t\t`);
  } catch (error) {
    if (!tx) throw error;
    if (tx.phase === 'preparing' || tx.phase === 'prepared') {
      tx.phase = 'restored'; save();
      try { cleanup(); } catch (cleanupError) { throw new Error(`${error.message}; recover ${tx.id}: ${cleanupError.message}`); }
      throw error;
    }
    if (tx.phase === 'committed') throw new Error(`transfer ${tx.id} is committed: ${error.message}`);
    let restored;
    try { restored = await rollback(error.message); }
    catch (rollbackError) { throw new Error(`${error.message}; rollback failed: ${rollbackError.message}; transaction ${tx.id} requires recovery`); }
    throw new Error(`${restored}; transaction ${tx.id}`);
  }
}
async function recover(id) {
  if (!/^[0-9a-f-]{36}$/.test(id)) throw new Error('invalid transaction ID');
  location = path.join(common, 'move-branch-here', 'transactions', id);
  try { tx = JSON.parse(fs.readFileSync(path.join(location, 'journal.json'), 'utf8')); }
  catch (error) { throw new Error(`recovery required: unreadable journal at ${location}; all artifacts retained: ${error.message}`); }
  if (tx.id !== id || tx.version !== 1) throw new Error('invalid transaction manifest');
  if (!tx.retired && tx.owner !== process.pid && processIdentity(tx.owner) === tx.ownerIdentity) throw new Error(`transaction owner ${tx.owner} is still running`);
  const recoveryRef = `refs/move-branch-here/${id}/recovery`;
  const previous = maybe(process.cwd(), ['rev-parse', '--verify', '--quiet', recoveryRef]);
  if (previous) {
    const owner = JSON.parse(git(process.cwd(), ['cat-file', 'blob', previous]).toString());
    if (processIdentity(owner.pid) === owner.identity) throw new Error('another recovery is running');
  }
  const owner = blob(process.cwd(), Buffer.from(JSON.stringify({ pid: process.pid, identity: processIdentity(process.pid) })), true);
  git(process.cwd(), ['update-ref', recoveryRef, owner, previous || '0'.repeat(owner.length)]);
  try {
    if (tx.retired) { console.log(tx.phase); return; }
    if (['committed', 'restored', 'preparing', 'prepared'].includes(tx.phase)) {
      if (['preparing', 'prepared'].includes(tx.phase)) tx.phase = 'restored';
      cleanup(); console.log(tx.phase);
    } else console.log(await rollback('interrupted transfer'));
  } finally { git(process.cwd(), ['update-ref', '-d', recoveryRef, owner]); }
}
try {
  if (Number(process.versions.node.split('.')[0]) < 24) throw new Error('Node.js 24 or newer is required');
  common = fs.realpathSync(text(process.cwd(), ['rev-parse', '--path-format=absolute', '--git-common-dir']));
  objectFormat = text(process.cwd(), ['rev-parse', '--show-object-format']);
  const [command, ...args] = process.argv.slice(2);
  if (command === 'check') {
    for (const root of args) { const ep = endpoint(root); guard(root); pending(ep); }
  } else if (command === 'pending') pending(endpoint(args[0]));
  else if (command === 'move') await move(...args);
  else if (command === 'recover') await recover(...args);
  else throw new Error('unknown transaction command');
} catch (error) { console.error(`FAIL: ${error.message}`); process.exitCode = 1; }
