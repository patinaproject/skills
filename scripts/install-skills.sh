#!/usr/bin/env bash
# install-skills.sh
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
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const https = require("node:https");
const path = require("node:path");
const zlib = require("node:zlib");

const repoRoot = process.cwd();
const lockPath = path.join(repoRoot, "skills-lock.json");
const lock = JSON.parse(fs.readFileSync(lockPath, "utf8"));
const entries = Object.entries(lock.skills || {});
const promotionTokenPattern = "[0-9a-f]{8}";
const fetchRetryDelayMs = 500;
const fetchAttempts = 3;
const maxCompressedArchiveBytes = 50 * 1024 * 1024;
const maxExtractedArchiveBytes = 200 * 1024 * 1024;

function fetchTimeoutMs() {
  const value =
    process.env.PATINA_SKILL_INSTALL_FETCH_TIMEOUT_MS ||
    // Preserve the old knob so existing CI and local wrappers keep working.
    process.env.PATINA_SKILL_INSTALL_GIT_TIMEOUT_MS;
  const parsed = value === undefined ? 120000 : Number.parseInt(value, 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    return 120000;
  }

  return parsed;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableFetchError(error) {
  return (
    error.statusCode === 429 ||
    error.statusCode >= 500 ||
    error.code === "ECONNRESET" ||
    error.code === "ETIMEDOUT" ||
    error.code === "ETIMEDOUT_FETCH" ||
    error.code === "EAI_AGAIN"
  );
}

function fetchBufferOnce(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    const deadlineTimer = setTimeout(() => {
      const error = new Error(`timed out fetching ${url}`);
      error.code = "ETIMEDOUT_FETCH";
      request.destroy(error);
    }, fetchTimeoutMs());

    const request = https.get(
      url,
      {
        headers: {
          "User-Agent": "patina-skills-install",
        },
        timeout: fetchTimeoutMs(),
      },
      (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          typeof response.headers.location === "string"
        ) {
          response.resume();
          if (redirectCount >= 5) {
            reject(new Error(`too many redirects while fetching ${url}`));
            return;
          }

          fetchBufferOnce(new URL(response.headers.location, url).toString(), redirectCount + 1).then(resolve, reject);
          return;
        }

        if (response.statusCode !== 200) {
          response.resume();
          const error = new Error(`HTTP ${response.statusCode} while fetching ${url}`);
          error.statusCode = response.statusCode;
          reject(error);
          return;
        }

        const chunks = [];
        let totalBytes = 0;
        response.on("data", (chunk) => {
          totalBytes += chunk.length;
          if (totalBytes > maxCompressedArchiveBytes) {
            request.destroy(new Error(`archive exceeds ${maxCompressedArchiveBytes} compressed bytes while fetching ${url}`));
            return;
          }

          chunks.push(chunk);
        });
        response.on("end", () => resolve(Buffer.concat(chunks)));
      },
    );

    request.on("timeout", () => {
      const error = new Error(`timed out fetching ${url}`);
      error.code = "ETIMEDOUT_FETCH";
      request.destroy(error);
    });
    request.on("close", () => clearTimeout(deadlineTimer));
    request.on("error", reject);
  });
}

async function fetchBuffer(url) {
  for (let attempt = 1; attempt <= fetchAttempts; attempt += 1) {
    try {
      return await fetchBufferOnce(url);
    } catch (error) {
      if (attempt === fetchAttempts || !isRetryableFetchError(error)) {
        throw error;
      }

      await wait(fetchRetryDelayMs * 2 ** (attempt - 1));
    }
  }

  throw new Error(`could not fetch ${url}`);
}

function parseOctal(value) {
  const text = value.toString("utf8").replace(/\0.*$/, "").trim();
  return text ? Number.parseInt(text, 8) : 0;
}

