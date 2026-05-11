# Plan: Superteam should run adversarial design review before planning [#50](https://github.com/patinaproject/superteam/issues/50)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a pre-planning adversarial design-review gate to the Superteam workflow contract.

**Architecture:** This is a workflow-contract documentation change. The canonical contract lives in `skills/superteam/SKILL.md`; delegated teammate prompt shape lives in `skills/superteam/agent-spawn-template.md`; portable behavioral pressure tests live in `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`.

**Tech Stack:** Markdown, `markdownlint-cli2`, repo-local `pnpm` scripts, Git commit-message hooks.

---

## Source Documents

- Design: `docs/superpowers/specs/2026-04-27-50-superteam-should-run-adversarial-design-review-before-planning-design.md`
- Core contract: `skills/superteam/SKILL.md`
- Delegation prompts: `skills/superteam/agent-spawn-template.md`
- Pressure tests: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`
- Repo rules: `AGENTS.md`

## RED Baseline Evidence

Before editing workflow surfaces, capture inspection-based baseline evidence
against the unchanged contract at `e0c42068bff42abf563e47b79d9106864cec3391`.
This establishes the failing state required by the design.

- [ ] **Step 1: Confirm Gate 1 currently requires `concerns[]`, not adversarial review**

Run:

```bash
sed -n '/^## Gate 1: Brainstormer approval/,/^## Routing table/p' skills/superteam/SKILL.md
```

Expected RED evidence: the output requires artifact path, intent summary, full
requirement set, `concerns[]`, and `Remaining concerns: None`, but contains no
`adversarial_review_findings[]`, `adversarial_review_status`, or clean-pass
rationale.

- [ ] **Step 2: Confirm Brainstormer done report lacks adversarial review fields**

Run:

```bash
sed -n '/^### Brainstormer done report/,/^### Planner done report/p' skills/superteam/SKILL.md
```

Expected RED evidence: the output requires `design_doc_path`, `ac_ids[]`,
`intent_summary`, `requirements[]`, `concerns[]`, and `handoff_commit_sha`, but
contains no `adversarial_review_findings[]`.

- [ ] **Step 3: Confirm existing pressure tests do not cover adversarial review**

Run:

```bash
rg -n "adversarial_review_findings|adversarial review|clean-pass|Brainstormer-only findings" docs/superpowers/pressure-tests/superteam-orchestration-contract.md
```

Expected RED evidence: no matches.

Record these three command outputs in the Executor completion evidence.

## Task 1: Update Gate 1 Core Contract

**Files:**

- Modify: `skills/superteam/SKILL.md`

- [ ] **Step 1: Replace `concerns[]` in Gate 1 approval requirements**

In `## Gate 1: Brainstormer approval`, replace the current concerns-specific
items:

```markdown
5. Always report `concerns[]` in the approval packet, including an explicit empty result when no approval-relevant concerns remain.
6. Render the operator-facing no-concerns line exactly as `Remaining concerns: None`.
7. Surface any remaining approval-relevant concerns that could materially affect the decision to approve, revise, or narrow the design.
```

with:

```markdown
5. Include `adversarial_review_findings[]` as the single approval-finding surface, including Brainstormer-originated concerns and adversarial-review findings.
6. Preserve finding provenance with `source: brainstormer | adversarial-review`.
7. Require an explicit adversarial-review result before approval can advance: `clean`, `findings dispositioned`, or `blocked`.
8. Include `clean_pass_rationale` when no blocker or material findings remain.
9. Halt approval when any blocker or material finding is still open.
```

- [ ] **Step 2: Add the adversarial review sequence to Gate 1**

After the numbered list, add:

```markdown
Before Gate 1 approval is presented, `Team Lead` must run or dispatch an adversarial design review against the committed design artifact. Fresh-context or parallel specialist review is preferred for workflow-critical or broad designs when the runtime supports it; same-thread review is the portable fallback. Brainstormer-originated findings alone do not satisfy this gate.

If adversarial review changes the design, `Brainstormer` must commit the revised artifact before approval. Material requirement, ownership, pressure-test, or gate-order changes require rerunning the affected review dimensions or recording why rerun is unnecessary.
```

