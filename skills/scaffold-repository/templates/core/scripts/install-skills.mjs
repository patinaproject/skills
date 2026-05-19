#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const lockfile = "skills-lock.json";
const listOnly = process.argv.includes("--list");
const cliTimeoutMs = 120000;

function readLockfile() {
  try {
    return JSON.parse(readFileSync(lockfile, "utf8"));
  } catch (error) {
    console.error(`Failed to read ${lockfile}: ${error.message}`);
    process.exit(1);
  }
}

if (!existsSync(lockfile)) {
  console.log("No skills-lock.json found; no shared skills to install.");
  process.exit(0);
}

if (listOnly) {
  const catalog = readLockfile();
  const skills = Object.keys(catalog.skills ?? {});
  if (skills.length === 0) {
    console.log(`${lockfile} contains no shared skills.`);
    process.exit(0);
  }

  for (const skill of skills.sort()) {
    console.log(skill);
  }
  process.exit(0);
}

const result = spawnSync(
  "npx",
  // npx --yes auto-installs the package; the trailing --yes suppresses skills CLI prompts.
  // The skills CLI currently exposes lockfile restore through experimental_install.
  // Keep this wrapper small so the subcommand is easy to replace when it graduates.
  ["--yes", "skills@latest", "experimental_install", "--yes"],
  {
    env: { ...process.env, npm_config_ignore_scripts: "true" },
    stdio: "inherit",
    timeout: cliTimeoutMs,
  },
);

if (result.error) {
  console.error(`Failed to install shared skills: ${result.error.message}`);
  process.exit(1);
}

if (result.signal) {
  console.error(`Failed to install shared skills: signal ${result.signal}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
