#!/usr/bin/env bash
# This test intentionally runs the public lifecycle command, so it is
# network-backed while restoring locked skills from their immutable Git refs. It
# rewrites ignored local `.agents/skills/*` and `.claude/skills/*` overlays.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

if [ ! -f skills-lock.json ]; then
  echo "OK: no skills-lock.json, lifecycle install has nothing to restore"
  exit 0
fi

postinstall_script="$(node -e "console.log(require('./package.json').scripts.postinstall || '')")"
install_script="$(node -e "console.log(require('./package.json').scripts['skills:install'] || '')")"
restore_script="$(node -e "console.log(require('./package.json').scripts['skills:restore'] || '')")"

if [ "$postinstall_script" != "pnpm skills:install" ]; then
  echo "FAIL: package.json postinstall must delegate to pnpm skills:install" >&2
  exit 1
fi

if [ "$install_script" != "bash scripts/install-skills.sh" ]; then
  echo "FAIL: package.json skills:install must run the restore implementation" >&2
  exit 1
fi

if [ -n "$restore_script" ]; then
  echo "FAIL: package.json must not expose retired skills:restore script" >&2
  exit 1
fi

locked_skill_count="$(node -e "const lock = require('./skills-lock.json'); console.log(Object.keys(lock.skills || {}).length)")"

if [ "$locked_skill_count" = "0" ]; then
  echo "OK: skills-lock.json has no locked skills, lifecycle install has nothing to restore"
  exit 0
fi

temp_repo="$(mktemp -d)"
cleanup() {
  rm -rf "$temp_repo"
}
trap cleanup EXIT

mkdir -p "$temp_repo/scripts" "$temp_repo/skills/develop-issue"
cp scripts/install-skills.sh "$temp_repo/scripts/"
printf '# develop-issue\n' >"$temp_repo/skills/develop-issue/SKILL.md"
cat >"$temp_repo/skills-lock.json" <<'JSON'
{
  "version": 1,
  "skills": {
    "develop-issue": {
      "source": "mattpocock/skills",
      "sourceType": "github",
      "ref": "b8be62ffacb0118fa3eaa29a0923c87c8c11985c",
      "skillPath": "skills/engineering/diagnose/SKILL.md",
      "computedHash": "0000000000000000000000000000000000000000000000000000000000000000"
    }
  }
}
JSON

collision_out="$temp_repo/skill-install-collision.out"
collision_err="$temp_repo/skill-install-collision.err"

if (cd "$temp_repo" && bash scripts/install-skills.sh >"$collision_out" 2>"$collision_err"); then
  echo "FAIL: pnpm skills:install must reject third-party locks that collide with in-repo skills" >&2
  exit 1
fi

lock_repo="$temp_repo/lock-check"
mkdir -p "$lock_repo/scripts"
cp scripts/install-skills.sh "$lock_repo/scripts/"
cat >"$lock_repo/skills-lock.json" <<'JSON'
{
  "version": 1,
  "skills": {
    "diagnose": {
      "source": "mattpocock/skills",
      "sourceType": "github",
      "ref": "b8be62ffacb0118fa3eaa29a0923c87c8c11985c",
      "skillPath": "skills/engineering/diagnose/SKILL.md",
      "computedHash": "15939a26f86edec2d4862042b8564e5a062cb81d04e047a0cea6305c8830b5f5"
    }
  }
}
JSON
printf '%s\n' "$$" >"$lock_repo/.skills-install.lock"

if (cd "$lock_repo" && bash scripts/install-skills.sh >"$lock_repo/skill-install-lock.out" 2>"$lock_repo/skill-install-lock.err"); then
  echo "FAIL: pnpm skills:install must reject concurrent restore attempts" >&2
  exit 1
fi

if [ ! -f "$lock_repo/.skills-install.lock" ]; then
  echo "FAIL: pnpm skills:install must not remove another process lock" >&2
  exit 1
fi

stale_lock_repo="$temp_repo/stale-lock-check"
mkdir -p "$stale_lock_repo/scripts" "$stale_lock_repo/bin"
cp scripts/install-skills.sh "$stale_lock_repo/scripts/"
cat >"$stale_lock_repo/skills-lock.json" <<'JSON'
{
  "version": 1,
  "skills": {
    "diagnose": {
      "source": "mattpocock/skills",
      "sourceType": "github",
      "ref": "b8be62ffacb0118fa3eaa29a0923c87c8c11985c",
      "skillPath": "skills/engineering/diagnose/SKILL.md",
      "computedHash": "15939a26f86edec2d4862042b8564e5a062cb81d04e047a0cea6305c8830b5f5"
    }
  }
}
JSON
cat >"$stale_lock_repo/bin/git" <<'SH'
#!/usr/bin/env bash
set -euo pipefail

