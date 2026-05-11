# Plan: Finisher should keep monitoring PR checks until stable or blocked [#26](https://github.com/patinaproject/superteam/issues/26)

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Use checkbox (`- [ ]`) tracking while executing. When editing `skills/**/*.md`, invoke `superpowers:writing-skills` before editing. During local review of skill or workflow-contract changes, invoke `superpowers:writing-skills` and run the relevant pressure-test walkthrough before publish.

**Goal:** Keep `Finisher` in publish-state follow-through while required checks on the latest pushed PR head are still pending, reroute automatically when later failures appear, and allow a ready handoff only after the latest head is actually stable or an explicit blocker is reported.

**Architecture:** Tighten the canonical `Finisher` and `Reviewer` workflow contracts in the source skill, mirror the same behavior in the delegated teammate prompt, expand the repo-local pressure tests to cover the pending-check monitoring loop and required reruns, and add a narrow repository gate in `AGENTS.md` that requires evidence-backed readiness language for skill and workflow-contract changes. Keep the change scoped to the four approved surfaces from the design and preserve the existing spec-first reroute rules.

**Tech Stack:** Markdown workflow docs, repo-local pressure tests, `rg`, `sed`, `git diff`

---

## File Structure

- `docs/superpowers/specs/2026-04-23-26-finisher-should-keep-monitoring-pr-checks-until-stable-or-blocked-design.md`
  - Approved design artifact and acceptance source for issue `#26`.
- `docs/superpowers/plans/2026-04-23-26-finisher-should-keep-monitoring-pr-checks-until-stable-or-blocked-plan.md`
  - This implementation plan.
- `skills/superteam/SKILL.md`
  - Canonical workflow contract; source of truth for `Finisher` monitoring behavior, later-failure triage re-entry, `Reviewer` pressure-test reruns, and publish-state readiness boundaries.
- `skills/superteam/agent-spawn-template.md`
  - Delegated teammate prompt surface that must mirror the canonical `Reviewer` and `Finisher` rules closely enough to prevent drift in spawned runs.
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
  - Repo-local pressure tests that must exercise pending checks, later failures, later passes, explicit pending-external blockers, and reruns after later workflow-contract changes.
- `AGENTS.md`
  - Canonical repository guidance; add the narrow evidence-based production-readiness gate for `skills/**/*.md` and workflow-contract changes.

## Planned Workstreams

- Workstream 1: tighten the canonical source contract in `skills/superteam/SKILL.md`
- Workstream 2: mirror the same monitoring and rerun rules in `skills/superteam/agent-spawn-template.md`
- Workstream 3: expand `docs/superpowers/pressure-tests/superteam-orchestration-contract.md` with the new monitoring-loop scenarios and rerun expectations
- Workstream 4: add the narrow evidence-based readiness gate in `AGENTS.md`, then verify the four surfaces stay aligned and scoped to issue `#26`

### Task 1: Tighten the canonical `Reviewer` and `Finisher` contracts

**Files:**

- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Inspect the current `Reviewer` and `Finisher` contract language**

Run: `rg -n "### Reviewer|### Finisher|pressure-test|pending|required checks|blocked|ready|triage|monitor" skills/superteam/SKILL.md`
Expected: locate the current ownership and shutdown wording that governs pending checks, review-loop pressure tests, and publish-state follow-through.

- [ ] **Step 2: Invoke the required skill-doc editing discipline**

Before editing `skills/superteam/SKILL.md`, invoke `superpowers:writing-skills`.
Expected: the skill-editing pass explicitly treats this file as a workflow-contract change rather than ordinary prose cleanup.

- [ ] **Step 3: Add the explicit `Finisher` state model and latest-head monitoring loop**

Update the `Finisher` contract so it clearly describes this behavior:

```md
Treat publish-state on the latest pushed head as an explicit `Finisher` state machine:

1. `triage`
2. `monitoring`
3. `ready`
4. `blocked`

When required checks on the latest pushed head are still pending after immediate branch-side fixes are complete, stay in `monitoring` rather than presenting the run as complete.
If later required checks fail while monitoring, re-enter `triage` automatically on the latest head.
If later required checks pass, allow `ready` only after the rest of the latest-head publish-state sweep is also clear.
If the workflow cannot safely continue waiting on pending external systems, report an explicit blocker instead of a completion-style summary.
Any new push invalidates earlier assumptions and restarts evaluation on the new latest head.
```

