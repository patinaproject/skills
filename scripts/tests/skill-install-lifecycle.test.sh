#!/usr/bin/env bash
# Validate the committed-skill lifecycle: vendored third-party skills are
# committed to the repo, restored on demand by the upstream skills CLI
# (`pnpm skills:install` -> `skills experimental_install`), and never pruned by
# `pnpm clean`. This test is static plus a clean.sh sandbox; the network-backed
# install behavior is covered by the CLI canaries in suite.test.sh.
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

# --- package.json script shape -------------------------------------------------
postinstall_script="$(node -e "console.log(require('./package.json').scripts.postinstall || '')")"
install_script="$(node -e "console.log(require('./package.json').scripts['skills:install'] || '')")"
refresh_script="$(node -e "console.log(require('./package.json').scripts['skills:refresh'] || '')")"
restore_script="$(node -e "console.log(require('./package.json').scripts['skills:restore'] || '')")"
env_setup_script="$(node -e "console.log(require('./package.json').scripts['env:setup'] || '')")"
clean_script="$(node -e "console.log(require('./package.json').scripts.clean || '')")"

if [ -n "$postinstall_script" ]; then
  echo "FAIL: package.json must not auto-restore committed skills via postinstall" >&2
  exit 1
fi

if [ "$install_script" != "pnpm dlx skills@latest experimental_install --yes" ]; then
  echo "FAIL: package.json skills:install must run the upstream skills experimental_install" >&2
  exit 1
fi

if [ -n "$refresh_script" ]; then
  echo "FAIL: package.json must not expose the retired skills:refresh script" >&2
  exit 1
fi

if [ -n "$restore_script" ]; then
  echo "FAIL: package.json must not expose the retired skills:restore script" >&2
  exit 1
fi

if [ "$env_setup_script" != "pnpm install" ]; then
  echo "FAIL: package.json env:setup must install dev tooling" >&2
  exit 1
fi

if [ "$clean_script" != "bash scripts/clean.sh" ]; then
  echo "FAIL: package.json clean must run the project cleanup implementation" >&2
  exit 1
fi

# The custom restore script is retired; experimental_install owns restoration.
if [ -e scripts/install-skills.sh ]; then
  echo "FAIL: scripts/install-skills.sh must be removed in favor of skills experimental_install" >&2
  exit 1
fi

if [ ! -f skills-lock.json ]; then
  echo "OK: no skills-lock.json; committed-skill lifecycle has nothing to validate"
  exit 0
fi

# --- skills-lock.json shape ----------------------------------------------------
# experimental_install restores from the lockfile by cloning each source's
# default branch (latest), so entries pin a GitHub source but no immutable ref.
node <<'NODE'
const lock = require("./skills-lock.json");
for (const [name, entry] of Object.entries(lock.skills || {})) {
  if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(entry.source || "")) {
    throw new Error(`${name} must include a GitHub owner/repo source`);
  }
  if (entry.sourceType !== "github") {
    throw new Error(`${name} must declare sourceType "github"`);
  }
  if (typeof entry.skillPath !== "string" || !entry.skillPath.endsWith("SKILL.md")) {
    throw new Error(`${name}.skillPath must point to a SKILL.md file`);
  }
}
NODE

locked_skill_count="$(node -e "const lock = require('./skills-lock.json'); console.log(Object.keys(lock.skills || {}).length)")"
if [ "$locked_skill_count" = "0" ]; then
  echo "OK: skills-lock.json has no locked skills; committed-skill lifecycle has nothing to validate"
  exit 0
fi

# --- committed overlay layout (real repo) -------------------------------------
# Each locked skill is committed as a real directory under .agents/skills and a
# relative symlink under .claude/skills pointing at the shared payload.
node <<'NODE'
const fs = require("fs");
const path = require("path");
const lock = require("./skills-lock.json");

