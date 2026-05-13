# Superteam Latest-Head PR Completion Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> Superteam execution-mode rule: default execute-phase implementation must use the resolved Team Lead execution mode. Prefer team mode when available, then `superpowers:subagent-driven-development`. Use `superpowers:executing-plans` only when the operator explicitly asks for inline execution.

**Goal:** Make Superteam finish only after latest-head PR comments are addressed or evidence-classified non-blocking and latest-head checks/statuses are passing, skipped, neutral, or evidence-classified non-blocking.

**Architecture:** This is a workflow-contract change, not runtime code. Put cross-role invariants and completion vocabulary in `skills/superteam/SKILL.md`, host-specific Finisher guardrails in both Codex and Claude Code Finisher agent files, pre-flight signal vocabulary in `skills/superteam/pre-flight.md`, and route selection in `skills/superteam/routing-table.md`. Do not create hidden state, commit trailers, sidecar files, branch labels, or implementation-only shortcuts.

**Tech Stack:** Markdown skill contracts, Codex-host YAML agent prompt, Claude Code agent Markdown frontmatter, existing `pnpm` verification scripts, targeted text inspection with `rg`, and `python3` only for small local validation snippets if needed.

---

## Source Of Truth

- Approved design: `docs/superpowers/specs/2026-05-13-64-superteam-should-finish-only-after-pr-comments-are-addressed-and-checks-pass-design.md`
- Approved design commit: `75e457a80547b75be10f5c1c9039b845df9cc333`
- Issue: `#64`
- Acceptance criteria: `AC-64-1` through `AC-64-6`

## File Structure

- Modify: `skills/superteam/SKILL.md`
  - Owns cross-role invariants, latest-head completion gate definition, external feedback ownership, Finisher completion handoff fields, rationalization table entries, and red flags.
- Modify: `skills/superteam/agents/finisher.openai.yaml`
  - Owns Codex-host Finisher non-negotiable rules for the latest-head gate.
- Modify: `skills/superteam/.claude/agents/finisher.md`
  - Owns Claude Code Finisher non-negotiable rules matching the Codex-host rules.
- Modify: `skills/superteam/pre-flight.md`
  - Owns finish substate signal collection vocabulary and pre-flight output fields for latest-head PR feedback/check inventories.
- Modify: `skills/superteam/routing-table.md`
  - Owns finish-phase routing through the latest-head sweep.
- Modify only if needed: `skills/superteam/project-deltas.md`
  - Touch only if inspection shows append-only project deltas can weaken the new completion gate despite existing denylist/non-negotiable protections.

No other files are in scope unless verification exposes a repo-owned doc or manifest that must stay synchronized with these workflow-contract surfaces.

## Workstreams

1. Cross-role finish contract in `SKILL.md`.
2. Host parity for Finisher guardrails in Codex and Claude Code agent files.
3. Pre-flight and routing vocabulary for latest-head feedback/check state.
4. AC-driven verification and repo checks.

---

### Task 1: Baseline Contract Inventory

**Files:**

- Read: `skills/superteam/SKILL.md`
- Read: `skills/superteam/agents/finisher.openai.yaml`
- Read: `skills/superteam/.claude/agents/finisher.md`
- Read: `skills/superteam/pre-flight.md`
- Read: `skills/superteam/routing-table.md`
- Read if needed: `skills/superteam/project-deltas.md`

- [ ] **Step 1: Confirm the approved design is the current planning input**

Run:

```bash
git show --stat 75e457a80547b75be10f5c1c9039b845df9cc333 -- docs/superpowers/specs/2026-05-13-64-superteam-should-finish-only-after-pr-comments-are-addressed-and-checks-pass-design.md
```

Expected: output shows the approved design file at commit `75e457a80547b75be10f5c1c9039b845df9cc333`.

- [ ] **Step 2: Inspect the current finish contract surfaces**

Run:

```bash
rg -n "Finisher|finish|shutdown|latest|feedback|check|status|wakeup|rationalization|red flag|External feedback ownership" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md skills/superteam/pre-flight.md skills/superteam/routing-table.md
```

