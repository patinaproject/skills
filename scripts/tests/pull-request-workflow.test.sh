#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

WORKFLOW=".github/workflows/pull-request.yml"
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
  if ! rg -n -U --pcre2 -e "$pattern" "$file" >/dev/null 2>&1; then
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
  assert_match "name: Pull Request" "$WORKFLOW"
  assert_match "pull_request:" "$WORKFLOW"
  assert_match "runs-on: blacksmith-2vcpu-ubuntu-2404" "$WORKFLOW"
  assert_match "Validate conventional commits" "$WORKFLOW"
  assert_match 'subjectPattern:.*#\[1-9\]' "$WORKFLOW"
  assert_match 'Closes #N' "$WORKFLOW"
  assert_match 'normalized=.*sanitized.*GITHUB_REPOSITORY' "$WORKFLOW"
  assert_match 'printf.*normalized' "$WORKFLOW"
  assert_no_match 'PAT-' "$WORKFLOW"
  assert_match 'Compare title `!` with breaking-change markers' "$WORKFLOW"
  assert_match "GH_TOKEN: .*github.token" "$WORKFLOW"
  assert_match "PR_NUMBER: .*github.event.pull_request.number" "$WORKFLOW"
  assert_match 'pulls/\$PR_NUMBER/commits' "$WORKFLOW"
  assert_match "commit_has_footer=false" "$WORKFLOW"
  assert_match "commit_has_footer=true" "$WORKFLOW"
  assert_match "breaking_has_footer=false" "$WORKFLOW"
  assert_match 'if \[ "\$body_has_footer" = true \] \|\| \[ "\$commit_has_footer" = true \]' "$WORKFLOW"
  assert_match 'PR commit messages include.*BREAKING CHANGE.*footer' "$WORKFLOW"
  assert_match 'Add.*to the type' "$WORKFLOW"
  assert_no_match 'Compare title `!` with body BREAKING CHANGE footer' "$WORKFLOW"

  node --input-type=commonjs - "$WORKFLOW" <<'NODE'
const fs = require('node:fs')

const workflow = fs.readFileSync(process.argv[2], 'utf8')
const lintJob = workflow.match(/^  lint:\n([\s\S]*?)(?=^  [A-Za-z0-9_-]+:|(?![\s\S]))/m)
const ifLine = lintJob?.[1].match(/^    if:\s*(.+)$/m)

if (!ifLine) {
  console.error('FAIL: could not extract jobs.lint.if from the pull request workflow')
  process.exit(1)
}

const scalar = ifLine[1].trim()
const expression = (scalar.startsWith('"') ? JSON.parse(scalar) : scalar)
  .replace(/^\$\{\{\s*/, '')
  .replace(/\s*\}\}$/, '')
  .replace(
    /github\.event\.pull_request\.labels\.\*\.name/g,
    'github.event.pull_request.labels.map((label) => label.name)',
  )

const evaluate = new Function(
  'github',
  'contains',
  'startsWith',
  `return Boolean(${expression})`,
)
const contains = (collection, value) => collection.includes(value)
const startsWith = (value, prefix) => value.startsWith(prefix)
const repository = 'patinaproject/skills'
const cases = [
  {
    name: 'same-repository release branch without label',
    headRepository: repository,
    headRef: 'release-please--branches--main--components--patinaproject-skills',
    labels: [],
    expected: false,
  },
  {
    name: 'same-repository ordinary branch',
    headRepository: repository,
    headRef: 'feature/update-workflow',
    labels: [],
    expected: true,
  },
  {
    name: 'fork release-looking branch',
    headRepository: 'contributor/skills',
    headRef: 'release-please--branches--main--components--patinaproject-skills',
    labels: [],
    expected: true,
  },
  {
    name: 'pending-label pull request',
    headRepository: repository,
    headRef: 'feature/update-workflow',
    labels: [{ name: 'autorelease: pending' }],
    expected: false,
  },
  {
    name: 'near-prefix ordinary branch',
    headRepository: repository,
    headRef: 'release-please-branches--main',
    labels: [],
    expected: true,
  },
]

let failures = 0
for (const testCase of cases) {
  const github = {
    repository,
    event: {
      pull_request: {
        head: {
          ref: testCase.headRef,
          repo: { full_name: testCase.headRepository },
        },
        labels: testCase.labels,
      },
    },
  }
  const actual = evaluate(github, contains, startsWith)
  if (actual !== testCase.expected) {
    const expected = testCase.expected ? 'run' : 'skip'
    const observed = actual ? 'run' : 'skip'
    console.error(`FAIL: ${testCase.name} should ${expected}, observed ${observed}`)
    failures += 1
  }
}

if (failures > 0) {
  console.error(`FAIL: ${failures} pull request lint classification assertion(s) failed`)
  process.exit(1)
}
NODE
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT pull request workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: pull request workflow assertions passed"