function parsePaxRecords(content) {
  const records = {};
  let offset = 0;

  while (offset < content.length) {
    const spaceIndex = content.indexOf(0x20, offset);
    if (spaceIndex === -1) {
      break;
    }

    const length = Number.parseInt(content.subarray(offset, spaceIndex).toString("utf8"), 10);
    if (!Number.isSafeInteger(length) || length <= 0 || offset + length > content.length) {
      break;
    }

    const record = content.subarray(spaceIndex + 1, offset + length - 1).toString("utf8");
    const equalsIndex = record.indexOf("=");
    if (equalsIndex !== -1) {
      records[record.slice(0, equalsIndex)] = record.slice(equalsIndex + 1);
    }
    offset += length;
  }

  return records;
}

function parseTarEntries(buffer) {
  const files = [];
  let pendingLongPath;
  let pendingPaxPath;

  for (let offset = 0; offset + 512 <= buffer.length; ) {
    const header = buffer.subarray(offset, offset + 512);
    offset += 512;

    if (header.every((byte) => byte === 0)) {
      break;
    }

    const rawName = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const rawPrefix = header.subarray(345, 500).toString("utf8").replace(/\0.*$/, "");
    const headerName = rawPrefix ? `${rawPrefix}/${rawName}` : rawName;
    const mode = parseOctal(header.subarray(100, 108));
    const size = parseOctal(header.subarray(124, 136));
    const type = header.subarray(156, 157).toString("utf8") || "0";
    const content = buffer.subarray(offset, offset + size);
    offset += Math.ceil(size / 512) * 512;

    if (type === "g") {
      pendingPaxPath = undefined;
      pendingLongPath = undefined;
      continue;
    }

    if (type === "x") {
      pendingPaxPath = parsePaxRecords(content).path;
      continue;
    }

    if (type === "L") {
      pendingLongPath = content.toString("utf8").replace(/\0.*$/, "");
      continue;
    }

    if (type === "K") {
      continue;
    }

    const name = pendingPaxPath || pendingLongPath || headerName;
    pendingPaxPath = undefined;
    pendingLongPath = undefined;

    // Non-regular entries are dropped to match upstream skills hashing:
    // directories, links, and metadata entries never contribute payload bytes.
    if (type === "0" || type === "") {
      files.push({ path: name, mode, content: Buffer.from(content) });
    }
  }

  return files;
}

