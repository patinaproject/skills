#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

WORKFLOW=".github/workflows/claude-review.yml"
FAIL_COUNT=0

fail() {
  echo "FAIL: $1" >&2
  FAIL_COUNT=$((FAIL_COUNT + 1))
}

assert_file() {
  local file="$1"
  test -f "$file" || fail "missing expected file: $file"
}

assert_match() {
  local pattern="$1"
  local file="$2"
  if ! rg -n --pcre2 -e "$pattern" "$file" >/dev/null 2>&1; then
    fail "missing expected pattern in $file: $pattern"
  fi
}

assert_no_match() {
  local pattern="$1"
  local file="$2"
  if rg -n --pcre2 -e "$pattern" "$file" >/dev/null 2>&1; then
    fail "unexpected pattern in $file: $pattern"
  fi
}

assert_file "$WORKFLOW"

if [ -f "$WORKFLOW" ]; then
  assert_match "pull_request:" "$WORKFLOW"
  assert_match "types: \\[opened, synchronize, reopened, ready_for_review\\]" "$WORKFLOW"
  assert_no_match "pull_request_target:" "$WORKFLOW"
  assert_match "contents: read" "$WORKFLOW"
  assert_match "pull-requests: write" "$WORKFLOW"
  assert_match "issues: write" "$WORKFLOW"
  assert_no_match "contents: write" "$WORKFLOW"
  assert_match "runs-on: blacksmith-2vcpu-ubuntu-2404" "$WORKFLOW"
  assert_match "github\\.event\\.pull_request\\.draft == false" "$WORKFLOW"
  assert_match "github\\.event\\.pull_request\\.head\\.repo\\.fork == false" "$WORKFLOW"
  assert_match "github\\.event\\.pull_request\\.user\\.login != 'dependabot\\[bot\\]'" "$WORKFLOW"
  assert_match "claude-review\\.yml" "$WORKFLOW"
  assert_match "CLAUDE_CODE_OAUTH_TOKEN" "$WORKFLOW"
  assert_no_match "ANTHROPIC_API_KEY|RELEASE_PLEASE_TOKEN|NPM_TOKEN|GITHUB_TOKEN:" "$WORKFLOW"
  assert_match "# anthropics/claude-code-action@v1" "$WORKFLOW"
  assert_match "uses: anthropics/claude-code-action@[0-9a-f]{40}" "$WORKFLOW"
  assert_match "include_fix_links: false" "$WORKFLOW"
  assert_match "display_report: false" "$WORKFLOW"
  assert_match "show_full_output: false" "$WORKFLOW"
  assert_match "--disallowedTools \".*Edit.*MultiEdit.*Write.*Bash.*\"" "$WORKFLOW"
fi

assert_match "blacksmith-2vcpu-ubuntu-2404" .github/actionlint.yaml
assert_match "blacksmith-2vcpu-ubuntu-2404" skills/scaffold-repository/templates/core/.github/actionlint.yaml
assert_no_match "runs-on: ubuntu-latest" .github/workflows/actions.yml
assert_no_match "runs-on: ubuntu-latest" .github/workflows/markdown.yml
assert_no_match "runs-on: ubuntu-latest" .github/workflows/pull-request.yml
assert_no_match "runs-on: ubuntu-latest" .github/workflows/verify.yml
assert_no_match "runs-on: ubuntu-latest" .github/workflows/release-please.yml
assert_no_match "runs-on: ubuntu-latest" skills/scaffold-repository/templates/core/.github/workflows/actions.yml
assert_no_match "runs-on: ubuntu-latest" skills/scaffold-repository/templates/core/.github/workflows/pull-request.yml

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT Claude review workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: Claude review workflow assertions passed"
