import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const copies = ['docs/agents/issue-tracker.md', 'plugins/work/skills/setup-work-skills/triage-labels.md'];
const start = '<!-- label-vocabulary:start -->';
const end = '<!-- label-vocabulary:end -->';

function region(text) {
  const from = text.indexOf(start);
  const to = text.indexOf(end);
  if (from === -1 || to === -1 || to < from || text.indexOf(start, from + 1) !== -1) return null;
  return text.slice(from, to);
}

function main(repoRoot = process.cwd()) {
  const regions = copies.map((file) => region(readFileSync(path.join(repoRoot, file), 'utf8')));
  const missing = copies.filter((_, index) => regions[index] === null);
  if (missing.length) {
    console.error(`FAIL: label vocabulary markers missing or repeated in: ${missing.join(', ')}`);
    process.exitCode = 1;
    return;
  }
  if (regions[0] !== regions[1]) {
    console.error(`FAIL: label vocabulary copies differ: ${copies.join(' and ')}`);
    process.exitCode = 1;
    return;
  }
  console.info(`OK: label vocabulary copies match: ${copies.join(' and ')}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
