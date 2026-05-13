# Design: Create an independent CEO plan review skill [#63](https://github.com/patinaproject/skills/issues/63)

## Summary

Create a new Patina-owned `plan-ceo-review` skill at `skills/plan-ceo-review/SKILL.md`. The skill gives an agent a founder-mode review process for product, strategy, and implementation plans: challenge the premise, test ambition, decide whether to expand or reduce scope, and return a concrete recommendation with next steps. It may cite the upstream gstack plan review skill as inspiration in planning notes, but the implementation must be original and must not depend on gstack commands, runtime checks, telemetry, local state, generated preambles, branding, or file layout.

The skill should feel adjacent to `office-hours` but not duplicate it. `office-hours` helps discover whether an idea is worth building before code. `plan-ceo-review` reviews an existing plan and pressure-tests whether it is ambitious enough, focused enough, sequenced well, and valuable enough to justify the work. It should also be usable inside `superteam` as a strategy review surface before or after a plan exists, without changing `superteam` gates.

## Goals

- Add a fifth in-repo flat skill named `plan-ceo-review`.
- Provide an original Patina-native workflow for reviewing plans from a CEO/founder perspective.
- Cover ambition, scope, user value, sequencing, risk, and next steps.
- Include clear mode selection for expanding scope, selectively expanding scope, holding scope, and reducing scope.
- Make the skill discoverable from Claude, Codex, and local dogfood overlays.
- Keep the skill concise enough to load cheaply while still carrying strong review behavior.

## Non-Goals

- Do not copy, vendor, paraphrase section-by-section, or mechanically translate the gstack skill.
- Do not add gstack-specific commands, telemetry, config files, analytics writes, session files, generated preambles, update checks, or local state paths.
- Do not change `superteam` orchestration gates or treat CEO review as approval for any existing `superteam` gate.
- Do not turn `plan-ceo-review` into customer discovery. If the user has no plan yet, route them to `office-hours`.
- Do not add scripts unless implementation proves deterministic automation is needed. The first version should be a lean Markdown skill.

## Acceptance Criteria

### AC-63-1

A new Patina-owned skill exists at a flat `skills/plan-ceo-review/SKILL.md` path with YAML metadata and original workflow instructions. The `description` must include trigger language such as "CEO review", "founder-mode review", "think bigger", "strategy review", "rethink this plan", and "is this ambitious enough" so the skill is discoverable when users ask for strategic plan critique.

### AC-63-2

The skill is independent from gstack. It must not require or mention gstack commands, gstack config, `~/.gstack`, telemetry, analytics, update checks, local session files, generated boilerplate, or gstack-branded runtime behavior. The skill may include a short provenance note in implementation documentation or PR text that the issue was inspired by the public upstream concept, but the skill body itself should stand alone as Patina-authored instructions.

### AC-63-3

The skill gives agents a practical CEO/founder-mode review process covering:

- Ambition: whether the plan aims at a meaningful outcome or settles for a local improvement.
- Scope: whether to expand, selectively expand, hold, or reduce.
- User value: who benefits, what changes for them, and what proof would validate the bet.
- Sequencing: what must happen first, what can wait, and what decision gates prevent thrash.
- Risks: premise risks, product risks, execution risks, and opportunity-cost risks.
- Recommended next steps: a clear decision, the smallest next move, and evidence that would change the recommendation.

### AC-63-4

Marketplace and dogfood surfaces are updated so the new skill is discoverable with the other in-repo skills:

- `.claude-plugin/plugin.json` includes `./skills/plan-ceo-review`.
- `.codex-plugin/plugin.json` includes the same skill path in the same order as Claude.
- `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json` descriptions mention `plan-ceo-review` if they enumerate included skills.
- `.agents/skills/plan-ceo-review` and `.claude/skills/plan-ceo-review` symlink to `../../skills/plan-ceo-review`.
- `scripts/verify-dogfood.sh` treats the repository as owning five in-repo skills.

### AC-63-5

Repository verification passes after implementation:

- `pnpm verify:dogfood`
- `pnpm verify:marketplace`
- `find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort`

The `find` output must include exactly the five in-repo skill entry points unless a later approved design explicitly changes the repository's skill count.

## Proposed Skill Behavior

The skill should run a structured review, not a broad brainstorming session. The agent first identifies what artifact it is reviewing: an implementation plan, product spec, strategy memo, issue, PR description, roadmap item, or pasted plan. If there is no plan, it asks for one or routes to `office-hours`.

The skill then classifies the review into one of four modes:

- `Expand`: the plan is directionally right but under-ambitious. The review proposes the larger product bet and the smallest credible step toward it.
- `Selectively expand`: the plan should hold its core scope but borrow one or two high-leverage moves from a bigger vision.
- `Hold`: the plan is appropriately scoped. The review tightens assumptions, sequencing, and success criteria.
- `Reduce`: the plan is overloaded or premature. The review strips it to the essential wedge and names what to defer.

The output should be opinionated and useful in one pass. It should include:

- `Verdict`: one of the four modes with a one-sentence rationale.
- `Premise check`: the assumption most likely to be false, plus evidence that would change the review.
- `Ambition check`: what a stronger version would accomplish.
- `Scope decision`: what to add, keep, defer, or remove.
- `User value`: the person or workflow that becomes better, faster, cheaper, more delightful, or more strategically important.
- `Sequencing`: first move, later moves, and decision gates.
- `Risks`: the top risks by category.
- `Recommendation`: concrete next steps and the next artifact to produce.

## Skill Structure

The first implementation should be a single `SKILL.md` plus optional host metadata only if the repository already requires it for new skills. Do not create a README, examples directory, scripts directory, or extra reference files for the first version.

