# Plan: Superteam: optimize for repeated /superteam invocations and make workflow state more durable [#39](https://github.com/patinaproject/superteam/issues/39)

> **For agentic workers:** REQUIRED SUB-SKILL: Use the execution mode injected by `Team Lead` to implement this plan task-by-task. Default paths use `superpowers:subagent-driven-development`; `superpowers:executing-plans` is valid only for an explicit operator `inline` override. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/superteam` resume rather than restart on repeated invocations, by adding a deterministic phase-detection pre-flight, an explicit routing table, a loopback-trailer convention recoverable from `git log`, deterministic execution-mode capability detection with bypass of `superpowers:executing-plans` on default paths, anti-rationalization scaffolding for every new discipline rule, a Brainstormer writing-skills meta-fix, and the bundled author-manifest housekeeping.

**Architecture:** All workflow surface changes land in `skills/superteam/SKILL.md` (concise body) plus three new supporting reference files in `skills/superteam/` (`pre-flight.md`, `routing-table.md`, `loopback-trailers.md`) per R23. `agent-spawn-template.md` mirrors the `Brainstormer` writing-skills recommendation per R25. Three repository manifests get an `author` object update per R18. No new persistence layer; phase is derived from committed artifacts, branch state, PR state, prompt content, and conventional-commit trailers (R16).

**Tech Stack:** Markdown skill files, JSON manifests, `git log` trailer parsing (no new tooling), Mermaid (existing), `markdownlint-cli2`, conventional-commits + commitlint (existing).

---

## Required reading (Executor MUST do this once before starting Batch 1)

- [ ] **Read AGENTS.md** at repo root to confirm: canonical commit format (`type: #123 short description`, no scope), canonical plan/spec naming, AC ID format, PR-template rules, and label conventions.
- [ ] **Read CLAUDE.md** at repo root.
- [ ] **Read the design doc end-to-end:** `docs/superpowers/specs/2026-04-26-39-superteam-optimize-for-repeated-superteam-invocations-and-make-workflow-state-more-durable-design.md` — pay particular attention to R5, R6, R7, R8, R14, R15, R16, R17, R19, R20, R22, R23, R24, R25 and PT-1..PT-13.
- [ ] **Read `skills/superteam/SKILL.md`** end-to-end. This is the file you will be editing in Batches 1–6.
- [ ] **Read `skills/superteam/agent-spawn-template.md`** end-to-end. This is edited in Batches 4 and 6.
- [ ] **Invoke `superpowers:test-driven-development`** as required background before any RED-phase baseline (R13).
- [ ] **Invoke `superpowers:writing-skills`** before authoring any edit to `skills/**/*.md`. This is mandatory per R13/R20/R22/R23 and per R25 even applies retroactively to this plan: every batch that touches a skill file MUST be entered with writing-skills already loaded.

The handoff SHA for the unchanged-skill RED baseline is the design-doc handoff SHA: `b5e5955`. All RED-phase pressure-test transcripts MUST be captured against `skills/superteam/SKILL.md` and `skills/superteam/agent-spawn-template.md` as they exist at that SHA.

---

## RED-phase baseline conventions (applies to every batch)

Per R20, before editing any skill surface in a batch, you MUST capture baseline evidence against the unchanged skill at SHA `b5e5955` showing that the rule the new content enforces is not yet present / is not yet honored. The Iron Law applies: prove the gap exists before fixing it.

R20 in the design does not prescribe the **form** of that evidence. The plan offers two valid evidence paths. Use Path A when available; fall back to Path B otherwise. Both paths satisfy R20.

**Where the baseline lives (both paths).** Per the spec for this plan (R20 final form), do NOT introduce a new `docs/superpowers/baselines/` directory. Instead capture each batch's baseline evidence inline in:

1. The batch's commit message body (under a `RED baseline:` heading), AND
2. The Executor done-report for that batch (so Reviewer can read it without git archaeology).

### Path A (preferred): live subagent transcript

Use this path when the Executor session exposes a subagent-dispatch tool surface (`Agent`, `Task`, or equivalent). This is the stronger evidence form because it captures actual agent behavior under pressure.

For each PT in the batch:

1. Spawn a fresh subagent with the `superteam` skill loaded as it exists at SHA `b5e5955`.
2. Pass the PT's verbatim operator prompt.
3. Capture the response into the transcript.
4. Do NOT correct the agent mid-run. The point is to observe the baseline rationalization.

The transcript MUST include:

- PT ID (e.g. `PT-1`)
- Pressure tags (e.g. `authority claim + time pressure`)
- The verbatim operator prompt as run
- The verbatim agent response (or a faithful precis if it exceeds ~80 lines, with the load-bearing rationalization quoted exactly)
- A one-line classification: `BASELINE-FAIL` (rule violated) or `BASELINE-PASS` (rule already held without the skill change)

If the baseline already passes, that PT does not require new skill text in this batch — but you MUST still record the baseline transcript so Reviewer can confirm the test was actually run.

### Path B (fallback): inspection-based absence evidence

