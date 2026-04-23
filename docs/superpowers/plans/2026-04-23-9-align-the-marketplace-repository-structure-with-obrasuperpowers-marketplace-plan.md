# Align The Marketplace Repository Structure With Obra/Superpowers Marketplace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update this repository's marketplace metadata and contributor docs so `superteam` points at the root-packaged `patinaproject/superteam` plugin surface instead of the removed `./plugins/superteam` subdirectory.

**Architecture:** Keep the change confined to catalog-and-doc surfaces owned by `patinaproject/skills`. Switch the Codex marketplace entry from the subdirectory-backed source model to the root-package source model documented in [docs/file-structure.md](/Users/tlmader/.codex/worktrees/0778/skills/docs/file-structure.md), then refresh README guidance so it consistently describes the upstream root manifests and `skills/superteam/` layout without blurring the source-of-truth boundary.

**Tech Stack:** JSON marketplace manifests, Markdown documentation, `rg`, `sed`, `pnpm exec commitlint`

---

### Task 1: Update the Codex marketplace entry for the root-packaged upstream plugin

**Files:**
- Modify: `/Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json`
- Reference only: `/Users/tlmader/.codex/worktrees/0778/skills/docs/file-structure.md`
- Test: `/Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json`

- [ ] **Step 1: Confirm the current entry still uses the stale subdirectory source model**

Run:

```bash
sed -n '1,200p' /Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json
```

Expected: the `superteam` entry shows `"source": "git-subdir"`, `"url": "https://github.com/patinaproject/superteam.git"`, `"path": "./plugins/superteam"`, and `"ref": "main"`.

- [ ] **Step 2: Re-read the repository guidance for root-packaged upstream plugins**

Run:

```bash
sed -n '1,200p' /Users/tlmader/.codex/worktrees/0778/skills/docs/file-structure.md
```

Expected: the marketplace workflow section says root-level upstream plugins use `source: "url"` and subdirectory-backed plugins use `source: "git-subdir"`.

- [ ] **Step 3: Replace the subdirectory source object with the root-package source model**

Update `/Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json` so the `superteam` entry becomes:

```json
{
  "name": "superteam",
  "source": {
    "source": "url",
    "url": "https://github.com/patinaproject/superteam.git",
    "ref": "main"
  },
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  },
  "category": "Productivity"
}
```

Keep the plugin name, URL, policy, category, and explicit ref unchanged. Remove the stale `"path": "./plugins/superteam"` field entirely.

- [ ] **Step 4: Verify the metadata now matches the approved root-package model**

Run:

```bash
rg -n '"source": "url"|"url": "https://github.com/patinaproject/superteam.git"|"ref": "main"|git-subdir|plugins/superteam' /Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json
```

Expected:
- one match for `"source": "url"`
- one match for the upstream GitHub URL
- one match for `"ref": "main"`
- no matches for `git-subdir`
- no matches for `plugins/superteam`

- [ ] **Step 5: Record the marketplace-only change before moving to docs**

Run:

```bash
git diff -- /Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json
```

Expected: the diff shows only the source-model change from `git-subdir` plus `path` to `url` without unrelated edits.

### Task 2: Refresh README install guidance to match the upstream root layout

**Files:**
- Modify: `/Users/tlmader/.codex/worktrees/0778/skills/README.md`
- Reference only: `/Users/tlmader/.codex/worktrees/0778/skills/.claude-plugin/marketplace.json`
- Test: `/Users/tlmader/.codex/worktrees/0778/skills/README.md`

- [ ] **Step 1: Capture the stale README statements that still teach the deleted plugin path**

Run:

```bash
rg -n 'git-subdir|plugins/superteam|\\.codex-plugin/plugin.json|\\.claude-plugin/plugin.json|skills/superteam' /Users/tlmader/.codex/worktrees/0778/skills/README.md
```

Expected: matches include the old `git-subdir` explanation, the `./plugins/superteam` install path, and the outdated GitHub blob URL under `plugins/superteam/skills/superteam/SKILL.md`.

- [ ] **Step 2: Confirm the Claude marketplace entry still points at the correct upstream repository**

Run:

```bash
sed -n '1,200p' /Users/tlmader/.codex/worktrees/0778/skills/.claude-plugin/marketplace.json
```

Expected: the `superteam` entry continues to use `"repo": "patinaproject/superteam"` with no subdirectory path encoded in the catalog entry.

- [ ] **Step 3: Rewrite the README sections that describe the active install surface**

