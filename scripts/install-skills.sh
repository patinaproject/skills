#!/usr/bin/env bash
# install-skills.sh
#
# Restore the third-party vendored skills recorded in `skills-lock.json`.
# Run automatically as a pnpm `postinstall` hook (and on demand via
# `pnpm skills:install`). Re-runs restore the recorded skills; this script never
# refreshes or rewrites the committed lockfile. Use the install-skills workflow
# for add/update flows.
#
# A live lock normally cleans up on process exit. After SIGKILL or host crash,
# stale locks recover automatically after a bounded TTL: the greater of 10
# minutes or twice the Git fetch timeout per locked source group. Deleting
# `.skills-install.lock` manually is only needed when a contributor wants to
# bypass that wait after confirming no install is active.
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
const installLockAttempts = 8;
const promotionTokenPattern = "[0-9a-f]{8}";

if (entries.length === 0) {
  console.log("skills:install: skills-lock.json has no skills, nothing to do");
  process.exit(0);
}

const stageRoot = fs.mkdtempSync(path.join(os.tmpdir(), "patina-skills-install-"));
let installLockOwned = false;
const promotionTempDirs = [];

function cleanup() {
  for (const tempDir of promotionTempDirs) {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Best-effort cleanup must not mask the original install failure.
    }
  }

  if (installLockOwned) {
    try {
      fs.rmSync(installLockPath, { force: true });
    } catch {
      // Best-effort cleanup must not mask the original install failure.
    }
    installLockOwned = false;
  }

  try {
    fs.rmSync(stageRoot, { recursive: true, force: true });
  } catch {
    // Best-effort cleanup must not mask the original install failure.
  }
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
    timeout: gitTimeoutMs(),
    env: process.env,
  });
}

function runWithCapturedOutput(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: "utf8",
    timeout: gitTimeoutMs(),
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

  return result;
}

function gitTimeoutMs() {
  const value = process.env.PATINA_SKILL_INSTALL_GIT_TIMEOUT_MS;
  const parsed = value === undefined ? 120000 : Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return 120000;
  }

  return parsed;
}

function lockInfoFromDisk() {
  let raw;
  let stat;
  try {
    stat = fs.statSync(installLockPath);
    raw = fs.readFileSync(installLockPath, "utf8").trim();
  } catch (error) {
    if (error.code === "ENOENT") {
      return { pid: undefined, raw: undefined, createdAtMs: undefined };
    }

    throw error;
  }

  if (!raw) {
    return { pid: undefined, raw, createdAtMs: stat.mtimeMs };
  }

  try {
    const parsed = JSON.parse(raw);
    const pid = Number.parseInt(typeof parsed === "number" ? parsed : parsed.pid, 10);
    const createdAtMs =
      typeof parsed === "object" && parsed !== null && typeof parsed.createdAt === "string"
        ? Date.parse(parsed.createdAt)
        : undefined;
    return {
      pid: Number.isSafeInteger(pid) && pid > 0 ? pid : undefined,
      raw,
      createdAtMs: Number.isFinite(createdAtMs) ? createdAtMs : stat.mtimeMs,
    };
  } catch {
    const pid = Number.parseInt(raw, 10);
    return {
      pid: Number.isSafeInteger(pid) && pid > 0 ? pid : undefined,
      raw,
      createdAtMs: stat.mtimeMs,
    };
  }
}

function staleLockTtlMs(groupCount) {
  return Math.max(gitTimeoutMs() * Math.max(groupCount, 1) * 2, 10 * 60 * 1000);
}

function isProcessActive(pid) {
  if (!Number.isSafeInteger(pid) || pid <= 0) {
    return false;
  }

  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === "ESRCH") {
      return false;
    }

    // EPERM and unknown errors mean a process may still own the lock. Fail
    // closed instead of deleting a live install lock we cannot inspect.
    return true;
  }
}

function isLockOwnerActive(lockInfo, groupCount) {
  if (lockInfo.pid === undefined || !isProcessActive(lockInfo.pid)) {
    return false;
  }

  const ageMs = Date.now() - (lockInfo.createdAtMs || 0);
  return ageMs <= staleLockTtlMs(groupCount);
}

