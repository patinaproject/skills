---
name: scaffold-repository
description: Use when scaffolding a new repository (public or private) to the Patina Project baseline, when realigning an existing repository with that baseline, or when auditing or adding commit conventions, PR templates, husky + commitlint, PNPM tooling, release-please, agent docs (AGENTS.md, CLAUDE.md), or AI agent plugin manifests for Claude Code, Codex, Cursor, Windsurf, and Copilot. Triggers on phrases like "scaffold this repo", "scaffold a Patina plugin", "realign with the baseline", "audit our repo conventions", "set up commitlint and husky", or "add Codex/Cursor/Windsurf surfaces".
---

# scaffold-repository

`scaffold-repository` scaffolds a repository – new or existing – to the Patina Project baseline. The baseline mirrors [`patinaproject/superteam`](https://github.com/patinaproject/superteam): a dual-plugin repository root, a self-contained `skills/` directory, conventional-commits-with-issue-ref enforcement, a PR template, `AGENTS.md` + `CLAUDE.md`, a human-readable `README.md`, a `docs/file-structure.md` contributor reference, and PNPM + Husky + markdownlint tooling.

## Modes

The skill detects which mode to run based on target-repo state.

### New-repo mode

Preconditions:

- Target is a git repository (may be empty or just initialized).
- No prior `.claude-plugin/` or `.codex-plugin/` manifests.

Behavior:

- Emit the full [core baseline](#core-baseline) tree.
- If the user answers yes to "Is this an AI agent plugin?", additionally emit the [agent-plugin surfaces](#agent-plugin-surfaces).
- If the user answers yes to "Use the superteam workflow?" (the Superpowers-based design + plan flow), additionally emit the `docs/superpowers/specs/.gitkeep` + `docs/superpowers/plans/.gitkeep` scaffolding, generated docs that explain `pnpm skills:install`, and the `skills:install` package script that installs both `patinaproject/skills` and `obra/superpowers` through `npx skills`.
- Run `pnpm install` to generate `pnpm-lock.yaml` and wire Husky.
- Leave all emitted files staged but uncommitted so the user owns the first commit.

### Realignment mode

Preconditions:

- Target is a git repository with existing content (one or more baseline files present).

Behavior:

- Walk [`audit-checklist.md`](./audit-checklist.md) against the target repo.
- Classify each baseline item as `missing`, `stale`, or `divergent`.
- For each gap, produce a concrete recommendation on how to realign with the current baseline.
- Detect whether the repo is an AI agent plugin (by presence of any agent-plugin manifest). When detected, additionally recommend any currently-supported AI platform surface that is missing.
- For each recommendation, show a diff preview and ask the user to accept, skip, or defer. **Never overwrite existing files without explicit confirmation.** There are no flags or escape hatches; realignment is always interactive.
- Group recommendations into ordered batches that can be applied independently. Each batch below must cover its listed files; no file from the "Source of truth for repo baseline" list in `AGENTS.md` may be skipped. `patinaproject/bootstrap` is a normal realignment target – the skill must not self-exclude when run against it.
  1. Plugin manifests: `.claude-plugin/`, `.codex-plugin/`, `release-please-config.json`, `.release-please-manifest.json`.
  2. Commit / PR conventions: `commitlint.config.js`, `.husky/*`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/*`.
  3. PNPM tooling: `package.json`, `.markdownlint.jsonc`, `scripts/check-plugin-versions.mjs`, `scripts/sync-plugin-versions.mjs`.
  4. Agent + repo docs: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `RELEASING.md`.
  5. AI platform surfaces: `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`.
  6. Workflows: `.github/workflows/*` (including `release.yml` with job-level `permissions:`).
  7. Superpowers scaffolding (only when `<use-superteam>` is yes): `docs/superpowers/specs/`, `docs/superpowers/plans/`.

## Prompts

The skill collects the following inputs. Author name, author email, and the security contact are derived from `git config user.name` and `git config user.email`; halt with a blocker if those are unset. Author handle is resolved with `gh api user --jq .login`; when unavailable, prompt `Author GitHub handle (for author URL)?` with no default.

| Prompt | Default | Notes |
|---|---|---|
| `<owner>` | from `git remote get-url origin` | GitHub org or user |
| `<repo>` | from `git remote get-url origin` | repository name |
| `<repo-description>` | – | one-line description |
| `<visibility>` | public | public \| private |
| `<is-agent-plugin>` | no | yes emits plugin/config surfaces for every supported AI coding tool |
| `<use-superteam>` | no | yes emits `docs/superpowers/` skeleton plus the portable Superteam skills install path |
| `<primary-skill-name>` | – | required when `<is-agent-plugin>` is yes; scaffolds `skills/<name>/SKILL.md` starter |
| `<codeowner>` | `@<owner>` | written into `.github/CODEOWNERS` |
| `<security-contact>` | from `git config user.email` | public repos only; written into `SECURITY.md` |
| `<author-name>` | from `git config user.name` | written into every `author` block |
| `<author-email>` | from `git config user.email` | written into every `author` block |
| `<author-handle>` | from `gh api user --jq .login` | prompted if unavailable; written into `author.url` |
| Continue.dev | no | opt-in secondary editor surface during agent-plugin mode |

## Core baseline

Emitted for every target repo:

```text
.claude/settings.json
.editorconfig
.github/CODEOWNERS
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/actionlint.yaml
.github/pull_request_template.md
.github/workflows/actions.yml
.github/workflows/markdown.yml
.github/workflows/pull-request.yml
.gitattributes
.gitignore
.husky/commit-msg
.husky/pre-commit
.markdownlint.jsonc
.markdownlintignore
.nvmrc
AGENTS.md
CHANGELOG.md
CLAUDE.md
CONTRIBUTING.md
README.md                   (core variant; replaced by agent-plugin variant when <is-agent-plugin>=yes)
RELEASING.md
SECURITY.md                 (public repos only)
commitlint.config.js
docs/file-structure.md
package.json
scripts/check-plugin-versions.mjs
scripts/sync-plugin-versions.mjs
```

## Agent plugin surfaces

Emitted only when `<is-agent-plugin>` is yes:

```text
.claude-plugin/plugin.json          (Claude Code)
.codex-plugin/plugin.json           (Codex)
.github/copilot-instructions.md     (GitHub Copilot)
.github/workflows/release.yml       (release-please)
.cursor/rules/{{repo}}.mdc          (Cursor)
.windsurfrules                      (Windsurf)
README.md                           (replaces core README with installation instructions)
release-please-config.json
.release-please-manifest.json
skills/{{primary-skill-name}}/SKILL.md
skills/.gitkeep
```

The agent-plugin `README.md.tmpl` is richer than the core one: it includes install steps for Claude Code, Codex CLI, and Codex App, plus usage examples. The core `README.md.tmpl` is emitted only for non-plugin repos.

Because the agent-plugin README documents a primary skill invocation and links to that skill contract, agent-plugin mode must collect `<primary-skill-name>` before rendering the README and primary skill starter.

Aider, Zed, Cline, and Opencode read `AGENTS.md` natively and are covered by the core baseline – no dedicated surface needed. Codex CLI also reads `AGENTS.md` natively but additionally consumes `.codex-plugin/plugin.json` in agent-plugin mode. Continue.dev is available as an opt-in secondary editor (`.continue/config.json`).

### Patina Project organization supplement

When the target repo's owner is `patinaproject`, the skill replaces the agent-plugin `.github/workflows/release.yml` with the supplement at `skills/scaffold-repository/templates/patinaproject-supplement/.github/workflows/release.yml`. The supplement currently emits only the `release-please` job; non-Patina repos get the clean base workflow.

Historical note: an earlier revision of the supplement also added a `notify-patinaproject-skills` job that dispatched `plugin-release-bump.yml` on `patinaproject/skills` after each release. That cross-repo bump path is obsolete — `patinaproject/skills` now vendors plugins directly via subtree merge and bumps its marketplace surface through release-please, so the dispatch was removed and Patina-org plugin repos no longer need cross-repo automation.

Detection is done at scaffold time from `git remote get-url origin` (or the configured `<owner>` prompt). When generating the base workflow for non-Patina-Project repos, do not add `if: github.repository_owner == 'patinaproject'` gates; emit the clean workflow without any Patina-Project-specific plumbing.

## Plugin enablement and skill installation

The emitted `.claude/settings.json` enables the canonical Patina Project plugins at the project level:

```jsonc
{
  "enabledPlugins": {
    "superteam@patinaproject-skills": true,
    "superpowers@claude-plugins-official": true
  }
}
```

This declarative host enablement remains available for Claude Code hosts that
understand project `enabledPlugins`. It is not the portable setup path by
itself. Scaffolded repos also emit `pnpm skills:install`, which runs
`npm_config_ignore_scripts=true npx skills@1.5.6 add patinaproject/skills -y`
and `npm_config_ignore_scripts=true npx skills@1.5.6 add obra/superpowers -y`
so contributors can install the required Patina Project and Superpowers skills
across runtimes.

## Conventions encoded

- **Commits**: Conventional Commits with no scope, required `#<issue>` tag, 72-char max. Enforced by commitlint + husky `commit-msg`.
- **PR titles**: same format, so squash commits reuse them verbatim.
- **PR body**: required closing keywords for normal PRs, additional
  linked-issue relationships (`Related to`, `Blocks`, `Partially satisfies`), a
  `Test coverage` AC/evidence table, optional `Testing steps` for
  operator-owned pass/fail verification, and optional `Risks` for warnings,
  gaps, caveats, or blockers.
- **Issue titles**: plain-language, no commit-style prefix.
- **Markdown**: `markdownlint-cli2` with `.markdownlint.jsonc` + `.markdownlintignore`. `lint-staged` runs it from `pre-commit`. The lint script uses a glob that excludes `node_modules/`.
- **PNPM**: `"packageManager": "pnpm@10.33.2"` pin, `engines.node >=24`, `prepare: "husky"`, `lint:md` script, and `skills:install` script for the portable Superteam skills install path.
- **Line endings**: `.gitattributes` with `* text=auto eol=lf`.
- **PR title hygiene**: `.github/workflows/pull-request.yml` validates that every PR title is ASCII-only, follows conventional commits (no scopes), starts with a `#<issue>` ref, keeps breaking-change markers consistent (`!` in title ⇔ `BREAKING CHANGE:` footer), and that the body contains a GitHub closing keyword.
- **Markdown CI**: `.github/workflows/markdown.yml` runs `DavidAnson/markdownlint-cli2-action` on every PR as a backstop to the husky `pre-commit` hook (which can be bypassed with `--no-verify`).
- **Workflow linting**: `.github/workflows/actions.yml` runs `actionlint` on PRs that touch `.github/workflows/**` or `.github/actionlint.yaml`. Catches malformed refs, invalid expressions, permission mistakes, and (alongside our SHA-pin convention) supply-chain drift.
- **GitHub Actions pinning**: every `uses:` in emitted workflows references a full 40-char commit SHA with a `# <action>@<version>` comment above it, rather than a mutable tag. Documented in `AGENTS.md`.
- **Labels**: `AGENTS.md` directs contributors to use `gh label list` and the repository's label descriptions as the source of truth when labeling issues and PRs.
- **Author identity**: `package.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json` use the same human author record: name and email from `git config`, plus `https://github.com/<author-handle>` from `gh api user --jq .login` or the required author-handle prompt. Repository-level URLs (`homepage`, `repository`, and Codex interface URLs) continue to use `<owner>/<repo>`.
- **Releases (agent-plugin mode)**: [`release-please`](https://github.com/googleapis/release-please) reads conventional commits since the last tag, opens a standing release PR that bumps `package.json` + both plugin manifests + `CHANGELOG.md`, and publishes a GitHub Release on merge. Semver level is derived from commit types; there is no manual patch/minor/major choice.
- **Distribution via `patinaproject/skills`**: Patina-Project plugins are vendored directly into `patinaproject/skills` via `git subtree` and ship through that repo's release-please flow. There is no cross-repo dispatch from individual plugin repos to the marketplace; the marketplace is updated as part of the consolidation/release flow in `patinaproject/skills` itself. The emitted Patina supplement therefore no longer carries the old `notify-patinaproject-skills` dispatch job — only the standard `release-please` job.
- **Version canonicalization**: `package.json` is the single source of truth for the plugin version. `scripts/sync-plugin-versions.mjs` rewrites `.claude-plugin/plugin.json` and `.codex-plugin/plugin.json` to match; `scripts/check-plugin-versions.mjs` enforces the lockstep via husky `pre-commit`.

## GitHub repository settings

Every bootstrap-managed repo should carry these merge settings:

| Setting | Value | Reason |
|---|---|---|
| `allow_squash_merge` | true | Release flow assumes squash; lint-pr enforces a PR title ready to become the squash commit. |
| `allow_merge_commit` | false | Merge commits break linear history and release-please commit parsing. |
| `allow_rebase_merge` | false | Rebase-merge drops the PR-title context that release-please reads. |
| `squash_merge_commit_title` | `PR_TITLE` | Carries the lint-pr-validated title straight through to `main`. |
| `squash_merge_commit_message` | `COMMIT_MESSAGES` | Preserves commit-level context (useful for review and git blame) in the squash body. |
| `delete_branch_on_merge` | true | Keeps the branch list tidy after each squash. |
| `allow_update_branch` | true | Surfaces an "Update branch" button on stale PRs so reviewers can sync without leaving the UI. |
| Release immutability | enabled | Prevents published release assets and tags from being modified after the fact – critical for marketplace consumers pinning to a tag. UI-only: not exposed via the standard REST `repos` endpoint. |

### Checking current settings

The skill picks the check path based on what the user has installed and whether the repo is public. Never apply changes without explicit user confirmation.

**Path 1 – `gh` CLI (preferred, covers public + private uniformly):**

```bash
gh api "repos/<owner>/<repo>" --jq '{allow_squash_merge, allow_merge_commit, allow_rebase_merge, squash_merge_commit_title, squash_merge_commit_message, delete_branch_on_merge, allow_update_branch}'
```

**Path 2 – `curl` + public REST API (no auth, public repos only; requires `jq` for the field projection below – fall back to inspecting raw JSON if `jq` is absent):**

```bash
curl -s "https://api.github.com/repos/<owner>/<repo>" \
  | jq '{allow_squash_merge, allow_merge_commit, allow_rebase_merge, squash_merge_commit_title, squash_merge_commit_message, delete_branch_on_merge, allow_update_branch}'
```

Rate limit is 60 req/hr per IP unauthenticated – fine for a one-shot realignment check. If the response is a 404 on what should be a visible repo, the repo is private and this path cannot be used.

**Path 3 – no CLI available, or private repo without auth:** skip the check and proceed straight to the UI walkthrough below; list expected values next to the checkboxes the user should see.

Skill picks the first path that will succeed: `gh` if installed → `curl` if the repo is public → UI-only if neither.

### Applying: UI walkthrough

Writes always require auth. Rather than scripting tokens, the skill directs the user through the GitHub UI. Deep-links and precise click-paths:

1. Open **[Pull Requests settings](https://github.com/<owner>/<repo>/settings#pull-requests-heading)** (`https://github.com/<owner>/<repo>/settings#pull-requests-heading`). On that page, adjust:
   - **Allow merge commits** → **unchecked** (currently `allow_merge_commit` should read `false`).
   - **Allow squash merging** → **checked**. Default commit message → **"Pull request title and commit details"** (maps to `squash_merge_commit_title=PR_TITLE`, `squash_merge_commit_message=COMMIT_MESSAGES`).
   - **Allow rebase merging** → **unchecked**.
   - **Always suggest updating pull request branches** → **checked** (`allow_update_branch=true`).
   - **Automatically delete head branches** → **checked** (`delete_branch_on_merge=true`).
2. Scroll to **Releases** (or open **[General → Releases](https://github.com/<owner>/<repo>/settings)** and scroll). Toggle **Enable release immutability** → **on**. This prevents published release assets and tags from being modified after the fact; it is verified by eye only – the setting is not exposed by the standard `repos` REST endpoint.
3. Click **Save** under each changed control that has one; the checkboxes save inline.

Faster for `gh`-equipped users – the equivalent single PATCH:

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

### Realignment-mode prompt format

When the check shows drift, present a numbered list to the user with current → target and a deep-link, one setting per row:

```text
Repository settings drift detected. Open:
  https://github.com/<owner>/<repo>/settings#pull-requests-heading

  1. Allow merge commits: currently ON, should be OFF.
  2. Allow rebase merging: currently ON, should be OFF.
  3. Default squash commit message: currently "Default to pull request title",
     should be "Pull request title and commit details".
  4. Automatically delete head branches: currently OFF, should be ON.
  (Auto-merge is intentionally left unopinionated – neither recommended nor
   flagged.)

Proceed to apply via `gh api` (if available), or confirm after applying via UI?
```

In realignment mode, report which check path was used (`gh`, `curl`, or `skipped`) and the full list of diverging fields. Never modify settings without explicit user confirmation. When package or plugin author URLs point to the repository owner instead of the resolved author handle, report the author block as divergent and offer the normal interactive rewrite.

### Reserved labels

The `autorelease: pending` and `autorelease: tagged` labels are owned by Release Please. In realignment mode, verify that `autorelease: pending` exists with color `ededed` (the release-please default) and a non-empty description explaining the reservation; if either is missing or divergent, recommend a `gh label edit` fix. Never instruct agents to apply or remove these labels manually.

## Verification self-test

After a scaffold or realignment run on this repo, all of the following must succeed:

```bash
pnpm install
pnpm exec commitlint --help
pnpm lint:md
echo "feat: bad" | pnpm exec commitlint   # exits non-zero
echo "feat: #1 ok" | pnpm exec commitlint # exits zero
```

Run `pnpm exec markdownlint-cli2 --fix "**/*.md" "#node_modules"` to auto-fix common markdown violations before committing.

## Reference implementation

This repository – [`patinaproject/bootstrap`](https://github.com/patinaproject/bootstrap) – is the canonical reference for every file this skill emits. The `templates/` directory under `skills/scaffold-repository/` mirrors these files with placeholders.

## Related documents

- [`audit-checklist.md`](./audit-checklist.md) – canonical realignment checklist.
- [`templates/`](./templates/) – template files emitted into target repos.
- [`../../AGENTS.md`](../../AGENTS.md) – repo workflow contract.
- [`../../docs/file-structure.md`](../../docs/file-structure.md) – layout reference.
