# Design: Enforce smarter teammate model selection in Team Lead delegation [#67](https://github.com/patinaproject/superteam/issues/67)

## Intent summary

Add a binding model-selection contract to the `superteam` workflow so `Team Lead` picks an appropriate model per teammate role at delegation time, instead of letting the spawned agent silently inherit the parent session's model. The contract names static per-role defaults, defines an unambiguous operator-override grammar (parallel to the R14 inline-override discipline), and binds the resolved model to the host's model-override mechanism (e.g. the `Agent` tool's `model` parameter) at the moment of delegation. Inheritance of the parent model is forbidden as a default behavior; it is reachable only when the host runtime exposes no model-override mechanism, in which case `Team Lead` must inherit-and-warn rather than halt.

The change is product impact (a workflow-contract change): it modifies `skills/superteam/SKILL.md` and the agent-spawn template's expectations for the existing `{model}` placeholder, both of which alter installed `superteam` runtime behavior.

## Requirements

- **AC-67-1**: `skills/superteam/SKILL.md` adds a `## Model selection` section that names the per-teammate default model, the override-token grammar, and the binding mechanism. The section sits parallel to `## Execution-mode injection` (R14) so the two contracts read together.
- **AC-67-2**: `Team Lead` duties in SKILL.md add a binding rule: pick the model per teammate role at delegation time; bind via the host's model-override mechanism (e.g. the `Agent` tool's `model` parameter); do NOT silently inherit the parent model. The rule is binding, not advisory.
- **AC-67-3**: A new row is added to the SKILL.md rationalization table for "the parent model is fine, just inherit", paired with the reality that silent inheritance is forbidden and the per-role default is the contract.
- **AC-67-4**: A new bullet is added to the SKILL.md red-flags list for delegations that omit a model choice (no `{model}` resolved, or the spawn surface omits the model parameter).
- **AC-67-5**: The operator-override token grammar is documented and is tested against ambiguous framing under the same rule as R14 inline override: only an unambiguous token in the prompt counts; fuzzy phrasing like "go cheap", "use the better model", "fast model" is NOT an override and routes to the per-role default.

## Per-teammate model defaults

The table below is the exact contract to land in SKILL.md. Defaults are static per role; the operator override is the only knob.

| Teammate | Default model | Rationale |
|---|---|---|
| `Team Lead` | `inherit` | Routing, gate enforcement, and pre-flight benefit from the main session model; `Team Lead` itself usually IS the main session and does not delegate to itself. |
| `Brainstormer` | `opus` | Design reasoning, requirement framing, adversarial review, loophole-closure synthesis. |
| `Planner` | `opus` | Plan structuring, workstream decomposition, dependency reasoning. |
| `Executor` | `sonnet` | Bounded ATDD / implementation grunt work; cost and speed win without sacrificing correctness on tasks that already have explicit AC IDs and a committed plan. |
| `Reviewer` | `opus` | Owns adversarial pressure-tests for `skills/**/*.md` and workflow-contract changes (per `skills/superteam/SKILL.md` `### Reviewer`, which requires invoking `superpowers:writing-skills` and running the relevant pressure-test walkthrough before publish). That is deep adversarial reasoning, not bounded pattern matching — the same justification that puts `Brainstormer` on Opus. Operators can downshift via `model: sonnet for reviewer` for trivial repo-rule reviews. |
| `Finisher` | `sonnet` | CI triage, PR ops, status sweeps, mechanical follow-through. |

Notes:

- `inherit` for `Team Lead` is a literal value, not a synonym for "no contract". `Team Lead` is the only role for which inheritance is the default; every other delegation MUST resolve to one of `opus`, `sonnet`, or `haiku`.
- Defaults are deliberately static. Dynamic per-task complexity scoring is **out of scope** for this design (see `## Out of scope`).

## Operator override grammar

The override grammar mirrors R14's discipline: only unambiguous tokens count. The matching rule is the same as R14 inline override — substring match on the canonical token forms only, no fuzzy interpretation.

