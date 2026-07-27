#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const referencePattern = /\bPAT-[1-9]\d*\b/g;
const hasReferencePattern = /\bPAT-[1-9]\d*\b/;

export function collectReferences(texts) {
  const references = new Set();
  for (const text of texts) {
    for (const match of text.matchAll(referencePattern)) {
      references.add(match[0]);
    }
  }
  return [...references].sort(compareReferences);
}

export function compareReferences(left, right) {
  return Number(left.slice(4)) - Number(right.slice(4));
}

export function rewriteText(text, mappings) {
  return Object.entries(mappings)
    .sort(([left], [right]) => compareReferences(right, left))
    .reduce(
      (rewritten, [reference, mapping]) =>
        rewritten.replaceAll(reference, mapping.replacement),
      text
    );
}

export function validateMapping(references, mappings) {
  const mapped = new Set(Object.keys(mappings));
  const missing = references.filter((reference) => !mapped.has(reference));
  const extra = [...mapped].filter(
    (reference) => !references.includes(reference)
  );

  for (const [reference, mapping] of Object.entries(mappings)) {
    if (!['issue', 'pull_request', 'text'].includes(mapping.kind)) {
      throw new Error(`${reference} has unsupported kind ${mapping.kind}`);
    }
    if (
      typeof mapping.replacement !== 'string' ||
      mapping.replacement.length === 0
    ) {
      throw new Error(`${reference} has no replacement`);
    }
    if (
      mapping.kind !== 'text' &&
      !/^#[1-9]\d*$/.test(mapping.replacement)
    ) {
      throw new Error(
        `${reference} must resolve to a #N reference or explicit text`
      );
    }
  }

  if (missing.length > 0 || extra.length > 0) {
    throw new Error(
      `mapping mismatch; missing=[${missing.join(', ')}] extra=[${extra.join(', ')}]`
    );
  }
}

export function validateInventory(inventory) {
  const writableNamespaces = inventory.refScope?.rewritable ?? [];
  const immutableNamespaces = inventory.refScope?.immutable ?? [];
  if (
    writableNamespaces.join('\n') !== 'refs/heads/*\nrefs/tags/*' ||
    immutableNamespaces.join('\n') !== 'refs/pull/*'
  ) {
    throw new Error('inventory has an unsupported ref scope');
  }

  const writableCommits = [];
  const immutableCommits = [];
  for (const [reference, entry] of Object.entries(inventory.references ?? {})) {
    for (const field of [
      'writableCommitMessages',
      'immutablePullCommitMessages',
      'mergedPullRequests',
    ]) {
      if (!Array.isArray(entry[field])) {
        throw new Error(`${reference}.${field} must be an array`);
      }
    }
    writableCommits.push(...entry.writableCommitMessages);
    immutableCommits.push(...entry.immutablePullCommitMessages);
  }

  const allCommits = [...writableCommits, ...immutableCommits];
  if (
    allCommits.some((commit) => !/^[0-9a-f]{40}$/.test(commit)) ||
    new Set(allCommits).size !== allCommits.length
  ) {
    throw new Error('commit inventory contains an invalid or duplicate SHA');
  }

  const immutable = inventory.immutablePullRefs ?? {};
  if (
    !Number.isInteger(immutable.observedRefCount) ||
    immutable.observedRefCount < 1 ||
    !Number.isInteger(immutable.observedPullOnlyCommitCount) ||
    immutable.observedPullOnlyCommitCount < immutableCommits.length ||
    immutable.referencedCommitCount !== immutableCommits.length
  ) {
    throw new Error('immutable pull reference inventory mismatch');
  }
}

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function git(repository, args) {
  return run('git', ['-C', repository, ...args]).trim();
}

function loadMappings(path) {
  return JSON.parse(readFileSync(path, 'utf8')).mappings;
}

function immutablePullInventory(gitRepository) {
  const refs = git(gitRepository, [
    'for-each-ref',
    '--format=%(refname)',
    'refs/pull',
  ])
    .split('\n')
    .filter(Boolean);
  const pullOnlyCommits = git(gitRepository, [
    'rev-list',
    '--all',
    '--not',
    '--branches',
    '--tags',
  ])
    .split('\n')
    .filter(Boolean);
  const references = {};

  if (pullOnlyCommits.length > 0) {
    const records = run('git', [
      '-C',
      gitRepository,
      'log',
      '--no-walk=unsorted',
      '--format=%H%x09%B%x00',
      ...pullOnlyCommits,
    ]);
    for (const rawRecord of records.split('\0')) {
      const record = rawRecord.trimStart();
      if (record.length === 0) {
        continue;
      }
      const separator = record.indexOf('\t');
      const commit = record.slice(0, separator);
      const message = record.slice(separator + 1);
      for (const reference of new Set(message.match(referencePattern) ?? [])) {
        references[reference] ??= [];
        references[reference].push(commit);
      }
    }
  }

  for (const commits of Object.values(references)) {
    commits.sort();
  }

  return {
    refCount: refs.length,
    pullOnlyCommitCount: pullOnlyCommits.length,
    referencedCommitCount: Object.values(references).flat().length,
    references,
  };
}

