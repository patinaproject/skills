# Claude Marketplace Support For Patinaproject/Skills Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Copy the `patinaproject/superteam` project standards into this marketplace repo and add the marketplace metadata and docs needed for Claude Marketplace support without duplicating the upstream plugin package.

**Architecture:** Keep `patinaproject/skills` as the marketplace catalog and contributor-docs repo, while `patinaproject/superteam` remains the source of truth for the installable Claude plugin surface. Implement the change through documentation updates plus a targeted marketplace entry update that continues to point at the upstream repository.

**Tech Stack:** Markdown, JSON, pnpm repo tooling, Husky, commitlint

---

### Task 1: Align Root Contributor Standards

**Files:**

- Create: `CLAUDE.md`
- Modify: `AGENTS.md`
- Test: `AGENTS.md`

- [ ] **Step 1: Write the failing content check for missing Claude instructions**

```bash
test -f CLAUDE.md
```

Expected: non-zero exit status because `CLAUDE.md` does not exist yet.

- [ ] **Step 2: Run the check to verify it fails**

Run: `test -f CLAUDE.md`
Expected: exit status `1`

- [ ] **Step 3: Add the Claude instruction pointer and expand `AGENTS.md`**

```md
# Claude Instructions

See [AGENTS.md](./AGENTS.md) for the repository instructions and contributor workflow.
```

Add these concepts to `AGENTS.md` in repo-specific wording:

```md
## Project Structure & Module Organization

This repository is the marketplace surface for Patina Project plugins and related install documentation.

- `.agents/plugins/marketplace.json`: repo-local marketplace source of truth
- `plugins/`: optional vendored plugin packages when this repo carries local copies
- `docs/`: contributor docs plus planning artifacts such as `docs/file-structure.md` and `docs/superpowers/`
- If `CLAUDE.md` exists, it should point contributors back to `AGENTS.md`
- root config: `package.json`, `commitizen.config.js`, `commitlint.config.js`, and `.husky/`

For Superpowers-generated design and planning artifacts, use issue-based filenames and the following acceptance criteria format:

- `docs/superpowers/specs/YYYY-MM-DD-<issue-number>-<topic>-design.md`
- `docs/superpowers/plans/YYYY-MM-DD-<issue-number>-<topic>-plan.md`
- Acceptance criteria IDs: `AC-<issue-number>-<integer>`
```

Also add these repo-specific standards:

```md
## Commit & Pull Request Guidelines

For squash-and-merge workflows, PR titles must match the commitlint commit format:

`type: #123 short description`

When an issue defines acceptance criteria, include an `Acceptance Criteria` section in the PR description.

- Use one `### AC-<issue>-<n>` heading per relevant AC
- Put a short outcome summary directly under each heading
- Put verification steps under the AC they validate
```

- [ ] **Step 4: Run content checks to verify the standards are present**

Run: `rg -n 'Claude Instructions|AC-<issue-number>-<integer>|Acceptance Criteria' CLAUDE.md AGENTS.md`
Expected: matches for the Claude pointer and the AC ID standard

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md AGENTS.md
git commit -m "docs: #2 align project standards with superteam"
```

### Task 2: Update Contributor Docs For Install Surfaces

**Files:**

- Modify: `README.md`
- Modify: `docs/file-structure.md`
- Test: `README.md`

- [ ] **Step 1: Write the failing doc check for missing Claude marketplace language**

```bash
rg -n 'Claude|install surface|source of truth' README.md docs/file-structure.md
```

Expected: either no matches for Claude-specific wording or matches that do not yet explain the upstream Claude install surface.

- [ ] **Step 2: Run the doc check to verify the gap**

Run: `rg -n 'Claude|install surface|source of truth' README.md docs/file-structure.md`
Expected: missing or incomplete Claude install-surface guidance

- [ ] **Step 3: Update the docs with repo-specific install-surface ownership**

Add content like this to `README.md`:

```md
## Install Surfaces

- `patinaproject/skills` is the marketplace catalog
- `patinaproject/superteam` is the source-of-truth plugin repository
- Codex installs `superteam` through the marketplace entry that targets `./plugins/superteam` in `patinaproject/superteam`
- Claude-compatible installation is owned by the upstream `patinaproject/superteam` repository through its root `.claude-plugin/plugin.json`
```

