# Repository audit checklist

Use this checklist when comparing an existing repository with the files and
settings produced by `scaffold-repository`.

Describe each problem with one of these values:

- `missing`: the file does not exist.
- `stale`: the file exists but needs the current dependencies, scripts, or
  documented rules.
- `divergent`: the file has a different structure that must be reconciled by
  hand instead of replaced.

For every problem, recommend a specific change and show the proposed diff. Do
not change an existing repository until the user approves the change.

## 1. Development tools

Run the complete file check first:

```bash
bash <skill-dir>/scripts/verify-baseline.sh --public <repo-root>
# For a private repository:
bash <skill-dir>/scripts/verify-baseline.sh --private <repo-root>
```

The script reads [`core-baseline.txt`](./core-baseline.txt) and reports every
missing path. Classify those paths as `missing`. The checks below explain what
each file must contain.

| File | Required | Check |
| --- | --- | --- |
| `.gitignore` | yes | Contains `node_modules/` and `.skills-install.lock*`. Does not ignore `.agents/skills/**` or `.claude/skills/**`, because installed skills are committed. |
| `.gitattributes` | yes | Contains `* text=auto eol=lf`. |
| `.editorconfig` | yes | Contains `root = true` and `end_of_line = lf`. |
| `.nvmrc` | yes | Exists. |
| `.markdownlint.jsonc` | yes | Is valid JSONC and contains only rule settings. |
| `.markdownlint-cli2.jsonc` | yes | Is valid JSONC. Its `ignores` array includes `.agents/skills/**` and `.claude/skills/**`. It does not exclude the repository's own `skills/**`. |
| `.markdownlintignore` | no | Does not exist. `markdownlint-cli2` does not read it. If it exists, classify it as `stale` and move its entries to `.markdownlint-cli2.jsonc` under `ignores`. |
| `commitlint.config.js` | yes | Extends `@commitlint/config-conventional` and defines the `ticket-required` rule. |
| `commitizen.config.json` | yes | Remains JSON because `cz-customizable` loads it with CommonJS `require()`. |
| `.husky/commit-msg` | yes | Runs `pnpm exec commitlint --edit "$1"`. |
| `.husky/pre-commit` | yes | Runs `pnpm exec lint-staged`. |
| `package.json` | yes | Defines `author.name`, `author.email`, `author.url`, `type: module`, `packageManager: pnpm@10.x`, and `engines.node >= 24`. Scripts include `lint:md`, `env:setup: pnpm install`, `clean: bash scripts/clean.sh`, and `skills:install: pnpm dlx skills@latest experimental_install --yes`. It has no `postinstall` skill installation, retired skill scripts, or custom `scripts/install-skills.sh`. Recommend a repository-specific `test` script only when the repository has useful automated checks. |
| `pnpm-lock.yaml` | yes | Exists. |
| `skills-lock.json` | yes | Is valid JSON. Each installed skill has a GitHub `source` and `skillPath`. An empty installation uses an empty `skills` object. Do not require a `ref`; the skills CLI follows the source repository's default branch. |
| `scripts/clean.sh` | yes | Is executable. Removes only generated dependencies and temporary installation files such as `node_modules/` and `.skills-install.lock*`. Never removes committed files under `.agents/skills/**` or `.claude/skills/**`. |
| `scripts/worktree-setup.sh` | yes | Is executable and safe to run more than once. Fast-forwards to the repository's default branch, without assuming it is named `main`, and runs `pnpm env:setup`. Both the Claude `SessionStart` hook and Codex `[setup]` use it. |
| `.codex/environments/environment.toml` | yes | Its `[setup]` command runs `bash scripts/worktree-setup.sh`. |
| `.codex/config.toml` | yes | Registers the hosted Linear MCP server. |
| `.mcp.json` | yes | Registers the hosted Linear MCP server for supported tools. |
| `CHANGELOG.md` | yes | Works with release-please. Released sections have not been edited by hand. |
| `docs/release-flow.md` | yes | Explains the release-please process. |

## 2. GitHub files and settings

