# Audit Checklist

Canonical checklist the `scaffold-repository` skill walks in realignment mode.
Each row specifies a live baseline item, how to detect it, how to classify it,
and what to recommend on a gap.

Classification:

- `missing` – file does not exist.
- `stale` – file exists but its version predates the current baseline shape (e.g. scripts or dependencies out of date, AGENTS.md sections absent).
- `divergent` – file exists with a meaningfully different structure and needs reconciliation rather than overwrite.

For every gap, produce a concrete recommendation and show a diff preview. Never overwrite without explicit user confirmation. No flags or escape hatches; realignment is always interactive.

## Area 1 – Core repo tooling

| File | Required | Check |
|---|---|---|
| `.gitignore` | yes | present; contains `node_modules/` and `.skills-install.lock*`; must NOT ignore `.agents/skills/**` or `.claude/skills/**`, because vendored skills are committed |
| `.gitattributes` | yes | present; contains `* text=auto eol=lf` |
| `.editorconfig` | yes | present; `root = true`; `end_of_line = lf` |
| `.nvmrc` | yes | present |
| `.markdownlint.jsonc` | yes | present; valid JSONC |
| `.markdownlintignore` | yes | present; excludes `node_modules/`, `pnpm-lock.yaml` |
| `commitlint.config.js` | yes | present; extends `@commitlint/config-conventional`; has `ticket-required` rule |
| `commitizen.config.json` | yes | present; remains JSON because `cz-customizable` loads it through CommonJS `require()` |
| `.husky/commit-msg` | yes | present; runs `pnpm exec commitlint --edit "$1"` |
| `.husky/pre-commit` | yes | present; runs `pnpm exec lint-staged` |
| `package.json` | yes | present; has `author.name`; `author.email`; `author.url`; `type: module`; `packageManager: pnpm@10.x`; `engines.node >= 24`; scripts include `lint:md`, `env:setup: pnpm install`, `clean: bash scripts/clean.sh`, and `skills:install: pnpm dlx skills@latest experimental_install --yes`; must NOT carry a `postinstall` skill-restore hook, any retired skill-restore package scripts, or a custom `scripts/install-skills.sh`; repo-specific `test` scripts are recommended only when the target owns meaningful verifiers |
| `pnpm-lock.yaml` | yes | present |
| `skills-lock.json` | yes | present; valid JSON; records project-local skills with a GitHub `source` and `skillPath` (the upstream skills CLI tracks each source's default branch, so no immutable `ref` is pinned), or an empty `skills` object when no shared skills are locked yet |
| `scripts/clean.sh` | yes | present; executable; removes only generated dependency and transient install files (`node_modules/`, `.skills-install.lock*`); must never prune committed `.agents/skills/**` or `.claude/skills/**` overlay entries |
| `scripts/worktree-setup.sh` | yes | present; executable; idempotent; fast-forwards onto the target repo default branch then runs `pnpm env:setup`; wired into both the Claude `SessionStart` hook and the Codex `[setup]` block; does not hardcode `main` |
| `.codex/environments/environment.toml` | yes | present; `[setup]` runs `bash scripts/worktree-setup.sh` |
| `CHANGELOG.md` | yes | present; compatible with release-please (no hand-edits to released sections) |
| `docs/release-flow.md` | yes | present; documents the release-please flow |

## Area 2 – GitHub metadata

| File | Required | Check |
|---|---|---|
| `.github/pull_request_template.md` | yes | present; includes required closing-keyword guidance plus additional linked-issue guidance, `## What changed`, optional `## Testing steps`, no dedicated automated-verification section, no pre-checked testing-step guidance, GitHub Checks as the routine automated verification surface, and `type: #123 short description` rule |
| Old GitHub issue templates | no | absent; existing issue templates are stale baseline artifacts and should be offered for deletion with a reviewable diff |
| `.github/CODEOWNERS` | yes | present; at least one non-comment rule |
| `.github/workflows/pull-request.yml` | yes | present; validates PR title format, breaking-change marker consistency, closing keyword |
| `.github/workflows/markdown.yml` | yes | present; runs `DavidAnson/markdownlint-cli2-action` on PRs |
| `.github/workflows/actions.yml` | yes | present; runs `actionlint` on PRs touching `.github/workflows/**` |
| `.github/actionlint.yaml` | yes | present; lists permitted self-hosted-runner labels |
| End-to-end release smoke | yes | After realignment, run `gh workflow run Release --repo <owner>/<repo>` on a repo seeded with at least one `feat:` or `fix:` commit since its last tag. Verify release-please opens/updates a release PR; on merge, a tag and GitHub Release appear. Report a gap if the target has no prior release **and** `gh api repos/<owner>/<repo>/actions/permissions/workflow --jq .default_workflow_permissions` returns `read`. |
| Default workflow permissions | yes | `gh api repos/<owner>/<repo>/actions/permissions/workflow --jq .default_workflow_permissions` must return `write`. When it returns `read`, emit a realignment-gap warning entry recommending **Settings → Actions → General → Workflow permissions → Read and write permissions**. This check runs regardless of whether the repo has ever cut a release, so the problem surfaces before the first 403. |
| Tag rulesets do not require signatures | yes | `gh api repos/<owner>/<repo>/rulesets --jq '.[] \| select(.target=="tag")'` must not return any ruleset whose `rules[].type == "required_signatures"` applies to the release-tag pattern. When it does, emit a realignment-gap warning entry: signed tags break `release-please-action`, which cannot sign; scope the signature rule to branches or to non-release tag refs. |

Classify stale PR templates when they encourage command transcripts, routine automated evidence, or padded testing sections.

### Reserved GitHub labels

| Label | Required | Check |
|---|---|---|
| `autorelease: pending` | yes | present; color `ededed`; description non-empty and documents that the label is reserved for Release Please automation; confirm via `gh label list --repo <owner>/<repo> --json name,color,description --jq '.[] \| select(.name=="autorelease: pending")'` |

## Area 3 – Agent + repo docs

| File | Required | Check |
|---|---|---|
| `AGENTS.md` | yes | present; covers project structure, commands, conventions, commits, PRs; "Commit type selection" section leads with the product-surface glob list and one-sentence path-first rule BEFORE the type table, contains a rationalization table, a red-flags STOP block, and at least one WRONG → RIGHT pair. Verify with a parity grep across agent-facing surfaces. |
| `AGENTS.md` testing rule | yes | "Testing Guidelines" states that tests must not assert on the prose content of documentation files (code behavior and machine-consumed contracts only; markdown linting is exempt). Realignment must add this rule if absent. |
| `CLAUDE.md` | yes | present; imports `@AGENTS.md`; Claude-only guidance below |
| `CONTRIBUTING.md` | yes | present; pointer to `AGENTS.md` |
| `SECURITY.md` | public only | public repo → present; private → absent |
| `README.md` | yes | present; includes repo name, description, and conventions summary |
| `docs/file-structure.md` | yes | present |

## Area 4 – Claude Code configuration

| File | Required | Check |
|---|---|---|
| `.claude/settings.json` | yes | present; parses as valid JSONC; `enabledPlugins` declared as an object; registers a `SessionStart` (`startup`) hook running `bash scripts/worktree-setup.sh` |

For new scaffolded repos, `enabledPlugins` is empty by default. Recommend
project-specific plugin entries only when the repository explicitly opts in. The
`SessionStart` worktree-setup hook is part of the baseline and pairs with the
Codex `[setup]` block so both agents prepare new worktrees identically.

## Area 5 – Shared skill lifecycle

This check applies to every scaffolded or realigned repository. Vendored
project-local skills are committed to version control so they load immediately
in a fresh worktree without an install step.

| File / command | Required | Check |
|---|---|---|
| `skills-lock.json` | yes | present; records every vendored skill that should be re-vendored into the project overlays with a GitHub `source` and `skillPath` (the upstream skills CLI tracks each source's default branch, so no immutable `ref` is pinned), or an empty `skills` object if none are installed yet |
| Committed overlays | yes | `.agents/skills/<name>/` real directories and matching `.claude/skills/<name>` relative symlinks are tracked in git for every locked skill |
| `scripts/clean.sh` | yes | present; removes only generated dependency and transient install files; never prunes committed overlay entries |
| `package.json` | yes | includes `env:setup: pnpm install`, `skills:install: pnpm dlx skills@latest experimental_install --yes`, and `clean: bash scripts/clean.sh`; no `postinstall` skill-restore hook and no custom `scripts/install-skills.sh` |
| `.gitignore` | yes | does not ignore `.agents/skills/**` or `.claude/skills/**`; ignores `node_modules/` and `.skills-install.lock*` |
| `pnpm skills:install` | yes | run after accepting `skills-lock.json` drift when one or more skills are locked; re-vendors the committed overlays via the upstream skills CLI (`skills experimental_install`), which must then be committed |
| `npx --yes skills@latest list --json` | yes | verify vendored skills are present alongside any in-repo overlay symlinks |

## Area 6 – Deprecated workflow cleanup

Detection: look for retired workflow scaffolding in active repo guidance.

| File | Required | Check |
|---|---|---|
| `docs/superpowers/` | no | absent from new scaffolded repos; if present, classify as `stale` unless the repository explicitly keeps historical artifacts |
| `package.json` | no | does not install retired workflow dependencies by default |
| `AGENTS.md` | yes | directs durable issue context to GitHub issues instead of committed design/plan artifacts |
| Install docs | no | do not require Superpowers for new installs |

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
    <unified diff against the live baseline>
  Action? (accept / skip / defer)
```

Group recommendations into ordered batches and offer them in this sequence (matching `SKILL.md` → Realignment mode; each batch must cover every listed file):

1. Commit / PR conventions (`commitlint.config.js`, `.husky/*`, `.github/pull_request_template.md`, stale GitHub issue templates)
2. PNPM tooling and skills installation (`package.json`, `.markdownlint.jsonc`, `pnpm-lock.yaml`, `skills-lock.json`, `scripts/clean.sh`, `scripts/worktree-setup.sh`, `.claude/settings.json`, `.codex/environments/environment.toml`, `.gitignore`)
3. Agent + repo docs (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `docs/release-flow.md`)
4. Workflows (`actions.yml`, `markdown.yml`, `pull-request.yml`)
5. Deprecated workflow cleanup
