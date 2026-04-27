# Design: Use Patina Project as the complete company name

Issue: [patinaproject/skills#33](https://github.com/patinaproject/skills/issues/33)

## Intent

Update public-facing documentation that refers to the company as `Patina` so it
uses the complete company name, `Patina Project`, while preserving repository
slugs, URLs, package names, domains, and machine-readable identifiers that
contain `patina` or `patinaproject`.

## Context

- The repository guidance already describes this repo as the marketplace surface
  for `Patina Project` plugins and related install documentation.
- The issue identifies one known affected sentence in
  [2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md](./2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md).
- The repo also contains many intentional identifier uses such as
  `patinaproject/skills`, `patinaproject-skills`, GitHub URLs, package metadata,
  and email/domain strings. Those are out of scope for renaming.

## Requirements

1. Public-facing prose that names the company as `Patina` must use
   `Patina Project` instead.
2. Repository slugs, URLs, package names, marketplace identifiers, email
   addresses, domains, and other machine-readable identifiers must be preserved.
3. The change must be limited to documentation wording unless the audit finds a
   public-facing metadata field with the same incomplete company-name wording.
4. Verification must include a search that distinguishes prose references from
   identifier uses.

## Acceptance Criteria

### AC-33-1

Given a public-facing docs sentence refers to the company as `Patina`, when the
wording is updated, then it uses `Patina Project` instead.

### AC-33-2

Given a repository slug, URL, package name, or identifier contains `patina`, when
the audit is performed, then that identifier is preserved.

## Approaches Considered

### Recommended: Targeted prose correction plus audit

Update only the incomplete company-name prose discovered by the audit, then
verify remaining `Patina` and `patina` matches are either already complete
`Patina Project` wording or intentional identifiers. This best matches the issue
scope and avoids rewriting historical artifacts unnecessarily.

### Broader historical documentation rewrite

Review and rewrite every historical Superpowers artifact to normalize broader
branding language. This would increase churn in old planning artifacts without
improving the specific public-facing sentence identified by the issue.

### Metadata and identifier rename

Rename slugs or identifiers to include the complete company name. This directly
conflicts with the issue's non-goals and would risk breaking install flows.

## Decision

Use the targeted prose correction plus audit. The implementation should update
the known `other Patina plugins` phrase to `other Patina Project plugins`, then
run searches over docs and marketplace surfaces to confirm no incomplete
company-name prose remains and identifier strings are unchanged.

## Verification

- Search public docs and marketplace surfaces for `Patina` and `patina`.
- Confirm the changed sentence uses `Patina Project`.
- Confirm intentional identifiers such as `patinaproject/skills`,
  `patinaproject-skills`, GitHub URLs, package metadata, and domain/email values
  remain unchanged.
- Run Markdown lint for the edited Markdown files.

## Out of Scope

- Renaming GitHub organization or repository slugs.
- Renaming marketplace identifiers such as `patinaproject-skills`.
- Renaming package names, URLs, domains, or email addresses.
- General copyediting of unrelated historical planning artifacts.

## Concerns

No approval-relevant concerns remain.
