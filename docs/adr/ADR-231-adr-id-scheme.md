# ADR-231: Name ADRs by their originating GitHub issue number

## Status

Accepted

## Context

ADRs were named with a sequential, zero-padded counter (`0001-…`). No authority
allocated the next number — each branch derived it by scanning `docs/adr/` for
the highest existing number and incrementing, exactly as the vendored
`grill-with-docs` and `setup-matt-pocock-skills` ADR guidance still instructs.

Under parallel work that guess is unsafe: two branches both see the same number
as next and both claim it, producing a merge conflict or — worse — two different
ADRs silently sharing one ID. The counter also carries no information:
`ADR-0001` does not tell a reader where the decision came from, while the problem
framing, discussion, and PRs all live in a GitHub issue the filename never
references.

## Decision

Name an ADR after its originating GitHub issue: `ADR-<issue>-<slug>.md`, with the
heading `# ADR-<issue>: Title` and the prose reference `ADR-<issue>`.

The issue number is assigned by GitHub, so it is globally unique with no
cross-branch coordination — collisions are eliminated by construction rather than
by a scan-and-increment convention. The prefix doubles as a backlink to the
issue's full history. The slug carries filename uniqueness, so a single issue can
produce two ADRs with two slugs and no suffix scheme. Every ADR must cite an
originating issue; a decision with no issue is the signal to file one.

`docs/adr/README.md` is the single source of truth and explicitly supersedes the
`0001`-increment guidance still embedded in the vendored shared skills, with an
`AGENTS.md` pointer routing agents to the repo doc first. The vendored payloads
under `.agents/skills/**` are left untouched so a re-vendor from
`skills-lock.json` does not clobber this fix.

The existing `0001-no-tests-on-documentation-content.md` (from issue #224) is
renamed to `ADR-224-no-tests-on-documentation-content.md`, so no legacy
`0001`-style ID remains.

## Consequences

- ADR IDs cannot collide across parallel branches; merges stay clean.
- Every ADR ID is a backlink — a reader opens `#<issue>` for full context.
- IDs still increase roughly with time, since issue numbers are monotonic, so the
  directory reads in rough decision order.
- The scheme composes with a future multi-context layout: issue numbers are
  globally unique, so per-package `docs/adr/` directories could not collide either.
- Out of scope: CI or pre-commit enforcement of the naming rule, editing the
  vendored skill payloads, any disambiguation scheme beyond the slug, and
  retroactively filing issues for past decisions that never had one.
