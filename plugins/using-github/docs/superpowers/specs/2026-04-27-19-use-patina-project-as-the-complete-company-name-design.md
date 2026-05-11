# Design: Use Patina Project as the complete company name [#19](https://github.com/patinaproject/github-flows/issues/19)

> Recommended skill: `superpowers:brainstorming`. The Brainstormer role for this
> issue uses that discipline to separate company-display wording from stable
> repository, marketplace, package, bot, and URL identifiers.

## Intent

Update public-facing documentation so sentences that refer to the company use
the complete name "Patina Project" instead of the shortened display name
"Patina", while preserving machine-readable identifiers and historical slugs.

## Requirements

- Replace public-facing company-display references to "Patina" with "Patina
  Project".
- Preserve repository owners, repository slugs, URLs, package names, domains,
  marketplace identifiers, bot names, and other machine-readable identifiers
  that contain `patina` or `patinaproject`.
- Audit the known affected surfaces from issue #19:
  - `README.md`
  - `RELEASING.md`
  - `docs/superpowers/specs/2026-04-26-1-bootstrap-and-ship-skills-design.md`
  - `docs/superpowers/specs/2026-04-26-4-make-the-readme-awesome-design.md`
  - `docs/superpowers/plans/2026-04-26-4-make-the-readme-awesome-plan.md`
- Treat historical Superpowers docs as in scope when they are public-facing docs
  that contain company-display wording.
- Keep markdown lint clean.
- Do not rename GitHub organization/repository references, package names,
  domains, plugin identifiers, bot identities, or release workflow secrets.
- Preserve issue #19's cross-repo context as a plain reference to
  `patinaproject/bootstrap#46`.

## Design

Use a targeted documentation audit rather than a global replacement. Search for
whole-word `Patina` in public Markdown docs, inspect each match, and classify it
as one of two cases:

- **Company-display prose:** update shortened marketplace, plugin, baseline,
  and "outside the company" wording to use "Patina Project".
- **Identifier or proper machine name:** preserve as-is. Examples include
  `patinaproject/skills`, `patina-project-automation`, URLs, package names, and
  code examples.

The implementation should update the known affected docs plus any directly
related public docs discovered by the audit. It should not churn unrelated
wording, restructure old plans, or normalize lowercase identifier examples.

## Acceptance Criteria

### AC-19-1

Given a public-facing docs sentence refers to the company as "Patina", when the
wording is updated, then it uses "Patina Project" instead.

### AC-19-2

Given a repository slug, URL, package name, or identifier contains `patina`,
when the audit is performed, then that identifier is preserved.

## Verification

- Run `rg -n '\bPatina\b|patina' README.md RELEASING.md docs/**/*.md` and
  review remaining matches for identifier-safe usage or intentional historical
  references.
- Run `pnpm lint:md`.
- Review the changed files with `git diff -- README.md RELEASING.md docs/` to
  confirm the edits are wording-only and do not rename identifiers.

## Out of Scope

- Renaming the GitHub organization, repository slugs, package names, URLs,
  domains, marketplace identifiers, bot names, or release workflow secrets.
- Changing runtime behavior in `skills/`.
- Changing release automation behavior.
- Updating issue or PR labels.

## Concerns

No approval-relevant concerns remain. The main execution risk is accidentally
editing identifiers during the wording cleanup, so the plan should include an
explicit post-edit audit of remaining `Patina Project` and `patina` matches.
