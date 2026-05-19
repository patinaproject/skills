#!/usr/bin/env bash
set -euo pipefail

node scripts/verify-review-action.js
bash scripts/verify-dogfood.sh
bash scripts/verify-finish-pr-workflow.sh
bash scripts/verify-marketplace.sh
node scripts/verify-scaffold-agent-plugin-readme.js
bash scripts/verify-superteam-contract.sh
bash scripts/verify-code-review-workflow.sh
bash scripts/verify-workflow-cleanup.sh
node scripts/apply-scaffold-repository.js skills/scaffold-repository --check
