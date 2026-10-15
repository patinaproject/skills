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

closing_check_script() {
  awk '
    /^      - name: Check for closing keyword in PR body$/ { step = 1; next }
    step && /^        run: \|$/ { run = 1; next }
    run && /^      - name:/ { exit }
    run { sub(/^          /, ""); print }
  ' "$WORKFLOW"
}

run_closing_check() {
  local body="$1"
  closing_check_script | env \
    PR_BODY="$body" \
    GITHUB_REPOSITORY="patinaproject/skills" \
    bash >/dev/null 2>&1
}

assert_file "$WORKFLOW"
READINESS_WORKFLOW=".github/workflows/pr-readiness.yml"
assert_file "$READINESS_WORKFLOW"
if [ -f "$READINESS_WORKFLOW" ]; then
  assert_match '^  pull_request_target:' "$READINESS_WORKFLOW"
  assert_match '^permissions: \{\}$' "$READINESS_WORKFLOW"
  node --input-type=commonjs - "$READINESS_WORKFLOW" <<'NODE'
const fs = require('node:fs')
const path = require('node:path')
const lines = fs.readFileSync(process.argv[2], 'utf8').split('\n')
const start = lines.findIndex((line) => /^on:\s*$/.test(line))
const events = []
for (const line of lines.slice(start + 1)) {
  if (/^\S/.test(line)) break
  const match = line.match(/^  ([a-z_]+):/)
  if (match) events.push(match[1])
}
if (JSON.stringify(events) !== JSON.stringify(['pull_request_target', 'workflow_run'])) {
  console.error(`FAIL: pr-readiness.yml must trigger only on pull_request_target and workflow_run, found: ${events.join(', ')}`)
  process.exit(1)
}
const unquote = (value) => value.trim().replace(/^(['"])(.*)\1$/, '$2')
const listed = lines.join('\n').match(/^    workflows:\s*\[(.*)\]\s*$/m)
if (!listed) {
  console.error('FAIL: pr-readiness.yml workflow_run.workflows must be an inline list')
  process.exit(1)
}
const names = new Set()
for (const file of fs.readdirSync('.github/workflows').filter((name) => /\.ya?ml$/.test(name))) {
  const match = fs.readFileSync(path.join('.github/workflows', file), 'utf8').match(/^name:\s*(.+?)\s*$/m)
  if (match) names.add(unquote(match[1]))
}
const missing = listed[1].split(',').map(unquote).filter((name) => !names.has(name))
if (missing.length) {
  console.error(`FAIL: workflow_run.workflows names no workflow: ${missing.join(', ')}`)
  process.exit(1)
}
NODE
  assert_no_match 'schedule:' "$READINESS_WORKFLOW"
  assert_no_match 'repository_dispatch' "$READINESS_WORKFLOW"
  assert_no_match 'download-artifact' "$READINESS_WORKFLOW"
  assert_no_match '^\s*ref:.*(pull_request\.head|head\.sha|head\.ref|head_sha)' "$READINESS_WORKFLOW"
  node --input-type=commonjs - "$READINESS_WORKFLOW" <<'NODE'
const fs = require('node:fs')
const lines = fs.readFileSync(process.argv[2], 'utf8').split('\n')
const owners = []
let job = null
let inJobs = false
lines.forEach((line) => {
  if (/^\S/.test(line)) { inJobs = /^jobs:\s*$/.test(line); job = null }
  const jobMatch = inJobs && line.match(/^  ([A-Za-z0-9_-]+):\s*$/)
  if (jobMatch) job = jobMatch[1]
  if (/^\s*statuses:\s*write\b/.test(line)) owners.push(job ?? 'workflow')
})
if (JSON.stringify(owners) !== JSON.stringify(['gate'])) {
  console.error(`FAIL: statuses: write must appear only under jobs.gate, found under: ${owners.join(', ') || 'nothing'}`)
  process.exit(1)
}
NODE
fi

RELAY_WORKFLOW=".github/workflows/pr-readiness-review.yml"
assert_file "$RELAY_WORKFLOW"
if [ -f "$RELAY_WORKFLOW" ]; then
  assert_match '^permissions: \{\}$' "$RELAY_WORKFLOW"
  assert_match '^  pull_request_review:' "$RELAY_WORKFLOW"
  assert_no_match 'actions/checkout' "$RELAY_WORKFLOW"
fi

node --input-type=commonjs <<'NODE'
const fs = require('node:fs')
const path = require('node:path')
const policy = JSON.parse(fs.readFileSync('.github/pr-readiness.json', 'utf8'))
const jobNames = new Set()
for (const file of fs.readdirSync('.github/workflows').filter((name) => /\.ya?ml$/.test(name))) {
  for (const match of fs.readFileSync(path.join('.github/workflows', file), 'utf8').matchAll(/^    name:\s*(.+?)\s*$/gm)) jobNames.add(match[1].replace(/^(['"])(.*)\1$/, '$2'))
}
const stray = Object.entries(policy.obligations).flatMap(([obligation, spec]) =>
  (spec.checks ?? []).filter((check) => !jobNames.has(check)).map((check) => `${obligation}: "${check}"`))
if (stray.length) {
  console.error(`FAIL: .github/pr-readiness.json names checks no workflow job produces: ${stray.join(', ')}`)
  process.exit(1)
}
NODE

if rg -n '"pr",[[:space:]]*"ready"|gh pr ready|origin pr ready' plugins/engineering/skills \
  --glob '*.ts' --glob '*.mjs' --glob '*.sh' --glob '*.md' \
  --glob '!**/pr-readiness/scripts/adapters.ts' --glob '!**/patina-mode/playbooks/opening-a-pr.md' >/dev/null 2>&1; then
  fail "direct forge ready transition found outside pr-readiness adapters"
fi

node --input-type=commonjs <<'NODE'
const fs = require('node:fs')
const path = require('node:path')

const workflowDirectory = '.github/workflows'
const requiredContexts = [
  'Check diff hygiene',
  'Lint Actions workflows',
  'Lint Markdown',
  'Unit tests',
  'Validate pull request',
  'Verify skill overlay',
]

const indentation = (line) => line.match(/^\s*/)[0].length

const findPullRequestEvent = (workflow) => {
  const lines = workflow.split('\n')
  const onIndex = lines.findIndex((line) => /^on:\s*$/.test(line))
  if (onIndex === -1) return null

  const onIndent = indentation(lines[onIndex])
  const followingLines = lines.slice(onIndex + 1)
  const onEnd = followingLines.findIndex((line) => {
    const trimmed = line.trim()
    return trimmed !== '' && !trimmed.startsWith('#') && indentation(line) <= onIndent
  })
  const onBlock = onEnd === -1 ? followingLines : followingLines.slice(0, onEnd)
  const eventLines = onBlock.filter((line) => {
    const trimmed = line.trim()
    return trimmed !== '' && !trimmed.startsWith('#')
  })
  if (eventLines.length === 0) return null

  const eventIndent = Math.min(...eventLines.map(indentation))
  const pullRequestIndex = onBlock.findIndex((line) => (
    indentation(line) === eventIndent && /^pull_request\s*:/.test(line.trim())
  ))
  if (pullRequestIndex === -1) return null

  const eventLine = onBlock[pullRequestIndex]
  const inlineValue = eventLine.trim().replace(/^pull_request\s*:\s*/, '')
  const eventFollowingLines = onBlock.slice(pullRequestIndex + 1)
  const eventEnd = eventFollowingLines.findIndex((line) => {
    const trimmed = line.trim()
    return trimmed !== '' && !trimmed.startsWith('#') && indentation(line) <= eventIndent
  })

  return {
    inlineValue,
    block: eventEnd === -1
      ? eventFollowingLines
      : eventFollowingLines.slice(0, eventEnd),
  }
}

const pathFilterKey = /^['"]?paths(?:-ignore)?['"]?\s*:/
const hasPullRequestPathFilter = (event) => {
  if (!event) return false
  const inlineEntries = event.inlineValue
    .replace(/^\{\s*/, '')
    .replace(/\s*\}$/, '')
    .split(',')

  return inlineEntries.some((entry) => pathFilterKey.test(entry.trim()))
    || event.block.some((line) => pathFilterKey.test(line.trim()))
}

const pathFilterCases = [
  {
    name: 'inline paths filter',
    workflow: 'on:\n  pull_request: { paths: ["skills/**"] }\n',
    expected: true,
  },
  {
    name: 'deeply indented paths-ignore filter',
    workflow: 'on:\n    pull_request:\n        paths-ignore:\n          - "docs/**"\n',
    expected: true,
  },
  {
    name: 'event types without path filtering',
    workflow: 'on:\n  pull_request:\n    types: [opened, synchronize]\n',
    expected: false,
  },
]

for (const testCase of pathFilterCases) {
  const actual = hasPullRequestPathFilter(findPullRequestEvent(testCase.workflow))
  if (actual !== testCase.expected) {
    console.error(`FAIL: ${testCase.name} path-filter classification was ${actual}`)
    process.exit(1)
  }
}

const workflowFiles = fs.readdirSync(workflowDirectory)
  .filter((file) => /\.ya?ml$/.test(file))
  .map((file) => path.join(workflowDirectory, file))
  .filter((file) => findPullRequestEvent(fs.readFileSync(file, 'utf8')) !== null)

const jobs = []
for (const file of workflowFiles) {
  const lines = fs.readFileSync(file, 'utf8').split('\n')
  const jobsIndex = lines.findIndex((line) => /^jobs:\s*$/.test(line))
  if (jobsIndex === -1) {
    console.error(`FAIL: pull request workflow has no jobs block: ${file}`)
    process.exit(1)
  }

  const jobsBlock = lines.slice(jobsIndex + 1)
  const jobsEnd = jobsBlock.findIndex((line) => /^\S/.test(line))
  const jobLines = jobsEnd === -1 ? jobsBlock : jobsBlock.slice(0, jobsEnd)

  for (let index = 0; index < jobLines.length; index += 1) {
    const jobMatch = jobLines[index].match(/^  ([A-Za-z0-9_-]+):\s*$/)
    if (!jobMatch) continue

    const nextJobOffset = jobLines.slice(index + 1).findIndex((line) => /^  [A-Za-z0-9_-]+:\s*$/.test(line))
    const endIndex = nextJobOffset === -1 ? jobLines.length : index + 1 + nextJobOffset
    const nameLine = jobLines.slice(index + 1, endIndex).find((line) => /^    name:\s*\S/.test(line))
    if (!nameLine) {
      console.error(`FAIL: pull request job has no display name: ${file} jobs.${jobMatch[1]}`)
      process.exit(1)
    }

    const name = nameLine.replace(/^    name:\s*/, '').trim()
    jobs.push({ file, id: jobMatch[1], name })
  }
}

let failures = 0
const jobsByName = new Map()
for (const job of jobs) {
  const matchingJobs = jobsByName.get(job.name) ?? []
  matchingJobs.push(job)
  jobsByName.set(job.name, matchingJobs)
}

for (const file of workflowFiles) {
  const event = findPullRequestEvent(fs.readFileSync(file, 'utf8'))
  if (hasPullRequestPathFilter(event)) {
    console.error(`FAIL: required check workflow filters pull requests by path: ${file}`)
    failures += 1
  }
}

for (const [name, matchingJobs] of jobsByName) {
  if (matchingJobs.length < 2) continue
  const locations = matchingJobs.map((job) => `${job.file} jobs.${job.id}`).join(', ')
  console.error(`FAIL: duplicate pull request job display name "${name}": ${locations}`)
  failures += 1
}

const actualContexts = [...jobsByName.keys()].sort()
const expectedContexts = [...requiredContexts].sort()
if (JSON.stringify(actualContexts) !== JSON.stringify(expectedContexts)) {
  console.error('FAIL: pull request job display names do not match the required contexts')
  console.error(`  expected: ${expectedContexts.join(', ')}`)
  console.error(`  actual:   ${actualContexts.join(', ')}`)
  failures += 1
}

if (failures > 0) {
  console.error(`FAIL: ${failures} required check context assertion(s) failed`)
  process.exit(1)
}
NODE

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

OPENING_BODY='## Why

Use one pull request body contract.

## Scope

Closes #445

## Blast Radius

Pull request authors use the opening-a-pr sections.

## Verification

The closing-reference check accepts this body.'

if ! run_closing_check "$OPENING_BODY"; then
  fail "opening-a-pr body with a closing reference failed the workflow check"
fi

BODY_WITHOUT_CLOSE='## Why

Use one pull request body contract.

## Scope

Retire the old headings.

## Blast Radius

Pull request authors use the opening-a-pr sections.

## Verification

The closing-reference check rejects this body.'

if run_closing_check "$BODY_WITHOUT_CLOSE"; then
  fail "opening-a-pr body without a closing reference passed the workflow check"
fi

if [ "$FAIL_COUNT" -gt 0 ]; then
  echo "" >&2
  echo "FAIL: $FAIL_COUNT pull request workflow assertion(s) failed" >&2
  exit 1
fi

echo "OK: pull request workflow assertions passed"
