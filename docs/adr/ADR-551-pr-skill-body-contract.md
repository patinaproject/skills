# ADR-551: Delegate PR body structure to the engineering pr skill

## Status

Accepted

## Context

The Engineering plugin described pull request bodies in
`patina-mode/playbooks/opening-a-pr.md`. Matt Pocock's `pr` skill provides a
shared body contract with visual summaries, before-and-after evidence, and
merge-risk guidance. Keeping both descriptions allowed agents to choose
different headings. See [#551](https://github.com/patinaproject/skills/issues/551)
and [PAT-4787](https://linear.app/patinaproject/issue/PAT-4787/install-matt-pococks-pr-skill-and-use-it-in-patina-mode).

## Decision

The Engineering plugin owns a local copy at
`plugins/engineering/skills/pr/SKILL.md`. Patina-mode delegates PR body
structure to that skill. The body uses `## Summary`, `## Evidence`,
`## Happy Path`, and `## Merge Danger` in that order. Evidence follows the
upstream S-tier and A-tier model. Screenshots are S-tier when the change is
visual and the environment supports them. Execution-based evidence is A-tier.

The repository keeps its title rules and paired GitHub and Linear closing
references. Each completed issue gets one closing line in `## Merge Danger`,
with an independent `Closes`, `Fixes`, or `Resolves` keyword for each reference.

## Consequences

Agents read one local skill when they write or update a PR body. The copy can
carry Patina-specific Happy Path guidance while preserving the upstream
Evidence contract.
The copy must be reviewed when the upstream `pr` skill changes.

This supersedes body ownership in ADR-445 and body ownership, section placement,
and media uploads in ADR-503. The bundled upload guide uses `gh pr edit --attach`.
