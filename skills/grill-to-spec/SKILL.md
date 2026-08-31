---
name: grill-to-spec
description: Question the user until a design is decided, then prepare the specification and complete proposed ADR or glossary text for /to-spec. Use when the implementing branch does not exist or is not the current branch.
---

# Grill a design for a specification

This skill leaves the worktree unchanged. It questions the user, drafts any ADR
or glossary updates as complete text in the conversation, then asks the user to
run `/to-spec` to publish the result.

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
those rules leave a case open, choose the path that best maintains the existing
decision history from first principles.

NEVER ask the operator to decide any ADR mechanic. Report the path you chose and
the proposal you wrote.

## Steps

1. Record `git status --porcelain`, read the ADR sources required by the
   question boundary, then run `grilling` until it has answered the important
   design questions. Keep every agreed documentation change in the
   conversation.
2. Read the rules and formats from `domain-modeling`. Draft one complete
   proposal for each new glossary term and each decision that requires an ADR.
   Use `CONTEXT-FORMAT.md` for glossary entries and `ADR-FORMAT.md` for ADRs.
   Follow the target repository's ADR naming rules.
3. Put each proposal in one fenced block. Label it with the destination path
   and include the complete text that the implementing branch should copy.
   When the repository has a `CONTEXT-MAP.md`, place a glossary term in its
   context's `CONTEXT.md`. Put an ADR in that context's `docs/adr/` when it
   affects only that context, otherwise use the root `docs/adr/`.
4. If later discussion changes a proposal, draft it again. The newest draft is
   the one to publish. Account for every agreed term and decision with either a
   proposal or a stated reason for skipping it.
5. Confirm that `git status --porcelain` matches the result from step 1. Stop if
   this session changed the worktree.
6. Finish with a `Proposed doc changes` list. For each proposal, give its name,
   destination path, and one-sentence summary. Include the total count. Keep the
   full text in its earlier fenced block unless the user asks to see it again.
7. Make the final sentence an instruction to run `/to-spec`. Tell the user that
   it should publish the current proposal text unchanged so the implementing
   branch can copy it later.
