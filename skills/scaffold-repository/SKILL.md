---
name: scaffold-repository
description: Set up a new repository with the Patina Project standard files, or compare and update an existing repository. Use when the user asks to scaffold a repository, audit its conventions, align it with Patina Project, or configure commitlint and Husky.
---

# Set up a repository

Use the current root of
[`patinaproject/skills`](https://github.com/patinaproject/skills) as the source
for file contents except the consumer pull request template named below. Read
[`core-baseline.txt`](./core-baseline.txt) for the required file list and
[`audit-checklist.md`](./audit-checklist.md) for every required check.

When running outside `patinaproject/skills`, fetch a single source file with:

```sh
gh api repos/patinaproject/skills/contents/<path> --jq .content | base64 -d
```

For many files, use a shallow temporary clone:

```sh
git clone --depth 1 https://github.com/patinaproject/skills.git /tmp/patinaproject-skills-reference
```

If neither the network nor a local checkout is available, ask the user for a
copy of the reference repository. Do not recreate files from memory.

## Choose the type of work

Use new-repository setup when the target is a Git repository and has none of
the Patina files, such as `AGENTS.md`, `commitlint.config.js`, or the standard
scripts in `package.json`.

Use existing-repository update when any of those files already exist.

### New repository

1. Read `core-baseline.txt` and copy every required file from the current
   Patina repository.
2. Fill in repository-specific values from the inputs below.
3. Omit marketplace-only test and maintenance files. The manifest already
   excludes them.
4. Run `pnpm install` to create `pnpm-lock.yaml` and configure Husky.
5. Stage the created files but leave them uncommitted so the user owns the
   first commit.

### Existing repository

1. Read `audit-checklist.md` in full and run every applicable check.
2. Use the difference names and definitions from `audit-checklist.md` so the
   report matches its required output.
3. For each difference, explain the recommended change and show a unified diff
   against the current Patina file.
4. Ask the user to accept, skip, or defer each recommendation before changing
   an existing file. There is no non-interactive overwrite mode.
5. Present changes in the order specified by `audit-checklist.md`: commit and
   pull request rules, package and skill tools, repository documentation,
   GitHub workflows, then removal of retired setup.
6. If an accepted change modifies a non-empty `skills-lock.json`, run
   `pnpm skills:install`, confirm that the project-local skills appear in
   `npx --yes skills@latest list --json`, and include the refreshed
   `.agents/skills/` directories and `.claude/skills/` links.

The `patinaproject/skills` repository itself may use this mode. Do not skip it
because it is the source repository. Its root pull request template is the
intentional repo-only exception recorded in
`docs/adr/ADR-445-repository-pull-request-body-contract.md`; apply every other
audit check normally.

## Repository inputs

Read the repository owner and name from `origin` when possible. Read author name
and email from `git config user.name` and `git config user.email`. Use the email
as the public security contact. Stop if the configured name or email is missing.

Resolve the author's GitHub handle with `gh api user --jq .login`. If that
fails, ask `Author GitHub handle for the package author URL?` without a default.

Ask for any value that cannot be determined:

| Value | Default |
| --- | --- |
| Repository owner | Owner from `origin` |
| Repository name | Name from `origin` |
| One-line description | None |
| Visibility | `public` |
| Code owner | `@<owner>` |
| Security contact | Configured Git email |
| Author name | Configured Git name |
| Author email | Configured Git email |
| Author GitHub handle | Current authenticated GitHub user |

Write the author name, email, and `https://github.com/<author-handle>` into the
`package.json` author field. Repository URLs continue to use the repository
owner and name.

## Required file behavior

`core-baseline.txt` is the file list used by
`scripts/verify-baseline.sh`. Use it instead of copying a second list into this
skill.

Four entries require special handling:

- Copy `.github/pull_request_template.md` from
  [`pr-body-template.md`](./pr-body-template.md), not from this repository's
  root template. The root's comment-only template is usable only with the
  Engineering plugin body contract that ordinary scaffold consumers do not
  receive.
- When the target does not contain the `opening-a-pr` playbook, adapt the
  copied `AGENTS.md` and `CONTRIBUTING.md` to name the local pull request
  template as their body contract. Every referenced contract must exist in the
  target repository.
- Create `SECURITY.md` only for public repositories.
- Keep the real tracker instructions at `docs/agents/issue-tracker.md`. Create
  `docs/issue-tracker.md` as the relative link `agents/issue-tracker.md`.

Do not copy marketplace maintenance tests, generated skill links, or release
workflows into an ordinary repository. Adapt copied workflows to the files the
target repository actually receives.

The default `.claude/settings.json` has an empty `enabledPlugins` object. It
still registers `bash scripts/worktree-setup.sh` as its `SessionStart` startup
hook. The Codex environment runs the same script from its `[setup]` block.
Projects may enable plugins later.

Use the exact current files and the checks in `audit-checklist.md` for commit
format, pull request format, Markdown linting, package scripts, committed local
skills, agent instructions, issue tracking, releases, action pinning, labels,
and workflow permissions. Do not restate those changing details from memory.

## GitHub merge settings

Check current settings with `gh` when available:

```bash
gh api "repos/<owner>/<repo>" --jq '{allow_squash_merge, allow_merge_commit, allow_rebase_merge, squash_merge_commit_title, squash_merge_commit_message, delete_branch_on_merge, allow_update_branch}'
```

For a public repository without `gh`, use the public API with `curl`. If the
repository is private and authenticated tools are unavailable, show the user
the expected values and ask them to inspect GitHub settings.

Expected values:

| Setting | Value |
| --- | --- |
| Squash merges | On |
| Merge commits | Off |
| Rebase merges | Off |
| Squash title | `PR_TITLE` |
| Squash message | `COMMIT_MESSAGES` |
| Delete branch after merge | On |
| Suggest branch updates | On |
| Release immutability | On |

Report how settings were checked and every difference. Ask for confirmation
before changing settings. With confirmation, update supported values with:

```bash
gh api -X PATCH "repos/<owner>/<repo>" \
  -F allow_squash_merge=true \
  -F allow_merge_commit=false \
  -F allow_rebase_merge=false \
  -F squash_merge_commit_title=PR_TITLE \
  -F squash_merge_commit_message=COMMIT_MESSAGES \
  -F delete_branch_on_merge=true \
  -F allow_update_branch=true
```

Release immutability must be enabled in GitHub under Settings, General,
Releases. The normal repository API does not expose that setting.

Also apply the repository settings checks in `audit-checklist.md`, including
workflow write permission, tag signing rules for release tags, and the reserved
`autorelease: pending` label. Never add or remove Release Please labels as part
of ordinary issue or pull request work.

## Verify the result

Run the presence check first. Other tools may pass even when none of the
required files were copied.

```bash
bash <skill-directory>/scripts/verify-baseline.sh --public
# Use --private for a private repository.
pnpm install
pnpm exec commitlint --help
pnpm lint:md
echo "feat: bad" | pnpm exec commitlint
echo "feat: #1 ok" | pnpm exec commitlint
```

The bad commit message must fail. The public example with `#1` must pass. Use
the repository's private issue format for a private repository.

Resolve `<skill-directory>` to this skill's installed directory. Run the
verification script from the target repository or pass the target repository
root as its final argument. Treat every missing path as a failed setup.

Before committing Markdown changes, run:

```bash
pnpm exec markdownlint-cli2 --fix "**/*.md"
```

## Changing a private repository to public

When the user asks to make a private repository public, read
[the visibility migration instructions](./public-repository-migration.md).
Changing issue tracking or Git history is separate from a normal repository
update and requires its own reviewed plan.

## Final report

For a new repository, list the staged files and any values the user still must
provide. For an existing repository, list accepted, skipped, and deferred
changes by batch. Include failed checks, GitHub settings differences, and the
exact user action needed for anything unfinished.
