# Superteam Review-Thread Resolution Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Superteam execution-mode rule: default execute-phase implementation must use the resolved Team Lead execution mode. Prefer team mode when available, then `superpowers:subagent-driven-development`. Use `superpowers:executing-plans` only when the operator explicitly asks for inline execution.

**Goal:** Make Superteam Finisher block finish-ready status until addressed GitHub review threads are resolved, evidence-classified non-blocking, routed, or explicitly reported as blocked.

**Architecture:** This is a workflow-contract change, not runtime code. Strengthen the existing latest-head PR completion gate from issue #64 by adding review-thread closure as first-class durable state in `SKILL.md`, both Finisher role surfaces, and pre-flight resume vocabulary. Keep routing and checks/status behavior intact.

**Tech Stack:** Markdown skill contracts, Codex-host YAML agent prompt, Claude Code agent Markdown frontmatter, `rg` verification, `bash scripts/verify-superteam-contract.sh`, and `pnpm lint:md`.

---

## Source Of Truth

- Approved design: `docs/superpowers/specs/2026-05-15-79-superteam-finisher-should-require-addressed-review-threads-to-be-resolved-design.md`
- Approved design commit: `94de08dde97e2c479f6535c0a56011b05ecb8ec9`
- Issue: `#79`
- Acceptance criteria: `AC-79-1` through `AC-79-5`

## File Structure

- Modify: `skills/superteam/SKILL.md`
  - Owns cross-role invariants, latest-head completion gate language, Finisher completion/status fields, rationalization table entries, and red flags.
- Modify: `skills/superteam/agents/finisher.openai.yaml`
  - Owns Codex-host Finisher non-negotiable rules for review-thread closure.
- Modify: `skills/superteam/.claude/agents/finisher.md`
  - Owns Claude Code Finisher non-negotiable rules matching the Codex-host surface.
- Modify: `skills/superteam/pre-flight.md`
  - Owns finish substate signal vocabulary for unresolved review-thread closure state.
- Modify: `skills/superteam/routing-table.md`
  - Touch only if current finish routing does not explicitly route review-thread closure checks through Finisher.

No hidden state, commit trailers, branch labels, sidecar files, or PR merge behavior are in scope.

## Workstreams

1. Cross-role thread-closure contract in `SKILL.md`.
2. Host parity for Finisher prompt guardrails.
3. Pre-flight and routing vocabulary for durable resume safety.
4. AC-driven verification and repo checks.

---

### Task 1: Baseline Inventory

**Files:**

- Read: `docs/superpowers/specs/2026-05-15-79-superteam-finisher-should-require-addressed-review-threads-to-be-resolved-design.md`
- Read: `skills/superteam/SKILL.md`
- Read: `skills/superteam/agents/finisher.openai.yaml`
- Read: `skills/superteam/.claude/agents/finisher.md`
- Read: `skills/superteam/pre-flight.md`
- Read: `skills/superteam/routing-table.md`

- [ ] **Step 1: Confirm the approved design commit**

Run:

```bash
git show --stat 94de08dde97e2c479f6535c0a56011b05ecb8ec9 -- docs/superpowers/specs/2026-05-15-79-superteam-finisher-should-require-addressed-review-threads-to-be-resolved-design.md
```

Expected: output shows the approved design file at commit `94de08dde97e2c479f6535c0a56011b05ecb8ec9`.

- [ ] **Step 2: Inspect current finish-thread vocabulary**

Run:

```bash
rg -n "review thread|thread resolution|thread closure|latest-head PR completion gate|pending_signals|completion_gate|unresolved_actionable_feedback_count|Finisher" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md skills/superteam/pre-flight.md skills/superteam/routing-table.md
```

Expected: output shows the existing issue-64 latest-head gate and Finisher role rules, but no first-class `review_thread_closure_state` or `unresolved_review_thread_count` contract yet.

- [ ] **Step 3: Commit nothing in this task**

This task is inventory only. Leave the working tree unchanged.

---

### Task 2: Add Cross-Role Thread Closure Contract

**Files:**

- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Extend the Finisher completion/status report**

In `### Finisher completion/status report`, add these fields after `routed_feedback_count`:

```markdown
- `review_thread_closure_state`: `clear` | `unresolved` | `blocked` | `unknown`
- `unresolved_review_thread_count`: count of unresolved review threads still blocking completion
```

Expected: durable Finisher reports expose review-thread closure state separately from generic feedback counts.

- [ ] **Step 2: Extend external feedback ownership**

In `## External feedback ownership`, keep the existing paragraphs and add:

