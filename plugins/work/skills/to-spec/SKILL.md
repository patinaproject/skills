---
name: to-spec
description: "Turn the current conversation into a spec and publish it to the project issue tracker, applying a ready label only when the triage readiness check passes."
disable-model-invocation: true
---

This skill takes the current conversation context and codebase understanding and produces a spec. Do NOT interview the user; just synthesize what you already know. The one exception is a decision the readiness check needs a person to approve. Ask each one as a grilling question with your recommended answer.

The issue tracker and triage label vocabulary should have been provided to you. If not, tell the user to run `/setup-work-skills`.

## Process

1. Explore the repo to understand the current state of the codebase, if you haven't already. Use the project's domain glossary vocabulary throughout the spec, and respect any ADRs in the area you're touching.

2. Sketch out the seams at which you're going to test the feature. Existing seams should be preferred to new ones. Use the highest seam possible. If new seams are needed, choose them at the highest point you can. The fewer seams across the codebase, the better - the ideal number is one.

Choose the seams with your own judgment and continue without asking the user. Record them in the spec's Testing Decisions.

3. Write the spec using the template below.

4. Run the triage readiness check in [../triage/READINESS.md](../triage/READINESS.md) against the spec. Before you publish, close the gaps you can and ask about unapproved decisions, as its **Outcome** section says.

5. Publish the spec to the project issue tracker with one Type label. Then follow READINESS.md's **Record it** and **Outcome** sections: record the checklist and decisions, write the agent brief when every item holds, and apply the Triage label the outcome names. With a ready label, also apply the ready state from the issue-tracker config's **When an issue becomes ready** section.

<spec-template>

## Problem Statement

The problem that the user is facing, from the user's perspective.

## Solution

The solution to the problem, from the user's perspective.

## User Stories

A LONG, numbered list of user stories. Each user story should be in the format of:

1. As an <actor>, I want a <feature>, so that <benefit>

<user-story-example>
1. As a mobile bank customer, I want to see balance on my accounts, so that I can make better informed decisions about my spending
</user-story-example>

This list of user stories should be extremely extensive and cover all aspects of the feature.

## Implementation Decisions

A list of implementation decisions that were made. This can include:

- The modules that will be built/modified
- The interfaces of those modules that will be modified
- Technical clarifications from the developer
- Architectural decisions
- Schema changes
- API contracts
- Specific interactions

Do NOT include specific file paths or code snippets. They may end up being outdated very quickly.

Exception: if a prototype produced a snippet that encodes a decision more precisely than prose can (state machine, reducer, schema, type shape), inline it within the relevant decision and note briefly that it came from a prototype. Trim to the decision-rich parts, not a working demo, just the important bits.

## Testing Decisions

A list of testing decisions that were made. Include:

- A description of what makes a good test (only test external behavior, not implementation details)
- Which modules will be tested
- The seams the tests use, and for each new seam, why no existing seam works
- Prior art for the tests (i.e. similar types of tests in the codebase)

## Out of Scope

A description of the things that are out of scope for this spec.

## Further Notes

Any further notes about the feature.

</spec-template>
