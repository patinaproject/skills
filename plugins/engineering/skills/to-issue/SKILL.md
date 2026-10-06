---
name: to-issue
description: Turn the current conversation into a tracker issue with grounded business rules and Gherkin scenarios. Use when work needs a new issue or an existing issue needs its missing business rule section.
---

# Write an issue

Synthesize the current conversation and the codebase. Do not interview the
operator about the product requirement. Ask only for approval of new names that
are hard to reverse.

## Read before writing

Read these sources before you draft the issue:

- `docs/issue-tracker.md` for the tracker adapter and lifecycle.
- `docs/issue-publishing.md` for body framing, acceptance criteria, and guardrails.
- `docs/domain.md`, `CONTEXT-MAP.md`, `CONTEXT.md`, and affected context files.
- Relevant records in `docs/adr/` and the domain-modeling ADR and glossary formats.

Use the canonical domain terms. Respect existing decisions. Do not put file
paths or code snippets in implementation decisions.

## Choose the issue target

Use the tracker adapter. Do not choose a provider from memory or call a
provider API directly.

1. Resolve one explicit existing issue when the conversation names one.
2. Fetch its current body and relationships before editing it.
3. Search titles and full text with several meaningful problem terms before you
   create a new issue.
4. If a strong duplicate exists, stop and report it for operator review.
5. If an existing issue has no `Business rule` section, update that issue with
   the new section and do not create another issue.
6. If no existing issue is the target, prepare one new issue through the
   adapter.

The adapter decides GitHub Issues for public repositories and Linear team PAT
for private repositories. The skill does not select the tracker.

## Review hard-to-reverse names

Complete this review before any issue mutation. List every name that an
implementation or deployment would be costly to change later. Group names by
category:

- Published package names and directories.
- Workspace names.
- Deployed resource names and preview-name patterns.
- Hostnames and routes.
- Binding names.
- Environment variable and secret names.
- Output names consumed by another system.
- Public type and API names.

Mark each name `existing` or `new`. Keep an existing name unless a strong
reason supports a change. Ask the operator to approve each `new` name or give a
replacement. Do not write the issue until every new name has approval. Put the
approved names in the issue exactly as approved.

## Draft the body

Use this order. Omit an optional section when it has no content.

### Problem

Describe the current gap, risk, or confusion and its impact.

### Desired outcome

Describe the observable result that resolves the problem.

### Context

Record the evidence that limits the interpretation of the requirement.

### Business rule

State every grounded rule in one line. Follow the lines with one `gherkin`
block. The block must contain `Feature`, an optional `Background`, and a
`Scenario` or `Scenario Outline` with `Examples` when an outline needs them.
Cover the main case and every edge case grounded in the code, issue, or
conversation. Do not turn an open question into a settled scenario.

### Format the description visually

After you ground the requirements, invoke `show-me` to choose the smallest
useful visual for the proposed behavior. Place each visual beside the text it
explains. Keep the business rules, Gherkin scenarios, acceptance criteria, and
publishing guardrails unchanged. Use a diagram, flow, table, or focused HTML
artifact only when it makes a boundary or behavior easier to understand.

### Open questions

List each rule that the code, issue, and conversation do not settle. Do not
invent a rule to fill a gap.

### Acceptance criteria

Use observable Given / When / Then criteria. Link tests to the issue with the
repository's issue-test-tag convention.

### User stories

Keep the numbered actor, need, and benefit stories from the conversation.

### Implementation decisions

Record only decisions that the evidence supports. Describe modules, interfaces,
architecture, schemas, and contracts without file paths or code snippets.

### Testing decisions

Name the public behavior to test, the highest suitable seam, and relevant prior
art. Do not prescribe tests for implementation details.

### Out of scope

Record exclusions that keep the issue focused.

### ADR proposals

When the conversation settles a durable architecture decision, add a file-ready
proposal in the repository ADR format. Use the originating issue identifier in
the filename. State the decision, its context, and its consequences. Do not
ask the operator how to name or structure an ADR.

### Glossary proposals

When the conversation settles a shared domain term, add a file-ready proposal
in the owning context format. Include the definition and `_Avoid_` terms. Do
not change the glossary silently. The implementing work applies the approved
proposal through the domain-document workflow.

### Approved names

List each approved new name and each existing name that constrains the work.
The implementing agent uses these names without change.

## Publish and verify

Apply the publishing guardrails before mutation. Resolve the destination team,
labels, planning fields, and relationship targets through the adapter. Use live
labels only. Refuse private-repository, credential, or customer-data leaks.

For a new issue, publish through the adapter with the complete body. New work
enters the native triage state unless the operator has established that the
brief is ready. Do not apply a ready label by default. Verify the created issue,
body, labels, lifecycle state, and native relationships after publication.

For an existing issue, apply only the missing `Business rule` section unless
the operator requests another change. Verify that the issue has the one-line
rules and the Gherkin block, and verify that no new issue was created.

Report the issue identifier and URL, tracker, lifecycle state, duplicate
search, naming approvals, and verification result. Report open questions and
any guardrail that stopped publication.
