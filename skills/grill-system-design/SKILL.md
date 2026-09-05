---
name: grill-system-design
description: Question the user about important system design decisions, then prepare the decided design for a specification. Use when a design needs a focused interview before it can be specified.
---

# Grill system design

1. Before interviewing the operator, read and apply `grill-to-spec`'s
   [question boundary](../grill-to-spec/SKILL.md#question-boundary). It is the
   single authority for ADR mechanics and operator questions in this flow.
2. Run `design-by-contract` to identify the important agreements in the design.
3. Run `grill-to-spec` through its completion criteria and final message. It
   owns the interview, confirmation of shared understanding, and `/to-spec`
   handoff.
