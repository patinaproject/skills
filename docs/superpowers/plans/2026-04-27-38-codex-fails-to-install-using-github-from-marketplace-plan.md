# Fix Duplicate using-github Marketplace Entries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repair the duplicate `using-github` marketplace entries, refresh marketplace docs, and add validation that catches duplicate or mismatched catalog entries before they ship again.

**Architecture:** Add one focused Node validator under `scripts/` that owns marketplace invariants for both local and CI/release-bump use. Then make the manifests and README match the audited current plugin set, and wire validation into package scripts plus the release-bump workflow.

**Tech Stack:** JSON marketplace manifests, Markdown docs, Node.js CommonJS, GitHub CLI for optional upstream release checks, GitHub Actions, `pnpm`, `markdownlint-cli2`.

---

## File Structure

- Create: `scripts/validate-marketplace.js`
  - Parse `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`.
  - Fail on duplicate plugin names, missing cross-manifest entries, mismatched repos or refs, non-`vX.Y.Z` refs, and malformed source blocks.
  - When run with `--remote`, fetch upstream `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and `package.json` with `gh api` and confirm manifest names and versions match the marketplace entry.
- Modify: `package.json`
  - Add `validate:marketplace` and `validate:marketplace:remote` scripts.
- Modify: `.agents/plugins/marketplace.json`
  - Remove the stale `using-github@v1.1.0` entry and keep `using-github@v2.0.0`.
- Modify: `.claude-plugin/marketplace.json`
  - Remove the stale `using-github@v1.1.0` entry and keep `using-github@v2.0.0`.
- Modify: `.github/workflows/plugin-release-bump.yml`
  - Run the marketplace validator before creating the automated bump PR.
- Modify: `.github/workflows/lint-md.yml` or create a new workflow only if needed
  - Prefer no new workflow; release-bump validation plus local/package validation is sufficient for this issue.
- Modify: `README.md`
  - List `bootstrap`, `superteam`, and `using-github` with released refs.
  - Describe Codex and Claude marketplace installs without `superteam`-only language.
  - Mention non-plugin editor surfaces only where applicable and avoid old `github-flows` identity as installable marketplace content.
- Modify: `docs/superpowers/plans/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-plan.md`
  - Track implementation completion and verification evidence.

## Task 1: Add Failing Catalog Validation

**Files:**

- Create: `scripts/validate-marketplace.js`
- Modify: `package.json`

- [ ] **Step 1: Create the validator script**

Add this executable CommonJS script:

```js
#!/usr/bin/env node

const fs = require("node:fs");
const { execFileSync } = require("node:child_process");

const remote = process.argv.includes("--remote");
const semverTag = /^v(\d+\.\d+\.\d+)$/;

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, "utf8"));
}

function fail(message) {
  throw new Error(message);
}

function normalizeCodexRepo(plugin) {
  const source = plugin.source || {};
  if (source.source !== "url") {
    fail(`Codex plugin ${plugin.name} must use source=url`);
  }
  if (!source.url || !source.url.startsWith("https://github.com/") || !source.url.endsWith(".git")) {
    fail(`Codex plugin ${plugin.name} has invalid source URL: ${source.url}`);
  }
  return source.url.replace("https://github.com/", "").replace(/\.git$/, "");
}

function normalizeClaudeRepo(plugin) {
  const source = plugin.source || {};
  if (source.source !== "github") {
    fail(`Claude plugin ${plugin.name} must use source=github`);
  }
  if (!source.repo || !/^[^/]+\/[^/]+$/.test(source.repo)) {
    fail(`Claude plugin ${plugin.name} has invalid source repo: ${source.repo}`);
  }
  return source.repo;
}

function assertNoDuplicates(kind, plugins) {
  const counts = new Map();
  for (const plugin of plugins) {
    counts.set(plugin.name, (counts.get(plugin.name) || 0) + 1);
  }
  const duplicates = [...counts].filter(([, count]) => count > 1);
  if (duplicates.length > 0) {
    fail(`${kind} marketplace has duplicate plugin names: ${duplicates.map(([name]) => name).join(", ")}`);
  }
}

