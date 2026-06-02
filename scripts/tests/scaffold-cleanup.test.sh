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
assert_absent_path ".github/ISSUE_TEMPLATE/bug_report.md"
assert_absent_path ".github/ISSUE_TEMPLATE/feature_request.md"
assert_absent_path "scripts/install-skills.sh"

# This protects the live patinaproject/skills reference repo. Some files below
# are marketplace-internal verification files, while the skill installation
# lifecycle files are now part of the generic scaffold baseline.
for live_reference_path in \
  .claude/settings.json \
  .codex/environments/environment.toml \
  .editorconfig \
  .agents/plugins/marketplace.json \
  .github/CODEOWNERS \
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
  CONTRIBUTING.md \
  LICENSE \
  README.md \
  SECURITY.md \
  commitizen.config.json \
  commitlint.config.js \
  docs/file-structure.md \
  docs/release-flow.md \
  docs/wiki-index.md \
  package.json \
  scripts/clean.sh \
  scripts/worktree-setup.sh \
  scripts/tests/code-review-workflow.test.sh \
  scripts/tests/dogfood.test.sh \
  scripts/tests/esm-tooling.test.sh \
  scripts/tests/marketplace.test.sh \
  scripts/tests/pull-request-workflow.test.sh \
  scripts/tests/scaffold-cleanup.test.sh \
  scripts/tests/skill-install-lifecycle.test.sh \
  scripts/tests/suite.test.sh \
  scripts/tests/workflow-cleanup.test.sh \
  skills-lock.json
do
  assert_present_path "$live_reference_path"
done

test_files=()
for test_file in scripts/tests/*.test.sh; do
  if [ "$test_file" != "scripts/tests/scaffold-cleanup.test.sh" ]; then
    test_files+=("$test_file")
  fi
done

# Per the "no tests on documentation content" rule (docs/adr/0001), this test
# asserts only on filesystem state and non-`.md` config/code targets. Stale
# scaffold references inside skill prose are covered by `lint:md`, not here.
assert_no_match "apply:scaffold-repository|apply-scaffold-repository|scaffold-repository self-apply" \
  package.json .github/workflows \
  "${test_files[@]}"

assert_no_match "skills/scaffold-repository/templates|skills/bootstrap/templates|\\.tmpl" \
  package.json .github/workflows \
  "${test_files[@]}"

assert_no_match "skills@[0-9]+\\.[0-9]+\\.[0-9]+" \
  .github/workflows/verify.yml

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT scaffold cleanup assertion(s) failed" >&2
  exit 1
fi

echo "OK: scaffold cleanup assertions passed"
