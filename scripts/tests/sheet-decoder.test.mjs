import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

const repoRoot = new URL('../..', import.meta.url).pathname;
const plugin = join(repoRoot, 'plugins/engineering');
const readSheetSh = join(plugin, 'skills/setup-pstack/scripts/read-sheet.sh');
const pluginHook = join(plugin, 'hooks/session-start.sh');
const powershellHook = join(plugin, 'hooks/session-start.ps1');
const { decodeSheet, readSheet } = await import(join(plugin, 'pi/sheet.ts'));

const BODY = [
  'session hook: off',
  '# pstack model configuration',
  '',
  'feature, refactoring: sonnet',
  'judgment and prose: opus @high',
  'pi models: opus=anthropic/claude-opus-5-5, sonnet=anthropic/claude-sonnet-5',
  'note: café ünïcode',
];

const EXPECTED = {
  'session hook': 'off',
  'feature, refactoring': 'sonnet',
  'judgment and prose': 'opus @high',
  'pi models': 'opus=anthropic/claude-opus-5-5, sonnet=anthropic/claude-sonnet-5',
  note: 'café ünïcode',
};

const EXPECTED_PI_MODELS = [
  ['opus', 'anthropic/claude-opus-5-5'],
  ['sonnet', 'anthropic/claude-sonnet-5'],
];

const utf8 = (text) => Buffer.from(text, 'utf8');
const lf = BODY.join('\n') + '\n';
const crlf = BODY.join('\r\n') + '\r\n';
const FIXTURES = {
  'utf8 lf': utf8(lf),
  'utf8 bom': Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), utf8(lf)]),
  'utf8 crlf': utf8(crlf),
  'utf8 bom crlf': Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), utf8(crlf)]),
  'utf16le bom crlf': Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(crlf, 'utf16le')]),
  'utf16le bom lf': Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(lf, 'utf16le')]),
};

function roleMap(text) {
  const map = {};
  for (const line of text.split('\n')) {
    if (line === '' || line.startsWith('#')) continue;
    const at = line.indexOf(': ');
    assert.ok(at > 0, `line is not "key: value": ${JSON.stringify(line)}`);
    const key = line.slice(0, at);
    assert.ok(!(key in map), `duplicate key ${key}`);
    map[key] = line.slice(at + 2);
  }
  return map;
}

const scratch = mkdtempSync(join(tmpdir(), 'sheet-decoder-'));
test.after(() => rmSync(scratch, { recursive: true, force: true }));

function run(command, args, env = {}, unset = []) {
  const childEnv = { ...process.env, ...env };
  for (const name of unset) delete childEnv[name];
  const result = spawnSync(command, args, { encoding: 'utf8', env: childEnv });
  assert.equal(result.status, 0, `${command} ${args.join(' ')} failed: ${result.stderr}`);
  return result.stdout;
}

function writeSheet(name, bytes) {
  const dir = join(scratch, 'sheets', name.replaceAll(' ', '-'));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'pstack-models.md'), bytes);
  return dir;
}

const emptyDir = join(scratch, 'no-sheet');
mkdirSync(emptyDir);
const mandate = run(pluginHook, ['claude'], { CLAUDE_PLUGIN_ROOT: plugin, CLAUDE_CONFIG_DIR: emptyDir });
assert.notEqual(mandate, '', 'a missing sheet must leave the mandate on');

const projectRepo = join(scratch, 'project');
const catalog = join(scratch, 'catalog');
mkdirSync(catalog);
cpSync(join(plugin, 'skills'), join(catalog, 'skills'), { recursive: true });
run('bash', [join(catalog, 'skills/setup-engineering/scripts/install-machinery.sh'), '--repo', projectRepo]);
rmSync(catalog, { recursive: true, force: true });
const projectHook = join(projectRepo, '.claude/hooks/session-start.sh');
assert.notEqual(run(projectHook, ['claude'], { CLAUDE_PROJECT_DIR: projectRepo, CLAUDE_CONFIG_DIR: emptyDir }, ['CLAUDE_PLUGIN_ROOT']), '', 'the installed hook must inject the mandate without a sheet');