function assertRefs(kind, plugins) {
  for (const plugin of plugins) {
    if (!semverTag.test(plugin.source?.ref || "")) {
      fail(`${kind} plugin ${plugin.name} ref is not an explicit vX.Y.Z tag: ${plugin.source?.ref}`);
    }
  }
}

function apiJson(repo, ref, path) {
  const content = execFileSync(
    "gh",
    ["api", "-X", "GET", `repos/${repo}/contents/${path}`, "-f", `ref=${ref}`, "--jq", ".content"],
    { encoding: "utf8" }
  );
  return JSON.parse(Buffer.from(content.replace(/\s/g, ""), "base64").toString("utf8"));
}

function assertRemoteManifest(plugin, repo, manifestPath, expectedVersion) {
  const manifest = apiJson(repo, plugin.source.ref, manifestPath);
  if (manifest.name !== plugin.name) {
    fail(`${repo}@${plugin.source.ref} ${manifestPath} name=${manifest.name}; expected ${plugin.name}`);
  }
  if (manifest.version !== expectedVersion) {
    fail(`${repo}@${plugin.source.ref} ${manifestPath} version=${manifest.version}; expected ${expectedVersion}`);
  }
}

function assertRemotePackage(plugin, repo, expectedVersion) {
  const pkg = apiJson(repo, plugin.source.ref, "package.json");
  if (pkg.name !== plugin.name) {
    fail(`${repo}@${plugin.source.ref} package.json name=${pkg.name}; expected ${plugin.name}`);
  }
  if (pkg.version !== expectedVersion) {
    fail(`${repo}@${plugin.source.ref} package.json version=${pkg.version}; expected ${expectedVersion}`);
  }
}

const codex = readJson(".agents/plugins/marketplace.json").plugins;
const claude = readJson(".claude-plugin/marketplace.json").plugins;

assertNoDuplicates("Codex", codex);
assertNoDuplicates("Claude", claude);
assertRefs("Codex", codex);
assertRefs("Claude", claude);

const codexByName = new Map(codex.map((plugin) => [plugin.name, plugin]));
const claudeByName = new Map(claude.map((plugin) => [plugin.name, plugin]));

for (const name of new Set([...codexByName.keys(), ...claudeByName.keys()])) {
  const codexPlugin = codexByName.get(name);
  const claudePlugin = claudeByName.get(name);
  if (!codexPlugin || !claudePlugin) {
    fail(`Plugin ${name} must be present in both Codex and Claude marketplaces`);
  }

  const codexRepo = normalizeCodexRepo(codexPlugin);
  const claudeRepo = normalizeClaudeRepo(claudePlugin);
  if (codexRepo !== claudeRepo) {
    fail(`Plugin ${name} repo mismatch: Codex=${codexRepo}, Claude=${claudeRepo}`);
  }
  if (codexPlugin.source.ref !== claudePlugin.source.ref) {
    fail(`Plugin ${name} ref mismatch: Codex=${codexPlugin.source.ref}, Claude=${claudePlugin.source.ref}`);
  }

  if (remote) {
    const expectedVersion = codexPlugin.source.ref.match(semverTag)[1];
    assertRemoteManifest(codexPlugin, codexRepo, ".codex-plugin/plugin.json", expectedVersion);
    assertRemoteManifest(claudePlugin, claudeRepo, ".claude-plugin/plugin.json", expectedVersion);
    assertRemotePackage(codexPlugin, codexRepo, expectedVersion);
  }
}

