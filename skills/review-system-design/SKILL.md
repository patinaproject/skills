---
name: review-system-design
description: Presents a diff or spec's hard-to-reverse system design to a human reviewer in plain-language, dependency-ordered rounds. Use when asked for a system design review of a diff, specification, or both.
---

/design-by-contract

Present the system design of a **scope** — a diff, a spec, or both — to a human
reviewer, one batch at a time.

Write reviewer-facing prose in ASD-STE100 Simplified Technical English, inside
a **closed vocabulary**: the ubiquitous language of `CONTEXT.md`,
`codebase-design` terms used exactly, and code identifiers as code spans. When
the vocabulary lacks a term, flag a glossary proposal through `domain-modeling`.
Write complete clauses: every verb keeps its object, and every definite noun
has an antecedent.

Use `design-by-contract` to select and analyze the consequential decisions. Keep
its client-supplier clauses as an internal reasoning model. Map the selected
contracts as a **contract dependency tree**: every contract branches into the
contracts that depend on it. A spec's contract table names the contracts; a
diff is the truth for what changed. When both exist, reconcile them and flag any
contract found only in the diff as unplanned.

The **review surface is implementation only**: production source. Exclude test
suites, documentation, and workspace fixtures. Treat a spec row that names one
of those surfaces as a sign-off device; review its knobs at their owning
contract.

Work the tree in **rounds**. The **frontier** is every contract whose upstream
contracts are already reviewed. A round starts with
`## <scope name> — round N of M`, then presents the whole frontier. Prefix
decisions with handles `C1`, `C2`, … across rounds. Present each decision under
a plain-language title and explain it in a small number of connected
paragraphs. In full sentences, name the relevant system parts and how they
interact, what changed and why it matters, and the expectation or trade-off the
reviewer must judge. Include defined failure behavior only when it helps that
judgment. Link the relevant spec or ADR once.

The reviewer sees an explanation, not the contract form. Do not expose repeated
**Client**, **Supplier**, **Requires**, **Ensures**, **Maintains**, or
**Violation behavior** fields, and do not turn those fields into an unlabeled
checklist. Include only facts that matter to the decision. Add a table,
sequence, state, or dependency diagram only when it makes a relationship easier
to understand than the prose. End each round with one short, plain-language
request for concerns or approval.

Then wait for the reviewer's reply. One reply advances the batch: challenged
decisions become logged concerns under their plain-language titles, each with
its agreed fix when one emerges; the rest are accepted. Keep each handle as a
stable cross-round reference. Keep the scope frozen while the review runs. A
proposed fix is a log entry until the review ends.

Finding facts is your job, never the reviewer's. Use a sub-agent when the diff,
spec, or a call site must establish a fact; the reviewer supplies only verdicts.

Finish after every contract in the tree is visited. In the same plain-language
style, summarize the accepted decisions, concerns, and agreed fixes, then apply
the amendments the reviewer confirms. When the reviewer requests a guide, write
it where they say: one review pointer, the decisions in handle order, and the
selected visuals.
