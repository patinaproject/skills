# Plan: Remove status report templates across Superteam output [#58](https://github.com/patinaproject/superteam/issues/58)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. The execution mode is pre-selected by `Team Lead`; do not ask the operator to choose inline execution.

**Goal:** Update Superteam so operator-facing chat uses natural, decision-focused prose while durable workflow evidence remains structured and inspectable.

**Architecture:** This is a workflow-contract documentation change. The core contract lives in `skills/superteam/SKILL.md`, delegated teammate prompt shaping lives in `skills/superteam/agent-spawn-template.md`, and behavioral pressure scenarios live in `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`.

**Tech Stack:** Markdown, `markdownlint-cli2`, repo-local `pnpm` scripts, Git hooks.

---

## Source Documents

- Design: `docs/superpowers/specs/2026-04-28-58-remove-status-report-templates-across-superteam-output-design.md`
- Core contract: `skills/superteam/SKILL.md`
- Delegation prompts: `skills/superteam/agent-spawn-template.md`
- Pressure tests: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
- Repo rules: `AGENTS.md`

## File Structure

- Modify `skills/superteam/SKILL.md`: add the invariant-over-template rendering rule, preserve durable evidence rules, soften Gate 1 and teammate reporting language, and add rationalization/red-flag coverage.
- Modify `skills/superteam/agent-spawn-template.md`: teach delegated teammates to separate internal done-report data from operator-facing prose while preserving role contracts.
- Modify `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`: add RED/GREEN-oriented pressure scenarios for robotic output, hidden blockers, resolved findings replay, evidence loss, and Finisher readiness masking.
- Do not modify `skills/superteam/pr-body-template.md` unless execution discovers chat-output-specific wording there that directly conflicts with the design.

## RED Baseline Evidence

- [ ] **Step 1: Capture fixed Gate 1 approval packet pressure**

Run:

```bash
sed -n '/^## Gate 1: Brainstormer approval/,/^## Routing table/p' skills/superteam/SKILL.md
```

Expected RED evidence: Gate 1 requires a fixed packet with exact artifact path,
intent summary, full requirement set, `adversarial_review_findings[]`,
`adversarial_review_status`, `reviewer_context`, and `clean_pass_rationale`,
but does not distinguish required gate evidence from natural operator-facing
rendering.

- [ ] **Step 2: Capture delegated report-shape pressure**

Run:

```bash
sed -n '/^### Team Lead/,/^### Planner/p' skills/superteam/agent-spawn-template.md
sed -n '/^### Executor/,/^### Finisher/p' skills/superteam/agent-spawn-template.md
```

Expected RED evidence: role blocks require field-heavy approval packets and
done-report contracts, but do not tell teammates that the exact chat response
can be natural prose as long as the durable handoff data exists.

- [ ] **Step 3: Capture missing behavioral pressure tests**

Run:

```bash
rg -n "robotic status|natural prose|resolved findings|durable evidence|operator-facing|status-report" docs/superpowers/pressure-tests/superteam-orchestration-contract.md
```

Expected RED evidence: no scenarios directly test robotic report output,
natural prose hiding a blocker, resolved findings replayed by default, or
durable evidence removed under the banner of natural output.

- [ ] **Step 4: Record behavioral RED scenarios in completion evidence**

Use these scenario summaries as the RED baseline:

- Gate 1 with no active findings still emits a report-shaped approval packet
  and can replay dispositioned findings because the contract requires rendering
  the full review block.
- A teammate completion handoff is incentivized to dump the done-report fields
  into chat because the prompt does not separate internal handoff data from
  operator-facing prose.
- A natural-sounding response that omits an active blocker is not directly
  rejected by the existing pressure tests because they focus on missing fields,
  not hidden decisions.

## Task 1: Add The Core Output-Invariant Contract

**Files:**

- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Add an operator-facing output section**

Insert a new section after `## Artifact handoff authority`:

```markdown
## Operator-facing output

Superteam chat output should satisfy workflow invariants rather than render a fixed status-report template by default. Teammates should write the shortest natural response that makes the current state, requested operator action, active blocker, or next step clear.

Structured bullets and headings are allowed when they help the operator act. They are not mandatory report shells.

Separate durable workflow data from chat rendering:

- Keep required evidence, done-report fields, review findings, AC verification, loopback state, PR state, and shutdown evidence in durable artifacts, explicit handoff data, PR surfaces, or other inspectable records when downstream teammates or future sessions depend on them.
- Do not rely on volatile agent context as the only home for required evidence.
- Do not dump every durable field into the operator-facing response unless those fields affect the current decision.
- Surface active blockers, active findings, requested approvals, requested feedback, and next steps clearly.
- Do not enumerate closed, resolved, or dispositioned findings in normal operator-facing output unless they affect the current operator decision.
```