function acquireInstallLock(groupCount) {
  for (let attempt = 0; attempt < installLockAttempts; attempt += 1) {
    // Keep candidate/stale lock names under `.skills-install.lock.*.tmp`;
    // `.gitignore` intentionally covers this family for interrupted runs.
    const candidateLockPath = path.join(
      repoRoot,
      `.skills-install.lock.${process.pid}-${randomBytes(4).toString("hex")}.tmp`,
    );

    try {
      fs.writeFileSync(
        candidateLockPath,
        `${JSON.stringify({
          pid: process.pid,
          createdAt: new Date().toISOString(),
          command: "pnpm skills:install",
        })}\n`,
        { mode: 0o600 },
      );
      fs.linkSync(candidateLockPath, installLockPath);
      installLockOwned = true;
      return;
    } catch (error) {
      if (error.code !== "EEXIST") {
        throw error;
      }

      const lockInfo = lockInfoFromDisk();
      if (isLockOwnerActive(lockInfo, groupCount)) {
        throw new Error(`another skills:install process is already running with pid ${lockInfo.pid}`);
      }

      const currentLock = lockInfoFromDisk();
      if (currentLock.raw !== lockInfo.raw) {
        continue;
      }

      const staleLockPath = path.join(
        repoRoot,
        `.skills-install.lock.stale-${process.pid}-${randomBytes(4).toString("hex")}.tmp`,
      );

      try {
        fs.renameSync(installLockPath, staleLockPath);
        const movedRaw = fs.readFileSync(staleLockPath, "utf8").trim();
        if (movedRaw !== lockInfo.raw) {
          try {
            fs.linkSync(staleLockPath, installLockPath);
          } catch (restoreError) {
            if (restoreError.code !== "EEXIST") {
              throw restoreError;
            }
          }
          continue;
        }
      } catch (renameError) {
        if (renameError.code !== "ENOENT") {
          throw renameError;
        }
      } finally {
        fs.rmSync(staleLockPath, { force: true });
      }
    } finally {
      fs.rmSync(candidateLockPath, { force: true });
    }
  }

  throw new Error(
    `could not acquire ${path.relative(repoRoot, installLockPath)} after ${installLockAttempts} attempts; ` +
      "confirm no install is active, then wait for stale-lock recovery or delete the lock manually",
  );
}

function removeStalePromotionEntries() {
  const stalePromotionPattern = new RegExp(`^\\.[^.].*\\.(old|tmp)-\\d+-${promotionTokenPattern}$`);

  for (const root of [path.join(repoRoot, ".agents", "skills"), path.join(repoRoot, ".claude", "skills")]) {
    if (!fs.existsSync(root)) {
      continue;
    }

    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (stalePromotionPattern.test(entry.name)) {
        const stalePath = path.join(root, entry.name);
        fs.lstatSync(stalePath);
        fs.rmSync(stalePath, { recursive: true, force: true });
      }
    }
  }
}

function removeUnlockedSkillDirs(lockedSkillNames) {
  for (const root of [path.join(repoRoot, ".agents", "skills"), path.join(repoRoot, ".claude", "skills")]) {
    if (!fs.existsSync(root)) {
      continue;
    }

    for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
      if (entry.name.startsWith(".") || lockedSkillNames.has(entry.name)) {
        continue;
      }

      if (fs.existsSync(path.join(repoRoot, "skills", entry.name, "SKILL.md"))) {
        continue;
      }

      fs.rmSync(path.join(root, entry.name), { recursive: true, force: true });
    }
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
  // Match skills@1.5.7's computeSkillFolderHash implementation exactly so
  // skills-lock.json values produced by the upstream CLI remain meaningful.
  // The immutable Git ref is the primary integrity anchor; this checksum
  // confirms the restored payload matches the committed lock.
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
      if (parts.includes(".git") || parts.includes("node_modules")) {
        return false;
      }

      // Keep copy behavior in lockstep with the upstream-compatible hash:
      // symlinks and other non-file/non-directory entries are intentionally
      // omitted instead of dereferenced or hashed.
      const stat = fs.lstatSync(sourcePath);
      return stat.isDirectory() || stat.isFile();
    },
  });
}

