#!/usr/bin/env bash
set -euo pipefail

bash scripts/tests/dogfood.test.sh
bash scripts/tests/esm-tooling.test.sh
bash scripts/tests/marketplace.test.sh
bash scripts/tests/pull-request-workflow.test.sh
bash scripts/tests/pr-readiness-provenance.test.sh
bash scripts/tests/skill-install-lifecycle.test.sh
bash scripts/tests/worktree-setup.test.sh
bash scripts/tests/scaffold-cleanup.test.sh
bash scripts/tests/workflow-cleanup.test.sh
bash scripts/tests/write-docs-format-sync.test.sh

# CLI compatibility canaries: representative network-backed samples that prove
# local skill paths are accepted by the current marketplace install protocol.
run_cli_canary() {
  local output
  if [ "${2:-}" = "" ]; then
    if command -v timeout >/dev/null 2>&1; then
      COLUMNS=240 timeout 60 env npm_config_ignore_scripts=true npx skills@latest add "$1" --list
    else
      COLUMNS=240 npm_config_ignore_scripts=true npx skills@latest add "$1" --list
    fi
    return
  fi

  if command -v timeout >/dev/null 2>&1; then
    output="$(COLUMNS=240 timeout 60 env npm_config_ignore_scripts=true npx skills@latest add "$1" --list 2>&1)"
  else
    output="$(COLUMNS=240 npm_config_ignore_scripts=true npx skills@latest add "$1" --list 2>&1)"
  fi
  printf '%s\n' "$output"
  if ! printf '%s\n' "$output" | grep -Fq "$2"; then
    echo "FAIL: CLI canary for '$1' did not display expected text: $2" >&2
    return 1
  fi
}

run_cli_canary ./skills/scaffold-repository
run_cli_canary ./skills/install-skills
run_cli_canary ./skills/update-branch
run_cli_canary ./skills/develop 'develop'
run_cli_canary ./skills/codex-pr-feedback-loop 'codex-pr-feedback-loop'

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

run_cli_install_canary
run_cli_all_skill_canary
