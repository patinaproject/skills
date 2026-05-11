# Superteam Skill Import Implementation Plan

<!-- markdownlint-disable MD001 MD040 -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Import the Patina Project `super-team` skill into this repository as `superteam`, rewritten for this repo's public structure and Codex-oriented usage.

**Architecture:** Create a self-contained skill package in `skills/superteam/` with a standalone `SKILL.md` and two supporting templates. Add a repo-level docs file that explains how `skills/`, `docs/`, and tooling fit together so contributors understand where imported skills belong.

**Tech Stack:** Markdown, Git, pnpm-managed repo tooling

---

### Task 1: Add the imported skill package

**Files:**

- Create: `skills/superteam/SKILL.md`
- Create: `skills/superteam/agent-spawn-template.md`
- Create: `skills/superteam/pr-body-template.md`

- [ ] **Step 1: Write the imported `superteam` skill as a standalone package**

Create the three Markdown files above, using the Patina Project `super-team` skill as source material while rewriting:

- the skill name from `super-team` to `superteam`
- internal references from `.claude/skills/...` to `skills/superteam/...` or `skills/**/*.md`
- repo-specific references from Patina-only docs and paths to repository-generic guidance
- hardcoded repo owner/name examples to placeholders such as `<owner>`, `<repo>`, and `<branch>`

- [ ] **Step 2: Keep the imported structure compact and public**

Do not import Patina-only pressure-test fixtures or hidden adapter wrappers. Preserve only the contributor-facing files that make sense in this repository:

- `SKILL.md`
- `agent-spawn-template.md`
- `pr-body-template.md`

- [ ] **Step 3: Verify the imported skill package exists and reads cleanly**

Run:

```bash
find skills/superteam -maxdepth 2 -type f | sort
sed -n '1,200p' skills/superteam/SKILL.md
```

Expected:

- all three files are present
- the frontmatter uses `name: superteam`
- no Patina-private skill path references remain

### Task 2: Document repository file structure

**Files:**

- Create: `docs/file-structure.md`

- [ ] **Step 1: Add a concise repository structure guide**

Create `docs/file-structure.md` describing the intended layout for:

- `skills/` for installable skill packages
- `docs/` for repository documentation and planning artifacts
- root tooling files such as `package.json`, `commitlint.config.js`, and `.husky/`

- [ ] **Step 2: Include the imported `superteam` package in the examples**

Document the expected `skills/superteam/` layout and briefly describe what each file is for so contributors can add similar packages consistently.

- [ ] **Step 3: Verify the docs file is present and aligned with the repo**

Run:

```bash
sed -n '1,200p' docs/file-structure.md
find docs -maxdepth 3 -type f | sort
```

Expected:

- `docs/file-structure.md` exists
- the doc references the actual repository paths that now exist