const pwsh = spawnSync('pwsh', ['-NoProfile', '-Command', '$PSVersionTable.PSVersion.Major'], { encoding: 'utf8' }).status === 0;

for (const [name, bytes] of Object.entries(FIXTURES)) {
  test(`every decoder reads the ${name} sheet as one role map`, () => {
    const dir = writeSheet(name, bytes);
    const file = join(dir, 'pstack-models.md');

    assert.deepEqual(roleMap(run('sh', [readSheetSh, file])), EXPECTED, 'read-sheet.sh');
    assert.deepEqual(roleMap(decodeSheet(bytes)), EXPECTED, 'pi decodeSheet');

    const sheet = readSheet(dir);
    assert.deepEqual(roleMap(sheet.text), EXPECTED, 'pi readSheet text');
    assert.equal(sheet.hookOff, true, 'pi hookOff');
    assert.deepEqual([...sheet.piModels], EXPECTED_PI_MODELS, 'pi piModels');

    const quiet = (output, hook) => assert.equal(output, '', `${hook} still injected the mandate`);
    quiet(run(pluginHook, ['claude'], { CLAUDE_PLUGIN_ROOT: plugin, CLAUDE_CONFIG_DIR: dir }), 'plugin claude hook');
    quiet(run(pluginHook, ['codex'], { CLAUDE_PLUGIN_ROOT: plugin, CODEX_HOME: dir }), 'plugin codex hook');
    quiet(run(pluginHook, ['codex'], { CODEX_HOME: dir }, ['CLAUDE_PLUGIN_ROOT']), 'plugin codex hook without CLAUDE_PLUGIN_ROOT');
    quiet(run(projectHook, ['claude'], { CLAUDE_PROJECT_DIR: projectRepo, CLAUDE_CONFIG_DIR: dir }, ['CLAUDE_PLUGIN_ROOT']), 'project-level hook');
  });

  test(`the powershell hook reads the ${name} sheet`, { skip: pwsh ? false : 'pwsh is not installed' }, () => {
    const dir = writeSheet(name, bytes);
    assert.equal(run('pwsh', ['-NoProfile', '-File', powershellHook], { CODEX_HOME: dir }), '', 'powershell hook still injected the mandate');
  });
}

const CARRIAGE_RETURNS = {
  'two carriage returns before a newline': { bytes: utf8('session hook: off\r\r\nx\n'), off: false },
  'a carriage return without a trailing newline': { bytes: utf8('session hook: off\r'), off: true },
};

for (const [name, { bytes, off }] of Object.entries(CARRIAGE_RETURNS)) {
  test(`every decoder agrees on session hook for ${name}`, () => {
    const dir = writeSheet(name, bytes);
    const file = join(dir, 'pstack-models.md');

    const shellOff = run('sh', [readSheetSh, file]).split('\n').includes('session hook: off');
    assert.equal(shellOff, off, 'read-sheet.sh');
    assert.equal(decodeSheet(bytes).split('\n').includes('session hook: off'), off, 'pi decodeSheet');
    assert.equal(readSheet(dir).hookOff, off, 'pi hookOff');

    const hookOutput = run(pluginHook, ['claude'], { CLAUDE_PLUGIN_ROOT: plugin, CLAUDE_CONFIG_DIR: dir });
    assert.equal(hookOutput === '', off, 'plugin hook');
  });
}

test('a hook without its decoder names the missing file and keeps the mandate on', () => {
  const lonely = join(scratch, 'lonely-hook');
  mkdirSync(lonely);
  cpSync(pluginHook, join(lonely, 'session-start.sh'));
  cpSync(join(plugin, 'hooks/session-start-context.md'), join(lonely, 'session-start-context.md'));
  const env = { ...process.env, CLAUDE_CONFIG_DIR: emptyDir };
  delete env.CLAUDE_PLUGIN_ROOT;
  const result = spawnSync('sh', [join(lonely, 'session-start.sh'), 'claude'], { encoding: 'utf8', env });
  assert.equal(result.status, 0);
  assert.notEqual(result.stdout, '');
  assert.match(result.stderr, /missing .*read-sheet\.sh.*setup-engineering/);
});
