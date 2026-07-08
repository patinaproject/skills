# ADR-257: One slim baseline PR template for docs and code repos

## Status

Accepted

## Context

The `patinaproject/skills` repository root is the canonical baseline that
`scaffold-repository` copies into every Patina Project repo. Its
`.github/pull_request_template.md` carried code-change ceremony that most
downstream repos never use: a rigid `Context:` line plus a `- <change> - <why>`
bullet contract, long embedded HTML comment blocks, and a standing
`Testing steps` section framed around app behavior (routes, screens, forms,
permissions). Most repos scaffolded from this baseline change markdown, skills,
and configuration, so that guidance rarely applied and every downstream repo
inherited the noise.

Issue [#257](https://github.com/patinaproject/skills/issues/257) slimmed the
template to `Linked issue` and a free-prose `What changed`, and raised the
governing question: should code and service repos keep a separate, heavier
baseline variant that retains an outcome-based test plan, or share the slim one
and add testing steps ad hoc?

## Decision

There is **one baseline PR template**, shared by docs, knowledge, code, and
service repos. Code and service repos do **not** get a separate heavier variant.

When a PR produces something a human should inspect — rendered docs, generated
files, a template, release notes, or app behavior — the author adds a
`Testing steps` section ad hoc, with an unchecked box per pass/fail outcome. It
is never a standing section. Routine automated verification stays with GitHub
Checks, not the PR body.

## Consequences

- Scaffolding stays predictable: one template to emit, one contract to keep in
  sync across `AGENTS.md`, `CONTRIBUTING.md`, and the `scaffold-repository`
  skill docs. There is no repo-type branch to detect or maintain.
- App-behavior test plans are still expressible — as an ad hoc `Testing steps`
  section — so code and service repos lose no capability, only the standing
  boilerplate.
- If a future code-heavy consumer repeatedly needs the same structured test
  plan, that is the signal to revisit this decision with a concrete case, not to
  pre-emptively fork the baseline now.