Update `/Users/tlmader/.codex/worktrees/0778/skills/README.md` so it:

```md
- describes `superteam` as installed from `patinaproject/superteam` as a root-packaged plugin on `main`
- explains that `patinaproject/skills` owns marketplace catalogs and contributor docs, while `patinaproject/superteam` owns the installable plugin package
- states that the upstream Codex manifest lives at `.codex-plugin/plugin.json`
- states that the upstream Claude manifest lives at `.claude-plugin/plugin.json`
- states that the upstream skill content lives at `skills/superteam/`
- removes active-install wording that says Codex targets `./plugins/superteam`
- updates the direct Claude reference URL from `/blob/main/plugins/superteam/skills/superteam/SKILL.md` to `/blob/main/skills/superteam/SKILL.md`
```

Preserve the existing marketplace-install commands and the note that this repository does not vendor `superteam` locally.

- [ ] **Step 4: Verify the README now teaches a single current structure**

Run:

```bash
rg -n 'patinaproject/superteam|\\.codex-plugin/plugin.json|\\.claude-plugin/plugin.json|skills/superteam|plugins/superteam|git-subdir' /Users/tlmader/.codex/worktrees/0778/skills/README.md
```

Expected:
- matches for `patinaproject/superteam`, `.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, and `skills/superteam`
- no matches for `plugins/superteam`
- no matches for `git-subdir`

- [ ] **Step 5: Review the README diff for scope discipline**

Run:

```bash
git diff -- /Users/tlmader/.codex/worktrees/0778/skills/README.md
```

Expected: the diff is limited to install-surface wording, the source-of-truth boundary explanation, and the updated Claude skill link.

### Task 3: Run repository-level verification for stale path removal and catalog consistency

**Files:**
- Verify only: `/Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json`
- Verify only: `/Users/tlmader/.codex/worktrees/0778/skills/.claude-plugin/marketplace.json`
- Verify only: `/Users/tlmader/.codex/worktrees/0778/skills/README.md`

- [ ] **Step 1: Search the repo for stale active-install references**

Run:

```bash
rg -n './plugins/superteam|plugins/superteam' /Users/tlmader/.codex/worktrees/0778/skills
```

Expected:
- no matches in `/Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json`
- no matches in `/Users/tlmader/.codex/worktrees/0778/skills/README.md`
- matches may remain in historical design or plan artifacts under `docs/superpowers/`, which are acceptable because they document prior state rather than active instructions

- [ ] **Step 2: Verify the live catalog and docs agree on the upstream ownership model**

Run:

```bash
rg -n 'patinaproject/superteam|\\.codex-plugin/plugin.json|\\.claude-plugin/plugin.json|skills/superteam|"source": "url"|git-subdir' /Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json /Users/tlmader/.codex/worktrees/0778/skills/.claude-plugin/marketplace.json /Users/tlmader/.codex/worktrees/0778/skills/README.md
```

Expected:
- `.agents/plugins/marketplace.json` shows `"source": "url"` for `superteam`
- `.claude-plugin/marketplace.json` still points at `patinaproject/superteam`
- `README.md` describes the root `.codex-plugin/plugin.json`, root `.claude-plugin/plugin.json`, and `skills/superteam/`
- no live-file matches for `git-subdir`

- [ ] **Step 3: Inspect the final patch set before commit preparation**

Run:

```bash
git diff -- /Users/tlmader/.codex/worktrees/0778/skills/.agents/plugins/marketplace.json /Users/tlmader/.codex/worktrees/0778/skills/README.md
```

Expected: only the marketplace metadata and README documentation change, with no drift into plugin package content or unrelated docs.

- [ ] **Step 4: Validate the eventual commit message format before handoff**

Run:

```bash
printf 'docs: #9 align superteam marketplace root package\n' >/tmp/issue-9-commit-msg.txt && pnpm exec commitlint --edit /tmp/issue-9-commit-msg.txt
```

Expected: exit code `0`, confirming the proposed issue-tagged conventional commit format is accepted by repo tooling.

- [ ] **Step 5: Prepare the execution handoff notes**

Record in the implementation handoff that:

```text
Completed scope should be limited to:
1. .agents/plugins/marketplace.json source-model update for superteam
2. README.md wording updates for the upstream root-packaged layout
3. verification evidence showing no active live-file references to ./plugins/superteam remain
```

Expected: the handoff notes map cleanly to AC-9-1, AC-9-2, and AC-9-3 without expanding the issue boundary.
