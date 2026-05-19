#!/usr/bin/env bash
set -euo pipefail

bash scripts/verify-dogfood.sh
bash scripts/verify-finish-pr-workflow.sh
bash scripts/verify-marketplace.sh
node scripts/verify-scaffold-agent-plugin-readme.js
bash scripts/verify-superteam-contract.sh
bash scripts/verify-code-review-workflow.sh
bash scripts/verify-workflow-cleanup.sh
node scripts/apply-scaffold-repository.js skills/scaffold-repository --check

# CLI compatibility canaries: representative network-backed samples that prove
# local skill paths are accepted by the current marketplace install protocol.
run_cli_canary() {
  if command -v timeout >/dev/null 2>&1; then
    timeout 60 env npm_config_ignore_scripts=true npx skills@latest add "$1" --list
  else
    npm_config_ignore_scripts=true npx skills@latest add "$1" --list
  fi
}

run_cli_canary ./skills/scaffold-repository
run_cli_canary ./skills/install-skills
run_cli_canary ./skills/office-hours
run_cli_canary ./skills/review-action

run_cli_install_canary() {
  local repo_root tmpdir status
  repo_root="$(pwd)"
  tmpdir="$(mktemp -d)"
  set +e
  (
    set -e
    cd "$tmpdir"
    if command -v timeout >/dev/null 2>&1; then
      timeout 60 env npm_config_ignore_scripts=true npx --yes skills@latest add "$repo_root" --skill scaffold-repository install-skills --agent '*' --yes
    else
      npm_config_ignore_scripts=true npx --yes skills@latest add "$repo_root" --skill scaffold-repository install-skills --agent '*' --yes
    fi
    test -f .agents/skills/scaffold-repository/SKILL.md
    test -f .agents/skills/install-skills/SKILL.md
  )
  status=$?
  set -e
  rm -rf "$tmpdir"
  return "$status"
}

run_cli_all_skill_canary() {
  local repo_root tmpdir status
  repo_root="$(pwd)"
  tmpdir="$(mktemp -d)"
  set +e
  (
    set -e
    cd "$tmpdir"
    if command -v timeout >/dev/null 2>&1; then
      timeout 60 env npm_config_ignore_scripts=true npx --yes skills@latest add "$repo_root/skills/install-skills" --skill '*' --agent '*' --yes
    else
      npm_config_ignore_scripts=true npx --yes skills@latest add "$repo_root/skills/install-skills" --skill '*' --agent '*' --yes
    fi
    test -f .agents/skills/install-skills/SKILL.md
  )
  status=$?
  set -e
  rm -rf "$tmpdir"
  return "$status"
}

run_lockfile_restore_canary() {
  local repo_root tmpdir status
  repo_root="$(pwd)"
  tmpdir="$(mktemp -d)"
  set +e
  node -e '
const fs = require("node:fs");
const source = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
for (const entry of Object.values(source.skills)) {
  entry.source = process.argv[3];
  entry.sourceType = "local";
}
fs.writeFileSync(process.argv[2], `${JSON.stringify(source, null, 2)}\n`);
' \
    "$repo_root/skills/scaffold-repository/templates/core/skills-lock.json" \
    "$tmpdir/skills-lock.json" \
    "$repo_root" &&
  (
    set -e
    cd "$tmpdir"
    if command -v timeout >/dev/null 2>&1; then
      timeout 60 env npm_config_ignore_scripts=true npx --yes skills@latest experimental_install --yes
    else
      npm_config_ignore_scripts=true npx --yes skills@latest experimental_install --yes
    fi
    test -f .agents/skills/finish-pr/SKILL.md
    test -f .agents/skills/install-skills/SKILL.md
    test -f .agents/skills/new-branch/SKILL.md
    test -f .agents/skills/office-hours/SKILL.md
    test -f .agents/skills/plan-ceo-review/SKILL.md
    test -f .agents/skills/review-action/SKILL.md
    test -f .agents/skills/scaffold-repository/SKILL.md
    test -f .agents/skills/using-github/SKILL.md
  )
  status=$?
  set -e
  rm -rf "$tmpdir"
  return "$status"
}

run_cli_install_canary
run_cli_all_skill_canary
run_lockfile_restore_canary
