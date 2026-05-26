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

if [ "$install_script" != "bash scripts/install-third-party-skills.sh" ]; then
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
cp scripts/install-third-party-skills.sh "$temp_repo/scripts/"
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

if (cd "$temp_repo" && bash scripts/install-third-party-skills.sh >"$collision_out" 2>"$collision_err"); then
  echo "FAIL: pnpm skills:install must reject third-party locks that collide with in-repo skills" >&2
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
