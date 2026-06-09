# ADR-232: Byte-equality sync checks are a machine-consumed mirror contract

## Status

Accepted

## Context

The repo-owned `write-docs` skill bundles its own copies of `CONTEXT-FORMAT.md`
and `ADR-FORMAT.md` so it can ship to the marketplace without depending on the
internal layout of the vendored `grill-with-docs` skill (a re-vendor can move or
remove that skill's files). Those copies must stay byte-identical to the vendored
originals, which are a moving target — re-vendored from `mattpocock/skills`' default
branch whenever `pnpm skills:install` runs.

`scripts/tests/write-docs-format-sync.test.sh` enforces that by hashing/diffing
each `{write-docs ↔ grill-with-docs}` format-file pair and asserting equality. On
its face that looks like it tests the content of a documentation file, which
[ADR-224](ADR-224-no-tests-on-documentation-content.md) forbids — so without this
record a future contributor could delete the test as an ADR-224 violation.

## Decision

A byte-equality sync check against a vendored source is a **machine-consumed
mirror contract**, not a prose assertion, and is therefore permitted.

The distinction is what the test asserts. ADR-224 bans tests that assert *what a
documentation file says* — exact sentences, headings, or phrasings — because a
documentation body must be freely editable without breaking a test. The sync test
asserts only that two files *match*; it never references any specific sentence,
heading, or wording, and it stays green under any upstream edit as long as both
sides move together. The bundled copies are, by definition, non-editable mirrors:
the contract is precisely that they are *not* freely editable, so ADR-224's
"prose is freely editable" premise does not apply to them.

The copies are kept in sync by hand: when a re-vendor of `grill-with-docs` changes
a format file, copy it over the bundled `write-docs` copy. No script or install
hook automates this — the test is the whole contract, and a plain copy is the
whole fix.

## Consequences

- The sync test is a sanctioned exception to ADR-224, scoped narrowly to
  byte-equality mirror contracts against a vendored source — not a reopening of
  prose-content testing in general.
- A re-vendor that changes a format file turns the test red until someone copies
  the new content over the bundled copy; the test is the signal, the copy is the
  fix.
- If the upstream format files are renamed or removed, the sync test fails loudly,
  which is the intended signal to update the mirror rather than a false alarm.
