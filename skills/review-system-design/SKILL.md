---
name: review-system-design
description: Present important design agreements from a diff or specification to a human reviewer in dependency order. Use when the user asks for a system design review.
---

# Review system design

Use `design-by-contract` to describe each important agreement in the changed
production code. The input may be a diff, a specification, or both.

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
heading
`## <change name>, round N of M`. Number agreements `A1`, `A2`, and so on across
all rounds. For each agreement:

- use `design-by-contract`
- explain why it changed in one or two sentences
- link its specification or ADR once
- add a visual only when it makes the design easier to understand

Wait for the reviewer's reply after each group. Record challenged agreements and
their agreed fixes. Treat the rest as accepted. Keep the reviewed change fixed
until the review ends. A proposed fix remains a note until the reviewer finishes
all rounds.

Find supporting facts yourself. Use a subagent when the diff, specification, or
callers require separate investigation. Ask the reviewer for decisions, not
research.

Finish after every agreement has been reviewed. Summarize concerns and agreed
fixes, then apply only the changes the reviewer confirms. If the reviewer asks
for a guide, write it at the requested path with a link to the reviewed change,
the agreements in number order, and the selected visuals.
