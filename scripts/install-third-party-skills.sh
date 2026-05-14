#!/usr/bin/env bash
# install-third-party-skills.sh
#
# Restore the third-party vendored skills recorded in `skills-lock.json`.
# Run automatically as a pnpm `postinstall` hook (and on demand via
# `pnpm skills:install`). Idempotent — re-runs are a no-op when the skills
# are already present.
#
# Why this script exists: the five in-repo `patinaproject-skills` are tracked
# in `skills/<name>/`; third-party skills (obra/superpowers, openai/skills,
# anthropics/claude-code, mattpocock/skills, vercel-labs/skills) are tracked
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

# `npx skills experimental_install` reads skills-lock.json and restores all
# entries. The lockfile records only third-party skills; in-repo skills
# (the five `patinaproject-skills`) are not in it.
echo "install-third-party-skills: restoring vendored skills from skills-lock.json..."
npx --yes skills@latest experimental_install --yes
echo "install-third-party-skills: done"
