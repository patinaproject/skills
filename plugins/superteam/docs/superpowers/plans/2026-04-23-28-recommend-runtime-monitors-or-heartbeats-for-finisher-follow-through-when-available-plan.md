# Plan: Recommend runtime monitors or heartbeats for Finisher follow-through when available [#28](https://github.com/patinaproject/superteam/issues/28)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Use checkbox (`- [ ]`) tracking while executing. When editing `skills/**/*.md`, invoke `superpowers:writing-skills` before editing. During local review of skill or workflow-contract changes, invoke `superpowers:writing-skills` and run the relevant pressure-test walkthrough before publish.

**Goal:** Keep the `superteam` workflow portable while explicitly recommending background-agent delegation and durable runtime follow-up aids such as heartbeats or monitors when the host supports them, especially for `Finisher` publish-state follow-through.

**Architecture:** Update the canonical workflow contract in `skills/superteam/SKILL.md`, mirror the same runtime-aware preferences in `skills/superteam/agent-spawn-template.md`, and extend the orchestration pressure tests so the new behavior is exercised in both runtime-capable and runtime-incapable scenarios. Keep the contract behavioral and portable: runtime features remain execution aids for the existing teammate and `Finisher` loops rather than new requirements or a separate workflow.

**Tech Stack:** Markdown workflow docs, repo-local pressure tests, `rg`, `sed`, `git diff`

---

## File Structure

- `docs/superpowers/specs/2026-04-23-28-recommend-runtime-monitors-or-heartbeats-for-finisher-follow-through-when-available-design.md`
  - Approved design artifact and authority for issue `#28`.
- `docs/superpowers/plans/2026-04-23-28-recommend-runtime-monitors-or-heartbeats-for-finisher-follow-through-when-available-plan.md`
  - This implementation plan.
- `skills/superteam/SKILL.md`
  - Canonical workflow contract; source of truth for runtime-aware recommendations, `Brainstormer` approval-packet rules, and `Finisher` ownership boundaries.
- `skills/superteam/agent-spawn-template.md`
  - Delegated teammate prompt surface that must mirror the canonical runtime-aware recommendations closely enough to keep spawned work aligned.
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
  - Repo-local pressure-test scenarios that validate teammate delegation, approval-packet reporting, and `Finisher` follow-through behavior across runtime-capable and runtime-incapable environments.

## Planned Workstreams

- Workstream 1: tighten the canonical `superteam` skill contract for runtime-aware delegation, `Finisher` follow-through aids, and `Brainstormer` concern reporting
- Workstream 2: mirror the same recommendations and wording constraints in the delegated teammate prompt template
- Workstream 3: expand the pressure-test walkthrough so `Reviewer` can verify both supported and unsupported runtime paths without weakening the portable contract

### Task 1: Update the canonical workflow contract in `skills/superteam/SKILL.md`

**Files:**

- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Inspect the current runtime-aware and approval-packet sections**

Run: `rg -n "## Pre-flight|## Gate 1: Brainstormer approval|### Brainstormer|### Finisher|concerns|heartbeat|monitor|background" skills/superteam/SKILL.md`
Expected: locate the existing pre-flight guidance, approval-packet rules, `Brainstormer` contract, and `Finisher` contract language that issue `#28` will refine.

- [ ] **Step 2: Invoke the required skill-doc editing discipline**

Before editing `skills/superteam/SKILL.md`, invoke `superpowers:writing-skills`.
Expected: the change is handled as a workflow-contract update rather than a casual prose edit.

- [ ] **Step 3: Add the portable runtime-aware delegation and follow-through recommendations**

Update `SKILL.md` so the runtime-aware sections explicitly say:

```md
- Prefer the host runtime's normal multi-agent capabilities when available.
- When the host supports background-agent execution for delegated teammate work, prefer using that capability as an execution aid rather than a correctness dependency.
- When the runtime offers durable follow-up features such as thread heartbeats, monitors, or equivalent wakeups, prefer using them for `Finisher` publish-state follow-through while required checks or external review state remain pending.
- Treat these runtime capabilities as aids for the existing teammate and `Finisher` loops, not as separate workflows or replacement contracts.
- If the host lacks those capabilities, do not stop early; continue using the portable teammate and `Finisher` contracts or report an explicit blocker when follow-through cannot safely continue.
```

Keep the wording feature-agnostic and portable across runtimes.

- [ ] **Step 4: Tighten the approval-packet reporting contract**

Update the approval guidance and `Brainstormer` contract so they explicitly require:

```md
- `concerns[]` is always reported in the approval packet.
- When concerns exist, surface them as approval-relevant concerns.
- When no concerns exist, preserve the explicit empty `concerns[]` result under the contract and render the operator-facing packet exactly as `Remaining concerns: None`.
```

Keep this scoped to approval-packet reporting discipline rather than broader gate semantics.

- [ ] **Step 5: Re-read the updated canonical contract in context**

Run: `sed -n '1,260p' skills/superteam/SKILL.md`
Expected: the canonical skill now recommends background-agent delegation and durable `Finisher` follow-through aids when available, preserves portable behavior when they are not, and makes the no-concerns approval rendering explicitly `Remaining concerns: None`.

### Task 2: Mirror the same runtime-aware guidance in `skills/superteam/agent-spawn-template.md`

**Files:**

- Modify: `skills/superteam/agent-spawn-template.md`

- [ ] **Step 1: Inspect the current delegation template and role-specific blocks**

Run: `rg -n "Recommend|concerns\\[\\]|Brainstormer|Finisher|background|heartbeat|monitor|runtime" skills/superteam/agent-spawn-template.md`
Expected: locate the shared delegation preamble plus the `Brainstormer` and `Finisher` role-specific prompt blocks that need alignment with the canonical contract.