Add content like this to `docs/file-structure.md`:

```md
## Marketplace workflow

- Register each plugin in `.agents/plugins/marketplace.json`
- Keep marketplace entries pointed at the owning repository for packaged plugin assets
- Do not vendor a duplicate Claude plugin package here when the upstream repository already owns that install surface
- Use `AC-<issue>-<n>` headings for issue acceptance criteria in specs, plans, and PR descriptions
```

- [ ] **Step 4: Run doc verification**

Run: `rg -n 'Claude|source-of-truth|AC-<issue>-<n>' README.md docs/file-structure.md`
Expected: lines showing the Claude install-surface explanation and the AC ID standard

- [ ] **Step 5: Commit**

```bash
git add README.md docs/file-structure.md
git commit -m "docs: #2 document marketplace and Claude install surfaces"
```

### Task 3: Extend Marketplace Metadata For Claude Compatibility

**Files:**

- Modify: `.agents/plugins/marketplace.json`
- Test: `.agents/plugins/marketplace.json`

- [ ] **Step 1: Write the failing metadata inspection**

```bash
sed -n '1,240p' .agents/plugins/marketplace.json
```

Expected: the `superteam` entry only describes the Codex `git-subdir` source and does not yet expose any Claude-oriented compatibility metadata or description.

- [ ] **Step 2: Run the inspection to verify the current shape**

Run: `sed -n '1,240p' .agents/plugins/marketplace.json`
Expected: a single `superteam` entry with `source.source` set to `git-subdir`

- [ ] **Step 3: Add the smallest supported Claude-compatible metadata that still points at `patinaproject/superteam`**

Update `.agents/plugins/marketplace.json` to preserve the existing source block:

```json
{
  "name": "superteam",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/patinaproject/superteam.git",
    "path": "./plugins/superteam",
    "ref": "main"
  }
}
```

Add a Claude-oriented metadata block only if the marketplace schema supports it. The block must reference the upstream repository and its root plugin surface instead of adding local package files. If the schema does not support a Claude-specific block, add a supported description or metadata field that documents the upstream Claude install path and keep the JSON valid.

- [ ] **Step 4: Verify the marketplace entry still targets the upstream repo**

Run: `rg -n 'patinaproject/superteam|git-subdir|claude|Claude' .agents/plugins/marketplace.json`
Expected: matches showing the upstream repo reference remains intact and any Claude-related metadata points upstream

- [ ] **Step 5: Commit**

```bash
git add .agents/plugins/marketplace.json
git commit -m "feat: #2 add Claude marketplace metadata for superteam"
```

### Task 4: Verify The Full Change Set

**Files:**

- Modify: none
- Test: `CLAUDE.md`
- Test: `AGENTS.md`
- Test: `README.md`
- Test: `docs/file-structure.md`
- Test: `.agents/plugins/marketplace.json`

- [ ] **Step 1: Verify the upstream Claude manifest still exists**

Run: `test -f /var/folders/rk/kh6tqml520393n45f7hsg4yw0000gn/T/tmp.xjoQWsSc6d/superteam/.claude-plugin/plugin.json`
Expected: exit status `0`

- [ ] **Step 2: Verify documentation and standards content**

Run: `rg -n 'Claude Instructions|AC-2-|AC-<issue>|source of truth|install surface' CLAUDE.md AGENTS.md README.md docs/file-structure.md`
Expected: matches showing the standards copy, explicit AC conventions, and install-surface ownership

- [ ] **Step 3: Verify the final marketplace JSON**

Run: `sed -n '1,240p' .agents/plugins/marketplace.json`
Expected: valid JSON with the `superteam` entry still pointing at `https://github.com/patinaproject/superteam.git`

- [ ] **Step 4: Inspect git status**

Run: `git status --short`
Expected: clean working tree after the planned commits, or only intentionally uncommitted plan/spec artifacts if those are left out of the commit sequence

- [ ] **Step 5: Commit any final documentation adjustments if needed**

```bash
git add CLAUDE.md AGENTS.md README.md docs/file-structure.md .agents/plugins/marketplace.json
git commit -m "docs: #2 finalize Claude marketplace support docs"
```