export function validateLivePullInventory(live, inventory) {
  const expectedReferences = Object.fromEntries(
    Object.entries(inventory.references)
      .filter(([, entry]) => entry.immutablePullCommitMessages.length > 0)
      .map(([reference, entry]) => [
        reference,
        [...entry.immutablePullCommitMessages].sort(),
      ])
      .sort(([left], [right]) => compareReferences(left, right))
  );
  const liveReferences = Object.fromEntries(
    Object.entries(live.references).sort(([left], [right]) =>
      compareReferences(left, right)
    )
  );
  if (
    live.refCount !== inventory.immutablePullRefs.observedRefCount ||
    live.pullOnlyCommitCount !==
      inventory.immutablePullRefs.observedPullOnlyCommitCount ||
    live.referencedCommitCount !==
      inventory.immutablePullRefs.referencedCommitCount ||
    JSON.stringify(liveReferences) !== JSON.stringify(expectedReferences)
  ) {
    throw new Error('live immutable pull reference inventory changed');
  }
}

function liveInventory(
  repositoryName,
  gitRepository = '.',
  includeImmutable = false
) {
  const commitMessages = git(gitRepository, [
    'log',
    '--branches',
    '--tags',
    '--format=%B',
  ]);
  const pullRequests = JSON.parse(
    run('gh', [
      'pr',
      'list',
      '--repo',
      repositoryName,
      '--state',
      'merged',
      '--limit',
      '1000',
      '--json',
      'number,title,body,url',
    ])
  );
  const pullRequestText = pullRequests.flatMap((pullRequest) => [
    pullRequest.title,
    pullRequest.body ?? '',
  ]);

  return {
    references: collectReferences([commitMessages, ...pullRequestText]),
    pullRequests,
    immutablePullRefs: includeImmutable
      ? immutablePullInventory(gitRepository)
      : undefined,
  };
}

function check(mappingPath, inventoryPath, live, gitRepository) {
  const mappingDocument = JSON.parse(readFileSync(mappingPath, 'utf8'));
  const mappings = mappingDocument.mappings;
  const inventory = JSON.parse(readFileSync(inventoryPath, 'utf8'));
  validateInventory(inventory);
  const liveState = live
    ? liveInventory(mappingDocument.repository, gitRepository, true)
    : undefined;
  const references = live
    ? liveState.references
    : Object.keys(inventory.references).sort(compareReferences);

  validateMapping(references, mappings);
  if (live) {
    validateLivePullInventory(liveState.immutablePullRefs, inventory);
  }
  process.stdout.write(
    `OK: ${references.length} writable-history and PR-metadata references have complete mappings; ${inventory.immutablePullRefs.referencedCommitCount} immutable pull-only commits are inventoried\n`
  );
}

function replacements(mappingPath) {
  const mappings = loadMappings(mappingPath);
  for (const [reference, mapping] of Object.entries(mappings).sort(
    ([left], [right]) => compareReferences(left, right)
  )) {
    process.stdout.write(
      `literal:${reference}==>${mapping.replacement}\n`
    );
  }
}

function rewritePullRequests(mappingPath, execute) {
  const mappingDocument = JSON.parse(readFileSync(mappingPath, 'utf8'));
  const mappings = mappingDocument.mappings;
  const inventory = liveInventory(mappingDocument.repository);
  validateMapping(inventory.references, mappings);

  const changed = inventory.pullRequests
    .map((pullRequest) => ({
      ...pullRequest,
      nextTitle: rewriteText(pullRequest.title, mappings),
      nextBody: rewriteText(pullRequest.body ?? '', mappings),
    }))
    .filter(
      (pullRequest) =>
        pullRequest.nextTitle !== pullRequest.title ||
        pullRequest.nextBody !== (pullRequest.body ?? '')
    );

  for (const pullRequest of changed) {
    process.stdout.write(
      `${execute ? 'UPDATE' : 'WOULD UPDATE'} PR #${pullRequest.number}: ${pullRequest.nextTitle}\n`
    );
    if (execute) {
      run('gh', [
        'api',
        '--method',
        'PATCH',
        `repos/${mappingDocument.repository}/pulls/${pullRequest.number}`,
        '-f',
        `title=${pullRequest.nextTitle}`,
        '-f',
        `body=${pullRequest.nextBody}`,
      ]);
    }
  }
}