Expected: output shows the existing shutdown/head-relative wording and current finish routes. Use this to place edits in the existing sections rather than creating duplicate sections.

- [ ] **Step 3: Decide whether `project-deltas.md` needs an update**

Run:

```bash
rg -n "change gate logic|routing|halt conditions|done-report|forbidden|denylist|non-negotiable" skills/superteam/project-deltas.md
```

Expected: if existing denylist/non-negotiable text already forbids changing gate logic, routing, halt conditions, and done-report contracts, do not modify `project-deltas.md`. If it lacks protection against weakening Finisher completion gates, add the smallest literal denylist entry that prevents project deltas from bypassing the latest-head PR completion gate.

- [ ] **Step 4: Commit nothing in this task**

This task is inventory only. Leave the working tree unchanged.

---

### Task 2: Add Cross-Role Latest-Head Gate To `SKILL.md`

**Files:**

- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Add a `Latest-head PR completion gate` section near `External feedback ownership`**

Add a cross-role invariant section after `## External feedback ownership` or immediately before it if that reads better in the current file. Use this contract language:

```markdown
## Latest-head PR completion gate

`Finisher` must run the latest-head PR completion gate after PR creation, after every push, on finish-phase resume, after CI status changes, and immediately before any completion-style handoff. The gate is bound to the latest pushed head SHA. If the head changes during remediation or monitoring, all PR feedback and check/status signals must be refreshed against the new head before completion.

The gate has two required inventories:

1. `latest_head_feedback_inventory`: unresolved review threads, review comments, pull request conversation comments, requested-changes review states, and bot comments or annotations that represent actionable review feedback.
2. `latest_head_check_status_inventory`: every reported check run, status context, required-check signal, mergeability signal, and optional check/status visible for the latest pushed head.

Feedback inventory items are classified as `addressed`, `routed`, `open_actionable`, or `non_blocking`. Completion requires zero `open_actionable` items and zero `routed` items awaiting teammate return.

A PR feedback item is handled only when the workflow has addressed it in code, tests, docs, or workflow contracts and verified the latest head includes the fix; replied to or resolved the thread with a concrete explanation accepted by the classification; routed requirement-bearing feedback through `Brainstormer`, then `Planner`, then `Executor`, and returned to `Finisher` for a fresh latest-head sweep; or classified it as `non_blocking` with evidence that it is stale, duplicate, informational, optional, or not applicable to the latest head. Silence, elapsed time, local intent, PR creation, and green CI are never proof that feedback was handled.

Check/status inventory items must be passing, skipped, neutral, or `non_blocking` with surfaced evidence before completion. Pending, queued, missing, failing, cancelled, timed-out, stale, unknown, or unenumerable required-check state blocks completion. Optional non-passing checks/statuses also block completion unless `Finisher` records and surfaces evidence that they are non-blocking for the latest head.

Completion language is allowed only after the latest-head PR completion gate passes. Otherwise `Finisher` must report `monitoring` or `blocked` with concise counts for unresolved actionable feedback, routed feedback awaiting teammate return, non-passing or unknown check/status signals, and the latest pushed head SHA.
```

Expected: `SKILL.md` contains a named gate with the trigger list, both inventories, classifications, check/status blocking rules, and completion-language rule.

- [ ] **Step 2: Update `## External feedback ownership`**

Keep the existing ownership text and add this paragraph:

```markdown
`Finisher` owns PR feedback intake, check monitoring, PR replies, thread resolution where the host supports it, and the final latest-head PR completion gate. Requirement-bearing PR feedback still routes to `Brainstormer`, then `Planner`, then `Executor`; `Finisher` resumes only after that path returns and a fresh latest-head feedback and checks/status sweep passes.
```

Expected: `Finisher` owns intake and final gate, but cannot directly absorb requirement-bearing feedback.

- [ ] **Step 3: Add or extend a Finisher done/shutdown handoff contract**

Under `## Done-report contracts`, add a `### Finisher completion/status report` subsection if one does not already exist. Use this field contract:

```markdown
### Finisher completion/status report

- `publish_state`: `triage` | `monitoring` | `blocked` | `ready` | `merged`
- `branch`: branch under finish follow-through
- `pr`: PR URL or number
- `latest_pushed_sha`: latest pushed head SHA used for the gate
- `unresolved_actionable_feedback_count`: count of `open_actionable` latest-head feedback items
- `routed_feedback_count`: count of routed feedback items awaiting teammate return
- `required_check_state`: `passing` | `pending` | `failing` | `missing` | `unknown` | `not_applicable`
- `check_status_inventory_state`: `passing` | `non_blocking_with_evidence` | `pending` | `failing` | `missing` | `unknown` | `stale`
- `pending_signals[]`: concise names of checks, statuses, feedback items, or discovery gaps preventing completion
- `completion_gate`: `passed` | `blocked` | `monitoring`
- `completion_evidence[]`: concise evidence for handled feedback and non-blocking classifications when `completion_gate=passed`
```

Expected: the durable Finisher report fields cover AC-64-5 and AC-64-6 without restating every PR comment in chat.

- [ ] **Step 4: Add rationalization table entries**

Append these rows to the existing rationalization table:

```markdown
| "The PR exists, so Superteam can report complete." | PR creation is not completion. `Finisher` must run the latest-head PR completion gate before completion language. |
| "CI is green, so the review comments must be handled." | Green CI alone is not evidence that PR feedback was addressed. Latest-head feedback inventory must have zero `open_actionable` items and zero routed items awaiting teammate return. |
| "One status snapshot was green before the last push." | Completion evidence is head-relative. Every new push invalidates older feedback/check snapshots and requires a fresh latest-head sweep. |
| "The optional check is failing, but required checks passed." | Optional non-passing reported checks/statuses still block completion unless `Finisher` records and surfaces evidence that they are non-blocking for the latest head. |
| "The check API was ambiguous, so assume it is fine." | Unknown, unenumerable, stale, missing, or ambiguous required-check state is not success. Report `monitoring` or `blocked` instead of complete. |
```

Expected: the likely shortcuts from the design are explicitly rejected.

- [ ] **Step 5: Add red flags**

Append these bullets to `## Red flags`:

```markdown
- `Finisher` reports complete while any latest-head feedback inventory item is `open_actionable` or `routed` awaiting teammate return.
- `Finisher` reports complete while any latest-head required check/status is pending, queued, missing, failing, cancelled, timed out, stale, unknown, or unenumerable.
- `Finisher` reports complete while an optional non-passing check/status lacks surfaced non-blocking evidence.
- `Finisher` classifies PR feedback as handled based on silence, elapsed time, local intent, PR creation, or green CI.
- A new push lands after feedback/check inventory and `Finisher` does not refresh the latest-head gate before completion.
- Codex and Claude Code Finisher role surfaces diverge on the latest-head PR completion gate.
```

Expected: the red flags map directly to AC-64-1 through AC-64-6 and the design's RED/GREEN pressure scenario.

- [ ] **Step 6: Run focused inspection**

Run:

```bash
rg -n "Latest-head PR completion gate|latest_head_feedback_inventory|latest_head_check_status_inventory|Finisher completion/status report|unresolved_actionable_feedback_count|check_status_inventory_state|green CI alone|optional non-passing|Codex and Claude Code" skills/superteam/SKILL.md
```

Expected: every phrase appears in `SKILL.md`.

- [ ] **Step 7: Commit after Task 2 if working in small commits**

Run:

```bash
git add skills/superteam/SKILL.md
git commit -m "docs: #64 add latest-head completion gate contract"
```

Expected: commit succeeds. If the implementer is batching plan tasks into one commit, skip this step and commit after Task 5.

---

### Task 3: Update Both Finisher Host Agent Surfaces

**Files:**

- Modify: `skills/superteam/agents/finisher.openai.yaml`
- Modify: `skills/superteam/.claude/agents/finisher.md`

- [ ] **Step 1: Replace the existing Finisher shutdown rules with explicit latest-head gate rules**

