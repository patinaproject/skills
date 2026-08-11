# ADR-337: Off-branch sessions capture doc changes on the implementing issue

## Status

Accepted

## Context

Grilling sessions (via the vendored `grilling` / `domain-modeling` skills) write
`CONTEXT.md` and ADR edits inline into whatever working tree they run in.
Grilling is a planning activity, so running it away from the implementing
branch — a separate chat, a different worktree, before any implementing branch
exists — is the normal case. Inline capture then strands the edits in a
disposable worktree, publishes them on an unrelated branch, or lands
not-yet-built decisions where downstream agents read them as current truth
([#337](https://github.com/patinaproject/skills/issues/337)).

## Decision

Between "grilled and confirmed" and "implementation merged", a decision lives on
the GitHub issue that will implement it, as the exact proposed doc text — the
complete ADR body and each glossary entry. A session edits `CONTEXT.md` or
`docs/adr/**` only on the branch that will publish those docs: the branch
implementing the decision, or a docs-only branch when the repository already
reflects it. The implementing branch applies the captured text verbatim, in the
same pull request as the change that makes it true.

## Consequences

- Committed docs are always in-force truth; consumers of `docs/adr/` and
  `CONTEXT.md` need no status filtering to avoid phantom decisions.
- The doc payload survives worktree disposal and travels through the tracker,
  not the grilling session's filesystem.
- The vendored `domain-modeling` instruction to update `CONTEXT.md` inline is
  superseded for off-branch sessions, the same way
  [`docs/adr/README.md`](README.md) supersedes its numbering scheme; the
  vendored payloads themselves stay unedited.
- The repo-owned `write-docs` skill carries the generic form of this rule for
  consuming repositories.
