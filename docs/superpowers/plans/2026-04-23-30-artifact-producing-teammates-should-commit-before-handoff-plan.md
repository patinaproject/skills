# Plan: Artifact-producing teammates should commit before handoff [#30](https://github.com/patinaproject/superteam/issues/30)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. When editing `skills/**/*.md`, invoke `superpowers:writing-skills` before editing. During local review of skill or workflow-contract changes, invoke `superpowers:writing-skills` and run the relevant pressure-test walkthrough before publish.

**Goal:** Require `Brainstormer`, `Planner`, and `Executor` to commit their owned artifact changes before handoff, make uncommitted artifact-dependent handoffs incomplete unless the run halts explicitly with a blocker, and leave `Reviewer` and `Finisher` free from meaningless commit requirements when they did not materially change durable artifacts.

**Architecture:** Tighten the canonical `superteam` skill first so the workflow-level rule and teammate-specific done contracts define branch-state authority for artifact-producing handoffs. Then mirror the same rule in the delegated teammate prompt template so spawned runs follow the same completion boundary. Finally, expand the repo-local pressure tests so local review can catch uncommitted handoff loopholes and confirm the non-artifact-producing exception.

**Tech Stack:** Markdown workflow docs, repo-local pressure tests, `rg`, `sed`, `git diff`

---

## File Structure

- `docs/superpowers/specs/2026-04-23-30-artifact-producing-teammates-should-commit-before-handoff-design.md`
  - Approved design doc and acceptance source for issue `#30`.
- `docs/superpowers/plans/2026-04-23-30-artifact-producing-teammates-should-commit-before-handoff-plan.md`
  - This implementation plan.
- `skills/superteam/SKILL.md`
  - Canonical workflow contract; source of truth for the workflow-level incomplete-handoff rule and the `Brainstormer`/`Planner`/`Executor` commit-before-handoff contracts.
- `skills/superteam/agent-spawn-template.md`
  - Delegated teammate prompt surface that must mirror the same artifact-producing handoff rule and done-report fields.
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
  - Repo-local pressure tests that must exercise uncommitted artifact-producing handoffs and the non-artifact-producing exception.

## Planned Workstreams

- Workstream 1: tighten the canonical `superteam` workflow contract and role-specific done reports
- Workstream 2: mirror the same handoff-commit rule in the delegated teammate prompt template
- Workstream 3: add pressure-test coverage for uncommitted handoffs and the non-artifact exception, then verify the changed surfaces stay aligned

### Task 1: Tighten the canonical workflow contract and done reports

**Files:**
- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Inspect the current workflow-level and role-specific handoff language**

Run: `rg -n "handoff|done-report|Done-report|Brainstormer|Planner|Executor|Reviewer|Finisher|commit|SHA|branch state|workspace state" skills/superteam/SKILL.md`
Expected: locate the existing workflow-level handoff rules and the current `Brainstormer`, `Planner`, and `Executor` done-report contracts that need the commit-before-handoff requirement.

- [ ] **Step 2: Invoke the required skill-doc editing discipline**

Before editing `skills/superteam/SKILL.md`, invoke `superpowers:writing-skills`.
Expected: the skill-editing pass treats this as a workflow-contract change rather than ordinary prose cleanup.

- [ ] **Step 3: Add the workflow-level incomplete-handoff rule**

Update `skills/superteam/SKILL.md` so it explicitly states behavior equivalent to:

```md
Handoffs that depend on uncommitted durable artifact changes are incomplete unless the run halts explicitly with a blocker.
The workflow should trust committed branch state rather than dirty workspace state for artifact-producing handoffs.
```

Place this where the canonical workflow rules can govern all downstream teammate handoffs without turning it into a generic repo-wide git policy.

- [ ] **Step 4: Add explicit role-specific commit-before-handoff requirements**

Update the `Brainstormer`, `Planner`, and `Executor` teammate sections so each one explicitly requires committing owned artifact changes before reporting done or handing off. Keep the rule tied to durable artifact production for those roles, for example:

```md
`Brainstormer` must commit the design-doc change before handoff.
`Planner` must commit the implementation-plan change before handoff.
`Executor` must commit the completed implementation/test batch before handoff.
```

Do not add parallel commit requirements to `Reviewer` or `Finisher` merely because they are stages in the workflow.

- [ ] **Step 5: Extend the role-specific done-report contracts with handoff commit fields**

Update the done-report guidance so the artifact-producing roles report a specific handoff commit field alongside their existing required fields, equivalent to:

```md
Brainstormer:
- `handoff_commit_sha`: commit containing the approved design artifact

Planner:
- `handoff_commit_sha`: commit containing the approved implementation plan

Executor:
- `head_sha`: current HEAD SHA for the committed task batch
```

Use field names that stay consistent with the surrounding contract and avoid inventing two different names for the same concept unless the existing schema clearly requires it.

- [ ] **Step 6: Re-read the updated canonical contract in context**

