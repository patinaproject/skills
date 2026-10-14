import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function collectPublishedSkillFiles(repoRoot) {
  const published = new Map();
  for (const plugin of ['engineering', 'team']) {
    const skillsRoot = path.join(repoRoot, 'plugins', plugin, 'skills');
    for (const entry of readdirSync(skillsRoot, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        published.set(`${plugin}/${entry.name}`, path.join(skillsRoot, entry.name, 'SKILL.md'));
      }
    }
  }

  for (const agentDir of ['agents', 'effort-agents']) {
    const agentRoot = path.join(repoRoot, 'plugins', 'engineering', agentDir);
    for (const entry of readdirSync(agentRoot, { withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith('.md')) published.set(`engineering/${entry.name.slice(0, -3)}`, path.join(agentRoot, entry.name));
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

function findExecutableSkillReferences(contents, plugin) {
  const references = [];
  for (const snippet of executableSnippets(contents)) {
    if (!/\bsubagent_type\s*:/i.test(snippet)) {
      for (const match of snippet.matchAll(/\b(?:engineering|team|patinaproject-skills):([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g)) {
        const reference = match[0];
        references.push({ reference, target: `${reference.split(':', 1)[0]}/${match[1]}` });
      }

      for (const match of snippet.matchAll(/\.\.\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*\/scripts\/[^\s`]+/g)) {
        const reference = match[0];
        references.push({ reference, target: `${plugin}/${reference.split('/')[1]}` });
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
    const plugin = file.split(path.sep)[1];
    for (const { reference, target } of findExecutableSkillReferences(contents, plugin)) {
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