if [ "${1:-}" = "fetch" ]; then
  echo "forced fake git fetch failure" >&2
  exit 42
fi

exit 0
SH
chmod +x "$stale_lock_repo/bin/git"
printf '{"pid":999999,"command":"pnpm skills:install"}\n' >"$stale_lock_repo/.skills-install.lock"

if (cd "$stale_lock_repo" && PATH="$stale_lock_repo/bin:$PATH" PATINA_SKILL_INSTALL_GIT_TIMEOUT_MS=not-a-number bash scripts/install-skills.sh >"$stale_lock_repo/skill-install-stale-lock.out" 2>"$stale_lock_repo/skill-install-stale-lock.err"); then
  echo "FAIL: stale-lock fixture should stop at fake git fetch failure" >&2
  exit 1
fi

if grep -q "already running" "$stale_lock_repo/skill-install-stale-lock.err"; then
  echo "FAIL: pnpm skills:install must recover a stale lock whose PID is gone" >&2
  exit 1
fi

if [ -f "$stale_lock_repo/.skills-install.lock" ]; then
  echo "FAIL: pnpm skills:install must clean up a recovered stale lock after exit" >&2
  exit 1
fi

node <<'NODE'
const lock = require("./skills-lock.json");
for (const [name, entry] of Object.entries(lock.skills || {})) {
  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(entry.source || "")) {
    throw new Error(`${name} must include a GitHub owner/repo source`);
  }

  if (!/^[0-9a-f]{40}$/i.test(entry.ref || "")) {
    throw new Error(`${name} must include an immutable 40-character ref`);
  }
}
NODE

hash_fixture="$(mktemp -d)"
mkdir -p "$hash_fixture/nested"
printf 'one\n' >"$hash_fixture/a.txt"
printf 'two\n' >"$hash_fixture/nested/b.txt"
ln -s a.txt "$hash_fixture/symlink-to-a"

actual_fixture_hash="$(node - "$hash_fixture" <<'NODE'
const { createHash } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const fixture = process.argv[2];
const files = [];

function collectFiles(baseDir, currentDir) {
  for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
    const fullPath = path.join(currentDir, entry.name);
    if (entry.isDirectory()) {
      collectFiles(baseDir, fullPath);
    } else if (entry.isFile()) {
      files.push({
        relativePath: path.relative(baseDir, fullPath).split(path.sep).join("/"),
        content: fs.readFileSync(fullPath),
      });
    }
  }
}

collectFiles(fixture, fixture);
files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

const hash = createHash("sha256");
for (const file of files) {
  hash.update(file.relativePath);
  hash.update(file.content);
}
console.log(hash.digest("hex"));
NODE
)"
rm -rf "$hash_fixture"

if [ "$actual_fixture_hash" != "e9681f55c66c75c49763c16d64ddbb695ccbed02c8f32e4355d75e58e7fc7fdf" ]; then
  echo "FAIL: skill folder hash fixture changed" >&2
  exit 1
fi

if [ "${PATINA_SKILL_INSTALL_OFFLINE:-0}" = "1" ]; then
  echo "OK: PATINA_SKILL_INSTALL_OFFLINE=1, skipped live pnpm skills:install restore"
  exit 0
fi

# This runs the real restore path because the issue requires the public install
# command to prove locked skills are restored while the committed lockfile stays
# unchanged.
before_hash="$(git hash-object skills-lock.json)"
pnpm skills:install
after_hash="$(git hash-object skills-lock.json)"

missing_skill="$(node <<'NODE'
const fs = require("fs");
const lock = require("./skills-lock.json");
for (const name of Object.keys(lock.skills || {})) {
  if (!fs.existsSync(`.agents/skills/${name}/SKILL.md`)) {
    console.log(`.agents/skills/${name}/SKILL.md`);
    process.exit(0);
  }

  if (!fs.existsSync(`.claude/skills/${name}/SKILL.md`)) {
    console.log(`.claude/skills/${name}/SKILL.md`);
    process.exit(0);
  }
}
NODE
)"

if [ -n "$missing_skill" ]; then
  echo "FAIL: pnpm skills:install did not restore locked skill path: $missing_skill" >&2
  exit 1
fi

if [ "$before_hash" != "$after_hash" ]; then
  echo "FAIL: pnpm skills:install changed skills-lock.json" >&2
  git diff -- skills-lock.json >&2
  exit 1
fi

echo "OK: pnpm skills:install restores locked skills and leaves skills-lock.json unchanged"