Run: `sed -n '80,260p' skills/superteam/SKILL.md`
Expected: the canonical skill now makes uncommitted artifact-dependent handoffs incomplete, requires commits before `Brainstormer`/`Planner`/`Executor` handoff, and leaves `Reviewer`/`Finisher` outside any meaningless-commit rule.

### Task 2: Mirror the same handoff-commit rule in the delegated teammate prompt

**Files:**
- Modify: `skills/superteam/agent-spawn-template.md`

- [ ] **Step 1: Inspect the artifact-producing teammate prompt blocks**

Run: `rg -n "Brainstormer|Planner|Executor|Done-report contract|commit|handoff|head_sha" skills/superteam/agent-spawn-template.md`
Expected: locate the delegated prompt lines that currently define `Brainstormer`, `Planner`, and `Executor` completion and done-report behavior.

- [ ] **Step 2: Invoke the required skill-doc editing discipline**

Before editing `skills/superteam/agent-spawn-template.md`, invoke `superpowers:writing-skills`.
Expected: the prompt-template update follows the same skill-authoring discipline as the source contract.

- [ ] **Step 3: Add the delegated artifact-producing handoff rule**

Update the relevant teammate prompt blocks so they each explicitly require committing owned artifact changes before reporting done or handing off, in language equivalent to:

```text
Commit your owned artifact changes before handoff.
Do not report done while the required design, plan, or implementation artifact exists only as uncommitted workspace state.
```

Keep the wording role-specific and do not broaden it into a universal commit mandate for all teammates.

- [ ] **Step 4: Add the corresponding handoff commit fields to delegated done reports**

Update the delegated done-report contracts for `Brainstormer`, `Planner`, and `Executor` so they include the same handoff commit reporting required by the canonical skill. Preserve the surrounding contract shape and make sure the delegated fields are named consistently with the source contract wherever possible.

- [ ] **Step 5: Re-read the delegated prompt surface**

Run: `sed -n '1,240p' skills/superteam/agent-spawn-template.md`
Expected: the delegated prompts now mirror the source contract on artifact-producing commit-before-handoff behavior and handoff commit reporting without forcing commits from `Reviewer` or `Finisher`.

### Task 3: Expand the repo-local pressure tests for handoff commits

**Files:**
- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Inspect the current handoff and done-report scenarios**

Run: `rg -n "handoff|done-report|commit|Brainstormer|Planner|Executor|Reviewer|Finisher|workspace|branch state" docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: identify the current scenarios that already cover handoff discipline so the new additions stay narrow and non-duplicative.

- [ ] **Step 2: Add the uncommitted artifact-producing handoff scenarios**

Add scenarios that check behavior equivalent to:

```md
## Brainstormer hands off an uncommitted design artifact
## Planner hands off an uncommitted plan artifact
## Executor hands off uncommitted implementation artifacts
```

Each scenario should state that the handoff is incomplete and must loop back or halt explicitly with a blocker instead of allowing downstream work to proceed on dirty workspace state.

- [ ] **Step 3: Add the non-artifact-producing exception scenario**

Add a scenario that checks behavior equivalent to:

```md
## Non-artifact-producing stages are not forced into meaningless commits

- Starting condition: `Reviewer` or `Finisher` completes stage responsibilities without materially changing durable artifacts.
- Required halt or reroute behavior: do not require a commit solely to satisfy the handoff-commit rule.
- Rule surface: the artifact-producing handoff rule should apply to artifact-producing roles and artifact-producing changes, not become a ritual for every stage.
```

- [ ] **Step 4: Re-read the pressure-test doc in context**

Run: `sed -n '1,260p' docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: the pressure-test doc now covers uncommitted design, plan, and implementation handoffs, plus the non-artifact-producing exception.

### Task 4: Verify cross-surface alignment and local review expectations

**Files:**
- Modify: `skills/superteam/SKILL.md`
- Modify: `skills/superteam/agent-spawn-template.md`
- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Check that the three changed surfaces describe the same rule**

Run: `rg -n "uncommitted|commit before handoff|handoff_commit_sha|head_sha|workspace state|branch state|meaningless commit" skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: the canonical skill, delegated prompt, and pressure-test doc all reflect the same narrow issue-`#30` contract.

- [ ] **Step 2: Review the diff for narrow scope**

Run: `git diff -- skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: the diff stays confined to handoff commit requirements, handoff commit reporting, incomplete uncommitted handoffs, and the non-artifact-producing exception.

- [ ] **Step 3: Run the local review-stage pressure-test walkthrough before publish**

During `Reviewer`, invoke `superpowers:writing-skills` and walk through the updated pressure-test scenarios for:

```text
1. Brainstormer hands off an uncommitted design artifact
2. Planner hands off an uncommitted plan artifact
3. Executor hands off uncommitted implementation artifacts
4. Reviewer or Finisher completes work without durable artifact changes
```

Expected: `Reviewer` reports pass/fail outcomes and loopholes for these scenarios before the run moves toward publish.

- [ ] **Step 4: Commit the workflow-contract update**

Run: `git add skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md && git commit -m "docs: #30 require handoff commits for artifacts"`
Expected: a single docs-focused commit records the aligned workflow-contract changes for issue `#30`.