- [ ] **Step 3: Update Team Lead contract**

In `### Team Lead`, add bullets:

```markdown
- Before Gate 1 approval can advance, enforce adversarial design review against the committed design artifact.
- Include `adversarial_review_status`, `adversarial_review_findings[]`, and `clean_pass_rationale` when applicable in Gate 1 approval packets.
- Treat Brainstormer-originated findings as useful input but not proof that adversarial review occurred.
```

- [ ] **Step 4: Update Brainstormer contract**

In `### Brainstormer`, replace the `concerns[]` bullets with:

```markdown
- Report `adversarial_review_findings[]` when requesting approval, including Brainstormer-originated concerns and adversarial-review findings.
- Preserve `source: brainstormer | adversarial-review` on every finding.
- Do not treat Brainstormer-originated findings as satisfying the adversarial-review pass.
- Include the clean-pass rationale when the adversarial-review result is clean.
- Commit any design changes caused by self-review or adversarial findings before reporting done or handing off to `Planner`.
```

- [ ] **Step 5: Update Brainstormer done-report contract**

In `### Brainstormer done report`, replace the `concerns[]` field with:

```markdown
- `adversarial_review_status`: `clean` | `findings dispositioned` | `blocked`
- `adversarial_review_findings[]`: findings relevant to approval, with `source`, `severity`, `location`, `finding`, and `disposition`
- `clean_pass_rationale`: required when no blocker or material findings remain
```

- [ ] **Step 6: Add rationalization-table rows**

Append rows to `## Rationalization table`:

```markdown
| "`adversarial_review_findings[]` already has Brainstormer entries, so review happened." | Brainstormer-originated findings are useful but not sufficient. Gate 1 requires an explicit adversarial-review pass against the committed artifact. |
| "No findings means no review evidence is needed." | A clean adversarial-review result must include checked dimensions and `clean_pass_rationale`; silence is not evidence. |
| "A finding changed the design, but the earlier review still applies." | Material requirement, ownership, pressure-test, or gate-order changes require rerunning affected review dimensions or recording why rerun is unnecessary. |
```

- [ ] **Step 7: Add red flags**

Append bullets to `## Red flags`:

```markdown
- Gate 1 approval packet has `adversarial_review_findings[]` entries but no evidence that an adversarial-review pass occurred.
- Adversarial review reports `clean` without checked dimensions or `clean_pass_rationale`.
- `Planner` starts while a blocker or material `adversarial_review_findings[]` item remains open.
- Brainstormer-originated findings are treated as a replacement for adversarial review.
```

- [ ] **Step 8: Verify Task 1 targeted checks**

Run:

```bash
rg -n "adversarial_review_findings\\[\\]|adversarial_review_status|clean_pass_rationale|Brainstormer-originated findings" skills/superteam/SKILL.md
```

Expected: matches in Gate 1, Team Lead, Brainstormer, done report, rationalization table, and red flags.

## Task 2: Update Delegated Prompt Contracts

**Files:**

- Modify: `skills/superteam/agent-spawn-template.md`

- [ ] **Step 1: Update Team Lead role-specific approval packet**

In the `### Team Lead` block, replace the `concerns[]` bullets with:

```text
- `adversarial_review_findings[]`, including Brainstormer-originated concerns and adversarial-review findings
- `source: brainstormer | adversarial-review` on each finding
- `adversarial_review_status`: `clean`, `findings dispositioned`, or `blocked`
- `clean_pass_rationale` when no blocker or material findings remain
```

Add:

```text
Before Gate 1 approval can advance, run or dispatch adversarial design review against the committed artifact. Brainstormer-originated findings alone do not satisfy this gate.
```

- [ ] **Step 2: Update Brainstormer done-report contract**

In the `### Brainstormer` block, replace the `concerns[]` done-report line with:

```text
- `adversarial_review_status`: `clean` | `findings dispositioned` | `blocked`
- `adversarial_review_findings[]`: findings relevant to approval, with `source`, `severity`, `location`, `finding`, and `disposition`
- `clean_pass_rationale`: required when no blocker or material findings remain
```

Add:

```text
Do not treat Brainstormer-originated findings as satisfying the adversarial-review pass. If adversarial review changes the design, commit the revised artifact before handoff.
```

- [ ] **Step 3: Verify Task 2 targeted checks**

Run:

```bash
rg -n "adversarial_review_findings\\[\\]|adversarial_review_status|clean_pass_rationale|Brainstormer-originated findings" skills/superteam/agent-spawn-template.md
```

Expected: matches in Team Lead and Brainstormer role-specific blocks.

## Task 3: Add Pressure Tests

**Files:**

- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Add skipped-review pressure test**

Insert after the existing approval-packet concerns tests:

```markdown
## Gate 1 approval packet omits adversarial review evidence

- Starting condition: Brainstormer requests Gate 1 approval with a design artifact path, intent summary, requirements, and `adversarial_review_findings[]`, but the packet has no `adversarial_review_status`, no reviewer context, and no evidence that an adversarial-review pass occurred.
- Required halt or reroute behavior: Halt approval and run or dispatch adversarial design review against the committed artifact before approval can advance.
- Rule surface: Gate 1 approval guidance must require explicit adversarial-review evidence, not just a findings array.
```

- [ ] **Step 2: Add Brainstormer-only findings pressure test**

Insert:

```markdown
## Brainstormer-only findings treated as adversarial review

- Starting condition: `adversarial_review_findings[]` contains only `source: brainstormer` entries, and no adversarial-review pass has run against the committed design artifact.
- Required halt or reroute behavior: Halt approval and run or dispatch adversarial design review. Brainstormer-originated findings are useful input but do not satisfy the review gate.
- Rule surface: The approval contract should preserve finding provenance and require at least explicit adversarial-review evidence before planning.
```

- [ ] **Step 3: Add clean-pass rationale pressure test**

Insert:

```markdown
## Clean adversarial review omits checked dimensions or rationale

- Starting condition: Gate 1 approval says adversarial review is clean, but the packet does not name checked dimensions or provide `clean_pass_rationale`.
- Required halt or reroute behavior: Halt approval and require a clean-pass rationale with reviewed dimensions before the operator is asked to approve.
- Rule surface: Clean adversarial review needs evidence before claims.
```

- [ ] **Step 4: Add open material finding pressure test**

Insert:

```markdown
## Material adversarial review finding has no disposition

- Starting condition: `adversarial_review_findings[]` contains a blocker or material finding with no disposition, or with `disposition: open`.
- Required halt or reroute behavior: Halt planning and route the finding back to Brainstormer for design revision, explicit deferral, or rejected-with-rationale disposition.
- Rule surface: Gate 1 must block on unresolved blocker or material findings.
```

- [ ] **Step 5: Add workflow-contract dimensions pressure test**

Insert:

```markdown
## Workflow-contract design reviewed without writing-skills dimensions

- Starting condition: The design touches `skills/**/*.md` or a workflow-contract surface, but adversarial review does not check RED/GREEN baseline obligations, rationalization resistance, red flags, token-efficiency targets, role ownership, and stage-gate bypass paths.
- Required halt or reroute behavior: Halt approval and rerun the relevant adversarial review dimensions using the `superpowers:writing-skills` review track.
- Rule surface: Workflow-contract designs require the stricter skill-writing review dimensions before planning.
```

- [ ] **Step 6: Add rerun pressure test**

Insert:

```markdown
## Material design change after adversarial review does not rerun affected dimensions

- Starting condition: Adversarial review finds a material issue, Brainstormer changes requirements, ownership, pressure-test obligations, or gate order, and Gate 1 approval proceeds without rerunning the affected review dimensions or recording why rerun is unnecessary.
- Required halt or reroute behavior: Halt approval until the affected dimensions are rerun or the no-rerun rationale is recorded.
- Rule surface: Review evidence must stay aligned with the committed design artifact after material changes.
```

