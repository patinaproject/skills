# Design: Use Patina Project as the complete company name [#46](https://github.com/patinaproject/bootstrap/issues/46)

## Context

The repo currently mixes the complete company name, `Patina Project`, with
shortened company-display prose in marketplace, plugin, baseline, release, and
organization-supplement wording. That shortened wording appears in root docs,
emitted templates, the bootstrap skill contract, plugin metadata, and some
historical Superpowers artifacts.

The change is wording-only, but it touches the bootstrap baseline. Repository
guidance makes `skills/bootstrap/templates/**` the source of truth for emitted
baseline files, so generated root mirrors must stay aligned with the templates.

## Decision

Use `Patina Project` for company-display prose throughout current repository
content. Preserve `patina` and capitalized product terms when they are part of a different
semantic category:

- repository owner, package, plugin, marketplace, URL, email-domain, file path,
  environment-variable, or workflow identifiers such as `patinaproject`,
  `patinaproject/skills`, `patina-project-automation`, and
  `PATINAPROJECT_*`;
- product/domain terms such as material patina, gallery products, contest names,
  or other named features where the word is not shorthand for the company;
- quoted issue titles, historical release notes, or generated identifiers where
  changing the text would rewrite record identity rather than current prose.

The implementation should audit the repo with targeted searches, update
company-display prose in root files and their template sources together, then
verify that no shortened company-display wording remains.

## Approaches Considered

1. **Current/live surfaces only.** Update root docs, templates, plugin metadata,
   and the skill contract, while leaving old Superpowers planning artifacts
   untouched. This minimizes churn, but leaves public repository text that still
   violates the naming rule.
2. **Comprehensive prose audit.** Update every current repository prose surface
   where the shortened name is shorthand for the company, including historical
   Superpowers artifacts when the sentence still reads as general company
   guidance. Preserve identifiers and product names. This satisfies the issue
   most directly, with a small amount of documentation churn.
3. **Automated global replacement.** Replace the shortened company name with
   `Patina Project` broadly and fix breakage afterward. This is too risky because it
   appears in product names, issue titles, generated route names, and domain
   concepts.

Chosen approach: **comprehensive prose audit**. It best matches the issue's
wording while keeping identifier and product-name boundaries explicit.

## Requirements

- R1: Company-display prose uses `Patina Project`, not the shortened company name.
- R2: Identifiers, slugs, domains, email addresses, URLs, environment variables,
  file paths, workflow names, and plugin IDs are preserved.
- R3: Product/domain names such as gallery products and contest names are preserved.
- R4: Template-owned root baseline files are changed from template sources first
  and mirrored into the repo root in the same branch.
- R5: Historical Superpowers docs are updated only when the wording is ordinary
  company-display prose, not when it is part of an immutable title, issue link,
  changelog identity, or product/domain term.
- R6: Verification includes targeted searches for shortened company-display
  phrasing and markdown linting.

## Acceptance Criteria

- AC-46-1: Given a public-facing docs or template sentence uses the shortened
  company name, when the wording is updated, then it uses `Patina Project`.
- AC-46-2: Given a lowercase identifier, domain, URL, environment variable, or
  product/domain term contains `patina`, when the audit is performed, then that
  identifier is preserved unless it is explicitly company display text.
- AC-46-3: Given this repo mirrors baseline config from templates, when the
  change is implemented, then the template edit and mirrored root edit are
  committed together.

## Implementation Shape

1. Search for company-display candidates with targeted patterns that cover
   marketplace, plugin, baseline, organization-supplement, fork, and
   company-specific wording.
2. Update source templates under `skills/bootstrap/templates/**` before changing
   corresponding root files.
3. Update root mirrors and skill docs so the current repo reads consistently.
4. Update historical Superpowers artifacts only for general prose that would
   still be understood as company shorthand.
5. Re-run the targeted searches and `pnpm lint:md`.

## Non-Goals

- Renaming `patinaproject` slugs, plugin IDs, package names, email domains,
  URLs, environment variables, workflow names, or GitHub App names.
- Renaming product/domain terms such as gallery products, contest names, or
  patina as material aging.
- Changing release behavior, marketplace dispatch behavior, or bootstrap
  realignment mechanics.

## Risks

- **Over-renaming product names.** Mitigated by preserving named products and
  identifiers explicitly.
- **Template/root drift.** Mitigated by editing template-owned files and root
  mirrors together, then checking the targeted diff.
- **Historical-doc churn.** Mitigated by only updating historical docs when the
  phrase is ordinary company-display prose.