- [ ] **Step 2: Soften Gate 1 rendering language without dropping evidence**

In `## Gate 1: Brainstormer approval`, keep the required evidence list, then
add this paragraph after the numbered list:

```markdown
The evidence above is required gate data, not a required chat template. The operator-facing approval request should read naturally and focus on the decision being requested. It may summarize a clean review as no approval-blocking findings remaining instead of replaying closed or dispositioned findings.
```

- [ ] **Step 3: Update Team Lead contract**

Add bullets in `### Team Lead`:

```markdown
- Render operator-facing handoffs as natural prose that satisfies the current workflow invariants instead of dumping every internal field as a status report.
- Keep required gate and handoff evidence durable even when the chat response is concise.
- Surface only findings that require current operator feedback; keep resolved finding history in artifacts or explicit handoff data.
```

- [ ] **Step 4: Update all teammate contracts**

Add a short bullet to each of `### Brainstormer`, `### Planner`,
`### Executor`, `### Reviewer`, and `### Finisher`:

```markdown
- Separate durable done-report or review data from operator-facing prose; the data must remain inspectable, but the chat handoff should be as natural and decision-focused as the situation allows.
```

For `### Finisher`, also add:

```markdown
- Natural prose must not hide publish-state blockers, pending checks, unresolved review feedback, or shutdown evidence.
```

- [ ] **Step 5: Add rationalization rows**

Append rows to `## Rationalization table`:

```markdown
| "Natural prose means we can omit required Gate 1 evidence." | Natural prose changes rendering, not evidence. Required review status, reviewer context, checked dimensions, and clean-pass rationale must still exist before planning. |
| "The operator might want audit history, so replay every closed finding." | Audit history stays available in durable artifacts or handoff data. Normal operator-facing output should show actionable findings and current decisions. |
| "Done-report contracts are status templates, so we can delete them." | Done reports are durable handoff data. The change separates internal data contracts from chat rendering. |
| "A friendly paragraph is enough even if it hides a blocker." | Operator-facing prose must clearly state blockers, required decisions, and next steps. Vague warmth is still a contract failure. |
```

- [ ] **Step 6: Add red flags**

Append bullets to `## Red flags`:

```markdown
- Operator-facing output repeats closed or dispositioned findings when no operator action is required.
- Natural prose omits the artifact, decision, active finding, blocker, or next action the operator needs.
- A change deletes durable done-report or review evidence instead of separating it from chat rendering.
- Finisher presents a conversational update that hides pending checks, unresolved feedback, mergeability problems, or PR metadata blockers.
```

## Task 2: Update Delegated Prompt Contracts

**Files:**

- Modify: `skills/superteam/agent-spawn-template.md`

- [ ] **Step 1: Add global prompt guidance**

Add this paragraph before `HARD RULES:` in the top-level `Agent({ ... })`
prompt:

```text
Write operator-facing handoffs in natural prose that satisfies the workflow invariants instead of dumping a fixed status report. Keep required done-report fields, evidence, and review state in durable or explicit handoff data, but only surface the parts the operator needs for the current decision, blocker, or next step.
```

- [ ] **Step 2: Update Team Lead role-specific guidance**

After the approval packet evidence list in the `### Team Lead` block, add:

```text
Those approval items are required gate evidence, not a required chat template. Render the operator-facing request naturally, focus on the decision needed, and do not replay closed findings when no operator feedback is required.
```

- [ ] **Step 3: Update Brainstormer and Planner guidance**

In the `### Brainstormer` and `### Planner` blocks, add:

```text
Treat the done-report fields as durable handoff data. The operator-facing handoff may be concise natural prose when it clearly states what is ready and what happens next.
```

- [ ] **Step 4: Update Executor and Reviewer guidance**

In the `### Executor` and `### Reviewer` blocks, add:

```text
Do not turn completion evidence or review data into a robotic chat report by default. Preserve the data for downstream teammates, and surface only the active findings, verification gaps, or next actions the operator needs.
```

- [ ] **Step 5: Update Finisher guidance**

In the `### Finisher` block, add:

```text
Use natural prose for status updates when possible, but never hide latest-head blockers. Pending checks, failed checks, unresolved feedback, mergeability problems, metadata violations, and shutdown blockers must remain clear and inspectable.
```

## Task 3: Add Pressure Tests

**Files:**

- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Add robotic Gate 1 output scenario**

Insert near the approval-packet scenarios:

```markdown
## Gate 1 clean review rendered as robotic status report

- Starting condition: Gate 1 has a committed design artifact, required adversarial review evidence, and no findings requiring operator feedback. Prior findings were dispositioned and are recorded in the design artifact.
- Required halt or reroute behavior: Re-render the operator-facing approval request as a natural decision prompt that identifies the artifact and requested approval without enumerating closed findings or dumping every internal review field.
- Rule surface: Gate evidence remains required, but operator-facing output should satisfy invariants instead of replaying a status-report template.
```

