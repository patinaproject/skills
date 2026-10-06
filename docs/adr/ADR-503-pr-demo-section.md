# ADR-503: Require a Demo section in pull request bodies

## Status

Superseded by [ADR-551](ADR-551-pr-skill-body-contract.md), as amended by
[PAT-4817](https://linear.app/patinaproject/issue/PAT-4817/align-pr-skill-evidence-tiers-with-the-upstream-skill).
The PR body no longer has a separate Demo evidence tier.

## Context

The `opening-a-pr` body contract asks for written claims and written steps. It
carries one optional sentence about media: put screenshots or videos in the
section they prove. No section holds the proof, no media is required, and
nothing checks it. The contract also states that QA steps stay proposed until
execution evidence proves that they ran, but the body has no place to record
that evidence
([#503](https://github.com/patinaproject/skills/issues/503)).

GitHub publishes no REST endpoint for the attachment store behind
`github.com/user-attachments/assets/...`. Its documentation describes attaching
a file only through the browser. GitHub's Content-Security-Policy permits
`github.com` and the user-image hosts as media sources; it permits release
assets on `release-assets.githubusercontent.com` and
`objects.githubusercontent.com` as images but not as media. An agent that
drives a logged-in browser can use the description editor's file chooser, which
is the path a person uses.

## Decision

A pull request body uses the upstream S-tier and A-tier Evidence model. A
visual change can use screenshots as S-tier evidence when the environment
supports them. Execution-based evidence such as test results and console
output is A-tier. Media remains optional and belongs beside the claim it
proves.

When a pull request includes media, the agent supplies it through the browser
and places each attachment beside the claim it proves. No media is committed.
The upload procedure remains in the PR skill's media reference.

This amends the body contract that
[ADR-445](ADR-445-repository-pull-request-body-contract.md) assigns to
`opening-a-pr`. It does not supersede ADR-445.

## Consequences

- Reviewers use the same S-tier and A-tier evidence model as the upstream PR
  skill.
- `multi-phase-plan.md` keeps its own review video. The two artifacts stay
  separate.
- Neither pull request template changes, so no `scaffold-repository` consumer
  is affected.
- No CI check enforces the section. The contract is the rule.
- `plugins/engineering/**` is vendored from open-pstack, so this edit becomes a
  merge conflict on a later `pnpm sync-pstack` wherever upstream changes the
  same region
  ([ADR-429](ADR-429-sync-pstack-carrier-branch.md)).