```markdown
Addressed code is not the same as resolved GitHub thread state. Before resolving a review thread, `Finisher` must verify that the current branch head matches the PR latest head and that the latest head contains the fix or disposition for that thread. If a thread is requirement-bearing, `Finisher` routes it through `Brainstormer`, then `Planner`, then `Executor` before resuming a fresh latest-head sweep.
```

Expected: ownership stays with Finisher, while requirement-bearing review-thread feedback still routes spec-first.

- [ ] **Step 3: Extend the latest-head feedback inventory**

In `## Latest-head PR completion gate`, replace the existing feedback-inventory and handled-item paragraphs with wording that preserves the issue-64 gate and adds review-thread closure:

```markdown
The gate has three required inventories:

1. `latest_head_feedback_inventory`: unresolved review threads, review comments, pull request conversation comments, requested-changes review states, and bot comments or annotations that represent actionable review feedback.
2. `review_thread_closure_inventory`: review-thread resolution state for every unresolved or recently addressed GitHub review thread tied to the latest head.
3. `latest_head_check_status_inventory`: every reported check run, status context, required-check signal, mergeability signal, and optional check/status visible for the latest pushed head.

Feedback inventory items are classified as `addressed`, `routed`, `open_actionable`, or `non_blocking`. Completion requires zero `open_actionable` items, zero `routed` items awaiting teammate return, and zero unresolved review threads that lack an evidence-backed `non_blocking`, `routed`, or `blocked` disposition.

Addressed is remediation evidence, not platform closure. A review thread is finish-complete only when `Finisher` has verified the latest head addresses it and resolved it in GitHub; classified it `non_blocking` with evidence that it is stale, duplicate, informational, optional, or not applicable to the latest head; routed requirement-bearing feedback through `Brainstormer`, then `Planner`, then `Executor`, and returned for a fresh latest-head sweep; or reported a blocker because it cannot be verified or resolved.

When an active GitHub surface supports review-thread resolution, `Finisher` must resolve verified addressed threads before reporting finish-ready. `Finisher` must not declare thread resolution unavailable until it has checked repo-authorized GitHub surfaces available in the current runtime, including the connected GitHub app or plugin surface when available and `gh`/GraphQL when authenticated and permitted. A blocked report must name the surfaces checked, the missing or failed capability, and the unresolved thread identifiers.
```

Expected: `completion_gate=passed` is impossible while addressed-but-unresolved review threads remain.

- [ ] **Step 4: Extend completion language rule**

In the completion language paragraph, add unresolved review-thread counts to the blocked/monitoring summary:

```markdown
Completion language is allowed only after the latest-head PR completion gate passes. Otherwise `Finisher` must report `monitoring` or `blocked` with concise counts for unresolved actionable feedback, unresolved review threads, routed feedback awaiting teammate return, non-passing or unknown check/status signals, and the latest pushed head SHA.
```

Expected: operator-facing handoffs cannot hide unresolved review threads in prose.

- [ ] **Step 5: Add rationalization table entries**

Append these rows to the existing rationalization table:

```markdown
| "The code changed, so the review thread is handled." | Addressed code is remediation evidence, not GitHub thread closure. `Finisher` must resolve the addressed thread, classify it non-blocking with evidence, route it, or report a blocker. |
| "The connector cannot resolve review threads, so we can still report ready." | Missing thread-resolution capability is a blocker, not completion. `Finisher` must check repo-authorized GitHub surfaces and name the unresolved thread and missing or failed capability. |
| "Pre-flight already saw green checks and no open actionable feedback." | Finish-ready also requires durable review-thread closure state. Stale feedback/check evidence cannot hide addressed-but-unresolved review threads. |
```

Expected: the issue-79 shortcuts are explicitly rejected.

- [ ] **Step 6: Add red flags**

Append these bullets to `## Red flags`:

```markdown
- `Finisher` reports complete while any addressed latest-head review thread remains unresolved in GitHub.
- `Finisher` treats code remediation, green CI, elapsed time, silence, or local intent as proof that a GitHub review thread was resolved.
- `Finisher` reports thread-resolution capability unavailable without checking repo-authorized GitHub surfaces and naming the failed or missing capability.
- Fresh-session finish resume reports `ready` without durable review-thread closure state for the latest head.
```

Expected: red flags cover AC-79-1 through AC-79-5.

- [ ] **Step 7: Run focused inspection**

Run:

