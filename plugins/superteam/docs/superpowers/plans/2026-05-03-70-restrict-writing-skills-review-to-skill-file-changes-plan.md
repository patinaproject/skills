# Plan: Restrict writing-skills review to skill file changes [#70](https://github.com/patinaproject/superteam/issues/70)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Narrow Superteam's `superpowers:writing-skills` review trigger so it is mandatory for installable skill changes and not triggered solely by non-skill workflow or playbook changes.

**Architecture:** This is a Markdown workflow-contract change. Keep Brainstormer Gate 1 design-review language intact where it intentionally requires writing-skills dimensions for workflow-contract designs, but narrow Reviewer and spawn-template review-trigger language to installable skill-package changes. Add a small rationalization/red-flag closure so future reviewers cannot re-expand "workflow-contract" into a writing-skills trigger for non-skill docs.

**Tech Stack:** Markdown skill files; `rg`; `pnpm lint:md`; Superteam fallback skill-improver review evidence through `superpowers:writing-skills`.

---

## File Structure

- Modify `skills/superteam/SKILL.md`: Reviewer default-model rationale, Reviewer role trigger, rationalization table, and red flags.
- Modify `skills/superteam/agent-spawn-template.md`: Reviewer prompt trigger and pressure-test result wording.
- Preserve `skills/superteam/SKILL.md` Brainstormer/Gate 1 design-time writing-skills dimensions unless implementation review finds direct Reviewer-trigger wording there.
- Preserve `docs/skill-improver-quality-gate.md`: it already governs `skills/superteam/**` changes and is not the bug.

## Inventory Baseline

Run:

```bash
rg -n "workflow-contract.*writing-skills|writing-skills.*workflow-contract|skills/\\*\\*/\\*\\.md\\` or workflow-contract|skills/\\*\\*/\\*\\.md\\` or workflow" skills/superteam
```

Expected baseline includes:

- Preserve as Gate 1 design-review language:
  - `skills/superteam/SKILL.md`: Gate 1 adversarial review dimensions
  - `skills/superteam/SKILL.md`: Brainstormer design-time rule
  - `skills/superteam/agent-spawn-template.md`: Gate 1 adversarial review dimensions
  - `skills/superteam/agent-spawn-template.md`: Brainstormer design-time rule
- Update as Reviewer/review-trigger language:
  - `skills/superteam/SKILL.md`: Reviewer model rationale
  - `skills/superteam/SKILL.md`: Reviewer role bullet
  - `skills/superteam/SKILL.md`: rationalization/red-flag lines that say skill or workflow-contract changes are reviewed with writing-skills
  - `skills/superteam/agent-spawn-template.md`: Reviewer recommendation and pressure-test result wording

## Task 1: Narrow SKILL.md Reviewer Trigger

**Files:**

- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Confirm RED baseline**

Run the inventory command above. Confirm the current Reviewer language says
`skills/**/*.md` or workflow-contract docs trigger `superpowers:writing-skills`.

- [ ] **Step 2: Edit Reviewer model rationale**

Change the Reviewer default rationale from "skills/**/*.md and workflow-contract changes" to installable skill-package changes:

```markdown
| `Reviewer` | `opus` | Owns adversarial pressure-tests for installable skill-package changes (per `### Reviewer`, which requires invoking `superpowers:writing-skills` and running the relevant pressure-test walkthrough before publish when `skills/**` or packaged skill behavior changes). That is deep adversarial reasoning, not bounded pattern matching — the same justification that puts `Brainstormer` on Opus. Operators can downshift via `model: sonnet for reviewer` for trivial repo-rule reviews. |
```

- [ ] **Step 3: Edit Reviewer role bullet**

Replace the broad trigger:

```markdown
- When reviewing changes to `skills/**/*.md` or workflow-contract docs, invoke `superpowers:writing-skills` and run the relevant pressure-test walkthrough before publish.
```

with:

```markdown
- When reviewing changes to installable skill-package files (`skills/**`, including adjacent prompt or workflow-contract files packaged with a skill), invoke `superpowers:writing-skills` and run the relevant pressure-test walkthrough before publish. Do not invoke writing-skills solely because non-skill docs, operational playbooks, PR templates, or process documents outside `skills/**` describe a workflow.
```

- [ ] **Step 4: Keep skill-improver gate bullet intact**

Do not remove or weaken:

```markdown
- When the change touches `skills/superteam/**` or any Superteam workflow-contract surface, run the skill-improver quality gate documented in `docs/skill-improver-quality-gate.md` (primary mode when the `skill-improver` and `plugin-dev` plugins are available, fallback mode otherwise) and capture the required completion evidence in the PR body.
```

- [ ] **Step 5: Add rationalization closure**

Add this row to the rationalization table near the existing writing-skills rows:

```markdown
| "It is a workflow contract, so Reviewer should invoke writing-skills." | `superpowers:writing-skills` is mandatory for installable skill-package changes, not for every non-skill workflow, playbook, PR template, or process document. Reviewer still performs local pre-publish review and any explicit repo-specific gate for non-skill workflow docs, but the workflow label alone is not a writing-skills trigger. |
```

- [ ] **Step 6: Replace broad red flag**

Replace:

```markdown
- Skill or workflow-contract changes reviewed without `superpowers:writing-skills` or a pressure-test walkthrough.
```

with:

```markdown
- Installable skill-package changes under `skills/**` reviewed without `superpowers:writing-skills` or a pressure-test walkthrough.
- Reviewer invokes `superpowers:writing-skills` for changes that touch only non-skill workflow docs, operational playbooks, PR templates, or process documents outside `skills/**`.
```

## Task 2: Narrow Agent Spawn Template Reviewer Prompt

**Files:**

- Modify: `skills/superteam/agent-spawn-template.md`

- [ ] **Step 1: Edit Reviewer recommendation**

Replace:

```markdown
Recommend `superpowers:writing-skills` when reviewing changes to `skills/**/*.md` or workflow-contract docs.
```

with:

```markdown
Recommend `superpowers:writing-skills` when reviewing changes to installable skill-package files (`skills/**`, including adjacent prompt or workflow-contract files packaged with a skill). Do not recommend writing-skills solely for non-skill workflow docs, operational playbooks, PR templates, or process documents outside `skills/**`.
```

- [ ] **Step 2: Edit pressure-test result wording**

Replace:

```markdown
When the changed scope includes `skills/**/*.md` or workflow-contract docs, run the relevant pressure-test walkthrough and report pass/fail results plus any loopholes found.
```

with:

```markdown
When the changed scope includes installable skill-package files (`skills/**`, including adjacent prompt or workflow-contract files packaged with a skill), run the relevant pressure-test walkthrough and report pass/fail results plus any loopholes found.
```

Replace:

```markdown
- `pressure_test_results[]`: for skill or workflow-contract changes, the scenarios checked and their pass/fail outcomes, or an explicit empty result when not applicable
```

with:

```markdown
- `pressure_test_results[]`: for installable skill-package changes, the scenarios checked and their pass/fail outcomes, or an explicit empty result when not applicable
```

## Task 3: Verify Inventory And Pressure Scenarios

**Files:**

- Review: `skills/superteam/SKILL.md`
- Review: `skills/superteam/agent-spawn-template.md`

- [ ] **Step 1: Re-run inventory**

Run:

```bash
rg -n "workflow-contract.*writing-skills|writing-skills.*workflow-contract|skills/\\*\\*/\\*\\.md\\` or workflow-contract|skills/\\*\\*/\\*\\.md\\` or workflow" skills/superteam
```

Expected result:

- Remaining matches are Brainstormer/Gate 1 design-time writing-skills dimensions or historical rationalization examples that are not Reviewer triggers.
- Reviewer/spawn-template review-trigger matches use "installable skill-package" language instead of "`skills/**/*.md` or workflow-contract docs".

- [ ] **Step 2: Run AC pressure checks by inspection**

Confirm:

- `AC-70-1`: There is no Reviewer trigger saying non-skill workflow docs invoke writing-skills.
- `AC-70-2`: Skill-package changes still mandate writing-skills.
- `AC-70-3`: Workflow-contract wording near Reviewer review trigger is scoped to packaged skill files or removed.
- `AC-70-4`: Inventory result has explicit preserved-vs-updated disposition.

- [ ] **Step 3: Run markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: `Summary: 0 error(s)`.

- [ ] **Step 4: Commit implementation**

Use `fix:` because this corrects shipped Superteam runtime behavior:

```bash
git add skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md
git commit -m "fix: #70 restrict writing-skills review trigger"
```

## Task 4: Reviewer And Publish Evidence

**Files:**

- Review: changed files
- PR body later: `.github/pull_request_template.md`

- [ ] **Step 1: Run fallback skill-improver gate if primary tooling is unavailable**

Probe:

```bash
ls "$HOME/.claude/plugins/cache/trailofbits/skill-improver"/*/skills/skill-improver/SKILL.md 2>/dev/null
ls "$HOME/.claude/plugins/cache"/**/skills/plugin-dev/skill-reviewer 2>/dev/null
```

If either command has no result, record fallback mode:

```text
Mode: fallback
Reviewer: local Superteam Reviewer in this run
Dimensions: RED/GREEN baseline obligation, rationalization resistance, red flags, token-efficiency target, role ownership, stage-gate bypass paths
Pressure tests: PT-70-1, PT-70-2, PT-70-3
```

- [ ] **Step 2: Local review expectations**

Reviewer must verify:

- Operational-playbook-only scenario no longer triggers writing-skills.
- Superteam skill-package change still triggers writing-skills and skill-improver gate.
- Mixed skill and non-skill workflow change can identify `skills/**` as the trigger.

- [ ] **Step 3: Finisher PR evidence**

The PR body must include:

- `Closes #70`
- Acceptance Criteria entries for `AC-70-1` through `AC-70-4`
- Validation command `pnpm lint:md`
- Skill-improver quality gate evidence, primary or fallback

## Self-Review

- Spec coverage: Tasks map to AC-70-1 through AC-70-4 and preserve the skill-improver gate.
- Placeholder scan: No TODO/TBD placeholders remain.
- Type/path consistency: All paths match the repository's `skills/superteam/**` and `docs/superpowers/**` layout.
