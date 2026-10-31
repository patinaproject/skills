---
name: grill-to-spec
description: Grill a design with grilling and domain-modeling, holding every ADR and glossary change in the conversation and leaving the working tree unchanged, then hand them to /to-spec as proposals. Use when a design needs grilling before it is specified and its documentation changes should reach the implementing branch through the spec.
disable-model-invocation: true
---

# Grill a design for a specification

This session plans. It leaves the working tree byte-for-byte unchanged. Every
ADR and glossary change it settles travels to the implementing branch as a
proposal on the published spec, which that branch applies verbatim.

## Hold, never write

Load `grilling` and `domain-modeling`. Run the grilling rounds, and
use domain-modeling's discipline inside them: challenge terms against the
glossary, sharpen fuzzy language, probe scenarios, and cross-check the code.

Domain-modeling writes `GLOSSARY.md` and ADRs into the tree the moment a
decision settles. In this session, hold each settled item in the conversation
instead. A held item is one of these:

- **Glossary term.** Its fields from `GLOSSARY-FORMAT.md` in domain-modeling,
  and the owning context. With a `GLOSSARY-MAP.md` at the repository root, the
  owning context is the `GLOSSARY.md` the map names.
- **ADR.** The decision, rationale, alternatives, consequences, and the
  destination path you chose.
- **No change.** An agreed item that needs no documentation change, with the
  reason.

When a later round revises a held item, restate the whole item so the latest
agreement is unambiguous. Keep proposal text out of chat. `/to-spec`
writes it.

## ADR mechanics are yours

The operator decides design choices and domain language. Propose each glossary
term, definition, and owning context, and let the operator decide.

You decide every ADR mechanic: whether a decision needs an ADR, whether to
create, amend, or supersede a record, its number or issue identifier, its
directory, its name, and its structure. Take the answer from the repository's
instructions, the ADR authorities they name, and the current ADRs nearest the
decision, in that order. Pick the path that best maintains the existing
decision history. When those sources give no precedent, fall back to
`ADR-FORMAT.md` in domain-modeling for format, a context's own `docs/adr/` for
a context-only decision, and the root `docs/adr/` for a wider one.

As each ADR settles, tell the operator the path you chose and the decision it
records, as a report. The operator can still overrule it.

## Steps

1. Record the output of `git status --porcelain`. Read the repository's
   instructions, every ADR authority they name, the ADRs relevant to the
   design, and the existing glossary files. Done when you can name the ADR
   rules that apply and the glossary each likely term belongs to.
2. Run `grilling` until the frontier is empty and the operator confirms a
   shared understanding. Done when every agreed term and decision is a held
   item, with no item left only implied by an answer.
3. Run `git status --porcelain` again and compare it with step 1. If this
   session changed the tree, stop and report each changed path to the
   operator.
4. End with two paragraphs and nothing else. The first paragraph is exactly
   `Shared understanding confirmed.` The second is exactly
   ``Run `/to-spec` to publish the design with complete file-ready ADR and glossary proposals from this conversation.``

`to-spec` is user-invoked, so the operator runs it, and it follows its own
process with one exception, scoped to this handoff. `to-spec` says not to
include specific file paths or code snippets. The `## Proposed documentation
changes` section below is exempt from that rule, because it must carry the
destination paths and file-ready contents. Every other section of the spec keeps
the rule.

## When `/to-spec` runs here

Add a `## Proposed documentation changes` section at the end of the spec's
`<identifier> Agent brief`, after Further notes. This section is the one place the spec carries file paths and
file contents, the exception to `to-spec`'s no-paths rule noted above. For
each held item:

- **Glossary term or ADR.** The destination path, then the complete file-ready
  text in a fenced block: the whole new file, or the whole amended file. Use the
  domain-modeling format unless the repository's ADR rules set another.
- **No change.** One line naming the item and the reason.

Done when every held item appears once, in its latest agreed form.
