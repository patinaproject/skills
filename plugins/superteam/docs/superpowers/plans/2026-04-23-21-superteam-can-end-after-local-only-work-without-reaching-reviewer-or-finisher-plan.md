# superteam can end after local-only work without reaching Reviewer or Finisher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `superteam` require the post-implementation transition into `Reviewer` and `Finisher`, or halt explicitly, so local-only work can never end in a completion-style closeout.

**Architecture:** Tighten the canonical workflow contract in `skills/superteam/SKILL.md`, mirror the same post-implementation rule in the delegated prompt surface in `skills/superteam/agent-spawn-template.md`, then add a repo-local behavioral pressure-test scenario that exercises the exact Codex early-stop failure mode from issue `#21`. Keep the change scoped to the execution-to-review-to-finish handoff instead of reworking or restating the broader shutdown model from `#18`.

**Tech Stack:** Markdown workflow docs, repo-local pressure tests, `rg`, `sed`, `git`

---

## File Structure

- `docs/superpowers/specs/2026-04-23-21-superteam-can-end-after-local-only-work-without-reaching-reviewer-or-finisher-design.md`
  - Approved design doc and acceptance source for issue `#21`.
- `docs/superpowers/plans/2026-04-23-21-superteam-can-end-after-local-only-work-without-reaching-reviewer-or-finisher-plan.md`
  - This implementation plan.
- `skills/superteam/SKILL.md`
  - Canonical `superteam` workflow contract; source of truth for the required `Executor -> Reviewer -> Finisher` transition.
- `skills/superteam/agent-spawn-template.md`
  - Delegated Codex-facing teammate prompt surface that must match the canonical contract.
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
  - Repo-local pressure tests that must cover the local-only early-stop failure mode.

### Task 1: Tighten the canonical post-implementation routing contract

**Files:**

- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Inspect the current execution, review, finish, and failure wording**

Run: `rg -n "### Executor|### Reviewer|### Finisher|Failure handling|local-only|complete|halted" skills/superteam/SKILL.md`
Expected: locate the current role contracts, red flags, and failure-handling language that govern post-implementation behavior.

- [ ] **Step 2: Write the failing contract expectation in the source skill**

Add or tighten source-contract language so it explicitly states:

```md
`Executor` completion is not workflow completion.

After `Executor` reports local implementation work complete, the run must do exactly one of the following:

1. continue into `Reviewer` for local pre-publish review and then into `Finisher` for publish-state follow-through, or
2. halt explicitly as `superteam halted at <teammate or gate>: <reason>`

Do not allow a normal completion-style closeout after local-only work when `Reviewer` or `Finisher` responsibilities are still unsatisfied.
```

Keep the existing ownership model intact: `Reviewer` still owns local pre-publish review intake, `Finisher` still owns publish-state follow-through, and local-only completion remains invalid.
Do not restate the full `#18` shutdown checklist here unless a short pointer is required for clarity.

- [ ] **Step 3: Re-read the updated contract in context**

Run: `sed -n '160,330p' skills/superteam/SKILL.md`
Expected: the role contracts, red flags, and failure handling consistently reflect the mandatory `Executor -> Reviewer -> Finisher` transition or explicit halt path.

### Task 2: Mirror the same rule in the delegated teammate prompt surface

**Files:**

- Modify: `skills/superteam/agent-spawn-template.md`

- [ ] **Step 1: Inspect the role-specific prompt blocks that govern the handoff**

Run: `sed -n '80,180p' skills/superteam/agent-spawn-template.md`
Expected: locate the `Executor`, `Reviewer`, and `Finisher` blocks plus any global hard rules that should mention the required transition.

- [ ] **Step 2: Write the failing prompt expectation**

Update the delegated prompt surface so it matches the source contract in plain language:

```text
`Executor` completion is not workflow completion.
After local implementation work, the run must continue into `Reviewer`, then `Finisher`, unless it halts explicitly as `superteam halted at <teammate or gate>: <reason>`.
Do not produce a completion-style closeout after local-only work while `Reviewer` or `Finisher` responsibilities remain unsatisfied.
```

Preserve the existing done-report contracts and role ownership while making the allowed post-implementation outcomes explicit.

- [ ] **Step 3: Re-read the delegated prompt surface**

Run: `sed -n '1,220p' skills/superteam/agent-spawn-template.md`
Expected: the template agrees with the canonical skill on the same two allowed post-implementation outcomes: continue into `Reviewer` and `Finisher`, or halt explicitly.

### Task 3: Add a pressure test for the exact Codex early-stop failure mode

**Files:**

- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Inspect existing pressure-test coverage around execution, review, and finish**

Run: `rg -n "Executor|Reviewer|Finisher|local-only|PR|shutdown|halt" docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: confirm there is no existing scenario that fully captures the `#21` failure mode after local implementation.

- [ ] **Step 2: Write the failing pressure-test scenario**

Add a scenario with this structure:

```md
## Run ends after local implementation without reaching Reviewer or Finisher

- Starting condition: `Executor` completes local edits and verification, but no proper `Reviewer` pass occurs, the branch is not pushed, no PR is created or updated, no `Finisher` shutdown checks run, and the run attempts to end with a normal completion-style summary.
- Required halt or reroute behavior: Do not allow a successful completion state. Either continue into `Reviewer` and then `Finisher`, or halt explicitly as `superteam halted at <teammate or gate>: <reason>`.
- Rule surface: The canonical skill and delegated prompt surface should both require the post-implementation transition into `Reviewer` and `Finisher`, or an explicit halt, before any success-style closeout.
```

Make this a behavioral scenario, not a wording-only check. The walkthrough should judge whether the documented workflow would reroute or halt the run in the described situation, even if the completion-style summary is polished or superficially convincing.

- [ ] **Step 3: Re-read the pressure-test doc in context**

Run: `sed -n '40,170p' docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: the new scenario is specific to the Codex early-stop failure mode, reads as a behavioral workflow check, and does not duplicate the broader shutdown tests unnecessarily.

### Task 4: Verify the edited docs match the approved design

**Files:**

- Modify: `skills/superteam/SKILL.md`
- Modify: `skills/superteam/agent-spawn-template.md`
- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Compare the edited surfaces against the design requirements**

Run: `rg -n "Executor completion is not workflow completion|continue into`Reviewer`|superteam halted at <teammate or gate>: <reason>|completion-style closeout|Run ends after local implementation without reaching Reviewer or Finisher" skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: all three surfaces explicitly cover the same post-implementation rule and the `#21` failure mode.

- [ ] **Step 2: Review the diff for scope control**

Run: `git diff -- skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: changes stay limited to the post-implementation transition contract and the new pressure test.

- [ ] **Step 3: Commit the implementation**

Run: `git add skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md && git commit -m "docs: #21 require review and finish after execution"`
Expected: a commit is created with only the intended workflow-contract and pressure-test changes.
