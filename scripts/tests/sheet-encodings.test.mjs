import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { decodeSheet, readSheet } from '../../plugins/engineering/pi/sheet.ts';

const repoRoot = new URL('../..', import.meta.url).pathname;
const pluginRoot = join(repoRoot, 'plugins/engineering');
const readSheetScript = join(pluginRoot, 'skills/setup-pstack/scripts/read-sheet.sh');
const claudeHook = join(pluginRoot, 'hooks/session-start.sh');
const powershellHook = join(pluginRoot, 'hooks/session-start.ps1');
const assetsHook = join(pluginRoot, 'skills/setup-engineering/assets/hooks/session-start.sh');

const lines = [
  'session hook: off',
  'feature, refactoring: sonnet',
  'judgment and prose: opus @high',
  'pi models: opus=anthropic/claude-opus-5-5',
  'note: café',
];
const utf16le = (text) => Buffer.from(text, 'utf16le');
const fixtures = {
  'utf8 lf': Buffer.from(`${lines.join('\n')}\n`, 'utf8'),
  'utf16le with BOM crlf': Buffer.concat([Buffer.from([0xff, 0xfe]), utf16le(`${lines.join('\r\n')}\r\n`)]),
  'utf16le without BOM lf': utf16le(`${lines.join('\n')}\n`),
  'utf16le without BOM crlf': utf16le(`${lines.join('\r\n')}\r\n`),
  'latin1 lf': Buffer.from(`${lines.join('\n')}\n`, 'latin1'),
};
const oddUtf16 = Buffer.concat([fixtures['utf16le without BOM lf'], Buffer.from([0x0a])]);

const sheetDir = (bytes) => {
  const dir = mkdtempSync(join(tmpdir(), 'sheet-encodings-'));
  writeFileSync(join(dir, 'pstack-models.md'), bytes);
  return dir;
};
const run = (command, args, env) => spawnSync(command, args, {
  cwd: repoRoot,
  encoding: 'utf8',
  env: { ...process.env, LANG: 'en_US.UTF-8', LC_ALL: 'en_US.UTF-8', CLAUDE_PLUGIN_ROOT: pluginRoot, ...env },
});
const toLines = (text) => text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line, i, all) => i < all.length - 1 || line !== '');

test('the setup-engineering copy of the hook is byte-identical to the plugin hook', () => {
  assert.deepEqual(readFileSync(assetsHook), readFileSync(claudeHook));
});

for (const [name, bytes] of Object.entries(fixtures)) {
  test(`every decoder reads a ${name} sheet the same way`, () => {
    const dir = sheetDir(bytes);

    const script = run('sh', [readSheetScript, join(dir, 'pstack-models.md')]);
    assert.equal(script.status, 0, script.stderr);
    assert.deepEqual(toLines(script.stdout), lines);

    assert.deepEqual(toLines(decodeSheet(bytes)), lines);

    const sheet = readSheet(dir);
    assert.equal(sheet?.hookOff, true);
    assert.deepEqual([...(sheet?.piModels ?? [])], [['opus', 'anthropic/claude-opus-5-5']]);

    const claude = run('sh', [claudeHook, 'claude'], { CLAUDE_CONFIG_DIR: dir, CLAUDE_PROJECT_DIR: dir });
    assert.equal(claude.stdout, '');
    assert.equal(claude.status, 0, claude.stderr);
    const codex = run('sh', [claudeHook, 'codex'], { CODEX_HOME: dir });
    assert.equal(codex.stdout, '');
    assert.equal(codex.status, 0, codex.stderr);
  });
}

test('a UTF-16LE sheet of odd length is unreadable, so the hook stays on', () => {
  const dir = sheetDir(oddUtf16);
  assert.notEqual(run('sh', [readSheetScript, join(dir, 'pstack-models.md')]).status, 0);
  assert.equal(readSheet(dir), undefined);
  const claude = run('sh', [claudeHook, 'claude'], { CLAUDE_CONFIG_DIR: dir, CLAUDE_PROJECT_DIR: dir });
  assert.notEqual(claude.stdout, '');
});

const hasPwsh = spawnSync('pwsh', ['-NoProfile', '-Command', 'exit 0']).status === 0;
for (const [name, bytes] of Object.entries(fixtures)) {
  test(`the PowerShell hook reads a ${name} sheet`, { skip: hasPwsh ? false : 'pwsh is not installed' }, () => {
    const dir = sheetDir(bytes);
    const result = run('pwsh', ['-NoProfile', '-File', powershellHook], { CODEX_HOME: dir });
    assert.equal(result.stdout, '');
    assert.equal(result.status, 0, result.stderr);
  });
}
