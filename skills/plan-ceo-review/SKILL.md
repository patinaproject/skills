---
name: plan-ceo-review
description: "Use when a user asks for CEO review, founder-mode review, think bigger, strategy review, rethink this plan, is this ambitious enough, or critique of an existing product, strategy, roadmap, or implementation plan."
---

# CEO Plan Review

Pressure-test a plan that already exists. Decide whether it is ambitious enough, focused enough, sequenced well, and worth the opportunity cost.

Be opinionated. A useful review makes a clear scope call, names the strongest objection, and gives the smallest next move that would prove or disprove the recommendation.

## When to Use

- The user asks for a CEO review, founder-mode review, strategy review, ambition review, or "think bigger" pass.
- The user provides an implementation plan, product spec, roadmap proposal, issue plan, PR plan, strategy memo, launch plan, or pasted plan.
- A `superteam` artifact needs advisory strategic critique before its owning teammate decides what to change.

## When Not to Use

- The user has only an idea and no plan. Ask for the plan, or route to `office-hours` for pre-plan discovery.
- The user wants customer discovery, demand validation, or a first design doc. Use `office-hours`.
- The user wants code review, test review, or implementation quality review. Use the repo's review workflow.
- Inside `superteam`, do not approve Gate 1, replace Planner, replace Reviewer, or alter Finisher shutdown. This skill is advisory only.

## Inputs

Identify the artifact before reviewing. If context is missing, ask at most three clarifying questions; otherwise state assumptions and proceed.

- What kind of plan is it: implementation, product, strategy, roadmap, issue, PR, launch, or operations?
- Who benefits: user, buyer, operator, maintainer, teammate, or sponsor?
- What outcome, constraint, and evidence matter most?

## Review Modes

Choose exactly one mode for the verdict.

| Mode | Use When | Behavior |
| --- | --- | --- |
| `Expand` | Directionally right, but too local | Name the larger bet and the smallest credible move toward it |
| `Selectively expand` | Core scope is right, but one missing move would add leverage | Keep the center, add the highest-leverage move, gate later expansion |
| `Hold` | Scope is right and execution discipline matters most | Tighten premise, success criteria, sequencing, and surprise risk |
| `Reduce` | Plan is overloaded, premature, or trying to solve too much | Strip to the essential wedge and defer what has not earned its cost |

## Workflow

1. Restate the plan in one sentence, using the user's concrete nouns.
2. Identify the outcome that would make the work matter.
3. Test the premise: what assumption, if false, makes the plan wasteful?
4. Test ambition: does this create a meaningful change or only tidy the local surface?
5. Test scope: should the plan expand, selectively expand, hold, or reduce?
6. Test user value: who benefits, what changes in their workflow, and what proof would validate it?
7. Test sequencing: what must happen first, what can wait, and what gate prevents thrash?
8. Test risks: premise, product, execution, and opportunity cost.
9. Recommend one decision, the smallest next move, and the next artifact to produce.

Keep the review concrete. Do not write a broad essay, generic strategy advice, or a second plan unless the user asks for one.

## Calibration

- `Expand`: "This solves the admin problem, but the bigger bet is becoming the weekly operating review."
- `Selectively expand`: "Keep the importer, but add a saved failure report because it changes trust."
- `Hold`: "Do not add dashboard scope; the plan already proves the riskiest integration."
- `Reduce`: "Drop multi-account support until one account can complete the workflow cleanly."

## Output

Use these headings:

- `Verdict`: one mode plus one-sentence rationale.
- `Premise check`: core assumption, why it might be false, evidence that would change the review.
- `Ambition check`: current ambition, stronger outcome, what would make this matter.
- `Scope decision`: add, keep, defer, remove.
- `User value`: beneficiary, workflow change, validating proof.
- `Sequencing`: first move, later moves, decision gates.
- `Risks`: premise, product, execution, and opportunity-cost risks.
- `Recommendation`: decision, smallest next move, next artifact to produce.

If a field does not apply, write `None` and explain why in one phrase.

## Red Flags

- The plan optimizes an internal artifact but cannot name a user workflow that improves.
- The plan adds architecture, process, or polish before proving the premise.
- The plan says "platform" but lacks a narrow wedge.
- The plan is busy, but the expected outcome is small.
- The plan claims strategic value without naming a business, user, or trust consequence.
- The review stays neutral when the plan needs a decision.
- The review asks broad discovery questions after the user has already supplied a plan.
