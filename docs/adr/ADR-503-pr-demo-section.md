# ADR-503: Require a Demo section in pull request bodies

## Status

Accepted

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

A pull request whose change a person can see or drive carries a `## Demo`
section directly after `## What changed`. The section holds one video that runs
the happy path and screenshots of the states that path passes through. A
documentation-only or internal-only diff omits it.

The agent supplies the media through the browser: open the description editor,
select Attach files, upload with the file chooser, move each generated
attachment URL under `## Demo`, then save. No media is committed.

The video runs the happy path end to end. It performs the actions that the
`## Happy path` section lists, in the order listed, and ends at that section's
`Result:` line. Demo shows the path and Happy path writes it. Where the change
has no user interface, the video runs the command that the happy path names.
The video carries no length cap; its length follows the path it runs. It cuts
startup, loading, sign-in, and dead navigation, and appears as a bare
attachment URL on its own line. Screenshots are one still per state,
written as `<img>` elements whose numbered alt text walks the flow in order.
Captions are optional and appear only where the media needs them.

Technical notes gains a labeled line naming the build the Demo was recorded
against. The standing media-placement sentence narrows to edge case and still
works stills. Demo is the execution evidence that the proposed-QA-steps rule
requires.

This amends the body contract that
[ADR-445](ADR-445-repository-pull-request-body-contract.md) assigns to
`opening-a-pr`. It does not supersede ADR-445.

## Consequences

- A reviewer sees proof before steps and no longer checks the change out to
  believe it.
- The agent needs a logged-in browser session. Without one it cannot complete
  the section.
- `multi-phase-plan.md` keeps its own review video. The two artifacts stay
  separate.
- Neither pull request template changes, so no `scaffold-repository` consumer
  is affected.
- No CI check enforces the section. The contract is the rule.
- `plugins/engineering/**` is vendored from open-pstack, so this edit becomes a
  merge conflict on a later `pnpm sync-pstack` wherever upstream changes the
  same region
  ([ADR-429](ADR-429-sync-pstack-carrier-branch.md)).
