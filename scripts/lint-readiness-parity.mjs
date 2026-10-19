import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const copies = ['plugins/team/skills/triage/READINESS.md', 'plugins/engineering/skills/patina-mode/references/readiness.md'];

function main(repoRoot = process.cwd()) {
  const [first, second] = copies.map((file) => readFileSync(path.join(repoRoot, file), 'utf8'));
  if (first !== second) {
    console.error(`FAIL: readiness check copies differ: ${copies.join(' and ')}`);
    process.exitCode = 1;
    return;
  }
  console.info(`OK: readiness check copies match: ${copies.join(' and ')}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main();
}