Recommended `SKILL.md` shape:

1. YAML frontmatter:
   - `name: plan-ceo-review`
   - `description:` one concise paragraph naming when to use it and its trigger phrases.
2. `# CEO Plan Review`
3. `## When to Use`
4. `## When Not to Use`
5. `## Inputs`
6. `## Review Modes`
7. `## Workflow`
8. `## Output`
9. `## Red Flags`

Keep the skill body under roughly 350 lines. The body should contain enough examples to calibrate the agent, but no long sample reports.

## Integration Notes

`office-hours` relationship: `office-hours` remains the pre-plan idea interrogation skill. `plan-ceo-review` should say to use `office-hours` when the user has only an idea, no plan, or no evidence of demand. `office-hours` does not need to call `plan-ceo-review` in this issue unless the Executor finds a small cross-reference worthwhile and low risk.

`superteam` relationship: `plan-ceo-review` can review a spec or plan, but it does not approve Gate 1, replace Planner, bypass Reviewer, or alter Finisher shutdown. If `superteam` uses it later, it should be an advisory review surface whose findings route through the existing teammate owner for spec-level, plan-level, or implementation-level feedback.

Marketplace relationship: this repository currently validates both Claude and Codex plugin manifests and the dogfood symlink overlays. Adding the skill requires updating all surfaces that enumerate in-repo skills, including verification scripts whose messages still say "four".

## Workflow-Contract Review Dimensions

### RED/GREEN Baseline Obligations

RED baseline for implementation:

- The new skill is absent from `skills/`.
- Existing verification expects four skills.
- Marketplace manifests list four skills.
- Dogfood overlays do not expose the new skill.

GREEN target:

- `skills/plan-ceo-review/SKILL.md` exists and has `name: plan-ceo-review`.
- All marketplace and dogfood enumerations include the fifth skill.
- Verification scripts pass without special casing.
- The skill runs as standalone instructions with no external runtime dependency.

### Rationalization Resistance

Implementation must resist these shortcuts:

- "The upstream skill is public, so close paraphrase is fine." It is not. Write original Patina instructions.
- "A link to the upstream skill is enough." It is not. Agents need a first-class local workflow.
- "Marketplace validation passing is enough." It is not. Dogfood symlinks and `verify-dogfood` must also prove local discoverability.
- "CEO review can approve superteam plans." It cannot. It is advisory unless a later issue changes `superteam`.
- "Telemetry/update/local-state code is harmless if optional." It is out of scope and should not exist.

### Red Flags

- Any occurrence of `gstack`, `~/.gstack`, `gbrain`, `telemetry`, `analytics`, `session`, or `update-check` inside `skills/plan-ceo-review/SKILL.md`, except if a verification comment explicitly names forbidden strings.
- The skill asks broad discovery questions when the user already supplied a plan, instead of reviewing the plan.
- The output is neutral when a clear scope decision is needed.
- The review mode names exist but do not change behavior.
- The skill duplicates `office-hours` instead of specializing in plan review.
- Marketplace manifests diverge between Claude and Codex.
- `scripts/verify-dogfood.sh` still claims there are four in-repo skills.

### Token-Efficiency Targets

- Keep `SKILL.md` concise: target 150 to 350 lines.
- Prefer checklists and short examples over long theory.
- Do not include the upstream source text.
- Avoid bundled reference files in the first version.
- Use one output template, not separate templates for every mode.

### Role Ownership

- `Brainstormer` owns this design artifact and the acceptance criteria.
- `Planner` owns the implementation plan and task breakdown.
- `Executor` owns the new skill, manifest edits, symlinks, and verification-script updates.
- `Reviewer` owns local review for independence, discoverability, and verification risk.
- `Finisher` owns PR publication, CI, external feedback routing, and shutdown.

### Stage-Gate Bypass Paths

The implementation must not use `plan-ceo-review` to bypass existing workflow gates:

- It does not replace `office-hours` discovery when no plan exists.
- It does not replace `superteam` Brainstormer approval.
- It does not replace Planner's implementation plan.
- It does not replace Reviewer's pre-publish review.
- It does not let Finisher ignore CI or PR feedback.

## Verification Plan

Executor should run:

```bash
pnpm verify:dogfood
pnpm verify:marketplace
find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort
```

Executor should also inspect the new skill for forbidden gstack coupling:

```bash
rg -n "gstack|~/.gstack|gbrain|telemetry|analytics|update-check|session" skills/plan-ceo-review/SKILL.md
```

The expected result is no matches, unless the final implementation intentionally places a forbidden-string check outside the skill body.

## Open Questions

- Should the root README's skill table mention `plan-ceo-review` in this issue? The acceptance criteria do not require it, but the repository currently uses the README as a user-facing skill index. Planner should decide whether to include it as part of discoverability.
- Should `office-hours` include a small "use `plan-ceo-review` when a plan already exists" cross-reference? This is useful but not required by the issue.
- Should the marketplace description list every included skill or stay generic? If it lists skills, it must include the new one.

## Adversarial Review

Review context: same-thread fallback.

Dimensions checked:

- RED/GREEN baseline obligations: clean. The design names the current failing surfaces and the target passing surfaces.
- Rationalization resistance: clean. The design explicitly blocks copying, linking-only, runtime coupling, and gate bypass.
- Red flags: clean. The design gives concrete strings and behavioral failures for Reviewer and Executor to check.
- Token-efficiency targets: clean. The design keeps the proposed skill lean and avoids extra resources.
- Role ownership: clean. The design assigns work to Brainstormer, Planner, Executor, Reviewer, and Finisher.
- Stage-gate bypass paths: clean. The design preserves `office-hours` and `superteam` authority boundaries.

Findings: no approval-blocking findings remain.