function verify(mappingPath, backup, rewritten, defaultBranch) {
  const mappings = loadMappings(mappingPath);
  const backupCount = git(backup, [
    'rev-list',
    '--branches',
    '--tags',
    '--count',
  ]);
  const rewrittenCount = git(rewritten, [
    'rev-list',
    '--branches',
    '--tags',
    '--count',
  ]);
  if (backupCount !== rewrittenCount) {
    throw new Error(
      `writable commit count changed: backup=${backupCount} rewritten=${rewrittenCount}`
    );
  }

  const rewrittenPullRefs = git(rewritten, [
    'for-each-ref',
    '--format=%(refname)',
    'refs/pull',
  ]);
  if (rewrittenPullRefs.length > 0) {
    throw new Error('rewritten scratch mirror still contains refs/pull');
  }

  const mainRef = `refs/heads/${defaultBranch}`;
  const backupTree = git(backup, ['rev-parse', `${mainRef}^{tree}`]);
  const rewrittenTree = git(rewritten, ['rev-parse', `${mainRef}^{tree}`]);
  if (backupTree !== rewrittenTree) {
    throw new Error(
      `default-branch tree changed: backup=${backupTree} rewritten=${rewrittenTree}`
    );
  }

  const rewrittenMessages = git(rewritten, [
    'log',
    '--branches',
    '--tags',
    '--format=%B',
  ]);
  const survivingReferences = collectReferences([rewrittenMessages]);
  if (survivingReferences.length > 0) {
    throw new Error(
      `rewritten history still contains ${survivingReferences.join(', ')}`
    );
  }

  const originalMessages = git(backup, [
    'log',
    '--branches',
    '--tags',
    '--format=%B%x00',
  ]);
  for (const message of originalMessages.split('\0')) {
    const subject = message.split('\n')[0];
    if (!hasReferencePattern.test(subject)) {
      continue;
    }
    const rewrittenSubject = rewriteText(subject, mappings);
    if (
      !/^[a-z]+!?: #[1-9]\d+ .+/.test(rewrittenSubject) ||
      rewrittenSubject.length > 72
    ) {
      throw new Error(
        `rewritten subject violates commit contract: ${rewrittenSubject}`
      );
    }
  }

  const backupBranches = git(backup, [
    'for-each-ref',
    '--format=%(refname)',
    'refs/heads',
  ])
    .split('\n')
    .filter(Boolean);
  const rewrittenBranches = git(rewritten, [
    'for-each-ref',
    '--format=%(refname)',
    'refs/heads',
  ])
    .split('\n')
    .filter(Boolean);
  if (backupBranches.join('\n') !== rewrittenBranches.join('\n')) {
    throw new Error('branch names changed during rewrite');
  }

  const backupTags = git(backup, ['tag', '--list'])
    .split('\n')
    .filter(Boolean);
  const rewrittenTags = git(rewritten, ['tag', '--list'])
    .split('\n')
    .filter(Boolean);
  if (backupTags.join('\n') !== rewrittenTags.join('\n')) {
    throw new Error('tag names changed during rewrite');
  }

  for (const tag of rewrittenTags) {
    const commit = git(rewritten, ['rev-list', '-n', '1', tag]);
    run('git', [
      '-C',
      rewritten,
      'merge-base',
      '--is-ancestor',
      commit,
      mainRef,
    ]);
  }

  process.stdout.write(
    `OK: ${rewrittenCount} writable commits, ${rewrittenBranches.length} branches, ${rewrittenTags.length} tags, identical ${defaultBranch} tree, and clean writable references\n`
  );
}

function valueAfter(args, flag) {
  const index = args.indexOf(flag);
  if (index === -1 || !args[index + 1]) {
    throw new Error(`${flag} is required`);
  }
  return args[index + 1];
}

function optionalValueAfter(args, flag) {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

function main(args) {
  const command = args[0];
  const mappingPath =
    optionalValueAfter(args, '--map') ?? 'docs/history-rewrite-map.json';

  if (command === 'check') {
    check(
      mappingPath,
      valueAfter(args, '--inventory'),
      args.includes('--live'),
      optionalValueAfter(args, '--git-repository') ?? '.'
    );
    return;
  }
  if (command === 'replacements') {
    replacements(mappingPath);
    return;
  }
  if (command === 'rewrite-pull-requests') {
    rewritePullRequests(mappingPath, args.includes('--execute'));
    return;
  }
  if (command === 'verify') {
    verify(
      mappingPath,
      valueAfter(args, '--backup'),
      valueAfter(args, '--rewritten'),
      valueAfter(args, '--default-branch')
    );
    return;
  }
  throw new Error(
    'usage: history-rewrite.mjs <check|replacements|rewrite-pull-requests|verify> --map <path> ...'
  );
}

const isMain = process.argv[1]
  ? fileURLToPath(import.meta.url) === process.argv[1]
  : false;
if (isMain) {
  try {
    main(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
