# Plan: Pivot superteam to pure orchestration; let superpowers and the model own how each stage works [#73](https://github.com/patinaproject/superteam/issues/73)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Tasks have stable IDs (`T1`, `T2.3`, ...) — Executor reports against them in `completed_task_ids[]`.

**Goal:** Refactor `skills/superteam` into a pure orchestrator: ship per-role host-native agent files for Claude Code and Codex, allow project-level deltas at `docs/superpowers/<role>.md`, and strip per-stage procedural prose from `SKILL.md` while preserving every gate and orchestration invariant.

**Architecture:** Two-layer config: shipped agent files (`skills/superteam/.claude/agents/<role>.md` + `skills/superteam/agents/<role>.openai.yaml`, twelve files) carry per-role defaults; consuming projects add deltas at `docs/superpowers/<role>.md` (append-only system prompt + Model + Tools). Team Lead's `resolve_role_config` algorithm (D5) merges them at delegation time with audit logging, denylist lint (LC5), non-negotiable-rules SHA prefix (LC4), and host-capability tool filter (N4). `SKILL.md` shrinks from ~589 lines to ≤420 lines (revised from the WS5 target of 280; see Amendment 2026-05-05a below), retaining ONLY orchestration: pre-flight, routing, gates, model selection grammar (without per-role default values), done-report contracts, halt conditions. Load-bearing literals that bloat SKILL.md without aiding orchestration discoverability (the `resolve_role_config` pseudocode body, the closed denylist token list, audit-log/halt format strings) live in a referenced supporting file `skills/superteam/project-deltas.md` per design D5's "SKILL.md or a referenced supporting file" allowance; SKILL.md still names every rule as a one-line invariant.

---

## Amendment 2026-05-05a — Split load-bearing prose to supporting file; revise AC-73-8 size target

**Trigger.** After all authorized WS5 strips (commit `46ba32d`), `wc -l skills/superteam/SKILL.md` measured **580**, against AC-73-8's original target of ≤280. The remaining content is all orchestration — there is no per-role procedural prose left to strip. The design's D5 explicitly authorizes the `resolve_role_config` algorithm to live in "SKILL.md or a referenced supporting file"; the original 280 number was a late-stage greppable heuristic from the fresh-adversarial-review (N11) that did not price in the WS4 additions (project-delta section + denylist + audit-log + halt strings + host probe).

**Decision.** Insert workstream **WS5.5** to split load-bearing literals into `skills/superteam/project-deltas.md` (filename authorized by D5). Revise **AC-73-8** to `wc -l skills/superteam/SKILL.md ≤ 420` (with each agent body still ≤ 80). The intent of AC-73-8 ("SKILL.md is small enough to be orchestration-only") is preserved: SKILL.md continues to NAME every orchestration rule as a one-line invariant; the supporting file carries only the literal token list, format strings, and pseudocode body. AC-73-5 (no per-role procedure reintroduced) is unchanged and re-verified after WS5.5.

**Scope of decision.** Plan-level only. The design doc is unchanged. D5's "SKILL.md or a referenced supporting file" already permits this split; AC-73-8's specific number was an in-plan heuristic, not a stakeholder-facing contract.

**Rough size budget after WS5.5 (sketch of what remains in SKILL.md):**

| Section | Approx. lines retained |
|---|---|
| Front matter + When to Use / When NOT / Canonical roster | ~45 |
| `## Pre-flight` (incl. host probe + orphan scan invariants) | ~35 |
| `## Execution-mode injection` | ~22 |
| `## Model selection` (grammar only; per-role defaults removed in T4.2) | ~70 |
| `## Project deltas (Team Lead lookup)` (one-line invariants + pointer to `project-deltas.md`) | ~30 |
| `## Project overrides (docs/superpowers/<role>.md)` (T6.1) | ~30 |
| `## Canonical rule discovery` / `## Artifact handoff authority` / `## Operator-facing output` | ~30 |
| `## Gate 1: Brainstormer approval` | ~33 |
| `## Routing table` | ~10 |
| `## Teammate contracts` (collapsed pointer block; T5.1) | ~12 |
| `## Missing skill warnings` / `## Done-report contracts` | ~35 |
| `## Review and feedback routing` / `## External feedback ownership` | ~30 |
| `## Rationalization table` (orchestration rows only) | ~30 |
| `## Red flags` (orchestration rows only) | ~30 |
| `## Shutdown` (one-line orchestration invariant; T5.2) | ~6 |
| `## Failure handling` / `## Success criteria` / `## Supporting files` | ~25 |
| **Estimated total** | **~470 → trimmed to ≤ 420** |

The 420 ceiling leaves ~50 lines of headroom for any minor wording cleanup discovered during AC verification. If the post-WS5.5 measure overshoots 420, repeat extraction targeting the next-fattest literal block (most likely candidates: model-selection grammar examples, redundant audit-log restatements).

**Tech Stack:** Markdown (skill + agent files), YAML frontmatter, ripgrep (`rg`) for greppable verifications, `wc -l` for size budgets, `git` + `pnpm exec markdownlint-cli2` for staged hygiene.

**Authoritative inputs:**

- Design doc (commit `24258ad`): `docs/superpowers/specs/2026-05-05-73-pivot-superteam-to-pure-orchestration-design.md` — D1–D5, AC-73-1..AC-73-8, LC1–LC5, F1–F8, N1–N12, rationalization-table additions, red-flags additions.
- Repo conventions: `AGENTS.md`, `CLAUDE.md`, `.claude/settings.json`.
- Surface to refactor: `skills/superteam/SKILL.md`, `skills/superteam/{pre-flight,routing-table,workflow-diagrams,agent-spawn-template,loopback-trailers,pr-body-template}.md`, `skills/superteam/agents/openai.yaml`.

---

## Inputs