Keep the wording portable across runtimes: do not invent a scheduler, a fixed polling interval, or runtime-specific waiting mechanics.

- [ ] **Step 4: Tighten the `Reviewer` contract for workflow-contract pressure-test reruns**

Update the `Reviewer` section so it explicitly requires:

```md
When the changed scope includes `skills/**/*.md` or workflow-contract docs, run the relevant pressure-test walkthrough before publish.
If later fixes change those same workflow-contract surfaces again after an earlier review pass, rerun the relevant pressure tests before handing the run back to `Finisher`.
Report the pass/fail results and any loopholes found.
```

Keep the rerun rule tied to later workflow-contract changes, not just to the first review pass.

- [ ] **Step 5: Re-read the updated canonical contract in context**

Run: `sed -n '150,280p' skills/superteam/SKILL.md`
Expected: the source skill now treats pending required checks as active `Finisher` work, later failures as automatic triage re-entry, pending external systems as explicit blockers when monitoring cannot continue safely, and later workflow-contract changes as requiring pressure-test reruns before publish.

### Task 2: Mirror the same monitoring and rerun rules in the delegated prompt surface

**Files:**

- Modify: `skills/superteam/agent-spawn-template.md`

- [ ] **Step 1: Inspect the `Reviewer` and `Finisher` prompt blocks**

Run: `rg -n "### Reviewer|### Finisher|pressure-test|pending|required checks|blocked|ready|triage|monitor" skills/superteam/agent-spawn-template.md`
Expected: locate the delegated prompt lines that currently govern review-stage pressure tests and publish-state follow-through.

- [ ] **Step 2: Invoke the required skill-doc editing discipline**

Before editing `skills/superteam/agent-spawn-template.md`, invoke `superpowers:writing-skills`.
Expected: the prompt-template update follows the same skill-authoring discipline as the source contract.

- [ ] **Step 3: Mirror the new `Finisher` monitoring behavior in plain delegation language**

Update the `Finisher` block so it mirrors the source contract closely, including language equivalent to:

```text
Treat pending required checks on the latest pushed head as active `Finisher` monitoring work, not as completion.
If later required checks fail while monitoring, re-enter triage automatically on the latest head.
If later required checks pass, only hand off as ready after the rest of the latest-head publish-state sweep is clear.
If pending external systems still block readiness and the run cannot safely keep monitoring, report an explicit blocker instead of a completion-style summary.
Any new push makes earlier status assumptions stale and requires re-evaluation on the new latest head.
```

Preserve `Finisher` ownership of external feedback and publish-state follow-through.

- [ ] **Step 4: Mirror the `Reviewer` rerun requirement**

Update the `Reviewer` block so it explicitly requires rerunning the relevant pressure-test walkthrough after later changes to `skills/**/*.md` or workflow-contract docs before the next handoff back to `Finisher`.

- [ ] **Step 5: Re-read the delegated prompt surface**

Run: `sed -n '70,240p' skills/superteam/agent-spawn-template.md`
Expected: the delegated `Reviewer` and `Finisher` prompts match the canonical source contract on monitoring, triage re-entry, ready-vs-blocked boundaries, and rerun timing.

### Task 3: Expand the repo-local pressure tests for the monitoring loop

**Files:**

- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Inspect current publish-state and review-loop scenarios**

Run: `rg -n "Finisher|Reviewer|pending|required checks|blocked|ready|triage|monitor|pressure-test" docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: identify the current scenarios that already cover publish-state follow-through so the new additions stay narrow and non-duplicative.

- [ ] **Step 2: Add the pending-check monitoring scenario**

Add a scenario that checks this behavior:

```md
## Finisher keeps monitoring while required checks on the latest pushed head are pending

