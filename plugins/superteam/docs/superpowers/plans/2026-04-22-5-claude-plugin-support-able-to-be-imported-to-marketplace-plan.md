# Plan: Claude plugin support (able to be imported to marketplace) [#5](https://github.com/patinaproject/superteam/issues/5)

<!-- markdownlint-disable MD001 MD040 -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `patinaproject/superteam` a valid Claude Code plugin at the repository root so it can be validated locally now and consumed by a Claude marketplace later.

**Architecture:** Keep `skills/superteam/` as the source-of-truth skill payload and add a root Claude plugin manifest in `.claude-plugin/plugin.json`. Update the repo docs so contributors understand that the repository root is now the Claude-native install surface, while `plugins/superteam/` remains the packaged Codex surface.

**Tech Stack:** Markdown, JSON, Claude Code plugin manifests, pnpm repo tooling

---

### Task 1: Add the root Claude plugin manifest

**Files:**

- Create: `.claude-plugin/plugin.json`
- Modify: `README.md`
- Test: Claude Code plugin validation against the repository root

- [ ] **Step 1: Verify the repository root is not yet a valid Claude plugin**

Run:

```bash
claude plugin validate /Users/tlmader/dev/patinaproject/superteam
```

Expected:

- FAIL with `No manifest found in directory. Expected .claude-plugin/marketplace.json or .claude-plugin/plugin.json`

- [ ] **Step 2: Create the root Claude plugin manifest**

Create `.claude-plugin/plugin.json` with:

```json
{
  "name": "superteam",
  "description": "Claude Code plugin that exposes the superteam orchestration skill for issue-driven multi-agent work.",
  "version": "0.1.0",
  "author": {
    "name": "Patina Project"
  },
  "homepage": "https://github.com/patinaproject/superteam",
  "repository": "https://github.com/patinaproject/superteam",
  "license": "MIT",
  "keywords": ["claude-code", "plugin", "skills", "orchestration", "superteam"],
  "skills": "./skills"
}
```

- [ ] **Step 3: Update the main README with Claude-native install guidance**

Add a new section near the existing packaging guidance that tells readers:

```md
## Claude Code plugin

This repository root is also a Claude Code plugin.

- Claude Code discovers the plugin from `.claude-plugin/plugin.json`
- The shared skill payload lives in `skills/superteam/`
- During development, test the plugin locally with:

```bash
claude --plugin-dir .
```

Once Claude Code starts, the plugin skill is available under the plugin namespace:

```text
/superteam:superteam
```

For marketplace distribution, this repository can be referenced directly as a Claude plugin source.

```

- [ ] **Step 4: Validate the repository root after adding the manifest**

Run:

```bash
claude plugin validate /Users/tlmader/dev/patinaproject/superteam
```

Expected:

- PASS with no validation errors

- [ ] **Step 5: Commit the Claude plugin manifest and README changes**

Run:

```bash
git add .claude-plugin/plugin.json README.md
git commit -m "feat: #5 add claude plugin manifest"
```

### Task 2: Document the dual install surfaces for contributors

**Files:**

- Modify: `docs/file-structure.md`
- Modify: `AGENTS.md`
- Test: `README.md`, `docs/file-structure.md`, and `AGENTS.md` all describe the same naming and install model

- [ ] **Step 1: Add the Claude plugin root to the file-structure guide**

Update `docs/file-structure.md` so the top-level section includes:

```md
- `.claude-plugin/`: Claude Code plugin manifest for direct install and marketplace import
```

Update the plugin section to explain both plugin surfaces:

```md
## Plugins

- Claude-native install surface: repository root with `.claude-plugin/plugin.json`
- Codex install surface: `plugins/superteam/` with `.codex-plugin/plugin.json`
```

Include a short example tree:

```text
.claude-plugin/
  plugin.json
skills/
  superteam/
    SKILL.md
```

- [ ] **Step 2: Keep `AGENTS.md` aligned with the new Claude plugin ownership**

Add one short note to `AGENTS.md` under the structure rules:

```md
For Claude Code support in this repository, treat the repository root as the plugin install surface when `.claude-plugin/plugin.json` is present.
```

Do not remove the existing Codex packaging guidance or the branch-based spec/plan naming rule.

- [ ] **Step 3: Verify the docs now reference the Claude plugin surface consistently**

Run:

```bash
rg -n "claude plugin|\\.claude-plugin|plugin install surface|--plugin-dir" README.md docs/file-structure.md AGENTS.md
```

Expected:

- matches in all three files
- wording consistently identifies the repository root as the Claude plugin surface

- [ ] **Step 4: Re-run plugin validation after doc updates**

Run:

```bash
claude plugin validate /Users/tlmader/dev/patinaproject/superteam
```

Expected:

- PASS with no validation errors

- [ ] **Step 5: Commit the contributor documentation updates**

Run:

```bash
git add docs/file-structure.md AGENTS.md
git commit -m "docs: #5 document claude plugin install surface"
```

### Task 3: Verify issue-scoped acceptance criteria coverage

**Files:**

- Modify: `docs/superpowers/specs/2026-04-22-5-claude-plugin-support-able-to-be-imported-to-marketplace-design.md`
- Test: repo status and document references

- [ ] **Step 1: Confirm this repo-level plan is scoped to the `superteam` acceptance criteria**

Check that the design doc still tracks:

```text
AC-5-1
AC-5-2
AC-5-3
AC-5-4
AC-5-5
```

And treat this implementation plan as covering:

```text
AC-5-1
AC-5-2
```

with `AC-5-3` and `AC-5-4` deferred to `patinaproject/skills`.

- [ ] **Step 2: Verify the updated spec and plan filenames follow the branch-based topic rule**

Run:

```bash
find docs/superpowers -maxdepth 2 -type f | sort
```

Expected:

- `docs/superpowers/specs/2026-04-22-5-claude-plugin-support-able-to-be-imported-to-marketplace-design.md`
- `docs/superpowers/plans/2026-04-22-5-claude-plugin-support-able-to-be-imported-to-marketplace-plan.md`

- [ ] **Step 3: Review the final working tree before handoff**

Run:

```bash
git status --short
```

Expected:

- only the issue #5 files are modified
- no `skills` repo files are touched from this plan

- [ ] **Step 4: Commit the plan and any spec-touchups needed for issue scoping**

Run:

```bash
git add docs/superpowers/specs/2026-04-22-5-claude-plugin-support-able-to-be-imported-to-marketplace-design.md docs/superpowers/plans/2026-04-22-5-claude-plugin-support-able-to-be-imported-to-marketplace-plan.md
git commit -m "docs: #5 add claude plugin support plan"
```
