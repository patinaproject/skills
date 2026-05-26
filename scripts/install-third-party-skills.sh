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

lock_backup="$(mktemp)"
cp skills-lock.json "$lock_backup"
before_hash="$(git hash-object skills-lock.json)"

cleanup() {
  rm -f "$lock_backup"
}
trap cleanup EXIT

# `pnpm dlx skills experimental_install` reads skills-lock.json and restores all
# entries. The root lockfile records only third-party skills; in-repo skills
# (the eight `patinaproject-skills`) are not in it. This lifecycle is a
# restore-only path: if the upstream command rewrites the lockfile while
# restoring, put the committed lockfile back and fail visibly.
echo "install-third-party-skills: restoring vendored skills from skills-lock.json..."
set +e
# Test hook: lets the lifecycle test force a lockfile mutation without relying
# on current upstream `skills@latest` behavior.
if [ -n "${PATINA_SKILL_INSTALL_RESTORE_COMMAND:-}" ]; then
  "$PATINA_SKILL_INSTALL_RESTORE_COMMAND"
else
  pnpm dlx skills@latest experimental_install --yes
fi
install_status=$?
set -e

after_hash="$(git hash-object skills-lock.json)"

if [ "$before_hash" != "$after_hash" ]; then
  cp "$lock_backup" skills-lock.json
  echo "install-third-party-skills: restore command exited $install_status and mutated skills-lock.json; restored original lockfile" >&2
  exit 1
fi

if [ "$install_status" -ne 0 ]; then
  exit "$install_status"
fi

echo "install-third-party-skills: done"