function pathExists(target) {
  try {
    fs.lstatSync(target);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function stageDirectoryPromotion(sourceDir, targetDir) {
  const promotionToken = randomBytes(4).toString("hex");
  const tempTargetDir = path.join(path.dirname(targetDir), `.${path.basename(targetDir)}.tmp-${process.pid}-${promotionToken}`);

  copyDirectory(sourceDir, tempTargetDir);
  promotionTempDirs.push(tempTargetDir);
  return { targetDir, tempTargetDir };
}

function stageSymlinkPromotion(targetDir, sourceDir) {
  const promotionToken = randomBytes(4).toString("hex");
  const tempTargetDir = path.join(path.dirname(targetDir), `.${path.basename(targetDir)}.tmp-${process.pid}-${promotionToken}`);
  const relativeSource = path.relative(path.dirname(targetDir), sourceDir).split(path.sep).join("/");

  fs.rmSync(tempTargetDir, { recursive: true, force: true });
  fs.symlinkSync(relativeSource, tempTargetDir, "dir");
  promotionTempDirs.push(tempTargetDir);
  return { targetDir, tempTargetDir };
}

function forgetPromotionTempDir(tempDir) {
  const index = promotionTempDirs.indexOf(tempDir);
  if (index !== -1) {
    promotionTempDirs.splice(index, 1);
  }
}

const groups = new Map();

for (const [name, entry] of entries) {
  assertSafeRelative(name, "skill name");
  assertSafeRelative(entry.skillPath, `${name}.skillPath`);

  if (path.basename(entry.skillPath) !== "SKILL.md") {
    throw new Error(`${name}.skillPath must point to a SKILL.md file`);
  }

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
acquireInstallLock(groups.size);
removeStalePromotionEntries();
removeUnlockedSkillDirs(new Set(entries.map(([name]) => name)));

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
    runWithCapturedOutput("git", ["fetch", "-q", "--depth", "1", "origin", group.ref], { cwd: checkoutDir });
  } catch (error) {
    const skillNames = group.skills.map(({ name }) => name).join(", ");
    const stderr = error.stderr?.toString().trim();
    const details = stderr || error.message;
    throw new Error(`${skillNames}: could not fetch ref ${group.ref} from ${group.source}: ${details}`);
  }

  const skillDirs = [...new Set(group.skills.map(({ entry }) => path.dirname(entry.skillPath)))];
  run("git", ["checkout", "-q", "FETCH_HEAD", "--", ...skillDirs], { cwd: checkoutDir });

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

const agentsSkillsRoot = path.join(repoRoot, ".agents", "skills");
const claudeSkillsRoot = path.join(repoRoot, ".claude", "skills");
const promotions = [];

fs.mkdirSync(agentsSkillsRoot, { recursive: true });
fs.mkdirSync(claudeSkillsRoot, { recursive: true });

for (const [name] of entries) {
  const stagedDir = path.join(stagedSkillsRoot, name);
  const agentTargetDir = path.join(agentsSkillsRoot, name);
  const claudeTargetDir = path.join(claudeSkillsRoot, name);

  // The verified payload is promoted once into `.agents/skills`; Claude entries
  // are portable relative symlinks to that shared project-local payload.
  promotions.push(stageDirectoryPromotion(stagedDir, agentTargetDir));
  promotions.push(stageSymlinkPromotion(claudeTargetDir, agentTargetDir));
}

// Promotion is idempotent but not fully transactional across every skill and
// overlay. If a process dies mid-promotion, rerunning restores all targets from
// the lockfile; per-target backups cover ordinary rename failures.
for (const { targetDir, tempTargetDir } of promotions) {
  const promotionToken = randomBytes(4).toString("hex");
  const backupTargetDir = path.join(path.dirname(targetDir), `.${path.basename(targetDir)}.old-${process.pid}-${promotionToken}`);
  let hasBackup = false;

  if (pathExists(targetDir)) {
    fs.renameSync(targetDir, backupTargetDir);
    hasBackup = true;
    promotionTempDirs.push(backupTargetDir);
  }

  try {
    fs.renameSync(tempTargetDir, targetDir);
    forgetPromotionTempDir(tempTargetDir);
  } catch (error) {
    if (hasBackup && !pathExists(targetDir)) {
      fs.renameSync(backupTargetDir, targetDir);
      forgetPromotionTempDir(backupTargetDir);
    }

    throw error;
  }

  if (hasBackup) {
    fs.rmSync(backupTargetDir, { recursive: true, force: true });
    forgetPromotionTempDir(backupTargetDir);
  }
}

console.log("skills:install: done");
NODE
