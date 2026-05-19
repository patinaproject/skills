#!/usr/bin/env node
import { copyFileSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const lockfile = "skills-lock.json";
const backup = `${lockfile}.bak`;

function run(command, args, failureMessage) {
  const result = spawnSync(command, args, { stdio: "inherit" });
  if (result.error) {
    throw new Error(`${failureMessage}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${failureMessage}: exit ${result.status}`);
  }
}

function restoreLockfile() {
  if (existsSync(backup)) {
    renameSync(backup, lockfile);
    console.error(`Restored previous ${lockfile}.`);
  }
}

function readCatalog() {
  return JSON.parse(readFileSync(lockfile, "utf8"));
}

function writeCatalog(catalog) {
  writeFileSync(lockfile, `${JSON.stringify(catalog, null, 2)}\n`);
}

function currentPatinaSkillsSha() {
  const result = spawnSync(
    "git",
    ["ls-remote", "https://github.com/patinaproject/skills.git", "HEAD"],
    { encoding: "utf8" },
  );
  if (result.error) {
    throw new Error(`Failed to resolve patinaproject/skills HEAD: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Failed to resolve patinaproject/skills HEAD: exit ${result.status}`);
  }

  const sha = result.stdout.trim().split(/\s+/)[0];
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    throw new Error("Failed to resolve patinaproject/skills HEAD to a full SHA.");
  }
  return sha;
}

function pinPatinaRefs() {
  const catalog = readCatalog();
  const skills = catalog.skills ?? {};
  const entries = Object.values(skills).filter(
    (entry) =>
      entry?.sourceType === "github" &&
      typeof entry.source === "string" &&
      /^patinaproject\/skills(?:#.*)?$/.test(entry.source),
  );

  const unpinned = entries.filter((entry) => !entry.source.includes("#"));
  if (unpinned.length === 0) {
    return;
  }

  const sha = currentPatinaSkillsSha();
  for (const entry of unpinned) {
    entry.source = `patinaproject/skills#${sha}`;
  }
  writeCatalog(catalog);
}

if (!existsSync(lockfile)) {
  console.log(`No ${lockfile} found; no shared skills to update.`);
  process.exit(0);
}

rmSync(backup, { force: true });
copyFileSync(lockfile, backup);

try {
  // Equivalent command: npx --yes skills@latest add patinaproject/skills --yes
  run(
    "npx",
    ["--yes", "skills@latest", "add", "patinaproject/skills", "--yes"],
    "Failed to refresh Patina Project shared skills",
  );
  pinPatinaRefs();
  run(
    "npx",
    ["--yes", "skills@latest", "experimental_install", "--yes"],
    "Updated shared skill lockfile could not be installed",
  );
  rmSync(backup, { force: true });
} catch (error) {
  console.error(error.message);
  restoreLockfile();
  process.exit(1);
}
