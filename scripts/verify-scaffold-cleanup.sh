#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

require_command() {
  local command_name="$1"
  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "required command not found: $command_name"
  fi
}

assert_absent_path() {
  local path="$1"
  if [ -e "$path" ]; then
    fail "stale scaffold path still exists: $path"
  fi
}

assert_present_path() {
  local path="$1"
  if [ ! -e "$path" ]; then
    fail "live scaffold reference path is missing: $path"
  fi
}

assert_no_match() {
  local pattern="$1"
  local output
  local status
  shift
  set +e
  output="$(rg -n -e "$pattern" "$@" 2>&1)"
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    fail "stale scaffold reference matched: $pattern"
    printf '%s\n' "$output" >&2
  elif [ "$status" -ne 1 ]; then
    fail "scaffold cleanup search failed for pattern: $pattern"
    printf '%s\n' "$output" >&2
  fi
}

require_command "rg"

assert_absent_path "skills/scaffold-repository/templates"
assert_absent_path "scripts/apply-scaffold-repository.js"
assert_absent_path "scripts/verify-scaffold-agent-plugin-readme.js"

# This protects the live patinaproject/skills reference repo. It intentionally
# includes marketplace-internal verification files that are not emitted into
# generic scaffolded consumer repositories.
for live_reference_path in \
  .claude/settings.json \
  .editorconfig \
  .agents/plugins/marketplace.json \
  .github/CODEOWNERS \
  .github/ISSUE_TEMPLATE/bug_report.md \
  .github/ISSUE_TEMPLATE/feature_request.md \
  .github/actionlint.yaml \
  .github/pull_request_template.md \
  .github/workflows/actions.yml \
  .github/workflows/code-review.yml \
  .github/workflows/markdown.yml \
  .github/workflows/pull-request.yml \
  .github/workflows/release-please.yml \
  .github/workflows/verify.yml \
  .gitattributes \
  .gitignore \
  .husky/commit-msg \
  .husky/pre-commit \
  .lintstagedrc.js \
  .markdownlint.jsonc \
  .markdownlintignore \
  .nvmrc \
  AGENTS.md \
  CHANGELOG.md \
  CLAUDE.md \
  commitizen.config.json \
  commitlint.config.js \
  CONTRIBUTING.md \
  LICENSE \
  README.md \
  SECURITY.md \
  docs/file-structure.md \
  docs/release-flow.md \
  docs/wiki-index.md \
  package.json \
  scripts/install-third-party-skills.sh \
  scripts/verify-esm-tooling.sh \
  skills-lock.json
do
  assert_present_path "$live_reference_path"
done

assert_no_match "apply:scaffold-repository|apply-scaffold-repository|scaffold-repository self-apply" \
  AGENTS.md CLAUDE.md README.md docs package.json .github/workflows \
  scripts/install-third-party-skills.sh scripts/test.sh \
  scripts/verify-code-review-workflow.sh scripts/verify-dogfood.sh \
  scripts/verify-finish-pr-workflow.sh scripts/verify-marketplace.sh \
  scripts/verify-superteam-contract.sh scripts/verify-workflow-cleanup.sh \
  skills/scaffold-repository

assert_no_match "skills/scaffold-repository/templates|skills/bootstrap/templates|\\.tmpl" \
  AGENTS.md CLAUDE.md README.md docs package.json .github/workflows \
  scripts/install-third-party-skills.sh scripts/test.sh \
  scripts/verify-code-review-workflow.sh scripts/verify-dogfood.sh \
  scripts/verify-finish-pr-workflow.sh scripts/verify-marketplace.sh \
  scripts/verify-superteam-contract.sh scripts/verify-workflow-cleanup.sh \
  skills/scaffold-repository

assert_no_match "Cursor|Windsurf|Continue\\.dev|\\.cursor/|\\.windsurfrules|\\.continue/" \
  skills/scaffold-repository

assert_no_match "skills@[0-9]+\\.[0-9]+\\.[0-9]+" \
  README.md docs/release-flow.md .github/workflows/verify.yml

assert_no_match "obra/superpowers" \
  AGENTS.md skills/scaffold-repository/SKILL.md skills/scaffold-repository/audit-checklist.md

assert_no_match "#cursor|#windsurf|#github-copilot|#continuedev" \
  skills/scaffold-repository/README.md

assert_no_match "scripts/(test|verify-code-review-workflow|verify-dogfood|verify-finish-pr-workflow|verify-marketplace|verify-scaffold-cleanup|verify-superteam-contract|verify-workflow-cleanup)\\.sh" \
  skills/scaffold-repository/SKILL.md skills/scaffold-repository/audit-checklist.md

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT scaffold cleanup assertion(s) failed" >&2
  exit 1
fi

echo "OK: scaffold cleanup assertions passed"
