---
name: review-system-design
description: Presents a diff or spec's hard-to-reverse system contracts to a human reviewer in dependency-ordered rounds. Use when asked for a system design review of a diff, specification, or both.
---

Present the system design of a **scope** — a diff, a spec, or both — to a human reviewer, one batch at a time. A **contract** is the agreement crossing one seam, stated as a before/after pair. Write each state in design-by-contract terms — what the client must supply, what the supplier guarantees, what holds invariant — so both parties of the seam are named. A contract whose two states match is an **invariant** the scope stands on.

Write reviewer-facing prose — entry lines, node labels, summaries — in ASD-STE100 Simplified Technical English, inside a **closed vocabulary**: the ubiquitous language of `CONTEXT.md`, `codebase-design` terms used exactly (module, interface, seam, adapter, depth), and code identifiers as code spans. When the vocabulary lacks a term for an operation, state the operation in defined words and flag the gap as a glossary proposal (`domain-modeling`). Write **complete clauses over pointers**: every verb keeps its object, and every definite noun has an antecedent the reviewer has already seen — in the glossary or an earlier entry.

Map the scope as a **contract dependency tree**: every contract branches into the contracts that depend on it. A contract enters the tree only when all three hold: **hard to reverse** — changing it later has real cost; **surprising without context** — a future reader asks why it is this way; **a real trade-off** — genuine alternatives existed and one was chosen for reasons. A contract that misses any of the three stays out. A spec's contract table names the contracts; a diff is the truth for what changed. Derive the tree from whichever the scope gives — when both exist, reconcile them and flag any contract found only in the diff as unplanned.

The **review surface is implementation only**: production source. Test suites (`__tests__/`, `*.test.*`, `e2e/`, `maestro/`), documentation (`docs/`, `*.md`), and workspace fixtures (`packages/*/workspace/`) stay out of the tree, the entries, and the diagrams. A spec-table row that names a test, doc, or fixture is a sign-off device: drop the row and review its knobs at their owning contracts.

Work the tree in **rounds**. The tree and its traversal are your working state; the reviewer sees rounds only. A round is a heading `## <scope name> — round N of M`, then the batch's contract entries, then the invariants block (once per review), then the diagrams — nothing else; the review opens at the first round's heading. The **frontier** is every contract whose upstream contracts are already reviewed. Present the whole frontier as one batch:

1. One entry per contract. Handles run `C1`, `C2`, … in entry order, continuing across batches; the reviewer answers with them ("C4 agree"):

   ```markdown
   **C1 <Contract name> (`<code identifier>`)**

   ❓ **Why this changed:** <one or two sentences>

   ❌ **Before:** <the prior state of the seam>

   ✅ **After:** <the new state of the seam>
   ```

   Labels stay inline bold. States state; the Why line argues. A state names what the seam agrees to, in at most three sentences — the Why line carries the cause, the diff carries the mechanism, and the spec or ADR carries the design rationale; link it once. Handles name contracts; a behavior is a complete clause ("C1 can now stop before a batch"). When several entries share one cause, write it once in the first such entry's Why line and point the others at it.

2. The invariants block, in the first round after its entries: `🔒 Invariants the scope stands on, unchanged:` over a plain list of contract names.

3. Mermaid diagrams of the design around those contracts — sequence diagrams for round-trip flows, flowcharts for config and policy structure, decision flowcharts for gates and floors. Mark the previous state inside an after-diagram with a red-dashed `:::was` classDef. Node labels carry contract names, so entries and diagram cross-reference; handles stay in the entries.

Then wait for the reviewer's reply. One reply advances the batch: contracts the reviewer challenges become logged concerns, each with its agreed fix when one emerges; the rest are accepted. The scope stays frozen while the review runs — mid-review, a fix is a log entry. Recompute the frontier and present the next batch.

Finding facts is your job, never the reviewer's. When a batch needs a fact from the environment (the diff, the spec, a call site), dispatch a sub-agent to dig — the reviewer supplies only verdicts.

The review is done when every contract in the tree is visited — nothing silently unreviewed. Close with a terse summary of the concerns and their fixes, then apply the amendments the reviewer confirms. The review lives in chat; when the reviewer asks for the whole tree as a review guide, write it where they say. The guide is a one-line pointer to its review, then the contract entries in handle order, then the invariants block, then the diagrams — nothing else.
