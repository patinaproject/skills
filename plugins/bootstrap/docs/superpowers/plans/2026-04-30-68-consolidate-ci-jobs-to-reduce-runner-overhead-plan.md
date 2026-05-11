# Plan: Consolidate CI jobs to reduce runner overhead [#68](https://github.com/patinaproject/bootstrap/issues/68)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce bootstrap CI runner overhead by consolidating compatible PR
metadata checks and keeping standalone Markdown lint cheap.

**Architecture:** Template-first workflow edits land under
`skills/bootstrap/templates/core/**`, then root workflow and guidance mirrors
are realigned to match. `pull-request.yml` keeps the required
`Lint` status name while moving PR metadata checks into named steps.
`markdown.yml` still reports a check on every PR and uses the standalone
markdownlint action across the repository Markdown globs.

**Tech Stack:** GitHub Actions YAML, GitHub CLI in Actions, PNPM,
markdownlint-cli2, actionlint.

---

## File Structure

| File | Responsibility |
| --- | --- |
| `skills/bootstrap/templates/core/.github/workflows/pull-request.yml` | Source template for consolidated PR metadata validation. |
| `skills/bootstrap/templates/core/.github/workflows/markdown.yml` | Source template for required-check-safe changed-file Markdown linting. |
| `skills/bootstrap/templates/core/AGENTS.md.tmpl` | Source template for required-check guidance and CI consolidation principle. |
| `.github/workflows/pull-request.yml` | Root mirror of the consolidated PR metadata workflow. |
| `.github/workflows/markdown.yml` | Root mirror of the Markdown lint workflow. |
| `AGENTS.md` | Root mirror of updated bootstrap guidance. |

## Workstreams

1. W1: Update template workflows and guidance.
2. W2: Realign root mirrors from templates.
3. W3: Verify workflow behavior, parity, and documentation.

## Task 1: Consolidate PR Metadata Checks In Template

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/workflows/pull-request.yml`

- [ ] **Step 1: Capture the current job count baseline**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml
data = yaml.safe_load(Path('skills/bootstrap/templates/core/.github/workflows/pull-request.yml').read_text())
print('\\n'.join(data['jobs'].keys()))
PY
```

Expected output before implementation:

```text
title-format
closing-keyword
lint
mark-breaking-change
```

- [ ] **Step 2: Replace the four-job layout with one required-status job**

Edit `skills/bootstrap/templates/core/.github/workflows/pull-request.yml` so the
complete file is:

