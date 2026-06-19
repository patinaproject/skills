# ADR-247: Re-point the format-sync mirrors after Matt Pocock skills v1

## Status

Accepted

## Context

[ADR-232](ADR-232-format-sync-mirror-contract.md) established the byte-equality
sync tests as a machine-consumed mirror contract and predicted the exact event
this ADR resolves: *"If the upstream format files are renamed or removed, the
sync test fails loudly, which is the intended signal to update the mirror."*

Issue [#247](https://github.com/patinaproject/skills/issues/247) upgraded the
vendored `mattpocock/skills` entries to v1. v1 reorganised the skills the mirrors
pointed at:

- `grill-with-docs` became a thin pointer skill (`/grilling` + `/domain-modeling`)
  and no longer ships `CONTEXT-FORMAT.md` or `ADR-FORMAT.md`. Those files moved,
  byte-identical, into the new `domain-modeling` skill.
- `improve-codebase-architecture` no longer ships `LANGUAGE.md`, `DEEPENING.md`,
  or `INTERFACE-DESIGN.md`. `DEEPENING.md` moved into the new `codebase-design`
  skill (one line differs — its intra-skill link target). The deep-module
  vocabulary that was `LANGUAGE.md` folded into `codebase-design/SKILL.md`, and
  the interface-design pass that was `INTERFACE-DESIGN.md` became
  `codebase-design/DESIGN-IT-TWICE.md`. Neither survives as a standalone file.

The vendored set was extended to keep it coherent: `domain-modeling`,
`codebase-design`, and `grilling` are now vendored, because the v1
`grill-with-docs` and `improve-codebase-architecture` payloads call them.

## Decision

Re-point each surviving mirror at its new vendored source; own the two files that
no longer have one.

- `write-docs`: `CONTEXT-FORMAT.md`, `ADR-FORMAT.md` ← `domain-modeling`.
- `improve-branch-architecture`: `DEEPENING.md` ← `codebase-design`;
  `CONTEXT-FORMAT.md`, `ADR-FORMAT.md` ← `domain-modeling`.
- `improve-branch-architecture`'s `LANGUAGE.md` and `INTERFACE-DESIGN.md` are
  **owned outright** by the repo and dropped from the mirror contract: v1 left no
  standalone upstream file to mirror, so the byte-equality premise no longer
  holds for them.

The two sync tests are updated to the new source directories, and
`improve-branch-architecture-format-sync.test.sh` drops the two now-owned files
from its pair list. This does not reopen ADR-232 or ADR-224 — the surviving pairs
remain machine-consumed mirror contracts, asserting only that files *match*.

## Consequences

- The mirror discipline survives where an upstream source survives (three of the
  five former pairs); the repo tracks v1's `domain-modeling`/`codebase-design`
  format files going forward.
- `LANGUAGE.md` and `INTERFACE-DESIGN.md` are now freely editable repo-owned
  reference files. They are governed by ADR-224 like any other prose — no test
  asserts their content — and a future maintainer may re-sync them by hand to the
  v1 `codebase-design` material if drift becomes a problem.
- A re-vendor that changes `domain-modeling`'s or `codebase-design`'s mirrored
  files turns the sync test red until someone copies the new content over the
  bundled copy; the test is the signal, the copy is the fix (unchanged from
  ADR-232).
- The vendored set grew by three skills (`domain-modeling`, `codebase-design`,
  `grilling`) to stay self-consistent under v1's split-skill layout.
