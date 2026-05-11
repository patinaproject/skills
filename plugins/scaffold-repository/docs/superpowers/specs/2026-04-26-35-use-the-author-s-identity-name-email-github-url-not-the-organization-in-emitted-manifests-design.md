# Design: Use the author's identity (name, email, GitHub URL), not the organization, in emitted manifests [#35](https://github.com/patinaproject/bootstrap/issues/35)

## Context

The bootstrap skill currently treats the repository owner and the package or
plugin author as overlapping identities. The core `package.json.tmpl` writes
`author.name` and `author.email` from `git config`, but it does not write an
author URL. The agent-plugin `.claude-plugin/plugin.json.tmpl` and
`.codex-plugin/plugin.json.tmpl` write `author.name` from `git config`, omit
`author.email`, and set `author.url` to `https://github.com/{{owner}}`.

That produces mixed identity in organization-owned repositories: a human name
paired with an organization URL. The issue asks for a single author identity
record across all three manifests while preserving repository-level URLs for
`homepage`, `repository`, and Codex interface links.

## Intent

Make scaffolded and realigned plugin repositories emit consistent human author
metadata in `package.json`, `.claude-plugin/plugin.json`, and
`.codex-plugin/plugin.json`: name, email, and GitHub profile URL all describe
the author, while repository fields continue to describe the owning repository.

## Decisions

### D1. Add an explicit `<author-handle>` input

Extend the bootstrap prompt table with `<author-handle>`. The value represents
the GitHub username used in `https://github.com/<author-handle>`.

Default resolution order:

1. Try `gh api user --jq .login`.
2. If that cannot produce a non-empty login, prompt the operator with
   `Author GitHub handle (for author URL)?`.

No owner fallback is allowed. If the automatic lookup fails, silently reusing
`<owner>` would recreate the bug for organization-owned repositories.

### D2. Treat author metadata as one manifest record

All three emitted manifests should use the same author record:

- `name`: `{{author-name}}`
- `email`: `{{author-email}}`
- `url`: `https://github.com/{{author-handle}}`

The template changes are:

- Add `url` to `skills/bootstrap/templates/core/package.json.tmpl`.
- Add `email` to both plugin manifest templates.
- Change both plugin manifest `author.url` values from `{{owner}}` to
  `{{author-handle}}`.

The issue states that `git config user.name` and `git config user.email` are
already the correct source for name and email, so this design does not add a
new source for those two fields.

### D3. Keep repository URLs owner-based

Do not change repository-level URL fields. In plugin manifests, `homepage`,
`repository`, `interface.websiteURL`, `interface.privacyPolicyURL`, and
`interface.termsOfServiceURL` continue to use `https://github.com/{{owner}}/{{repo}}`.

This keeps attribution separate from project hosting and satisfies the issue's
out-of-scope boundary.

### D4. Document realignment behavior

Update `skills/bootstrap/SKILL.md` and `skills/bootstrap/audit-checklist.md` so
realignment mode treats stale author metadata as a concrete divergence:

- `package.json` author must include `name`, `email`, and `url`.
- Plugin manifest author blocks must include `name`, `email`, and `url`.
- The author URL must use the resolved `<author-handle>`, not `<owner>`.

When a target repo already has org-based author URLs, realignment should flag
that divergence and offer the normal interactive rewrite.

### D5. Reconcile this repository through the template loop

`AGENTS.md` requires baseline-config changes to be edited in templates first and
then mirrored into root files via local realignment. The root `package.json`,
`.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json` are all covered
files, so this PR must include both template edits and mirrored root edits.

The expected root author URL for this repository is `https://github.com/tlmader`
when `gh api user --jq .login` resolves to `tlmader`.

## Out of scope

- Changing `homepage`, `repository`, or Codex interface URLs away from
  `https://github.com/<owner>/<repo>`.
- Introducing author identity sources beyond `git config` for name/email and
  `gh api user` or prompt for the GitHub handle.
- Adding non-interactive realignment flags.
- Handling CI bot author identity flows.

## Acceptance criteria

### AC-35-1

Authenticated `gh` produces a consistent author block in all three manifests.

- Given `bootstrap` is run with `gh` authenticated as `tlmader`,
- And `git config user.name = "Ted Mader"`,
- And `git config user.email = ted@patinaproject.com`,
- When the manifests are written,
- Then `package.json`, `.claude-plugin/plugin.json`, and
  `.codex-plugin/plugin.json` all contain `author.name = "Ted Mader"`,
  `author.email = "ted@patinaproject.com"`, and
  `author.url = "https://github.com/tlmader"`.

### AC-35-2

Unauthenticated `gh` falls back to a required author-handle prompt.

- Given `bootstrap` is run with `gh` unavailable or unauthenticated,
- When the author URL cannot be resolved automatically,
- Then the skill prompts `Author GitHub handle (for author URL)?`,
- And it uses the provided handle as `https://github.com/<handle>`,
- And it does not fall through to `https://github.com/<owner>`.

### AC-35-3

Repository URLs remain owner/repo URLs.

- Given a bootstrapped plugin repo,
- When `homepage` and `repository` URLs in the plugin manifests are inspected,
- Then they still point to `https://github.com/<owner>/<repo>`,
- And only the `author.url` field points to the personal author profile.

### AC-35-4

Realignment mode flags org-based author URLs.

- Given a target repo whose package or plugin author URL currently points at
  `https://github.com/<owner>`,
- When the bootstrap skill runs in realignment mode,
- Then the audit reports the author block divergence,
- And the normal interactive realignment flow offers to rewrite it to
  `https://github.com/<author-handle>`.

## Validation strategy

Executor should validate the final change with targeted content checks and
markdown lint:

- Inspect the three template files for `{{author-handle}}`, author email, and
  preserved owner/repo URLs.
- Inspect the mirrored root manifests for `https://github.com/tlmader` in
  `author.url`.
- Run `pnpm lint:md`.
- Run `pnpm check:versions` to ensure mirrored plugin manifest versions still
  match `package.json`.
