# Rename Marketplace Display Names To Patina Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finalize the approved issue `#6` branding change so Codex and Claude surfaces show `Patina Project` publicly while `patinaproject-skills` remains the internal marketplace slug.

**Architecture:** Keep the existing marketplace catalogs as the source of truth and limit edits to presentation metadata plus README clarification. Treat the current branch changes in `.agents/plugins/marketplace.json`, `.claude-plugin/marketplace.json`, and `README.md` as the intended implementation surface, then verify they preserve all non-goal fields unchanged. For Claude specifically, plan against the actual branch fact pattern: `owner.name` already reads `Patina Project` before this issue, so issue `#6` work there is consistency-preserving metadata cleanup and verification rather than a new user-facing rename.

**Tech Stack:** JSON, Markdown, `rg`, `sed`, Git

---

### Task 1: Confirm Codex Marketplace Branding Metadata

**Files:**
- Modify: `.agents/plugins/marketplace.json`
- Test: `.agents/plugins/marketplace.json`

- [ ] **Step 1: Inspect the current Codex marketplace entry**

```bash
sed -n '1,220p' .agents/plugins/marketplace.json
```

Expected: the top-level `"name"` is still `"patinaproject-skills"` and the interface metadata exposes `"displayName": "Patina Project"`.

- [ ] **Step 2: Verify the approved branding split is present**

Run: `rg -n '"name": "patinaproject-skills"|"displayName": "Patina Project"' .agents/plugins/marketplace.json`
Expected: one match for the internal slug and one match for the public display name.

- [ ] **Step 3: Normalize the file to the approved minimal shape if needed**

```json
{
  "name": "patinaproject-skills",
  "interface": {
    "displayName": "Patina Project"
  },
  "plugins": [
    {
      "name": "superteam",
      "source": {
        "source": "git-subdir",
        "url": "https://github.com/patinaproject/superteam.git",
        "path": "./plugins/superteam",
        "ref": "main"
      },
      "policy": {
        "installation": "AVAILABLE",
        "authentication": "ON_INSTALL"
      },
      "category": "Productivity"
    }
  ]
}
```

- [ ] **Step 4: Verify no source or slug regression was introduced**

Run: `rg -n 'patinaproject-skills|Patina Project|patinaproject/superteam|git-subdir|./plugins/superteam|"ref": "main"' .agents/plugins/marketplace.json`
Expected: matches confirming the display name change landed without changing the catalog slug or upstream plugin source.

- [ ] **Step 5: Commit the Codex metadata update**

```bash
git add .agents/plugins/marketplace.json
git commit -m "chore: #6 rename Codex marketplace display name"
```

### Task 2: Preserve Claude Marketplace Branding And Align Description Metadata

**Files:**
- Modify: `.claude-plugin/marketplace.json`
- Test: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Inspect the current Claude marketplace entry and the actual branch diff**

```bash
git diff -- .claude-plugin/marketplace.json && printf '\n---WORKTREE---\n' && sed -n '1,220p' .claude-plugin/marketplace.json
```

Expected: the diff changes `metadata.description`, while the catalog identifier remains `"patinaproject-skills"` and the owner metadata already shows `"name": "Patina Project"`.

- [ ] **Step 2: Verify the approved Claude-facing branding is preserved and the issue diff is concrete**

Run: `rg -n '"name": "patinaproject-skills"|"name": "Patina Project"|"description": "Marketplace catalog for Patina Project plugins\\."|"repo": "patinaproject/superteam"' .claude-plugin/marketplace.json`
Expected: matches showing the internal catalog identifier, the pre-existing public owner name, the updated Patina Project description text, and the unchanged upstream source repository.

- [ ] **Step 3: Normalize the file to the approved minimal shape if needed**

```json
{
  "name": "patinaproject-skills",
  "owner": {
    "name": "Patina Project",
    "url": "https://github.com/patinaproject"
  },
  "metadata": {
    "description": "Marketplace catalog for Patina Project plugins."
  },
  "plugins": [
    {
      "name": "superteam",
      "description": "Claude Code plugin that exposes the superteam orchestration skill for issue-driven multi-agent work.",
      "category": "productivity",
      "source": {
        "source": "github",
        "repo": "patinaproject/superteam"
      }
    }
  ]
}
```

- [ ] **Step 4: Verify this issue does not introduce a new Claude owner rename or any upstream reference change**

