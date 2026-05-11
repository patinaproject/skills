# /new-issue should work without LABELS.md Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/github-flows:new-issue` load labels from GitHub through `gh label list` instead of requiring local `.github/LABELS.md`.

**Architecture:** This is a documentation and workflow-contract change. The runtime contract in `skills/new-issue/workflow.md` becomes the source for agent behavior, while `docs/issue-filing-style.md` stays aligned for contributors and future skill runs.

**Tech Stack:** Markdown, GitHub CLI, markdownlint-cli2, repository Husky hooks.

---

## File Structure

- Modify `skills/new-issue/workflow.md`: replace the `.github/LABELS.md` parser contract with remote label loading, update Step 8 validation, and update refusal/reference tables.
- Modify `docs/issue-filing-style.md`: replace mandatory local label-inventory language with `gh label list` guidance and mark `.github/LABELS.md` optional for skills.
- Use existing verification commands only; no new scripts or executable tooling.

## Task 1: Update `/new-issue` Label Inventory Workflow

**Files:**

- Modify: `skills/new-issue/workflow.md`

- [ ] **Step 1: Write the workflow-contract pressure check**

  Before editing, record the stale mandatory local-label references:

  ```bash
  rg -n 'LABELS\.md table|LABELS\.md` not found|Read `?\.github/LABELS\.md|from \.github/LABELS\.md|in `\.github/LABELS\.md`' skills/new-issue/workflow.md
  ```

  Expected: matches in Step 1 and the refusal/quick-reference sections, proving the workflow currently blocks on `.github/LABELS.md`.

- [ ] **Step 2: Replace Step 1 with remote label loading**

  In `skills/new-issue/workflow.md`, change authoritative inputs and Step 1 so the workflow runs:

  ```bash
  gh label list --json name,description --jq '.'
  ```

  Required behavior text:

  - halt if the command fails, JSON is malformed, the list is empty, or any label has an empty `name`
  - warn but continue if descriptions are empty
  - derive label names from `gh label list` every run
  - state that local `.github/LABELS.md` is optional documentation and must not block issue creation

- [ ] **Step 3: Update Step 8 label validation**

  In `skills/new-issue/workflow.md`, make pre-creation validation reuse the Step 1 remote inventory or refresh with:

  ```bash
  gh label list --json name --jq '.[].name'
  ```

  Required refusal:

  ```text
  Label `{label}` does not exist on the remote repo. Run `gh label create {label} ...` first, or remove it from the selection.
  ```

- [ ] **Step 4: Update refusal and reference tables**

  In `skills/new-issue/workflow.md`, update the refusal condition, quick reference, and common mistakes table so they mention `gh label list` rather than mandatory `.github/LABELS.md`.

## Task 2: Align Issue Filing Guidance

**Files:**

- Modify: `docs/issue-filing-style.md`

- [ ] **Step 1: Update label source guidance**

  Replace local-label source text with:

  ```markdown
  For the label inventory, run `gh label list --json name,description`.
  ```

- [ ] **Step 2: Update the Labels section**

  Make the section say the inventory comes from the remote repository via:

  ```bash
  gh label list --json name,description
  ```

  Add a bullet that local `.github/LABELS.md` may document labels for humans, but skills must not require it.

## Task 3: Verify Workflow Contract

**Files:**

- Verify: `skills/new-issue/workflow.md`
- Verify: `docs/issue-filing-style.md`

- [ ] **Step 1: Search for stale mandatory local-label language**

  ```bash
  rg -n 'LABELS\.md table|LABELS\.md is missing|Read \.github/LABELS\.md|from \.github/LABELS\.md|in `\.github/LABELS\.md`|\.github/LABELS\.md` not found' skills/new-issue/workflow.md docs/issue-filing-style.md
  ```

  Expected: no matches.

- [ ] **Step 2: Verify the remote label command**

  ```bash
  gh label list --json name,description --jq 'length'
  ```

  Expected: exits 0 and prints a positive integer.

- [ ] **Step 3: Run markdown and whitespace checks**

  ```bash
  pnpm lint:md
  git diff --check
  ```

  Expected: both commands exit 0.

- [ ] **Step 4: Commit implementation**

  ```bash
  git add skills/new-issue/workflow.md docs/issue-filing-style.md
  git commit -m "docs: #13 use remote labels for new issues"
  ```

## Task 4: Reviewer Pressure Test

**Files:**

- Review: `skills/new-issue/workflow.md`
- Review: `docs/issue-filing-style.md`

- [ ] **Step 1: Run missing-LABELS.md walkthrough**

  Read Step 1 and confirm that a repository with no `.github/LABELS.md` but a working `gh label list` command proceeds to Step 2.

- [ ] **Step 2: Run chosen-label walkthrough**

  Read Step 8 and confirm that a chosen label is checked against the remote list and a missing label produces the remote-repo refusal.

- [ ] **Step 3: Run zero-label walkthrough**

  Confirm Step 4 and Step 9 still allow no selected labels and only print the existing advisory.

- [ ] **Step 4: Commit reviewer fixes only if needed**

  If the walkthrough finds a loophole, patch it, rerun Task 3 verification, and commit with:

  ```bash
  git commit -m "docs: #13 tighten new issue label workflow"
  ```
