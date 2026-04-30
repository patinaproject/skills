# Audit Checklist

Canonical checklist the `bootstrap` skill walks in realignment mode. Each row specifies a baseline item, how to detect it, how to classify it, and what to recommend on a gap.

Classification:

- `missing` – file does not exist.
- `stale` – file exists but its version predates the current baseline shape (e.g. scripts or dependencies out of date, AGENTS.md sections absent).
- `divergent` – file exists with a meaningfully different structure and needs reconciliation rather than overwrite.

For every gap, produce a concrete recommendation and show a diff preview. Never overwrite without explicit user confirmation. No flags or escape hatches; realignment is always interactive.

## Area 1 – Core repo tooling

| File | Required | Check |
|---|---|---|
| `.gitignore` | yes | present; contains `node_modules/` |
| `.gitattributes` | yes | present; contains `* text=auto eol=lf` |
| `.editorconfig` | yes | present; `root = true`; `end_of_line = lf` |
| `.nvmrc` | yes | present |
| `.markdownlint.jsonc` | yes | present; valid JSONC |
| `.markdownlintignore` | yes | present; excludes `node_modules/`, `pnpm-lock.yaml` |
| `commitlint.config.js` | yes | present; extends `@commitlint/config-conventional`; has `ticket-required` rule |
| `.husky/commit-msg` | yes | present; runs `pnpm exec commitlint --edit "$1"` |
| `.husky/pre-commit` | yes | present; runs `pnpm exec lint-staged` |
| `package.json` | yes | present; has `version`; `author.name`; `author.email`; `author.url`; `packageManager: pnpm@10.x`; `engines.node >= 24`; scripts include `lint:md`, `check:versions`, `sync:versions`; `lint-staged` block for `*.md` |
| `pnpm-lock.yaml` | yes | present |
| `scripts/check-plugin-versions.mjs` | yes | present; fails with non-zero exit on version drift |
| `scripts/sync-plugin-versions.mjs` | yes | present; rewrites plugin manifests from `package.json` |
| `CHANGELOG.md` | yes | present; compatible with release-please (no hand-edits to released sections) |
| `RELEASING.md` | yes | present; documents the release-please flow |

## Area 2 – GitHub metadata

| File | Required | Check |
|---|---|---|
| `.github/pull_request_template.md` | yes | present; includes `Closes #<issue>`, `### AC-<issue>-<n>`, `type: #123 short description` rule |
| `.github/ISSUE_TEMPLATE/bug_report.md` | yes | present with frontmatter |
| `.github/ISSUE_TEMPLATE/feature_request.md` | yes | present with frontmatter |
| `.github/CODEOWNERS` | yes | present; at least one non-comment rule |
| `.github/workflows/pull-request.yml` | yes | present; validates PR title format, breaking-change marker consistency, closing keyword |
| `.github/workflows/markdown.yml` | yes | present; runs `DavidAnson/markdownlint-cli2-action` on PRs |
| `.github/workflows/actions.yml` | yes | present; runs `actionlint` on PRs touching `.github/workflows/**` |
| `.github/actionlint.yaml` | yes | present; lists permitted self-hosted-runner labels |
| End-to-end release smoke | yes | After realignment, run `gh workflow run Release --repo <owner>/<repo>` on a repo seeded with at least one `feat:` or `fix:` commit since its last tag. Verify release-please opens/updates a release PR; on merge, a tag and GitHub Release appear, and – when `<owner> == patinaproject` – a `plugin-release-bump.yml` dispatch fires on `patinaproject/skills`. Report a gap if the target has no prior release **and** `gh api repos/<owner>/<repo>/actions/permissions/workflow --jq .default_workflow_permissions` returns `read`. |
| Default workflow permissions | yes | `gh api repos/<owner>/<repo>/actions/permissions/workflow --jq .default_workflow_permissions` must return `write`. When it returns `read`, emit a realignment-gap warning entry recommending **Settings → Actions → General → Workflow permissions → Read and write permissions**. This check runs regardless of whether the repo has ever cut a release, so the problem surfaces before the first 403. |
| Tag rulesets do not require signatures | yes | `gh api repos/<owner>/<repo>/rulesets --jq '.[] \| select(.target=="tag")'` must not return any ruleset whose `rules[].type == "required_signatures"` applies to the release-tag pattern. When it does, emit a realignment-gap warning entry: signed tags break `release-please-action`, which cannot sign; scope the signature rule to branches or to non-release tag refs. |

### Reserved GitHub labels

| Label | Required | Check |
|---|---|---|
| `autorelease: pending` | yes | present; color `ededed`; description non-empty and documents that the label is reserved for Release Please automation; confirm via `gh label list --repo <owner>/<repo> --json name,color,description --jq '.[] \| select(.name=="autorelease: pending")'` |

## Area 3 – Agent + repo docs