| File or setting | Required | Check |
| --- | --- | --- |
| `.github/pull_request_template.md` | yes | Contains HTML comments only, with no visible body text or section headings. The comments remind authors to add one closing reference per completed issue using the repository's tracker format and to avoid accidental agent mentions. |
| `.github/ISSUE_TEMPLATE/config.yml` | yes | Public repositories accept GitHub issues. Private repositories disable blank issues and direct people to Linear. |
| GitHub issue forms | depends on visibility | Public repositories may have them. Private repositories do not. |
| `.github/CODEOWNERS` | yes | Has at least one rule that is not a comment. |
| `.github/workflows/pull-request.yml` | yes | Checks pull request title format, breaking-change marker consistency, and the closing keyword. |
| `.github/workflows/markdown.yml` | yes | Runs `DavidAnson/markdownlint-cli2-action` on pull requests. |
| `.github/workflows/actions.yml` | yes | Runs `actionlint` when a pull request changes `.github/workflows/**`. |
| `.github/actionlint.yaml` | yes | Lists permitted self-hosted runner labels. |
| Release smoke test | yes | After applying approved changes, use `gh workflow run Release --repo <owner>/<repo>` in a repository with at least one `feat:` or `fix:` commit since its last tag. Confirm that release-please opens or updates a release pull request and that merging it creates a tag and GitHub Release. If the repository has no release and the default workflow permission is `read`, report the permission problem. |
| Default workflow permission | yes | `gh api repos/<owner>/<repo>/actions/permissions/workflow --jq .default_workflow_permissions` returns `write`. If it returns `read`, recommend **Settings > Actions > General > Workflow permissions > Read and write permissions**. Run this check even before the first release. |
| Tag signature rules | yes | `gh api repos/<owner>/<repo>/rulesets --jq '.[] \| select(.target=="tag")'` finds no `required_signatures` rule that applies to release tags. Release Please cannot sign tags. If such a rule exists, recommend limiting it to branches or non-release tags. |

Treat a pull request template as `stale` when it contains visible body text or
section headings. The repository's pull request instructions own the body
structure.

### Required GitHub label

The label `autorelease: pending` must exist with color `ededed` and a non-empty
description saying that Release Please uses it. Check it with:

```bash
gh label list --repo <owner>/<repo> --json name,color,description --jq \
  '.[] | select(.name=="autorelease: pending")'
```

## 3. Agent and repository documentation

The real issue-tracker instructions live at `docs/agents/issue-tracker.md`.
`docs/issue-tracker.md` is a compatibility symlink to that file. This layout
lets the Matt Pocock skills and this repository share one file. The target
repository records the choice in
`docs/adr/ADR-354-agents-canonical-tracker-adapter.md`.

| File | Required | Check |
| --- | --- | --- |
| `AGENTS.md` | yes | Covers the project structure, commands, conventions, commits, and pull requests. The "Commit type selection" section begins with the product-file patterns and one sentence telling agents to choose the type from the changed paths. It then contains the type table, a table of common excuses and corrections, a stop rule for warning signs, and at least one WRONG to RIGHT example. Check equivalent agent instruction files with `rg`. |
| `AGENTS.md` testing rule | yes | Says that tests may check code behavior and machine-read formats, but must not assert on documentation prose. Markdown linting is still allowed. Add the rule if it is missing. |
| `CLAUDE.md` | yes | Imports `@AGENTS.md`, followed by any Claude-only instructions. |
| `CONTRIBUTING.md` | yes | Points contributors to `AGENTS.md`. |
| `SECURITY.md` | public only | Exists in public repositories and is absent from private repositories. |
| `README.md` | yes | Includes the repository name, description, and a short conventions summary. |
| `docs/file-structure.md` | yes | Exists. |
| `docs/agents/issue-tracker.md` | yes | Is the real and only tracker-specific instruction file. It selects GitHub for public repositories and Linear for private repositories. It contains `## Pull requests as a triage surface`, `## When a skill says "publish to the issue tracker"`, `## When a skill says "fetch the relevant ticket"`, and `## Wayfinding operations`. The `triage` and `wayfinder` skills depend on those headings. |
| `docs/issue-tracker.md` | yes | Is a relative symlink to `agents/issue-tracker.md`. Two real copies are `divergent`. |
| `docs/agents/domain.md` | yes | Tells agents when domain documentation is useful. It is a settings file used by `setup-matt-pocock-skills`, not the domain documentation itself. |
| `docs/agents/triage-labels.md` | when `triage` is installed | Maps the triage roles to this repository's labels. It may point to the issue-tracker instructions instead of repeating them. |
| `docs/issue-publishing.md` | yes | Contains issue-writing rules that work with either tracker. |

## 4. Claude Code settings

| File | Required | Check |
| --- | --- | --- |
| `.claude/settings.json` | yes | Is valid JSONC. Defines `enabledPlugins` as an object. Registers a `SessionStart` hook with the `startup` event that runs `bash scripts/worktree-setup.sh`. |

Leave `enabledPlugins` empty in a newly scaffolded repository unless that
repository chooses specific plugins. The `SessionStart` hook and Codex `[setup]`
must run the same worktree preparation script.

## 5. Installed skills

Installed project skills are committed so they are available immediately in a
new worktree.