- Starting condition: the latest pushed head has no immediate branch-side fix left, but required checks are still pending.
- Required halt or reroute behavior: remain in `Finisher`-owned monitoring instead of presenting the run as complete.
- Rule surface: the canonical skill and delegated prompt should both treat pending required checks as active publish-state follow-through.
```

- [ ] **Step 3: Add the later-failure, later-pass, and pending-external-blocker scenarios**

Add or refine scenarios that explicitly cover:

```md
## Finisher re-enters triage when later required checks fail on the latest pushed head
## Finisher allows ready handoff only after later passing checks leave the whole latest-head sweep clear
## Pending external systems stop the run as an explicit blocker, not a completion summary
```

Keep each scenario behavioral. Judge what the documented workflow would do, not whether the wording merely sounds strict.

- [ ] **Step 4: Add the rerun expectation for later workflow-contract edits**

Add a pressure-test scenario that fails if a run changes `skills/**/*.md` or workflow-contract docs after an earlier review pass but does not rerun the relevant pressure-test walkthrough before the next publish handoff.

- [ ] **Step 5: Re-read the pressure-test doc in context**

Run: `sed -n '1,260p' docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: the doc now covers pending checks, later failures, later passes, pending external blockers, and the required rerun after later workflow-contract changes before publish.

### Task 4: Add the evidence-based repository readiness gate

**Files:**

- Modify: `AGENTS.md`

- [ ] **Step 1: Inspect the existing contributor guidance around testing and publish readiness**

Run: `rg -n "Testing Guidelines|Commit & Pull Request Guidelines|confidence|readiness|skills/\\*\\*/\\.md|workflow-contract" AGENTS.md`
Expected: find the right narrow insertion point for the repository-level gate without broadening the issue scope.

- [ ] **Step 2: Add the narrow evidence-based guidance**

Update `AGENTS.md` so it adds repository guidance equivalent to:

```md
For changes to `skills/**/*.md` and workflow-contract guidance, do not claim production readiness from confidence language alone.
Readiness claims for those changes must be backed by the required pressure tests, review loops, and role-specific verification that actually ran.
If that evidence is incomplete, report the missing evidence or blocker explicitly instead of asserting readiness.
```

Keep this scoped to the approved surfaces and avoid turning `AGENTS.md` into a generic release policy rewrite.

- [ ] **Step 3: Re-read the updated guidance in context**

Run: `sed -n '1,240p' AGENTS.md`
Expected: the repository gate is evidence-based, auditable, and does not rely on a literal `100% confidence` promise.

### Task 5: Verify cross-surface alignment, scope, and rerun discipline

**Files:**

- Modify: `skills/superteam/SKILL.md`
- Modify: `skills/superteam/agent-spawn-template.md`
- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
- Modify: `AGENTS.md`

- [ ] **Step 1: Check that all four surfaces cover the same issue-`#26` contract**

Run: `rg -n "monitoring|latest pushed head|required checks|triage|ready|blocked|pending external|pressure-test walkthrough|rerun" skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md AGENTS.md`
Expected: the canonical skill, delegated prompt, pressure-test doc, and repo guidance all reflect the same narrow monitoring-loop behavior and evidence-based readiness gate.

- [ ] **Step 2: Review the diff for narrow scope**

Run: `git diff -- AGENTS.md skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
Expected: the diff stays confined to issue `#26` behavior: pending required-check monitoring, later failure reroute, later-pass ready gating, explicit pending-external blockers, pressure-test reruns, and evidence-based readiness language.

- [ ] **Step 3: Run the local review-stage pressure-test walkthrough before publish**

During `Reviewer`, invoke `superpowers:writing-skills` and walk through the updated pressure-test scenarios for:

```text
1. pending required checks after the latest push
2. later required-check failure while monitoring
3. later required-check pass with the rest of the latest-head sweep clear
4. pending external systems that force an explicit blocker
5. later workflow-contract changes that require rerunning the pressure-test walkthrough before the next handoff
```

Expected: `Reviewer` reports pass/fail outcomes and loopholes for these scenarios before the run moves toward publish.

- [ ] **Step 4: Enforce the rerun rule before the next `Finisher` handoff**

If any later loopback changes `skills/**/*.md` or workflow-contract docs after the first review pass, rerun the relevant pressure-test walkthrough before the next handoff back to `Finisher`.
Expected: pressure testing happens in the owning stages and reruns after later workflow-contract changes instead of being treated as a one-time end-of-run checklist.

- [ ] **Step 5: Commit the workflow-contract update**

Run: `git add AGENTS.md skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md && git commit -m "docs: #26 keep finisher monitoring pending PR checks"`
Expected: a single docs-focused commit records the four aligned workflow-contract changes for issue `#26`.
