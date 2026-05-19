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
run_cli_canary ./skills/office-hours
run_cli_canary ./skills/review-action
