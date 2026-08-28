---
name: review-system-design
description: Present important design agreements from a diff or specification to a human reviewer in plain language and dependency order. Use when the user asks for a system design review.
---

# Review system design

Use `design-by-contract` to select and analyze each important agreement in the
changed production code. Keep its client-supplier clauses as an internal
reasoning model. The input may be a diff, a specification, or both.

Use short, direct sentences with clear subjects and objects. Use terms already
defined in `CONTEXT.md`, exact `codebase-design` terms, and code identifiers.
When a needed term is missing, ask `domain-modeling` to propose a glossary
entry.

Build a dependency tree of the design agreements. Review an agreement before
any agreement that depends on it. When a specification and diff disagree,
treat the diff as the record of what changed and flag any unplanned agreement.

Review production code only. Tests, documentation, and workspace fixtures may
provide evidence, but they are not separate design agreements.

Present one group at a time after reviewing everything it depends on. Use the
heading `## <change name>, round N of M`. Number agreements `A1`, `A2`, and so
on across all rounds.

Give each agreement a plain-language title followed by a small number of
connected paragraphs. Name the relevant system parts and explain how they
interact, what changed and why it matters, and the expectation or trade-off the
reviewer must judge. Include defined failure behavior only when it helps that
judgment. Link the agreement's specification or ADR once.

The reviewer sees an explanation, not the contract form. Do not repeat
**Client**, **Supplier**, **Requires**, **Ensures**, **Maintains**, or
**Violation behavior** fields, and do not turn those fields into an unlabeled
checklist. Include only facts that matter to the decision. Add a visual only
when it makes a relationship easier to understand than the prose. End each
group with a short request for concerns or approval.

Wait for the reviewer's reply after each group. Record challenged agreements
under their plain-language titles and record each agreed fix. Treat the rest as
accepted. Keep each agreement number as a stable reference. Keep the reviewed
change fixed until the review ends. A proposed fix remains a note until the
reviewer finishes all rounds.

Find supporting facts yourself. Use a subagent when the diff, specification, or
callers require separate investigation. Ask the reviewer for decisions, not
research.

Finish after every agreement has been reviewed. In the same plain style,
summarize accepted agreements, concerns, and agreed fixes, then apply only the
changes the reviewer confirms. If the reviewer asks for a guide, write it at
the requested path with a link to the reviewed change, the agreements in number
order, and the selected visuals.
