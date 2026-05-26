#!/usr/bin/env bash
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

# This test intentionally exercises the real restore path. It requires network
# access because `skills@latest experimental_install` is the temporary
# lockfile-restore mechanism behind the public lifecycle command.
before_hash="$(git hash-object skills-lock.json)"
pnpm skills:install
after_hash="$(git hash-object skills-lock.json)"

if [ "$before_hash" != "$after_hash" ]; then
  echo "FAIL: pnpm skills:install changed skills-lock.json" >&2
  git diff -- skills-lock.json >&2
  exit 1
fi

echo "OK: pnpm skills:install leaves skills-lock.json unchanged"