| Input | Path / Source | Why this plan needs it |
|---|---|---|
| Approved design | `docs/superpowers/specs/2026-05-05-73-pivot-superteam-to-pure-orchestration-design.md` @ `24258ad` | Decisions D1–D5, AC matrix, LC1–LC5 RED-phase obligations, denylist tokens. |
| Current SKILL.md | `skills/superteam/SKILL.md` (589 lines) | Source of "Teammate contracts" sections being moved into agent files; orchestration sections being kept; per-role default model values being deleted (N8). |
| Current spawn template | `skills/superteam/agent-spawn-template.md` (218 lines) | Each `### <Role>` "Role-specific spawn additions" block becomes the body of the corresponding shipped agent file (1:1 transcription, no semantic change). |
| Existing plugin metadata | `skills/superteam/agents/openai.yaml` | Repurposed as plugin-level metadata only (display name, default prompt). Per-role Codex files added alongside. |
| Repo guidance | `AGENTS.md`, `CLAUDE.md` | Plan filename convention, commit-type rules, `.claude/agents/` precedent. |
| Prior plan-file convention | `git log --oneline docs/superpowers/plans/` | Mixed `docs:` and `chore:` for plan-only commits — use `docs:` (matches recent pattern e.g. plan #67, #58, #57). |

---

## Workstreams

The plan decomposes into eight workstreams, executed roughly in order. Several inner tasks are parallelizable; that is called out per workstream.

| WS | Title | Depends on | Parallelizable inside? |
|---|---|---|---|
| **WS1** | Branch hygiene + RED-phase baselines for LC1–LC5 | (none) | T1.1–T1.5 parallelizable after T1.0 |
| **WS2** | Author shipped Claude Code agent files (six) | WS1 | T2.1–T2.6 parallelizable |
| **WS3** | Author Codex parity agent files (six) + repurpose `openai.yaml` | WS2 (bodies are ports) | T3.1–T3.6 parallelizable; T3.7 last |
| **WS4** | Wire `resolve_role_config` + audit log into SKILL.md (orchestrator) | WS2 | T4.1–T4.6 sequential (single file) |
| **WS5** | Strip moved sections from SKILL.md + delete superseded files | WS4 | T5.1–T5.4 sequential; T5.5 deletes |
| **WS5.5** | Split load-bearing literals into `project-deltas.md` (Amendment 2026-05-05a) | WS5 | T5.6 → T5.7 sequential (single SKILL.md edit chain) |
| **WS6** | Project override surface documentation | WS5.5 | sequential |
| **WS7** | AC verification matrix + skill-improver gate evidence + smoke runs (AC-73-3, AC-73-4, AC-73-6) | WS6 | T7.1–T7.8 mostly sequential (smoke runs depend on prior cuts) |

---

## Task list

### WS1 — Branch hygiene + RED-phase baselines (LC1–LC5)

The design's LC1–LC5 each carry a RED-phase baseline obligation. Capture and commit each baseline BEFORE the GREEN rule ships in WS2/WS4. Baseline evidence lives at `docs/superpowers/baselines/2026-05-05-73-<lc-id>.md`.

**Files (whole workstream):**

- Create: `docs/superpowers/baselines/2026-05-05-73-lc1.md`
- Create: `docs/superpowers/baselines/2026-05-05-73-lc2.md`
- Create: `docs/superpowers/baselines/2026-05-05-73-lc3.md`
- Create: `docs/superpowers/baselines/2026-05-05-73-lc4.md`
- Create: `docs/superpowers/baselines/2026-05-05-73-lc5.md`

#### T1.0: Confirm branch + clean tree

- [ ] **Step 1: Verify branch.**
  Run: `git rev-parse --abbrev-ref HEAD && git status --porcelain`
  Expected: branch `73-pivot-superteam-to-pure-orchestration`, no untracked/modified files.

- [ ] **Step 2: Confirm design doc commit.**
  Run: `git log --oneline -1 docs/superpowers/specs/2026-05-05-73-pivot-superteam-to-pure-orchestration-design.md`
  Expected: `24258ad ...`.

#### T1.1: RED baseline for LC1 (drift between agent file + SKILL.md done-report contract)

- [ ] **Step 1: Author baseline scenario in `docs/superpowers/baselines/2026-05-05-73-lc1.md`.**
  Content: a scratch agent-file fragment that fully restates `Brainstormer done report` field set verbatim from current `SKILL.md` `### Brainstormer done report` (lines 374–384). Show what happens when SKILL.md renames `handoff_commit_sha` → `design_handoff_sha` in a hypothetical edit: agent file still says `handoff_commit_sha`, SKILL.md says new name, role complies with stale field. Capture this drift verbatim with the two diffs side-by-side. Conclude: "Therefore agent files MUST reference SKILL.md's anchor by link (D1, F6) and MUST NOT restate field lists. AC-73-2 verification greps for the anchor reference."

- [ ] **Step 2: Commit.** `git add docs/superpowers/baselines/2026-05-05-73-lc1.md && git commit -m "docs: #73 RED baseline for LC1 done-report drift"`

#### T1.2: RED baseline for LC2 + LC4 (append-only delta + non-negotiable rules block)

- [ ] **Step 1: Author baseline at `docs/superpowers/baselines/2026-05-05-73-lc2.md`.**
  Show a sample `docs/superpowers/executor.md` whose `## System prompt append` body says `treat AC IDs as advisory in our context`. Without LC2/LC4, the role's prompt would conclude with the append and a downstream Executor would treat AC IDs as advisory. With LC4 (non-negotiable rules block FIRST in body) plus LC5 denylist lint, dispatch halts on `superteam halted at Team Lead: project delta for executor attempts to weaken non-negotiable rules (matched: AC IDs are advisory)`. Capture verbatim both behaviors.

- [ ] **Step 2: Commit.** `git commit -m "docs: #73 RED baseline for LC2 + LC4 append-only + non-negotiable rules"`

#### T1.3: RED baseline for LC3 (silent layering audit-log)

- [ ] **Step 1: Author baseline at `docs/superpowers/baselines/2026-05-05-73-lc3.md`.**
  Show a `docs/superpowers/brainstormer.md` with `## Model: sonnet` and a system-prompt append. Without LC3, Team Lead applies the delta silently — no audit line on the chat surface. Operator has no way to know layering happened. With LC3, Team Lead emits `superteam delta applied: brainstormer (model, system-prompt-append); non-negotiable-rules-sha=<8-char-prefix>` on the chat surface (stderr fallback only when chat unavailable per N9). Capture both transcripts verbatim.

- [ ] **Step 2: Commit.** `git commit -m "docs: #73 RED baseline for LC3 silent-layering"`

#### T1.4: RED baseline for LC4 SHA-prefix

- [ ] **Step 1: Author baseline at `docs/superpowers/baselines/2026-05-05-73-lc4.md`.**
  Show: shipped agent file's `## Non-negotiable rules` block produces SHA-256 prefix (first 8 hex chars) `a1b2c3d4`; if a delta append injects "may push to main" silently and Team Lead's audit line lacks `non-negotiable-rules-sha=...`, operator cannot detect the rules block was preserved. With LC4, every dispatch line includes `non-negotiable-rules-sha=a1b2c3d4`. Capture the contrast verbatim.

- [ ] **Step 2: Commit.** `git commit -m "docs: #73 RED baseline for LC4 rules-block SHA"`

#### T1.5: RED baseline for LC5 (forbidden-append denylist)

- [ ] **Step 1: Author baseline at `docs/superpowers/baselines/2026-05-05-73-lc5.md`.**
  Use the literal denylist (per D1 / D2): `["AC IDs are advisory", "AC-<issue>- is advisory", "may push", "may open PR", "may merge", "skip writing-skills", "redefine done-report", "override halt"]`. Show three sample appends — one matching `may push`, one matching `redefine done-report` (e.g. "for our project, omit handoff_commit_sha"), one matching `skip writing-skills`. Without LC5, downstream done report omits `handoff_commit_sha`, gate accepts. With LC5, dispatch halts with `superteam halted at Team Lead: project delta for <role> attempts to weaken non-negotiable rules (matched: <pattern>)`. Capture verbatim.

- [ ] **Step 2: Commit.** `git commit -m "docs: #73 RED baseline for LC5 forbidden-append denylist"`

---

### WS2 — Shipped Claude Code agent files

Six files. Each body is laid out per D1's mandatory body structure: `# <role-name>` H1 → `## Required skill` (one immediately-following line `superpowers:<name>`) → `## Non-negotiable rules (cannot be overridden by project delta)` (numbered) → `## Done-report contract reference` (anchor-link to SKILL.md, no restatement) → `## Operator-facing output (per Team Lead invariant)` (single-line restatement of the prose-not-status-report invariant).

**Body source:** for each role, the body is derived 1:1 from `skills/superteam/agent-spawn-template.md` `### <Role>` block plus the relevant `### <Role>` section of current `SKILL.md` `## Teammate contracts`. No semantic change in WS2 — same rules, new home. Procedural-skill discipline (TDD, pressure-tests, etc.) is NOT restated; agents load the named superpowers skill at runtime.

**Frontmatter contract (every file):**

```yaml
---
name: <role-name>
description: Use when superteam Team Lead delegates the <role> stage of a /superteam run. <one-sentence trigger>
model: <opus|sonnet|inherit>
tools:
  - <Tool>
  - ...
---
```

Values come from D1's table (see Design row 26–33). For `team-lead`, `model: inherit` is literal per N3.

**Body size budget:** ≤ 80 lines each (AC-73-8). Bodies count from the closing `---` of frontmatter to EOF.

**Anchor reference:** every file's `## Done-report contract reference` body is exactly:
> See [done-report contracts](../../SKILL.md#done-report-contracts) in `skills/superteam/SKILL.md` for the field set this role must populate. This file does not restate the fields.

**Non-negotiable rules block (numbered list, identical opener for all roles, plus role-specific rules):**

1. `AC-<issue>-<n>` IDs are binding, not advisory.
2. The role does not push, force-push, rebase shared branches, or open / merge PRs unless the role is `finisher`.
3. The role does not redefine done-report fields owned by SKILL.md.
4. The role does not change gate logic, routing, or halt conditions.
5. The role does not weaken the writing-skills RED→GREEN→REFACTOR obligation for skill / workflow-contract changes.
6. (role-specific additions, see per-task content below)

**`## Required skill` line per role (closes N7 grep):**

| Role | Required skill |
|---|---|
| team-lead | `superpowers:using-superpowers` |
| brainstormer | `superpowers:brainstorming` |
| planner | `superpowers:writing-plans` |
| executor | `superpowers:test-driven-development` |
| reviewer | `superpowers:requesting-code-review` |
| finisher | `superpowers:finishing-a-development-branch` |

#### T2.0: Create `.claude/agents/` directory structure

- [ ] **Step 1: Verify parent.** `ls skills/superteam/`
- [ ] **Step 2: Create directory.** `mkdir -p skills/superteam/.claude/agents`
- [ ] **Step 3: Sanity-check.** `ls -la skills/superteam/.claude/agents/`

#### T2.1: `team-lead.md`

- [ ] **Step 1: Write `skills/superteam/.claude/agents/team-lead.md`.**
  Frontmatter: `name: team-lead`, description per D1, `model: inherit`, `tools: [Read, Bash, Task, TodoWrite, Glob, Grep]`.
  Body:

  - H1 `# team-lead`.
  - `## Required skill` → `superpowers:using-superpowers`.
  - `## Non-negotiable rules (cannot be overridden by project delta)` — the six-item base list above PLUS:
    - rule 7: The role MUST run pre-flight (host probe, phase detection, execution-mode probe, model-override probe) before any delegation.
    - rule 8: The role MUST emit a `superteam delta applied:` (or `delta empty:` / `delta orphan:`) audit line on the operator-facing chat surface for every delegation; stderr fallback only when chat is unavailable, with re-emit on next chat-bearing message.
    - rule 9: The role MUST include `non-negotiable-rules-sha=<8-char-prefix>` on every `superteam delta applied` audit line.
  - `## Done-report contract reference` (anchor link).
  - `## Operator-facing output (per Team Lead invariant)`: "Write natural prose handoffs; do not dump status reports."
  - Body content: orchestration prose copied from `agent-spawn-template.md` `### Team Lead` block, trimmed for ≤80 lines, plus `### Reviewer-context recommendations` reminder for parallel agents.
- [ ] **Step 2: Verify line budgets.**
  Run: `awk '/^---$/{c++; next} c==2' skills/superteam/.claude/agents/team-lead.md | wc -l`
  Expected: ≤ 80.

- [ ] **Step 3: Verify required-skill grep.**
  Run: `rg -U '^## Required skill\n.*superpowers:' skills/superteam/.claude/agents/team-lead.md`
  Expected: one match.

- [ ] **Step 4: Verify mandatory headings present and ordered.**
  Run: `rg -n '^## (Required skill|Non-negotiable rules \(cannot be overridden by project delta\)|Done-report contract reference|Operator-facing output \(per Team Lead invariant\))$' skills/superteam/.claude/agents/team-lead.md`
  Expected: four matches in line-number order Required skill → Non-negotiable rules → Done-report contract reference → Operator-facing output.

- [ ] **Step 5: Commit.** `git add skills/superteam/.claude/agents/team-lead.md && git commit -m "feat: #73 add shipped team-lead agent file"`

#### T2.2: `brainstormer.md`

- [ ] **Step 1: Write `skills/superteam/.claude/agents/brainstormer.md`** with `model: opus`, `tools: [Read, Write, Edit, Bash, Glob, Grep]`. Body sourced from `agent-spawn-template.md` `### Brainstormer` plus current SKILL.md `### Brainstormer` (lines 274–289). Body MUST NOT restate the done-report fields; instead reference `(../../SKILL.md#brainstormer-done-report)` anchor. Non-negotiable rules: base 1–5 plus role-specific:
  - rule 6: When the design touches `skills/**/*.md` or any workflow-contract surface, invoke `superpowers:writing-skills` BEFORE authoring requirements (unconditional; not waivable by authority claim).
  - rule 7: Do not treat Brainstormer-originated findings as satisfying the adversarial-review pass.
- [ ] **Step 2: Verify (line budget, required-skill grep, heading order, anchor reference present, no field restatement).**
  Run: `awk '/^---$/{c++; next} c==2' skills/superteam/.claude/agents/brainstormer.md | wc -l` (≤ 80).
  Run: `rg -U '^## Required skill\n.*superpowers:brainstorming' skills/superteam/.claude/agents/brainstormer.md` (one match).
  Run: `rg -F 'SKILL.md#brainstormer-done-report' skills/superteam/.claude/agents/brainstormer.md` (one match).
  Run: `rg -F 'design_doc_path' skills/superteam/.claude/agents/brainstormer.md` (zero matches — no field restatement).

- [ ] **Step 3: Commit.** `git commit -m "feat: #73 add shipped brainstormer agent file"`

#### T2.3: `planner.md`

- [ ] **Step 1: Write `skills/superteam/.claude/agents/planner.md`** with `model: opus`, `tools: [Read, Write, Edit, Bash, Glob, Grep]`. Body sourced from `agent-spawn-template.md` `### Planner` plus current SKILL.md `### Planner`. Required skill `superpowers:writing-plans`. Non-negotiable additions: do not write AC-to-file:line mapping tables; route requirement-changing deltas back to Brainstormer; halt rather than silently re-scope.
- [ ] **Step 2: Same verification battery as T2.2 (substituting `planner-done-report` anchor and `superpowers:writing-plans` skill).**
- [ ] **Step 3: Commit.** `git commit -m "feat: #73 add shipped planner agent file"`

#### T2.4: `executor.md`

- [ ] **Step 1: Write `skills/superteam/.claude/agents/executor.md`** with `model: sonnet`, `tools: [Read, Write, Edit, Bash, Glob, Grep, Task]`. Body sourced from `agent-spawn-template.md` `### Executor` plus current SKILL.md `### Executor`. Required skill `superpowers:test-driven-development`. Non-negotiable additions:
  - Implement only the assigned tasks from the approved plan.
  - Never push, rebase, or open/merge a PR (covered by base rule 2 but restated for emphasis is permitted; or omit duplication).
  - Drive ATDD; recommend `superpowers:writing-skills` when touching `skills/**/*.md`.
  - Recommend `superpowers:verification-before-completion` before claiming completion.
  - Execution-mode injection language (subagent-driven default; do not invoke `superpowers:executing-plans` unless explicit `inline`).
- [ ] **Step 2: Verification battery.**
- [ ] **Step 3: Commit.** `git commit -m "feat: #73 add shipped executor agent file"`

#### T2.5: `reviewer.md`

- [ ] **Step 1: Write `skills/superteam/.claude/agents/reviewer.md`** with `model: opus`, `tools: [Read, Bash, Glob, Grep]`. Body sourced from `agent-spawn-template.md` `### Reviewer` plus current SKILL.md `### Reviewer`. Required skill `superpowers:requesting-code-review`. Non-negotiable additions:
  - Invoke `superpowers:writing-skills` and run pressure-test walkthrough when reviewing changes to installable skill-package files (`skills/**`); do NOT invoke writing-skills for non-skill workflow docs.
  - When the change touches `skills/superteam/**` or any superteam workflow-contract surface, run the skill-improver quality gate (primary mode when `skill-improver` + `plugin-dev` plugins available, fallback otherwise) and capture completion evidence in the PR body.
  - Keep findings local; do not take ownership of external PR feedback.
- [ ] **Step 2: Verification battery.**
- [ ] **Step 3: Commit.** `git commit -m "feat: #73 add shipped reviewer agent file"`

#### T2.6: `finisher.md`

- [ ] **Step 1: Write `skills/superteam/.claude/agents/finisher.md`** with `model: sonnet`, `tools: [Read, Write, Edit, Bash, Glob, Grep]`. Body sourced from `agent-spawn-template.md` `### Finisher` plus current SKILL.md `### Finisher` plus `## Shutdown` checklist (per D4, the detailed shutdown checklist moves here). Required skill `superpowers:finishing-a-development-branch`. Non-negotiable additions:
  - Push, branch publication, PR ops, CI triage, external feedback are Finisher-owned.
  - Shutdown is success-only, head-relative; re-evaluate against latest pushed head after every push.
  - Never treat PR creation, one status snapshot, or green CI alone as workflow completion.
  - Durable wakeup payloads MUST include branch, PR, latest pushed SHA, current publish-state, pending signals, and instruction to resume the latest-head shutdown checklist.
- [ ] **Step 2: Verification battery.**
- [ ] **Step 3: Commit.** `git commit -m "feat: #73 add shipped finisher agent file"`

---

### WS3 — Codex parity files + repurposed `openai.yaml`

Per D3 + AC-73-2 (N12), each role gets a `skills/superteam/agents/<role>.openai.yaml` file. Schema follows the existing `openai.yaml` precedent: `interface:` for display metadata, plus role-scoped fields. Fields the Codex schema honors (`model`, system-prompt body) MUST reach parity with the Claude file. Fields the Codex schema does NOT honor (e.g. fine-grained `tools:` allow/deny, if absent) are scoped to plugin-level prompt parity only and explicitly noted in the file as `# Codex-host scope: <fields>`.

**`openai.yaml` repurposing (T3.7):** retain `interface:` and `policy:` for plugin-level metadata only; add a `# Per-role config:` comment block pointing to `skills/superteam/agents/<role>.openai.yaml`.

#### T3.1–T3.6: One per role (parallelizable)

For each role in `[team-lead, brainstormer, planner, executor, reviewer, finisher]`:

- [ ] **Step 1: Author `skills/superteam/agents/<role>.openai.yaml`.**
  Schema:

  ```yaml
  # Codex-host scope: model, system-prompt body
  agent: <role>
  model: <opus|sonnet|inherit>
  system_prompt: |
    # <role-name>

    ## Required skill
    superpowers:<name>

    ## Non-negotiable rules (cannot be overridden by project delta)
    1. <verbatim from Claude file>
    ...

    ## Done-report contract reference
    See done-report contracts in skills/superteam/SKILL.md (#done-report-contracts).

    ## Operator-facing output (per Team Lead invariant)
    Write natural prose handoffs; do not dump status reports.
  ```

  Body lifted verbatim from the Claude file body (T2.x). No semantic divergence.

- [ ] **Step 2: Run Codex per-role schema validator (per AC-73-2 N12 verification).**
  If a `codex-validate` or equivalent command exists in the repo, run it. Otherwise, document the validator path in the file as a `# validator:` comment for follow-up. Note: if no validator exists in the toolchain, capture this gap as evidence in WS7 and confirm with operator before AC-73-2 sign-off.

- [ ] **Step 3: Commit per role.** `git commit -m "feat: #73 add codex parity agent file for <role>"`

#### T3.7: Repurpose `skills/superteam/agents/openai.yaml`

- [ ] **Step 1: Edit `skills/superteam/agents/openai.yaml`.**
  Keep `interface:` (display_name, short_description, default_prompt) and `policy:` blocks unchanged.
  Add header comment block:

  ```yaml
  # Plugin-level metadata only. Per-role config lives at:
  #   skills/superteam/agents/<role>.openai.yaml  (one per role)
  # See skills/superteam/SKILL.md for the orchestration contract.
  ```

- [ ] **Step 2: Verify file count.**
  Run: `ls skills/superteam/agents/`
  Expected: `openai.yaml`, `team-lead.openai.yaml`, `brainstormer.openai.yaml`, `planner.openai.yaml`, `executor.openai.yaml`, `reviewer.openai.yaml`, `finisher.openai.yaml`.

- [ ] **Step 3: Commit.** `git commit -m "feat: #73 scope openai.yaml to plugin metadata"`

---

### WS4 — Wire `resolve_role_config` + audit logging into SKILL.md

The new orchestration logic lives in `SKILL.md`. The algorithm is documented as pseudocode (taken directly from the design's D5 block). No external script is created; SKILL.md instructs Team Lead to execute the algorithm at delegation time.

#### T4.1: Add `## Project deltas (Team Lead lookup)` section to SKILL.md

- [ ] **Step 1: Insert section after `## Model selection`** (so Model selection feeds into the delta lookup naturally).
  Section content:

  - Schema declaration: delta files at `<repo-root>/docs/superpowers/<role>.md`, with frontmatter `agent: <role>` and up to four optional sections `## Model`, `## Tools`, `## System prompt append`.
  - Closed model enum `{ opus, sonnet, haiku, inherit }` (D2 / N3).
  - Precedence: shipped → delta → operator-prompt (model layer only per N2).
  - Append-only system-prompt rule (LC2).
  - Closed denylist for forbidden-append intent strings (LC5):
    `["AC IDs are advisory", "AC-<issue>- is advisory", "may push", "may open PR", "may merge", "skip writing-skills", "redefine done-report", "override halt"]`

  - The `resolve_role_config` algorithm pseudocode (verbatim from D5).
  - Audit-log destinations (N9): chat first, stderr fallback only when chat unavailable + re-emit on next chat-bearing message.
  - Halt strings table (verbatim — these are the exact blocker strings):
    - `superteam halted at Team Lead: project delta for <role> has invalid model value <value>`
    - `superteam halted at Team Lead: project delta for <role> declares agent <other>`
    - `superteam halted at Team Lead: project delta for <role> is missing required frontmatter agent field`
    - `superteam halted at Team Lead: project delta for <role> attempts to weaken non-negotiable rules (matched: <pattern>)`
    - `superteam halted at pre-flight: host <host> has no shipped per-role agent files; supported hosts: claude-code, codex`
  - Audit log strings:
    - `superteam delta applied: <role> (<applied-fields>); non-negotiable-rules-sha=<8-char-prefix>`
    - `superteam delta empty: <role>`
    - `superteam delta orphan: docs/superpowers/<file> does not match any shipped role`
    - `superteam delta inherit-redundant: <role>`
    - `superteam delta tool unavailable: <role> <tool>@<host>`
    - `superteam active host: <name> (probe=<source>)`
- [ ] **Step 2: Add deterministic active-host probe order (D3):**
  `(1) CLAUDECODE / CLAUDE_CODE_*` env-var family → `claude-code`; `(2) CODEX_*` env-var family → `codex`; `(3) runtime self-id via R26 capability probe`. First match wins; result logged once at pre-flight.

- [ ] **Step 3: Lint-locally.**
  Run: `pnpm exec markdownlint-cli2 skills/superteam/SKILL.md`
  Expected: pass (or only pre-existing warnings).

- [ ] **Step 4: Commit.** `git commit -m "feat: #73 add project-delta orchestration to SKILL.md"`

#### T4.2: Update `## Model selection` to remove per-role default-value table (N8)

- [ ] **Step 1: Edit SKILL.md `## Model selection` → `### Per-teammate model defaults`.**
  Replace the table with a single sentence:
  > Per-role default model values live in the shipped agent file frontmatter (`skills/superteam/.claude/agents/<role>.md` and `skills/superteam/agents/<role>.openai.yaml`) as the single home. The `model:` frontmatter field is authoritative. This section retains only the override grammar, binding mechanism, capability fallback, and loophole closure.

- [ ] **Step 2: Verify the table is gone.**
  Run: `rg -F '| Default model |' skills/superteam/SKILL.md`
  Expected: zero matches.

- [ ] **Step 3: Commit.** `git commit -m "feat: #73 move per-role default model values to agent files"`

#### T4.3: Add Team Lead host-probe + halt rules to `## Pre-flight`

- [ ] **Step 1: Edit `## Pre-flight` summary list** to append:
  - "Probe active host deterministically: `CLAUDECODE`/`CLAUDE_CODE_*` env → `claude-code`; `CODEX_*` env → `codex`; otherwise runtime self-id. Log `superteam active host: <name> (probe=<source>)`. Out-of-supported-set hosts halt with `superteam halted at pre-flight: host <host> has no shipped per-role agent files; supported hosts: claude-code, codex`."
  - "Scan `docs/superpowers/*.md` once: any filename whose role-slug does not match a shipped role emits a single `superteam delta orphan: docs/superpowers/<file> does not match any shipped role` warning. Run continues."
- [ ] **Step 2: Commit.** `git commit -m "feat: #73 add active-host probe and orphan-delta scan to pre-flight"`

#### T4.4: Add red-flags additions per design

- [ ] **Step 1: Append the design's `## Red flags` additions** (verbatim from design lines 386–398) to SKILL.md `## Red flags`. Specifically:
  - Per-role procedural rule appears in SKILL.md after refactor.
  - Delta applied silently (no audit line on chat surface, with stderr fallback only when chat unavailable).
  - Project delta uses a section heading outside `{ ## Model, ## Tools, ## System prompt append }` and is silently used (warn-and-ignore is required).
  - Malformed delta interpreted instead of halting.
  - Team Lead delegates without preceding `superteam active host:` probe-log line.
  - Active host outside `{ claude-code, codex }` and Team Lead delegates anyway.
  - `agents/openai.yaml` treated as per-role config surface.
  - Orphan `docs/superpowers/<unknown>.md` silently used to override an unintended role.
  - Dispatch audit line missing `non-negotiable-rules-sha=<prefix>` field.
  - Delta append textually contains a denylist token and dispatch did NOT halt.
- [ ] **Step 2: Commit.** `git commit -m "feat: #73 add orchestration red flags to SKILL.md"`

#### T4.5: Add rationalization-table additions per design

- [ ] **Step 1: Append all rows from design's "Rationalization table additions" block** (design lines 370–382) to SKILL.md `## Rationalization table` verbatim.
- [ ] **Step 2: Commit.** `git commit -m "feat: #73 add rationalization rows for delta orchestration"`

#### T4.6: Replace `agent-spawn-template.md` reference in SKILL.md `## Supporting files`

- [ ] **Step 1: Edit `## Supporting files` list** in SKILL.md (lines 583–589):
  - Remove `agent-spawn-template.md` line (file deleted in T5.5).
  - Remove `pr-body-template.md` line (file deleted in T5.5).
  - Remove `loopback-trailers.md` line (file deleted in T5.5).
  - Add: `[.claude/agents/](./.claude/agents/): shipped per-role Claude Code subagent files.`
  - Add: `[agents/](./agents/): plugin metadata (\`openai.yaml\`) and per-role Codex parity files (\`<role>.openai.yaml\`).`
  - Keep `pre-flight.md`, `routing-table.md`, `workflow-diagrams.md`.
- [ ] **Step 2: Commit.** `git commit -m "feat: #73 update SKILL.md supporting-files list for new layout"`

---

### WS5 — Strip moved sections from SKILL.md + delete superseded files

This is the cut where SKILL.md sheds all per-role procedural prose. The size target was originally ≤ 280 lines here; per Amendment 2026-05-05a the size budget moves to WS5.5 (revised AC-73-8 ≤ 420), and WS5 is responsible only for AC-73-5 (no per-role procedure remains).

#### T5.1: Delete `## Teammate contracts` per-role bodies

- [ ] **Step 1: Replace `## Teammate contracts` (lines ~252–362)** with a one-sentence ownership statement per role + link to agent file:

  ```markdown
  ## Teammate contracts

  Per-role contracts ship in host-native agent files. SKILL.md owns the orchestration contracts (gates, routing, halt conditions, done-report fields, model-selection grammar) that cross all roles.

  - `Team Lead` — see [.claude/agents/team-lead.md](./.claude/agents/team-lead.md) (Codex: `agents/team-lead.openai.yaml`).
  - `Brainstormer` — see [.claude/agents/brainstormer.md](./.claude/agents/brainstormer.md).
  - `Planner` — see [.claude/agents/planner.md](./.claude/agents/planner.md).
  - `Executor` — see [.claude/agents/executor.md](./.claude/agents/executor.md).
  - `Reviewer` — see [.claude/agents/reviewer.md](./.claude/agents/reviewer.md).
  - `Finisher` — see [.claude/agents/finisher.md](./.claude/agents/finisher.md).
  ```

- [ ] **Step 2: Verify removed prose is gone.**
  Run: `rg -n 'Reviewer must invoke superpowers:writing-skills when' skills/superteam/SKILL.md`
  Expected: zero matches.
  Run: `rg -n 'shutdown is success-only' skills/superteam/SKILL.md`
  Expected: zero matches in SKILL.md (target is finisher.md).
  Run: `rg -F 'shutdown is success-only' skills/superteam/.claude/agents/finisher.md`
  Expected: one or more matches.

- [ ] **Step 3: Commit.** `git commit -m "feat: #73 collapse per-role contracts in SKILL.md"`

#### T5.2: Collapse `## Shutdown` to one-line orchestration invariant

- [ ] **Step 1: Replace `## Shutdown` (lines ~533–568)** with:

  ```markdown
  ## Shutdown

  Finisher owns shutdown; no run is complete until the shutdown contract returns success on the latest pushed head. The shutdown checklist lives in [.claude/agents/finisher.md](./.claude/agents/finisher.md). Team Lead enforces shutdown as an orchestration gate: a run that has not produced a Finisher success-only shutdown is not complete, regardless of in-session signals.
  ```

- [ ] **Step 2: Commit.** `git commit -m "feat: #73 collapse Shutdown section to orchestration invariant"`

#### T5.3: Prune rationalization-table + red-flags rows that became per-role procedure

Cross-reference the design's D4 disposition: keep cross-role/orchestration rows; rows whose rationale was per-role procedure move to the role's agent file rationalization sub-table.

- [ ] **Step 1: Move rows whose rationale is per-role procedure** (e.g. "The wakeup will know what to do from chat history" → finisher.md; "Brainstormer's default is Opus, but the operator typed `model: sonnet`" stays in SKILL.md because it's an orchestration rule about model overrides). Specifically:
  - To `finisher.md` rationalization sub-table: rows about wakeup payload, latest-head re-evaluation, comment-thread state.
  - To `executor.md` sub-table: rows about local-only completion, ATDD, push prohibition.
  - To `reviewer.md` sub-table: rows about writing-skills trigger scope, external vs local feedback ownership.
  - Keep in SKILL.md: rows about phase routing, gate 1, model-override grammar, ambiguous-prompt classification, branch auto-switch, restart vs resume.
- [ ] **Step 2: Same pruning for `## Red flags`.** Per-role red flags move to the role's agent file body; orchestration red flags stay.
- [ ] **Step 3: Verify size.**
  Run: `wc -l skills/superteam/SKILL.md`
  Expected: per-role procedural prose fully removed (AC-73-5). The original AC-73-8 ≤ 280 target was revised by Amendment 2026-05-05a; the residual orchestration content drops below the revised ≤ 420 ceiling via WS5.5, not WS5. If WS5 leaves SKILL.md materially over ~580 lines, re-run pruning targeting any remaining per-role rows; otherwise proceed to WS5.5.

- [ ] **Step 4: Commit.** `git commit -m "feat: #73 prune per-role rows from SKILL.md rationalization + red-flags"`

#### T5.4: Verify no orphan procedural strings remain in SKILL.md (AC-73-5)

- [ ] **Step 1: Run greps for moved strings.**
  Commands (each MUST return zero matches in SKILL.md and ≥1 in the target agent file):

  ```bash
  for s in "shutdown is success-only" "writing-skills before publish" "Loopback:" \
           "subagent-driven invokes" "treat as not-yet-approved on subsequent invocations" \
           "must invoke superpowers:writing-skills when reviewing"; do
    echo "=== $s ==="
    rg -F "$s" skills/superteam/SKILL.md && echo "FAIL: SKILL.md still has it" || echo "ok: not in SKILL.md"
  done
  ```

- [ ] **Step 2: Commit if any further trims.** (Probably no commit if T5.1–T5.3 were thorough.)

#### T5.5: Delete superseded files

- [ ] **Step 1: Delete files.**

  ```bash
  git rm skills/superteam/agent-spawn-template.md
  git rm skills/superteam/loopback-trailers.md
  git rm skills/superteam/pr-body-template.md
  ```

- [ ] **Step 2: Verify no inbound references remain.**

  ```bash
  rg -n -F 'agent-spawn-template' skills/superteam/ docs/ AGENTS.md CLAUDE.md README.md 2>/dev/null
  rg -n -F 'loopback-trailers' skills/superteam/ docs/ AGENTS.md CLAUDE.md README.md 2>/dev/null
  rg -n -F 'pr-body-template' skills/superteam/ docs/ AGENTS.md CLAUDE.md README.md 2>/dev/null
  ```

  Expected: zero matches in all live (non-deleted, non-baseline-doc) files. If any reference exists in a doc that should be kept, redirect it to the agent file or to `superpowers:finishing-a-development-branch`.

- [ ] **Step 3: Commit.** `git commit -m "feat: #73 delete superseded superteam supporting files"`

---

### WS5.5 — Split load-bearing literals into `project-deltas.md` (Amendment 2026-05-05a)

After WS5 completes, `wc -l skills/superteam/SKILL.md` is ~580 — all orchestration. WS5.5 extracts the load-bearing literals (pseudocode, denylist tokens, halt/audit format strings) to a referenced supporting file per design D5's "SKILL.md or a referenced supporting file" allowance. SKILL.md must continue to NAME each rule as a one-line invariant; only the literal bodies move.

**Files (whole workstream):**

- Create: `skills/superteam/project-deltas.md`
- Edit: `skills/superteam/SKILL.md` (sections `## Project deltas (Team Lead lookup)`, `## Supporting files`)

#### T5.6: Author `skills/superteam/project-deltas.md`

- [ ] **Step 1: Create the file** with H1 `# Project deltas (Team Lead supporting reference)` and a one-paragraph header noting this file is referenced from `SKILL.md` `## Project deltas (Team Lead lookup)` and carries the literal bodies that section names. State explicitly: SKILL.md remains the orchestration spec; this file is normative for the literal token list, halt strings, audit-log format strings, and the `resolve_role_config` pseudocode body.

- [ ] **Step 2: Move content out of SKILL.md** into `project-deltas.md` under these sections (copying verbatim, then deleting from SKILL.md in T5.7):

  - `## resolve_role_config algorithm` — the full pseudocode block currently in SKILL.md (sourced verbatim from design D5).
  - `## Forbidden-append denylist (LC5)` — the closed token list verbatim:
    `["AC IDs are advisory", "AC-<issue>- is advisory", "may push", "may open PR", "may merge", "skip writing-skills", "redefine done-report", "override halt"]`
  - `## Halt strings (Team Lead emits these verbatim)` — the five-string halt table from T4.1 step 1.
  - `## Audit-log strings (Team Lead emits these verbatim)` — the six-string audit table from T4.1 step 1.
  - `## Active-host probe order` — the deterministic probe order from T4.1 step 2 (env-var families → runtime self-id; first match wins).

- [ ] **Step 3: Verify the file.**
  Run: `pnpm exec markdownlint-cli2 skills/superteam/project-deltas.md`
  Expected: pass.
  Run: `rg -F 'AC IDs are advisory' skills/superteam/project-deltas.md`
  Expected: ≥1 match.
  Run: `rg -F 'superteam halted at Team Lead: project delta for' skills/superteam/project-deltas.md`
  Expected: ≥1 match.
  Run: `rg -F 'superteam delta applied:' skills/superteam/project-deltas.md`
  Expected: ≥1 match.

- [ ] **Step 4: Commit.** `git commit -m "feat: #73 add project-deltas supporting file with delta literals"`

#### T5.7: Trim `SKILL.md` `## Project deltas (Team Lead lookup)` to one-line invariants + add reference

- [ ] **Step 1: Edit `## Project deltas (Team Lead lookup)`** in SKILL.md. Replace the literal bodies (pseudocode block, denylist token list, halt-strings table, audit-log strings table, host-probe-order block) with one-line invariants:

  - Schema: `<repo-root>/docs/superpowers/<role>.md`, frontmatter `agent: <role>`, optional sections `## Model`, `## Tools`, `## System prompt append`. (Keep this in SKILL.md — it is the surface contract operators see.)
  - Closed model enum `{ opus, sonnet, haiku, inherit }` (D2 / N3). (Keep — model layer is operator-facing.)
  - Precedence: shipped → delta → operator-prompt (model layer only per N2). (Keep.)
  - Append-only system-prompt rule (LC2). (Keep — one line.)
  - **Replace the denylist token list** with a one-line invariant: "Team Lead lints every system-prompt-append against a closed denylist of forbidden-intent tokens; matches halt dispatch. The literal token list lives in [`project-deltas.md` `## Forbidden-append denylist (LC5)`](./project-deltas.md#forbidden-append-denylist-lc5)."
  - **Replace the pseudocode block** with: "Team Lead executes the `resolve_role_config` algorithm at delegation time to merge shipped + delta + operator-prompt config, lint LC5, compute the non-negotiable-rules SHA-256 prefix (LC4), and emit the audit line. The algorithm body lives in [`project-deltas.md` `## resolve_role_config algorithm`](./project-deltas.md#resolve_role_config-algorithm)."
  - **Replace the halt-strings table** with: "On any of the documented failure modes (invalid model value, agent-disagreement, missing frontmatter, denylist match, unsupported host) Team Lead emits a verbatim halt string; the literal strings live in [`project-deltas.md` `## Halt strings`](./project-deltas.md#halt-strings-team-lead-emits-these-verbatim)."
  - **Replace the audit-log-strings table** with: "Team Lead emits one of the documented audit lines for every delegation (chat-first, stderr fallback per N9). The literal format strings live in [`project-deltas.md` `## Audit-log strings`](./project-deltas.md#audit-log-strings-team-lead-emits-these-verbatim). Every applied-line carries `non-negotiable-rules-sha=<8-char-prefix>` (LC4)."
  - **Replace the host-probe-order block** with: "Pre-flight probes the active host deterministically (env-var families first, runtime self-id last; first match wins). The literal probe order lives in [`project-deltas.md` `## Active-host probe order`](./project-deltas.md#active-host-probe-order)."

- [ ] **Step 2: Update `## Supporting files`** in SKILL.md to add an entry for `project-deltas.md`:
  - Add: `[project-deltas.md](./project-deltas.md): Team Lead supporting reference — literal denylist tokens, halt/audit-log format strings, active-host probe order, and the \`resolve_role_config\` algorithm body. SKILL.md names every rule; this file carries the literal bodies.`
  - Keep the existing entries added in T4.6 (`.claude/agents/`, `agents/`, `pre-flight.md`, `routing-table.md`, `workflow-diagrams.md`).

- [ ] **Step 3: Verify the SKILL.md trims preserve all rule names.** Each invariant above must still appear once in SKILL.md as a named one-liner.
  Run: `rg -n 'denylist' skills/superteam/SKILL.md` — expect ≥1 match (the invariant line).
  Run: `rg -n 'resolve_role_config' skills/superteam/SKILL.md` — expect ≥1 match (the invariant line).
  Run: `rg -n 'non-negotiable-rules-sha' skills/superteam/SKILL.md` — expect ≥1 match (LC4 invariant line).
  Run: `rg -n 'active host' skills/superteam/SKILL.md` — expect ≥1 match (probe invariant line).

- [ ] **Step 4: Verify no duplication.** Each literal token list / format string lives in ONE file only.
  Run: `rg -F 'AC IDs are advisory' skills/superteam/SKILL.md` — expect zero matches (lives only in `project-deltas.md`).
  Run: `rg -F '"may push"' skills/superteam/SKILL.md` — expect zero matches.
  Run: `rg -nU 'def resolve_role_config' skills/superteam/SKILL.md` — expect zero matches (pseudocode lives only in `project-deltas.md`).

- [ ] **Step 5: Verify AC-73-5 still holds (no per-role procedural prose reintroduced).**
  Run: `rg -F 'shutdown is success-only' skills/superteam/SKILL.md` — expect zero.
  Run: `rg -F 'must invoke superpowers:writing-skills when reviewing' skills/superteam/SKILL.md` — expect zero.

- [ ] **Step 6: Verify size budget.**
  Run: `wc -l skills/superteam/SKILL.md`
  Expected: ≤ 420 (revised AC-73-8). If over, repeat extraction on the next-fattest literal block (model-selection grammar examples are the next candidate; capture as a follow-up T5.8 if needed).

- [ ] **Step 7: Lint.**
  Run: `pnpm exec markdownlint-cli2 skills/superteam/SKILL.md skills/superteam/project-deltas.md`
  Expected: pass.

- [ ] **Step 8: Commit.** `git commit -m "feat: #73 split delta literals out of SKILL.md to project-deltas.md"`

---

### WS6 — Project override surface documentation

#### T6.1: Add `## Project overrides (docs/superpowers/<role>.md)` section to SKILL.md

- [ ] **Step 1: Insert section** after `## Project deltas (Team Lead lookup)` (T4.1).
  Content:

  - Path convention: `<repo-root>/docs/superpowers/<role>.md` where `<role>` is the kebab-case agent filename.
  - Schema (Markdown body with up to four optional sections), example block.
  - Empty file = no-op anchor (logged `superteam delta empty`).
  - Frontmatter-only = no-op (logged `superteam delta empty`).
  - Body-without-frontmatter = halt.
  - Disagreement (frontmatter `agent:` ≠ filename) = halt.
  - Append-only system prompt; no `replace`.
  - Closed model enum; closed denylist of forbidden append tokens.
  - Operator-prompt R26 override is model-only (N2).
- [ ] **Step 2: Commit.** `git commit -m "feat: #73 document docs/superpowers project override surface"`

---

### WS7 — AC verification matrix + skill-improver gate evidence + smoke runs

Each AC has a concrete verification command or grep recipe. WS7 produces evidence captured in the PR body for Reviewer / Finisher.

#### AC verification matrix

| AC | Verification command(s) | Pass criterion |
|---|---|---|
| **AC-73-1** | `rg -n '## (Pre-flight\|Execution-mode injection\|Model selection\|Canonical rule discovery\|Artifact handoff authority\|Operator-facing output\|Gate 1\|Routing table\|Teammate contracts\|Missing skill warnings\|Done-report contracts\|Review and feedback routing\|External feedback ownership\|Rationalization table\|Red flags\|Shutdown\|Failure handling\|Success criteria\|Project deltas\|Project overrides)' skills/superteam/SKILL.md` AND `rg -F 'Reviewer must invoke superpowers:writing-skills when' skills/superteam/SKILL.md` | First grep returns only the kept-set sections; second grep returns zero matches. |
| **AC-73-2** | `ls skills/superteam/.claude/agents/` AND `for f in skills/superteam/.claude/agents/*.md; do rg -U '^## Required skill\n.*superpowers:' "$f"; done` AND `for f in skills/superteam/.claude/agents/*.md; do rg -F 'SKILL.md#done-report-contracts' "$f"; done` AND for each role file, run Codex schema validator and report honored fields | Six files (`team-lead.md`, `brainstormer.md`, `planner.md`, `executor.md`, `reviewer.md`, `finisher.md`); every file matches required-skill grep once; every file references the done-report anchor; Codex validator output captured in PR body. |
| **AC-73-3** | Smoke run on a fresh consuming project with NO `docs/superpowers/<role>.md` files; capture audit-log lines | Each delegation uses the model + tools from D1; no `superteam delta applied` lines emitted; only `superteam active host:` and `superteam delta empty` (if any orphan scan needed) appear. |
| **AC-73-4** | Smoke run with `<repo>/docs/superpowers/brainstormer.md` containing `## Model: sonnet` + system-prompt-append; then with invalid model value; then with orphan file | Run 1: `superteam delta applied: brainstormer (model, system-prompt-append); non-negotiable-rules-sha=<prefix>` audit line; dispatch with `model=sonnet`. Run 2: halts with exact `superteam halted at Team Lead: project delta for brainstormer has invalid model value <value>` blocker. Run 3: emits one `superteam delta orphan` warning, run continues. |
| **AC-73-5** | `git log --diff-filter=D --name-only -- skills/superteam/agent-spawn-template.md skills/superteam/loopback-trailers.md skills/superteam/pr-body-template.md` AND grep recipes from T5.4 | Three files deleted in branch history; greps return zero matches in `SKILL.md`; matching content present in agent files / superpowers skills only. |
| **AC-73-6** | Real `/superteam` invocation against a small reference issue (created during executor work) → published PR | Each delegation prompt is short and points at the underlying superpowers skill rather than embedding per-stage procedure. Gate 1 still gates planning behind explicit approval; adversarial-review evidence appears; writing-skills trigger fires for skill changes. |
| **AC-73-7** | For each Claude agent file, run heading-presence + heading-order greps; verify `non-negotiable-rules-sha=` field present in audit log during AC-73-4 fixture run | All four headings present once each; line-number sort matches `Required skill` → `Non-negotiable rules` → `Done-report contract reference` → `Operator-facing output`; audit log carries the SHA prefix. |
| **AC-73-8** (revised by Amendment 2026-05-05a) | `wc -l skills/superteam/SKILL.md` AND `for f in skills/superteam/.claude/agents/*.md; do awk '/^---$/{c++; next} c==2' "$f" \| wc -l; done` AND `rg -F 'AC IDs are advisory' skills/superteam/SKILL.md skills/superteam/project-deltas.md` AND `rg -nU 'def resolve_role_config' skills/superteam/SKILL.md skills/superteam/project-deltas.md` | SKILL.md ≤ 420 (revised from 280; orchestration-only intent preserved by SKILL.md naming every rule as a one-liner per WS5.5); each agent body ≤ 80; denylist tokens appear in `project-deltas.md` ONLY (zero matches in SKILL.md); `resolve_role_config` pseudocode body appears in `project-deltas.md` ONLY. |

#### T7.1: AC-73-1 verification

- [ ] **Step 1: Run the AC-73-1 grep recipes** above. Capture output to `docs/superpowers/baselines/2026-05-05-73-ac-evidence.md` under `## AC-73-1`.
- [ ] **Step 2: Commit evidence.** `git commit -m "docs: #73 capture AC-73-1 verification evidence"`

#### T7.2: AC-73-2 verification (incl. N12 Codex validator)

- [ ] **Step 1: Run greps + Codex schema validator.** If the validator binary isn't present in this repo's toolchain, capture that gap explicitly: "Codex schema validator not available in this repo; per-role files validated by manual schema match against `agents/openai.yaml` precedent. Honored fields: `model`, system-prompt body. Non-honored fields scoped to plugin-level prompt parity per N12."
- [ ] **Step 2: Append to evidence file. Commit.**

#### T7.3: AC-73-3 + AC-73-4 smoke (delta application)

- [ ] **Step 1: Author fixture deltas in a scratch directory** under `docs/superpowers/baselines/2026-05-05-73-fixtures/` (NOT in `docs/superpowers/` itself, so they don't affect this repo's own runs). Each fixture is a copy of the kind of file a consuming project would have.
- [ ] **Step 2: Document the procedure** the operator runs to verify (since this repo is the skill repo, not a consuming project): in a fresh consuming-project scratch worktree, copy the fixture, run `/superteam` against a stub issue, and capture audit-log output.
- [ ] **Step 3: Append captured runs to evidence file. Commit.**
  Note: if Executor cannot run a real consuming-project smoke from inside this skill repo, document the limitation explicitly and confirm the AC verification path with the operator. The evidence MUST then be captured during PR review by Reviewer or Finisher.

#### T7.4: AC-73-5 verification (no orphan procedural strings)

- [ ] **Step 1: Run T5.4 greps + `git log --diff-filter=D` for the deleted files.** Append to evidence file. Commit.

#### T7.5: AC-73-6 (end-to-end) — defer to Finisher

- [ ] **Step 1: Mark this AC as "verifiable post-merge or via Reviewer-driven smoke."**
  Plan note: AC-73-6 needs a real GitHub issue to run end-to-end. Either Reviewer dispatches it during review against a tiny reference issue, or the operator confirms post-merge. Capture decision in PR body.

#### T7.6: AC-73-7 verification (heading presence + order)

- [ ] **Step 1: Run for each agent file:**

  ```bash
  for f in skills/superteam/.claude/agents/*.md; do
    echo "=== $f ==="
    rg -nU '^## Required skill\n.*superpowers:' "$f"
    rg -n '^## Non-negotiable rules \(cannot be overridden by project delta\)$' "$f"
    rg -n '^## Done-report contract reference$' "$f"
    rg -n '^## Operator-facing output \(per Team Lead invariant\)$' "$f"
  done
  ```

  Verify line-number order is monotonic across the four headings per file.

- [ ] **Step 2: Append to evidence file. Commit.**

#### T7.7: AC-73-8 size verification

- [ ] **Step 1: Run `wc -l` on SKILL.md and per-agent bodies, plus the no-duplication greps from the revised AC-73-8 row.** If SKILL.md > 420 (revised target per Amendment 2026-05-05a), route back through T5.7 step 6 to extract additional literal blocks into `project-deltas.md`. If any agent body > 80, trim it (likely candidates: finisher.md given the shutdown content; consider moving the shutdown checklist to a `finisher-shutdown-checklist.md` adjunct under `.claude/agents/` if needed — but PREFER inline trim first to keep the agent file self-contained). Verify denylist tokens and `resolve_role_config` pseudocode body appear in `project-deltas.md` only.
- [ ] **Step 2: Append to evidence file. Commit.**

#### T7.8: Skill-improver quality gate evidence (Reviewer obligation per superteam Reviewer contract)

The Reviewer's non-negotiable rule (T2.5) requires running the skill-improver quality gate on `skills/superteam/**` changes and capturing evidence in the PR body. Plan does NOT execute this gate during executor work; it sets up the evidence slot the Reviewer fills.

- [ ] **Step 1: In PR body template skeleton (added to PR body during Finisher publish), include a "Skill-improver quality gate" section** with placeholders Reviewer must fill:
  - Mode used (primary if `skill-improver` + `plugin-dev` plugins available; fallback otherwise).
  - Iterations until convergence.
  - Final review report.
  - Whether any skill files were further modified by the gate (and whether those modifications were committed).
- [ ] **Step 2: Reviewer captures evidence per superteam Reviewer contract before approving the PR.** No commit from Executor for this; this is a Reviewer pre-condition.

---

## RED-phase baseline tasks (LC1–LC5)

These are T1.1–T1.5 above, called out separately here for the executor's checklist. Each baseline MUST land before the corresponding GREEN rule:

| LC | RED task | GREEN task(s) |
|---|---|---|
| LC1 | T1.1 (commits drift example) | T2.2–T2.6 (agent files reference SKILL.md anchor; AC-73-2 grep) |
| LC2 + LC4 | T1.2, T1.4 | T2.1–T2.6 (non-negotiable rules block FIRST in body; Team Lead emits SHA prefix per T4.1) |
| LC3 | T1.3 | T4.1 (audit-log emission rules + chat-first / stderr-fallback per N9) |
| LC5 | T1.5 | T4.1 (closed denylist lint encoded in `resolve_role_config` + halt strings) |

If any GREEN task lands before its RED baseline is committed, that is a process violation; halt and re-order.

---

## Risks & sequencing notes

1. **Workflow runnability across the cut.** WS2 + WS3 ship the agent files BEFORE WS5 deletes the spawn template. Between those workstreams, both surfaces exist briefly — Team Lead can dispatch from either. WS5 is the breaking cut; do not land it before WS2 + WS4 are merged into the branch.
2. **Audit-log destination on headless CI runs (N9).** Stderr fallback re-emits at the next chat-bearing message. If a `/superteam` run is fully headless (no chat ever follows), the audit line lives only on stderr; that's documented behavior, not a bug.
3. **Codex schema validator availability (N12).** If the validator is absent from this repo's toolchain, AC-73-2 falls back to "manual schema match against the existing `agents/openai.yaml` precedent." Capture this in the evidence file rather than failing the AC silently.
4. **Markdownlint on agent files.** `.claude/agents/<role>.md` files MUST pass `markdownlint-cli2` per `.husky/pre-commit`. The `# <role-name>` H1 + four `##` headings are linter-clean. No fenced-code-block traps.
5. **AC-73-6 end-to-end run.** Cannot be performed inside this skill repo without a real downstream issue. Plan defers it to Reviewer/Finisher or post-merge operator confirmation; evidence is documented either way.
6. **Auto-switch interaction (existing R-rule about default-branch auto-switch).** This refactor does NOT touch the default-branch auto-switch behavior; pre-flight stays self-contained per design Out-of-scope. T4.3 only ADDS the host probe + orphan scan, it does not modify the auto-switch path.
7. **Husky commit-msg lint.** All commits in this plan use `<type>: #73 <subject>` per AGENTS.md commitlint rules. `feat:` for product-impacting changes (agent files, SKILL.md restructure, deleted files); `docs:` for plan/baseline/evidence files. None use `chore:` since the work changes shipped behavior.
8. **PR title.** Squash-merge convention dictates the PR title equals the squash commit subject. Suggested: `feat: #73 pivot superteam to pure orchestration`.

---

## Out of scope

Explicitly NOT done by this plan (mirrors design's `## Out of scope`):

- Changes to any `superpowers:*` skill itself.
- Removing the teammate roster.
- Auto-migration tooling for projects already referencing `skills/superteam`.
- Adding new hosts beyond `claude-code` and `codex`.
- Dynamic per-task complexity scoring for model selection.
- Replacing or extending the consuming project's PR template; the superteam PR-body fallback simply goes away.
- Editing existing `pre-flight.md` / `routing-table.md` / `workflow-diagrams.md` content beyond the small additions in T4.3 (host probe + orphan scan added to `## Pre-flight` summary in SKILL.md only, not to `pre-flight.md` body — those files stay as-is per D4).

---

## Self-review

- **Spec coverage:** Every AC (AC-73-1..AC-73-8) has explicit verification tasks (T7.1–T7.8). Every LC (LC1–LC5) has a RED-phase task (T1.1–T1.5) sequenced before the corresponding GREEN. Every D4 disposition row maps to a task: kept files (`pre-flight.md`, `routing-table.md`, `workflow-diagrams.md`) untouched; moved per-role contracts → T2.1–T2.6 + T5.1; deleted files → T5.5; SKILL.md per-role default model table → T4.2; shutdown checklist → T2.6 + T5.2; audit-log + denylist → T4.1; rationalization + red flags → T4.4 + T4.5.
- **Placeholder scan:** No "TBD" / "later" / "fill in details" / "similar to T2.2." Every per-role agent task spells out frontmatter + non-negotiable rules + body source explicitly, with verification commands.
- **Type consistency:** Halt strings are quoted verbatim from the design and used identically across T4.1, T7.3, and the AC-73-4 verification command. Audit-log strings (`superteam delta applied:`, `superteam delta empty:`, `superteam delta orphan:`, `superteam delta inherit-redundant:`, `superteam delta tool unavailable:`, `superteam active host:`) are spelled the same way every time. Anchor reference `SKILL.md#done-report-contracts` used identically in T2.x and T7.2.