console.log(`Marketplace validation passed for ${codex.length} plugin(s).`);
```

- [ ] **Step 2: Add package scripts**

Add these scripts to `package.json`:

```json
"validate:marketplace": "node scripts/validate-marketplace.js",
"validate:marketplace:remote": "node scripts/validate-marketplace.js --remote"
```

Keep existing scripts unchanged.

- [ ] **Step 3: Run local validation and confirm it fails on the current duplicate**

Run:

```bash
pnpm validate:marketplace
```

Expected: FAIL with `Codex marketplace has duplicate plugin names: using-github`.

- [ ] **Step 4: Commit the failing validator**

Run:

```bash
git add scripts/validate-marketplace.js package.json
git commit -m "test: #38 add marketplace validation"
```

Expected: commit succeeds.

## Task 2: Repair Marketplace Manifests

**Files:**

- Modify: `.agents/plugins/marketplace.json`
- Modify: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Remove the stale Codex entry**

In `.agents/plugins/marketplace.json`, delete only the first `using-github`
entry that has:

```json
"ref": "v1.1.0"
```

Keep the later `using-github` entry with:

```json
"url": "https://github.com/patinaproject/using-github.git",
"ref": "v2.0.0"
```

- [ ] **Step 2: Remove the stale Claude entry**

In `.claude-plugin/marketplace.json`, delete only the first `using-github`
entry that has:

```json
"ref": "v1.1.0"
```

Keep the later `using-github` entry with:

```json
"repo": "patinaproject/using-github",
"ref": "v2.0.0"
```

- [ ] **Step 3: Run local validation**

Run:

```bash
pnpm validate:marketplace
```

Expected: PASS with `Marketplace validation passed for 3 plugin(s).`

- [ ] **Step 4: Commit the manifest repair**

Run:

```bash
git add .agents/plugins/marketplace.json .claude-plugin/marketplace.json
git commit -m "fix: #38 remove stale using-github entries"
```

Expected: commit succeeds.

## Task 3: Guard Release Bumps With Validation

**Files:**

- Modify: `.github/workflows/plugin-release-bump.yml`

- [ ] **Step 1: Add validation after manifest updates**

After the `Update marketplace manifests` step, add:

```yaml
      - name: Validate marketplace manifests
        run: node scripts/validate-marketplace.js
```

Expected: bot bump PRs fail before PR creation if the generated catalogs contain duplicate plugin names, non-tag refs, repo mismatches, or cross-manifest inconsistencies.

- [ ] **Step 2: Run local workflow validation commands**

Run:

```bash
node scripts/validate-marketplace.js
pnpm exec markdownlint-cli2 .github/workflows/plugin-release-bump.yml
```

Expected: marketplace validation passes. Markdown lint may report no Markdown files for the workflow path; if so, run `pnpm exec markdownlint-cli2 README.md docs/superpowers/specs/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-design.md docs/superpowers/plans/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-plan.md` instead.

- [ ] **Step 3: Commit release-bump guardrail**

Run:

```bash
git add .github/workflows/plugin-release-bump.yml
git commit -m "ci: #38 validate release bump catalogs"
```

Expected: commit succeeds.

## Task 4: Refresh README Marketplace Guidance

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Update current plugin list**

Replace the current `Tracked member plugins` list with:

```markdown
Tracked member plugins:

- `patinaproject/bootstrap` — repo scaffolding skill, currently `v1.2.0`
- `patinaproject/superteam` — issue-driven orchestration skill, currently `v1.1.0`
- `patinaproject/using-github` — GitHub workflow skill, currently `v2.0.0`
```

- [ ] **Step 2: Update install surfaces**

Replace `superteam`-only install-surface bullets with bullets that describe the marketplace generically:

```markdown
- `patinaproject/skills` owns the marketplace catalogs and contributor docs
- `patinaproject/bootstrap`, `patinaproject/superteam`, and `patinaproject/using-github` own their upstream plugin packages
- Codex marketplace metadata lives in `.agents/plugins/marketplace.json`
- Claude marketplace metadata lives in `.claude-plugin/marketplace.json`
- Codex reads upstream package metadata from `.codex-plugin/plugin.json`
- Claude reads upstream package metadata from `.claude-plugin/plugin.json`
- Upstream skill content lives under each plugin repo's `skills/` directory
```

- [ ] **Step 3: Update install examples**

Change the Codex install instruction sentence to:

```markdown
Then open the Codex Plugin Directory, find `Patina Project`, and install the plugin you need: `bootstrap`, `superteam`, or `using-github`.
```

Replace the Claude install section with marketplace-oriented language:

````markdown
Register the Patina Project marketplace in Claude Code:

```text
/plugin marketplace add patinaproject/skills
```

Then install the plugin you need:

```text
/plugin install bootstrap@patinaproject-skills
/plugin install superteam@patinaproject-skills
/plugin install using-github@patinaproject-skills
```
````

- [ ] **Step 4: Update maintenance notes**

Replace `superteam` and `bootstrap` source-of-truth-only bullets with:

```markdown
- For `bootstrap`, the source-of-truth repo is `patinaproject/bootstrap`
- For `superteam`, the source-of-truth repo is `patinaproject/superteam`
- For `using-github`, the source-of-truth repo is `patinaproject/using-github`
- Run `pnpm validate:marketplace` before opening marketplace PRs
- Run `pnpm validate:marketplace:remote` when validating release identity against upstream tags
```

- [ ] **Step 5: Run README-focused checks**

Run:

```bash
rg -n 'pending first tagged release|github-flows|superteam` from|plugins/superteam|using-github|bootstrap|superteam' README.md
pnpm exec markdownlint-cli2 README.md
```

Expected: no `pending first tagged release`, `github-flows`, `superteam from repository root`, or `plugins/superteam` active install-language matches remain. The current plugin names remain.

- [ ] **Step 6: Commit README refresh**

Run:

```bash
git add README.md
git commit -m "docs: #38 refresh marketplace install guidance"
```

Expected: commit succeeds.

## Task 5: Run Full Verification And Record Evidence

**Files:**

- Modify: `docs/superpowers/plans/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-plan.md`

- [ ] **Step 1: Run local marketplace validation**

Run:

```bash
pnpm validate:marketplace
```

Expected: PASS with `Marketplace validation passed for 3 plugin(s).`

- [ ] **Step 2: Run remote marketplace validation**

Run:

```bash
pnpm validate:marketplace:remote
```

Expected: PASS with `Marketplace validation passed for 3 plugin(s).`

- [ ] **Step 3: Audit active repo-local editor/config surfaces**

Run:

```bash
find . -path './node_modules' -prune -o \( -name '.vscode' -o -name '.idea' -o -name '.cursor' -o -name '.windsurf' -o -name '.zed' -o -name '.continue' -o -name '.codex' -o -name '.claude' -o -name '.agents' -o -name '.claude-plugin' -o -name '.codex-plugin' \) -print
```

Expected: only `.agents`, `.claude`, and `.claude-plugin` repo-local surfaces are present.

- [ ] **Step 4: Audit old identity in active repository surfaces**

Run:

```bash
rg -n 'github-flows|patinaproject/github-flows' .agents .claude-plugin .claude README.md docs/release-flow.md .github/workflows/plugin-release-bump.yml scripts package.json
```

Expected: no matches.

- [ ] **Step 5: Run Markdown lint**

Run:

```bash
pnpm lint:md
pnpm exec markdownlint-cli2 docs/superpowers/specs/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-design.md docs/superpowers/plans/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-plan.md
```

Expected: PASS.

- [ ] **Step 6: Review final diff**

Run:

```bash
git diff origin/main...HEAD -- .agents/plugins/marketplace.json .claude-plugin/marketplace.json README.md package.json scripts/validate-marketplace.js .github/workflows/plugin-release-bump.yml docs/superpowers/specs/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-design.md docs/superpowers/plans/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-plan.md
```

Expected: diff contains only the planned marketplace, validation, docs, and Superteam artifacts.

- [ ] **Step 7: Commit verification note updates**

Run:

```bash
git add docs/superpowers/plans/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-plan.md
git commit -m "docs: #38 record marketplace verification plan"
```

Expected: commit succeeds if the plan file changed during execution; skip if it did not change.

## Verification Evidence

- `pnpm validate:marketplace`: passed with `Marketplace validation passed for 3 plugin(s).`
- `pnpm validate:marketplace:remote`: passed with `Marketplace validation passed for 3 plugin(s).`
- Active repo-local editor/config surface audit found only `.agents`, `.claude`, and `.claude-plugin`.
- `rg -n 'github-flows|patinaproject/github-flows' .agents .claude-plugin .claude README.md docs/release-flow.md .github/workflows/plugin-release-bump.yml scripts package.json`: no matches.
- `pnpm lint:md`: passed, linting 10 tracked non-Superpowers Markdown files.
- `pnpm exec markdownlint-cli2 docs/superpowers/specs/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-design.md docs/superpowers/plans/2026-04-27-38-codex-fails-to-install-using-github-from-marketplace-plan.md`: passed.
- `actionlint .github/workflows/lint-pr.yml .github/workflows/plugin-release-bump.yml`: passed.
