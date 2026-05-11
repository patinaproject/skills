# Plan: Keep superteam plugin-only and delegate marketplace [#14](https://github.com/patinaproject/superteam/issues/14)

<!-- markdownlint-disable MD001 MD040 -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make this repository plugin-only, remove its local Codex marketplace surface, keep the packaged plugin name user-facing as `Superteam`, and align the live docs to that ownership model.

**Architecture:** Delete the repo-local marketplace manifest, preserve the packaged Codex plugin manifest and the root Claude plugin manifest, and rewrite the live contributor and user docs so they describe this repository as a plugin/package repo rather than a local marketplace. Leave machine identifiers as `superteam` and preserve the visible display name `Superteam`.

**Tech Stack:** JSON manifests, Markdown docs, shell verification with `rg`, `sed`, and `git diff`

---

### Task 1: Remove the local Codex marketplace surface

**Files:**

- Delete: `.agents/plugins/marketplace.json`

- [ ] **Step 1: Confirm the marketplace manifest is present before removal**

```bash
sed -n '1,200p' .agents/plugins/marketplace.json
```

Expected: the file exists and defines a repo-local marketplace entry for `superteam`.

- [ ] **Step 2: Delete the repo-local marketplace manifest**

```text
Delete `.agents/plugins/marketplace.json`.
```

- [ ] **Step 3: Verify the file is gone**

```bash
test ! -f .agents/plugins/marketplace.json && echo deleted
```

Expected: output is `deleted`.

### Task 2: Keep the packaged plugin manifest user-facing name as `Superteam`

**Files:**

- Modify: `plugins/superteam/.codex-plugin/plugin.json`

- [ ] **Step 1: Inspect the packaged plugin manifest**

```bash
sed -n '1,220p' plugins/superteam/.codex-plugin/plugin.json
```

Expected: the manifest exists and contains `interface.displayName`.

- [ ] **Step 2: Ensure the visible plugin name stays `Superteam`**

```json
{
  "interface": {
    "displayName": "Superteam"
  }
}
```

Expected: the packaged plugin keeps the visible display name `Superteam` while the machine name remains `superteam`.

- [ ] **Step 3: Verify the display-name field**

```bash
rg -n '"displayName"\\s*:\\s*"Superteam"' plugins/superteam/.codex-plugin/plugin.json
```

Expected: one match for the packaged plugin manifest.

### Task 3: Align the live docs to the plugin-only ownership model

**Files:**

- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/file-structure.md`

- [ ] **Step 1: Remove local-marketplace structure guidance from AGENTS**

```md
- `plugins/`: Codex plugin packages, for example `plugins/superteam/.codex-plugin/plugin.json`.
```

Expected: `AGENTS.md` no longer lists `.agents/plugins/marketplace.json` as part of this repo’s structure.

- [ ] **Step 2: Update README install-surface wording**

```md
## Install surfaces

- The repository root is the Claude Code plugin surface discovered via `.claude-plugin/plugin.json`.
- `plugins/superteam/` is the packaged Codex plugin surface for this repository.
```

Expected: the README describes this repo as plugin-only.

- [ ] **Step 3: Keep external marketplace references only where they describe external ownership**

```md
### Claude Code

1. After Superpowers is installed, register the Patina Project marketplace in Claude Code:
2. Install Superteam from that marketplace.
```

Expected: user-facing marketplace setup remains described as an external install path, not as a local marketplace owned by this repo.

- [ ] **Step 4: Update contributor docs for plugin-only structure**

```md
Treat `plugins/superteam/` as the packaged Codex plugin surface in this repository, and `skills/superteam/` as the authoring source.
```

Expected: `docs/file-structure.md` no longer says this repo has a local Codex marketplace manifest.

- [ ] **Step 5: Search live docs for stale local-marketplace wording**

```bash
rg -n '\\.agents/plugins/marketplace\\.json|repo-local plugin catalog for Codex discovery|user-facing Codex marketplace entry point' AGENTS.md README.md docs/file-structure.md
```

Expected: no matches.

### Task 4: Verify the final repo state and prepare for publish

**Files:**

- Verify: `AGENTS.md`
- Verify: `README.md`
- Verify: `docs/file-structure.md`
- Verify: `plugins/superteam/.codex-plugin/plugin.json`

- [ ] **Step 1: Re-open the final live files**

```bash
sed -n '1,220p' AGENTS.md
sed -n '1,220p' README.md
sed -n '1,220p' docs/file-structure.md
sed -n '1,220p' plugins/superteam/.codex-plugin/plugin.json
```

Expected: the docs and packaged manifest all reflect the plugin-only model.

- [ ] **Step 2: Run focused verification searches**

```bash
rg -n '"displayName"\\s*:\\s*"Superteam"' plugins/superteam/.codex-plugin/plugin.json
rg -n '\\.agents/plugins/marketplace\\.json|repo-local plugin catalog for Codex discovery|user-facing Codex marketplace entry point' AGENTS.md README.md docs/file-structure.md
git diff -- AGENTS.md README.md docs/file-structure.md plugins/superteam/.codex-plugin/plugin.json .agents/plugins/marketplace.json
```

Expected: `Superteam` is the visible plugin name, stale local-marketplace wording is absent from live docs, and the diff is limited to the intended structure/docs/plugin-manifest changes.

- [ ] **Step 3: Prepare acceptance-criteria summary**

```text
AC-14-1: `.agents/plugins/marketplace.json` is absent
AC-14-2: `plugins/superteam/.codex-plugin/plugin.json` remains the packaged Codex plugin manifest
AC-14-3: packaged plugin display name is `Superteam`
AC-14-4: `AGENTS.md`, `README.md`, and `docs/file-structure.md` describe this repo as plugin-only
AC-14-5: `.claude-plugin/plugin.json` remains intact
```
