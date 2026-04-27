# Plan: Rename repository to using-github [#22](https://github.com/patinaproject/using-github/issues/22)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the repo/plugin identity to `using-github`, ship only the
`using-github` skill, and preserve the former specialized workflows through the
remaining skill contract.

**Architecture:** Keep one installable skill directory, `skills/using-github`.
Move former workflow guarantees into that skill and document detailed coverage
in `docs/using-github-workflow-traceability.md` so reviewers can verify the
breaking surface change without losing behavior.

**Tech Stack:** Markdown skills and docs, JSON plugin manifests, npm package
metadata, pnpm scripts, markdownlint-cli2, GitHub CLI for issue/PR metadata.

---

## Task 1: Rename Current Metadata And Guidance

**Files:**

- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.codex-plugin/plugin.json`
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `AGENTS.md`
- Modify: `.github/copilot-instructions.md`
- Modify: `.windsurfrules`
- Modify: `.cursor/rules/github-flows.mdc`
- Move: `.cursor/rules/github-flows.mdc` to `.cursor/rules/using-github.mdc`
- Modify: `.github/LABELS.md`
- Modify: `docs/issue-filing-style.md`
- Modify: `RELEASING.md`

- [ ] **Step 1: Update package and plugin identity**

  Set `package.json` name to `using-github`. In both plugin manifests, set
  `name`, `displayName`, URL fields, and default prompts to `using-github` and
  `https://github.com/patinaproject/using-github`.

- [ ] **Step 2: Refresh lockfile metadata**

  Run:

  ```bash
  pnpm install --lockfile-only
  ```

  Expected: lockfile updates the importer name without dependency changes.

- [ ] **Step 3: Update current user-facing docs**

  Rewrite README, contributor, agent, editor, label, issue-filing, and releasing
  docs so current guidance says `using-github`, not `github-flows`, except for
  historical references and compatibility notes.

- [ ] **Step 4: Verify identity references**

  Run:

  ```bash
  rg '"name": "github-flows"|displayName.: "github-flows"|github-flows@patinaproject-skills' package.json .claude-plugin .codex-plugin README.md
  ```

  Expected: no matches.

- [ ] **Step 5: Commit metadata and guidance**

  ```bash
  git add package.json pnpm-lock.yaml .claude-plugin/plugin.json .codex-plugin/plugin.json README.md CONTRIBUTING.md AGENTS.md .github/copilot-instructions.md .windsurfrules .cursor/rules .github/LABELS.md docs/issue-filing-style.md RELEASING.md
  git commit -m "feat: #22 rename plugin identity to using-github"
  ```

## Task 2: Consolidate Skill Behavior

**Files:**

- Modify: `skills/using-github/SKILL.md`
- Create: `docs/using-github-workflow-traceability.md`
- Delete: `skills/new-issue/`
- Delete: `skills/edit-issue/`
- Delete: `skills/new-branch/`
- Delete: `skills/write-changelog/`

- [ ] **Step 1: Rewrite the remaining skill contract**

  Replace router-only language in `skills/using-github/SKILL.md` with direct,
  imperative rules for:

  - first checks and public-repo leak guard
  - issue creation, including templates, labels, milestones, duplicate checks,
    relationship handling, and refusal conditions
  - issue editing, including same-repo guard and metadata/body safety
  - issue branch creation, including branch naming, clean tree check, fetch,
    checkout/rebase, install, and conflict refusal
  - milestone changelog rendering, including current-repo guard, issue/PR data
    sourcing, public output safety, and release-note insertion expectations
  - PR creation, including template order, title format, acceptance criteria,
    validation, and breaking-change callout

- [ ] **Step 2: Add traceability matrix**

  Create `docs/using-github-workflow-traceability.md` with a table mapping each
  removed workflow to the remaining `skills/using-github/SKILL.md` sections and
  listing happy-path coverage plus refusal-condition groups.

- [ ] **Step 3: Remove specialized skill directories**

  Run:

  ```bash
  rm -rf skills/new-issue skills/edit-issue skills/new-branch skills/write-changelog
  ```

  Expected: only `skills/using-github/SKILL.md` and its adjacent metadata remain.

- [ ] **Step 4: Verify only one skill ships**

  Run:

  ```bash
  find skills -maxdepth 2 -name SKILL.md -print
  ```

  Expected output:

  ```text
  skills/using-github/SKILL.md
  ```

- [ ] **Step 5: Verify no removed local-skill delegation remains**

  Run:

  ```bash
  rg '/github-flows:(new-issue|edit-issue|new-branch|write-changelog)|/using-github:(new-issue|edit-issue|new-branch|write-changelog)' skills README.md AGENTS.md docs/issue-filing-style.md .github/copilot-instructions.md .windsurfrules .cursor
  ```

  Expected: no current guidance tells users or agents to invoke removed skills.

- [ ] **Step 6: Commit skill consolidation**

  ```bash
  git add skills docs/using-github-workflow-traceability.md README.md AGENTS.md docs/issue-filing-style.md .github/copilot-instructions.md .windsurfrules .cursor
  git commit -m "feat: #22 consolidate GitHub workflows into using-github"
  ```

## Task 3: Mark Breaking Change And Validate

**Files:**

- Modify: `README.md`
- Modify: `RELEASING.md`
- Modify: `.github/pull_request_template.md` only if the existing template
  cannot express the breaking-change note under current headings.

- [ ] **Step 1: Add breaking-change release note**

  Add current documentation that says direct `new-issue`, `edit-issue`,
  `new-branch`, and `write-changelog` skill invocations are removed. Direct
  users to `using-github` as the supported entry point.

- [ ] **Step 2: Run markdown and version checks**

  Run:

  ```bash
  pnpm lint:md
  pnpm check:versions
  ```

  Expected: both pass.

- [ ] **Step 3: Run design validation probes**

  Run:

  ```bash
  find skills -maxdepth 2 -name SKILL.md -print
  rg '"name": "github-flows"|displayName.: "github-flows"|github-flows@patinaproject-skills' package.json .claude-plugin .codex-plugin README.md
  rg 'patinaproject/github-flows|github.com/patinaproject/github-flows'
  ```

  Expected: one skill file; no current package/plugin/install identity matches;
  remaining old repo matches are historical or compatibility notes.

- [ ] **Step 4: Commit validation-facing docs**

  ```bash
  git add README.md RELEASING.md .github/pull_request_template.md
  git commit -m "docs: #22 document breaking using-github migration"
  ```

## Task 4: Local Review And Publish

**Files:**

- Read: `.github/pull_request_template.md`
- Create: a temporary PR body file outside the repository or under `/tmp`

- [ ] **Step 1: Review changed skill surfaces**

  Run a local review pass over `skills/using-github/SKILL.md` and
  `docs/using-github-workflow-traceability.md`, checking that removed workflow
  behavior is not merely summarized.

- [ ] **Step 2: Push branch**

  ```bash
  git push -u origin 22-rename-repository-to-using-github
  ```

- [ ] **Step 3: Create PR with breaking-change title/body**

  Use title:

  ```text
  feat!: #22 rename plugin to using-github
  ```

  Render the repository PR template, include `Closes #22`, include AC sections
  for `AC-22-1` through `AC-22-8`, and include validation commands under the ACs
  they prove.

- [ ] **Step 4: Check publish state**

  Run:

  ```bash
  gh pr view --json number,url,state,mergeStateStatus,statusCheckRollup,reviewDecision
  ```

  Expected: PR exists. If checks are pending, stay in Finisher monitoring; if
  checks fail, triage before final handoff.