In both host files, keep the frontmatter/YAML shape unchanged and update the numbered non-negotiable rules so the Finisher-specific rules contain this same meaning in both files:

```markdown
7. Shutdown is success-only and head-relative; run the latest-head PR completion gate after PR creation, after every push, on finish-phase resume, after CI status changes, and immediately before any completion-style handoff.
8. Never treat PR creation, one status snapshot, green CI alone, elapsed time, silence, or local intent as workflow completion or proof that PR feedback was handled.
9. Build a latest-head PR feedback inventory covering unresolved review threads, review comments, PR conversation comments, requested-changes reviews, and actionable bot comments or annotations. Classify each item as `addressed`, `routed`, `open_actionable`, or `non_blocking`.
10. Completion requires zero `open_actionable` feedback items and zero `routed` feedback items awaiting teammate return. Requirement-bearing feedback routes through Brainstormer, then Planner, then Executor before Finisher resumes a fresh latest-head sweep.
11. Build a latest-head checks/statuses inventory covering every reported check run, status context, required-check signal, mergeability signal, and optional visible check/status. Pending, queued, missing, failing, cancelled, timed-out, stale, unknown, or unenumerable required-check state blocks completion.
12. Optional non-passing checks/statuses block completion unless Finisher records and surfaces evidence that they are non-blocking for the latest head.
13. Durable wakeup payloads MUST include: branch, PR URL/number, latest pushed SHA, current publish-state, unresolved actionable feedback count, routed-feedback count, required-check state, check/status inventory state, pending signals, and instruction to resume the latest-head PR completion gate.
14. Report final completion only when the gate passes; include the latest pushed SHA and concise final counts for feedback and check/status inventories.
```

For `finisher.openai.yaml`, keep ASCII `RED->GREEN->REFACTOR` if that file already uses ASCII. For the Claude file, preserve the file's existing Markdown/frontmatter style.

Expected: both host-specific Finisher surfaces bind the same gate, inventory, blocking, routing, wakeup, and completion rules.

- [ ] **Step 2: Verify host parity with text inspection**

Run:

```bash
rg -n "latest-head PR completion gate|latest-head PR feedback inventory|latest-head checks/statuses inventory|unresolved actionable feedback count|routed-feedback count|required-check state|check/status inventory state" skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: each concept appears in both files.

- [ ] **Step 3: Verify both files still reference the SKILL.md done-report contract**

Run:

```bash
rg -n "Done-report contract reference|SKILL.md|done-report" skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: both files continue to point back to `skills/superteam/SKILL.md` instead of redefining every done-report field.

- [ ] **Step 4: Commit after Task 3 if working in small commits**

Run:

```bash
git add skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
git commit -m "docs: #64 align finisher host completion gates"
```

Expected: commit succeeds. If batching, skip this step and commit after Task 5.

---

### Task 4: Update Pre-Flight Finish Substate Signals

**Files:**

- Modify: `skills/superteam/pre-flight.md`

- [ ] **Step 1: Update detection sequence step 6**

Replace the current short PR-state inspection sentence with:

```markdown
6. **Inspect PR state.** Determine whether a PR exists for this branch on origin and, if so, whether it is open or merged. For finish-phase runs, collect latest-head `Finisher` substate signals: latest pushed head SHA, review-thread/comment/review-state inventory status, actionable bot feedback status, required-check state, check/status inventory state, mergeability signal, pending signals, and whether any routed feedback is awaiting teammate return.
```

Expected: pre-flight names latest-head feedback and check/status signals, not just generic CI/review state.

- [ ] **Step 2: Sharpen finish substate values**

In the `finisher_substate_signals` field value contracts, replace the one-line enum explanation with:

```markdown
- `finisher_substate_signals`: `triage` | `monitoring` | `ready` | `blocked` | `merged`
  - `triage`: PR exists and latest-head feedback/check state has not yet been fully classified.
  - `monitoring`: no teammate action is currently needed, but checks/statuses or external signals are still pending for the latest head.
  - `blocked`: actionable feedback, routed feedback awaiting teammate return, required-check failures, unexplained non-passing optional checks/statuses, ambiguous check/status discovery, or missing latest-head evidence prevents completion.
  - `ready`: the latest-head PR completion gate has passed for the latest pushed head.
  - `merged`: the PR has merged after the latest-head gate passed or after an equivalent platform merge gate proved the same conditions.
```

Expected: `ready` cannot be read as "PR opened" or "local work done".

- [ ] **Step 3: Extend the pre-flight output record**

Add these fields to the text record under `## Output of pre-flight`:

```text
  latest_pushed_sha?,
  latest_head_feedback_inventory_state?,
  unresolved_actionable_feedback_count?,
  routed_feedback_count?,
  required_check_state?,
  check_status_inventory_state?,
  pending_signals?,
```

Add matching field value contracts:

```markdown
- `latest_pushed_sha`: latest pushed PR head SHA observed during pre-flight when `pr_state` is `open` or `merged`
- `latest_head_feedback_inventory_state`: `unclassified` | `clear` | `open_actionable` | `routed` | `non_blocking_with_evidence` | `unknown`
- `unresolved_actionable_feedback_count`: integer count of latest-head feedback items classified `open_actionable`
- `routed_feedback_count`: integer count of routed feedback items awaiting teammate return
- `required_check_state`: `passing` | `pending` | `failing` | `missing` | `unknown` | `not_applicable`
- `check_status_inventory_state`: `passing` | `non_blocking_with_evidence` | `pending` | `failing` | `missing` | `unknown` | `stale`
- `pending_signals`: concise names of checks, statuses, feedback items, or discovery gaps that still prevent completion
```

Expected: Team Lead has durable vocabulary to route finish-phase runs without guessing.

- [ ] **Step 4: Run focused inspection**

Run:

```bash
rg -n "latest pushed head SHA|latest_head_feedback_inventory_state|unresolved_actionable_feedback_count|routed_feedback_count|required_check_state|check_status_inventory_state|pending_signals|ready.*latest-head PR completion gate" skills/superteam/pre-flight.md
```

Expected: each field or definition appears in `pre-flight.md`.

- [ ] **Step 5: Commit after Task 4 if working in small commits**

Run:

```bash
git add skills/superteam/pre-flight.md
git commit -m "docs: #64 capture latest-head finish signals"
```

Expected: commit succeeds. If batching, skip this step and commit after Task 5.

---

### Task 5: Update Finish Routing

**Files:**

- Modify: `skills/superteam/routing-table.md`

- [ ] **Step 1: Update finish-phase routing rows**

Edit the existing finish rows so they read with this intent:

```markdown
| finish | Finisher state in {triage, monitoring, blocked} + status check | Finisher | resume latest-head PR completion gate; do not restart | classify latest-head feedback inventory and check/status inventory before any completion language |
| finish | Finisher state in {ready, merged} + resume / status / generic invocation | Finisher | rerun latest-head shutdown sweep | ready must still be revalidated against the latest pushed head before completion-style handoff |
| finish | PR open or merged + prompt does not change requirements | Finisher | resume publish-state follow-through | default finish route; run the latest-head PR completion gate before any completion-style handoff |
| finish | requirement-bearing PR feedback | Brainstormer | spec-first per existing external-feedback rules | then Planner, then Executor; Finisher resumes only after a fresh latest-head feedback and checks/status sweep |
| finish | requirement-bearing operator or human-test feedback | Brainstormer | route spec-level feedback | applies even when feedback is not phrased as PR feedback; then Planner, then Executor before Finisher latest-head gate can resume |
```

Expected: finish routing never maps generic finish/status prompts straight to completion.

- [ ] **Step 2: Update prompt-classification heuristics**

Replace or extend the finish heuristics with:

```markdown
- If `phase=finish` and prompt is a status / "is it done" / "check CI" prompt, route to `Finisher` to run or resume the latest-head PR completion gate.
- If `phase=finish` and prompt adds or changes requirements, acceptance criteria, or "what we are building", classify as spec-level feedback even when it is not PR feedback.
- If `phase=finish` and prompt refers to PR review comments, review threads, bot findings, checks, statuses, mergeability, or CI without changing requirements, route to `Finisher` for latest-head feedback/check intake and classification.
- If `phase=finish` and the PR is ready, merged, or the prompt is otherwise generic, route to `Finisher` for latest-head publish-state or shutdown handling; completion language still requires a passing latest-head PR completion gate.
```

Expected: routing covers PR comments, bot findings, checks/statuses, CI, and mergeability.

- [ ] **Step 3: Run focused inspection**

Run:

```bash
rg -n "latest-head PR completion gate|feedback inventory|check/status inventory|review threads|bot findings|mergeability|completion language" skills/superteam/routing-table.md
```

Expected: the routing table and heuristic both point finish-phase runs through the latest-head gate.

- [ ] **Step 4: Commit Tasks 2-5 if batching**

Run:

```bash
git add skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md skills/superteam/pre-flight.md skills/superteam/routing-table.md
git status --short
git commit -m "docs: #64 require latest-head PR completion gate"
```

Expected: commit succeeds and includes only the scoped Superteam workflow-contract surfaces. Do not include this plan artifact in the Executor implementation commit if it was already committed by Planner.

---

### Task 6: AC-Driven Verification

**Files:**

- Verify: `skills/superteam/SKILL.md`
- Verify: `skills/superteam/agents/finisher.openai.yaml`
- Verify: `skills/superteam/.claude/agents/finisher.md`
- Verify: `skills/superteam/pre-flight.md`
- Verify: `skills/superteam/routing-table.md`

- [ ] **Step 1: Verify AC-64-1 latest-head actionable feedback blocks completion**

Run:

```bash
rg -n "open_actionable|unresolved review threads|review comments|PR conversation comments|requested-changes|bot comments|zero `open_actionable`|Completion requires zero" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: cross-role contract and both host Finisher files require inventorying unresolved actionable PR feedback and block completion when any item remains open or routed.

- [ ] **Step 2: Verify AC-64-2 non-blocking feedback requires evidence and not silence or green CI**

Run:

```bash
rg -n "non_blocking.*evidence|stale, duplicate, informational, optional|Silence|green CI|local intent|elapsed time" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: classifications require evidence, and silence/elapsed time/local intent/green CI are rejected as proof.

- [ ] **Step 3: Verify AC-64-3 requirement-bearing PR feedback routes spec-first**

Run:

```bash
rg -n "Requirement-bearing|requirement-bearing|Brainstormer, then Planner, then Executor|fresh latest-head sweep|spec-first" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md skills/superteam/routing-table.md
```

Expected: requirement-changing PR feedback routes to Brainstormer, then Planner, then Executor, and Finisher resumes only after a fresh latest-head sweep.

- [ ] **Step 4: Verify AC-64-4 checks/status inventory blocks pending/failing/unknown signals**

Run:

```bash
rg -n "check/status|checks/statuses|Pending|pending|queued|missing|failing|cancelled|timed-out|stale|unknown|unenumerable|required-check|optional non-passing" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md skills/superteam/pre-flight.md
```

Expected: latest-head checks/statuses inventory covers required and optional visible signals, with non-passing or unknown required signals blocking completion and optional non-passing signals requiring evidence.

- [ ] **Step 5: Verify AC-64-5 all-clear completion includes latest SHA and concise counts**

Run:

```bash
rg -n "latest pushed SHA|latest_pushed_sha|latest pushed head SHA|concise final counts|unresolved_actionable_feedback_count|routed_feedback_count|completion_gate.*passed|ready.*latest-head" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md skills/superteam/pre-flight.md
```

Expected: completion is allowed only after the gate passes and the final handoff carries the latest head SHA plus concise feedback/check counts.

- [ ] **Step 6: Verify AC-64-6 wakeup/status payload fields**

Run:

```bash
rg -n "Durable wakeup payloads MUST include|branch, PR URL/number, latest pushed SHA|unresolved actionable feedback count|routed-feedback count|required-check state|check/status inventory state|pending signals|resume the latest-head PR completion gate" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: wakeup/status payload requirements include every field named by AC-64-6.

- [ ] **Step 7: Verify host parity**

Run:

```bash
python3 - <<'PY'
from pathlib import Path

files = [
    Path("skills/superteam/agents/finisher.openai.yaml"),
    Path("skills/superteam/.claude/agents/finisher.md"),
]
needles = [
    "latest-head PR completion gate",
    "latest-head PR feedback inventory",
    "latest-head checks/statuses inventory",
    "Completion requires zero",
    "Optional non-passing checks/statuses block completion",
    "Durable wakeup payloads MUST include",
    "latest pushed SHA",
    "routed-feedback count",
    "check/status inventory state",
]

missing = []
for path in files:
    text = path.read_text()
    for needle in needles:
        if needle not in text:
            missing.append(f"{path}: {needle}")

if missing:
    print("Missing host-parity terms:")
    for item in missing:
        print(item)
    raise SystemExit(1)

print("host parity terms present")
PY
```

Expected: `host parity terms present`.

- [ ] **Step 8: Verify RED/GREEN pressure scenario is represented**

Run:

```bash
rg -n "PR creation is not completion|green CI alone|one status snapshot|new push invalidates|unknown.*not success|optional non-passing|reports complete while" skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md
```

Expected: the old unsafe path is explicitly rejected, and the revised behavior is `blocked` or `monitoring` until the latest-head gate passes.

- [ ] **Step 9: Run repository verification**

Run:

```bash
pnpm lint:md
pnpm verify:dogfood
pnpm verify:marketplace
pnpm apply:scaffold-repository:check
```

Expected: all commands exit 0.

- [ ] **Step 10: Inspect changed files before handoff**

Run:

```bash
git diff --check
git diff -- skills/superteam/SKILL.md skills/superteam/agents/finisher.openai.yaml skills/superteam/.claude/agents/finisher.md skills/superteam/pre-flight.md skills/superteam/routing-table.md
git status --short
```

Expected: no whitespace errors; diff is scoped to Superteam workflow-contract surfaces; no unrelated files are staged or modified by the Executor.

---

## Acceptance Criteria Mapping

- `AC-64-1`: Task 2 latest-head feedback inventory and blocking rule; Task 3 host Finisher rules 9-10; Task 6 Step 1.
- `AC-64-2`: Task 2 handling standard and rationalization rows; Task 3 rule 8 and non-blocking evidence rules; Task 6 Step 2.
- `AC-64-3`: Task 2 external feedback ownership; Task 3 rule 10; Task 5 finish routing; Task 6 Step 3.
- `AC-64-4`: Task 2 checks/status gate; Task 3 rules 11-12; Task 4 pre-flight check/status fields; Task 6 Step 4.
- `AC-64-5`: Task 2 completion-language and Finisher report fields; Task 3 rule 14; Task 4 `ready` definition; Task 6 Step 5.
- `AC-64-6`: Task 2 Finisher report fields; Task 3 rule 13; Task 4 pre-flight output fields; Task 6 Step 6.

## Blockers

None known.

Potential execution-time blockers:

- GitHub check/status vocabulary may need a small wording adjustment if existing Superteam docs use a stricter term than `mergeability signal`.
- `project-deltas.md` may need a narrow denylist addition if inspection shows project deltas can weaken this new gate despite existing gate/routing/done-report protections.
- Markdown lint may require line wrapping after exact text is inserted.

## Handoff Notes

- Keep implementation scoped to workflow-contract surfaces. Do not implement runtime GitHub API code for this issue.
- Preserve host parity: Codex and Claude Code Finisher prompts must carry the same completion gate obligations.
- Prefer compact operator-facing language in contracts: counts, state names, latest SHA, and next action instead of PR transcript dumps.
- Completion is latest-head and success-only. Any uncertainty in feedback/check discovery reports `monitoring` or `blocked`, never complete.