```yaml
name: Pull Request

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

permissions:
  contents: read
  pull-requests: read

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    if: "${{ !contains(github.event.pull_request.labels.*.name, 'autorelease: pending') }}"
    steps:
      - name: Enforce ASCII-only title
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
        run: |
          if printf '%s' "$PR_TITLE" | LC_ALL=C grep -qP '[^\x00-\x7F]'; then
            echo "::error::PR title contains non-ASCII characters. Use ASCII only (no emoji, smart quotes, em-dashes, etc.)."
            exit 1
          fi

      - name: Validate conventional commits
        # amannn/action-semantic-pull-request@v5.5.3
        uses: amannn/action-semantic-pull-request@0723387faaf9b38adef4775cd42cfd5155ed6017
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          types: |
            feat
            fix
            docs
            chore
            style
            refactor
            perf
            test
            build
            ci
            revert
          requireScope: false
          disallowScopes: |
            .+
          subjectPattern: '^#\d+ .+$'
          subjectPatternError: |
            PR title subject must start with a GitHub issue reference. Example:
              feat: #123 add boot timeline
              fix: #456 restore search
            Scopes are not permitted. See AGENTS.md for conventions.
          ignoreLabels: |
            dependencies

      - name: Check for closing keyword in PR body
        if: "${{ github.event.pull_request.user.login != 'dependabot[bot]' }}"
        env:
          PR_BODY: ${{ github.event.pull_request.body }}
        run: |
          if [ -z "$PR_BODY" ]; then
            echo "::error::PR body is empty. Add a GitHub closing keyword such as 'Closes #<issue>'."
            exit 1
          fi
          # Strip HTML comments, fenced code blocks, inline code, strikethrough, blockquotes.
          BT=$(printf '\x60')
          # shellcheck disable=SC2016
          sanitized=$(printf '%s' "$PR_BODY" \
            | sed -E 's/<!--([^-]|-[^-])*-->//g' \
            | awk -v bt="$BT" 'BEGIN{fence=bt bt bt} $0 ~ "^" fence {toggle=!toggle; next} !toggle' \
            | sed -E "s/${BT}[^${BT}]*${BT}//g" \
            | sed -E 's/~~[^~]*~~//g')
          sanitized=$(printf '%s' "$sanitized" | grep -vE '^[[:space:]]*>' || true)
          # shellcheck disable=SC2016
          if printf '%s' "$sanitized" | grep -qiE \
            '(^|[^A-Za-z])(close[sd]?|fix(e[sd])?|resolve[sd]?)[ \t]+([A-Za-z0-9._-]+/[A-Za-z0-9._-]+)?#[1-9][0-9]*([^0-9A-Za-z_]|$)'; then
            echo "Closing keyword found."
            exit 0
          fi
          echo "::error::PR body must contain a GitHub closing keyword (e.g. 'Closes #123') outside code blocks, HTML comments, strikethrough, and blockquotes."
          exit 1

      - name: Check out repository
        # actions/checkout@v4.3.1
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5

      - name: Validate required template checkboxes
        env:
          PR_BODY: ${{ github.event.pull_request.body }}
        run: node scripts/check-pr-template-checkboxes.mjs

      - name: Compare title `!` with body BREAKING CHANGE footer
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_BODY: ${{ github.event.pull_request.body }}
        run: |
          title_has_bang=false
          if echo "$PR_TITLE" | grep -qE '^[a-z]+(\([^)]*\))?!:'; then
            title_has_bang=true
          fi
          body_has_footer=false
          if printf '%s' "$PR_BODY" | grep -qE '^BREAKING[ -]CHANGE:'; then
            body_has_footer=true
          fi
          if [ "$title_has_bang" = true ] && [ "$body_has_footer" = false ]; then
            echo "::error::PR title declares a breaking change (\`!\` in prefix) but the body has no \`BREAKING CHANGE:\` footer. Explain the break in the body or drop the \`!\`."
            exit 1
          fi
          if [ "$body_has_footer" = true ] && [ "$title_has_bang" = false ]; then
            echo "::error::PR body has a \`BREAKING CHANGE:\` footer but the title is missing the \`!\` marker. Add \`!\` to the type (e.g. \`feat!: #123 ...\`) so squash-merged commits carry the marker."
            exit 1
          fi
          echo "Breaking change markers are consistent."
```

- [ ] **Step 3: Verify the consolidated job shape**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml
data = yaml.safe_load(Path('skills/bootstrap/templates/core/.github/workflows/pull-request.yml').read_text())
jobs = data['jobs']
print(list(jobs.keys()))
print(jobs['lint']['name'])
print([step.get('name', step.get('uses')) for step in jobs['lint']['steps']])
PY
```

Expected output includes one job ID and the required display name:

```text
['lint']
Lint
```

- [ ] **Step 4: Commit Task 1**

Commit after Task 1 passes:

```bash
git add skills/bootstrap/templates/core/.github/workflows/pull-request.yml
git commit -m "feat: #68 consolidate PR metadata checks"
```

## Task 2: Keep Markdown Lint Standalone

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/workflows/markdown.yml`

- [ ] **Step 1: Verify the current workflow has no relevance guard**

Run:

```bash
rg -n "Detect Markdown changes|should_run|pull_request.paths|paths:" \
  skills/bootstrap/templates/core/.github/workflows/markdown.yml || true
```

