---
name: grill-to-spec
description: Grill a design to settled, then hand it to `/to-spec` with its ADR and glossary changes as file-ready proposals. Use when grilling anywhere but the branch that will implement the outcome.
---

# Grill To Spec

Grill a design to **settled**, then hand the whole outcome to `/to-spec` for
publication: the spec, and every documentation change the design resolved, as a
**proposal** — complete file-ready text the implementing branch can apply
verbatim.

The worktree stays scratch: this skill leaves it as it found it, and the
decision travels out through the spec instead.

## Required Child Skills

- `grilling`: the interview loop that walks the design tree to settled.
- `domain-modeling`: supplies the capture rules and the `CONTEXT-FORMAT.md` and
  `ADR-FORMAT.md` each proposal is written to. Take its formats and its bar for
  recording an ADR; leave its inline "update `CONTEXT.md` right there" step,
  which this skill replaces with a proposal on the issue.
- `to-spec`: the operator runs it to publish. It is user-invoked, so confirm it
  is installed and name it in the hand-off rather than calling it.

If one is missing, stop and report its name with install guidance:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add mattpocock/skills --skill grilling domain-modeling to-spec -y
```

## Workflow

1. **Grill to settled.** Record `git status --porcelain` as the worktree
   baseline, then run `grilling`, keeping every documentation change it resolves
   in the session as material for step 2. Done when `grilling` reaches its own
   settled bar.

2. **Draft a proposal per resolved doc change.** A glossary term the session
   pinned down, and a decision that clears `domain-modeling`'s bar for recording
   an ADR, each become one proposal. Write the text to the format
   `domain-modeling` names — `CONTEXT-FORMAT.md` for a glossary entry,
   `ADR-FORMAT.md` for a decision — and follow the target repository's own ADR
   naming scheme when it documents one. Each proposal carries its destination
   path and the complete text that belongs there.

   In a repository with a `CONTEXT-MAP.md`, a term belongs to its context's
   `CONTEXT.md`, and a decision to that context's `docs/adr/` when it binds only
   that context or the root `docs/adr/` when it binds the system.

   Done when every term and decision the session settled is accounted for:
   drafted as a proposal, or named as a deliberate skip with its reason. A
   design that settled neither yields no proposals; carry on to the spec.

3. **Confirm the worktree.** `git status --porcelain` matches the step 1
   baseline, proving the grilling left nothing behind to commit.

4. **Hand off to the operator.** This is where the run ends: publishing is
   theirs. Present every proposal under one `Proposed doc changes` heading, each
   in its own fenced block labelled with its destination path, then close by
   telling them to run `/to-spec` to publish the spec with those blocks inside
   it, carried over unchanged — the implementing branch applies them verbatim
   later, so a reworded proposal stops being file-ready. `/to-spec` synthesizes
   from this
   conversation, so the grilling and the proposals are already in the context it
   reads. Done when every proposal from step 2 is on screen in full and that
   instruction is the last thing said.
