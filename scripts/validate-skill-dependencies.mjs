import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SKILL_ID = /^(patinaproject-skills|engineering)\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

class RegistryParseError extends Error {
  constructor(errors) {
    super(`invalid skill dependency registry:\n${errors.map((error) => `  ${error}`).join('\n')}`);
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readJson(file) {
  try {
    return JSON.parse(readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`cannot read JSON ${file}: ${error.message}`);
  }
}

export function collectPublishedSkillFiles(repoRoot) {
  const published = new Map();
  const manifestPath = path.join(repoRoot, '.claude-plugin', 'plugin.json');
  const manifest = readJson(manifestPath);
  if (!isObject(manifest) || !Array.isArray(manifest.skills)) {
    throw new Error(`invalid root skill catalog: ${manifestPath}`);
  }

  for (const skillPath of manifest.skills) {
    const match = typeof skillPath === 'string'
      ? /^\.\/skills\/([a-z][a-z0-9]*(?:-[a-z0-9]+)*)$/.exec(skillPath)
      : null;
    if (!match) {
      throw new Error(`invalid root skill catalog path: ${String(skillPath)}`);
    }
    const skillFile = path.join(repoRoot, skillPath, 'SKILL.md');
    if (!existsSync(skillFile)) {
      throw new Error(`published root skill is missing SKILL.md: patinaproject-skills/${match[1]}`);
    }
    const id = `patinaproject-skills/${match[1]}`;
    if (published.has(id)) {
      throw new Error(`duplicate published skill: ${id}`);
    }
    published.set(id, skillFile);
  }

  const engineeringRoot = path.join(repoRoot, 'plugins', 'engineering', 'skills');
  const entries = readdirSync(engineeringRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const id = `engineering/${entry.name}`;
    if (!SKILL_ID.test(id)) {
      throw new Error(`invalid Engineering skill directory: ${entry.name}`);
    }
    if (!existsSync(path.join(engineeringRoot, entry.name, 'SKILL.md'))) {
      throw new Error(`published Engineering skill is missing SKILL.md: ${id}`);
    }
    published.set(id, path.join(engineeringRoot, entry.name, 'SKILL.md'));
  }

  return published;
}

export function collectPublishedSkillIds(repoRoot) {
  return new Set(collectPublishedSkillFiles(repoRoot).keys());
}

export function parseRegistry(json) {
  const errors = [];
  if (!isObject(json)) {
    throw new RegistryParseError(['registry must be an object']);
  }

  const fields = Object.keys(json).sort();
  for (const field of fields) {
    if (field !== 'skills' && field !== 'version') {
      errors.push(`unexpected field: ${field}`);
    }
  }
  if (json.version !== 1) {
    errors.push('version must equal 1');
  }
  if (!isObject(json.skills)) {
    errors.push('skills must be an object');
  } else {
    for (const [source, targets] of Object.entries(json.skills).sort(([left], [right]) => left.localeCompare(right))) {
      if (!SKILL_ID.test(source)) {
        errors.push(`malformed source ID: ${source}`);
      }
      if (!Array.isArray(targets)) {
        errors.push(`dependencies for ${source} must be an array`);
        continue;
      }
      for (const [index, target] of targets.entries()) {
        if (typeof target !== 'string' || !SKILL_ID.test(target)) {
          errors.push(`malformed target ID for ${source} at index ${index}: ${String(target)}`);
        }
      }
    }
  }

  if (errors.length > 0) {
    throw new RegistryParseError(errors.sort());
  }
  return json;
}

function errorMessage(error) {
  switch (error.kind) {
    case 'duplicate-target':
      return `duplicate skill dependency: ${error.source} -> ${error.target}`;
    case 'extra-source':
      return `registry source is not published: ${error.source}`;
    case 'missing-source':
      return `published skill is missing from registry: ${error.source}`;
    case 'self-dependency':
      return `self dependency is not allowed: ${error.source} -> ${error.source}`;
    case 'unsorted-target':
      return `skill dependencies are not sorted: ${error.source} -> ${error.target}`;
    case 'unpublished-target':
      return `published skill dependency is unavailable: ${error.source} -> ${error.target}`;
    case 'unpublished-executable-reference':
      return `executable skill reference is unavailable: ${error.reference} in ${error.file}`;
    default:
      throw new Error(`unknown validation error: ${error.kind}`);
  }
}

function executableSnippets(contents) {
  const snippets = [];
  for (const match of contents.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    snippets.push(match[1]);
  }
  for (const match of contents.matchAll(/`([^`\n]+)`/g)) {
    snippets.push(match[1]);
  }
  return snippets;
}

export function findExecutableSkillReferences(contents) {
  const references = [];
  for (const snippet of executableSnippets(contents)) {
    for (const match of snippet.matchAll(/\b(?:engineering|patinaproject-skills):([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g)) {
      if (/\bsubagent_type\s*:/i.test(snippet)) {
        continue;
      }
      references.push({
        reference: match[0],
        target: `${match[0].split(':', 1)[0]}/${match[1]}`,
      });
    }
    for (const match of snippet.matchAll(/\.\.\/[a-z][a-z0-9]*(?:-[a-z0-9]+)*\/scripts\/[^\s`]+/g)) {
      const skillName = match[0].split('/')[1];
      references.push({
        reference: match[0],
        target: `engineering/${skillName}`,
      });
    }
  }
  return references;
}

