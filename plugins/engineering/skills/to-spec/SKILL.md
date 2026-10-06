---
name: to-spec
description: Turn the current conversation into a grounded spec or tracker issue and publish it through the configured tracker. Use when work needs a new spec or issue.
disable-model-invocation: true
---

# Write a spec or issue

Synthesize the current conversation and codebase into a spec or tracker issue.
Do not interview the operator about the product requirement. Ask only for
approval of new names that are hard to reverse.

The issue tracker and triage label vocabulary come from the repository's
`docs/issue-tracker.md` adapter. Do not select a provider from memory or call a
provider API directly.

## Process

### 1. Gather context

Work from the conversation and the codebase. Use the project's domain glossary
vocabulary and respect relevant ADRs. Read `docs/issue-tracker.md`,
`docs/issue-publishing.md`, relevant context files, and relevant ADRs before
drafting.

Resolve one explicit existing issue when the conversation names one. Fetch its
current body, comments, and relationships before editing it. Search issue
titles and full text with several meaningful problem terms before creating a
new issue. If a strong duplicate exists, stop and report it for operator review.

### 2. Review hard-to-reverse names

List every new name that an implementation or deployment would be costly to
change later: published packages and directories, workspaces, deployed
resources, hostnames and routes, bindings, environment variables and secrets,
public types and APIs, and outputs consumed by another system. Mark each name
`existing` or `new`. Keep existing names unless a strong reason supports a
change. Ask the operator to approve every new name before mutation, then use
approved names exactly.

### 3. Sketch testing seams

Prefer existing seams and the highest suitable seam. If a new seam is needed,
propose it at the highest level possible. Keep the seam count as small as the
behavior allows. Include the testing decision in the spec.

### 4. Draft the spec

Use this order and omit optional sections with no content:

## Problem Statement

Describe the problem from the user's perspective.

## Solution

Describe the observable result from the user's perspective.

## Context

Record the evidence that limits the interpretation of the requirement.

## Business rules

State every grounded rule in one line. Follow the lines with a `gherkin` block.
The block must contain `Feature`, an optional `Background`, and one or more
`Scenario` or `Scenario Outline` entries with `Examples` when needed. Cover the
main case and every edge case grounded in the code, issue, or conversation. Do
not turn an open question into a settled scenario.

## User Stories

Write a numbered list in this form:

1. As an `<actor>`, I want a `<feature>`, so that `<benefit>`.

Cover the meaningful user-facing aspects of the work.

## Implementation Decisions

Record supported module, interface, architecture, schema, and contract
choices. Do not include file paths or code snippets. A prototype-produced state
machine, reducer, schema, or type shape may be included when prose cannot state
the decision precisely; keep only the decision-rich part.

## Testing Decisions

Describe the external behavior that makes a good test, the highest seam to use,
and relevant prior art. Test behavior rather than implementation details.

## Out of Scope

Record exclusions that keep the spec focused.

## Open Questions

List rules that the code, issue, and conversation do not settle. Do not invent
answers.

## ADR Proposals

When the conversation settles a durable architecture decision, add a file-ready
proposal in the repository ADR format using the originating issue identifier.

## Glossary Proposals

When the conversation settles a shared domain term, add a file-ready proposal
in the owning context format with its definition and `_Avoid_` terms.

## Approved Names

List each approved new name and each existing name that constrains the work.

### 5. Format the description visually

After grounding the requirements, invoke `show-me` to choose the smallest useful
visual for the proposed behavior. Place each visual beside the text it
explains. Keep Business rules, Gherkin scenarios, acceptance criteria, and
publishing guardrails unchanged.

### 6. Publish and verify

Apply the publishing guardrails before mutation. Resolve destination teams,
labels, planning fields, and relationship targets through the adapter. Use live
labels only. Refuse private-repository, credential, or customer-data leaks.

For a new issue, publish the complete body through the adapter. New public work
enters GitHub's native `needs-triage` state unless the operator has established
that the brief is ready; do not apply a ready label by default. Verify the
created issue, body, labels, lifecycle state, and native relationships.

For an existing issue with no `Business rules` section, add only the missing
Business rules section and its Gherkin block unless the operator requests
another change. Verify that no new issue was created.

Report the issue identifier and URL, tracker, lifecycle state, duplicate search,
naming approvals, and verification result. Report open questions and any
guardrail that stopped publication.
