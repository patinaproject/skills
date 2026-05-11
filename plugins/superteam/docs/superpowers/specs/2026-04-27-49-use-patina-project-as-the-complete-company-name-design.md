# Design: Use Patina Project as the complete company name [#49](https://github.com/patinaproject/superteam/issues/49)

## Intent

Update public-facing documentation so display references to the company use the
complete name, `Patina Project`, while preserving machine-readable
`patina`/`patinaproject` identifiers exactly as they are.

## Requirements

- Replace public-facing prose that names the company as `Patina` with
  `Patina Project`.
- Preserve repository owners, repository slugs, URLs, domains, package names,
  command examples, GitHub App names, bot identities, secrets, and other
  machine-readable identifiers.
- Audit the known affected files, `README.md` and `RELEASING.md`, plus adjacent
  repository documentation surfaces found by text search.
- Keep the change documentation-only and avoid unrelated wording rewrites.
- Use acceptance criteria IDs in the `AC-49-<n>` format.

## Design

### Documentation wording

Update the visible prose in `README.md` where the marketplace is described as
the `Patina marketplace` or as distributing `Patina plugins`. These should read
as the `Patina Project marketplace` and `Patina Project plugins`.

Update the visible prose in `RELEASING.md` where forks outside the company and
marketplace manifests are described with the shortened company name. Those
sentences should refer to `Patina Project` while retaining the surrounding
release and marketplace meaning.

Do not expand lowercase or identifier-shaped uses such as `patinaproject`,
`patinaproject/skills`, `patinaproject/superteam`,
`patina-project-automation`, `PATINAPROJECT_AUTOMATION_APP_ID`, email domains,
or GitHub URLs. Those strings are identifiers rather than company-display prose.

### Verification

Verification should prove both sides of the issue:

- remaining uppercase `Patina` prose is either already `Patina Project` or a
  deliberate identifier/name context such as `patina-project-automation`
- lowercase `patina` and `patinaproject` identifiers remain present and
  unchanged
- Markdown linting passes after the documentation edits

Use targeted search output before and after the edit, then run
`pnpm lint:md`.

## Acceptance Criteria

- **AC-49-1**: Given a public-facing docs sentence refers to the company as
  `Patina`, when the wording is updated, then it uses `Patina Project` instead.
- **AC-49-2**: Given a repository slug, URL, package name, or identifier
  contains `patina`, when the audit is performed, then that identifier is
  preserved.

## Out of Scope

- Renaming the `patinaproject` GitHub owner or repository references.
- Renaming domains, email addresses, package names, secrets, GitHub App names,
  bot identities, or workflow identifiers.
- Editing generated changelog content or historical planning artifacts.