### Canonical override tokens

The following tokens, when present in the operator prompt, override the per-role default for the next delegation only:

- `model: opus` (canonical) and aliases `use opus`, `with opus`
- `model: sonnet` (canonical) and aliases `use sonnet`, `with sonnet`
- `model: haiku` (canonical) and aliases `use haiku`, `with haiku`

Token matching is case-insensitive. Whitespace around the colon is permitted (`model:opus`, `model :opus`). The token applies to the next teammate delegation `Team Lead` performs in response to the prompt; it does NOT persist across `/superteam` invocations and does NOT change the per-role default.

### Targeted override

When the operator wants to override a specific teammate role rather than the next delegation, the targeted form is `model: <model> for <role>`, e.g. `model: opus for executor`. Without `for <role>`, the override applies to the next delegation produced by the prompt.

### What does NOT count as an override

The following framings are NOT operator overrides; `Team Lead` MUST resolve to the per-role default and MUST NOT route them through the override path:

- "use the better model"
- "go cheap" / "go fast" / "go faster"
- "use the fast model" / "fast model"
- "use the smart model" / "smart model"
- "save tokens" / "be efficient"
- "this is taking too long"
- Any phrasing that names a model family informally without the canonical token (e.g. "use Claude opus please" without `model:` or `use opus`)

This list mirrors the R14 inline-override discipline: ambiguous "inline-ish" framing is not an override, and ambiguous "model-ish" framing is not an override either. The reason is the same: fuzzy matching opens an attack surface where every adjacent operator complaint becomes a silent contract change.

### Override scope

Operator override always wins over the per-role default for the delegation it targets. After that delegation completes, subsequent delegations revert to the per-role default. There is no implicit "remember the last override" behavior.

## Binding mechanism

`Team Lead` binds the resolved model at delegation time using the host runtime's model-override mechanism. The agent-spawn template already exposes `{model}` as a placeholder; this design names the resolution rules and the binding surface.

### Resolution order

For each execute-phase or non-execute teammate delegation, `Team Lead` resolves `{model}` in this order:

1. If the operator prompt contains a canonical override token (per `## Canonical override tokens`) targeting this delegation, use the override.
2. Otherwise, use the per-role default from `## Per-teammate model defaults`.
3. If the per-role default is `inherit`, do not pass a `model` parameter; inherit from the parent session.

### Binding surfaces

- **Claude Code (`Agent` tool)**: bind by setting the `model` parameter on the `Agent` tool call to one of `sonnet`, `opus`, `haiku`. This is the canonical surface.
- **Other host runtimes**: when the host's subagent-dispatch surface accepts an analogous model parameter (e.g. `model`, `model_id`, `model_alias`), bind to that surface.

### Capability fallback

Some host runtimes do not expose a model-override mechanism on their subagent dispatch surface. The fallback rule is **inherit-and-warn**, not halt:

1. During pre-flight, `Team Lead` probes whether the active subagent-dispatch surface accepts a model-override parameter (e.g. inspecting the `Agent` tool schema, or a plugin manifest declaration).
2. If model-override capability is unavailable, `Team Lead` records `model_override_capability=unavailable` in the pre-flight output.
3. For each subsequent delegation, `Team Lead` proceeds without binding a model and surfaces a single warning per run noting that per-role defaults could not be applied because the host lacks model-override capability.
4. The run does NOT halt. Model selection is an optimization (cost, speed, fit), not a correctness gate. Halting would block the entire workflow on a host-capability gap that produces a working — if expensive — run.

This deliberately differs from R14's execution-mode capability rule, which halts execute-phase routes when no execution mode is available. Execution mode is a correctness-of-dispatch gate; model selection is a cost/fit gate. Halting the run for a missing model-override mechanism would be a worse outcome than running on the inherited parent model.

## RED-phase baseline obligation

Before this rule, the observable failure mode is:

> An `Executor` delegation prompt resolves `{model}` from the agent-spawn template using whatever value `Team Lead` had in mind — frequently nothing, in which case the spawned agent inherits the parent session model (typically Opus 4.7). The delegation prompt contains no explicit model field, the spawn-template substitution is silent, and no contract instructs `Team Lead` to pick differently.

The RED trace (without this rule) for a typical Executor delegation:

```text
Team Lead: dispatching Executor for AC-67-3 implementation
Agent({
  subagent_type: "general-purpose",
  description: "Executor: AC-67-3",
  prompt: "You are Executor. Task #3. ...",
  // no model parameter — inherits Opus from the parent session
})
```

The GREEN trace (with this rule) for the same delegation:

```text
Team Lead: dispatching Executor for AC-67-3 implementation
  resolved model: sonnet (per-role default; no operator override present)
Agent({
  subagent_type: "general-purpose",
  description: "Executor: AC-67-3",
  prompt: "You are Executor. Task #3. ...",
  model: "sonnet",
})
```

The observable difference is the explicit `model` field on the dispatch surface. Reviewer can grep delegation traces (or re-render Team Lead's resolved-model log in the operator-facing handoff when relevant) to verify that every execute-phase or non-execute teammate delegation has a resolved model that matches the per-role default or the documented operator override.

## Rationalization-table row (for SKILL.md, AC-67-3)

To be added to the existing rationalization table in SKILL.md:

| Excuse | Reality |
|--------|---------|
| "The parent model is fine, just inherit." | Per-role defaults are binding (R26). Silent inheritance is forbidden for every role except `Team Lead`. The operator's silence on which model to use is NOT permission to inherit — it means "use the per-role default". The only path to inheritance is the host runtime lacking a model-override mechanism, in which case `Team Lead` inherits-and-warns once per run. |
| "The operator said 'go faster' — that's basically asking for Sonnet." | Ambiguous framing is NOT an operator override (R26, parallel to R14). Only canonical tokens (`model: opus`, `model: sonnet`, `model: haiku`, or `use <model>` / `with <model>`) override the per-role default. "Go faster" routes to the per-role default; for `Executor` that is already Sonnet. |
| "Brainstormer's default is Opus, but the operator typed `model: sonnet`, so I'll keep Opus because the design needs reasoning." | Operator override always wins for the delegation it targets. `Team Lead` does not second-guess the operator's explicit token. Override scope is the next delegation only. |

## Red-flags bullet (for SKILL.md, AC-67-4)

To be added to the existing red-flags list in SKILL.md:

- A teammate delegation that omits a resolved `model` value (or omits the host's model-override parameter on the dispatch surface) when the per-role default is `opus`, `sonnet`, or `haiku`. Inheritance is reserved for `Team Lead` and for the inherit-and-warn capability fallback; every other delegation MUST carry an explicit model on the dispatch surface.
- Treating "go faster" / "use the cheap model" / "use the better model" / similar fuzzy framing as an operator model override.
- An execute-phase delegation that resolves `{model}` to the parent session model by default rather than to the per-role `Executor` default (`sonnet`).

## Loophole closure

Stated explicitly so future Team Lead instances cannot rationalize around the rule:

1. **Model selection is binding.** Per-role defaults are not advisory; they are the contract. The only legitimate departures are an explicit operator override (per `## Canonical override tokens`) or the inherit-and-warn capability fallback.
2. **Ambiguous framing is NOT an override.** This mirrors R14. "Go faster", "use the smart model", "save tokens", "this is taking too long" — none of these reach the override path. Only canonical tokens do. The matching rule is substring on canonical token forms; no fuzzy interpretation; no LLM-based intent inference.
3. **Operator silence is NOT permission to inherit.** "The operator didn't say which model" means "use the per-role default", not "inherit from the parent session". Inheritance is the explicit `inherit` value for `Team Lead` only, plus the inherit-and-warn capability fallback.
4. **Operator override always wins for its targeted delegation.** `Team Lead` does not override the operator with a per-role default reasoning ("but Brainstormer needs Opus"). The override scope is one delegation; defaults reassert on the next.
5. **No persistent override memory.** An override targets one delegation. There is no "the operator said opus once so use opus forever" behavior. Each delegation re-resolves from prompt + per-role default.

## Pressure tests

The design must survive these scenarios. Each is the analog of a writing-skills pressure test for this contract.

### PT-1: "go faster"

**Scenario**: Operator says "this is taking too long, go faster" while `Team Lead` is about to dispatch `Executor` for a planned implementation batch.

**Expected behavior**: `Team Lead` resolves `{model}` for `Executor` to the per-role default `sonnet` (which is already the default — no behavior change). It does NOT route the prompt through the override path. It does NOT route the prompt through the R14 inline-override path either. "Go faster" is not a token in either grammar.

**Failure signal**: `Team Lead` switches the dispatch surface to inline mode, OR `Team Lead` claims it picked Sonnet "because the operator wanted speed" rather than because Sonnet is the per-role default.

### PT-2: explicit `model: haiku` for one Executor delegation

**Scenario**: Operator types `model: haiku` for a small Executor delegation (e.g. a docs-only edit). The next Executor delegation in the same run has no override.

**Expected behavior**: The first Executor delegation binds `model: "haiku"` on the dispatch surface. The second Executor delegation reverts to the per-role default `sonnet`. There is no carry-over.

**Failure signal**: The second Executor delegation also uses `haiku`, OR the first Executor delegation falls back to `sonnet` because `Team Lead` decided Haiku was unsafe.

### PT-3: host runtime lacks model-override mechanism

**Scenario**: Hypothetical Codex-variant host runtime where the subagent-dispatch surface does not accept a `model` parameter. `Team Lead` runs `/superteam` and reaches an Executor dispatch.

**Expected behavior**: During pre-flight, `Team Lead` records `model_override_capability=unavailable`. The Executor dispatch proceeds without a `model` parameter; the spawned agent inherits the parent session model. `Team Lead` surfaces a single warning per run: "host runtime lacks model-override capability; per-role model defaults could not be applied; all delegations will inherit the parent session model". The run does NOT halt.

**Failure signal**: The run halts with a "no model-override capability" blocker, OR the warning is suppressed and the per-role defaults are silently abandoned with no operator-visible trace.

### PT-4: operator override conflicts with per-role default

**Scenario**: `Brainstormer`'s per-role default is `opus`. Operator types `model: sonnet` while requesting a Brainstormer dispatch.

**Expected behavior**: The Brainstormer delegation binds `model: "sonnet"`. Operator override always wins. `Team Lead` does NOT override the operator with the Opus default reasoning ("but the design needs Opus reasoning"). The next Brainstormer delegation, absent an override, returns to `opus`.

**Failure signal**: `Team Lead` ignores the override and uses Opus, OR `Team Lead` warns the operator that Sonnet is inappropriate for Brainstormer and asks for confirmation.

## Out of scope

- **Dynamic per-task complexity scoring**. This design uses static per-role defaults plus explicit override only. A future issue may explore dynamic selection (e.g. choosing Opus for an Executor task involving a complex refactor and Haiku for a docs-only Executor task), but that adds an inference surface that this design deliberately avoids.
- **Cost-budget enforcement**. This design does not introduce per-run or per-session model-spend limits.
- **Auto-downgrade on retry**. This design does not change model selection across retries within the same delegation.
- **Per-skill or per-task-tag overrides**. The override grammar targets teammate roles, not skill names or task tags.
- **`Team Lead` self-selection**. `Team Lead` runs on the main session; it does not delegate to itself. The `inherit` default is a placeholder for completeness, not a delegation rule.

## Adversarial review

Same-thread fallback (no separate reviewer subagent available in this Brainstormer session). Reviewed against the `superpowers:writing-skills` dimensions.

### Checked dimensions

- **RED/GREEN baseline obligation present?** Yes — `## RED-phase baseline obligation` documents the before/after dispatch trace concretely (the absence vs presence of the `model` field on the `Agent` tool call). Reviewer can grep delegation traces to verify.
- **Rationalization resistance?** Yes — `## Loophole closure` lists five explicit closures, and the rationalization-table rows close the most obvious "just inherit" and "go faster is an override" loopholes. The override grammar matches the R14 anti-fuzzy-matching discipline by name.
- **Red flags listed?** Yes — three bullets named, covering missing model on dispatch, fuzzy framing treated as override, and execute-phase delegations defaulting to inherited parent model.
- **Token-efficiency targets respected?** The SKILL.md additions are: one new section (~25 lines including the table), three rationalization-table rows, three red-flags bullets, one Team Lead duty bullet. Estimated SKILL.md growth is ~50-60 lines on a ~500-line file. Acceptable; no inflation beyond what the contract surface requires.
- **Role ownership clear?** Yes — `Team Lead` owns model resolution at delegation time. No other role binds the model. Operator owns the override token. Pre-flight owns the capability probe.
- **Stage-gate bypass paths closed?** Yes — operator silence does not bypass the per-role default; capability-unavailable is inherit-and-warn (no halt, no silent skip); ambiguous framing does not bypass the override grammar.

### Findings

| Source | Severity | Location | Finding | Disposition |
|---|---|---|---|---|
| adversarial-review | minor | `## Capability fallback` | Initial draft did not name the pre-flight probe explicitly; risk that "inherit-and-warn" becomes a silent skip if no probe runs. | Resolved in this revision: capability probe is now an explicit pre-flight step that records `model_override_capability=unavailable` and emits a single per-run warning. |
| adversarial-review | minor | `## Operator override grammar` | Initial draft did not specify whether `model: opus` is case-sensitive or whitespace-strict; risk that operator typos produce silent miss. | Resolved in this revision: matching is case-insensitive; whitespace around the colon is permitted; alias forms (`use opus`, `with opus`) are documented. |
| adversarial-review | minor | `## Per-teammate model defaults` | `Team Lead = inherit` could be read as "no contract"; risk that future readers delete the row. | Resolved in this revision: the notes under the table call out that `inherit` is a literal value reserved for `Team Lead` and not a synonym for "no contract". |
| adversarial-review | minor | `## Loophole closure` | Operator-override-wins rule could conflict with a future "model-override capability check fails for the requested model" scenario (e.g. operator asks for `haiku` on a host that only exposes `opus` and `sonnet`). | Acknowledged but not resolved here. Out of scope for this design; the override grammar assumes the host runtime accepts the named model. If the host rejects the bound model, the dispatch surface itself returns the error and `Team Lead` surfaces it. A future issue may add a model-availability sub-probe to pre-flight. |
| operator-feedback | material | `## Per-teammate model defaults` | Initial draft set `Reviewer = sonnet` framed as "pattern matching + repo-rule compliance", which under-modeled Reviewer's actual contract. Per `skills/superteam/SKILL.md` `### Reviewer`, Reviewer owns adversarial pressure-test walkthroughs (via `superpowers:writing-skills`) for `skills/**/*.md` and workflow-contract changes — deep adversarial reasoning, not bounded pattern matching. Sonnet under-models that responsibility, mirroring the Brainstormer=Opus rationale. | Resolved in this revision: Reviewer default raised to `opus`. Rationale rewritten to tie to adversarial pressure-test ownership. Hybrid (e.g. "opus for skill/workflow-contract reviews, sonnet otherwise") was considered and rejected: it adds an inference surface that operators have to track, and the existing operator-override grammar already supports `model: sonnet for reviewer` for trivial reviews. The simpler static default is preferred. |

### Clean-pass rationale

After the revisions captured above, no blocker or material findings remain. The design carries the writing-skills dimensions required for a workflow-contract change: RED/GREEN baseline obligation, rationalization resistance, red flags, token-efficiency targets, role ownership, and stage-gate bypass paths. Adversarial-review status: `findings dispositioned`.
