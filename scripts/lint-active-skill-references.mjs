import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BUILT_IN_AGENTS = new Set(['general-purpose', 'Explore', 'Plan']);
const MANDATE = path.join('plugins', 'engineering', 'hooks', 'session-start-context.md');

function collectEngineeringAgents(repoRoot) {
  return ['agents', 'effort-agents'].flatMap((agentDir) =>
    readdirSync(path.join(repoRoot, 'plugins', 'engineering', agentDir))
      .filter((name) => name.endsWith('.md'))
      .map((name) => name.slice(0, -3)));
}

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
      for (const match of snippet.matchAll(/\b(?:engineering|team|patinaproject-skills):([a-z][a-z0-9]*(?:-[a-z0-9]+)*)(?![a-z0-9<-])/g)) {
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

function placeholderPattern(name) {
  return new RegExp(`^${name.split(/<[a-z]+>/).map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[a-z]+')}$`);
}

function findAgentDispatchErrors(contents, agents, file) {
  const errors = [];
  for (const snippet of executableSnippets(contents)) {
    for (const [, name] of snippet.matchAll(/\b(?:subagent_type|agent_type)\s*:\s*"([^"]+)"/g)) {
      const namespaced = name.match(/^(?:engineering|pstack):(.+)$/);
      if (namespaced) {
        errors.push(`FAIL: agent dispatch uses a namespaced name: ${name} in ${file}; use ${namespaced[1]}`);
        continue;
      }
      if (name.includes(':') || BUILT_IN_AGENTS.has(name)) continue;
      const pattern = placeholderPattern(name);
      if (!agents.some((agent) => pattern.test(agent))) errors.push(`FAIL: agent dispatch names an unavailable agent: ${name} in ${file}`);
    }
  }
  return errors;
}

function findMandateErrors(repoRoot) {
  const contents = readFileSync(path.join(repoRoot, MANDATE), 'utf8');
  return [...contents.matchAll(/`([a-z][a-z0-9]*(?:-[a-z0-9]+)*)`/g)]
    .filter(([, name]) => !existsSync(path.join(repoRoot, 'plugins', 'engineering', 'skills', name, 'SKILL.md')))
    .map(([, name]) => `FAIL: session-start mandate names an unavailable skill: ${name} in ${MANDATE}`);
}

// A prefixed name resolves only in a plugin install; an Agent Skills install
// registers bare names.
function findPluginPrefixErrors(contents, file) {
  return [...contents.matchAll(/(?<![\w-])(\/?)(?:team|patinaproject-skills):([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g)]
    .map(([reference, slash, skill]) => `FAIL: skill reference carries a plugin prefix: ${reference} in ${file}; use ${slash}${skill}`);
}

function collectMirrorDirs(repoRoot) {
  const manifest = JSON.parse(readFileSync(path.join(repoRoot, 'upstream-skills.json'), 'utf8'));
  return manifest.sources
    .flatMap((source) => source.targets)
    .filter((target) => target.kind === 'skill')
    .map((target) => path.join(repoRoot, target.destination));
}

function collectActiveSkillMarkdown(repoRoot, plugin, mirrors) {
  return collectMarkdownFiles(path.join(repoRoot, 'plugins', plugin, 'skills'))
    .filter((filePath) => !mirrors.some((mirror) => filePath.startsWith(mirror + path.sep)));
}

function collectMarkdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return collectMarkdownFiles(entryPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [entryPath] : [];
  });
}

function stripCode(contents) {
  return contents.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (block) => block.replace(/[^\n]/g, '')).replace(/`[^`\n]*`/g, '');
}

function relativeLinkTargets(line) {
  const targets = [
    ...[...line.matchAll(/\]\(\s*<?([^)\s>]+)/g)].map((match) => match[1]),
    ...[...line.matchAll(/^\s{0,3}\[[^\]\n]+\]:\s*<?(\S+?)>?(?:\s|$)/g)].map((match) => match[1]),
  ];
  return targets
    .filter((target) => !/^(?:[a-z][a-z0-9+.-]*:|#|\/|\{|\$)/i.test(target))
    .map((target) => ({ target, resolved: decodeURI(target.split(/[?#]/, 1)[0]) }))
    .filter(({ resolved }) => resolved !== '');
}

// Plugins install into separate directories, so a link must stay inside its
// own plugin and point at a file that exists. Vendored skill mirrors are
// excluded because the sync owns their text.
function lintRelativeLinks(repoRoot) {
  const mirrors = collectMirrorDirs(repoRoot);
  const errors = [];
  for (const plugin of ['engineering', 'team']) {
    const pluginRoot = path.join(repoRoot, 'plugins', plugin);
    for (const filePath of collectActiveSkillMarkdown(repoRoot, plugin, mirrors)) {
      const file = path.relative(repoRoot, filePath);
      const raw = readFileSync(filePath, 'utf8').split('\n');
      const prose = stripCode(raw.join('\n')).split('\n');
      for (const [index, line] of raw.entries()) {
        const named = [...line.matchAll(/\b(engineering|team):([a-z][a-z0-9]*(?:-[a-z0-9]+)*)/g)];
        for (const { target, resolved } of relativeLinkTargets(prose[index] ?? '')) {
          const absolute = path.resolve(path.dirname(filePath), resolved);
          if (absolute !== pluginRoot && !absolute.startsWith(pluginRoot + path.sep)) {
            errors.push(`FAIL: relative link leaves the ${plugin} plugin: ${target} in ${file}:${index + 1}`);
            continue;
          }
          if (!existsSync(absolute)) {
            errors.push(`FAIL: relative link target does not exist: ${target} in ${file}:${index + 1}`);
            continue;
          }
          const [, linkedSkill] = path.relative(path.join(pluginRoot, 'skills'), absolute).match(/^([^/]+)/) ?? [];
          for (const [, namespace, skill] of named) {
            if (namespace !== plugin && skill === linkedSkill) {
              errors.push(`FAIL: relative link ${target} resolves to ${plugin}:${skill} but ${file}:${index + 1} names ${namespace}:${skill}; name the skill without a link`);
            }
          }
        }
      }
    }
  }
  return errors;
}

function main(repoRoot = process.cwd()) {
  const published = collectPublishedSkillFiles(repoRoot);
  const agents = collectEngineeringAgents(repoRoot);
  const errors = [...lintRelativeLinks(repoRoot), ...findMandateErrors(repoRoot)];
  const mirrors = collectMirrorDirs(repoRoot);
  const activeMarkdown = ['engineering', 'team'].flatMap((plugin) => collectActiveSkillMarkdown(repoRoot, plugin, mirrors));
  for (const filePath of activeMarkdown) {
    errors.push(...findPluginPrefixErrors(readFileSync(filePath, 'utf8'), path.relative(repoRoot, filePath)));
  }
  const lintTargets = [...new Set([...published.values(), ...activeMarkdown])].sort();
  for (const filePath of lintTargets) {
    const file = path.relative(repoRoot, filePath);
    const contents = readFileSync(filePath, 'utf8');
    const plugin = file.split(path.sep)[1];
    errors.push(...findAgentDispatchErrors(contents, agents, file));
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
  console.info(`OK: ${lintTargets.length} active skill files contain only published executable references and in-plugin links`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
