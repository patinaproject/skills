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

# CLI compatibility canaries: representative samples that prove local skill
# paths are accepted by the current marketplace install protocol before publishing.
npm_config_ignore_scripts=true npx skills@latest add ./skills/scaffold-repository --list
npm_config_ignore_scripts=true npx skills@latest add ./skills/review-action --list
