---
name: plan-ceo-review
description: "Review an existing product, strategy, or implementation plan from a CEO/founder perspective. Use for CEO review, founder-mode review, think bigger, strategy review, rethink this plan, or is this ambitious enough requests."
---

# CEO Plan Review

Use this skill to pressure-test a plan that already exists. Your job is to decide whether the plan is ambitious enough, focused enough, sequenced well, and worth the opportunity cost.

Be opinionated. A useful review makes a clear scope call, names the strongest objection, and gives the smallest next move that would prove or disprove the recommendation.

## When to Use

- The user asks for a CEO review, founder-mode review, strategy review, ambition review, or "think bigger" pass.
- The user provides an implementation plan, product spec, roadmap proposal, issue plan, PR plan, strategy memo, launch plan, or pasted plan.
- The user asks whether a plan is too small, too broad, too cautious, too complex, or sequenced poorly.
- A `superteam` artifact needs advisory strategic critique before its owner decides what to change.

## When Not to Use

- The user has only an idea and no plan. Ask for the plan, or route to `office-hours` for pre-plan discovery.
- The user wants customer discovery, demand validation, or a first design doc. Use `office-hours`.
- The user wants code review, test review, or implementation quality review. Use the repo's review workflow.
- Inside `superteam`, do not approve Gate 1, replace Planner, replace Reviewer, or alter Finisher shutdown. This skill is advisory only.

## Inputs

Identify the artifact before reviewing:

- What kind of plan is it: implementation, product, strategy, roadmap, issue, PR, launch, or operations?
- Who is the intended beneficiary: user, buyer, operator, maintainer, teammate, or business sponsor?
- What outcome does the plan claim to create?
- What constraint matters most: time, risk, quality, trust, distribution, cost, or learning?
- What evidence is already present: usage, revenue, support pain, customer quotes, internal urgency, benchmark, or none?

If the plan is missing critical context, ask at most three clarifying questions. If you can review with stated assumptions, proceed and mark those assumptions in the output.

## Review Modes

Choose exactly one mode for the verdict.

### Expand

Use when the plan is directionally right but too local. The plan solves a small symptom while a larger outcome is nearby.

Behavior:

- Name the bigger product or strategic bet.
- Identify the smallest credible move toward that bigger bet.
- Preserve only the current work that compounds into the larger outcome.
- Challenge the user to measure a meaningful behavior change, not just task completion.

### Selectively Expand

Use when the core plan is right but one or two additions would materially improve leverage.

Behavior:

- Keep the current center of gravity.
- Add only the highest-leverage missing move.
- Explain why other expansions should wait.
- Define the decision gate that decides whether to expand further.

### Hold

Use when the plan is appropriately scoped and the best move is execution discipline.

Behavior:

- Tighten the premise, success criteria, and sequencing.
- Remove ambiguity without increasing scope.
- Name the one risk most likely to surprise the team.
- Protect the plan from ambition theater and unnecessary polish.

### Reduce

Use when the plan is overloaded, premature, or trying to solve too many problems at once.

Behavior:

- Strip the work to the essential wedge.
- Name what to defer and why it can safely wait.
- Replace broad deliverables with a sharper proof point.
- Protect the team from spending effort before the premise earns it.

## Workflow

1. Restate the plan in one sentence, using the user's concrete nouns.
2. Identify the outcome that would make the work matter.
3. Test the premise: what assumption, if false, makes the plan wasteful?
4. Test ambition: does this create a meaningful change or only tidy the local surface?
5. Test scope: should the plan expand, selectively expand, hold, or reduce?
6. Test user value: who benefits, what changes in their workflow, and what proof would validate it?
7. Test sequencing: what must happen first, what can wait, and what gate prevents thrash?
8. Test risks: premise, product, execution, and opportunity cost.
9. Recommend one decision and the smallest next move.

Keep the review concrete. Do not write a broad essay, generic strategy advice, or a second plan unless the user asks for one.

## Output

Use this template.

```markdown
## Verdict

<Expand | Selectively expand | Hold | Reduce>: <one-sentence rationale.>

## Premise check

- Core assumption:
- Why it might be false:
- Evidence that would change this review:

## Ambition check

- Current ambition:
- Stronger outcome:
- What would make this matter:

## Scope decision

- Add:
- Keep:
- Defer:
- Remove:

## User value

- Beneficiary:
- Workflow change:
- Validating proof:

## Sequencing

- First move:
- Later moves:
- Decision gates:

## Risks

- Premise risk:
- Product risk:
- Execution risk:
- Opportunity-cost risk:

## Recommendation

- Decision:
- Smallest next move:
- Next artifact to produce:
```

If a section does not apply, write `None` and explain why in one phrase. Do not leave blanks.

## Red Flags

- The plan optimizes an internal artifact but cannot name a user workflow that improves.
- The plan adds architecture, process, or polish before proving the premise.
- The plan says "platform" but lacks a narrow wedge.
- The plan is busy, but the expected outcome is small.
- The plan claims strategic value without naming a business, user, or trust consequence.
- The plan expands because expansion feels exciting, not because it increases leverage.
- The plan reduces because reduction feels safer, not because the extra scope lacks proof.
- The review stays neutral when the plan needs a decision.
- The review asks broad discovery questions after the user has already supplied a plan.
