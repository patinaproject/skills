#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync, spawnSync} from 'node:child_process';

const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {encoding: 'utf8'}).trim();
const manifestPath = path.join(root, 'upstream-skills.json');
const forksPath = path.join(root, 'upstream-skills-forks.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const forks = JSON.parse(fs.readFileSync(forksPath, 'utf8'));
const sourceName = process.argv.slice(2).find(arg => !arg.startsWith('-'));
const dryRun = process.argv.includes('--dry-run');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sync-upstream-skills-'));

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: root,
    encoding: 'utf8',
    env: {...process.env, ...(options.env ?? {})},
    stdio: options.stdio ?? 'pipe',
  }).trim();
}
function gitTry(args, options = {}) { try { return {ok: true, value: git(args, options)}; } catch (error) { return {ok: false, error}; } }
function fail(message, code = 2) { console.error(`sync-upstream-skills: ${message}`); process.exit(code); }
function stableJson(value) {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
function transformHash(transforms) { return crypto.createHash('sha256').update(stableJson({denylist: transforms.denylist ?? [], rename: transforms.rename ?? {}})).digest('hex'); }

if (git(['status', '--porcelain'])) fail('working tree not clean; commit or stash first.');
const sources = manifest.sources.filter(source => !sourceName || source.name === sourceName);
if (!sources.length) fail(`unknown source: ${sourceName}`);

const sourceData = new Map();
for (const source of sources) {
  source.transforms ??= {};
  source.transforms.rename ??= {};
  source.transforms.denylist ??= [];
  const expectedHash = transformHash(source.transforms);
  if (!source.transformHash) fail(`source ${source.name} has no transformHash; record ${expectedHash} at its pinned commit first.`);
  if (source.transformHash !== expectedHash) fail(`source ${source.name} transforms changed; record a new merge base at ${source.pin} and commit the transform change before syncing.`);
  if (!gitTry(['remote', 'get-url', source.name]).ok) git(['remote', 'add', source.name, source.repo]);
  git(['fetch', '--no-tags', source.name, source.ref]);
  const tip = git(['rev-parse', 'FETCH_HEAD']);
  if (!gitTry(['cat-file', '-e', `${source.pin}^{commit}`]).ok) git(['fetch', '--no-tags', source.name, source.pin]);
  if (!gitTry(['cat-file', '-e', `${source.pin}^{commit}`]).ok) fail(`pinned commit ${source.pin} for ${source.name} cannot be fetched.`);
  sourceData.set(source.name, {source, tip, base: new Map(), current: new Map()});
}

function rename(value, rules) { return Object.entries(rules).reduce((result, [from, to]) => result.split(from).join(to), value); }
function transformTree(sourceDir, destinationDir, rules) {
  for (const entry of fs.readdirSync(sourceDir, {withFileTypes: true})) {
    const from = path.join(sourceDir, entry.name), to = path.join(destinationDir, rename(entry.name, rules));
    if (entry.isDirectory()) { fs.mkdirSync(to, {recursive: true}); transformTree(from, to, rules); continue; }
    fs.mkdirSync(path.dirname(to), {recursive: true});
    const data = fs.readFileSync(from);
    fs.writeFileSync(to, data.includes(0) ? data : Buffer.from(rename(data.toString(), rules)));
    fs.chmodSync(to, fs.statSync(from).mode);
  }
}
function archive(commit, sourcePath, destination) {
  fs.mkdirSync(destination, {recursive: true});
  const archiveResult = spawnSync('git', ['archive', `${commit}:${sourcePath}`], {cwd: root, encoding: null});
  if (archiveResult.status !== 0) fail(`cannot archive ${commit}:${sourcePath}`);
  if (spawnSync('tar', ['-x', '-C', destination], {input: archiveResult.stdout}).status !== 0) fail(`cannot extract ${commit}:${sourcePath}`);
}
function excluded(relative, prefixes) { return (prefixes ?? []).some(prefix => relative === prefix || relative.startsWith(`${prefix}/`)); }
function collect(dir, target, out) {
  function walk(current, relative = '') {
    for (const entry of fs.readdirSync(current, {withFileTypes: true})) {
      const next = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) { walk(path.join(current, entry.name), next); continue; }
      if (target.kind === 'subtree' && excluded(next, target.exclude)) continue;
      const pathname = path.posix.join(target.destination, next), file = path.join(current, entry.name);
      out.set(pathname, {file, mode: fs.statSync(file).mode & 0o111 ? 0o100755 : 0o100644});
    }
  }
  walk(dir);
}
for (const {source, tip, base, current} of sourceData.values()) {
  for (const [label, commit, output] of [['base', source.pin, base], ['current', tip, current]]) {
    for (const [index, target] of source.targets.entries()) {
      const raw = path.join(tmp, source.name, label, String(index), 'raw'), transformed = path.join(tmp, source.name, label, String(index), 'transformed');
      archive(commit, target.source, raw); transformTree(raw, transformed, source.transforms.rename); collect(transformed, target, output);
    }
  }
  for (const token of source.transforms.denylist) for (const [label, snapshot] of [['base', base], ['current', current]]) for (const [pathname, item] of snapshot) if (pathname.includes(token) || fs.readFileSync(item.file).includes(Buffer.from(token))) fail(`denylist token ${token} found in ${source.name} ${label} snapshot at ${pathname}`);
}
function localFile(pathname) {
  const absolute = path.join(root, pathname);
  if (!fs.existsSync(absolute) || fs.lstatSync(absolute).isDirectory()) return null;
  return {data: fs.readFileSync(absolute), mode: fs.statSync(absolute).mode & 0o111 ? 0o100755 : 0o100644};
}
function sameFile(a, b) { return Boolean(a && b && a.mode === b.mode && a.data.equals(b.data)); }
function validateForks() {
  const differences = new Set();
  for (const {base} of sourceData.values()) for (const [pathname, item] of base) if (!sameFile(localFile(pathname), {data: fs.readFileSync(item.file), mode: item.mode})) differences.add(pathname);
  const stale = Object.keys(forks).filter(pathname => !differences.has(pathname)), undeclared = [...differences].filter(pathname => !forks[pathname]);
  if (undeclared.length || stale.length) {
    if (undeclared.length) console.error(`sync-upstream-skills: undeclared forks:\n${undeclared.map(p => `  ${p}`).join('\n')}`);
    if (stale.length) console.error(`sync-upstream-skills: stale forks:\n${stale.map(p => `  ${p}`).join('\n')}`);
    fail('fork registry does not match the pinned upstream snapshots.');
  }
  return differences;
}
const forked = validateForks();
const ownedPaths = new Set();
for (const {base, current} of sourceData.values()) for (const pathname of [...base.keys(), ...current.keys()]) ownedPaths.add(pathname);
function addSnapshotToIndex(index, snapshot) {
  for (const [pathname, item] of snapshot) {
    const blob = git(['hash-object', '-w', item.file]);
    git(['update-index', '--add', '--cacheinfo', `${item.mode},${blob},${pathname}`], {env: {GIT_INDEX_FILE: index}});
  }
}
function treeFor(label) {
  const index = path.join(tmp, `${label}.index`);
  git(['read-tree', 'HEAD'], {env: {GIT_INDEX_FILE: index}});
  for (const pathname of ownedPaths) gitTry(['update-index', '--remove', '--ignore-unmatch', '--', pathname], {env: {GIT_INDEX_FILE: index}});
  for (const {base, current} of sourceData.values()) addSnapshotToIndex(index, label === 'base' ? base : current);
  return git(['write-tree'], {env: {GIT_INDEX_FILE: index}});
}
const baseTree = treeFor('base'), currentTree = treeFor('current');
if (dryRun) {
  for (const pathname of ownedPaths) { const absolute = path.join(root, pathname); if (fs.existsSync(absolute) && fs.readFileSync(absolute).toString().includes('<<<<<<<')) fail(`conflict marker found under synced path ${pathname}`); }
  console.log(`sync-upstream-skills: dry run passed for ${sources.map(source => source.name).join(', ')} (${forked.size} declared fork(s)).`); process.exit(0);
}
const env = {GIT_AUTHOR_NAME: 'sync-upstream-skills', GIT_AUTHOR_EMAIL: 'sync-upstream-skills@example.invalid', GIT_COMMITTER_NAME: 'sync-upstream-skills', GIT_COMMITTER_EMAIL: 'sync-upstream-skills@example.invalid'};
const baseCommit = git(['commit-tree', baseTree, '-m', 'upstream-skills pinned base'], {env});
const tipCommit = git(['commit-tree', currentTree, '-p', baseCommit, '-m', 'upstream-skills tip'], {env});
const applied = spawnSync('git', ['cherry-pick', '--no-commit', tipCommit], {cwd: root, stdio: 'inherit'});
const conflicts = git(['diff', '--name-only', '--diff-filter=U']);
if (applied.status !== 0 && !conflicts) { gitTry(['reset', '--merge', 'HEAD']); fail('applying upstream changes failed without a merge conflict.'); }
for (const source of sources) source.pin = sourceData.get(source.name).tip;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`); git(['add', '--', 'upstream-skills.json']);
for (const {base, current} of sourceData.values()) for (const pathname of [...new Set([...base.keys(), ...current.keys()])].sort()) {
  const before = base.get(pathname), after = current.get(pathname);
  const classification = !before && after ? 'added' : before && !after ? 'deleted upstream' : before && after && !sameFile({data: fs.readFileSync(before.file), mode: before.mode}, {data: fs.readFileSync(after.file), mode: after.mode}) ? 'updated' : null;
  if (classification) console.log(`${classification}: ${pathname}`);
}
if (applied.status !== 0) { console.error('sync-upstream-skills: upstream changes left merge conflicts; resolve them, then commit.'); process.exit(1); }
console.log(`sync-upstream-skills: applied ${sources.map(source => source.name).join(', ')}; review staged files, then commit.`);