| File | Required | Check |
|---|---|---|
| `AGENTS.md` | yes | present; covers project structure, commands, conventions, commits, PRs; "Commit type selection" section leads with the product-surface glob list and one-sentence path-first rule BEFORE the type table, contains a rationalization table, a red-flags STOP block, and at least one WRONG → RIGHT pair. Verify with the AC-54-7 parity grep one-liner (see `docs/superpowers/specs/2026-04-28-54-sharpen-commit-type-guidance-for-product-surface-changes-design.md`). |
| `CLAUDE.md` | yes | present; imports `@AGENTS.md`; Claude-only guidance below |
| `CONTRIBUTING.md` | yes | present; pointer to `AGENTS.md` |
| `SECURITY.md` | public only | public repo → present; private → absent |
| `README.md` | yes | present; includes repo name, description, and conventions summary |
| `docs/file-structure.md` | yes | present |

## Area 4 – Claude Code configuration

| File | Required | Check |
|---|---|---|
| `.claude/settings.json` | yes | present; parses as valid JSONC; `enabledPlugins` declared |

For agent plugins, `enabledPlugins` should include `superteam@patinaproject-skills` and `superpowers@claude-plugins-official` unless the user has explicitly opted out.

## Area 5 – AI agent plugin surfaces

Detection: this repo is an AI agent plugin if **any** of these exist: `.claude-plugin/`, `.codex-plugin/`, `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`, `skills/`.

When detected, the following surfaces should all be present. Missing platforms are recommended as additions so existing plugins stay aligned with the current supported set.

| File | Required (agent plugin) | Check |
|---|---|---|
| `.claude-plugin/plugin.json` | yes | valid JSON; has `name`, `version`, `description`, `author.name`, `author.email`, `author.url`, `skills`; `version` matches `package.json` |
| `.codex-plugin/plugin.json` | yes | valid JSON; has `name`, `version`, `description`, `author.name`, `author.email`, `author.url`, `skills`, `interface`; `version` matches `package.json` |
| `.github/copilot-instructions.md` | yes | present; references `AGENTS.md` |
| `.github/workflows/release.yml` | yes | present; runs `release-please` on push to default branch |
| `release-please-config.json` | yes | valid JSON; lists both plugin manifests under `extra-files` for version sync |
| `.release-please-manifest.json` | yes | valid JSON; `.` version matches `package.json.version` |
| `.cursor/rules/<repo>.mdc` | yes | present with frontmatter |
| `.windsurfrules` | yes | present |
| `skills/` | yes | directory exists with at least a `.gitkeep` or a skill subdirectory |

Author URLs in `package.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json` must point to the resolved `https://github.com/<author-handle>`, not the repository owner URL. Repository-level URLs such as `homepage`, `repository`, and Codex interface URLs stay on `https://github.com/<owner>/<repo>`.

## Area 6 – Superpowers opt-in

Detection: look for `docs/superpowers/`. When present, verify both subdirectories exist.

| File | Required (if opted in) | Check |
|---|---|---|
| `docs/superpowers/specs/` | yes | directory exists (may contain only `.gitkeep`) |
| `docs/superpowers/plans/` | yes | directory exists (may contain only `.gitkeep`) |

## Area 7 – GitHub repository merge settings

Check path priority (see `SKILL.md` → "GitHub repository settings" for full guidance):

1. `gh api "repos/<owner>/<repo>"` when `gh` is installed (covers public + private).
2. `curl -s "https://api.github.com/repos/<owner>/<repo>"` for public repos when `gh` is absent.
3. If neither applies (private repo, no `gh`), skip the check and proceed directly to the UI walkthrough.

Writes always go through the UI (or `gh api -X PATCH`). Deep-link: `https://github.com/<owner>/<repo>/settings#pull-requests-heading`. Report the check path used and every diverging field; never apply changes without explicit confirmation.

| Field | Expected |
|---|---|
| `allow_squash_merge` | true |
| `allow_merge_commit` | false |
| `allow_rebase_merge` | false |
| `squash_merge_commit_title` | `PR_TITLE` |
| `squash_merge_commit_message` | `COMMIT_MESSAGES` |
| `delete_branch_on_merge` | true |
| `allow_update_branch` | true |
| Release immutability (UI-only) | enabled |

## Area 8 – Commit / PR title hygiene

Sampled, not exhaustive:

- Inspect the most recent 20 commits on the default branch. If more than half violate `type: #<issue> short description`, recommend adding the `commit-msg` hook and documenting the rule in `AGENTS.md`.
- Inspect the most recent 10 open PR titles. If any violate the format, note this in the realignment report; do not rewrite titles automatically.

## Recommendation output format

For each gap, emit:

```text
[<area>] <file> – <classification>
  Recommendation: <one-line change>
  Diff preview:
    <unified diff against the template or current baseline>
  Action? (accept / skip / defer)
```

Group recommendations into ordered batches and offer them in this sequence (matching `SKILL.md` → Realignment mode; each batch must cover every file in the "Source of truth for repo baseline" list in `AGENTS.md`):

1. Plugin manifests (`.claude-plugin/`, `.codex-plugin/`, `release-please-config.json`, `.release-please-manifest.json`)
2. Commit / PR conventions (`commitlint.config.js`, `.husky/*`, `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/*`)
3. PNPM tooling (`package.json`, `.markdownlint.jsonc`, `scripts/check-plugin-versions.mjs`, `scripts/sync-plugin-versions.mjs`)
4. Agent + repo docs (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `RELEASING.md`)
5. AI platform surfaces (`.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`)
6. Workflows (`.github/workflows/*`, including `release.yml` with job-level `permissions:`)
7. Superpowers scaffolding (opt-in)
