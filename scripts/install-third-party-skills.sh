#!/usr/bin/env bash
# install-third-party-skills.sh
#
# Restore the third-party vendored skills recorded in `skills-lock.json`.
# Run automatically as a pnpm `postinstall` hook (and on demand via
# `pnpm skills:install`). Re-runs restore the recorded skills; this script never
# refreshes or rewrites the committed lockfile. Use the install-skills workflow
# for add/update flows.
#
# Why this script exists: the eight in-repo `patinaproject-skills` are tracked
# in `skills/<name>/`; third-party skills from external skill catalogs are tracked
# only as pinned entries in `skills-lock.json` to avoid bloating
# `npx skills add patinaproject/skills` consumer installs with skills from
# other repos.

set -euo pipefail

# Skip if CI explicitly opts out (e.g., when only running unrelated jobs).
if [ "${PATINA_SKIP_SKILL_INSTALL:-0}" = "1" ]; then
  echo "skills:install: PATINA_SKIP_SKILL_INSTALL=1, skipping"
  exit 0
fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [ ! -f skills-lock.json ]; then
  echo "skills:install: no skills-lock.json, nothing to do"
  exit 0
fi

node <<'NODE'
const { execFileSync, spawnSync } = require("node:child_process");
const { createHash, randomBytes } = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const repoRoot = process.cwd();
const lockPath = path.join(repoRoot, "skills-lock.json");
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const entries = Object.entries(lock.skills || {});
const installLockPath = path.join(repoRoot, ".skills-install.lock");

if (entries.length === 0) {
  console.log("skills:install: skills-lock.json has no skills, nothing to do");
  process.exit(0);
}

const stageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "patina-skills-install-"));
let installLockHandle;

function cleanup() {
  if (installLockHandle !== undefined) {
    fs.closeSync(installLockHandle);
    installLockHandle = undefined;
    fs.rmSync(installLockPath, { force: true });
  }
  fs.rmSync(stageRoot, { recursive: true, force: true });
}

process.on("exit", cleanup);
process.on("SIGINT", () => {
  process.exit(130);
});
process.on("SIGTERM", () => {
  process.exit(143);
});

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: options.cwd || repoRoot,
    stdio: options.stdio || "inherit",
    env: process.env,
  });
}

function runWithCapturedOutput(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    timeout: Number.parseInt(process.env.PATINA_SKILL_INSTALL_GIT_TIMEOUT_MS || "120000", 10),
    env: process.env,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const error = new Error(`Command failed: ${command} ${args.join(" ")}`);
    error.stderr = result.stderr;
    throw error;
  }

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

function acquireInstallLock() {
  try {
    installLockHandle = fs.openSync(installLockPath, "wx");
    fs.writeFileSync(installLockHandle, `${process.pid}\n`);
  } catch (error) {
    if (error.code === "EEXIST") {
      const lockPid = Number.parseInt(fs.readFileSync(installLockPath, "utf8"), 10);
      const lockIsActive = Number.isInteger(lockPid) && (() => {
        try {
          process.kill(lockPid, 0);
          return true;
        } catch {
          return false;
        }
      })();

      if (lockIsActive) {
        throw new Error(`another skills:install process is already running with pid ${lockPid}`);
      }

      fs.rmSync(installLockPath, { force: true });
      installLockHandle = fs.openSync(installLockPath, "wx");
      fs.writeFileSync(installLockHandle, `${process.pid}\n`);
      return;
    }

    throw error;
  }
}

function repoUrlForSource(source) {
  if (typeof source !== "string" || !/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(source)) {
    throw new Error(`lock entry source must be a GitHub owner/repo slug: ${source}`);
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
  // Match the upstream skills CLI lock hash exactly so existing computedHash
  // values remain meaningful. The immutable Git ref is the primary integrity
  // anchor; this hash confirms the restored payload matches the committed lock.
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

  if (path.dirname(entry.skillPath) === ".") {
    throw new Error(`${name}.skillPath must point to a skill directory, not a repository-root SKILL.md`);
  }

  if (fs.existsSync(path.join(repoRoot, "skills", name, "SKILL.md"))) {
    throw new Error(`${name} is an in-repo skill; do not lock a third-party skill with the same name`);
  }

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

console.log(`skills:install: restoring ${entries.length} locked skill${entries.length === 1 ? "" : "s"} from skills-lock.json...`);
acquireInstallLock();

const stagedSkillsRoot = path.join(stageRoot, ".agents", "skills");
fs.mkdirSync(stagedSkillsRoot, { recursive: true });

let groupIndex = 0;
for (const group of groups.values()) {
  groupIndex += 1;
  const checkoutDir = path.join(stageRoot, `checkout-${groupIndex}`);
  fs.mkdirSync(checkoutDir, { recursive: true });

  run("git", ["init", "-q"], { cwd: checkoutDir });
  run("git", ["remote", "add", "origin", repoUrlForSource(group.source)], { cwd: checkoutDir });
  try {
    runWithCapturedOutput("git", ["fetch", "--depth", "1", "origin", group.ref], { cwd: checkoutDir });
  } catch (error) {
    const skillNames = group.skills.map(({ name }) => name).join(", ");
    const stderr = error.stderr?.toString().trim();
    const details = stderr || error.message;
    throw new Error(`${skillNames}: could not fetch ref ${group.ref} from ${group.source}: ${details}`);
  }

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

const targetSkillsRoots = [
  path.join(repoRoot, ".agents", "skills"),
  path.join(repoRoot, ".claude", "skills"),
];
const promotions = [];

for (const targetSkillsRoot of targetSkillsRoots) {
  fs.mkdirSync(targetSkillsRoot, { recursive: true });

  for (const [name] of entries) {
    const stagedDir = path.join(stagedSkillsRoot, name);
    const targetDir = path.join(targetSkillsRoot, name);
    const tempTargetDir = path.join(targetSkillsRoot, `.${name}.tmp-${process.pid}-${randomBytes(4).toString("hex")}`);

    copyDirectory(stagedDir, tempTargetDir);
    promotions.push({ targetDir, tempTargetDir });
  }
}

for (const { targetDir, tempTargetDir } of promotions) {
  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.renameSync(tempTargetDir, targetDir);
}

console.log("skills:install: done");
NODE
