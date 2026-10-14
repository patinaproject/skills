---
name: review-system-design
description: Present important design agreements from a diff or specification to a human reviewer in plain language and dependency order. Use when the user asks for a system design review.
---

# Review system design

Use `design-by-contract` to select and analyze each important agreement in the
changed production code. The input may be a diff, a specification, or both.

Use short, direct sentences with clear subjects and objects. Use terms already
defined in `CONTEXT.md`, exact `codebase-design` terms, and code identifiers.
When a needed term is missing, ask `domain-modeling` to propose a glossary
entry.

Build a dependency tree of the design agreements. Review an agreement before
any agreement that depends on it. When a specification and diff disagree,
treat the diff as the record of what changed and flag any unplanned agreement.

Treat production code as the source of design agreements. Use tests,
documentation, and workspace fixtures as evidence for those agreements.

Present one group at a time after reviewing everything it depends on. Use the
heading `## <change name>, round N of M`. Number agreements `A1`, `A2`, and so
on across all rounds.

Give each agreement a plain-language title followed by a small number of
connected paragraphs. Name the relevant system parts and explain how they
interact, what changed and why it matters, and the expectation or trade-off the
reviewer must judge. Include defined failure behavior when it helps that
judgment. Keep every detail relevant to the reviewer's decision. Link the
agreement's specification or ADR once.

Use a visual explainer when it makes a relationship easier to understand than
prose alone: a table for repeated mappings or comparisons, a sequence or state
diagram for interactions over time, or a dependency diagram for ordering. Pair
the visual with the explanation. End each group with a short request for
concerns or approval.

Wait for the reviewer's reply after each group. Record challenged agreements
under their plain-language titles and record each agreed fix. Treat the rest as
accepted. Keep each agreement number as a stable reference. Keep the reviewed
change fixed until the review ends. A proposed fix remains a note until the
reviewer finishes all rounds.

Find supporting facts yourself. Use a subagent when the diff, specification, or
callers require separate investigation. Research the facts, then ask the
reviewer to decide.

Finish after every agreement has been reviewed. In the same plain style,
summarize accepted agreements, concerns, and agreed fixes, then apply only the
changes the reviewer confirms. If the reviewer asks for a guide, write it at
the requested path with a link to the reviewed change, the agreements in number
order, and the selected visuals.
