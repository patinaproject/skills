# Accommodate using-github Repository Rename Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace current `github-flows` marketplace and release-flow source-of-truth references with `using-github`.

**Architecture:** This is a targeted catalog/documentation update across the two marketplace manifests and the release-flow documentation. Verification is inspection-driven: parse edited JSON, inspect edited Markdown, and audit remaining old-slug references to confirm they are historical rather than current install or release configuration.

**Tech Stack:** JSON marketplace manifests, Markdown documentation, `node`, `rg`, `pnpm` repository tooling.

---

## File Structure

- Modify: `.agents/plugins/marketplace.json`
  - Rename the Codex marketplace plugin entry from `github-flows` to `using-github`.
  - Change its source URL from `https://github.com/patinaproject/github-flows.git` to `https://github.com/patinaproject/using-github.git`.
  - Preserve the explicit tagged `ref`.
- Modify: `.claude-plugin/marketplace.json`
  - Rename the Claude marketplace plugin entry from `github-flows` to `using-github`.
  - Change its source repo from `patinaproject/github-flows` to `patinaproject/using-github`.
  - Update the description to name `using-github`.
  - Preserve the explicit tagged `ref`.
- Modify: `docs/release-flow.md`
  - Replace the current member plugin bullet for `patinaproject/github-flows` with `patinaproject/using-github`.
  - Keep the human-readable purpose text aligned with GitHub workflow ergonomics.

## Task 1: Add Failing Manifest Verification

**Files:**
- Inspect: `.agents/plugins/marketplace.json`
- Inspect: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Run the expected-post-change Codex manifest assertion**

```bash
node - <<'NODE'
const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('.agents/plugins/marketplace.json', 'utf8'));
const oldEntry = catalog.plugins.find((plugin) => plugin.name === 'github-flows');
const entry = catalog.plugins.find((plugin) => plugin.name === 'using-github');

if (oldEntry) {
  throw new Error('Codex marketplace still lists github-flows');
}
if (!entry) {
  throw new Error('Codex marketplace is missing using-github');
}
if (entry.source.url !== 'https://github.com/patinaproject/using-github.git') {
  throw new Error(`Unexpected Codex repository URL: ${entry.source.url}`);
}
if (!/^v\d+\.\d+\.\d+$/.test(entry.source.ref)) {
  throw new Error(`Codex ref is not an explicit semver tag: ${entry.source.ref}`);
}
NODE
```

Expected: FAIL with `Codex marketplace still lists github-flows` or `Codex marketplace is missing using-github`.

- [ ] **Step 2: Run the expected-post-change Claude manifest assertion**

```bash
node - <<'NODE'
const fs = require('fs');
const catalog = JSON.parse(fs.readFileSync('.claude-plugin/marketplace.json', 'utf8'));
const oldEntry = catalog.plugins.find((plugin) => plugin.name === 'github-flows');
const entry = catalog.plugins.find((plugin) => plugin.name === 'using-github');

if (oldEntry) {
  throw new Error('Claude marketplace still lists github-flows');
}
if (!entry) {
  throw new Error('Claude marketplace is missing using-github');
}
if (entry.description !== 'Patina Project plugin: using-github') {
  throw new Error(`Unexpected Claude description: ${entry.description}`);
}
if (entry.source.repo !== 'patinaproject/using-github') {
  throw new Error(`Unexpected Claude repository: ${entry.source.repo}`);
}
if (!/^v\d+\.\d+\.\d+$/.test(entry.source.ref)) {
  throw new Error(`Claude ref is not an explicit semver tag: ${entry.source.ref}`);
}
NODE
```

Expected: FAIL with `Claude marketplace still lists github-flows` or `Claude marketplace is missing using-github`.

## Task 2: Update Marketplace Manifests

**Files:**
- Modify: `.agents/plugins/marketplace.json`
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Update the Codex marketplace entry**

In `.agents/plugins/marketplace.json`, change only the old plugin entry:

```json
{
  "name": "using-github",
  "source": {
    "source": "url",
    "url": "https://github.com/patinaproject/using-github.git",
    "ref": "v1.1.0"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

Expected: The `ref` remains the same explicit tag as before the edit.

- [ ] **Step 2: Update the Claude marketplace entry**

In `.claude-plugin/marketplace.json`, change only the old plugin entry:

```json
{
  "name": "using-github",
  "description": "Patina Project plugin: using-github",
  "category": "productivity",
  "source": {
    "source": "github",
    "repo": "patinaproject/using-github",
    "ref": "v1.1.0"
  }
}
```

Expected: The `ref` remains the same explicit tag as before the edit.

- [ ] **Step 3: Re-run the Codex manifest assertion**

Run the command from Task 1 Step 1.

Expected: PASS with no output.

- [ ] **Step 4: Re-run the Claude manifest assertion**

Run the command from Task 1 Step 2.

Expected: PASS with no output.

## Task 3: Update Release-Flow Documentation

**Files:**
- Modify: `docs/release-flow.md`

- [ ] **Step 1: Run the expected-post-change release-flow assertion**

```bash
node - <<'NODE'
const fs = require('fs');
const text = fs.readFileSync('docs/release-flow.md', 'utf8');

if (!text.includes('`patinaproject/using-github`')) {
  throw new Error('release-flow docs do not list patinaproject/using-github');
}
const memberList = text.slice(
  text.indexOf('Current member plugins tracked by this flow:'),
  text.indexOf('## Lifecycle')
);
if (memberList.includes('patinaproject/github-flows')) {
  throw new Error('release-flow member list still references patinaproject/github-flows');
}
NODE
```

Expected: FAIL with `release-flow docs do not list patinaproject/using-github`.

- [ ] **Step 2: Update the current member plugin bullet**

In `docs/release-flow.md`, replace:

```markdown
- `patinaproject/github-flows` — agent ergonomics for GitHub workflows (`/edit-issue`, `/new-issue`, `/new-branch`).
```

with:

```markdown
- `patinaproject/using-github` — agent ergonomics for GitHub workflows (`/edit-issue`, `/new-issue`, `/new-branch`).
```

- [ ] **Step 3: Re-run the release-flow assertion**

Run the command from Task 3 Step 1.

Expected: PASS with no output.

## Task 4: Audit Remaining References and Run Repository Checks

**Files:**
- Inspect: all repository files
- Modify if needed: only current install, release, cache, or automation source-of-truth files discovered by the audit

- [ ] **Step 1: Parse edited JSON manifests**

```bash
node -e "JSON.parse(require('fs').readFileSync('.agents/plugins/marketplace.json', 'utf8')); JSON.parse(require('fs').readFileSync('.claude-plugin/marketplace.json', 'utf8'));"
```

Expected: PASS with no output.

- [ ] **Step 2: Confirm current source-of-truth surfaces no longer contain `github-flows`**

```bash
rg -n 'github-flows' .agents/plugins/marketplace.json .claude-plugin/marketplace.json docs/release-flow.md
```

Expected: FAIL/no matches, because `rg` exits 1 when no matches are found.

- [ ] **Step 3: Audit remaining old repository slug references**

```bash
rg -n 'patinaproject/github-flows' .
```

Expected: Any remaining matches are confined to historical Superpowers issue artifacts, especially issue #22 design/plan records or the issue #35 design and plan documents that explain the migration.

- [ ] **Step 4: Run Markdown lint if dependencies are installed**

```bash
pnpm exec markdownlint-cli2 docs/release-flow.md docs/superpowers/specs/2026-04-27-35-accommodate-using-github-repository-rename-design.md docs/superpowers/plans/2026-04-27-35-accommodate-using-github-repository-rename-plan.md
```

Expected: PASS. If `markdownlint-cli2` is unavailable because dependencies are not installed, run `pnpm install` and retry.

- [ ] **Step 5: Review the final diff**

```bash
git diff -- .agents/plugins/marketplace.json .claude-plugin/marketplace.json docs/release-flow.md docs/superpowers/specs/2026-04-27-35-accommodate-using-github-repository-rename-design.md docs/superpowers/plans/2026-04-27-35-accommodate-using-github-repository-rename-plan.md
```

Expected: Diff only contains the approved design/plan artifacts and the targeted manifest/docs rename.

- [ ] **Step 6: Commit the implementation batch**

```bash
git add .agents/plugins/marketplace.json .claude-plugin/marketplace.json docs/release-flow.md docs/superpowers/plans/2026-04-27-35-accommodate-using-github-repository-rename-plan.md
git commit -m "fix: #35 rename github flows marketplace entry"
```

Expected: Commit succeeds with a conventional commit message containing the issue tag.
