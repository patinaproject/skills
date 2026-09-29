import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

import {
  collectPublishedSkillIds,
  formatErrors,
  parseRegistry,
  validateExecutableReferences,
  validateRegistry,
} from '../validate-skill-dependencies.mjs';

const validator = new URL('../validate-skill-dependencies.mjs', import.meta.url).pathname;
const published = new Set([
  'engineering/alpha',
  'engineering/beta',
  'patinaproject-skills/root',
]);

function registry(skills) {
  return parseRegistry({ version: 1, skills });
}

test('complete registries accept empty and populated dependency lists', () => {
  const value = registry({
    'engineering/alpha': ['engineering/beta'],
    'engineering/beta': [],
    'patinaproject-skills/root': [],
  });
  assert.deepEqual(validateRegistry(published, value), []);
});

test('source parity reports missing and unpublished sources', () => {
  const value = registry({
    'engineering/alpha': [],
    'engineering/beta': [],
    'engineering/extra': [],
  });
  assert.equal(
    formatErrors(validateRegistry(published, value)),
    [
      'FAIL: published skill is missing from registry: patinaproject-skills/root',
      'FAIL: registry source is not published: engineering/extra',
    ].join('\n')
  );
});

test('unavailable targets name both importer and target', () => {
  const value = registry({
    'engineering/alpha': ['engineering/retired'],
    'engineering/beta': [],
    'patinaproject-skills/root': [],
  });
  assert.equal(
    formatErrors(validateRegistry(published, value)),
    'FAIL: published skill dependency is unavailable: engineering/alpha -> engineering/retired'
  );
});

test('duplicate, unsorted, and self dependencies fail deterministically', () => {
  const value = registry({
    'engineering/alpha': [
      'engineering/beta',
      'engineering/alpha',
      'engineering/beta',
    ],
    'engineering/beta': [],
    'patinaproject-skills/root': [],
  });
  assert.equal(
    formatErrors(validateRegistry(published, value)),
    [
      'FAIL: duplicate skill dependency: engineering/alpha -> engineering/beta',
      'FAIL: self dependency is not allowed: engineering/alpha -> engineering/alpha',
      'FAIL: skill dependencies are not sorted: engineering/alpha -> engineering/alpha',
    ].join('\n')
  );
});

for (const [name, value, pattern] of [
  ['non-object registry', [], /registry must be an object/],
  ['wrong schema version', { version: 2, skills: {} }, /version must equal 1/],
  ['malformed source ID', { version: 1, skills: { alpha: [] } }, /malformed source ID: alpha/],
  ['malformed target ID', { version: 1, skills: { 'engineering/alpha': ['other/beta'] } }, /malformed target ID/],
  ['non-array targets', { version: 1, skills: { 'engineering/alpha': 'engineering/beta' } }, /must be an array/],
]) {
  test(`${name} is rejected at the JSON boundary`, () => {
    assert.throws(() => parseRegistry(value), pattern);
  });
}

async function makeCatalog(engineeringNames, bodies = {}) {
  const root = await mkdtemp(path.join(tmpdir(), 'skill-dependencies-'));
  await mkdir(path.join(root, '.claude-plugin'), { recursive: true });
  await mkdir(path.join(root, 'skills', 'root'), { recursive: true });
  await writeFile(
    path.join(root, '.claude-plugin', 'plugin.json'),
    JSON.stringify({ name: 'patinaproject-skills', skills: ['./skills/root'] })
  );
  await writeFile(path.join(root, 'skills', 'root', 'SKILL.md'), '---\nname: root\n---\n');
  for (const name of engineeringNames) {
    const directory = path.join(root, 'plugins', 'engineering', 'skills', name);
    await mkdir(directory, { recursive: true });
    await writeFile(
      path.join(directory, 'SKILL.md'),
      bodies[name] ?? `---\nname: ${name}\n---\n`
    );
  }
  return root;
}

function runCli(repoRoot, registryPath) {
  return spawnSync(
    process.execPath,
    [validator, '--repo-root', repoRoot, '--registry', registryPath],
    { encoding: 'utf8' }
  );
}