- [ ] **Step 2: Invoke the required skill-doc editing discipline**

Before editing `skills/superteam/agent-spawn-template.md`, invoke `superpowers:writing-skills`.
Expected: the prompt-template update follows the same skill-authoring discipline as the source contract.

- [ ] **Step 3: Mirror the background-agent recommendation in the shared delegation guidance**

Update the shared prompt template so it nudges runtime-capable hosts toward background-agent execution for delegated teammate work while still warning that missing support is not a blocker by itself. Use language equivalent to:

```text
When the host runtime supports background-agent execution for delegated teammate work, prefer using it.
If that capability is unavailable, continue with the normal portable teammate workflow instead of treating the missing feature as permission to stop.
```

- [ ] **Step 4: Mirror the `Brainstormer` and `Finisher` runtime-aware rules**

Update the role-specific blocks so they include:

```text
Brainstormer:
- `concerns[]` must always be reported.
- When none exist, preserve the explicit empty result and render the operator-facing no-concerns line as `Remaining concerns: None`.

Finisher:
- When the runtime offers durable follow-up features such as thread heartbeats, monitors, or equivalent wakeups, prefer using them while pending external publish-state remains.
- Treat those features as aids for the same latest-head follow-through loop, not as a separate workflow.
- If the runtime lacks those features, continue the portable `Finisher` ownership model or report an explicit blocker instead of stopping early.
```

Keep the delegated language close to `SKILL.md` so the prompt surface does not drift.

- [ ] **Step 5: Re-read the delegated prompt surface**

Run: `sed -n '1,260p' skills/superteam/agent-spawn-template.md`
Expected: the shared template plus the `Brainstormer` and `Finisher` blocks all reflect the same background-agent preference, portable fallback behavior, and `Remaining concerns: None` rendering rule.

### Task 3: Expand the orchestration pressure tests for runtime-aware follow-through and approval reporting

**Files:**

- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Inspect the current scenarios that already cover approval packets and `Finisher` follow-through**

Run: `rg -n "approval|concerns|Brainstormer|Finisher|monitor|heartbeat|background|runtime|stop early" docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: identify the existing scenarios so the new tests extend them cleanly instead of duplicating nearby checks.

- [ ] **Step 2: Add approval-packet reporting scenarios for `concerns[]` and `Remaining concerns: None`**

Add scenarios that fail when:

```md
## Approval packet omits `concerns[]` entirely
## Approval packet with no concerns does not render `Remaining concerns: None`
```

Each scenario should describe the required halt or reroute behavior and point back to the `Brainstormer` approval-packet rules.

- [ ] **Step 3: Add teammate delegation and `Finisher` follow-through runtime-capable scenarios**

Add scenarios that check:

```md
## Delegated teammate work ignores available background-agent execution
## Finisher ignores available durable runtime follow-up while external publish-state is pending
## Runtime follow-up resumes the existing Finisher loop instead of creating a new workflow
```

Keep them behavioral: judge whether the documented workflow recommends the right runtime-capable path while preserving the same ownership model.

- [ ] **Step 4: Add runtime-incapable fallback scenarios**

Add scenarios that check:

```md
## Missing background-agent support does not permit early stop
## Missing runtime follow-up support does not permit Finisher to stop early
```

Each scenario should require the workflow to continue under the portable contract or report an explicit blocker when safe follow-through cannot continue.

- [ ] **Step 5: Re-read the pressure-test doc in context**

Run: `sed -n '1,320p' docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: the pressure tests now cover approval-packet concern reporting, the exact `Remaining concerns: None` operator-facing rendering, runtime-capable delegation and follow-through, and runtime-incapable fallback behavior without weakening the canonical contract.

### Task 4: Verify cross-surface alignment and narrow scope

**Files:**

- Modify: `skills/superteam/SKILL.md`
- Modify: `skills/superteam/agent-spawn-template.md`
- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Check alignment across the three approved surfaces**

Run: `rg -n "background-agent|heartbeats|heartbeat|monitor|Remaining concerns: None|concerns\\[\\]|stop early|portable" skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: all three files use consistent terms for background-agent preference, runtime follow-up aids, portable fallback behavior, and the no-concerns rendering rule.

- [ ] **Step 2: Review the diff for design-scope discipline**

Run: `git diff -- skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: the diff stays within the approved scope from the design and does not spill into unrelated workflow-contract rewrites.

- [ ] **Step 3: Prepare the local review verification handoff**

During `Reviewer`, invoke `superpowers:writing-skills` and walk through the updated pressure-test scenarios for:

```text
1. available background-agent delegation
2. missing background-agent support
3. available durable runtime follow-up for `Finisher`
4. missing runtime follow-up support
5. approval packets with concerns present
6. approval packets with no concerns rendered as `Remaining concerns: None`
7. runtime wakeups resuming the same `Finisher` loop instead of a separate workflow
```

Expected: `Reviewer` reports pass/fail results and any loopholes before the run moves toward publish.

- [ ] **Step 4: Enforce pressure-test reruns after later workflow-contract fixes**

If later loopbacks change `skills/**/*.md` or `docs/superpowers/pressure-tests/superteam-orchestration-contract.md` after an earlier review pass, rerun the relevant pressure-test walkthrough before the next handoff to `Finisher`.
Expected: review evidence stays current with the latest workflow-contract state.

- [ ] **Step 5: Commit the workflow-contract update**

Run: `git add skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md && git commit -m "docs: #28 recommend runtime follow-through aids"`
Expected: a single docs-focused commit records the aligned workflow-contract changes for issue `#28`.