Use this path when subagent dispatch is not available in the Executor session (a subagent cannot itself dispatch subagents in some runtimes). Path B substitutes structural evidence (the skill literally lacks the content the rule requires) plus reasoned compliance analysis (what the current SKILL.md would cause an agent to do in the PT's scenario, and why that is wrong) for the live behavioral transcript.

Path B is NOT a license to skip baseline thinking. It requires explicit "what would the current SKILL.md cause an agent to do here, and why is that wrong?" reasoning per PT, with concrete line-range citations into the unchanged skill at SHA `b5e5955`.

For each PT in the batch, capture:

- PT ID (e.g. `PT-1`)
- Pressure tags (e.g. `authority claim + time pressure`)
- The verbatim operator prompt the PT would have used
- **Absence proof.** A `git grep` / `rg` invocation against `skills/superteam/` at SHA `b5e5955` showing that the relevant guidance text / rule / contract clause does not yet exist. Quote the command and its (empty or non-matching) output. Example:

  ```bash
  git grep -n 'Loopback: spec-level' b5e5955 -- skills/superteam/
  # (no output)
  ```

- **Reasoned baseline analysis.** One paragraph per PT identifying:
  - The specific section(s) of the unchanged SKILL.md that the agent would consult in this scenario, with line-range citations (e.g. `SKILL.md:120-145`).
  - What that existing guidance would cause the agent to do (the predicted rationalization or routing choice).
  - The specific gap that the new content fills (i.e. why the existing guidance is insufficient for this PT).
- A one-line classification: `BASELINE-FAIL-INFERRED` (existing guidance is insufficient and the agent would predictably violate the rule) or `BASELINE-PASS-INFERRED` (existing guidance already covers this case and no new skill text is required for this PT).

### Path selection and consistency

The Executor MUST record at the top of each batch's `RED baseline:` section which path was used, e.g. `Evidence path: A (live subagent transcripts)` or `Evidence path: B (inspection-based absence evidence)`. Mixing paths within a single batch is allowed only when explicitly justified per PT.

**GREEN-phase consistency.** The GREEN-phase verification MUST use the same evidence path as the RED-phase baseline:

- If RED used **Path A**, GREEN re-runs the same PT against the edited skill via live subagent dispatch and shows the agent now complies (`GREEN-PASS`).
- If RED used **Path B**, GREEN captures the same shape of evidence inverted: a `git grep` / `rg` invocation against the edited skill showing the new content is now present, plus a one-paragraph reasoned analysis confirming the new content addresses the gap identified in the RED analysis (`GREEN-PASS-INFERRED`). Live re-runs are not required when Path B was used in RED, because the prerequisite tooling is unavailable in this runtime.

Both paths preserve R20: the gap is proven before it is fixed, and the fix is shown to address the gap.

---

## Batch 1: Pre-flight (phase detection + execution-mode capability detection scaffolding)

**Covers:** R1, R2, R8, R9, R17 (capability-detection rule body lives here; the delegation-injection lives in Batch 4). Acceptance criteria advanced: AC-39-1, AC-39-4, AC-39-5, AC-39-10 (capability-detection portion).

**Pressure tests (RED baselines required before any edit):** PT-1, PT-2 (phase-detection portions), PT-6 (halt on contradiction), PT-11 (no execution mode available halt).

**Files:**

- Create: `skills/superteam/pre-flight.md`
- Modify: `skills/superteam/SKILL.md` — extend the existing `## Pre-flight` section with phase-detection summary + reference to `pre-flight.md`; extend `Team Lead` contract; extend `Failure handling` cross-reference; add anti-rationalization scaffolding rows per R22.

### Steps

- [ ] **Step 1: RED — capture baselines against SHA `b5e5955`.**

For each of PT-1, PT-2 (phase-detection focus only — sunk-cost loopback enforcement is exercised again in Batch 3), PT-6, PT-11, capture baseline evidence per "RED-phase baseline conventions" above (Path A preferred; Path B if subagent dispatch is unavailable). Use the verbatim operator prompts from the design's Pressure Tests section. Record the chosen evidence path at the top of the `RED baseline:` section.

Expected baselines (these are predictions for Path A — Path B captures the inferred equivalent via existing-section citation; record actual):

- PT-1 baseline: agent likely treats "team lead said this is approved already, just ship it" as approval and routes to Planner. Document the verbatim rationalization.
- PT-2 baseline: agent likely patches inline without spec-level loopback under sunk-cost framing.
- PT-6 baseline: agent likely "picks the most likely interpretation" rather than halting.
- PT-11 baseline: agent likely silently falls back to inline or proceeds without an execution-mode decision.

- [ ] **Step 2: GREEN — author `skills/superteam/pre-flight.md`.**

Write the full pre-flight algorithm. The file MUST contain:

1. **Section: Trigger.** "Run this pre-flight at the top of every `/superteam` invocation, before any teammate delegation."
2. **Section: Detection sequence.** A numbered list mirroring the design's "Phase-detection pre-flight" section steps 1–7, including resolution of the active issue, inspection of committed artifacts (specs path + plans path), branch state, PR state, phase derivation rules, prompt classification reference, routing reference, and execution-mode resolution reference.
3. **Section: Phase derivation rules.** Verbatim from design (R2 + design Approach):
   - no design doc, no plan, no PR -> `brainstorm`
   - design doc present, no plan doc on branch, no PR -> `brainstorm` (Gate 1 still open per R15)
   - plan doc present on branch, no PR -> `execute`
   - PR open or merged -> `finish`, with `Finisher` substate derived from PR/CI/review state
   - artifacts and PR state cannot be reconciled -> halt per R8
4. **Section: Halt conditions (R8).** Enumerate the four halt cases verbatim from R8 (prompt/branch implies phase=plan but no design doc; phase=finish but no PR; multiple candidate issues; artifacts and PR state cannot be reconciled). For each, give the exact halt blocker string `superteam halted at Team Lead: <reason>`.
5. **Section: Active-issue resolution.** Order: explicit `#<n>` in prompt → branch name `<n>-<slug>` per github-flows convention → operator. If multiple candidates conflict, halt per R8.
6. **Section: Loopback-class recovery.** Reference `loopback-trailers.md` for the `git log` algorithm; record that the recovered class is part of the pre-flight output.
7. **Section: Execution-mode capability detection (R17).** The deterministic probe order verbatim from R17:
   1. Team mode — selected when host runtime exposes a documented multi-agent / background-agent capability surface (e.g. `BackgroundAgent`, `Team`, or equivalent dispatch tool, OR a plugin-declared team-mode capability flag in the active host's plugin manifest). When the signal is absent or ambiguous, treat team mode as unavailable and continue.
   2. Subagent-driven — selected when team mode is unavailable AND a subagent-dispatch tool surface is detectable (e.g. a `Task` / `Agent` tool surface, or the documented entry point for `superpowers:subagent-driven-development`).
   3. Unavailable — record `execution_mode=unavailable`; halt with `superteam halted at Pre-flight: no execution mode available` only if the selected route requires execute-phase delegation.
   Inline mode is NEVER auto-selected at any step; only an explicit operator override (R14) reaches inline.
8. **Section: Output of pre-flight.** A small enumerated record: `{active_issue, detected_phase, open_gate?, active_loopback_class?, execution_mode, operator_override?}`. State that this record is the input to the routing table in `routing-table.md`.

Constraint per R23: this file is the heavy reference. Do NOT inline this content into `SKILL.md`.

- [ ] **Step 3: GREEN — extend `skills/superteam/SKILL.md` `## Pre-flight` section.**

At the top of the existing `## Pre-flight` section, prepend a new subsection `### Phase-detection and execution-mode pre-flight` containing:

1. A concise summary: "At the top of every `/superteam` invocation, before any teammate delegation, `Team Lead` runs a deterministic detection sequence covering both phase detection and execution-mode capability detection. See `pre-flight.md` in this skill directory for the full algorithm."
2. A 6-bullet summary mirroring design steps 1–6 (resolve active issue → inspect committed artifacts → inspect PR state → derive phase → classify prompt → route).
3. The phase derivation rules (5 bullets verbatim).
4. A halt callback: "When observable state is ambiguous or contradictory per `pre-flight.md` halt conditions, halt with `superteam halted at Team Lead: <reason>` per `## Failure handling`."
5. A reference: "Execution-mode capability detection is part of this pre-flight. See `pre-flight.md` section 'Execution-mode capability detection' and Batch 4 below for delegation-time injection."

Constraint: do NOT use `@`-link syntax (R23). Reference by skill-name + relative file name only.

- [ ] **Step 4: GREEN — extend `Team Lead` contract.**

In the existing `### Team Lead` block under `## Teammate contracts`, add three new bullets at the top, before "Route work to the correct teammate":

```markdown
- Run the phase-detection and execution-mode pre-flight (see `pre-flight.md` in this skill directory) before any routing decision.
- Treat committed artifacts plus PR state as authoritative when classifying phase and prompt; do not infer phase from in-session memory.
- Halt with `superteam halted at Team Lead: <reason>` when observable state is ambiguous or contradictory; do not "pick the most likely interpretation".
```

- [ ] **Step 5: REFACTOR — anti-rationalization scaffolding (R22) for halt-on-contradiction (R8).**

Add to the existing `## Rationalization table`:

```markdown
| "Just pick the most likely interpretation and proceed." | Ambiguous or contradictory observable state halts the run with an explicit blocker per `## Failure handling`. Resume requires explicit operator clarification of the intended issue, branch, or phase. Not even when there is a deadline. Not even when an authority claim is cited. |
```

Add to the existing `## Red flags`:

```markdown
- `Team Lead` continuing past contradictory branch / artifact / PR state without halting.
- Resolving execution-mode capability without running the deterministic probe order in `pre-flight.md`.
```

- [ ] **Step 6: GREEN — verify all PTs in this batch.**

Verify PT-1 (phase-detection portion: detection produces `phase=brainstorm, Gate 1 open`), PT-2 (phase-detection portion: detection produces `phase=execute`), PT-6 (halt fires with the exact blocker string), PT-11 (execute-phase delegation with no execution mode halts with `superteam halted at Pre-flight: no execution mode available`) against the edited skill, using the same evidence path chosen in Step 1 per "RED-phase baseline conventions" above. Path A: re-run live and capture verbatim transcripts (`GREEN-PASS`). Path B: capture `git grep` / `rg` output showing the new content is present in the edited skill plus a one-paragraph reasoned analysis per PT confirming the new content addresses the gap (`GREEN-PASS-INFERRED`).

- [ ] **Step 7: Lint.**

Run: `pnpm lint:md`
Expected: no errors against `skills/superteam/SKILL.md` or `skills/superteam/pre-flight.md`.

- [ ] **Step 8: Commit Batch 1.**

```bash
git add skills/superteam/pre-flight.md skills/superteam/SKILL.md
git commit -m "$(cat <<'EOF'
feat: #39 add phase-detection and exec-mode pre-flight to superteam

Adds the pre-flight algorithm in skills/superteam/pre-flight.md and the
Team Lead contract extension that runs it before any routing decision.
Covers R1, R2, R8, R9, R17 and advances AC-39-1, AC-39-4, AC-39-5, and
the capability-detection portion of AC-39-10.

RED baseline: <inline transcripts for PT-1, PT-2, PT-6, PT-11 against
SHA b5e5955>
GREEN compliance: <inline transcripts for PT-1, PT-2, PT-6, PT-11
against this commit>
REFACTOR notes: added rationalization-table row and red-flag bullets
for halt-on-contradiction (R8) per R22.
EOF
)"
```

---

## Batch 2: Routing table

**Covers:** R5, R6, R7, R15. Acceptance criteria advanced: AC-39-2, AC-39-3, AC-39-8.

**Pressure tests (RED baselines required):** PT-1 (Gate-1 feedback classification), PT-2 (spec-level loopback classification), PT-3 (plan-level loopback classification, application), PT-4 (resume-not-restart under pressure), PT-7 (new-issue confirmation gate), PT-9 (Gate 1 durability via committed plan doc).

**Files:**

- Create: `skills/superteam/routing-table.md`
- Modify: `skills/superteam/SKILL.md` — add a new top-level section `## Routing table` summarizing the table and pointing at `routing-table.md`; add the prompt-classification heuristic; add resume-not-restart default; add Gate 1 durability rule (R15); add anti-rationalization scaffolding for R6, R7, R15.

### Steps

- [ ] **Step 1: RED — capture baselines.**

Capture baseline evidence for PT-1, PT-2, PT-3, PT-4, PT-7, PT-9 against SHA `b5e5955` per "RED-phase baseline conventions" above (Path A preferred; Path B if subagent dispatch is unavailable). Record the chosen evidence path. Note especially (Path A predictions; Path B records the inferred equivalent):

- PT-4 baseline: agent likely restarts at brainstorm under sunk-cost + time pressure framing.
- PT-7 baseline: agent likely silently switches issues when "no need to re-confirm" is asserted.
- PT-9 baseline: agent likely treats prior in-session approval as binding on a fresh invocation.

- [ ] **Step 2: GREEN — author `skills/superteam/routing-table.md`.**

Write the complete routing table as a Markdown table. Columns: `detected_phase`, `prompt_classification`, `route_to`, `action`, `notes`. Required rows (verbatim from R5):

```markdown
| detected_phase | prompt_classification | route_to | action | notes |
|---|---|---|---|---|
| brainstorm | Gate 1 open + prompt looks like feedback | Brainstormer | deliver-as-feedback (delta-only revision) | per R6; do not restart |
| brainstorm | Gate 1 open + prompt looks like approval (explicit token) | Planner | fire Gate 1 approval and route forward | Gate 1 is durably observable iff a plan doc has been committed on the branch (R15); ephemeral in-session "approve" without a committed plan doc is NOT durable |
| execute | requirement change | Brainstormer | spec-level loopback | terminating commit MUST carry `Loopback: spec-level` per R16 |
| execute | task adjustment that preserves requirements | Planner | plan-level loopback | terminating commit MUST carry `Loopback: plan-level` per R16 |
| execute | implementation question | Executor | resume implementation | inject pre-selected execution mode per R14 (Batch 4) |
| finish | Finisher state in {triage, monitoring, blocked} + status check | Finisher | resume; do not restart | run latest-head sweep |
| finish | requirement-bearing PR feedback | Brainstormer | spec-first per existing external-feedback rules | then Planner, then Executor |
| halted | anything | (none) | show halt reason; require explicit operator instruction before resuming | recovery is operator-driven |
| any | unambiguously a new top-of-workflow request for a different issue | (none) | require explicit operator confirmation before starting a new run | "no need to re-confirm" framing in the prompt is itself the disallowed shortcut per R7 |
```

Add subsections:

1. **Prompt-classification heuristic (R6).** The bulleted decision list verbatim from the design's "Prompt classification heuristic":
   - If a Gate is detected as open and the prompt does not contain an explicit approve/reject token (`approve`, `reject`, `lgtm`, `request changes`), treat as feedback for the gate's owning teammate.
   - If `phase=execute` and prompt mentions changing requirements, acceptance criteria, or "what we are building", classify as `spec-level` loopback.
   - If `phase=execute` and prompt mentions changing tasks, sequencing, or workstreams without changing requirements, classify as `plan-level` loopback.
   - If `phase=execute` and prompt is a question about implementation, classify as implementation work for `Executor`.
   - If `phase=finish` and prompt is a status / "is it done" / "check CI" prompt, route to `Finisher` with the latest-head sweep.
   - If the prompt names a different issue number explicitly, require operator confirmation before starting a new run.
   - Otherwise, treat the prompt as feedback for the active teammate.
   - **Bias:** when a phase is in flight and the prompt is ambiguous, classify as feedback. Ambiguous prompts MUST NOT silently start a new phase.

2. **Resume vs restart (R7).** Verbatim from the design's "Resume vs restart": the default is resume; restart requires (a) explicit operator instruction (`restart`, `start over`, `new run`), or (b) prompt clearly references a different issue number than the one detected, or (c) detected `phase=halted` and operator explicitly resumes with a new direction. State explicitly: cited third-party authority claims (e.g. "the lead said") and in-prompt waivers of confirmation (e.g. "no need to re-confirm") are NOT explicit operator instructions.

3. **Gate 1 durability (R15).** State the rule verbatim: "Gate 1 approval is durably observable iff a plan doc has been committed on the branch at the canonical plans path (`docs/superpowers/plans/YYYY-MM-DD-<issue>-<title>-plan.md`). Until that commit lands, further `/superteam` prompts during `phase=brainstorm` are intentionally treated as feedback to `Brainstormer` per R6. This is the intended fidelity contract, not a detection limitation. Ephemeral in-session approval that is not yet reified as a committed plan doc is treated as not-yet-approved on subsequent invocations, even when the operator self-attests to the prior approval."

- [ ] **Step 3: GREEN — extend `skills/superteam/SKILL.md` with a `## Routing table` section.**

Insert immediately after the existing `## Gate 1: Brainstormer approval` section. Contents:

1. One-paragraph summary: "Every `/superteam` invocation, after pre-flight, routes via an explicit `(detected_phase, prompt_classification)` table. See `routing-table.md` in this skill directory for the complete table, prompt-classification heuristic, resume-not-restart default, and Gate 1 durability rule."
2. A condensed 3-bullet summary of the headline behaviors:
   - Default for repeated `/superteam` invocations is **resume**, not restart (R7).
   - Ambiguous prompts during an open gate or in-flight phase are classified as **feedback for the active teammate**, never as silent phase advance (R6).
   - **Gate 1 is durably observable iff a plan doc has been committed on the branch.** Prior in-session "approve" without a committed plan doc is treated as not-yet-approved on subsequent invocations (R15).

- [ ] **Step 4: REFACTOR — anti-rationalization scaffolding (R22) for R6, R7, R15.**

Append to `## Rationalization table`:

```markdown
| "The prompt is short/ambiguous, but the operator clearly meant approval — just advance the gate." | Ambiguous prompts during an open gate are feedback to the active teammate per `routing-table.md`. Approval requires an explicit token (`approve`, `lgtm`, etc.). Not even when an authority claim is cited. Not even when the prior in-session approval feels binding. |
| "We've already done a lot of work on this — restarting would waste it, so let me just keep going from a fresh top-of-workflow." | The default for repeated `/superteam` invocations is **resume**. Restart requires an explicit operator token (`restart`, `start over`, `new run`) per R7. "Pivot, no need to re-confirm" in the prompt is itself the disallowed shortcut. |
| "Gate 1 was approved last session; the operator just told me so — no need to re-open it." | Gate 1 is durably observable iff a plan doc has been committed on the branch (R15). Ephemeral in-session approval is NOT durable. Operator memory is not the durable signal; the committed plan doc is. |
```

Append to `## Red flags`:

```markdown
- Classifying an ambiguous prompt during an open gate as approval rather than feedback.
- Restarting a run on a repeated `/superteam` invocation without an explicit operator restart token or an unambiguous new-issue signal.
- Treating a prior in-session "approve" as Gate 1 approval when no plan doc has been committed on the branch.
- Silently switching issues mid-run when the prompt names a different issue without explicit operator confirmation.
```

- [ ] **Step 5: GREEN — verify all PTs in this batch.**

Verify PT-1, PT-2, PT-3, PT-4, PT-7, PT-9 against the edited skill, using the same evidence path chosen in Step 1 per "RED-phase baseline conventions" above. Each MUST now show `GREEN-PASS` (Path A) or `GREEN-PASS-INFERRED` (Path B). Specifically:

- PT-1: classified as feedback per R6 despite authority + time pressure; no Gate 1 fire.
- PT-4: routed to `Finisher` for status check; no restart at brainstorm.
- PT-7: requires explicit operator confirmation; no silent issue switch.
- PT-9: classified as feedback per R6; Gate 1 reported as still open per R15.

- [ ] **Step 6: Lint.**

Run: `pnpm lint:md`
Expected: clean.

- [ ] **Step 7: Commit Batch 2.**

```bash
git add skills/superteam/routing-table.md skills/superteam/SKILL.md
git commit -m "$(cat <<'EOF'
feat: #39 add routing table and resume-default rule to superteam

Adds skills/superteam/routing-table.md covering the
(detected_phase, prompt_classification) routing table, the
prompt-classification heuristic with feedback bias, the
resume-not-restart default, and Gate 1 durability via committed plan
doc. SKILL.md gains a concise summary plus anti-rationalization
scaffolding for R6/R7/R15. Covers R5, R6, R7, R15 and advances
AC-39-2, AC-39-3, AC-39-8.

RED baseline: <inline PT-1, PT-2, PT-3, PT-4, PT-7, PT-9 transcripts
against SHA b5e5955>
GREEN compliance: <inline PT-1..PT-9 transcripts against this commit>
REFACTOR notes: rationalization-table rows and red-flag bullets added
for R6, R7, R15.
EOF
)"
```

---

## Batch 3: Loopback trailer convention

**Covers:** R16. Acceptance criteria advanced: AC-39-9.

**Pressure tests (RED baselines required):** PT-5 (loopback recovery from a fresh session, with combined exhaustion + authority pressure), PT-10 (loopback trailer recovery across resolution, application). PT-2 is partially re-exercised here for the trailer-emission portion (the spec-level loopback identified in Batch 2 must terminate with a `Loopback: spec-level` trailer on its commit).

**Files:**

- Create: `skills/superteam/loopback-trailers.md`
- Modify: `skills/superteam/SKILL.md` — add a new section `## Loopback trailers` summarizing the convention and the `git log` recovery algorithm; extend `## Review and loopback routing` to require the trailer on commits originating from a loopback; add anti-rationalization scaffolding for R16.

### Steps

- [ ] **Step 1: RED — capture baselines.**

Capture baseline evidence for PT-5 and PT-10 against SHA `b5e5955` per "RED-phase baseline conventions" above (Path A preferred; Path B if subagent dispatch is unavailable). Record the chosen evidence path. Expected baselines (Path A predictions; Path B records the inferred equivalent):

- PT-5 baseline: fresh session has no in-session memory of the loopback; agent likely treats `ok` as approval to ship under fatigue + cited PM authority, because no commit-trailer recovery exists.
- PT-10 baseline: agent has no rule for scanning `git log` for `Loopback:` trailers; recovery does not happen.

- [ ] **Step 2: GREEN — author `skills/superteam/loopback-trailers.md`.**

Required content:

1. **Section: Trailer grammar.** Verbatim from R16:
   - `Loopback: spec-level`
   - `Loopback: plan-level`
   - `Loopback: implementation-level`
   - `Loopback: resolved`
2. **Section: When to emit.** Mirror R16: when work originating from a loopback is committed, the commit message MUST include the matching `Loopback:` class trailer. When the loopback is resolved (work complete and the workflow returns to its prior phase), the terminating commit MUST include `Loopback: resolved`.
3. **Section: Worked examples.** Show three example commit messages, each in a fenced block:
   - A spec-level loopback intermediate commit (e.g. `docs: #39 update design after spec-level feedback\n\nLoopback: spec-level`).
   - A plan-level loopback intermediate commit (e.g. `docs: #39 split SKILL.md edits per plan-level loopback\n\nLoopback: plan-level`).
   - A resolution commit (e.g. `feat: #39 land routing-table.md after plan-level loopback\n\nLoopback: resolved`).
4. **Section: Recovery algorithm.** Pseudocode for `git log` scan:

   ```text
   1. git log --pretty=format:'%H%x09%(trailers:key=Loopback,valueonly)' <branch> from oldest to newest.
   2. Find the most recent commit whose Loopback trailer is `resolved`. Call its index R (0 if none).
   3. Among commits with index > R, find the most recent commit whose Loopback trailer is one of {spec-level, plan-level, implementation-level}. That is the active loopback class.
   4. If no such commit exists, no active loopback is in flight.
   5. If multiple unresolved Loopback: trailers are present, the most recent one wins.
   ```

   State that the algorithm is intentionally pure `git log` — no new tooling, no sidecar files, no parser beyond `git log`'s built-in trailer extraction.
5. **Section: Compatibility.** State that this convention extends `AGENTS.md`'s existing conventional-commits rule (no scope, required GitHub issue tag) with a defined trailer; it is NOT a new persistence file or sidecar artifact.

- [ ] **Step 3: GREEN — extend `skills/superteam/SKILL.md`.**

Insert a new section `## Loopback trailers` immediately after `## Review and loopback routing`. Contents:

1. One-paragraph summary: "Loopback class is recoverable from conventional-commit trailers on the current branch. Commits originating from a loopback MUST include `Loopback: spec-level | plan-level | implementation-level`. The terminating commit on loopback resolution MUST include `Loopback: resolved`. The pre-flight recovers the active loopback class via `git log` per `loopback-trailers.md` in this skill directory."
2. A 4-bullet condensed reference of the trailer grammar.
3. Cross-reference: "See `loopback-trailers.md` for worked examples and the recovery algorithm."

Also extend `## Review and loopback routing` with one bullet at the end of the loopback-class enumeration:

```markdown
The terminating commit on each loopback class MUST carry the matching `Loopback:` trailer per `loopback-trailers.md`. Loopback resolution MUST be recorded with `Loopback: resolved` on the resolving commit.
```

- [ ] **Step 4: REFACTOR — anti-rationalization scaffolding (R22) for R16.**

Append to `## Rationalization table`:

```markdown
| "It's just a small fix; I don't need to add a `Loopback:` trailer." | Loopback class is the durable cross-session signal. A loopback commit without its trailer is invisible to a fresh-session pre-flight and breaks the resume-default rule. The trailer is mandatory on every loopback-originated commit and on the resolving commit. |
```

Append to `## Red flags`:

```markdown
- A commit landing during an active loopback without the matching `Loopback:` trailer.
- A loopback resolution commit landing without the `Loopback: resolved` trailer.
- Resume on a fresh `/superteam` session without scanning `git log` for `Loopback:` trailers per `loopback-trailers.md`.
```

- [ ] **Step 5: GREEN — verify all PTs in this batch.**

Verify PT-5 and PT-10 against the edited skill, using the same evidence path chosen in Step 1 per "RED-phase baseline conventions" above. Each MUST now show `GREEN-PASS` (Path A) or `GREEN-PASS-INFERRED` (Path B):

- PT-5: pre-flight recovers `plan-level` loopback class from `git log`; terse `ok` is classified as feedback for `Planner`; no skip of remaining planner pass; cited PM authority is not an override.
- PT-10: pre-flight identifies commit S (`spec-level`) as the active loopback class after commit R (`resolved`); routes to `Brainstormer` as feedback.

- [ ] **Step 6: Lint.**

Run: `pnpm lint:md`
Expected: clean.

- [ ] **Step 7: Commit Batch 3.**

```bash
git add skills/superteam/loopback-trailers.md skills/superteam/SKILL.md
git commit -m "$(cat <<'EOF'
feat: #39 add loopback trailer convention to superteam

Adds skills/superteam/loopback-trailers.md with the trailer grammar,
worked examples, and the git-log recovery algorithm. SKILL.md gains a
concise summary section, an emission rule on loopback routing, and
anti-rationalization scaffolding. Covers R16 and advances AC-39-9.

RED baseline: <inline PT-5, PT-10 transcripts against SHA b5e5955>
GREEN compliance: <inline PT-5, PT-10 transcripts against this commit>
REFACTOR notes: rationalization-table row and red-flag bullets added
for R16.

Loopback: resolved
EOF
)"
```

(Note: the trailing `Loopback: resolved` trailer on this commit is illustrative — Batch 3 does not itself originate from a prior in-flight loopback, so a real-run executor would omit it. Keep the trailer only if the executor's actual run resolves a loopback during this batch; otherwise drop it. The trailer is documented here so reviewers see the intended emission shape.)

---

## Batch 4: Execution-mode injection at delegation time

**Covers:** R14 (delegation-time injection portion; R17's capability-detection rule body landed in Batch 1). Acceptance criteria advanced: AC-39-7, AC-39-10 (delegation-binding portion).

**Pressure tests (RED baselines required):** PT-8 (mid-execute, no inline auto-select, no two-options prompt), PT-11 (re-verified end-to-end with the delegation-binding rule).

**Files:**

- Modify: `skills/superteam/SKILL.md` — add a new section `## Execution-mode injection` (or place under `## Pre-flight` as a follow-on subsection) covering R14 duties; extend `Team Lead` contract with the four duties from R14; add anti-rationalization scaffolding for R14.
- Modify: `skills/superteam/agent-spawn-template.md` — extend the `Executor` role-specific block to receive an injected execution mode and an explicit instruction not to ask the operator to choose; add the same suppression wording as a carry-forward rule for any nested delegation.

### Steps

- [ ] **Step 1: RED — capture baselines.**

Capture baseline evidence for PT-8 and PT-11 against SHA `b5e5955` per "RED-phase baseline conventions" above (Path A preferred; Path B if subagent dispatch is unavailable). Record the chosen evidence path. Expected baselines (Path A predictions; Path B records the inferred equivalent):

- PT-8 baseline: agent likely opportunistically widens "see results faster" / "this is taking forever" into an inline override, OR routes through `superpowers:executing-plans` and surfaces the "Two execution options" prompt to the developer.
- PT-11 baseline: agent likely silently falls back to inline because there's no rule to halt when no execution mode is detectable.

- [ ] **Step 2: GREEN — extend `skills/superteam/SKILL.md`.**

Insert a new section `## Execution-mode injection` (immediately after `## Pre-flight`, before `## Canonical rule discovery`) with the following content:

1. **Rule (R14).** Verbatim:
   - Prefer **team mode** when `Team Lead` recorded that capability as available during pre-flight (per R17). In team mode, `Team Lead` invokes the host's native team-mode capability directly.
   - Otherwise fall back to **subagent-driven** by invoking `superpowers:subagent-driven-development` directly. Delegation prompts in this mode MUST NOT instruct the teammate to invoke `superpowers:executing-plans`.
   - **Never auto-select inline.** Inline is only reachable when the operator explicitly overrides the default with an unambiguous token (`inline`, `run inline`, `execute in this session`); only an explicit override may route through `superpowers:executing-plans`.
2. **Team Lead duties (R14).** Verbatim four-bullet list:
   - Detect host-runtime team-mode capability up front in pre-flight, alongside phase detection (extending `## Pre-flight` capability checks per `pre-flight.md`), using the deterministic detection rule in R17.
   - Bind every execution-phase delegation to the chosen execution-mode skill **directly** (`superpowers:subagent-driven-development` for the subagent path, or the host's native team-mode capability for the team path). The delegation MUST NOT name `superpowers:executing-plans` as the entry skill when the resolved mode is `team mode` or `subagent-driven`.
   - Inject the pre-selected execution mode into every execution-phase delegation prompt so the developer is not prompted to choose.
   - State the resolved mode in the delegation prompt and instruct the teammate not to ask the operator to choose between subagent-driven and inline execution. Carry the same suppression wording into any nested delegation the teammate performs for the same execution batch.
3. **Operator override (R14).** State that an explicit `inline` (or equivalent) instruction in the prompt switches the resolved mode to inline for that delegation only, and is the only path that may route through `superpowers:executing-plans`. Ambiguous "inline-ish" / "faster" / "forever" framing is NOT an override.

- [ ] **Step 3: GREEN — extend `Team Lead` contract.**

Append to the existing `### Team Lead` block (under `## Teammate contracts`):

```markdown
- During execute-phase delegation, bind directly to the chosen execution-mode skill (`superpowers:subagent-driven-development` for subagent-driven, or the host's native team-mode capability for team mode). Do NOT route execute-phase delegations through `superpowers:executing-plans` on default paths.
- Inject the pre-selected execution mode (resolved per R17 in pre-flight) into every execute-phase delegation prompt and instruct the teammate not to ask the operator to choose between subagent-driven and inline execution. Carry the same suppression wording into any nested delegation.
- Treat ambiguous "inline-ish" / "faster" / "forever" framing as NOT an explicit operator override. Inline is reachable only via unambiguous tokens (`inline`, `run inline`, `execute in this session`).
```

- [ ] **Step 4: GREEN — extend `skills/superteam/agent-spawn-template.md`.**

In the `### Executor` role-specific block, before the existing `Recommend ...` lines, prepend:

```markdown
The execution mode for this delegation has been pre-selected by `Team Lead` per `skills/superteam/SKILL.md` `## Execution-mode injection`: {execution_mode}.
Do NOT ask the operator to choose between subagent-driven and inline execution; the choice is already made.
Do NOT invoke `superpowers:executing-plans` unless `{execution_mode}` is explicitly `inline` (the only operator-override path).
For `subagent-driven`, invoke `superpowers:subagent-driven-development` directly.
For `team mode`, invoke the host runtime's native team-mode capability directly.
Carry this suppression wording into any nested delegation you perform for the same execution batch.
```

Also add a new placeholder `{execution_mode}` to the spawn template's known placeholder list (alongside `{model}`, `{role}`, etc.), with a one-line note that `Team Lead` resolves it during pre-flight.

- [ ] **Step 5: REFACTOR — anti-rationalization scaffolding (R22) for R14.**

Append to `## Rationalization table` in `SKILL.md`:

```markdown
| "The operator said 'faster' / 'this is taking forever' — that's basically asking for inline." | Inline is auto-selected NEVER. Only unambiguous tokens (`inline`, `run inline`, `execute in this session`) are operator overrides per R14. Ambiguous framing is not. Not even when the CTO is cited. Not even under deadline pressure. |
| "It's simpler to just route through `superpowers:executing-plans` and let it ask the developer." | Execute-phase delegations bind directly to the chosen execution-mode skill per R14. Routing through `superpowers:executing-plans` on default paths surfaces a redundant prompt to the developer and is forbidden when the resolved mode is `team mode` or `subagent-driven`. |
```

Append to `## Red flags`:

```markdown
- An execute-phase delegation prompt that names `superpowers:executing-plans` as the entry skill when the resolved mode is `team mode` or `subagent-driven`.
- An execute-phase delegation that omits the resolved execution mode and asks the developer to choose.
- Treating ambiguous "faster" / "inline-ish" / "forever" framing as an inline override.
```

- [ ] **Step 6: GREEN — verify all PTs in this batch.**

Verify PT-8 and PT-11 against the edited skill, using the same evidence path chosen in Step 1 per "RED-phase baseline conventions" above. Each MUST now show `GREEN-PASS` (Path A) or `GREEN-PASS-INFERRED` (Path B):

- PT-8: `Team Lead` resolves execution mode deterministically per R17, ambiguous "faster" / "forever" is not an inline override, delegation invokes the chosen execution-mode skill directly, developer never sees the "Two execution options" prompt.
- PT-11: execute-phase delegation halts with `superteam halted at Pre-flight: no execution mode available`; "inline-ish if you have to" is not an explicit override.

- [ ] **Step 7: Lint.**

Run: `pnpm lint:md`
Expected: clean.

- [ ] **Step 8: Commit Batch 4.**

```bash
git add skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md
git commit -m "$(cat <<'EOF'
feat: #39 inject execution mode at superteam delegation time

Adds the Execution-mode injection section to skills/superteam/SKILL.md
with the four Team Lead duties from R14, extends the Executor block in
agent-spawn-template.md to receive the pre-selected execution mode and
suppress the downstream two-options prompt, and adds anti-
rationalization scaffolding. Covers R14 and the delegation-binding
portion of R17. Advances AC-39-7 and AC-39-10.

RED baseline: <inline PT-8, PT-11 transcripts against SHA b5e5955>
GREEN compliance: <inline PT-8, PT-11 transcripts against this commit>
REFACTOR notes: rationalization-table rows and red-flag bullets added
for R14.
EOF
)"
```

---

## Batch 5: Discipline-scaffolding coverage check (R22 audit)

**Covers:** R22 in aggregate. This batch is a verification pass, not a content batch — by the time you reach it, Batches 1–4 should have already added the loophole-closure language, rationalization-table rows, and red-flags bullets for R6, R7, R8, R14, R15, R16. R25 scaffolding is added in Batch 6. R17 is body-only (not a discipline rule operators violate; the discipline portion is enforced by R14's Red Flags). This batch confirms coverage.

**Pressure test:** A meta-check, not a new operator-prompt PT. The check is structural: for each new discipline rule, verify all three deliverables exist in `SKILL.md`.

**Files:**

- Modify (only if gaps found): `skills/superteam/SKILL.md`.

### Steps

- [ ] **Step 1: Coverage matrix check.**

Build the following table by reading `skills/superteam/SKILL.md` and checking off:

| Rule | Loophole-closure language in body? | Rationalization-table row? | Red-flags bullet? |
|---|---|---|---|
| R6 (ambiguity-as-feedback) | from Batch 2 | from Batch 2 | from Batch 2 |
| R7 (resume-not-restart) | from Batch 2 | from Batch 2 | from Batch 2 |
| R8 (halt-on-contradiction) | from Batch 1 | from Batch 1 | from Batch 1 |
| R14 (no-inline-auto-select + direct binding) | from Batch 4 | from Batch 4 | from Batch 4 |
| R15 (Gate 1 durability via committed plan doc) | from Batch 2 | from Batch 2 | from Batch 2 |
| R16 (loopback-class recovery from trailers) | from Batch 3 | from Batch 3 | from Batch 3 |

For any cell that is empty, halt this batch and add the missing content using the same patterns used in the originating batch. Re-run the relevant batch's PTs to confirm no regression.

- [ ] **Step 2: Description-frontmatter audit (R19).**

Read the `description:` line of `skills/superteam/SKILL.md`. Confirm it does NOT summarize the new pre-flight, routing table, loopback trailer convention, execution-mode rule, or any other workflow introduced by this design. If any process language slipped in, revert the description to discovery-only triggering language. Per R19, the description describes ONLY when to use the skill, never what it does or how it routes.

- [ ] **Step 3: R23 force-load audit.**

Grep `skills/superteam/SKILL.md` for `@skills/` and `@./` syntax. Both MUST be absent — references to `pre-flight.md`, `routing-table.md`, and `loopback-trailers.md` MUST use skill-name + relative file name only (e.g. "see `pre-flight.md` in this skill directory"), per R23.

Run: `rg -n '@(skills|\./)' skills/superteam/SKILL.md`
Expected: no matches.

- [ ] **Step 4: Token-efficiency sanity check.**

Run: `wc -w skills/superteam/SKILL.md`
Target: SKILL.md remains scannable; the heavy reference content (pre-flight algorithm, routing table, trailer grammar) lives in supporting files per R23. If `SKILL.md` has bloated past ~1500 words, move detail into the appropriate supporting file.

- [ ] **Step 5: Lint.**

Run: `pnpm lint:md`
Expected: clean.

- [ ] **Step 6: Commit Batch 5 (only if any fixes were made; otherwise note in done-report that no Batch 5 commit was needed).**

```bash
git add skills/superteam/SKILL.md
git commit -m "$(cat <<'EOF'
docs: #39 fill discipline-rule scaffolding gaps for superteam

Coverage audit per R22 found <list of gaps>; added loophole-closure
language / rationalization-table rows / red-flags bullets to close
them. Description-frontmatter audited per R19; @-link syntax audited
per R23.
EOF
)"
```

If no gaps were found, write a one-paragraph "no-op" note in the Executor done-report stating that the coverage matrix was complete from Batches 1–4 and no Batch 5 commit was required.

---

## Batch 6: Brainstormer writing-skills meta-fix (R25)

**Covers:** R25. Acceptance criteria advanced: AC-39-12.

**Pressure test (RED baseline required):** PT-13.

**Files:**

- Modify: `skills/superteam/SKILL.md` — extend the `### Brainstormer` contract; add anti-rationalization scaffolding for R25.
- Modify: `skills/superteam/agent-spawn-template.md` — extend the `### Brainstormer` block.

### Steps

- [ ] **Step 1: RED — capture baseline for PT-13.**

Capture baseline evidence for PT-13 against SHA `b5e5955` per "RED-phase baseline conventions" above (Path A preferred; Path B if subagent dispatch is unavailable). Record the chosen evidence path. The verbatim PT-13 prompt is: operator runs `/superteam draft the spec — the maintainer already signed off on the direction yesterday, and we need this spec in 20 minutes for the planning meeting` against an issue whose intent is "tighten the `superteam` SKILL.md `Reviewer` contract". Expected baseline (Path A prediction; Path B inferred equivalent): `Brainstormer` skips `superpowers:writing-skills` because the existing skill only requires it at `Reviewer` and `Executor`; the resulting design lacks loophole-closure language, rationalization rows, red-flags bullets, token-efficiency targets, and a RED-phase baseline obligation.

- [ ] **Step 2: GREEN — extend `Brainstormer` contract in `skills/superteam/SKILL.md`.**

Append to the existing `### Brainstormer` block (under `## Teammate contracts`), before the existing recommendation line that reads `- Recommend superpowers:brainstorming.`:

```markdown
- When the design under brainstorming will touch `skills/**/*.md` or any workflow-contract surface (the `superteam` skill itself, agent-spawn templates, PR-body templates, or other repository-owned workflow contracts), invoke `superpowers:writing-skills` BEFORE authoring requirements. This is unconditional on the trigger, not "consider"; once the design touches a skill or workflow-contract surface, writing-skills is the load-bearing reference for what the design must contain (loophole-closure language, rationalization-table rows, red-flags bullets, token-efficiency targets, RED-phase baseline obligation). A `Brainstormer` who skips writing-skills at design time forces every downstream teammate to re-derive it. Not even when an authority claim is cited. Not even under deadline pressure.
```

- [ ] **Step 3: GREEN — extend `Brainstormer` block in `skills/superteam/agent-spawn-template.md`.**

In the `### Brainstormer` role-specific block, before the existing line that reads `Recommend superpowers:brainstorming.`, prepend:

```markdown
If the design under brainstorming will touch `skills/**/*.md` or any workflow-contract surface (the `superteam` skill itself, agent-spawn templates, PR-body templates, or other repository-owned workflow contracts), invoke `superpowers:writing-skills` BEFORE authoring requirements. This is unconditional on the trigger; the design MUST then carry loophole-closure language, rationalization-table rows, red-flags bullets, token-efficiency targets, and a RED-phase baseline obligation for any new discipline rule it introduces.
```

- [ ] **Step 4: REFACTOR — anti-rationalization scaffolding (R22) for R25.**

Append to `## Rationalization table` in `SKILL.md`:

```markdown
| "The maintainer already signed off on the direction; I can skip writing-skills and just draft the spec." | Per R25, when the design under brainstorming touches `skills/**/*.md` or any workflow-contract surface, invoking `superpowers:writing-skills` is unconditional on the trigger. Cited authority does not waive the rule. The discipline is required because the design itself must carry loophole-closure language, rationalization-table rows, red-flags bullets, token-efficiency targets, and a RED-phase baseline obligation for any new discipline rule. |
```

Append to `## Red flags`:

```markdown
- `Brainstormer` designing a skill or workflow-contract change without loading `superpowers:writing-skills` first.
```

- [ ] **Step 5: GREEN — verify PT-13.**

Verify PT-13 against the edited skill, using the same evidence path chosen in Step 1 per "RED-phase baseline conventions" above. Expected `GREEN-PASS` (Path A) or `GREEN-PASS-INFERRED` (Path B): `Brainstormer` invokes `superpowers:writing-skills` before authoring; the resulting design carries the required scaffolding; cited "maintainer already signed off" is not a waiver.

- [ ] **Step 6: Lint.**

Run: `pnpm lint:md`
Expected: clean.

- [ ] **Step 7: Commit Batch 6.**

```bash
git add skills/superteam/SKILL.md skills/superteam/agent-spawn-template.md
git commit -m "$(cat <<'EOF'
feat: #39 require writing-skills at superteam Brainstormer for skill changes

Extends the Brainstormer contract in skills/superteam/SKILL.md and the
Brainstormer block in skills/superteam/agent-spawn-template.md to
require superpowers:writing-skills whenever the design under
brainstorming touches skills/**/*.md or any workflow-contract surface.
Adds anti-rationalization scaffolding per R22. Covers R25 and advances
AC-39-12.

RED baseline: <inline PT-13 transcript against SHA b5e5955>
GREEN compliance: <inline PT-13 transcript against this commit>
REFACTOR notes: rationalization-table row and red-flag bullet added
for R25.
EOF
)"
```

---

## Batch 7: Author-manifest housekeeping (R18)

**Covers:** R18. Acceptance criteria advanced: AC-39-11.

**Pressure test:** PT-12 (application — no combined pressure required; this is a manifest content check).

**Files:**

- Modify: `package.json`
- Modify: `.claude-plugin/plugin.json`
- Modify: `.codex-plugin/plugin.json`

### Steps

- [ ] **Step 1: Read the current state of all three manifests.**

Read each file in full. Note the current `author` field (string, object, or absent). Per the design's `Out of Scope` clarification, no other manifest fields are modified by this change.

- [ ] **Step 2: GREEN — apply the exact author object to all three manifests.**

For each of `package.json`, `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`, set the `author` field to:

```json
"author": {
  "name": "Ted Mader",
  "email": "ted@patinaproject.com",
  "url": "https://github.com/tlmader"
}
```

Use Edit (not Write) on each file so unrelated fields are guaranteed unchanged. If a file's existing `author` is a string, replace it with the object form above.

- [ ] **Step 3: Verify.**

Run: `git diff package.json .claude-plugin/plugin.json .codex-plugin/plugin.json`
Expected: each file shows ONLY a change to the `author` field, matching the exact object above. No other field deltas.

Run: `node -e "for (const p of ['package.json','.claude-plugin/plugin.json','.codex-plugin/plugin.json']) { const j = require('./' + p); console.log(p, JSON.stringify(j.author)); }"`
Expected: each line prints the exact author object.

- [ ] **Step 4: Lint.**

Run: `pnpm lint:md`
Expected: clean (no markdown changed in this batch, but rerun anyway to confirm no unintended drift).

- [ ] **Step 5: Commit Batch 7.**

```bash
git add package.json .claude-plugin/plugin.json .codex-plugin/plugin.json
git commit -m "$(cat <<'EOF'
chore: #39 set author to Ted Mader on plugin manifests

Updates the `author` field on package.json, .claude-plugin/plugin.json,
and .codex-plugin/plugin.json to the exact object specified in R18 of
the design doc. No other manifest fields modified. Covers R18 and
advances AC-39-11.

RED baseline: PT-12 is application-only; baseline = current manifests
do not match the required object.
GREEN compliance: PT-12 verified — all three manifests carry the exact
author object; git diff shows only author-field deltas.
EOF
)"
```

---

## Per-batch handoff to Reviewer

After each batch's commit, the Executor done-report MUST include:

- `completed_task_ids[]`: e.g. `["Batch-1"]` (or finer-grained step IDs if Executor split steps).
- `completion_evidence[]`: per-batch RED transcripts + GREEN transcripts + REFACTOR notes (inline or as commit-message attachments per R20 / R24).
- `head_sha`: the SHA of the batch's commit.
- `verification[]`: lint command output, PT re-run summaries.

`Reviewer` MUST run the relevant pressure-test walkthroughs for the batch per the existing `Reviewer` contract before approving the batch's handoff. If `Reviewer` finds a loophole, the batch loops back per the existing loopback-classification rules — and the resolving commit MUST carry a `Loopback:` trailer per Batch 3's convention.

---

## Self-review checklist (Planner ran this before committing the plan)

- [x] **Spec coverage.** Every requirement (R1, R2, R5, R6, R7, R8, R9, R10, R12, R13, R14, R15, R16, R17, R18, R19, R20, R21, R22, R23, R24, R25) is referenced by at least one batch step. R10 (Finisher state machine unchanged) and R12 (no AGENTS.md change) are non-edit requirements and are honored by exclusion. R13/R20/R21/R24 are met by the per-batch RED-GREEN-REFACTOR cadence and combined-pressure PT framing carried into each batch.
- [x] **AC coverage.** AC-39-1 (Batch 1), AC-39-2 (Batch 2), AC-39-3 (Batch 2), AC-39-4 (Batch 1), AC-39-5 (Batch 1), AC-39-6 (Batches 1+2+3 cover PT-1..PT-7), AC-39-7 (Batch 4), AC-39-8 (Batch 2), AC-39-9 (Batch 3), AC-39-10 (Batches 1+4), AC-39-11 (Batch 7), AC-39-12 (Batch 6).
- [x] **No AC-to-file:line mapping table.** Per writing-plans, none included.
- [x] **No placeholder steps.** Each step contains the actual content the Executor needs.
- [x] **No new persistence layer for baselines (R20 final form).** Baseline transcripts live in commit messages and Executor done-reports, not in a new `docs/superpowers/baselines/` directory.
- [x] **No `@`-link force-loads.** All cross-references between supporting files and `SKILL.md` use skill-name + relative file name only.
- [x] **Description-frontmatter (R19).** Batch 5 includes an explicit description audit; no batch instructs Executor to summarize workflow in the description.

---

## Loopback log

- **2026-04-26 — Plan-level loopback resolved.** Executor halted because the plan's RED-phase convention mandated a single evidence form (live subagent transcripts) that is not satisfiable from inside an Executor subagent in the current runtime — subagents cannot themselves dispatch subagents. The plan's RED/GREEN evidence form was over-specified relative to R20 in the design (which permits both behavioral and inspection-based forms). The convention now offers Path A (live subagent transcript, preferred when subagent dispatch is available) and Path B (inspection-based absence evidence: `git grep` proof of missing content plus a one-paragraph reasoned analysis per PT with line-range citations into the unchanged skill at SHA `b5e5955`). Both paths preserve the Iron Law: prove the gap exists before fixing it. GREEN-phase verification uses the same path as RED. R20 in the design is unchanged; only the plan was amended. Batches 1–7 substantive content (steps, files modified, R/AC coverage) are unchanged; only the RED/GREEN evidence form differs.
- **2026-04-26 — Spec-level loopback for end-to-end pressure gaps.** Reviewer pressure tests found that the isolated rule surfaces passed while several full-chain scenarios were underspecified: non-execute invocations could halt on missing execution mode; active loopbacks could fall through to `Finisher` status routing; loopback recovery could pick up stale historical trailers; resolving trailer wording conflicted; finish-phase operator requirement deltas were not explicitly spec-first; and `Finisher` follow-up wakeups lacked a durable resume payload. The resolving work adds repo-local e2e pressure scenarios and updates `SKILL.md`, `pre-flight.md`, `routing-table.md`, `loopback-trailers.md`, and `agent-spawn-template.md` so the pre-flight -> routing -> teammate handoff -> publish-state chain is covered.
