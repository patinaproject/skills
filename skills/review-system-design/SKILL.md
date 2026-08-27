---
name: review-system-design
description: Present important design contracts from a diff or specification to a human reviewer in dependency order. Use when the user asks for a system design review.
---

# Review system design

Use `design-by-contract` to describe each important agreement in the changed
production code. The input may be a diff, a specification, or both.

Write in ASD-STE100 Simplified Technical English. Use terms already defined in
`CONTEXT.md`, exact `codebase-design` terms, and code identifiers. When a needed
term is missing, ask `domain-modeling` to propose a glossary entry. Write full
sentences with clear subjects and objects.

Build a dependency tree of the design contracts. Review a contract before any
contract that depends on it. When a specification and diff disagree, treat the
diff as the record of what changed and flag any unplanned contract.

Review production code only. Tests, documentation, and workspace fixtures may
provide evidence, but they are not separate design contracts.

Present one ready group at a time under
`## <change name>, round N of M`. Number contracts `C1`, `C2`, and so on across
all rounds. For each contract:

- use `design-by-contract`
- explain why it changed in one or two sentences
- link its specification or ADR once
- add a visual only when it makes the design easier to understand

Wait for the reviewer's reply after each group. Record challenged contracts and
their agreed fixes. Treat the rest as accepted. Keep the reviewed change fixed
until the review ends. A proposed fix remains a note until the reviewer finishes
all rounds.

Find supporting facts yourself. Use a subagent when the diff, specification, or
callers require separate investigation. Ask the reviewer for decisions, not
research.

Finish after every contract has been reviewed. Summarize concerns and agreed
fixes, then apply only the changes the reviewer confirms. If the reviewer asks
for a guide, write it at the requested path with one review pointer, the
contracts in number order, and the selected visuals.
