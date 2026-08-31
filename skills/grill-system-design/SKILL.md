---
name: grill-system-design
description: Question the user about important system design decisions, then prepare the decided design for a specification. Use when a design needs a focused interview before it can be specified.
---

# Grill system design

1. Reserve operator questions for system design choices and domain language.
   Own the ADR mechanics: read the target repository's ADR authorities and
   current records, then decide whether to create, amend, or supersede an ADR,
   which issue identifier and location it uses, and how to name and structure
   it. NEVER ask the operator to make those decisions. Report what you decided
   and wrote.
2. Run `design-by-contract` to identify the important agreements in the design.
3. Run `grill-to-spec` to question the user and prepare the decided result for
   `/to-spec`.