| File or command | Required | Check |
| --- | --- | --- |
| `skills-lock.json` | yes | Lists each installed skill with a GitHub `source` and `skillPath`, or contains an empty `skills` object. Do not require a `ref`; the skills CLI follows the source repository's default branch. |
| Installed skill directories | yes | Every locked skill has a tracked `.agents/skills/<name>/` directory and a matching tracked relative symlink at `.claude/skills/<name>`. |
| `scripts/clean.sh` | yes | Removes only generated dependencies and temporary installation files. It does not remove committed skill files. |
| `package.json` | yes | Includes `env:setup: pnpm install`, `skills:install: pnpm dlx skills@latest experimental_install --yes`, and `clean: bash scripts/clean.sh`. It has no `postinstall` skill installation and no custom `scripts/install-skills.sh`. |
| `.gitignore` | yes | Ignores `node_modules/` and `.skills-install.lock*`, but not `.agents/skills/**` or `.claude/skills/**`. |
| Markdown lint exclusion | yes | `.markdownlint-cli2.jsonc` excludes installed skill directories. Test the actual command used by `lint-staged`: `pnpm exec markdownlint-cli2 <an installed skill file>` must report `Linting: 0 file(s)`. |
| `pnpm skills:install` | when skills are locked | Reinstalls the committed skill directories from `skills-lock.json` with `skills experimental_install`. Commit the resulting changes. |
| `npx --yes skills@latest list --json` | yes | Lists installed skills and any symlinked skills authored in the repository. |
| `install-skills` | when at least one skill is locked | Is also locked. Its `catalog-change.md` explains how to update installed skills, find outdated copies, and describe the change in a pull request. Recommend installing it when it is missing. |

## 6. Removed workflow files

Look for instructions and dependencies from workflows the repository no longer
uses.

| File | Required | Check |
| --- | --- | --- |
| `docs/superpowers/` | no | Is absent from new repositories. If it exists, classify it as `stale` unless the repository intentionally keeps historical files. |
| `package.json` | no | Does not install retired workflow dependencies by default. |
| `AGENTS.md` | yes | Tells agents to record durable issue context in the repository's selected tracker, following `docs/agents/issue-tracker.md`, rather than committing routine design or plan files. |
| Installation documentation | no | Does not require Superpowers for a new installation. |

## 7. GitHub merge settings

Read the settings with the first available method:

1. Use `gh api "repos/<owner>/<repo>"` when `gh` is installed.
2. For a public repository without `gh`, use
   `curl -s "https://api.github.com/repos/<owner>/<repo>"`.
3. For a private repository without `gh`, skip the command check and explain
   how to inspect the settings in GitHub.

Change settings through GitHub or `gh api -X PATCH`. The GitHub page is
`https://github.com/<owner>/<repo>/settings#pull-requests-heading`. Report how
you read the settings and list each differing value. Do not change anything
without the user's approval.

| Field | Expected value |
| --- | --- |
| `allow_squash_merge` | `true` |
| `allow_merge_commit` | `false` |
| `allow_rebase_merge` | `false` |
| `squash_merge_commit_title` | `PR_TITLE` |
| `squash_merge_commit_message` | `COMMIT_MESSAGES` |
| `delete_branch_on_merge` | `true` |
| `allow_update_branch` | `true` |
| Release immutability | enabled in the GitHub settings page |

## 8. Commit and pull request titles

- Inspect the newest 20 commits on the default branch. If more than half do not
  use `type: <issue-reference> short description`, recommend adding the
  `commit-msg` hook and documenting the rule in `AGENTS.md`.
- Inspect the newest 10 open pull request titles. Report any title that does not
  use the required format. Do not rename it automatically.

## Report each problem

Use this format:

```text
[<area>] <file> - <missing|stale|divergent>
  Recommendation: <one-line change>
  Diff preview:
    <unified diff against the current scaffold files>
  Action? (accept / skip / defer)
```

Present the changes in this order. Each group must include every listed file.

1. Commit and pull request rules: `commitlint.config.js`, `.husky/*`,
   `.github/pull_request_template.md`, and the correct issue form for the
   repository's visibility.
2. PNPM, skill installation, and issue tracker setup: `package.json`,
   `.markdownlint.jsonc`, `.markdownlint-cli2.jsonc`, `pnpm-lock.yaml`,
   `skills-lock.json`, `scripts/clean.sh`, `scripts/worktree-setup.sh`,
   `.claude/settings.json`, `.codex/config.toml`,
   `.codex/environments/environment.toml`, `.mcp.json`,
   `docs/issue-tracker.md`, `docs/agents/issue-tracker.md`,
   `docs/issue-publishing.md`, and `.gitignore`.
3. Agent and repository documentation: `AGENTS.md`, `CLAUDE.md`,
   `CONTRIBUTING.md`, `README.md`, and `docs/release-flow.md`.
4. GitHub workflows: `actions.yml`, `markdown.yml`, and `pull-request.yml`.
5. Removed workflow files.