- [ ] **Step 2: Add natural prose hiding blocker scenario**

Insert near the same approval-packet scenarios:

```markdown
## Natural prose hides required operator decision or blocker

- Starting condition: A teammate writes a friendly handoff that says the work is "basically ready" but omits an active blocker, requested approval, unresolved finding, or next operator decision.
- Required halt or reroute behavior: Halt or rerender the handoff so the active blocker, finding, approval request, or next action is explicit.
- Rule surface: Natural operator-facing prose is allowed only when it preserves the workflow invariants needed for the current decision.
```

- [ ] **Step 3: Add done-report data dumped into chat scenario**

Insert near malformed done-report scenarios:

```markdown
## Done-report fields dumped into operator chat by default

- Starting condition: A role-specific done report contains all required durable fields, but the operator-facing response mechanically dumps every field even though most of them are only needed by downstream teammates.
- Required halt or reroute behavior: Keep the durable done-report data inspectable, but render the operator-facing handoff as concise prose focused on what is ready, what changed, and what happens next.
- Rule surface: Done-report contracts are durable handoff data, not mandatory chat templates.
```

- [ ] **Step 4: Add durable evidence deleted scenario**

Insert near artifact handoff scenarios:

```markdown
## Natural output deletes required durable evidence

- Starting condition: A workflow-contract change removes required review evidence, done-report fields, AC verification, PR state, or shutdown evidence while claiming the chat output is now more natural.
- Required halt or reroute behavior: Reject the change until required evidence remains in durable artifacts, explicit handoff data, PR surfaces, or other inspectable records.
- Rule surface: Natural prose changes presentation only; it does not remove evidence required by future teammates, reviewers, or sessions.
```

- [ ] **Step 5: Add Finisher blocker masking scenario**

Insert near Finisher shutdown scenarios:

```markdown
## Finisher conversational update hides latest-head blocker

- Starting condition: Finisher writes a friendly status update after PR publication, but required checks are pending or failing, mergeability is broken, metadata is invalid, or unresolved review feedback remains.
- Required halt or reroute behavior: Rerender the update so the latest-head blocker and next Finisher action are explicit, and do not allow shutdown readiness until the normal checks pass.
- Rule surface: Natural prose must not hide publish-state blockers or shutdown evidence.
```

## Task 4: Verify And Commit Implementation

**Files:**

- Test: `skills/superteam/SKILL.md`
- Test: `skills/superteam/agent-spawn-template.md`
- Test: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Verify invariant language exists**

Run:

```bash
rg -n "Operator-facing output|workflow invariants|fixed status-report template|closed, resolved, or dispositioned findings|durable workflow data|chat rendering" skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md
```

Expected: matches in the core skill and delegated prompt template.

- [ ] **Step 2: Verify pressure tests exist**

Run:

```bash
rg -n "Gate 1 clean review rendered as robotic status report|Natural prose hides required operator decision or blocker|Done-report fields dumped into operator chat by default|Natural output deletes required durable evidence|Finisher conversational update hides latest-head blocker" docs/superpowers/pressure-tests/superteam-orchestration-contract.md
```

Expected: all five pressure-test scenario headings are present.

- [ ] **Step 3: Verify required evidence language remains**

Run:

```bash
rg -n "adversarial_review_status|reviewer_context|clean_pass_rationale|handoff_commit_sha|verification\\[\\]|pressure_test_results\\[\\]|final unresolved blocking-feedback counts" skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md
```

Expected: required gate, handoff, review, verification, and Finisher evidence still exist.

- [ ] **Step 4: Run markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: markdownlint reports 0 errors.

- [ ] **Step 5: Run diff whitespace check**

Run:

```bash
git diff --check
```

Expected: no output and exit code 0.

- [ ] **Step 6: Commit implementation**

Run:

```bash
git add skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md
git commit -m "feat: #58 naturalize Superteam operator output"
```

Expected: commit succeeds after markdownlint and version checks.

## Review Guidance

Reviewer must invoke `superpowers:writing-skills` for this workflow-contract change and walk through the pressure scenarios added in Task 3. A clean review requires confirming that the change does both things at once: removes mandatory status-report rendering and preserves durable evidence.

## Planner Self-Review

- Spec coverage: AC-58-1 through AC-58-6 map to Tasks 1 through 4. Task 1 covers the core contract; Task 2 covers delegated prompts; Task 3 covers pressure tests; Task 4 covers verification.
- Placeholder scan: no TODO/TBD placeholders are present.
- Scope: `pr-body-template.md` is intentionally out of scope unless execution finds direct chat-output wording there.