```bash
rg -n "review_thread_closure_state|unresolved_review_thread_count|review_thread_closure_inventory|Addressed is remediation evidence|repo-authorized GitHub surfaces|addressed latest-head review thread" skills/superteam/SKILL.md
```

Expected: every phrase appears in `SKILL.md`.

---

### Task 3: Update Both Finisher Host Surfaces

**Files:**

- Modify: `skills/superteam/agents/finisher.openai.yaml`
- Modify: `skills/superteam/.claude/agents/finisher.md`

- [ ] **Step 1: Add matching non-negotiable rules to both files**

In both Finisher role files, keep the existing structure and add these rules immediately after the rule that builds the latest-head PR feedback inventory:

```markdown
10. Addressed code is not the same as resolved GitHub thread state. Build a review-thread closure inventory for every unresolved or recently addressed GitHub review thread tied to the latest head.
11. Resolve verified addressed review threads through GitHub where the active runtime supports it. If resolution is unavailable or fails, report `blocked` or `monitoring` with the unresolved thread identity and the checked surfaces or failed capability; do not report completion.
12. Before resolving a thread, verify the current branch head matches the PR latest head and that the latest head contains the fix or disposition. Requirement-bearing thread feedback routes through Brainstormer, then Planner, then Executor before Finisher resumes a fresh latest-head sweep.
```

Renumber later rules so the list is sequential in each file.

Expected: both Codex and Claude Code Finisher prompts carry the same thread-closure obligations.

- [ ] **Step 2: Extend durable wakeup/final report rule**

In both files, update the durable wakeup payload rule to include review-thread closure state:

```markdown
Durable wakeup payloads MUST include: branch, PR URL/number, latest pushed SHA, current publish-state, unresolved actionable feedback count, routed-feedback count, review-thread closure state, unresolved review-thread count, required-check state, check/status inventory state, pending signals, and instruction to resume the latest-head PR completion gate.
```

Update the final completion rule to include review-thread closure counts:

```markdown
Report final completion only when the gate passes; include the latest pushed SHA and concise final counts for feedback, review-thread closure, and check/status inventories.
```

Expected: role handoffs match the `SKILL.md` Finisher report fields.

- [ ] **Step 3: Verify host parity**

Run:

```bash
rg -n "review-thread closure inventory|Addressed code is not the same|Resolve verified addressed review threads|review-thread closure state|unresolved review-thread count|feedback, review-thread closure, and check/status" skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: each concept appears in both files.

---

### Task 4: Add Durable Pre-Flight Resume Vocabulary

**Files:**

- Modify: `skills/superteam/pre-flight.md`

- [ ] **Step 1: Extend finish-phase PR state collection**

In detection sequence step 6, add review-thread closure state to the listed finish-phase signals:

```markdown
review-thread closure state, unresolved review-thread count
```

Expected: pre-flight collects thread closure state alongside feedback and check state.

- [ ] **Step 2: Extend pre-flight output record**

In the output record, add:

```text
  review_thread_closure_state?,
  unresolved_review_thread_count?,
```

Place these near `latest_head_feedback_inventory_state?`.

Expected: durable resume state includes first-class thread closure fields.

- [ ] **Step 3: Add field value contracts**

In field value contracts, add:

```markdown
- `review_thread_closure_state`: `clear` | `unresolved` | `blocked` | `unknown`
- `unresolved_review_thread_count`: integer count of review threads tied to the latest head that remain unresolved without a non-blocking, routed, or blocked disposition
```

Expected: a later `/superteam` resume cannot classify finish state as `ready` while thread closure is unresolved or unknown.

- [ ] **Step 4: Strengthen ready/blocked definitions**

Update the `blocked` and `ready` `finisher_substate_signals` definitions:

```markdown
- `blocked`: actionable feedback, unresolved review threads without an evidence-backed disposition, routed feedback awaiting teammate return, required-check failures, unexplained non-passing optional checks/statuses, ambiguous check/status discovery, ambiguous review-thread closure discovery, or missing latest-head evidence prevents completion.
- `ready`: the latest-head PR completion gate has passed for the latest pushed head, including review-thread closure state.
```

Expected: pre-flight cannot derive `ready` from old feedback/check state alone.

- [ ] **Step 5: Run focused inspection**

Run:

```bash
rg -n "review-thread closure state|unresolved review-thread count|review_thread_closure_state|unresolved_review_thread_count|ambiguous review-thread closure|including review-thread closure state" skills/superteam/pre-flight.md
```

Expected: every phrase appears in `pre-flight.md`.

---

### Task 5: Check Finish Routing Vocabulary

**Files:**

- Modify if needed: `skills/superteam/routing-table.md`

- [ ] **Step 1: Inspect finish routing**

Run:

```bash
rg -n "finish|Finisher|review threads|PR feedback|latest-head|status check|comments|checks" skills/superteam/routing-table.md
```

Expected: finish-phase PR review threads and comments already route to Finisher for latest-head feedback/check intake.

- [ ] **Step 2: Patch only if review-thread closure is missing**

If routing does not name review-thread closure, add a concise mention to finish-phase routes and prompt classification. Use this wording:

```markdown
review-thread closure
```

Expected: routing remains Finisher-owned and does not introduce a new route or gate.

- [ ] **Step 3: Run focused inspection**

Run:

```bash
rg -n "review-thread closure|review threads|latest-head feedback/check|Finisher" skills/superteam/routing-table.md
```

Expected: finish-phase review-thread prompts route to Finisher unless they change requirements.

---

### Task 6: AC-Driven Verification

**Files:**

- Read: `skills/superteam/SKILL.md`
- Read: `skills/superteam/agents/finisher.openai.yaml`
- Read: `skills/superteam/.claude/agents/finisher.md`
- Read: `skills/superteam/pre-flight.md`
- Read if modified: `skills/superteam/routing-table.md`

- [ ] **Step 1: Verify AC-79-1 addressed threads must resolve**

Run:

```bash
rg -n "Addressed is remediation evidence|Resolve verified addressed review threads|resolved it in GitHub|before reporting finish-ready|addressed latest-head review thread" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: cross-role and both Finisher surfaces require resolving verified addressed review threads where supported.

