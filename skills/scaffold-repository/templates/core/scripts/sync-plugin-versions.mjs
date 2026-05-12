#!/usr/bin/env node
// Writes the canonical version from package.json into every plugin manifest.
// package.json is the single source of truth.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const SOURCE = "package.json";
const TARGETS = [".claude-plugin/plugin.json", ".codex-plugin/plugin.json"];

const sourceVersion = JSON.parse(readFileSync(SOURCE, "utf8")).version;
if (!sourceVersion) {
  console.error(`sync-plugin-versions: ${SOURCE} has no version field`);
  process.exit(1);
}

let changed = 0;
for (const path of TARGETS) {
  if (!existsSync(path)) continue;
  const raw = readFileSync(path, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed.version === sourceVersion) continue;
  parsed.version = sourceVersion;
  writeFileSync(path, JSON.stringify(parsed, null, 2) + "\n");
  console.log(`sync-plugin-versions: ${path} -> ${sourceVersion}`);
  changed += 1;
}

if (changed === 0) {
  console.log(`sync-plugin-versions: all manifests already at ${sourceVersion}`);
}
