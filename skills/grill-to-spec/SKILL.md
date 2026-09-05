---
name: grill-to-spec
description: Question the user until a design is decided, then hand the settled decisions to /to-spec. Use when the implementing branch does not exist or is not the current branch.
---

# Grill a design for a specification

This skill leaves the worktree unchanged. It questions the user until they
confirm a shared understanding, then asks them to run `/to-spec` to publish the
result. The conversation holds the settled decisions. `/to-spec` turns those
decisions into complete file-ready ADR and glossary proposals on the published
spec, which the implementing branch can apply verbatim.

Confirm these skills are installed:

- `grilling`
- `domain-modeling`
- `to-spec`

If one is missing, stop and provide:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills --skill grilling domain-modeling to-spec -y
```

`to-spec` is user-invoked. Name it in the final instruction instead of running
it yourself.

## Question boundary

Use operator questions for design choices and domain language. Propose each
glossary term, definition, and owning context, then let the operator decide.

Own the ADR mechanics. Before the interview, read the target repository's
instructions, every ADR authority they name, and the relevant current ADRs.
Decide whether a design needs an ADR, whether to create, amend, or supersede a
record, which issue identifier it uses, where it belongs, and how to name and
structure it. Follow the repository's naming, placement, and format rules. When
they leave a mechanic open, derive the answer from the relevant current ADRs
and first principles, choosing the path that best maintains the existing
decision history. Only when the authorities and current records supply no
maintainable precedent, use `ADR-FORMAT.md` from `domain-modeling` for format,
or put a context-only ADR in that context's `docs/adr/` and a wider decision in
the root `docs/adr/` for placement.

NEVER ask the operator to decide any ADR mechanic. Report the path you chose and
the decision it records as the design settles.

## Capture

Keep each ADR's decision, rationale, alternatives, consequences, and destination
in the conversation. Keep each glossary term's agreed fields and owning context
in the conversation. Settle the term, definition, and words to avoid with the
operator using `CONTEXT-FORMAT.md`.

Make later revisions explicit so `/to-spec` uses the latest agreement.
Account for every agreed term and decision.
Record the reason for each item that needs no documentation change.
Leave file-ready proposal text to `/to-spec`.
Do not print fenced documentation proposals in chat.

When the repository has a `CONTEXT-MAP.md`, place each term in its context's
`CONTEXT.md`. Apply the question boundary to every ADR.

When you run `/to-spec` in this conversation, include one proposal in the
published spec per agreed ADR and glossary term that needs a documentation
change. Include each proposal's complete body in the `domain-modeling` format
and its destination path. State the reason for each agreed item that needs no
documentation change.

## Steps

1. Record `git status --porcelain`, read the ADR sources required by the
   question boundary, and read the rules and formats from `domain-modeling`.
2. Run `grilling` until the frontier is empty and the operator confirms a
   shared understanding. Capture decisions per [Capture](#capture).
3. Confirm that `git status --porcelain` matches the result from step 1. Stop if
   this session changed the worktree.
4. Finish with only a confirmation of shared understanding and a one-line
   instruction to run `/to-spec` to publish the design with complete file-ready
   ADR and glossary proposals from this conversation.
