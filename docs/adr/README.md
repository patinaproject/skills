# Architecture Decision Records

This directory stores architecture decision records for this repository.

Use ADRs for durable decisions that affect architecture, domain boundaries,
technology direction, workflow contracts, or cross-package integration. Keep
short-lived implementation plans and issue-specific notes in their existing
issue or plan locations.

## Naming

Name a new ADR after its originating Linear issue:

```text
ADR-PAT-N-<slug>.md      e.g. ADR-PAT-123-tracker-adapter.md
```

- **The prefix is the Linear identifier, verbatim** — no padding, truncation,
  or normalization.
- **The slug carries uniqueness; the full filename is the key.** The issue-number
  prefix is not required to be unique on its own. One issue that produces two
  ADRs uses two different slugs — there is no suffix, letter, or padding scheme.
- **Every ADR must cite an originating issue.** Linear assigns the identifier,
  so it is globally unique with no cross-branch coordination. If a decision has
  no issue yet, publish one through the tracker adapter; do not invent a number.
- **The prefix is a backlink.** Open `PAT-N` for the decision's full historical
  context: the problem framing, discussion, and pull requests behind it.

Existing `ADR-<number>-<slug>.md` filenames are historical GitHub references and
remain unchanged under the reference-vocabulary rule in
[`docs/issue-tracker.md`](../issue-tracker.md).

This supersedes the sequential `0001`-increment numbering guidance still embedded
in the vendored shared skills (e.g. `domain-modeling`,
`setup-matt-pocock-skills`). Those payloads are re-installed from
`skills-lock.json` and are not edited; this doc, and the `AGENTS.md` pointer to
it, are the authority. Do not scan for the highest number and increment.

## Format

A short ADR is enough. Prefer one to three direct sentences that record what was
decided and why; add sections only when they make the decision easier to
understand later.

The heading matches the filename token: `# ADR-PAT-N: Title`. Reference an ADR
in prose as `ADR-PAT-N` (it is clear you mean the decision record, not the
issue thread, even though they share a number). In the rare case where one issue
produced more than one ADR, add the slug to disambiguate in both the heading and
prose — `# ADR-PAT-N-<slug>: Title` and `ADR-PAT-N-<slug>` — so the slug
carries uniqueness consistently across filename, heading, and prose.

Optional sections:

```markdown
# ADR-PAT-N: Short Decision Title

## Status

Accepted

## Context

What forces, constraints, or problem made this decision necessary?

## Decision

What did we choose?

## Consequences

What becomes easier, harder, required, or intentionally out of scope?
```

## Worked examples

- [`ADR-224-no-tests-on-documentation-content.md`](ADR-224-no-tests-on-documentation-content.md)
  — from issue [#224](https://github.com/patinaproject/skills/issues/224).
- [`ADR-231-adr-id-scheme.md`](ADR-231-adr-id-scheme.md)
  — from issue [#231](https://github.com/patinaproject/skills/issues/231),
  the record that adopted this scheme.
