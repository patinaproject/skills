---
name: scaffold-repository
description: Use when scaffolding a new repository (public or private) to the Patina Project baseline, when realigning an existing repository with that baseline, or when auditing or adding commit conventions, PR templates, husky + commitlint, PNPM tooling, release-please, agent docs (AGENTS.md, CLAUDE.md), or AI agent plugin manifests for Claude Code and Codex. Triggers on phrases like "scaffold this repo", "scaffold a Patina plugin", "realign with the baseline", "audit our repo conventions", "set up commitlint and husky", or "add Claude/Codex plugin surfaces".
---

# scaffold-repository

`scaffold-repository` scaffolds a repository – new or existing – to the Patina Project baseline: a dual-plugin repository root, a self-contained `skills/` directory, conventional-commits-with-issue-ref enforcement, a PR template, `AGENTS.md` + `CLAUDE.md`, a human-readable `README.md`, a `docs/file-structure.md` contributor reference, and PNPM + Husky + markdownlint tooling.

There is no committed template bundle. The live
[`patinaproject/skills`](https://github.com/patinaproject/skills) repository
root is the canonical baseline reference. When a scaffold or realignment needs
file content, compare against the current maintained root files and manifests
instead of reading copied baseline files from this skill directory.

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
- No prior `.claude-plugin/` or `.codex-plugin/` manifests.

Behavior:

- Emit the full [core baseline](#core-baseline) tree from the live repository baseline, filtering out marketplace-internal verification and dogfood tooling.
- If the user answers yes to "Is this an AI agent plugin?", additionally emit the [agent-plugin surfaces](#agent-plugin-surfaces).
- Run `pnpm install` to generate `pnpm-lock.yaml` and wire Husky.
- Leave all emitted files staged but uncommitted so the user owns the first commit.

### Realignment mode

Preconditions:

- Target is a git repository with existing content (one or more baseline files present).

Behavior:

- Walk [`audit-checklist.md`](./audit-checklist.md) against the target repo.
- Classify each baseline item as `missing`, `stale`, or `divergent`.
- For each gap, produce a concrete recommendation on how to realign with the current baseline.
- Detect whether the repo is an AI agent plugin (by presence of a Claude or Codex plugin manifest). When detected, additionally recommend any currently-supported plugin manifest or marketplace catalog that is missing from the live baseline.
- For each recommendation, show a diff preview and ask the user to accept, skip, or defer. **Never overwrite existing files without explicit confirmation.** There are no flags or escape hatches; realignment is always interactive.
- Group recommendations into ordered batches that can be applied independently. Each batch below must cover its listed files. `patinaproject/skills` is a normal realignment target – the skill must not self-exclude when run against it.
  1. Plugin manifests: `.claude-plugin/`, `.codex-plugin/`, `.agents/plugins/`, `release-please-config.json`, `.release-please-manifest.json`.
  2. Commit / PR conventions: `commitlint.config.js`, `.husky/*`, `.github/pull_request_template.md`; stale GitHub issue templates should be offered for deletion.
  3. PNPM tooling and skills installation: `package.json`, `.markdownlint.jsonc`, `pnpm-lock.yaml`, `skills-lock.json`, `scripts/install-skills.sh`, `scripts/clean.sh`, `scripts/worktree-setup.sh`, `.gitignore`.
  4. Agent + repo docs: `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`, `README.md`, `docs/release-flow.md`.
  5. Marketplace catalogs: `.claude-plugin/marketplace.json`, `.agents/plugins/marketplace.json`.
  6. Workflows: `.github/workflows/actions.yml`, `.github/workflows/markdown.yml`, `.github/workflows/pull-request.yml`, and agent-plugin release workflow when applicable.
- Include skills installation in every scaffold and realignment. Emit or
  realign `skills-lock.json`, `scripts/install-skills.sh`, `scripts/clean.sh`,
  `scripts/worktree-setup.sh`, `.gitignore`, and the `package.json`
  `env:setup` / `skills:refresh` / `clean` scripts. Vendored project-local
  skills are committed to the repo (real directories under `.agents/skills/`
  with portable relative symlinks under `.claude/skills/`), so they load
  immediately in a fresh worktree without a restore step. After accepted
  changes to `skills-lock.json`, run `pnpm skills:refresh` when the lockfile
  records one or more skills to re-vendor the committed overlays, then verify
  `npx --yes skills@latest list --json` includes the project-local skills and
  commit the refreshed overlays.

## Prompts

The skill collects the following inputs. Author name, author email, and the security contact are derived from `git config user.name` and `git config user.email`; halt with a blocker if those are unset. Author handle is resolved with `gh api user --jq .login`; when unavailable, prompt `Author GitHub handle (for author URL)?` with no default.

| Prompt | Default | Notes |
|---|---|---|
| `<owner>` | from `git remote get-url origin` | GitHub org or user |
| `<repo>` | from `git remote get-url origin` | repository name |
| `<repo-description>` | – | one-line description |
| `<visibility>` | public | public \| private |
| `<is-agent-plugin>` | no | yes emits plugin/config surfaces for every supported AI coding tool |
| `<codeowner>` | `@<owner>` | written into `.github/CODEOWNERS` |
| `<security-contact>` | from `git config user.email` | public repos only; written into `SECURITY.md` |
| `<author-name>` | from `git config user.name` | written into every `author` block |
| `<author-email>` | from `git config user.email` | written into every `author` block |
| `<author-handle>` | from `gh api user --jq .login` | prompted if unavailable; written into `author.url` |

## Core baseline

Emitted for every target repo. Use the live repository root as the content
reference, but filter out `patinaproject/skills` marketplace maintenance
verifiers. Consumer repos should not receive dogfood, marketplace,
finish-pr, scaffold-cleanup, or workflow-cleanup verifier scripts unless they
are themselves this marketplace repository.

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
README.md                   (core variant; replaced by agent-plugin variant when <is-agent-plugin>=yes)
SECURITY.md                 (public repos only)
commitizen.config.json
commitlint.config.js
docs/file-structure.md
docs/release-flow.md
docs/wiki-index.md
package.json
pnpm-lock.yaml
scripts/install-skills.sh
scripts/clean.sh
scripts/worktree-setup.sh
skills-lock.json
```

Marketplace-internal verification and dogfood files in the live reference repo,
including the repository test harness, verify scripts, generated agent overlays,
code-review workflow, verify workflow, and marketplace release workflow, are
reference implementation tooling. Do not emit them into a generic scaffolded
consumer repo unless that repo explicitly opts into the same marketplace
maintenance role. Consumer workflows must be adapted to the files they actually
receive.

## Agent plugin surfaces

Emitted only when `<is-agent-plugin>` is yes:

```text
.claude-plugin/marketplace.json     (Claude marketplace catalog)
.claude-plugin/plugin.json          (Claude Code plugin manifest)
.agents/plugins/marketplace.json    (Codex marketplace catalog)
.codex-plugin/plugin.json           (Codex plugin manifest)
.github/workflows/release-please.yml (release-please)
README.md                           (includes installation instructions)
release-please-config.json
.release-please-manifest.json
```

Agent-plugin mode does not generate starter skills or editor-specific side
surfaces. Aider, Zed, Cline, Codex CLI, and Opencode read `AGENTS.md` natively
and are covered by the core baseline. Additional editor surfaces should be added
only when they exist in the live baseline.

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
- **PR body**: required closing keywords for normal PRs, additional
  linked-issue relationships (`Related to`, `Blocks`, `Partially satisfies`),
  a concise `What changed` summary, optional `Testing steps` only for
  human-owned behavior or artifact checks, and optional `Do before merging` for
  work-specific pre-merge operator chores. GitHub Checks are the source of truth for routine automated verification; PR bodies should not repeat
  successful lint, test, type-check, hook, package, or similar command results.
- **Issue titles and bodies**: titles are plain-language, no commit-style
  prefix. Body structure is owned by the skill creating the issue; do not emit
  GitHub issue templates as a baseline convention.
- **Markdown**: `markdownlint-cli2` with `.markdownlint.jsonc` + `.markdownlintignore`. `lint-staged` runs it from `pre-commit`. The lint script uses a glob that excludes `node_modules/`.
- **PNPM**: `"type": "module"`, `"packageManager": "pnpm@10.33.2"` pin, `engines.node >=24`, `prepare: "husky"`, `env:setup: "pnpm install"`, `clean: "bash scripts/clean.sh"`, `skills:refresh: "bash scripts/install-skills.sh"`, and `lint:md` script. There is no `postinstall` skill-restore hook: vendored skills are committed, so `pnpm install` does not re-vendor them.
- **Commitizen config**: `commitizen.config.json` stays JSON because `cz-customizable` loads it through CommonJS `require()`; do not convert it to ESM JavaScript.
- **Committed vendored skills**: scaffolded repositories commit their vendored
  project-local skills to version control so they load immediately in a fresh
  clone or worktree, with no install step required. Real skill directories live
  under `.agents/skills/<name>/`; `.claude/skills/<name>` entries are portable
  relative symlinks (`../../.agents/skills/<name>`) to the matching payloads.
  Repo-owned skills stay isolated under `skills/<name>/`. `scripts/clean.sh`
  removes only generated dependency and transient install files
  (`node_modules`, `.skills-install.lock*`); it must never prune the committed
  overlay directories. `.gitignore` must not exclude `.agents/skills/**` or
  `.claude/skills/**`.
- **Skill refresh (`skills:refresh`)**: `scripts/install-skills.sh` is a manual
  re-vendoring tool, not a `pnpm install` hook. It is idempotent: an empty or
  absent lockfile is a no-op, while a populated lockfile restores every locked
  skill from the immutable GitHub `ref` recorded on each lock entry without
  writing project-local transient installer files, verifies the restored
  payload hash against `computedHash`, writes the payloads into `.agents/skills/`,
  and recreates the `.claude/skills/` relative symlinks. It treats
  `skills-lock.json` as restore-only input and must not call a lifecycle command
  that rewrites the lockfile. After running it, commit the refreshed overlays.
  Realignment must add missing `env:setup`, `skills:refresh`, and `clean`
  package scripts, remove any retired auto-restore `postinstall` hook and
  retired skill-restore package scripts, re-vendor with `pnpm skills:refresh`
  after accepted lockfile changes, and verify with
  `npx --yes skills@latest list --json`.
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
- **Author identity**: `package.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json` use the same human author record: name and email from `git config`, plus `https://github.com/<author-handle>` from `gh api user --jq .login` or the required author-handle prompt. Repository-level URLs (`homepage`, `repository`, and Codex interface URLs) continue to use `<owner>/<repo>`.
- **Releases (agent-plugin mode)**: [`release-please`](https://github.com/googleapis/release-please) reads conventional commits since the last tag, opens a standing release PR that bumps `package.json` + both plugin manifests + `CHANGELOG.md`, and publishes a GitHub Release on merge. Semver level is derived from commit types; there is no manual patch/minor/major choice.
- **Distribution via `patinaproject/skills`**: Patina-Project plugins are vendored directly into `patinaproject/skills` via `git subtree` and ship through that repo's release-please flow. There is no cross-repo dispatch from individual plugin repos to the marketplace; the marketplace is updated as part of the consolidation/release flow in `patinaproject/skills` itself. The emitted Patina supplement therefore no longer carries the old `notify-patinaproject-skills` dispatch job — only the standard `release-please` job.
- **Version canonicalization**: `.release-please-manifest.json`, `.claude-plugin/marketplace.json`, and `.codex-plugin/plugin.json` carry the marketplace version and are kept in lockstep by release-please.

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

This repository – [`patinaproject/skills`](https://github.com/patinaproject/skills) – is the canonical reference for every file this skill emits.

## Related documents

- [`audit-checklist.md`](./audit-checklist.md) – canonical realignment checklist.
- [`../../AGENTS.md`](../../AGENTS.md) – repo workflow contract.
- [`../../docs/file-structure.md`](../../docs/file-structure.md) – layout reference.