Run: `git diff -- .claude-plugin/marketplace.json && rg -n 'patinaproject-skills|Patina Project|Marketplace catalog for Patina Project plugins\\.|patinaproject/superteam|"source": "github"' .claude-plugin/marketplace.json`
Expected: the diff is limited to the description line, and the catalog identifier, existing owner name, and plugin source all stay stable.

- [ ] **Step 5: Commit the Claude metadata update**

```bash
git add .claude-plugin/marketplace.json
git commit -m "chore: #6 align Claude marketplace branding metadata"
```

### Task 3: Clarify The Public Name Versus Internal Slug In README

**Files:**
- Modify: `README.md`
- Test: `README.md`

- [ ] **Step 1: Inspect the current README wording**

```bash
sed -n '1,260p' README.md
```

Expected: the README describes `patinaproject/skills` as the marketplace repo and includes a sentence explaining that the marketplace is internally named `patinaproject-skills` but displayed as `Patina Project`.

- [ ] **Step 2: Verify the documentation covers the approved distinction**

Run: `rg -n 'Patina Project|patinaproject-skills|source of truth|\\.claude-plugin/plugin.json|\\.agents/plugins/marketplace.json|\\.claude-plugin/marketplace.json' README.md`
Expected: matches showing the public-name versus internal-slug distinction and the existing source-of-truth boundary for `patinaproject/superteam`.

- [ ] **Step 3: Normalize the key README language if needed**

```md
# Patina Project

This repository carries the Patina Project marketplace catalogs for both Codex and Claude plugins.

It is a marketplace catalog, not the source repo for every plugin. Marketplace entries can point at plugins packaged in this repo, or at Git-backed plugin sources maintained in other Patina Project repositories.

## Install Surfaces

- `patinaproject/skills` owns the marketplace catalogs and contributor docs
- `patinaproject/superteam` is the source of truth for the upstream plugin package
- Codex marketplace metadata lives in `.agents/plugins/marketplace.json`
- Claude marketplace metadata lives in `.claude-plugin/marketplace.json`

## How it works

Codex reads the marketplace definition from `.agents/plugins/marketplace.json`, and Claude reads the companion marketplace definition from `.claude-plugin/marketplace.json`.

In this repo, the marketplace is named `patinaproject-skills` and exposed in the UI as `Patina Project`.
```

- [ ] **Step 4: Verify the README does not imply any slug or source migration**

Run: `rg -n 'rename the repository|change the slug|patinaproject/superteam|git-subdir|Patina Project|patinaproject-skills' README.md`
Expected: matches for the approved naming split and upstream source repo, with no wording that suggests a repository rename or plugin-source move.

- [ ] **Step 5: Commit the README clarification**

```bash
git add README.md
git commit -m "docs: #6 clarify marketplace display name and slug split"
```

### Task 4: Run Cross-Surface Verification For AC-6

**Files:**
- Modify: none
- Test: `.agents/plugins/marketplace.json`
- Test: `.claude-plugin/marketplace.json`
- Test: `README.md`

- [ ] **Step 1: Verify all approved surfaces carry the new public-facing name**

Run: `rg -n 'Patina Project' .agents/plugins/marketplace.json .claude-plugin/marketplace.json README.md`
Expected: matches in all three files, with Claude matches coming from preserved owner metadata plus the updated description text.

- [ ] **Step 2: Verify the internal slug remains stable everywhere it should**

Run: `rg -n 'patinaproject-skills' .agents/plugins/marketplace.json .claude-plugin/marketplace.json README.md`
Expected: matches showing the slug is still preserved in the catalogs and documented in README.

- [ ] **Step 3: Verify upstream source references remain unchanged**

Run: `rg -n 'patinaproject/superteam|./plugins/superteam|"ref": "main"|\\.claude-plugin/plugin.json' .agents/plugins/marketplace.json .claude-plugin/marketplace.json README.md`
Expected: matches showing the same upstream plugin repository, Codex subdirectory path, Git ref, and Claude install-surface note.

- [ ] **Step 4: Inspect the final diff and working tree with a Claude-specific guardrail**

Run: `git diff -- .agents/plugins/marketplace.json .claude-plugin/marketplace.json README.md && git diff --word-diff -- .claude-plugin/marketplace.json && git status --short`
Expected: only the approved issue `#6` surfaces are changed before the final commit, and the Claude diff shows the description wording cleanup without any owner-name, slug, or source-reference churn.

- [ ] **Step 5: Create the final issue commit**

```bash
git add .agents/plugins/marketplace.json .claude-plugin/marketplace.json README.md
git commit -m "chore: #6 rename marketplace display names to Patina Project"
```
