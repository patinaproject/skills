---
name: grill-system-design
description: Question the user about important system design decisions, then prepare the decided design for a specification. Use when a design needs a focused interview before it can be specified.
---

# Grill system design

1. Before interviewing the operator, load `/grilling` and `domain-modeling`.
   They own the question boundary, ADR mechanics, and operator questions in
   this flow.
2. Run `design-by-contract` to identify the important agreements in the design.
3. When the design is settled, hand off to `to-issue` when the result needs an
   issue. Keep the worktree unchanged until the handoff is complete.