export function validateExecutableReferences(published, skillFiles, repoRoot = process.cwd()) {
  const errors = [];
  for (const [source, filePath] of [...skillFiles.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const file = path.relative(repoRoot, filePath);
    const contents = readFileSync(filePath, 'utf8');
    for (const reference of findExecutableSkillReferences(contents)) {
      if (!published.has(reference.target)) {
        errors.push({
          kind: 'unpublished-executable-reference',
          source,
          file,
          reference: reference.reference,
          target: reference.target,
        });
      }
    }
  }
  return errors.sort((left, right) => errorMessage(left).localeCompare(errorMessage(right)));
}

export function validateRegistry(published, registry) {
  const errors = [];
  const sources = Object.keys(registry.skills);

  for (const source of [...published].sort()) {
    if (!Object.hasOwn(registry.skills, source)) {
      errors.push({ kind: 'missing-source', source });
    }
  }
  for (const source of sources.sort()) {
    if (!published.has(source)) {
      errors.push({ kind: 'extra-source', source });
    }
    const seen = new Set();
    const targets = registry.skills[source];
    for (const [index, target] of targets.entries()) {
      if (seen.has(target)) {
        errors.push({ kind: 'duplicate-target', source, target });
      }
      seen.add(target);
      if (target === source) {
        errors.push({ kind: 'self-dependency', source });
      }
      if (!published.has(target)) {
        errors.push({ kind: 'unpublished-target', source, target });
      }
      if (index > 0 && targets[index - 1].localeCompare(target) > 0) {
        errors.push({ kind: 'unsorted-target', source, target });
      }
    }
  }

  return errors.sort((left, right) => errorMessage(left).localeCompare(errorMessage(right)));
}

export function formatErrors(errors) {
  return errors.map((error) => `FAIL: ${errorMessage(error)}`).join('\n');
}

function parseArguments(argv) {
  const options = { repoRoot: process.cwd(), registry: null };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument !== '--repo-root' && argument !== '--registry') {
      throw new Error(`unknown argument: ${argument}`);
    }
    const value = argv[index + 1];
    if (!value) {
      throw new Error(`missing value for ${argument}`);
    }
    if (argument === '--repo-root') options.repoRoot = path.resolve(value);
    if (argument === '--registry') options.registry = path.resolve(value);
    index += 1;
  }
  options.registry ??= path.join(options.repoRoot, 'config', 'skill-dependencies.json');
  return options;
}

export async function main(argv) {
  const options = parseArguments(argv);
  const skillFiles = collectPublishedSkillFiles(options.repoRoot);
  const published = new Set(skillFiles.keys());
  const registry = parseRegistry(readJson(options.registry));
  const errors = [
    ...validateRegistry(published, registry),
    ...validateExecutableReferences(published, skillFiles, options.repoRoot),
  ];
  if (errors.length > 0) {
    throw new Error(formatErrors(errors));
  }
  console.info(`OK: ${published.size} published skills and ${Object.values(registry.skills).flat().length} dependencies validated`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
