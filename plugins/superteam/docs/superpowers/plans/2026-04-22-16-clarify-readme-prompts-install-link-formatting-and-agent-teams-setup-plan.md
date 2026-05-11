# Plan: Clarify README prompts, install link formatting, and Agent Teams setup [#16](https://github.com/patinaproject/superteam/issues/16)

<!-- markdownlint-disable MD001 MD040 -->

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the README so the install and first-use flow is easier to follow by replacing abstract invocation guidance with example prompts, labeling the Superpowers prerequisite link as `obra/superpowers`, adding an optional Claude Agent Teams setup note, and tightening adjacent confusing wording without expanding scope beyond this onboarding path.

**Architecture:** Keep implementation limited to `README.md`, preserving the current structure while making the install and invocation sections more actionable. Treat the already-present issue-title clarifications in `AGENTS.md` and `.github/pull_request_template.md` as existing branch context to preserve and cross-check for consistency, not as new implementation scope for this issue.

**Tech Stack:** Markdown, Mermaid, ripgrep, sed, git

---

### Task 1: Capture the current README onboarding flow and branch-local context

**Files:**

- Modify: `README.md`
- Reference: `AGENTS.md`
- Reference: `.github/pull_request_template.md`
- Reference: `docs/superpowers/specs/2026-04-22-16-clarify-readme-prompts-install-link-formatting-and-agent-teams-setup-design.md`
- Test: `README.md`

- [ ] **Step 1: Re-read the approved design and the affected README sections before editing**

Run:

```bash
sed -n '1,220p' docs/superpowers/specs/2026-04-22-16-clarify-readme-prompts-install-link-formatting-and-agent-teams-setup-design.md
sed -n '1,220p' README.md
```

Expected:

- the design limits scope to README wording and structure changes
- the `Run superteam anytime`, `Installation`, `Optional: Enable Agent Teams`, and first-use sections are all visible
- the current README still contains the abstract two-line prompt guidance and raw Superpowers URL block

- [ ] **Step 2: Confirm the branch already contains adjacent issue-title clarity edits that should be preserved**

Run:

```bash
sed -n '1,220p' AGENTS.md
sed -n '1,160p' .github/pull_request_template.md
```

Expected:

- `AGENTS.md` says GitHub issue titles should be plain-language and should not use conventional-commit prefixes
- `.github/pull_request_template.md` says the commit-style title rule applies to pull requests only
- no plan changes are needed for those files in this issue

- [ ] **Step 3: Snapshot the exact README strings that will be replaced**

Run:

```bash
rg -n "For a resumed issue|For a new requirement|https://github.com/obra/superpowers|Optional: Enable Agent Teams|Install surfaces|First use" README.md
```

Expected:

- matches for both abstract prompt lines
- a match for the raw Superpowers URL
- matches for the surrounding install and runtime sections that will receive wording-only clarity edits

### Task 2: Rewrite the README invocation guidance and install copy

**Files:**

- Modify: `README.md`
- Test: `README.md`

- [ ] **Step 1: Replace the abstract lifecycle instructions with concrete example prompts**

Update the `## Run superteam anytime` section in `README.md` so the explanatory paragraph remains, but the example block becomes user-facing prompts a reader can copy and adapt. Use content in this shape:

```md
For example:

```text
Continue issue #16 with Superteam from the current Planner artifact state and pick up from the next required teammate.
Add this new requirement to issue #16: make issue titles plain-language summaries, then route the workflow back through the right design and planning gates.
```

```

Keep the examples concrete and readable. They should make resumed work and requirement changes legible without changing any workflow behavior described elsewhere in the README.

- [ ] **Step 2: Convert the Superpowers prerequisite from a raw URL block to a labeled Markdown link**

Replace the raw URL block under `## Installation` with sentence-style copy:

```md
Install Superpowers first by following the setup instructions in [`obra/superpowers`](https://github.com/obra/superpowers).
```

Do not change install commands that follow. This is a formatting and readability fix only.

- [ ] **Step 3: Tighten nearby README wording in the same onboarding flow**

Edit only adjacent wording tied to install clarity, runtime clarity, or first-use comprehension. Specifically:

```md
## Install surfaces

- The repository root is the local Claude Code plugin surface discovered via `.claude-plugin/plugin.json`.
- `plugins/superteam/` is the packaged Codex install surface used by the Codex marketplace flow.
```

And ensure the Claude Code, Codex CLI, and Codex App sections use parallel wording around "after Superpowers is installed", "install Superteam", and "invoke Superteam from a GitHub issue" so the README reads like one onboarding flow rather than three differently phrased ones.

- [ ] **Step 4: Verify the README now contains the required prompt and install rewrites**

Run:

```bash
rg -n "Continue issue #16|Add this new requirement to issue #16|\\[`obra/superpowers`\\]|local Claude Code plugin surface|packaged Codex install surface" README.md
```

Expected:

- one match for the resumed-work example prompt
- one match for the new-requirement example prompt
- one match for the labeled `obra/superpowers` link
- matches for the tightened install-surface wording

### Task 3: Add optional Agent Teams setup guidance without changing the default workflow

**Files:**

- Modify: `README.md`
- Test: `README.md`

- [ ] **Step 1: Expand the optional Agent Teams section with actionable Claude configuration guidance**

Revise `### Optional: Enable Agent Teams` so it stays clearly optional and includes concrete enablement guidance in Claude configuration. Use wording in this shape:

```md
### Optional: Enable Agent Teams

If you want Claude Code to use Agent Teams for this workflow, enable Agent Teams in your Claude configuration before invoking Superteam.

For local setup, add or update your Claude config so Agent Teams are enabled for the environment where you run Claude Code, then run the same Superteam workflow as usual.

Agent Teams is optional. If you do not enable it, Superteam still works with the regular single-agent or subagent flow described above.
```

Keep the note lightweight. Do not add new runtime claims, deep configuration docs, or any language that suggests Agent Teams is required.

- [ ] **Step 2: Keep first-use guidance aligned with the new optional note**

Adjust the nearby first-use sentence only as needed so it still reads correctly after the Agent Teams clarification. The section should continue to say that, after setup, users start from a GitHub issue and invoke Superteam through the same teammate-owned workflow.

- [ ] **Step 3: Verify the Agent Teams note is actionable and still optional**

Run:

```bash
rg -n "Optional: Enable Agent Teams|enable Agent Teams in your Claude configuration|Agent Teams is optional|single-agent or subagent flow|start from a GitHub issue" README.md
```

Expected:

- one match for the optional section heading
- one match for the Claude configuration guidance
- one explicit statement that Agent Teams is optional
- one explicit statement preserving the default single-agent or subagent workflow
- the nearby first-use guidance still points users to start from a GitHub issue

### Task 4: Perform final README-focused validation and preserve adjacent branch edits

**Files:**

- Modify: `README.md`
- Reference: `AGENTS.md`
- Reference: `.github/pull_request_template.md`
- Test: `README.md`, `AGENTS.md`, `.github/pull_request_template.md`

- [ ] **Step 1: Review the edited README as rendered plain text**

Run:

```bash
sed -n '1,240p' README.md
```

Expected:

- the install and first-use flow reads cleanly from invocation guidance through runtime setup
- example prompts read like prompts, not meta-instructions
- the Agent Teams note is concise and clearly optional
- adjacent wording edits stay narrow and issue-aligned

- [ ] **Step 2: Verify the README changes do not contradict the existing issue-title guidance already on the branch**

Run:

```bash
rg -n "plain-language summaries|conventional-commit prefixes|pull requests only" AGENTS.md .github/pull_request_template.md
```

Expected:

- `AGENTS.md` still contains the plain-language issue-title rule
- `.github/pull_request_template.md` still limits commit-style title requirements to PRs
- the README changes do not require any further edits to those files for this issue

- [ ] **Step 3: Check the working tree to confirm only the intended README implementation was added on top of existing local edits**

Run:

```bash
git status --short
git diff -- README.md
```

Expected:

- `README.md` shows the planned clarity edits
- existing branch-local edits in `AGENTS.md` and `.github/pull_request_template.md` remain untouched
- no unrelated files were modified during execution
