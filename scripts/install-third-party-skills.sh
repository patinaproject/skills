#!/usr/bin/env bash
# install-third-party-skills.sh
#
# Restore the third-party vendored skills recorded in `skills-lock.json`.
# Run automatically as a pnpm `postinstall` hook (and on demand via
# `pnpm skills:install`). Re-runs restore the recorded skills, but the lifecycle
# is not allowed to refresh or rewrite the committed lockfile.
#
# Why this script exists: the eight in-repo `patinaproject-skills` are tracked
# in `skills/<name>/`; third-party skills from external skill catalogs are tracked
# only as pinned entries in `skills-lock.json` to avoid bloating
# `npx skills add patinaproject/skills` consumer installs with skills from
# other repos.

set -euo pipefail

# Skip if CI explicitly opts out (e.g., when only running unrelated jobs).
if [ "${PATINA_SKIP_SKILL_INSTALL:-0}" = "1" ]; then
  echo "install-third-party-skills: PATINA_SKIP_SKILL_INSTALL=1, skipping"
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f skills-lock.json ]; then
  echo "install-third-party-skills: no skills-lock.json, nothing to do"
  exit 0
fi

node <<'NODE'
const { execFileSync } = require("node:child_process");
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoRoot = process.cwd();
const lockPath = path.join(repoRoot, "skills-lock.json");
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const entries = Object.entries(lock.skills || {});

if (entries.length === 0) {
  console.log("install-third-party-skills: skills-lock.json has no skills, nothing to do");
  process.exit(0);
}

const stageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "patina-skills-install-"));

function cleanup() {
  fs.rmSync(stageRoot, { recursive: true, force: true });
}

process.on("exit", cleanup);
process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
process.on("SIGTERM", () => {
  cleanup();
  process.exit(143);
});

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: options.cwd || repoRoot,
    stdio: options.stdio || "inherit",
    env: process.env,
  });
}

function repoUrlForSource(source) {
  if (typeof source !== "string" || source.length === 0) {
    throw new Error("lock entry source must be a non-empty string");
  }

  if (/^(https?:|git@)/.test(source)) {
    return source;
  }
  return `https://github.com/${source}.git`;
}

function assertSafeRelative(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    path.isAbsolute(value) ||
    value.split(/[\\/]/).includes("..")
  ) {
    throw new Error(`${label} must be a safe relative path: ${value}`);
  }
}

function collectFiles(baseDir, currentDir, results) {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    if (entry.name === ".git" || entry.name === "node_modules") {
      continue;
    }

    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(baseDir, fullPath, results);
    } else if (entry.isFile()) {
      results.push({
        relativePath: path.relative(baseDir, fullPath).split(path.sep).join("/"),
        content: fs.readFileSync(fullPath),
      });
    }
  }
}

function computeSkillFolderHash(skillDir) {
  const files = [];
  collectFiles(skillDir, skillDir, files);
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.relativePath);
    hash.update(file.content);
  }
  return hash.digest("hex");
}

function copyDirectory(source, target) {
  fs.rmSync(target, { recursive: true, force: true });
  fs.cpSync(source, target, {
    recursive: true,
    preserveTimestamps: false,
    filter: (sourcePath) => {
      const parts = path.relative(source, sourcePath).split(path.sep);
      return !parts.includes(".git") && !parts.includes("node_modules");
    },
  });
}

const groups = new Map();

for (const [name, entry] of entries) {
  assertSafeRelative(name, "skill name");
  assertSafeRelative(entry.skillPath, `${name}.skillPath`);

  if (entry.sourceType !== "github") {
    throw new Error(`${name} has unsupported sourceType ${entry.sourceType}; only github lock entries can be restored`);
  }

  const ref = entry.ref;
  if (typeof ref !== "string" || !/^[0-9a-f]{40}$/i.test(ref)) {
    throw new Error(`${name} must include an immutable 40-character ref in skills-lock.json`);
  }

  if (typeof entry.computedHash !== "string" || !/^[0-9a-f]{64}$/i.test(entry.computedHash)) {
    throw new Error(`${name} must include a sha256 computedHash in skills-lock.json`);
  }

  const groupKey = `${entry.source}\0${ref}`;
  const group = groups.get(groupKey) || {
    source: entry.source,
    ref,
    skills: [],
  };
  group.skills.push({ name, entry });
  groups.set(groupKey, group);
}

console.log(`install-third-party-skills: restoring ${entries.length} locked skill${entries.length === 1 ? "" : "s"} from skills-lock.json...`);

const stagedSkillsRoot = path.join(stageRoot, ".agents", "skills");
fs.mkdirSync(stagedSkillsRoot, { recursive: true });

let groupIndex = 0;
for (const group of groups.values()) {
  groupIndex += 1;
  const checkoutDir = path.join(stageRoot, `checkout-${groupIndex}`);
  fs.mkdirSync(checkoutDir, { recursive: true });

  run("git", ["init", "-q"], { cwd: checkoutDir });
  run("git", ["remote", "add", "origin", repoUrlForSource(group.source)], { cwd: checkoutDir });
  run("git", ["fetch", "--depth", "1", "origin", group.ref], { cwd: checkoutDir });

  const skillDirs = [...new Set(group.skills.map(({ entry }) => path.dirname(entry.skillPath)))];
  run("git", ["checkout", "FETCH_HEAD", "--", ...skillDirs], { cwd: checkoutDir });

  for (const { name, entry } of group.skills) {
    const sourceDir = path.join(checkoutDir, path.dirname(entry.skillPath));
    const stagedDir = path.join(stagedSkillsRoot, name);

    if (!fs.existsSync(path.join(sourceDir, "SKILL.md"))) {
      throw new Error(`${name} ref ${group.ref} does not contain ${entry.skillPath}`);
    }

    copyDirectory(sourceDir, stagedDir);

    const actualHash = computeSkillFolderHash(stagedDir);
    if (actualHash !== entry.computedHash) {
      throw new Error(`${name} hash mismatch for ${group.source}@${group.ref}: expected ${entry.computedHash}, got ${actualHash}`);
    }
  }
}

const targetSkillsRoot = path.join(repoRoot, ".agents", "skills");
fs.mkdirSync(targetSkillsRoot, { recursive: true });

for (const [name] of entries) {
  const stagedDir = path.join(stagedSkillsRoot, name);
  const targetDir = path.join(targetSkillsRoot, name);
  const tempTargetDir = path.join(targetSkillsRoot, `.${name}.tmp-${process.pid}`);

  copyDirectory(stagedDir, tempTargetDir);
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.renameSync(tempTargetDir, targetDir);
}

console.log("install-third-party-skills: done");
NODE
