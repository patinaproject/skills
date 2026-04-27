# Introduce /using-github as the central GitHub behavior guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/using-github` as the umbrella GitHub behavior skill and center repository guidance around it.

**Architecture:** Keep existing workflow skills authoritative and add a small routing skill at `skills/using-github/SKILL.md`. Update user-facing and editor guidance to point agents to `/using-github` first, while preserving detailed procedures in the current specialized skills. Record RED/GREEN pressure-test evidence as durable documentation.

**Tech Stack:** Markdown skills and docs, GitHub CLI conventions, `markdownlint-cli2`, `rg`, Git.

---

## File Structure

- Create `skills/using-github/SKILL.md`: umbrella skill contract and routing guide.
- Create `docs/superpowers/pressure-tests/2026-04-27-15-using-github-pressure-test.md`: RED/GREEN pressure-test evidence for the new skill.
- Modify `README.md`: introduce `/using-github` first and update quick-start invocation.
- Modify `AGENTS.md`: point GitHub work toward `/using-github`.
- Modify `.github/copilot-instructions.md`: center Copilot guidance on `/using-github`.
- Modify `.cursor/rules/github-flows.mdc`: center Cursor guidance on `/using-github`.
- Modify `.windsurfrules`: center Windsurf guidance on `/using-github`.
- Modify `docs/file-structure.md`: include `using-github` in the skill inventory.

## Task 1: RED Pressure Scenario

**Files:**

- Create: `docs/superpowers/pressure-tests/2026-04-27-15-using-github-pressure-test.md`

- [ ] **Step 1: Run the baseline pressure scenario**

Dispatch or simulate a fresh-agent prompt without mentioning `/using-github`:

```text
You are in patinaproject/github-flows. A user asks you to file a GitHub issue,
start an issue branch, update PR guidance, and avoid leaking private repo
details. Which repository guidance and skills do you use first?
```

Expected RED evidence: the agent may find individual skills or docs, but there
is no single umbrella skill to invoke as the central GitHub behavior guide.

- [ ] **Step 2: Record the RED result**

Create the pressure-test document:

```markdown
# Pressure Test: /using-github Skill [#15](https://github.com/patinaproject/github-flows/issues/15)

## RED: Baseline Without /using-github

Prompt:

> You are in patinaproject/github-flows. A user asks you to file a GitHub issue,
> start an issue branch, update PR guidance, and avoid leaking private repo
> details. Which repository guidance and skills do you use first?

Observed gap:

- No `skills/using-github/SKILL.md` exists.
- Agents must discover `new-issue`, `new-branch`, `edit-issue`,
  `write-changelog`, `AGENTS.md`, and issue-filing docs piecemeal.
- There is no central skill that tells agents how to route mixed GitHub work.

Expected fix:

- `/using-github` exists and routes mixed GitHub work through the current
  specialized skills and repository docs.

## GREEN: With /using-github

This section is completed after the skill and docs are implemented so RED
evidence is committed before GREEN evidence.
```

- [ ] **Step 3: Commit RED evidence**

```bash
git add docs/superpowers/pressure-tests/2026-04-27-15-using-github-pressure-test.md
git commit -m "test: #15 capture using-github pressure scenario"
```

## Task 2: Add the /using-github Skill

**Files:**

- Create: `skills/using-github/SKILL.md`

- [ ] **Step 1: Write the skill**

Create `skills/using-github/SKILL.md`:

```markdown
---
name: using-github
description: Use when an agent is asked to perform GitHub work in a repository that should follow github-flows conventions
---

# Using GitHub

Use this skill as the entry point for GitHub work. It orients the agent to the
repository's GitHub rules, then routes task-specific work to the specialized
github-flows skills.

## First Checks

- Read root repository guidance such as `AGENTS.md`.
- Read local docs that govern the files or GitHub surface being changed.
- Use repository templates for issues and pull requests.
- Use canonical labels from the repository label inventory.
- Do not manually apply or remove reserved release automation labels.
- Keep public-repo output free of private repository URLs, private paths, and
  private content.

## Route Work

- New issue: use `/github-flows:new-issue`.
- Existing issue edit: use `/github-flows:edit-issue`.
- Start issue work: use `/github-flows:new-branch`.
- Milestone changelog: use `/github-flows:write-changelog`.
- Pull request: read `.github/pull_request_template.md`, use the repo's PR
  title format, and include acceptance-criteria verification when the issue
  defines acceptance criteria.

## Shared GitHub Rules

- Branches for issue work use `<issue-number>-<kebab-title>` from the default
  branch.
- Commits and squash PR titles use `type: #123 short description` with no
  scope.
- GitHub issue titles are plain-language summaries, not conventional commits.
- Relationships are same-repo `#N` references unless repository guidance says
  otherwise.