test('catalog collection and CLI validate machine configuration fixtures', async () => {
  const root = await makeCatalog(['alpha', 'beta']);
  const registryPath = path.join(root, 'registry.json');
  try {
    assert.deepEqual(
      [...collectPublishedSkillIds(root)].sort(),
      [
        'engineering/alpha',
        'engineering/beta',
        'patinaproject-skills/root',
      ]
    );
    await writeFile(registryPath, JSON.stringify({
      version: 1,
      skills: {
        'engineering/alpha': ['engineering/beta'],
        'engineering/beta': [],
        'patinaproject-skills/root': [],
      },
    }));
    const result = runCli(root, registryPath);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /OK: 3 published skills and 1 dependencies validated/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('CLI reports every graph error in deterministic order', async () => {
  const root = await makeCatalog(['alpha', 'beta']);
  const registryPath = path.join(root, 'registry.json');
  try {
    await writeFile(registryPath, JSON.stringify({
      version: 1,
      skills: {
        'engineering/alpha': [
          'engineering/beta',
          'engineering/alpha',
          'engineering/beta',
          'engineering/retired',
        ],
        'engineering/beta': [],
        'engineering/extra': [],
      },
    }));
    const result = runCli(root, registryPath);
    assert.notEqual(result.status, 0);
    assert.equal(
      result.stderr.trim(),
      [
        'FAIL: duplicate skill dependency: engineering/alpha -> engineering/beta',
        'FAIL: published skill dependency is unavailable: engineering/alpha -> engineering/retired',
        'FAIL: published skill is missing from registry: patinaproject-skills/root',
        'FAIL: registry source is not published: engineering/extra',
        'FAIL: self dependency is not allowed: engineering/alpha -> engineering/alpha',
        'FAIL: skill dependencies are not sorted: engineering/alpha -> engineering/alpha',
      ].join('\n')
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('removing a published target produces a nonzero importer-target diagnostic', async () => {
  const root = await makeCatalog(['alpha']);
  const registryPath = path.join(root, 'registry.json');
  try {
    await writeFile(registryPath, JSON.stringify({
      version: 1,
      skills: {
        'engineering/alpha': ['engineering/beta'],
        'patinaproject-skills/root': [],
      },
    }));
    const result = runCli(root, registryPath);
    assert.notEqual(result.status, 0);
    assert.equal(
      result.stderr.trim(),
      'FAIL: published skill dependency is unavailable: engineering/alpha -> engineering/beta'
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('executable references to unavailable skills name the stale reference and active file', async () => {
  const root = await makeCatalog(['alpha', 'beta'], {
    alpha: [
      '---',
      'name: alpha',
      '---',
      '',
      'Invoke `engineering:polish` before continuing.',
      'Run `node ../polish/scripts/review-state.mjs status`.',
      'The prose word polish and `subagent_type: "engineering:comment-sicko"` are not skill references.',
    ].join('\n'),
    beta: '---\nname: beta\n---\n',
  });
  const registryPath = path.join(root, 'registry.json');
  try {
    await mkdir(path.join(root, 'docs'), { recursive: true });
    await writeFile(
      path.join(root, 'docs', 'CHANGELOG.md'),
      'Historical `engineering:polish` and `../polish/scripts/review-state.mjs` references are allowed.\n'
    );
    await writeFile(registryPath, JSON.stringify({
      version: 1,
      skills: {
        'engineering/alpha': [],
        'engineering/beta': [],
        'patinaproject-skills/root': [],
      },
    }));
    const result = runCli(root, registryPath);
    assert.notEqual(result.status, 0);
    assert.equal(
      result.stderr.trim(),
      [
        'FAIL: executable skill reference is unavailable: ../polish/scripts/review-state.mjs in plugins/engineering/skills/alpha/SKILL.md',
        'FAIL: executable skill reference is unavailable: engineering:polish in plugins/engineering/skills/alpha/SKILL.md',
      ].join('\n')
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('available executable references and ordinary history pass validation', async () => {
  const root = await makeCatalog(['alpha', 'beta'], {
    alpha: [
      '---',
      'name: alpha',
      '---',
      '',
      'Invoke `engineering:beta` before continuing.',
      'Run `node ../beta/scripts/helper.sh`.',
      'The prose word polish is not an executable reference.',
    ].join('\n'),
  });
  try {
    const skillFiles = new Map([
      ['engineering/alpha', path.join(root, 'plugins', 'engineering', 'skills', 'alpha', 'SKILL.md')],
      ['engineering/beta', path.join(root, 'plugins', 'engineering', 'skills', 'beta', 'SKILL.md')],
      ['patinaproject-skills/root', path.join(root, 'skills', 'root', 'SKILL.md')],
    ]);
    assert.deepEqual(
      validateExecutableReferences(new Set(skillFiles.keys()), skillFiles, root),
      []
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
