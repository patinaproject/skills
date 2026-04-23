# Align The Marketplace Repository Structure With Obra Superpowers Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `patinaproject/skills` read like a marketplace-first repository modeled on `obra/superpowers-marketplace`, while updating all `superteam` references to the new canonical upstream path.

**Architecture:** Keep the repository shape intentionally minimal at the root, with `README.md` as the primary structure and ownership guide, marketplace metadata in the hidden marketplace directories, and planning artifacts under `docs/superpowers/`. Remove duplicated structure documentation and update marketplace docs plus manifests to point at `patinaproject/superteam`'s canonical `skills/superteam` path.

**Tech Stack:** Markdown, JSON, GitHub marketplace metadata, repository contributor docs

---

### Task 1: Update marketplace metadata to the canonical upstream path

**Files:**
- Modify: `.agents/plugins/marketplace.json`
- Review: `.claude-plugin/marketplace.json`

- [ ] **Step 1: Inspect the current marketplace manifests**

```bash
sed -n '1,200p' .agents/plugins/marketplace.json
sed -n '1,200p' .claude-plugin/marketplace.json
```

Expected: the Codex marketplace entry still points at `./plugins/superteam`, while the Claude marketplace entry still points at `patinaproject/superteam`.

- [ ] **Step 2: Update the Codex marketplace entry to the new canonical path**

```json
{
  "name": "superteam",
  "source": {
    "source": "git-subdir",
    "url": "https://github.com/patinaproject/superteam.git",
    "path": "./skills/superteam",
    "ref": "main"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

Expected: `.agents/plugins/marketplace.json` references `./skills/superteam` and keeps the existing repo URL, ref, policy, and category unchanged.

- [ ] **Step 3: Re-read the manifests to confirm the intended install sources**

```bash
sed -n '1,200p' .agents/plugins/marketplace.json
sed -n '1,200p' .claude-plugin/marketplace.json
```

Expected: Codex points at `./skills/superteam`, Claude still points at `patinaproject/superteam`, and no unrelated manifest fields changed.

### Task 2: Rewrite the README as the canonical marketplace guide

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace the current README structure with a marketplace-first layout**

```md
# Patina Project Marketplace

Marketplace catalogs for Patina Project plugins.

This repository is the marketplace surface, not the source repository for each plugin package. It is intentionally modeled on `obra/superpowers-marketplace`: keep the marketplace metadata obvious, keep the root small, and keep upstream plugin implementation in the owning repositories.

## Repository Structure

- `.agents/plugins/marketplace.json`: Codex marketplace catalog
- `.claude-plugin/marketplace.json`: Claude marketplace catalog
- `docs/superpowers/`: issue-driven design and planning artifacts for marketplace maintenance
- `AGENTS.md`: contributor rules for working in this repository

## Ownership Boundaries

This repository owns:

- marketplace catalogs
- marketplace-facing install documentation
- contributor guidance for marketplace maintenance

Upstream plugin repositories own:

- plugin code and skills
- plugin manifests and package internals
- plugin-specific implementation details and release cadence

## Current Plugin

- `superteam`: sourced from `patinaproject/superteam`

## Install In Codex

```bash
codex plugin marketplace add patinaproject/skills --ref main
codex plugin marketplace upgrade
```

Codex installs `superteam` from the upstream repository path declared in `.agents/plugins/marketplace.json`.

## Install In Claude Code

Claude reads the marketplace definition from `.claude-plugin/marketplace.json`.

The `superteam` marketplace entry points at the upstream `patinaproject/superteam` repository, whose canonical checked-in skill payload now lives under `skills/superteam`.

## Local Development

```bash
codex plugin marketplace add ./skills
```

## Maintenance Notes

- Update marketplace entries in `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`
- Keep Git-backed entries pinned to an explicit `ref` or `sha`
- Keep upstream-path references aligned with the canonical plugin location in the owning repository
```

Expected: the README becomes the primary structure and ownership doc, reflects the reference marketplace style, and updates all prose references to the canonical upstream `skills/superteam` location.

- [ ] **Step 2: Re-read the README for stale duplicate-path language**

```bash
rg -n "plugins/superteam|skills/superteam|file-structure" README.md
sed -n '1,220p' README.md
```

Expected: `README.md` contains only the intended canonical `skills/superteam` path references and no outdated `plugins/superteam` prose.

### Task 3: Remove duplicate structure docs and align contributor guidance

**Files:**
- Delete: `docs/file-structure.md`
- Modify: `AGENTS.md`
- Review: `CLAUDE.md`

- [ ] **Step 1: Delete the redundant structure doc after moving its durable content into README**

```bash
test -f docs/file-structure.md && echo "delete me"
```

Expected: `docs/file-structure.md` exists before deletion and is removed in this task.

- [ ] **Step 2: Update `AGENTS.md` so its structure section matches the simplified marketplace-first layout**

```md
## Project Structure & Module Organization

This repository is the marketplace surface for Patina Project plugins and related install documentation.

- `.agents/plugins/marketplace.json`: repo-local Codex marketplace source of truth
- `.claude-plugin/marketplace.json`: repo-local Claude marketplace source of truth
- `docs/`: contributor docs plus planning artifacts; use `docs/superpowers/` for Superpowers-generated specs and plans
- This repo owns marketplace metadata and install documentation; upstream plugin repos own plugin implementation and package internals
- If `CLAUDE.md` exists, it should point contributors back to `AGENTS.md`
- root config: `package.json`, `commitizen.config.js`, `commitlint.config.js`, and `.husky/`
```

Expected: contributor guidance no longer refers readers to `docs/file-structure.md` and clearly states the marketplace-versus-upstream ownership boundary.

- [ ] **Step 3: Verify `CLAUDE.md` still correctly delegates to `AGENTS.md`**

```bash
sed -n '1,80p' CLAUDE.md
```

Expected: `CLAUDE.md` remains a short pointer back to `AGENTS.md` with no extra structure guidance added.

### Task 4: Verify the final repository state

**Files:**
- Review: `.agents/plugins/marketplace.json`
- Review: `.claude-plugin/marketplace.json`
- Review: `README.md`
- Review: `AGENTS.md`
- Review: `CLAUDE.md`

- [ ] **Step 1: Search the repo for obsolete path references**

```bash
rg -n "plugins/superteam|docs/file-structure.md" .
```

Expected: no remaining references to `plugins/superteam` or `docs/file-structure.md`.

- [ ] **Step 2: Print the final edited files for spot-checking**

```bash
sed -n '1,220p' .agents/plugins/marketplace.json
sed -n '1,220p' .claude-plugin/marketplace.json
sed -n '1,260p' README.md
sed -n '1,220p' AGENTS.md
sed -n '1,80p' CLAUDE.md
```

Expected: root docs are consistent, the Codex manifest points to `./skills/superteam`, and the ownership boundary is described consistently across the repo.

- [ ] **Step 3: Check git status for the intended scope**

```bash
git status --short
```

Expected: only the marketplace manifest, README, AGENTS doc, spec/plan docs, and the deleted `docs/file-structure.md` appear in the change set.