async function fetchGitHubArchive(source, ref) {
  const url = `https://codeload.github.com/${source}/tar.gz/${ref}`;
  const archive = await fetchBuffer(url);
  return parseTarEntries(zlib.gunzipSync(archive, { maxOutputLength: maxExtractedArchiveBytes }));
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
        removeGeneratedPath(stalePath);
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

function assertGithubSource(source) {
  if (typeof source !== "string" || !/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(source)) {
    throw new Error(`lock entry source must be a GitHub owner/repo slug: ${source}`);
  }
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

function computeSkillFilesHash(files) {
  const sortedFiles = [...files].sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  const hash = createHash("sha256");
  // Match skills@1.5.7's computeSkillFolderHash implementation exactly so
  // skills-lock.json values produced by the upstream CLI remain meaningful.
  // The immutable Git ref is the primary integrity anchor; this checksum
  // confirms the restored payload matches the committed lock.
  for (const file of sortedFiles) {
    hash.update(file.relativePath);
    hash.update(file.content);
  }
  return hash.digest("hex");
}

function removeGeneratedPath(target) {
  let stat;
  try {
    stat = fs.lstatSync(target);
  } catch (error) {
    if (error.code === "ENOENT") {
      return;
    }

    throw error;
  }

  if (stat.isDirectory() && !stat.isSymbolicLink()) {
    fs.rmSync(target, { recursive: true, force: true });
  } else {
    fs.unlinkSync(target);
  }
}

function writeSkillFiles(files, targetDir) {
  // This deliberately writes directly to generated overlay paths: if interrupted,
  // rerun `pnpm skills:install` to restore from the verified lockfile. A sibling
  // temp-dir rename would be more crash-safe, but would reintroduce transient
  // installer files that this restore path is designed to avoid.
  removeGeneratedPath(targetDir);
  fs.mkdirSync(targetDir, { recursive: true });

  for (const file of files) {
    const targetPath = path.join(targetDir, file.relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, file.content, { mode: file.mode & 0o111 ? 0o755 : 0o644 });
  }
}

function linkDirectory(sourceDir, targetDir) {
  const relativeSource = path.relative(path.dirname(targetDir), sourceDir).split(path.sep).join("/");

  removeGeneratedPath(targetDir);
  fs.symlinkSync(relativeSource, targetDir, "dir");
}

function selfTestTarEntry(name, content, type = "0") {
  const body = Buffer.from(content);
  const header = Buffer.alloc(512);
  header.write(name, 0, 100, "utf8");
  header.write("0000644\0", 100, 8, "ascii");
  header.write("0000000\0", 108, 8, "ascii");
  header.write("0000000\0", 116, 8, "ascii");
  header.write(body.length.toString(8).padStart(11, "0") + "\0", 124, 12, "ascii");
  header.write("00000000000\0", 136, 12, "ascii");
  header.fill(0x20, 148, 156);
  header.write(type, 156, 1, "ascii");
  header.write("ustar\0", 257, 6, "ascii");
  header.write("00", 263, 2, "ascii");

  let checksum = 0;
  for (const byte of header) {
    checksum += byte;
  }
  header.write(checksum.toString(8).padStart(6, "0") + "\0 ", 148, 8, "ascii");

  return Buffer.concat([header, body, Buffer.alloc((512 - (body.length % 512)) % 512)]);
}

function selfTestTar(entries) {
  return Buffer.concat([...entries, Buffer.alloc(1024)]);
}

function selfTestPaxRecord(key, value) {
  let record = `${key}=${value}\n`;
  let length = Buffer.byteLength(record) + String(Buffer.byteLength(record)).length + 1;

  while (true) {
    const candidate = `${length} ${record}`;
    const candidateLength = Buffer.byteLength(candidate);
    if (candidateLength === length) {
      return candidate;
    }
    length = candidateLength;
  }
}

function runSelfTests() {
  const regular = parseTarEntries(selfTestTar([selfTestTarEntry("archive-root/skill/SKILL.md", "# skill\n")]));
  if (regular[0]?.path !== "archive-root/skill/SKILL.md") {
    throw new Error("self-test: regular tar entry path was not parsed");
  }

  const paxPath = "archive-root/skill/references/" + "a".repeat(120) + ".md";
  const pax = parseTarEntries(selfTestTar([
    selfTestTarEntry("PaxHeader", selfTestPaxRecord("path", paxPath), "x"),
    selfTestTarEntry("ignored", "content\n"),
  ]));
  if (pax[0]?.path !== paxPath) {
    throw new Error("self-test: pax path was not applied");
  }

  const longPath = "archive-root/skill/" + "b".repeat(120) + ".md";
  const gnuLong = parseTarEntries(selfTestTar([
    selfTestTarEntry("././@LongLink", `${longPath}\0`, "L"),
    selfTestTarEntry("ignored", "content\n"),
  ]));
  if (gnuLong[0]?.path !== longPath) {
    throw new Error("self-test: GNU long path was not applied");
  }

  const gnuLongBeforeLongLink = parseTarEntries(selfTestTar([
    selfTestTarEntry("././@LongLink", `${longPath}\0`, "L"),
    selfTestTarEntry("././@LongLink", "ignored-link-target\0", "K"),
    selfTestTarEntry("ignored", "content\n"),
  ]));
  if (gnuLongBeforeLongLink[0]?.path !== longPath) {
    throw new Error("self-test: GNU long-link metadata consumed a pending long path");
  }

  try {
    assertSafeRelative("../escape", "self-test path");
    throw new Error("self-test: unsafe relative path was accepted");
  } catch (error) {
    if (!error.message.includes("safe relative path")) {
      throw error;
    }
  }

  try {
    zlib.gunzipSync(zlib.gzipSync(Buffer.alloc(2)), {
      maxOutputLength: 1,
    });
    throw new Error("self-test: oversized extracted archive was accepted");
  } catch (error) {
    if (error.code !== "ERR_BUFFER_TOO_LARGE" && !String(error.message).includes("maxOutputLength")) {
      throw error;
    }
  }

  console.log("skills:install: self-test passed");
}

if (process.env.PATINA_SKILL_INSTALL_SELF_TEST === "1") {
  runSelfTests();
  process.exit(0);
}

if (entries.length === 0) {
  console.log("skills:install: skills-lock.json has no skills, nothing to do");
  process.exit(0);
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
  assertGithubSource(entry.source);

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

async function main() {
  console.log(`skills:install: restoring ${entries.length} locked skill${entries.length === 1 ? "" : "s"} from skills-lock.json...`);
  // No project-local lock or staging files are created. Concurrent invocations
  // are unsupported; rerun `pnpm skills:install` if an install is interrupted.
  removeStalePromotionEntries();
  removeUnlockedSkillDirs(new Set(entries.map(([name]) => name)));

  const restoredSkills = new Map();

  for (const group of groups.values()) {
    let archiveFiles;
    try {
      archiveFiles = await fetchGitHubArchive(group.source, group.ref);
    } catch (error) {
      const skillNames = group.skills.map(({ name }) => name).join(", ");
      throw new Error(`${skillNames}: could not fetch ref ${group.ref} from ${group.source}: ${error.message}`);
    }

    const archiveRoot = archiveFiles[0]?.path.split("/")[0];
    if (!archiveRoot) {
      throw new Error(`${group.source}@${group.ref} archive was empty`);
    }

    for (const { name, entry } of group.skills) {
      const sourcePrefix = `${archiveRoot}/${path.dirname(entry.skillPath).split(path.sep).join("/")}/`;
      const skillFiles = archiveFiles
        .filter((file) => file.path.startsWith(sourcePrefix))
        .map((file) => ({
          relativePath: file.path.slice(sourcePrefix.length),
          content: file.content,
          mode: file.mode,
        }))
        .filter((file) => file.relativePath && !file.relativePath.split("/").includes(".git") && !file.relativePath.split("/").includes("node_modules"));

      for (const file of skillFiles) {
        assertSafeRelative(file.relativePath, `${name} archive path`);
      }

      if (!skillFiles.some((file) => file.relativePath === "SKILL.md")) {
        throw new Error(`${name} ref ${group.ref} does not contain ${entry.skillPath}`);
      }

      const actualHash = computeSkillFilesHash(skillFiles);
      if (actualHash !== entry.computedHash) {
        throw new Error(`${name} hash mismatch for ${group.source}@${group.ref}: expected ${entry.computedHash}, got ${actualHash}`);
      }

      restoredSkills.set(name, skillFiles);
    }
  }

  const agentsSkillsRoot = path.join(repoRoot, ".agents", "skills");
  const claudeSkillsRoot = path.join(repoRoot, ".claude", "skills");

  fs.mkdirSync(agentsSkillsRoot, { recursive: true });
  fs.mkdirSync(claudeSkillsRoot, { recursive: true });

  for (const [name] of entries) {
    const agentTargetDir = path.join(agentsSkillsRoot, name);
    const claudeTargetDir = path.join(claudeSkillsRoot, name);
    const skillFiles = restoredSkills.get(name);

    // The verified payload is written once into `.agents/skills`; Claude entries
    // are portable relative symlinks to that shared project-local payload.
    writeSkillFiles(skillFiles, agentTargetDir);
    linkDirectory(agentTargetDir, claudeTargetDir);
  }

  console.log("skills:install: done");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
NODE