- Public issue, PR, and changelog text must pass the public-repo leak guard.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Copying detailed steps from another skill into this one | Keep this skill as a router and use the specialized skill for the procedure. |
| Inventing labels or templates | Read the repository label inventory and templates. |
| Treating PR creation as just a `gh pr create` command | Satisfy the repository PR template, title format, and acceptance-criteria rules first. |
| Including private repository context in public text | Rewrite as a public-safe summary or file in a private repository first. |
```

- [ ] **Step 2: Verify the skill is concise and discoverable**

Run:

```bash
sed -n '1,220p' skills/using-github/SKILL.md
```

Expected: frontmatter description describes when to use the skill and the body
routes to current specialized workflows without copying their full procedures.

## Task 3: Center User and Agent Guidance

**Files:**

- Modify: `README.md`
- Modify: `AGENTS.md`
- Modify: `.github/copilot-instructions.md`
- Modify: `.cursor/rules/github-flows.mdc`
- Modify: `.windsurfrules`
- Modify: `docs/file-structure.md`

- [ ] **Step 1: Update README**

Update "What you get" so `/github-flows:using-github` appears first as the
entry-point skill. Keep the four specialized skills listed as routed workflows.
Update quick-start examples to invoke `/github-flows:using-github` for general
GitHub work.

- [ ] **Step 2: Update repository guidance**

Add concise guidance to `AGENTS.md`:

```markdown
## GitHub workflow skill

When GitHub work is requested, start from `/github-flows:using-github`.
It is the central behavior guide for this repository's GitHub conventions and
routes task-specific work to `new-issue`, `edit-issue`, `new-branch`, and
`write-changelog`.
```

- [ ] **Step 3: Update editor guidance surfaces**

Add matching short guidance to `.github/copilot-instructions.md`,
`.cursor/rules/github-flows.mdc`, and `.windsurfrules` so each tells the agent
to start GitHub work from `/github-flows:using-github`.

- [ ] **Step 4: Update file-structure docs**

In `docs/file-structure.md`, mention that `skills/using-github/` is the
umbrella GitHub behavior skill and the other skill directories are specialized
workflows.

## Task 4: GREEN Pressure Scenario and Verification

**Files:**

- Modify: `docs/superpowers/pressure-tests/2026-04-27-15-using-github-pressure-test.md`

- [ ] **Step 1: Run the matching GREEN pressure scenario**

Dispatch or simulate a fresh-agent prompt that explicitly has `/using-github`
available:

```text
Use /github-flows:using-github for mixed GitHub work in this repository. A user
asks you to file a GitHub issue, start an issue branch, update PR guidance, and
avoid leaking private repo details. Which repository guidance and skills do you
use first?
```

Expected GREEN evidence: the agent starts from `/using-github`, reads repo
guidance, and routes to `new-issue`, `new-branch`, PR template rules, and the
public-repo leak guard instead of inventing a parallel process.

- [ ] **Step 2: Record the GREEN result**

Replace the pending GREEN section with:

```markdown
## GREEN: With /using-github

Prompt:

> Use /github-flows:using-github for mixed GitHub work in this repository. A
> user asks you to file a GitHub issue, start an issue branch, update PR
> guidance, and avoid leaking private repo details. Which repository guidance
> and skills do you use first?

Observed pass:

- `/using-github` is the first skill for mixed GitHub behavior.
- New issues route to `/github-flows:new-issue`.
- Issue branches route to `/github-flows:new-branch`.
- PR work routes through `.github/pull_request_template.md`, commit and PR
  title rules, and acceptance-criteria verification.
- Public text is checked against public-repo leak-guard expectations.
- The umbrella skill does not duplicate the detailed specialized workflows.
```

- [ ] **Step 3: Run repository verification**

```bash
pnpm lint:md
rg -n "using-github|new-issue|new-branch|edit-issue|write-changelog" README.md AGENTS.md .github/copilot-instructions.md .cursor/rules/github-flows.mdc .windsurfrules docs/file-structure.md skills/using-github/SKILL.md docs/superpowers/pressure-tests/2026-04-27-15-using-github-pressure-test.md
sed -n '1,220p' skills/using-github/SKILL.md
```

Expected: Markdown lint passes, references show `/using-github` centered while
specialized workflows remain linked, and the skill has no placeholders.

- [ ] **Step 4: Commit implementation**

```bash
git add README.md AGENTS.md .github/copilot-instructions.md .cursor/rules/github-flows.mdc .windsurfrules docs/file-structure.md skills/using-github/SKILL.md docs/superpowers/pressure-tests/2026-04-27-15-using-github-pressure-test.md
git commit -m "feat: #15 add using-github guide"
```

## Self-Review

- Spec coverage: Task 2 implements `AC-15-1`; Task 2 and Task 4 implement
  `AC-15-2`; Task 3 implements `AC-15-3`; Task 1 and Task 4 implement the
  `writing-skills` pressure-test requirement.
- Placeholder scan: no placeholder steps are intentionally left for Executor.
- Type consistency: this is Markdown-only work; paths and skill names use
  `using-github`, `new-issue`, `edit-issue`, `new-branch`, and
  `write-changelog` consistently.
