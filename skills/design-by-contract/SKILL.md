---
name: design-by-contract
description: Analyzes and presents consequential system design as client-supplier contracts. Use when another skill or the operator requests design-by-contract analysis.
---

Treat a design area as a contract only when all three are true:

1. It is hard to reverse.
2. It is surprising without context.
3. It resolves a real trade-off.

Name the client and supplier. State what the contract **requires**, **ensures**,
and **maintains**. State violation behavior only when the design defines it.
Never invent a missing clause; expose it to the calling workflow.

For changes or alternatives, compare both states with the same clauses. Use
prose for one simple contract, a table for comparisons, and Mermaid for
sequences, states, or dependencies when it materially improves clarity. Visuals
support the clauses; they do not replace them.

This is a design overlay. The caller owns scope, ordering, interaction,
verdicts, and completion. Do not prescribe implementation or tests.
