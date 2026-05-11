# Design: Clarify commit types for release-triggering product changes [#48](https://github.com/patinaproject/bootstrap/issues/48)

## Context

Bootstrap emits a repository baseline that uses Conventional Commits,
Release Please, PR-title linting, and agent-facing contribution guidance.
In plugin and skill repositories, Markdown can be the shipped product surface:
`skills/**/*.md`, prompt contracts, workflow gates, marketplace metadata, and
generated AI-agent instructions can all alter installed behavior even though
they are text files.
Skill files are especially important: edits to `skills/**/SKILL.md` and
adjacent skill workflow contracts are product/runtime edits, not documentation
edits, unless the change is clearly explanatory-only and does not alter the
installed skill's behavior.

Issue #48 asks Bootstrap to make that distinction explicit so contributors and
agents do not classify behavior-changing product-surface changes as `docs:`.
Misclassification matters because Release Please ignores non-releasable commit
types when opening release PRs, which can prevent downstream marketplace bumps
for behavior changes.

## Requirements

- AC-48-1: Given a Bootstrap-generated repo where Markdown files define shipped
  skill or plugin behavior, when contributor guidance explains Conventional
  Commit types, then it states that behavior-changing Markdown can require
  `feat:` or `fix:` rather than `docs:`.
- AC-48-2: Given a contributor is choosing between `docs:` and `feat:`, when
  the change alters installed skill behavior, workflow gates, prompt contracts,
  marketplace metadata, or other user-visible product behavior, then the
  guidance directs them to use a release-triggering type.
- AC-48-3: Given a contributor is making explanatory-only documentation
  changes, when the guidance describes `docs:`, then it preserves `docs:` for
  non-product-surface documentation that should not trigger a release.
- AC-48-4: Given Bootstrap templates or generated instructions mention Release
  Please, when they describe release-triggering behavior, then they explain
  that misclassifying product changes as `docs:` can prevent release PRs and
  downstream marketplace bumps.

## Considered approaches

### Recommended: Add a shared decision table to contributor guidance and release docs

Update the template-owned baseline surfaces that already teach commit rules:
`AGENTS.md.tmpl`, `CONTRIBUTING.md.tmpl`, `RELEASING.md`,
`agent-plugin/README.md.tmpl`, and `.github/copilot-instructions.md`. Mirror
the same guidance into this repository root by running the local bootstrap
realignment loop after template edits.

This keeps the rule near the decision points: agents see it in `AGENTS.md` and
Copilot instructions, humans see it in `CONTRIBUTING.md`, and release owners see
the Release Please consequence in `RELEASING.md`. It avoids changing enforcement
logic while still shaping the squash commit title that Release Please consumes.

### Alternative: Put the guidance only in `RELEASING.md`

This would explain Release Please behavior clearly, but it would be too far from
the normal commit and PR-title workflow. Agents and contributors could still
read `AGENTS.md` or `CONTRIBUTING.md`, choose `docs:`, and never reach the
release docs before opening a PR.

### Alternative: Change commitlint or Release Please configuration

The issue explicitly avoids requiring scopes or making every Markdown change
releasable. Enforcement cannot reliably know whether a Markdown diff changes a
runtime contract, so policy text is the right first fix.

## Design

The baseline should introduce a short "Commit type selection" rule in the
generated contributor and agent guidance. The rule should say that commit type
is based on product impact, not file extension. Markdown-only changes use
`feat:` when they add or change shipped behavior, `fix:` when they correct
broken shipped behavior, and `docs:` only when they explain behavior without
changing the shipped product contract.

The guidance should name the product surfaces called out by the issue:
installed skill behavior, `skills/**/SKILL.md` contracts, adjacent skill
workflow files, workflow gates, prompt contracts, plugin metadata, marketplace
behavior, generated agent instructions, and other user-visible configuration.
It should explicitly warn that skill file edits are not automatically `docs:`
changes just because the files are Markdown. It should also preserve `chore:`
for maintenance that does not alter user-facing behavior.

`RELEASING.md` should connect this classification to Release Please. It should
state that Release Please opens release PRs from releasable Conventional Commit
types, and that misclassifying product changes as `docs:` can cause a no-op
release run and skip downstream marketplace bump automation. It should document
the default bump mapping used by the baseline: `fix:` creates a patch release,
`feat:` creates a minor release, and `<type>!:` or a `BREAKING CHANGE:` footer
creates a major release. It should also say that other types, including
`docs:` and `chore:`, do not bump versions under the baseline unless Release
Please configuration changes later. The guidance should be prescriptive:
changes that should produce a release must not use non-bumping types such as
`docs:` or `chore:`. Contributors should choose the release-triggering type
that matches the product impact instead.

Because this repository treats `skills/bootstrap/templates/**` as the source of
truth for its own baseline, implementation must edit templates first and then
mirror the root generated files through bootstrap realignment. The PR body must
call out that loop.

## Scope

In scope:

- Template updates for generated commit, PR-title, and release guidance.
- Root mirrored updates produced by the local bootstrap realignment loop.
- Markdown lint and targeted text verification.

Out of scope:

- Commitlint rule changes.
- Requiring scopes.
- Release Please configuration changes that release on all `docs:` commits.
- Any claim that every Markdown change is releasable.

## Verification

- Run `pnpm lint:md`.
- Use `rg` to confirm generated guidance mentions behavior-changing Markdown,
  release-triggering types, `docs:` preservation, and Release Please
  misclassification consequences.
- Use `rg` to confirm the generated release guidance documents which commit
  types produce patch, minor, and major releases, and which common types do not
  bump versions under the baseline.
- Review root and template surfaces with `sed` to confirm the template-first
  changes mirrored correctly.

## Concerns

No approval-relevant concerns remain.