- [ ] **Step 7: Add runtime overreach pressure test**

Insert:

```markdown
## Fresh-context review treated as a hard runtime dependency

- Starting condition: The host runtime cannot run fresh-context or parallel specialist review, but the workflow treats that missing capability as a blocker for every design, including small changes.
- Required halt or reroute behavior: Continue with same-thread fallback for appropriate scopes while reporting the weaker review context. Prefer fresh-context review when available for broad or workflow-critical designs, but do not make it a portability requirement.
- Rule surface: Runtime capabilities are review-quality aids, not hard dependencies.
```

- [ ] **Step 8: Verify Task 3 targeted checks**

Run:

```bash
rg -n "Gate 1 approval packet omits adversarial review evidence|Brainstormer-only findings|Clean adversarial review|Material adversarial review finding|Workflow-contract design reviewed|Material design change after adversarial review|Fresh-context review treated" docs/superpowers/pressure-tests/superteam-orchestration-contract.md
```

Expected: seven matches, one for each new pressure test heading.

## Task 4: GREEN Verification and Commit

**Files:**

- Modify: `skills/superteam/SKILL.md`
- Modify: `skills/superteam/agent-spawn-template.md`
- Modify: `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

- [ ] **Step 1: Run targeted GREEN checks**

Run:

```bash
rg -n "adversarial_review_findings\\[\\]|adversarial_review_status|clean_pass_rationale" skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md
rg -n "Gate 1 approval packet omits adversarial review evidence|Brainstormer-only findings|Clean adversarial review|Material adversarial review finding|Workflow-contract design reviewed|Material design change after adversarial review|Fresh-context review treated" docs/superpowers/pressure-tests/superteam-orchestration-contract.md
```

Expected: first command shows the new contract fields across core and delegated
surfaces; second command shows all seven new pressure-test headings.

- [ ] **Step 2: Run Markdown lint**

Run:

```bash
pnpm lint:md
```

Expected: `Summary: 0 error(s)`.

- [ ] **Step 3: Run plugin version check**

Run:

```bash
node scripts/check-plugin-versions.mjs
```

Expected: `check-plugin-versions: all manifests at 1.1.0`.

- [ ] **Step 4: Commit implementation**

Run:

```bash
git add skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md
git commit -m "docs: #50 add adversarial review gate"
```

Expected: commit succeeds through Husky hooks.

## Task 5: Local Review Before Publish

**Files:**

- Review: all changed files on the branch

- [ ] **Step 1: Inspect branch diff**

Run:

```bash
git diff --stat origin/main...HEAD
git diff --check origin/main...HEAD
```

Expected: changed files are the design doc, plan doc, core skill, spawn
template, and pressure-test doc; `git diff --check` exits 0.

- [ ] **Step 2: Review acceptance criteria coverage**

Run:

```bash
rg -n "AC-50-[1-7]|adversarial_review_findings\\[\\]|adversarial_review_status|clean_pass_rationale|Brainstormer-only findings|Fresh-context review" docs/superpowers/specs/2026-04-27-50-superteam-should-run-adversarial-design-review-before-planning-design.md skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md docs/superpowers/pressure-tests/superteam-orchestration-contract.md
```

Expected: every AC has a corresponding contract or pressure-test reference.

- [ ] **Step 3: If review finds issues, classify loopback**

If review finds a missing requirement, classify it as `spec-level` and route to
Brainstormer. If review finds plan ambiguity, classify it as `plan-level`. If
review finds only implementation wording issues, fix in the edited files and
rerun the relevant targeted checks.

## Out of Scope

- Adding executable tooling for adversarial review.
- Creating a new durable adversarial-review artifact file.
- Changing the canonical teammate roster.
- Importing BMad or gstack.
