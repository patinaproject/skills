---
name: scaffold-repository
description: Scaffold a new repository to the Patina Project baseline, realign an existing repository with that baseline, or audit and add baseline conventions (commit + PR rules, husky + commitlint, PNPM tooling, agent docs). Use when the user says "scaffold this repo", "realign with the baseline", "audit our repo conventions", or "set up commitlint and husky".
---

# scaffold-repository

There is no committed template bundle. The live
[`patinaproject/skills`](https://github.com/patinaproject/skills) repository
root is the canonical **baseline** reference. When a scaffold or realignment
needs file content, compare against the current maintained root files and
manifests instead of reading copied baseline files from this skill directory.

## Obtaining the baseline

When running outside `patinaproject/skills`, fetch baseline files from GitHub
before writing them into the target repo. Prefer the GitHub CLI when available:

```sh
gh api repos/patinaproject/skills/contents/<path> --jq .content | base64 -d
```

For multi-file comparisons, create a shallow temporary clone instead:

```sh
git clone --depth 1 https://github.com/patinaproject/skills.git /tmp/patinaproject-skills-baseline
```

If neither network access nor a local baseline checkout is available, stop and
ask the user for a baseline source. Do not invent file contents from memory.

## Modes

The skill detects which mode to run based on target-repo state.

### New-repo mode

Preconditions:

- Target is a git repository (may be empty or just initialized).
- No prior Patina baseline files (for example `AGENTS.md`, `commitlint.config.js`, or a `package.json` with the baseline scripts).

Behavior:

- Emit the full [core baseline](#core-baseline) tree from the live repository baseline, filtering out marketplace-internal verification and dogfood tooling.
- Run `pnpm install` to generate `pnpm-lock.yaml` and wire Husky.
- Leave all emitted files staged but uncommitted so the user owns the first commit.

### Realignment mode

Preconditions:

- Target is a git repository with existing content (one or more baseline files present).

Behavior:

- Walk [`audit-checklist.md`](./audit-checklist.md) against the target repo.
- Classify each baseline item as `missing`, `stale`, or `divergent`.
- For each gap, produce a concrete recommendation on how to realign with the current baseline.
- For each recommendation, show a **diff preview** and ask the user to accept, skip, or defer. **Never overwrite existing files without explicit confirmation.** There are no flags or escape hatches; realignment is always interactive.
- Group recommendations into ordered batches that can be applied independently. Each batch below must cover its listed files. `patinaproject/skills` is a normal realignment target – the skill must not self-exclude when run against it.
  1. Commit / PR conventions: `commitlint.config.js`, `.husky/*`, `.github/pull_request_template.md`; stale GitHub issue templates should be offered for deletion.
  2. PNPM tooling and skills installation: `package.json`, `.markdownlint.jsonc`, `pnpm-lock.yaml`, `skills-lock.json`, `scripts/clean.sh`, `scripts/worktree-setup.sh`, `.claude/settings.json`, `.codex/environments/environment.toml`, `.gitignore`.
  3. Agent + repo docs: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `docs/release-flow.md`.
  4. Workflows: `.github/workflows/actions.yml`, `.github/workflows/markdown.yml`, `.github/workflows/pull-request.yml`.

Batch 2 always covers skills installation (see [Conventions encoded](#conventions-encoded) → committed vendored skills and skill refresh for the mechanics). After accepted changes to `skills-lock.json` that leave one or more skills locked, run `pnpm skills:install`, verify `npx --yes skills@latest list --json` includes the project-local skills, and commit the refreshed overlays.

## Prompts

The skill collects the following inputs. Author name, author email, and the security contact are derived from `git config user.name` and `git config user.email`; halt with a blocker if those are unset. Author handle is resolved with `gh api user --jq .login`; when unavailable, prompt `Author GitHub handle (for author URL)?` with no default.

| Prompt | Default | Notes |
|---|---|---|
| `<owner>` | from `git remote get-url origin` | GitHub org or user |
| `<repo>` | from `git remote get-url origin` | repository name |
| `<repo-description>` | – | one-line description |
| `<visibility>` | public | public \| private |
| `<codeowner>` | `@<owner>` | written into `.github/CODEOWNERS` |
| `<security-contact>` | from `git config user.email` | public repos only; written into `SECURITY.md` |
| `<author-name>` | from `git config user.name` | written into every `author` block |
| `<author-email>` | from `git config user.email` | written into every `author` block |
| `<author-handle>` | from `gh api user --jq .login` | prompted if unavailable; written into `author.url` |

## Core baseline

Emitted for every target repo. Use the live repository root as the content
reference, but filter out `patinaproject/skills` marketplace maintenance
verifiers: consumer repos should not receive dogfood, marketplace,
scaffold-cleanup, or workflow-cleanup verifier scripts unless they are
themselves this marketplace repository.

```text
.claude/settings.json
.editorconfig
.github/CODEOWNERS
.github/actionlint.yaml
.github/pull_request_template.md
.github/workflows/actions.yml
.github/workflows/markdown.yml
.github/workflows/pull-request.yml
.gitattributes
.gitignore
.husky/commit-msg
.husky/pre-commit
.lintstagedrc.js
.markdownlint.jsonc
.markdownlintignore
.nvmrc
AGENTS.md
CHANGELOG.md
CLAUDE.md
CONTRIBUTING.md
LICENSE
README.md
SECURITY.md                 (public repos only)
commitizen.config.json
commitlint.config.js
docs/file-structure.md
docs/release-flow.md
docs/wiki-index.md
package.json
pnpm-lock.yaml
scripts/clean.sh
scripts/worktree-setup.sh
skills-lock.json
```

The live reference repo also carries marketplace-internal tooling — the test
harness, verify scripts, generated agent overlays, and the code-review, verify,
and marketplace release workflows. These are reference-implementation only:
omit them from a generic consumer repo unless it opts into the same marketplace
maintenance role, and adapt the emitted consumer workflows to the files the
repo actually receives.

## Plugin enablement

```jsonc
{
  "enabledPlugins": {}
}
```

The emitted `.claude/settings.json` enables no host plugins by default, but it
does register the shared worktree setup as a `SessionStart` (`startup`) hook
that runs `bash scripts/worktree-setup.sh`. Projects may opt into host plugins
later, but the scaffold does not auto-enable retired workflow dependencies.

## Conventions encoded

- **Commits**: Conventional Commits with no scope, required `#<issue>` tag, 72-char max. Enforced by commitlint + husky `commit-msg`.
- **PR titles**: same format, so squash commits reuse them verbatim.
- **PR body**: a slim baseline shared by docs and code repos alike — required
  closing keywords for normal PRs, additional linked-issue relationships
  (`Related to`, `Blocks`, `Partially satisfies`), and a free-prose
  `What changed` summary written for a reader who has not seen the work (no
  `Context:` line or `- <change> - <why>` contract). `Testing steps` is not a
  standing section; add it ad hoc only when a produced artifact needs human
  inspection, and use optional `Do before merging` for work-specific pre-merge
  operator chores. GitHub Checks are the source of truth for routine automated
  verification; PR bodies should not repeat successful lint, test, type-check,
  hook, package, or similar command results. See
  [ADR-257](../../docs/adr/ADR-257-slim-baseline-pr-template.md) for the
  single-baseline decision.
- **Issue titles and bodies**: titles are plain-language, no commit-style
  prefix. Body structure is owned by the skill creating the issue; do not emit
  GitHub issue templates as a baseline convention.
- **Markdown**: `markdownlint-cli2` with `.markdownlint.jsonc` + `.markdownlintignore`. `lint-staged` runs it from `pre-commit`. The lint script uses a glob that excludes `node_modules/`.
- **Testing rule**: `AGENTS.md` states that tests must not assert on the prose
  content of documentation files. Tests validate code behavior and
  machine-consumed contracts only (shell/JS behavior, JSON/YAML config, `.md`
  *frontmatter* schema, symlink resolution, required-file existence); a doc's
  prose body stays freely editable. Markdown linting is unaffected — linting is
  not testing. The scaffold propagates the written rule only; it does not emit a
  test harness to consumer repos.
- **PNPM**: `"type": "module"`, `"packageManager": "pnpm@10.33.2"` pin, `engines.node >=24`, `prepare: "husky"`, `env:setup: "pnpm install"`, `clean: "bash scripts/clean.sh"`, `skills:install: "pnpm dlx skills@latest experimental_install --yes"`, and `lint:md` script. There is no `postinstall` skill-restore hook: vendored skills are committed, so `pnpm install` does not re-vendor them.
- **Commitizen config**: `commitizen.config.json` stays JSON because `cz-customizable` loads it through CommonJS `require()`; do not convert it to ESM JavaScript.
- **Committed vendored skills**: scaffolded repositories commit their vendored
  project-local skills, so they load immediately in a fresh clone or worktree
  with no install step. Real skill directories live under `.agents/skills/<name>/`;
  `.claude/skills/<name>` entries are portable relative symlinks
  (`../../.agents/skills/<name>`) to the matching payloads. Repo-owned skills
  stay isolated under `skills/<name>/`. `scripts/clean.sh` removes only generated
  dependency and transient install files (`node_modules`, `.skills-install.lock*`)
  and must never prune the committed overlay directories; `.gitignore` must not
  exclude `.agents/skills/**` or `.claude/skills/**`.
- **Skill refresh (`skills:install`)**: re-vendoring uses the upstream skills
  CLI, not a custom script. `skills:install` runs
  `pnpm dlx skills@latest experimental_install --yes`, which reads
  `skills-lock.json` and restores each locked skill from its source's default
  branch into `.agents/skills/`, with `.claude/skills/` relative symlinks to the
  matching payloads. It is a manual maintenance command, not a `pnpm install`
  hook: an empty or absent lockfile is a no-op; a populated lockfile pulls the
  latest upstream content. Realignment must add missing `env:setup`,
  `skills:install`, and `clean` package scripts and remove any retired
  auto-restore `postinstall` hook, retired skill-restore package scripts, or
  custom `scripts/install-skills.sh`.
- **Shared worktree setup (`scripts/worktree-setup.sh`)**: scaffolded
  repositories ship a single idempotent setup script wired into both agent
  surfaces — the Claude Code `SessionStart` (`startup`) hook in
  `.claude/settings.json` and the Codex `[setup]` block in
  `.codex/environments/environment.toml` — so every new worktree is prepared the
  same way. The script fast-forwards the worktree onto the target repository's
  default branch and runs `pnpm env:setup`:

  ```bash
  if git fetch --prune origin <default-branch>; then
    if git merge-base --is-ancestor HEAD origin/<default-branch>; then
      git merge --ff-only origin/<default-branch> ||
        echo "worktree-setup: warning: fast-forward failed; skipping branch sync" >&2
    fi
  else
    echo "worktree-setup: warning: could not fetch origin/<default-branch>; skipping branch sync" >&2
  fi
  pnpm env:setup
  ```

  The branch sync is best-effort: because it runs as a `SessionStart` hook, a
  network or remote failure must warn rather than abort under `set -euo
  pipefail`, so the essential `pnpm env:setup` step still runs offline. Resolve
  `<default-branch>` at scaffold time from the target repository (for example
  `git symbolic-ref --short refs/remotes/origin/HEAD` or
  `gh repo view --json defaultBranchRef`); never hardcode `main`.
- **Line endings**: `.gitattributes` with `* text=auto eol=lf`.
- **PR title hygiene**: `.github/workflows/pull-request.yml` validates that every PR title is ASCII-only, follows conventional commits (no scopes), starts with a `#<issue>` ref, keeps breaking-change markers consistent (`!` in title ⇔ `BREAKING CHANGE:` footer), and that the body contains a GitHub closing keyword.
- **Markdown CI**: `.github/workflows/markdown.yml` runs `DavidAnson/markdownlint-cli2-action` on every PR as a backstop to the husky `pre-commit` hook (which can be bypassed with `--no-verify`).
- **Workflow linting**: `.github/workflows/actions.yml` runs `actionlint` on PRs that touch `.github/workflows/**` or `.github/actionlint.yaml`. Catches malformed refs, invalid expressions, permission mistakes, and (alongside our SHA-pin convention) supply-chain drift.
- **GitHub Actions pinning**: every `uses:` in emitted workflows references a full 40-char commit SHA with a `# <action>@<version>` comment above it, rather than a mutable tag. Documented in `AGENTS.md`.
- **Labels**: `AGENTS.md` directs contributors to use `gh label list` and the repository's label descriptions as the source of truth when labeling issues and PRs.
- **Author identity**: `package.json` carries a human author record: name and email from `git config`, plus `https://github.com/<author-handle>` from `gh api user --jq .login` or the required author-handle prompt. Repository-level URLs (`homepage`, `repository`) continue to use `<owner>/<repo>`.

## GitHub repository settings

Every scaffold-managed repo should carry these merge settings:

| Setting | Value | Reason |
|---|---|---|
| `allow_squash_merge` | true | Release flow assumes squash; lint-pr enforces a PR title ready to become the squash commit. |
| `allow_merge_commit` | false | Merge commits break linear history and release-please commit parsing. |
| `allow_rebase_merge` | false | Rebase-merge drops the PR-title context that release-please reads. |
| `squash_merge_commit_title` | `PR_TITLE` | Carries the lint-pr-validated title straight through to `main`. |
| `squash_merge_commit_message` | `COMMIT_MESSAGES` | Preserves commit-level context (useful for review and git blame) in the squash body. |
| `delete_branch_on_merge` | true | Keeps the branch list tidy after each squash. |
| `allow_update_branch` | true | Surfaces an "Update branch" button on stale PRs so reviewers can sync without leaving the UI. |
| Release immutability | enabled | Prevents published release assets and tags from being modified after the fact – critical for downstream consumers pinning to a tag. UI-only: not exposed via the standard REST `repos` endpoint. |

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

In realignment mode, report which check path was used (`gh`, `curl`, or `skipped`) and the full list of diverging fields. Never modify settings without explicit user confirmation. When the `package.json` author URL points to the repository owner instead of the resolved author handle, report the author block as divergent and offer the normal interactive rewrite.

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

## Related documents

- [`audit-checklist.md`](./audit-checklist.md) – canonical realignment checklist.
- [`../../AGENTS.md`](../../AGENTS.md) – repo workflow contract.
- [`../../docs/file-structure.md`](../../docs/file-structure.md) – layout reference.
