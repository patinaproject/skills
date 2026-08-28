---
name: design-by-contract
description: Describe an important design decision as an agreement between a caller and the code it uses. Use when another skill or the user asks for design-by-contract analysis.
---

# Design by contract

Use a contract only for a design decision that is hard to reverse, surprising
without explanation, and based on a real trade-off.

Name the caller and the code that serves it. State:

- what the caller must provide
- what the code guarantees in return
- what must remain true while they interact
- what happens when either side breaks the agreement, if the design defines it

Do not invent missing rules. Point them out to the calling skill or user.

When comparing designs, use the same statements for both. Use prose for one
simple contract, a table for a comparison, and Mermaid only when a sequence,
state change, or dependency is hard to explain in prose.

The calling skill decides what to review, in what order, and when the work is
done. This skill describes the design. It does not choose implementation or
tests.
