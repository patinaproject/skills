# Plan: Simplify README skill invocation examples [#18](https://github.com/patinaproject/github-flows/issues/18)

> **For agentic workers:** REQUIRED SUB-SKILL: Use
> `superpowers:executing-plans` to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update README skill examples so the skill list shows what users type
and includes a concrete `Using GitHub` router example.

**Architecture:** Keep the change README-only. Treat the README as the public
interface: simplify the top-level skill inventory, preserve installation
commands, and add a Codex-style example for `$github-flows:using-github`.

**Tech Stack:** Markdown, `markdownlint-cli2`, `rg`, Git.

---

## File Structure

- Modify `README.md`: simplify skill invocations and add a concrete
  `Using GitHub` example.

## Task 1: Simplify The README Skill List

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Inspect the existing skill list**

Run:

```bash
sed -n '1,80p' README.md
```

Expected: the "What you get" list currently uses plugin-qualified names such
as `/github-flows:new-issue`.

- [ ] **Step 2: Update the "What you get" list**

Replace the current bullets with:

```markdown
- **`/using-github`** — Start here for GitHub work. It reads repository rules
  and routes issue, branch, PR, and changelog tasks to the right workflow.
- **`/new-issue`** — File a new GitHub issue with smart label selection,
  duplicate detection, and a public-repo leak guard.
- **`/edit-issue`** — Edit an existing issue's title, body, labels, assignees,
  milestone, state, close reason, or relationships, preferring GraphQL where
  REST falls short.
- **`/new-branch`** — Start work on an issue: branch from the default branch as
  `<issue-number>-<kebab-title>`, rebase, and install dependencies via the
  highest-priority lockfile.
- **`/write-changelog`** — Render a user-facing changelog from a GitHub
  milestone, sourced from closed issues and their merging PRs.
```

Expected: AC-18-1 is satisfied for the main skill list.

## Task 2: Add A Concrete Using GitHub Example

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Update Quick Start examples**

In the "Quick start" section, keep marketplace and plugin install commands
unchanged. Change the example invocation to use `/using-github` as the
human-facing router:

```text
/using-github

New issue: tried the github-flows quick start. When the issue is created, start
a branch for it.
```

Expected: the quick start demonstrates the router as the first skill for
multi-step GitHub work without changing plugin installation syntax.

- [ ] **Step 2: Update Claude Code install example**

In the Claude Code install subsection, change the sample invocation to:

```text
/using-github

New issue: tried the github-flows install steps. When the issue is created,
start a branch for it.
```

Expected: Claude Code examples use slash-command syntax without the
`github-flows:` prefix.

- [ ] **Step 3: Update Codex examples**

In both Codex subsections, replace the generic `$github-flows` wording with a
specific router example:

```text
[$github-flows:using-github]

New issue: simplify the README examples. When the issue is created, create a
new branch and begin work.
```

Expected: AC-18-2 is satisfied by a concrete `Using GitHub` example similar to
an explicit skill invocation.

## Task 3: Verify README Copy And Markdown

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Review remaining `github-flows:` matches**

Run:

```bash
rg 'github-flows:' README.md
```

Expected: remaining matches appear only in Codex-style skill reference examples
or other runtime-specific syntax, not in the top-level skill list.

- [ ] **Step 2: Verify `Using GitHub` discoverability**

Run:

```bash
rg 'using-github|Using GitHub|/using-github' README.md
```

Expected: the router skill appears in the skill list and concrete examples.

- [ ] **Step 3: Run markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: `Summary: 0 error(s)`.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add README.md
git commit -m "docs: #18 simplify README skill examples"
```

Expected: the commit succeeds after the pre-commit hook runs markdownlint and
version checks.

## Self-Review

- Spec coverage: Task 1 covers AC-18-1, Task 2 covers AC-18-2, and Task 3
  covers AC-18-3.
- Placeholder scan: no placeholders are present.
- Scope check: this plan is README-only, matching the approved design.
