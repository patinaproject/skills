---
name: grill-to-spec
description: Grill a design to settled, then publish it as a tracker spec carrying its ADR and glossary changes as file-ready proposals, leaving the worktree untouched. Use when grilling in a worktree that will not be committed, or when a design session must hand off its doc changes without writing them to the branch.
---

# Grill To Spec

Grill a design to **settled**, then hand the whole outcome to the tracker: the
spec, and every documentation change the design resolved, as a **proposal** —
complete file-ready text the implementing branch can apply verbatim.

The worktree is scratch. Nothing this skill produces is written to it, so a
disposable grilling worktree can be deleted the moment the spec is published.

## Required Child Skills

- `grilling`: the interview loop that walks the design tree to settled.
- `write-docs`: supplies the `CONTEXT-FORMAT.md` and `ADR-FORMAT.md` rules each
  proposal is written to.
- `new-issue`: publish the spec through the tracker adapter.
- `edit-issue`: attach the spec to an issue that already exists.

If one is missing, stop and report its name with install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill write-docs new-issue edit-issue -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@grilling -y
```

## Workflow

1. **Grill to settled.** Run `grilling`. Keep every documentation change it
   resolves in the session as material for step 2 — the tree stays as you found
   it. Settled is `grilling`'s own bar: the frontier is empty and the user has
   confirmed shared understanding.

2. **Draft a proposal per resolved doc change.** A glossary term the session
   pinned down, and a decision that is hard to reverse, surprising without
   context, and the result of a real trade-off, each become one proposal. Write
   the text to the format `write-docs` names — `CONTEXT-FORMAT.md` for a
   glossary entry, `ADR-FORMAT.md` for a decision — and follow the target
   repository's own ADR naming scheme when it documents one. Each proposal
   carries the destination path and the complete text that belongs there, so
   applying it is a copy rather than a rewrite.

   A design that resolved no glossary term and no hard-to-reverse decision
   yields no proposals; publish the spec alone.

3. **Publish the spec.** File it with `new-issue`, or attach it with
   `edit-issue` when the work already has an issue. The spec states the problem
   and the solution from the user's perspective; the proposals ride inside it
   under one `Proposed doc changes` heading, each in its own fenced block
   labelled with its destination path.

4. **Confirm the tree is untouched.** `git status --porcelain` returns exactly
   what it returned before step 1. Report the published spec's URL and every
   proposal's destination path.

## Why the tree stays clean

Committed `CONTEXT.md` and `docs/adr/**` are read as in-force truth, so a
decision that is grilled but not yet built must not appear there — and doc
edits stranded in a scratch worktree are lost when it goes away. Publishing the
proposals with the spec puts them where the implementing branch will find them.
`write-docs` applies them there, in the pull request that makes the decision
true.
