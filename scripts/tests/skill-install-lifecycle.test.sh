#!/usr/bin/env bash
# This test intentionally runs the public lifecycle command, so it is
# network-backed while the upstream lockfile restore path is
# `skills@latest experimental_install`.
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

locked_skill="$(node -e "const lock = require('./skills-lock.json'); console.log(Object.keys(lock.skills || {})[0] || '')")"

if [ -z "$locked_skill" ]; then
  echo "OK: skills-lock.json has no locked skills, lifecycle install has nothing to restore"
  exit 0
fi

# This runs the real restore path because the issue requires the public install
# command to prove the current `skills@latest experimental_install` workaround
# leaves the committed lockfile unchanged.
before_hash="$(git hash-object skills-lock.json)"
pnpm skills:install
after_hash="$(git hash-object skills-lock.json)"

if [ ! -f ".agents/skills/$locked_skill/SKILL.md" ]; then
  echo "FAIL: pnpm skills:install did not restore locked skill: $locked_skill" >&2
  exit 1
fi

if [ "$before_hash" != "$after_hash" ]; then
  echo "FAIL: pnpm skills:install changed skills-lock.json" >&2
  git diff -- skills-lock.json >&2
  exit 1
fi

temp_repo="$(mktemp -d)"
mkdir -p "$temp_repo/scripts"
cp package.json skills-lock.json "$temp_repo/"
cp scripts/install-third-party-skills.sh "$temp_repo/scripts/"

cleanup() {
  rm -rf "$temp_repo"
}
trap cleanup EXIT

(
  cd "$temp_repo"
  cat > mutate-lockfile.sh <<'SH'
#!/usr/bin/env bash
set -euo pipefail
node <<'NODE'
const fs = require("fs");
const lock = require("./skills-lock.json");
const names = Object.keys(lock.skills || {});

if (names.length < 2) {
  process.exit(0);
}

lock.skills[names[0]].computedHash = lock.skills[names[1]].computedHash;
fs.writeFileSync("skills-lock.json", JSON.stringify(lock, null, 2) + "\n");
NODE
SH
  chmod +x mutate-lockfile.sh

  stale_hash="$(git hash-object skills-lock.json)"
  set +e
  PATINA_SKILL_INSTALL_RESTORE_COMMAND="$temp_repo/mutate-lockfile.sh" \
    bash scripts/install-third-party-skills.sh >/tmp/skill-install-lifecycle-stale.out 2>/tmp/skill-install-lifecycle-stale.err
  stale_status=$?
  set -e
  guarded_hash="$(git hash-object skills-lock.json)"

  if [ "$stale_status" -eq 0 ]; then
    echo "FAIL: stale skills-lock.json restore should fail instead of updating the lockfile" >&2
    exit 1
  fi

  if [ "$stale_hash" != "$guarded_hash" ]; then
    echo "FAIL: stale skills-lock.json guard did not restore the original lockfile" >&2
    exit 1
  fi
)

echo "OK: pnpm skills:install restores locked skills and leaves skills-lock.json unchanged"
