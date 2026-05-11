#!/usr/bin/env node
// Verifies every plugin manifest's version matches package.json.
// Exits non-zero on mismatch so husky pre-commit can block the commit.

import { readFileSync, existsSync } from "node:fs";

const SOURCE = "package.json";
const TARGETS = [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"];

const sourceVersion = JSON.parse(readFileSync(SOURCE, "utf8")).version;
if (!sourceVersion) {
  console.error(`check-plugin-versions: ${SOURCE} has no version field`);
  process.exit(1);
}

const mismatches = [];
for (const path of TARGETS) {
  if (!existsSync(path)) continue;
  const v = JSON.parse(readFileSync(path, "utf8")).version;
  if (v !== sourceVersion) {
    mismatches.push({ path, expected: sourceVersion, actual: v });
  }
}

if (mismatches.length > 0) {
  console.error(
    `check-plugin-versions: version drift detected (run \`pnpm sync:versions\` to fix):`,
  );
  for (const { path, expected, actual } of mismatches) {
    console.error(`  ${path}: ${actual} (expected ${expected})`);
  }
  process.exit(1);
}

console.log(`check-plugin-versions: all manifests at ${sourceVersion}`);
