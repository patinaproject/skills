# ADR-347: Capture reaches domain-modeling directly, with the landing rule alongside

## Status

Accepted

## Context

The repo-owned `write-docs` skill ran the vendored `domain-modeling` skill's
capture half. To ship independently it bundled byte-identical copies of
`CONTEXT-FORMAT.md` and `ADR-FORMAT.md`, held in place by a dedicated mirror
test ([ADR-232](ADR-232-format-sync-mirror-contract.md)), and restated capture
rules `domain-modeling` already stated. What it uniquely carried was not
behavior but guidance: where captured docs land
([ADR-337](ADR-337-off-branch-doc-capture.md)).

Keeping a whole skill, a duplicated pair of format files, and a test to guard
the duplication is a large surface for one rule.

## Decision

`write-docs` is retired. Capture reaches the vendored `domain-modeling` skill
directly — its rules, its ADR bar, and its format files, read in place. The
landing rule travels with the caller instead of in a skill of its own:
`AGENTS.md` states it for this repository, and `grill-to-spec` states it for the
off-branch session that produces proposals.

## Consequences

- One source of truth for capture formats. The bundled copies, the mirror test,
  and its suite entry are deleted, and ADR-232's contract has nothing left to
  govern.
- The landing rule is no longer exportable as an installable skill. A consuming
  repository that installs `domain-modeling` alone gets its inline
  "update `CONTEXT.md` right there" behavior, which is the failure ADR-337
  describes; consumers that want the rule take `grill-to-spec` or copy the
  `AGENTS.md` section.
- Callers now depend on `domain-modeling`'s internal file layout, which a
  re-vendor can move. That was the coupling the bundled copies existed to avoid,
  and the staleness audit in the catalog-change convention is what surfaces it.
