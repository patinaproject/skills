import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../../plugins/engineering/skills/move-branch-here/scripts/worktree-context.sh', import.meta.url));

function command(executable, args, options = {}) {
  return spawnSync(executable, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    input: options.input,
    maxBuffer: 128 * 1024 * 1024,
  });
}

function requireSuccess(result) {
  assert.equal(result.status, 0, `${result.stderr}${result.stdout}`);
  return result.stdout;
}

function git(root, ...args) {
  return requireSuccess(command('git', ['-C', root, ...args]));
}

function supportedBash() {
  for (const candidate of [process.env.BASH, '/opt/homebrew/bin/bash', '/usr/local/bin/bash', 'bash']) {
    if (!candidate) continue;
    const result = command(candidate, ['--version']);
    const match = /version (\d+)\.(\d+)/.exec(result.stdout);
    if (result.status === 0 && match && Number(match[1]) * 100 + Number(match[2]) >= 404) return candidate;
  }
  throw new Error('Bash 4.4 or newer is required');
}

const bash = supportedBash();

function fixture(t, attributes = '* text=auto eol=lf\n') {
  const container = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'move-branch-here-543-')));
  const repository = path.join(container, 'repository');
  const destination = path.join(container, 'destination');
  fs.mkdirSync(repository);
  t.after(() => fs.rmSync(container, { recursive: true, force: true }));
  fs.writeFileSync(path.join(repository, '.gitattributes'), attributes);
  fs.writeFileSync(path.join(repository, 'tracked.txt'), 'base\n');
  git(repository, 'init', '-b', 'main');
  git(repository, 'config', 'user.name', 'patinaproject Tests');
  git(repository, 'config', 'user.email', 'tests@patinaproject.com');
  git(repository, 'add', '.gitattributes', 'tracked.txt');
  git(repository, 'commit', '-m', 'chore: #543 fixture base');
  git(repository, 'branch', 'topic');
  git(repository, 'worktree', 'add', '--detach', destination, 'main');
  return { destination, oid: git(repository, 'rev-parse', 'topic').trim(), repository };
}

function run(destination, ...args) {
  return command(bash, [script, ...args], { cwd: destination });
}

function hash(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function snapshot(root) {
  const ref = command('git', ['-C', root, 'symbolic-ref', '-q', 'HEAD']);
  assert.ok([0, 1].includes(ref.status), ref.stderr);
  return {
    head: git(root, 'rev-parse', 'HEAD'),
    index: hash(path.join(git(root, 'rev-parse', '--absolute-git-dir').trim(), 'index')),
    ref: ref.stdout,
    status: git(root, 'status', '--porcelain=v1', '-z'),
    tracked: hash(path.join(root, 'tracked.txt')),
  };
}

test('resolves a free branch under text=auto eol=lf', (t) => {
  const current = fixture(t);

  const result = run(current.destination, 'resolve', 'topic');

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `free\ttopic\t${current.oid}\t0\t\t\n`);
  assert.equal(result.stderr, '');
});

test('resolves a held branch under text=auto eol=lf', (t) => {
  const current = fixture(t);
  git(current.repository, 'switch', 'topic');

  const result = run(current.destination, 'resolve', 'topic');

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `held\ttopic\t${current.oid}\t0\t${current.repository}\t${current.oid}\n`);
  assert.equal(result.stderr, '');
});