Expected before implementation: no output.

- [ ] **Step 2: Replace the Markdown workflow template**

Edit `skills/bootstrap/templates/core/.github/workflows/markdown.yml` so the
complete file is:

```yaml
name: Markdown

on:
  pull_request:
    types: [opened, edited, synchronize, reopened]

permissions:
  contents: read

jobs:
  lint:
    name: Lint
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        # actions/checkout@v4.3.1
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5

      - name: Run Markdown lint
        # DavidAnson/markdownlint-cli2-action@v18.0.0
        uses: DavidAnson/markdownlint-cli2-action@eb5ca3ab411449c66620fe7f1b3c9e10547144b0
        with:
          globs: |
            **/*.md
            #node_modules
            #CHANGELOG.md
```

- [ ] **Step 3: Verify required-check-safe behavior is represented**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import yaml
path = Path('skills/bootstrap/templates/core/.github/workflows/markdown.yml')
data = yaml.safe_load(path.read_text())
pull_request = data.get('on', data.get(True))['pull_request']
assert 'paths' not in pull_request
steps = data['jobs']['lint']['steps']
print(steps[0]['name'])
print(steps[1]['name'])
print(steps[1]['with']['globs'])
PY
```

Expected output:

```text
Check out repository
Run Markdown lint
**/*.md
#node_modules
#CHANGELOG.md
```

- [ ] **Step 4: Commit Task 2**

```bash
git add skills/bootstrap/templates/core/.github/workflows/markdown.yml
git commit -m "feat: #68 keep markdown lint standalone"
```

## Task 3: Add Template-Owned CI Guidance

**Files:**

- Modify: `skills/bootstrap/templates/core/AGENTS.md.tmpl`

- [ ] **Step 1: Locate the guidance insertion point**

Run:

```bash
sed -n '/## GitHub Actions pinning/,/## Commit & Pull Request Guidelines/p' \
  skills/bootstrap/templates/core/AGENTS.md.tmpl
```

Expected: the output contains `## GitHub Actions pinning` followed by
`## Required PR checks`.

- [ ] **Step 2: Add a CI job-shape paragraph**

Insert this paragraph after the GitHub Actions pinning section and before
`## Required PR checks`:

```markdown
## CI job shape

Prefer named steps inside an existing job for short-lived checks that share the
same trigger, permissions, runner, and reporting needs. Do not split such
checks into separate jobs just to give each command its own status. Preserve
documented required status check names, or update the branch-protection and
ruleset guidance in the same change.
```

- [ ] **Step 3: Verify the guidance exists once**

Run:

```bash
rg -n "## CI job shape|Prefer named steps inside an existing job" \
  skills/bootstrap/templates/core/AGENTS.md.tmpl
```

Expected: exactly two lines, one for the heading and one for the paragraph.

- [ ] **Step 4: Commit Task 3**

```bash
git add skills/bootstrap/templates/core/AGENTS.md.tmpl
git commit -m "feat: #68 document CI job consolidation guidance"
```

## Task 4: Realign Root Mirrors

**Files:**

- Modify: `.github/workflows/pull-request.yml`
- Modify: `.github/workflows/markdown.yml`
- Modify: `AGENTS.md`

- [ ] **Step 1: Mirror template workflow files to root**

Use the local bootstrap realignment flow when available. If it cannot be run in
this harness, copy the exact template files into root with the standard shell
copy command and document that the copy is the realignment fallback:

```bash
cp skills/bootstrap/templates/core/.github/workflows/pull-request.yml .github/workflows/pull-request.yml
cp skills/bootstrap/templates/core/.github/workflows/markdown.yml .github/workflows/markdown.yml
```

- [ ] **Step 2: Mirror the `AGENTS.md` CI job-shape section**

If the bootstrap realignment flow did not update `AGENTS.md`, insert the same
`## CI job shape` section from Task 3 after the GitHub Actions pinning section
and before `## Required PR checks`.

- [ ] **Step 3: Verify workflow parity**

Run:

```bash
diff -u skills/bootstrap/templates/core/.github/workflows/pull-request.yml .github/workflows/pull-request.yml
diff -u skills/bootstrap/templates/core/.github/workflows/markdown.yml .github/workflows/markdown.yml
```

Expected: both commands produce no output.

- [ ] **Step 4: Verify guidance parity**

Run:

```bash
for f in AGENTS.md skills/bootstrap/templates/core/AGENTS.md.tmpl; do
  echo "== $f =="
  rg -n "## CI job shape|Prefer named steps inside an existing job|Lint" "$f"
done
```

Expected: both files contain the `## CI job shape` section and still name the
required status check `Lint`.

- [ ] **Step 5: Commit Task 4**

```bash
git add .github/workflows/pull-request.yml .github/workflows/markdown.yml AGENTS.md
git commit -m "feat: #68 realign CI workflow mirrors"
```

## Task 5: Final Verification

**Files:**

- Verify: all changed files

- [ ] **Step 1: Run Markdown lint**

```bash
pnpm lint:md
```

Expected: `Summary: 0 error(s)`.

- [ ] **Step 2: Run checkbox script tests**

```bash
node --test scripts/check-pr-template-checkboxes.test.mjs
```

Expected: all tests pass.

- [ ] **Step 3: Run actionlint when available**

```bash
if command -v actionlint >/dev/null 2>&1; then
  actionlint .github/workflows/pull-request.yml .github/workflows/markdown.yml \
    skills/bootstrap/templates/core/.github/workflows/pull-request.yml \
    skills/bootstrap/templates/core/.github/workflows/markdown.yml
else
  echo "actionlint not installed; CI actions will validate workflow syntax."
fi
```

Expected: either actionlint passes, or the command prints the documented
fallback message.

- [ ] **Step 4: Verify no workflow-level Markdown path filter exists**

```bash
rg -n "pull_request\\.paths|paths:" .github/workflows/markdown.yml \
  skills/bootstrap/templates/core/.github/workflows/markdown.yml || true
```

Expected: no output.

- [ ] **Step 5: Verify final changed files**

```bash
git diff --name-only origin/main...HEAD
```

Expected output includes:

```text
.github/workflows/markdown.yml
.github/workflows/pull-request.yml
AGENTS.md
docs/superpowers/plans/2026-04-30-68-consolidate-ci-jobs-to-reduce-runner-overhead-plan.md
docs/superpowers/specs/2026-04-30-68-consolidate-ci-jobs-to-reduce-runner-overhead-design.md
skills/bootstrap/templates/core/.github/workflows/markdown.yml
skills/bootstrap/templates/core/.github/workflows/pull-request.yml
skills/bootstrap/templates/core/AGENTS.md.tmpl
```

## Acceptance Criteria Trace

- AC-68-1: Task 1 consolidates compatible PR metadata checks into
  `lint`.
- AC-68-2: Task 1 keeps each validation as a named step with existing error
  output.
- AC-68-3: Tasks 1 and 2 preserve all existing pinned `uses:` references and
  comments.
- AC-68-4: Task 4 verifies root/template parity for both workflows and guidance.
- AC-68-5: Task 3 and Task 4 keep `Lint` in guidance.
- AC-68-6: Task 3 adds the CI job-shape guidance.
- AC-68-7: Task 2 keeps the Markdown workflow required-check-safe by avoiding
  workflow-level path filters.
- AC-68-8: Task 2 runs the standalone Markdown lint action across the
  repository Markdown globs.
- AC-68-9: Task 5 records final verification.

## Planner Self-Review

- Spec coverage: every design requirement maps to Tasks 1-5.
- Placeholder scan: no placeholder task language remains.
- Type and name consistency: the required check name stays `Lint`; the
  Markdown workflow uses the standalone action without dependency install.
