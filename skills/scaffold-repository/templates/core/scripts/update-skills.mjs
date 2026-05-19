#!/usr/bin/env node
import { copyFileSync, existsSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const lockfile = "skills-lock.json";
const backup = `${lockfile}.bak`;
const cliTimeoutMs = 120000;

function run(command, args, failureMessage) {
  const result = spawnSync(command, args, {
    env: { ...process.env, npm_config_ignore_scripts: "true" },
    stdio: "inherit",
    timeout: cliTimeoutMs,
  });
  if (result.error) {
    throw new Error(`${failureMessage}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const exitInfo = result.status !== null ? `exit ${result.status}` : `signal ${result.signal}`;
    throw new Error(`${failureMessage}: ${exitInfo}`);
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
    { encoding: "utf8", timeout: 30000 },
  );
  if (result.error) {
    throw new Error(`Failed to resolve patinaproject/skills HEAD: ${result.error.message}`);
  }
  if (result.status !== 0) {
    const details = result.stderr?.trim() ? `\n${result.stderr.trim()}` : "";
    throw new Error(`Failed to resolve patinaproject/skills HEAD: exit ${result.status}${details}`);
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

  const needsImmutableRef = entries.filter((entry) => {
    const [, ref = ""] = entry.source.split("#", 2);
    return !/^[0-9a-f]{40}$/i.test(ref);
  });

  if (needsImmutableRef.length === 0) {
    return;
  }

  const sha = currentPatinaSkillsSha();
  for (const entry of needsImmutableRef) {
    entry.source = `patinaproject/skills#${sha}`;
  }
  writeCatalog(catalog);
}

function patinaSkillNames(catalog) {
  return Object.entries(catalog.skills ?? {})
    .filter(
      ([, entry]) =>
        entry?.sourceType === "github" &&
        typeof entry.source === "string" &&
        /^patinaproject\/skills(?:#.*)?$/.test(entry.source),
    )
    .map(([name]) => name)
    .sort();
}

if (!existsSync(lockfile)) {
  console.log(`No ${lockfile} found; no shared skills to update.`);
  process.exit(0);
}

rmSync(backup, { force: true });
copyFileSync(lockfile, backup);

try {
  const skills = patinaSkillNames(readCatalog());
  if (skills.length === 0) {
    console.log("No Patina Project shared skills found in skills-lock.json.");
    rmSync(backup, { force: true });
    process.exit(0);
  }

  for (const skill of skills) {
    run(
      "npx",
      // npx --yes auto-installs the package; the trailing --yes suppresses skills CLI prompts.
      ["--yes", "skills@latest", "add", "patinaproject/skills", "--skill", skill, "--yes"],
      `Failed to refresh Patina Project shared skill: ${skill}`,
    );
  }
  pinPatinaRefs();
  run(
    "npx",
    // The skills CLI currently exposes lockfile restore through experimental_install.
    // Keep this wrapper small so the subcommand is easy to replace when it graduates.
    ["--yes", "skills@latest", "experimental_install", "--yes"],
    "Updated shared skill lockfile could not be installed",
  );
  rmSync(backup, { force: true });
} catch (error) {
  console.error(error.message);
  restoreLockfile();
  process.exit(1);
}