test('moves text changes without changing their bytes or status split', (t) => {
  const current = fixture(t);
  git(current.repository, 'switch', 'topic');
  fs.writeFileSync(path.join(current.repository, 'tracked.txt'), 'staged\n');
  git(current.repository, 'add', 'tracked.txt');
  fs.writeFileSync(path.join(current.repository, 'tracked.txt'), 'unstaged\n');
  fs.writeFileSync(path.join(current.repository, 'untracked.txt'), 'untracked\n');
  const before = {
    staged: git(current.repository, 'diff', '--cached', '--name-status'),
    stagedBlob: git(current.repository, 'rev-parse', ':tracked.txt'),
    tracked: hash(path.join(current.repository, 'tracked.txt')),
    unstaged: git(current.repository, 'diff', '--name-status'),
    untracked: git(current.repository, 'ls-files', '--others', '--exclude-standard'),
    untrackedHash: hash(path.join(current.repository, 'untracked.txt')),
  };

  const result = run(current.destination, 'move', 'topic', current.oid, current.repository);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout, `moved\ttopic\t${current.repository}\t${current.oid}\n`);
  assert.equal(result.stderr, 'Transferred "tracked.txt"\nTransferred "untracked.txt"\n');
  assert.deepEqual({
    staged: git(current.destination, 'diff', '--cached', '--name-status'),
    stagedBlob: git(current.destination, 'rev-parse', ':tracked.txt'),
    tracked: hash(path.join(current.destination, 'tracked.txt')),
    unstaged: git(current.destination, 'diff', '--name-status'),
    untracked: git(current.destination, 'ls-files', '--others', '--exclude-standard'),
    untrackedHash: hash(path.join(current.destination, 'untracked.txt')),
  }, before);
  assert.equal(git(current.repository, 'status', '--porcelain=v1'), '');
});

for (const current of [
  { attributes: '*.txt filter=unsafe\n', name: 'filter', value: 'filter' },
  { attributes: '*.txt text eol=lf\n', name: 'text', value: 'text' },
  { attributes: '*.txt text=auto eol=crlf\n', name: 'eol', value: 'eol' },
  { attributes: '*.txt crlf\n', name: 'crlf', value: 'crlf' },
  { attributes: '*.txt crlf=input\n', name: 'crlf=input', value: 'crlf' },
  { attributes: '*.txt working-tree-encoding=UTF-8\n', name: 'working-tree-encoding', value: 'working-tree-encoding' },
  { attributes: '*.txt ident\n', name: 'ident', value: 'ident' },
]) {
  test(`refuses unsupported ${current.name} conversion before either worktree changes`, (t) => {
    const state = fixture(t, current.attributes);
    const before = {
      destination: snapshot(state.destination),
      repository: snapshot(state.repository),
    };

    const result = run(state.destination, 'resolve', 'topic');

    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.equal(result.stderr, `FAIL: conversion attribute ${current.value} is unsupported for "tracked.txt"\n`);
    assert.deepEqual({
      destination: snapshot(state.destination),
      repository: snapshot(state.repository),
    }, before);
  });
}

test('refuses an incoming cached conversion before a free move changes either worktree', (t) => {
  const state = fixture(t);
  git(state.repository, 'switch', 'topic');
  fs.writeFileSync(path.join(state.repository, '.gitattributes'), '*.txt ident\n');
  git(state.repository, 'add', '.gitattributes');
  git(state.repository, 'commit', '-m', 'chore: #543 add unsupported conversion');
  git(state.repository, 'switch', 'main');
  const oid = git(state.repository, 'rev-parse', 'topic').trim();
  const before = {
    destination: snapshot(state.destination),
    repository: snapshot(state.repository),
  };
  const resolved = run(state.destination, 'resolve', 'topic');
  assert.equal(resolved.status, 0, resolved.stderr);
  assert.equal(resolved.stdout, `free\ttopic\t${oid}\t0\t\t\n`);

  const result = run(state.destination, 'move', 'topic', oid);

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'FAIL: conversion attribute ident is unsupported for "tracked.txt"\n');
  assert.deepEqual({
    destination: snapshot(state.destination),
    repository: snapshot(state.repository),
  }, before);
});

test('refuses core.autocrlf conversion before either worktree changes', (t) => {
  const state = fixture(t);
  git(state.repository, 'config', 'core.autocrlf', 'true');
  const before = {
    destination: snapshot(state.destination),
    repository: snapshot(state.repository),
  };

  const result = run(state.destination, 'resolve', 'topic');

  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, 'FAIL: core.autocrlf conversion is unsupported\n');
  assert.deepEqual({
    destination: snapshot(state.destination),
    repository: snapshot(state.repository),
  }, before);
});
