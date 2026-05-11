# Design: Bootstrap markdown lint template should exclude CHANGELOG [#36](https://github.com/patinaproject/bootstrap/issues/36)

## Intent

Keep the bootstrap template source of truth aligned with the repo baseline so newly scaffolded repositories do not inherit a markdown lint mismatch for generated `CHANGELOG.md` content.

## Requirements

- AC-36-1: Given a repo is scaffolded from the bootstrap core template, when the `Lint Markdown` workflow runs, then it excludes `CHANGELOG.md` from markdownlint globs.
- AC-36-2: Given the bootstrap reference repo is checked, when template and root markdown lint workflow globs are compared, then both agree with the `package.json` `lint:md` exclusion for `CHANGELOG.md`.

## Current State

The root workflow at `.github/workflows/lint-md.yml` already excludes `CHANGELOG.md`, and `package.json` excludes the same file from `pnpm lint:md`. The core template at `skills/bootstrap/templates/core/.github/workflows/lint-md.yml` does not yet include that exclusion, so future bootstrapped repos can diverge from the intended baseline.

## Approach

Update the core template workflow to add `#CHANGELOG.md` to the `markdownlint-cli2-action` `globs` list. Then compare the generated root workflow, the core template workflow, and the `package.json` `lint:md` script to verify they express the same `CHANGELOG.md` exclusion.

The root workflow already has the expected line, so realignment should not require a root diff. If verification shows otherwise, mirror the template-derived root change before publishing.

## Non-Goals

- Do not change markdownlint rules.
- Do not change Release Please output or ownership of `CHANGELOG.md`.
- Do not change staged-file linting behavior.

## Verification Strategy

- Inspect the template workflow and root workflow for `#CHANGELOG.md`.
- Inspect `package.json` and `skills/bootstrap/templates/core/package.json.tmpl` for the matching `#CHANGELOG.md` lint script exclusion.
- Run `pnpm lint:md` to confirm repository markdown still passes after adding the design, plan, and template changes.
