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

locked_skill_count="$(node -e "const lock = require('./skills-lock.json'); console.log(Object.keys(lock.skills || {}).length)")"

if [ "$locked_skill_count" = "0" ]; then
  echo "install-third-party-skills: skills-lock.json has no skills, nothing to do"
  exit 0
fi

before_hash="$(git hash-object skills-lock.json)"
stage_dir="$(mktemp -d)"
cp skills-lock.json "$stage_dir/skills-lock.json"

cleanup() {
  rm -rf "$stage_dir"
}
trap cleanup EXIT

# `pnpm dlx skills experimental_install` reads skills-lock.json and restores all
# entries. The root lockfile records only third-party skills; in-repo skills
# (the eight `patinaproject-skills`) are not in it. This lifecycle is a
# restore-only path: if the upstream command rewrites the lockfile while
# restoring, fail without promoting the generated overlay into the repository.
echo "install-third-party-skills: restoring vendored skills from skills-lock.json..."
set +e
(
  cd "$stage_dir"
  # Test hook: lets the lifecycle test force a lockfile mutation without relying
  # on current upstream `skills@latest` behavior.
  if [ -n "${PATINA_SKILL_INSTALL_RESTORE_COMMAND:-}" ]; then
    "$PATINA_SKILL_INSTALL_RESTORE_COMMAND"
  else
    pnpm dlx skills@latest experimental_install --yes
  fi
)
install_status=$?
set -e

after_hash="$(git hash-object "$stage_dir/skills-lock.json")"

if [ "$before_hash" != "$after_hash" ]; then
  echo "install-third-party-skills: restore command exited $install_status and attempted to mutate skills-lock.json; generated overlay was not promoted" >&2
  exit 1
fi

if [ "$install_status" -ne 0 ]; then
  exit "$install_status"
fi

node -e "const lock = require('./skills-lock.json'); for (const name of Object.keys(lock.skills || {})) console.log(name)" |
while IFS= read -r skill_name; do
  if [ ! -f "$stage_dir/.agents/skills/$skill_name/SKILL.md" ]; then
    echo "install-third-party-skills: restored overlay is missing locked skill: $skill_name" >&2
    exit 1
  fi

  mkdir -p .agents/skills
  rm -rf ".agents/skills/$skill_name"
  cp -R "$stage_dir/.agents/skills/$skill_name" ".agents/skills/$skill_name"
done

echo "install-third-party-skills: done"
