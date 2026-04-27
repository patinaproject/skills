# Design: Rename repository to using-github [#22](https://github.com/patinaproject/using-github/issues/22)

## Goal

Rename the repository, plugin, package, and display identity from
`github-flows` to `using-github`, and collapse the shipped skill surface to the
single `using-github` entry point. The remaining skill must enforce the GitHub
workflow behavior that used to be split across the specialized skills. The repo
should be ready for the maintainer-owned GitHub settings rename and should
document the expected local remote update path for existing users.

## Requirements

- AC-22-1: Given this repository has not yet been renamed in GitHub settings,
  when this issue is implemented, then repository metadata and docs prepare for
  `patinaproject/using-github` and document the maintainer-owned GitHub settings
  rename as a required post-merge step.
- AC-22-2: Given repository-owned documentation or metadata references the
  canonical repository slug, when this issue is implemented, then those
  references use `patinaproject/using-github` where appropriate.
- AC-22-3: Given existing users may have links or remotes pointing at
  `patinaproject/github-flows`, when the rename is complete, then compatibility
  expectations are documented for GitHub redirects or local remote updates.
- AC-22-4: Given the plugin is installed after this change, when an agent lists
  available skills from this repository, then only the `using-github` skill is
  shipped.
- AC-22-5: Given users previously invoked the removed specialized skills, when
  they read the release-facing documentation for this change, then the removal
  is marked as a breaking change and points them to `using-github` as the
  remaining entry point.
- AC-22-6: Given an agent follows the remaining `using-github` skill, when it
  performs GitHub work covered by the former specialized skills, then the skill
  enforces the same repository-rule discovery, label/template use, issue safety,
  branch naming, changelog, PR, and public-repo leak-guard behavior without
  delegating to removed local skills.
- AC-22-7: Given a former specialized workflow is removed as a directly
  invokable skill, when reviewers inspect the implementation, then a
  traceability matrix maps each removed workflow, happy path, and
  refusal-condition group to its new location in `using-github` or required
  adjacent support docs.
- AC-22-8: Given plugin/package metadata is updated, when the repo is built or
  published after this change, then package names, plugin names, display names,
  install examples, and current marketplace-facing metadata use `using-github`.

## Current State

The repo, plugin manifests, package metadata, install examples, and several
editor guidance surfaces still use `github-flows`. The newer entry-point skill
is `using-github`, but the plugin also ships `new-issue`, `edit-issue`,
`new-branch`, and `write-changelog` as directly invokable skills. Removing those
specialized skills is a breaking change for users who invoke them directly. The
behavior those skills define is still expected to exist; only the direct
specialized invocation surface is being removed.

The repository also contains historical design docs, plans, changelog entries,
issue links, and release links that point at `patinaproject/github-flows`.
Historical artifacts should remain accurate records unless they are part of
current user-facing setup or canonical metadata.

## Approach

Use a targeted repository-slug sweep paired with an explicit skill-surface
reduction.

1. Update current canonical repository URL references in active docs and
   metadata, such as badges, release links, issue-filing guidance, release
   automation documentation, and any package/plugin repository field if present.
2. Rename plugin and package identity to `using-github` in current manifests,
   package metadata, display names, install examples, and marketplace-facing
   local metadata.
3. Remove all skill directories except `skills/using-github`.
4. Update `using-github` so it remains a useful router for GitHub work without
   instructing agents to invoke removed local skills. It should directly encode
   the enforceable rules agents need for issue creation, issue editing, issue
   branch creation, milestone changelog rendering, PR preparation, label and
   template handling, relationship handling, duplicate checks, and public-repo
   leak guarding.
5. Add a traceability matrix that maps each removed workflow and its major
   happy path and refusal-condition groups to the remaining skill or required
   adjacent support docs.
6. Update current install, usage, and release-facing documentation to mark the
   specialized skill removal as a breaking change and to name `using-github` as
   the supported entry point.
7. Preserve historical changelog links and prior Superpowers artifacts unless a
   current workflow depends on them as canonical live references.
8. Add clear maintainer guidance for the manual GitHub settings rename and for
   users who may want to update local remotes after GitHub redirect handling.

This keeps the change reviewable while making the intended breaking change
visible instead of silently leaving removed direct-entry skills documented.

## Companion Repository Work

The `patinaproject/skills` marketplace and catalog surfaces are tracked in
patinaproject/skills#35. This repository should not attempt to update those
files directly. It may link to that issue where coordination context is useful.

## Validation

- Run `find skills -maxdepth 2 -name SKILL.md -print` and confirm only
  `skills/using-github/SKILL.md` remains.
- Run `rg '\"name\": \"github-flows\"|displayName.: \"github-flows\"|github-flows@patinaproject-skills'
  package.json .claude-plugin .codex-plugin README.md` and confirm no current
  package/plugin/install identity references remain.
- Run `rg 'new-issue|edit-issue|new-branch|write-changelog' skills README.md
  AGENTS.md docs/issue-filing-style.md` and review remaining matches as either
  historical, migration, or breaking-change context.
- Review `skills/using-github/SKILL.md` for direct, enforceable GitHub workflow
  rules rather than references to removed local skill files.
- Review the workflow traceability matrix and confirm every removed skill has
  happy-path and refusal-condition coverage.
- Run `rg 'patinaproject/github-flows|github.com/patinaproject/github-flows'`
  and review remaining matches as intentional historical records, compatibility
  notes, or plugin namespace examples.
- Run `pnpm lint:md`.
- Review the changed docs with `sed -n '1,220p' <file>` for formatting and
  markdownlint-sensitive line length.

## Out of Scope

- Performing the GitHub repository settings rename from code.
- Keeping backwards-compatible direct invocations for removed specialized
  skills.
- Keeping the old `github-flows` plugin or package identity.
- Updating `patinaproject/skills` marketplace files beyond the companion issue.
- Rewriting historical changelog entries, old plans, or old design docs only to
  change archival links.