for (const name of Object.keys(lock.skills || {})) {
  const agentPath = path.join(".agents", "skills", name);
  const claudePath = path.join(".claude", "skills", name);

  const agentStat = fs.lstatSync(agentPath);
  if (agentStat.isSymbolicLink() || !agentStat.isDirectory()) {
    throw new Error(`${agentPath} must be a committed real directory`);
  }
  if (!fs.existsSync(path.join(agentPath, "SKILL.md"))) {
    throw new Error(`${agentPath}/SKILL.md must be committed`);
  }

  const claudeStat = fs.lstatSync(claudePath);
  if (!claudeStat.isSymbolicLink()) {
    throw new Error(`${claudePath} must be a symlink`);
  }
  const target = fs.readlinkSync(claudePath);
  const expectedTarget = path.relative(path.dirname(claudePath), agentPath).split(path.sep).join("/");
  if (path.isAbsolute(target) || target !== expectedTarget) {
    throw new Error(`${claudePath} must link to ${expectedTarget}, got ${target}`);
  }
  if (!fs.existsSync(path.join(claudePath, "SKILL.md"))) {
    throw new Error(`${claudePath}/SKILL.md must be readable through the symlink`);
  }
}
NODE

# --- clean.sh sandbox ----------------------------------------------------------
# clean removes generated dependency and transient install files only; it must
# never prune the committed skill overlays or rewrite in-repo overlay symlinks.
temp_repo="$(mktemp -d)"
cleanup() {
  rm -rf "$temp_repo"
}
trap cleanup EXIT

clean_repo="$temp_repo/clean-check"
mkdir -p \
  "$clean_repo/scripts" \
  "$clean_repo/node_modules/example" \
  "$clean_repo/skills/in-repo" \
  "$clean_repo/.agents/skills" \
  "$clean_repo/.agents/skills/third-party" \
  "$clean_repo/.claude/skills" \
  "$clean_repo/.claude/skills/third-party"
cp scripts/clean.sh "$clean_repo/scripts/"
printf '# in repo\n' >"$clean_repo/skills/in-repo/SKILL.md"
ln -s ../../skills/in-repo "$clean_repo/.agents/skills/in-repo"
ln -s ../../skills/in-repo "$clean_repo/.claude/skills/in-repo"
printf '# third party\n' >"$clean_repo/.agents/skills/third-party/SKILL.md"
printf '# third party\n' >"$clean_repo/.claude/skills/third-party/SKILL.md"
printf 'lock\n' >"$clean_repo/.skills-install.lock"
printf 'lock\n' >"$clean_repo/.skills-install.lock.1234-deadbeef.tmp"

(cd "$clean_repo" && bash scripts/clean.sh >clean.out)

if [ -e "$clean_repo/node_modules" ] ||
  [ -e "$clean_repo/.skills-install.lock" ] ||
  [ -e "$clean_repo/.skills-install.lock.1234-deadbeef.tmp" ]; then
  echo "FAIL: pnpm clean must remove generated dependency and transient install files" >&2
  exit 1
fi

if [ ! -e "$clean_repo/.agents/skills/third-party/SKILL.md" ] ||
  [ ! -e "$clean_repo/.claude/skills/third-party/SKILL.md" ]; then
  echo "FAIL: pnpm clean must preserve committed third-party skill overlays" >&2
  exit 1
fi

node - "$clean_repo" <<'NODE'
const fs = require("fs");
const path = require("path");

const repo = process.argv[2];
for (const overlayRoot of [".agents/skills", ".claude/skills"]) {
  const overlayPath = path.join(repo, overlayRoot, "in-repo");
  if (!fs.lstatSync(overlayPath).isSymbolicLink()) {
    throw new Error(`${overlayPath} must remain a symlink after clean`);
  }

  const target = fs.readlinkSync(overlayPath);
  if (target !== "../../skills/in-repo") {
    throw new Error(`${overlayPath} target changed to ${target}`);
  }
}
NODE

echo "OK: committed-skill lifecycle (package scripts, overlays, clean) validated"
