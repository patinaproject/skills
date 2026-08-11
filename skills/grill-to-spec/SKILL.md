---
name: grill-to-spec
description: Grill a design to settled, then publish it as a tracker spec whose ADR and glossary changes ride along as file-ready proposals. Use when grilling anywhere but the branch that will implement the outcome.
---

# Grill To Spec

Grill a design to **settled**, then hand the whole outcome to the tracker: the
spec, and every documentation change the design resolved, as a **proposal** —
complete file-ready text the implementing branch can apply verbatim.

Everything this skill produces lands in the tracker, so the worktree stays
scratch and the decision survives it.

## Required Child Skills

- `grilling`: the interview loop that walks the design tree to settled.
- `write-docs`: supplies the `CONTEXT-FORMAT.md` and `ADR-FORMAT.md` rules each
  proposal is written to, and applies the proposals later on the implementing
  branch.
- `new-issue`: publish the spec through the tracker adapter.
- `edit-issue`: attach the spec to an issue that already exists.

If one is missing, stop and report its name with install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill write-docs new-issue edit-issue -y
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills@grilling -y
```

## Workflow

1. **Grill to settled.** Record `git status --porcelain` as the worktree
   baseline, then run `grilling`, keeping every documentation change it resolves
   in the session as material for step 2. Done when `grilling` reaches its own
   settled bar.

2. **Draft a proposal per resolved doc change.** A glossary term the session
   pinned down, and a decision that clears `write-docs`'s bar for recording an
   ADR, each become one proposal. Write the text to the format `write-docs`
   names — `CONTEXT-FORMAT.md` for a
   glossary entry, `ADR-FORMAT.md` for a decision — and follow the target
   repository's own ADR naming scheme when it documents one. Each proposal
   carries its destination path and the complete text that belongs there.

   Done when every term and decision the session settled is accounted for:
   drafted as a proposal, or named as a deliberate skip with its reason. A
   design that settled neither yields no proposals; carry on to the spec.

3. **Publish the spec.** File it with `new-issue`, or attach it with
   `edit-issue` when the work already has an issue. The spec states the problem
   and the solution from the user's perspective; the proposals ride inside it
   under one `Proposed doc changes` heading, each in its own fenced block
   labelled with its destination path. Done when the spec is live in the tracker
   and every proposal from step 2 appears in it, character for character.

4. **Confirm the worktree.** `git status --porcelain` matches the step 1
   baseline. Report the published spec's URL and every proposal's destination
   path.
