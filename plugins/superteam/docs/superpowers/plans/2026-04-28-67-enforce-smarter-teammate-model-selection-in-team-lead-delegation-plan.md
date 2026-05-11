# Plan: Enforce smarter teammate model selection in Team Lead delegation [#67](https://github.com/patinaproject/superteam/issues/67)

> **For agentic workers:** This plan is consumed by the `superteam` `Executor` teammate. Execute tasks in order. Each task lists files touched, AC linkage, RED-trace artifact, GREEN evidence, and verification commands. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a binding model-selection contract to the `superteam` workflow so `Team Lead` resolves an explicit per-role model at delegation time and binds it via the host's model-override mechanism, replacing silent inheritance of the parent session model.

**Architecture:** Workflow-contract change. Edits land in `skills/superteam/SKILL.md` (new `## Model selection` section parallel to `## Execution-mode injection`, plus updates to `Team Lead` duties, the rationalization table, and the red-flags list), with consistency touch-ups in `skills/superteam/agent-spawn-template.md` and `skills/superteam/pre-flight.md`. No code; this is a skill-contract change reviewed via `superpowers:writing-skills` pressure tests.

**Tech Stack:** Markdown skill files; `markdownlint-cli2` via `pnpm lint:md`; `superpowers:writing-skills` pressure-test walkthroughs at review time.

**Source-of-truth design:** `docs/superpowers/specs/2026-04-28-67-enforce-smarter-teammate-model-selection-in-team-lead-delegation-design.md` @ commit `834feb7`. The design is authoritative; this plan does NOT restate requirements, it sequences the edits that satisfy them.

---

## File map

Files modified by this plan, with the responsibility each carries:

- `skills/superteam/SKILL.md` — primary contract surface. Adds `## Model selection` section (defaults table, override grammar, binding mechanism, capability fallback, loophole closure), one new `Team Lead` duty bullet, three new rationalization-table rows, three new red-flags bullets.
- `skills/superteam/pre-flight.md` — adds the model-override capability probe to the deterministic pre-flight sequence and adds `model_override_capability` to the pre-flight output record.
- `skills/superteam/agent-spawn-template.md` — adds a one-line note that `{model}` is resolved by `Team Lead` per `SKILL.md` `## Model selection` (mirrors the existing `{execution_mode}` note).
- `skills/superteam/routing-table.md` — no edits required (verified in T-67-0 below); model selection is delegation-time binding, not a routing axis.

Each file change is independent commit-wise but ordered for safe sequencing: SKILL.md first (the contract), then `pre-flight.md` (which the contract references for the capability probe), then `agent-spawn-template.md` (which surfaces `{model}` to delegated teammates).

## RED-trace strategy for skill contract changes

Per the design's `## RED-phase baseline obligation`, the observable failure mode before this rule is that an `Executor` (or other) delegation prompt resolves `{model}` to the parent session model with no explicit `model` field on the dispatch surface. There is no executable test for skill text; the RED trace is captured as a prose walkthrough that Reviewer reruns under `superpowers:writing-skills` pressure-test rules.

Each task below specifies its RED-trace artifact (the observable hole that must exist before the change) and its GREEN evidence (the observable closure after the change). Reviewer reruns pressure tests PT-1 through PT-4 from the design at review time; this plan does not duplicate them, but every task whose change participates in a pressure test names the test it feeds.

---

## Task T-67-0: Confirm `routing-table.md` requires no edits

**Files:**

- Read-only: `skills/superteam/routing-table.md`

**AC linkage:** Sanity check; no AC assigned. Prevents wasted work.

**RED-trace artifact:** N/A. This is a no-op verification task.

**GREEN evidence:** A short note in the executor commit message body for the next task confirming `routing-table.md` does not branch on model selection (model is bound at delegation time, not routed on).

- [ ] **Step 1: Inspect `skills/superteam/routing-table.md` for any references to model, opus, sonnet, or haiku.**

Run:

```bash
grep -nEi 'model|opus|sonnet|haiku' /Users/tlmader/dev/patinaproject-org/superteam/skills/superteam/routing-table.md || echo "no model references"
```

