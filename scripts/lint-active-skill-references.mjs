import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function collectPublishedSkillFiles(repoRoot) {
  const published = new Map();
  const manifest = readJson(path.join(repoRoot, '.claude-plugin', 'plugin.json'));

  for (const skillPath of manifest.skills) {
    const match = /^\.\/skills\/([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/.exec(skillPath);
    if (!match) continue;
    const file = path.join(repoRoot, skillPath, 'SKILL.md');
    if (existsSync(file)) published.set(`patinaproject-skills/${match[1]}`, file);
  }

  const engineeringRoot = path.join(repoRoot, 'plugins', 'engineering', 'skills');
  for (const entry of readdirSync(engineeringRoot, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      published.set(`engineering/${entry.name}`, path.join(engineeringRoot, entry.name, 'SKILL.md'));
    }
  }

  return published;
}

function executableSnippets(contents) {
  return [
    ...[...contents.matchAll(/```[^\n]*\n([\s\S]*?)```/g)].map((match) => match[1]),
    ...[...contents.matchAll(/`([^`\n]+)`/g)].map((match) => match[1]),
  ];
}

function findExecutableSkillReferences(contents, published) {
  const references = [];
  for (const snippet of executableSnippets(contents)) {
    if (!/\bsubagent_type\s*:/i.test(snippet)) {
      for (const match of snippet.matchAll(/\b(?:engineering|patinaproject-skills):([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g)) {
        const reference = match[0];
        references.push({ reference, target: `${reference.split(':', 1)[0]}/${match[1]}` });
      }

      for (const match of snippet.matchAll(/\.\.\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*\/scripts\/[^\s`]+/g)) {
        const reference = match[0];
        references.push({ reference, target: `engineering/${reference.split('/')[1]}` });
      }
    }

  }
  return references;
}

function main(repoRoot = process.cwd()) {
  const published = collectPublishedSkillFiles(repoRoot);
  const errors = [];
  for (const filePath of [...published.values()].sort()) {
    const file = path.relative(repoRoot, filePath);
    const contents = readFileSync(filePath, 'utf8');
    for (const { reference, target } of findExecutableSkillReferences(contents, published)) {
      if (!published.has(target)) {
        errors.push(`FAIL: executable skill reference is unavailable: ${reference} in ${file}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error([...new Set(errors)].sort().join('\n'));
    process.exitCode = 1;
    return;
  }
  console.info(`OK: ${published.size} active skill files contain only published executable references`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