- [ ] **Step 2: Verify AC-79-2 missing resolution capability blocks**

Run:

```bash
rg -n "repo-authorized GitHub surfaces|missing or failed capability|resolution is unavailable or fails|blocked|monitoring|pending_signals" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: missing or failed resolution capability blocks completion and requires visible pending signals.

- [ ] **Step 3: Verify AC-79-3 non-blocking classifications need evidence**

Run:

```bash
rg -n "non_blocking.*evidence|stale, duplicate, informational, optional|green CI|elapsed time|local intent|silence" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: non-blocking review-thread dispositions require evidence and reject weak proof.

- [ ] **Step 4: Verify AC-79-4 requirement-bearing threads route spec-first**

Run:

```bash
rg -n "Requirement-bearing|requirement-bearing|Brainstormer, then Planner, then Executor|fresh latest-head sweep|thread feedback routes" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md skills/superteam/routing-table.md
```

Expected: requirement-changing review-thread feedback routes through Brainstormer, Planner, and Executor before Finisher resumes.

- [ ] **Step 5: Verify AC-79-5 final counts and durable state**

Run:

```bash
rg -n "review_thread_closure_state|unresolved_review_thread_count|feedback, review-thread closure, and check/status|latest pushed SHA|completion_gate.*passed|including review-thread closure state" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md skills/superteam/pre-flight.md
```

Expected: completion and resume state include latest head SHA and review-thread closure counts.

- [ ] **Step 6: Run repo verification**

Run:

```bash
bash scripts/verify-superteam-contract.sh
```

Expected: `OK: superteam contract assertions passed`.

Run:

```bash
pnpm lint:md
```

Expected: either passes, or fails only on pre-existing files outside the issue-79 touched files. If lint fails on touched files, fix before continuing.

---

## Self-Review Checklist

- [ ] `AC-79-1`: Task 2 and Task 3 require resolving verified addressed review threads where supported.
- [ ] `AC-79-2`: Task 2 and Task 3 make missing or failed resolution capability block completion with surfaced identity and capability evidence.
- [ ] `AC-79-3`: Task 2 preserves evidence-backed non-blocking classification and rejects green CI, elapsed time, silence, and local intent as proof.
- [ ] `AC-79-4`: Task 2 and Task 3 preserve spec-first routing for requirement-bearing thread feedback.
- [ ] `AC-79-5`: Task 2, Task 3, and Task 4 require final counts and durable review-thread closure state.
- [ ] Placeholder scan is clean.
- [ ] No hidden workflow state is introduced.
- [ ] Codex and Claude Code Finisher surfaces carry matching obligations.

## Execution Notes

- Use small, reviewable commits if useful, but every handoff must be committed before moving to the next Superteam role.
- Preserve existing issue #64 checks/status gate behavior; this plan only adds review-thread closure as a required part of the latest-head gate.
- If implementation discovers that `routing-table.md` already covers review-thread closure clearly, leave it unchanged and record that in completion evidence.