Expected: `no model references`. If matches appear, halt and route back to Planner with the finding before proceeding.

- [ ] **Step 2: No commit.**

This task produces no diff. It exists to keep the file map honest.

---

## Task T-67-1: Add `## Model selection` section to `SKILL.md`

**Files:**

- Modify: `skills/superteam/SKILL.md` — insert a new `## Model selection` section between `## Execution-mode injection` (current lines 76-96) and `## Canonical rule discovery` (current line 98).

**AC linkage:** AC-67-1, AC-67-5. Lays the section that AC-67-2 / AC-67-3 / AC-67-4 then extend or reference.

**RED-trace artifact:** Before this edit, `SKILL.md` has no `## Model selection` heading. Walkthrough: open `SKILL.md`, search for "Model selection" — the heading is absent. The contract therefore does not name a per-role default, override grammar, or binding mechanism. Reviewer's PT-1 ("go faster") and PT-4 ("`model: sonnet` for Brainstormer") have nowhere to be checked because the rule does not exist.

**GREEN evidence:** Walkthrough: open `SKILL.md`, search for "Model selection" — the heading exists, sits parallel to `## Execution-mode injection`, and contains:

1. The per-teammate model defaults table from the design (six rows: Team Lead=inherit, Brainstormer=opus, Planner=opus, Executor=sonnet, Reviewer=opus, Finisher=sonnet).
2. The notes under the table (the `inherit` literal-value clarification; the static-default declaration referencing out-of-scope dynamic scoring).
3. The operator override grammar subsection: canonical tokens (`model: opus`, `model: sonnet`, `model: haiku`) and aliases (`use <model>`, `with <model>`); case-insensitive matching; whitespace around the colon permitted; targeted form `model: <model> for <role>`; the "what does NOT count as an override" list mirroring R14's anti-fuzzy-matching discipline; override scope (next delegation only).
4. The binding mechanism subsection: resolution order (operator override → per-role default → `inherit` for Team Lead only); binding surfaces (`Agent` tool's `model` parameter on Claude Code; analogous parameters on other host runtimes).
5. The capability-fallback subsection: pre-flight probe records `model_override_capability=unavailable` when the host lacks model-override; inherit-and-warn (single per-run warning); explicitly does NOT halt; explicitly differs from R14 because model selection is a cost/fit gate, not a correctness-of-dispatch gate.
6. A `## Loophole closure` block (or numbered loophole-closure list inside the section) covering the five closures in the design's `## Loophole closure`: model selection is binding; ambiguous framing is NOT an override; operator silence is NOT permission to inherit; operator override always wins for the targeted delegation; no persistent override memory.

The section MUST cite R14 by name in the override-grammar subsection so the parallel discipline is explicit (per design `## Operator override grammar` opening sentence).

The wording is taken from the design verbatim where the design provides the wording (defaults table, override-token list, "what does NOT count as an override" list, loophole-closure items). Do not re-author; transcribe.

- [ ] **Step 1: Invoke `superpowers:writing-skills` before editing `SKILL.md`.**

Per `SKILL.md` Executor duties: "If your work touches `skills/**/*.md`, invoke `superpowers:writing-skills` before editing." This is non-negotiable.

- [ ] **Step 2: Read the current `SKILL.md` end-to-end.** Confirm the insertion point is between current `## Execution-mode injection` (ends at the line before `## Canonical rule discovery`) and `## Canonical rule discovery` itself.

- [ ] **Step 3: Insert the new `## Model selection` section per the GREEN-evidence checklist above.** Use the design's exact wording for the defaults table, override tokens, and "what does NOT count as an override" list.

- [ ] **Step 4: Add a binding `Team Lead` duty bullet under `### Team Lead` (currently around line 173 onward).**

The new bullet must say (paraphrased per design AC-67-2; final wording follows the design's `Team Lead duties` paragraph in `## Binding mechanism`):

> Resolve the model per teammate role at delegation time per `## Model selection`. Bind the resolved model via the host's model-override mechanism (e.g. the `Agent` tool's `model` parameter). Do NOT silently inherit the parent session model. The rule is binding, not advisory; the only paths to inheritance are the literal `inherit` default for `Team Lead` itself and the inherit-and-warn capability fallback per `## Model selection` `## Capability fallback`.

This bullet is binding language ("MUST"-class), not advisory.

This step covers AC-67-2.

- [ ] **Step 5: Add three new rows to `## Rationalization table`** taken verbatim from the design's `## Rationalization-table row (for SKILL.md, AC-67-3)` block. The three rows close: (a) "the parent model is fine, just inherit"; (b) "go faster" treated as override; (c) Team Lead overriding the operator with default reasoning.

This step covers AC-67-3.

- [ ] **Step 6: Add three new bullets to `## Red flags`** taken verbatim from the design's `## Red-flags bullet (for SKILL.md, AC-67-4)` block. The three bullets cover: (a) delegation omitting a resolved `model` value; (b) treating fuzzy framing as a model override; (c) execute-phase delegation defaulting to inherited parent model rather than the per-role `Executor` default.

This step covers AC-67-4.

- [ ] **Step 7: Run `pnpm lint:md`.**

Run: `pnpm lint:md`
Expected: PASS. If the lint fails, fix the markdown structure (heading levels, list spacing, table alignment) per `.markdownlint.jsonc` and re-run before continuing.

- [ ] **Step 8: Walk PT-1 through PT-4 mentally against the new section.** Confirm each scenario in the design's `## Pressure tests` is now answerable by reading the new section. If any test cannot be answered from the section text alone, the section is incomplete; revise before commit.

- [ ] **Step 9: Commit.**

```bash
git add skills/superteam/SKILL.md
git commit -m "feat: #67 add model-selection contract to superteam SKILL.md"
```

The commit type is `feat:` because this is a workflow-contract change to a shipped skill (per `AGENTS.md` `### Commit type selection`: edits to `skills/**/SKILL.md` and adjacent skill workflow contracts are product/runtime changes by default).

**Verification:** `pnpm lint:md`; manual PT-1..PT-4 walkthroughs (Reviewer reruns these at review time per the verification plan below).

---

## Task T-67-2: Add model-override capability probe to `pre-flight.md`

**Files:**

- Modify: `skills/superteam/pre-flight.md` — add a new probe step after the existing execution-mode capability detection; extend the `## Output of pre-flight` record to include `model_override_capability`.

**AC linkage:** Supports AC-67-1 (binding mechanism + capability fallback) and AC-67-2 (the `Team Lead` duty references this probe). The design's `## Capability fallback` requires the probe to live in pre-flight.

**RED-trace artifact:** Before this edit, `pre-flight.md` `## Execution-mode capability detection` runs the execution-mode probe but never probes for model-override capability. The pre-flight output record (`## Output of pre-flight`) has no `model_override_capability` field. Walkthrough: under PT-3 (host runtime lacks model-override), `Team Lead` has no recorded signal in pre-flight to drive the inherit-and-warn fallback, so the fallback either silently skips or halts incorrectly.

**GREEN evidence:** Walkthrough: open `pre-flight.md`, find a new subsection (e.g. `## Model-override capability detection`) immediately after `## Execution-mode capability detection`. The new subsection states:

1. The probe inspects the active subagent-dispatch surface (e.g. the `Agent` tool's accepted parameters, or a plugin manifest declaration of model-override capability).
2. If model-override capability is present, record `model_override_capability=available`.
3. If unavailable, record `model_override_capability=unavailable`. This is NOT a halt condition. Per `SKILL.md` `## Model selection` `## Capability fallback`, `Team Lead` proceeds with inherit-and-warn.
4. The probe runs once per `/superteam` invocation, alongside the execution-mode probe, before routing.

The `## Output of pre-flight` record gains a `model_override_capability` field with value contract `available` | `unavailable`.

The detection sequence list at the top of the file gains a new step (between current step 9 "Probe execution-mode capability" and step 10 "Route") that says "Probe model-override capability per `## Model-override capability detection`."

- [ ] **Step 1: Invoke `superpowers:writing-skills`** (the file is under `skills/superteam/`).

- [ ] **Step 2: Read `pre-flight.md` end-to-end** to confirm current structure.

- [ ] **Step 3: Add a new probe subsection** `## Model-override capability detection` immediately after `## Execution-mode capability detection`. Wording matches the design's `## Capability fallback` step list (probe → record `model_override_capability=unavailable` if absent → emit single per-run warning when the run later dispatches under that condition; the warning emission itself lives in `Team Lead`'s delegation flow, not in pre-flight, but pre-flight records the signal).

- [ ] **Step 4: Add a new step to the `## Detection sequence` ordered list** — the new step "Probe model-override capability per `## Model-override capability detection`." goes between current step 9 ("Probe execution-mode capability") and current step 10 ("Route").

- [ ] **Step 5: Extend `## Output of pre-flight`** by adding `model_override_capability` to the JSON-shaped record and adding its value contract (`available` | `unavailable`) to the field-value-contracts list below the record.

- [ ] **Step 6: Confirm no halt condition is added.** Per the design, model-override unavailability is NOT a halt; it is a recorded signal that drives inherit-and-warn at delegation time. If a halt condition for model-override capability appears in your edit, remove it before commit.

- [ ] **Step 7: Run `pnpm lint:md`.**

Run: `pnpm lint:md`
Expected: PASS.

- [ ] **Step 8: Commit.**

```bash
git add skills/superteam/pre-flight.md
git commit -m "feat: #67 add model-override capability probe to pre-flight"
```

**Verification:** `pnpm lint:md`; PT-3 walkthrough (Reviewer reruns at review time).

---

## Task T-67-3: Update `agent-spawn-template.md` for `{model}` resolution authority

**Files:**

- Modify: `skills/superteam/agent-spawn-template.md` — extend the existing top-of-file note about placeholders so `{model}` carries the same "resolved by `Team Lead` per `SKILL.md` ..." treatment as `{execution_mode}`. Optionally add a per-role line under `### Executor` (and/or other roles) that mirrors the existing `{execution_mode}` injection block, but this is OPTIONAL and only required if the SKILL.md contract requires per-role spawn-template wording.

**AC linkage:** Supports AC-67-2. The agent-spawn template is the surface where `{model}` is substituted into the actual `Agent({...})` call, so the contract on `SKILL.md` is only enforceable if the spawn template explicitly defers to it.

**RED-trace artifact:** Current `agent-spawn-template.md` line 4 says "Model per teammate is dictated by the `superteam` workflow. Inject `{model}` from the active teammate assignment instead of hardcoding it." This is correct in spirit but pre-dates the binding contract — it does NOT name `## Model selection` as the source of truth, does NOT name the resolution order, and does NOT name the inherit-and-warn fallback. Walkthrough: a future Team Lead reading only this template has no path back to the binding rule, so silent inheritance can re-emerge.

**GREEN evidence:** Walkthrough: open `agent-spawn-template.md`. The top-of-file paragraph that introduces placeholders explicitly states that `{model}` is resolved by `Team Lead` during pre-flight per `SKILL.md` `## Model selection`, mirroring how the existing paragraph already cites `## Execution-mode injection` for `{execution_mode}`. The template body retains `model: "{model}"` on the `Agent({...})` call (it is already present today).

A reader who lands in this file can chase the citation back to `SKILL.md` `## Model selection` and find the per-role defaults, override grammar, and capability-fallback rule.

- [ ] **Step 1: Invoke `superpowers:writing-skills`.**

- [ ] **Step 2: Read `agent-spawn-template.md` end-to-end.**

- [ ] **Step 3: Update the placeholders paragraph (currently around lines 4-5).**

The current text:

> Model per teammate is dictated by the `superteam` workflow. Inject `{model}` from the active teammate assignment instead of hardcoding it.
>
> Known placeholders include `{model}`, `{role}`, ... `Team Lead` resolves `{execution_mode}` during pre-flight per `SKILL.md` `## Execution-mode injection` and `pre-flight.md` `## Execution-mode capability detection`.

Update so the second paragraph also names `{model}`, e.g. add a sentence (after the existing `{execution_mode}` sentence) along the lines of:

> `Team Lead` resolves `{model}` per teammate role at delegation time per `SKILL.md` `## Model selection`, using the per-role default from that section unless an explicit operator override (per `## Operator override grammar`) targets the delegation. When the host runtime lacks model-override capability per `pre-flight.md` `## Model-override capability detection`, `Team Lead` proceeds with inherit-and-warn rather than halting.

Final wording is the Executor's call as long as it carries the three citations (the SKILL.md section, the override-grammar subsection, and the pre-flight probe subsection added in T-67-2). Cross-file consistency is the load-bearing requirement.

- [ ] **Step 4: Verify the `Agent({...})` template body still contains `model: "{model}"`** (it does today on the existing line 11). No edit required there; this step is a guard against accidental deletion.

- [ ] **Step 5: Run `pnpm lint:md`.**

Run: `pnpm lint:md`
Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add skills/superteam/agent-spawn-template.md
git commit -m "feat: #67 cite Model selection contract for {model} placeholder"
```

**Verification:** `pnpm lint:md`; cross-file grep below.

---

## Task T-67-4: Cross-file consistency check

**Files:** Read-only verification across `skills/superteam/SKILL.md`, `skills/superteam/pre-flight.md`, `skills/superteam/agent-spawn-template.md`, `skills/superteam/routing-table.md`.

**AC linkage:** Sanity-checks AC-67-1 through AC-67-5 against the committed file set.

**RED-trace artifact:** Before this check, the three modified files could carry inconsistent vocabulary (e.g. `model_override_capability` in pre-flight but `model-override capability` referenced ambiguously elsewhere; or the override-token list drifting between files). Walkthrough: a Reviewer reading the three files in sequence cannot confirm the contract is internally consistent.

**GREEN evidence:** Walkthrough: every cross-reference resolves; the override tokens, capability-flag name, and section names match across files.

- [ ] **Step 1: Confirm the section name `## Model selection` appears exactly once in `SKILL.md` and is referenced verbatim from the other files.**

Run:

```bash
grep -n '## Model selection' /Users/tlmader/dev/patinaproject-org/superteam/skills/superteam/SKILL.md
grep -n 'Model selection' /Users/tlmader/dev/patinaproject-org/superteam/skills/superteam/pre-flight.md /Users/tlmader/dev/patinaproject-org/superteam/skills/superteam/agent-spawn-template.md
```

Expected: one match in `SKILL.md` (the heading); references in the other two files.

- [ ] **Step 2: Confirm the capability-flag name `model_override_capability` is used consistently.**

Run:

```bash
grep -n 'model_override_capability' /Users/tlmader/dev/patinaproject-org/superteam/skills/superteam/SKILL.md /Users/tlmader/dev/patinaproject-org/superteam/skills/superteam/pre-flight.md /Users/tlmader/dev/patinaproject-org/superteam/skills/superteam/agent-spawn-template.md
```

Expected: identical spelling in every match. No `model-override-capability`, `modelOverrideCapability`, or other drift.

- [ ] **Step 3: Confirm the canonical override tokens are spelled identically in every file that lists them.**

Run:

```bash
grep -nE 'model: (opus|sonnet|haiku)' /Users/tlmader/dev/patinaproject-org/superteam/skills/superteam/*.md
```

Expected: every match uses the exact `model: <model>` form. Aliases `use <model>` and `with <model>` are present in `SKILL.md` and may be referenced (not redefined) elsewhere.

- [ ] **Step 4: Confirm `routing-table.md` was NOT edited** (T-67-0 verified it should not need edits).

Run:

```bash
git diff main -- skills/superteam/routing-table.md
```

Expected: empty diff. If non-empty, the edit was unintended; halt and route back to Planner.

- [ ] **Step 5: Run `pnpm lint:md` one final time** as a clean-tree gate before handing off to Reviewer.

Run: `pnpm lint:md`
Expected: PASS.

- [ ] **Step 6: No commit.** This is a verification task; failures route back to the relevant earlier task.

**Verification:** the four greps and `pnpm lint:md`.

---

## Verification plan

Minimum gate before Reviewer handoff:

1. `pnpm lint:md` passes after every commit and on the final tree.
2. Cross-file grep checks in T-67-4 all pass.
3. The three commits from T-67-1, T-67-2, T-67-3 land on the issue branch in that order.

Reviewer-owned verification (per `skills/superteam/SKILL.md` `### Reviewer`, which requires `superpowers:writing-skills` and the relevant pressure-test walkthrough for `skills/**/*.md` and workflow-contract changes):

1. Rerun **PT-1** ("go faster") from the design `## Pressure tests`. Expected: `Team Lead` resolves `{model}` for `Executor` to the per-role default `sonnet` and does NOT route through the override path or the R14 inline-override path.
2. Rerun **PT-2** (`model: haiku` for one Executor delegation, no override on the next). Expected: first delegation binds `model: "haiku"`; second reverts to `sonnet`.
3. Rerun **PT-3** (host runtime lacks model-override). Expected: pre-flight records `model_override_capability=unavailable`; the Executor dispatch proceeds without `model`; a single per-run warning is surfaced; the run does NOT halt.
4. Rerun **PT-4** (operator override conflicts with per-role default). Expected: Brainstormer delegation binds `model: "sonnet"` because operator override always wins; the next Brainstormer delegation, absent an override, returns to `opus`.

Reviewer must also confirm the `superpowers:writing-skills` dimensions used for the design adversarial review: RED/GREEN baseline obligation, rationalization resistance, red flags, token-efficiency targets, role ownership, stage-gate bypass paths.

Reviewer must also run the `skill-improver` quality gate documented in `docs/skill-improver-quality-gate.md` (per `skills/superteam/SKILL.md` `### Reviewer`, the gate applies to `skills/superteam/**` changes) and capture the required completion evidence in the PR body.

## Out of scope

Mirrors the design's `## Out of scope`:

- Dynamic per-task complexity scoring (e.g. picking Opus for a complex Executor refactor and Haiku for a docs-only Executor task). This plan keeps defaults static.
- Cost-budget enforcement (per-run or per-session model-spend limits).
- Auto-downgrade on retry (model selection does not change across retries within the same delegation).
- Per-skill or per-task-tag overrides (override grammar targets teammate roles only).
- `Team Lead` self-selection (the `inherit` default exists for completeness; `Team Lead` does not delegate to itself).
- Model-availability sub-probe (e.g. host accepts `model` but rejects `haiku`). Acknowledged as an open follow-up in the design's adversarial-review findings; out of scope here.

## Risks and blockers

- **None known at plan time.** The design dispositioned all material adversarial-review findings before Gate 1.
- **Risk (low):** the SKILL.md additions are estimated at ~50-60 lines on a ~500-line file (per design `## Adversarial review`). If the section grows beyond that during transcription, Reviewer should flag token-efficiency under the `superpowers:writing-skills` dimensions.
- **Risk (low):** the `{model}` placeholder is already present in `agent-spawn-template.md` today. T-67-3 must not delete or rename it; the verification grep in T-67-4 step 4 guards against drift but Executor should also visually confirm before commit.

## Self-review

- **Spec coverage.** AC-67-1 (T-67-1 Step 3), AC-67-2 (T-67-1 Step 4 plus T-67-3), AC-67-3 (T-67-1 Step 5), AC-67-4 (T-67-1 Step 6), AC-67-5 (T-67-1 Step 3 — override grammar subsection plus the "what does NOT count as an override" list). Capability fallback (T-67-2) supports AC-67-1 and AC-67-2.
- **Placeholder scan.** No "TBD", no "fill in details", no "similar to Task N". All commands are exact and runnable. Wording deferred to the design where the design provides verbatim text (defaults table, override-token list, loophole-closure items, rationalization rows, red-flags bullets); this is intentional — the plan's job is to sequence transcription, not re-author.
- **Type / vocabulary consistency.** `model_override_capability` (snake_case, `available` | `unavailable`) is used identically across SKILL.md, pre-flight.md, and agent-spawn-template.md. Override tokens `model: opus`, `model: sonnet`, `model: haiku` are used identically. Section name `## Model selection` is referenced identically.
