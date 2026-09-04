# Repository Guidelines

## Project Structure & Module Organization

This repository is the marketplace surface for Patina Project plugins and related install documentation.

- `skills/scaffold-repository/`: scaffold-repository skill
- `skills/using-github/`: using-github skill
- `plugins/engineering/skills/working-on-issues/`: shared issue preflight (resolve live tracker, align branch and worktree, mark started)
- `plugins/engineering/skills/move-branch-here/`: Engineering worktree branch handover skill
- `skills/install-skills/`: project-local skills CLI installation skill
- `skills/grill-to-spec/`: grill-and-hand-off skill that sends doc changes to
  `/to-spec` as proposals instead of the worktree
- `skills/design-by-contract/`: consequential system contract design overlay
- `plugins/engineering/skills/principle-offensive-programming/`: defensive-code classification principle
- `skills/grill-system-design/`: focused system design grilling skill
- `skills/review-system-design/`: contract dependency review skill
- `plugins/engineering/skills/gather-evidence/`: current-target evidence for human feedback
- `plugins/engineering/skills/running-mobile-simulators/`: shared-host Android emulator and iOS simulator lifecycle skill
- `plugins/engineering/skills/patina-mode/`: Patina Project's default engineering mode, forked from pstack
- `plugins/engineering/agents/patina-agent.md`: Patina mode routing agent
- `plugins/engineering/hooks/`: Engineering session-start integration
- `plugins/engineering/models.json`: Engineering model-role defaults
- `plugins/engineering/.claude-plugin/plugin.json`: Claude Engineering plugin manifest
- `plugins/engineering/.codex-plugin/plugin.json`: Codex Engineering plugin manifest
- `.agents/skills/<name>/`: committed overlay. Repo-owned skills are symlinks
  into their owning plugin or `skills/`; vendored third-party skills are real
  directories restored by `pnpm skills:install`. All entries are tracked.
- `.claude/skills/<name>/`: committed Claude Code overlay. Repo-owned skills
  symlink into their owning plugin or `skills/`; vendored third-party skills are
  relative symlinks into `../../.agents/skills/<name>`. All entries are tracked.
- `.claude-plugin/marketplace.json`: repo-local Claude marketplace source of truth for `patinaproject-skills` and `engineering`
- `.claude-plugin/plugin.json`: Claude plugin manifest listing skill paths
- `.codex/environments/environment.toml`: Codex workspace setup for this repository
- `docs/`: contributor docs such as `docs/file-structure.md` and
  `docs/release-flow.md`
- If `CLAUDE.md` exists, it should point contributors back to `AGENTS.md`
- root config: `package.json`, `commitizen.config.json`, `commitlint.config.js`, and `.husky/`

GitHub Issues are the canonical tracker for this public repository. Linear
receives issues through one-way GitHub-to-Linear intake for team visibility
and is not authoritative. Synced property updates are bidirectional, so do not
edit or close public-repository issues in Linear. Do not add committed design
or plan artifacts for routine issue work; put durable context on the GitHub
issue or in normal docs when it is broadly useful beyond one issue.

## Agent skills

### Issue tracker

Tracker operations are defined in the sole adapter. The real file is
`docs/agents/issue-tracker.md`; `docs/issue-tracker.md` is a compatibility
symlink to it, so either path reaches the same adapter.
Follow it directly for claiming, labels, lifecycle, relationships, and closure;
this repository owns no issue-filing or issue-editing skill. Filing a spec is
the operator's to run with the third-party `/to-spec`, so ask them to run it
rather than filing on their behalf. `docs/issue-publishing.md` still governs
issue body framing, and the adapter owns readiness and priority.

### Working an issue

When you begin or resume issue-linked work, run the
`working-on-issues` skill first, before branching, editing, or opening a
pull request. It resolves the issue, lands you on the tracker-provided branch,
and marks it started after its gates pass. The skill is
idempotent, so run it at the start of every issue-linked session even if you are
unsure it has already run — re-running while already aligned is a no-op. A
session or worktree branch the harness starts you on, such as `claude/<...>`, is
not issue-linked: let `working-on-issues` align it rather than committing on the
session branch. If another worktree owns the issue branch, follow the skill's
handoff gate instead of moving it implicitly.

### Triage labels

Triage roles map through the tracker adapter and the repository's configured
labels. See `docs/issue-tracker.md`.

### Domain docs

This is a single-context repository; domain docs are optional and created lazily when useful. See `docs/agents/domain.md`.

### Architecture decision records

Name and write ADRs by [`docs/adr/README.md`](docs/adr/README.md), the
single source of truth for ADR naming in this repository. It supersedes the
sequential `0001`-increment guidance still embedded in the vendored shared
skills (`domain-modeling`, `setup-matt-pocock-skills`): name every ADR after its
originating GitHub issue (`ADR-N-<slug>.md`), never scan-and-increment, and
do not edit the vendored payloads under `.agents/skills/**`.

### Durable context capture

`CONTEXT.md` and `docs/adr/**` are in-force truth and change only on the branch
that publishes them: the branch implementing the decision, or a docs-only branch
when the repository already reflects it. A session anywhere else — grilling,
planning, a worktree on an unrelated branch, an implementing branch that does
not exist yet — captures the exact proposed doc text (the complete ADR body and
each glossary entry) on the GitHub issue that will implement the decision
instead of editing the tree, creating that issue if none exists. The branch
implementing such an issue applies the captured text verbatim in its pull
request. Take the capture rules and the `CONTEXT-FORMAT.md` and `ADR-FORMAT.md`
formats from the vendored `domain-modeling` skill; this repository owns no
documentation-capture skill. This
supersedes the inline "update `CONTEXT.md` right there" capture instruction in
the vendored `domain-modeling` payload; see
[docs/adr/ADR-337-off-branch-doc-capture.md](docs/adr/ADR-337-off-branch-doc-capture.md).

## Build, Test, and Development Commands

- `pnpm install` (alias `pnpm env:setup`): install dev tooling and initialize
  Husky. It does not restore skills — vendored skills are committed.
- `pnpm skills:install`: re-vendor locked project-local skills from
  `skills-lock.json` using the upstream skills CLI
  (`pnpm dlx skills@latest experimental_install --yes`), then commit the
  refreshed `.agents/skills/**` and `.claude/skills/**` overlays. This is a
  manual maintenance command, not a `pnpm install` hook. Each lock entry tracks
  its source's default branch (latest), so re-running picks up upstream updates.
- `pnpm sync-pstack`: re-sync `plugins/engineering/**` from the current tip of
  `ericlitman/open-pstack`'s `main`, renaming only `poteto-mode` → `patina-mode`
  and `poteto-agent` → `patina-agent`, and leaving Patina's local edits as real
  merge conflicts to resolve. See
  [ADR-429](docs/adr/ADR-429-sync-pstack-carrier-branch.md) for the mechanism.
- `pnpm clean`: remove generated dependency and transient install files
  (`node_modules`, `.skills-install.lock*`); never prunes committed skill overlays
- `bash scripts/worktree-setup.sh`: shared worktree bootstrap (fast-forward onto
  `origin/main`, then `pnpm env:setup`), wired into the Claude `SessionStart`
  hook and the Codex `[setup]` block
- `pnpm commit`: create a guided conventional commit with issue tagging
- `pnpm exec commitlint --edit <path>`: validate commit messages manually
- `pnpm lint:md`: lint all tracked Markdown files with `markdownlint-cli2`
- `pnpm test`: run the full local verification suite
- `find skills -mindepth 2 -maxdepth 2 -name SKILL.md | sort`: inspect the skill entry points

## Coding Style & Naming Conventions

- Use lowercase names for skill folders
- Keep skill names and folder names aligned
- Use Markdown for docs and JSON for manifests
- Issue titles use plain language, not conventional commit formatting. Example:
  `Update README with Claude Code install instructions`

## Working on skills

When creating or editing any skill under `skills/`, first use the third-party
`writing-for-agents` skill (the successor to `writing-great-skills`) as a
structure and progressive-disclosure review. It helps check trigger
descriptions, concise `SKILL.md` shape, leading-word terminology, and when to
split reference material out of the main skill file.

### Referring to shared repository docs

A skill under `skills/<name>/` sits two levels below this repository's root, but
three levels below a consumer repo's root once vendored into `.agents/skills/`
or `.claude/skills/`. A relative link to a repo-root doc therefore resolves in
exactly one of those layouts and is broken in the other — `../../AGENTS.md`
becomes `.claude/AGENTS.md`, which does not exist.

Name shared repository docs by their repo-root-relative path in prose
(`` `docs/issue-tracker.md` ``, "`AGENTS.md` at the repository root") instead of
linking them. The file lives in the consumer's repository, not alongside the
skill, so a path is the honest reference and a link is a layout assumption.

Relative links between sibling skills are fine and should stay links: skills
remain siblings in both layouts, so `../../design-by-contract/references/...` from
`skills/using-github/workflows/` resolves either way. Links to files bundled inside
the same skill (`./audit-checklist.md`) are likewise unaffected.

If `writing-for-agents` is not installed in the local agent environment, install
it with:

```bash
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@writing-for-agents -y
```

## Testing Guidelines

- **Tests must not assert on the prose content of documentation files.** Tests
  validate code behavior and machine-consumed contracts only: shell/JS behavior,
  valid JSON/YAML config, `.md` *frontmatter* schema (for example `name:` matches
  the folder), symlink resolution, and required-file existence. A documentation
  file's prose body must be freely editable without breaking a test. Markdown
  *linting* (`pnpm lint:md`) is unaffected — linting is not testing. See
  [docs/adr/ADR-224-no-tests-on-documentation-content.md](docs/adr/ADR-224-no-tests-on-documentation-content.md).
- Run `pnpm test` to run the full suite, or use the targeted commands below while iterating.
- `pnpm test` includes network-backed skills CLI canaries and the
  committed-skill lifecycle check.
- Validate paths with `find` or `rg`
- Run `bash scripts/tests/skill-install-lifecycle.test.sh` after changing
  `scripts/clean.sh`, package lifecycle scripts, or the skill install/clean
  package scripts.
- Run `bash scripts/tests/worktree-setup.test.sh` after changing
  `scripts/worktree-setup.sh`.
- Run `bash scripts/tests/move-branch-here.test.sh` after changing
  `plugins/engineering/skills/move-branch-here/scripts/worktree-context.sh`.
- Run `bash scripts/tests/dogfood.test.sh` to confirm in-repo skills pass the flat-layout check
- Run `bash scripts/tests/esm-tooling.test.sh` after changing repo tooling configs or the package module type
- Run `bash scripts/tests/markdown-lint-config.test.sh` after changing
  `.markdownlint-cli2.jsonc`, `.markdownlint.jsonc`, `.lintstagedrc.js`, or the
  `lint:md` script; it asserts the markdown exclusion mechanism behaviorally
- Run `bash scripts/tests/marketplace.test.sh` to confirm the `.claude-plugin/` catalog is valid
- Run `bash scripts/tests/pull-request-workflow.test.sh` after changing `.github/workflows/pull-request.yml`
- Run `bash scripts/tests/workflow-cleanup.test.sh` after changing workflow cleanup behavior; it asserts only filesystem state and non-`.md` config targets
- Run `bash scripts/tests/scaffold-baseline-manifest.test.sh` after changing
  `skills/scaffold-repository/core-baseline.txt` or its `verify-baseline.sh`
- Run `bash scripts/tests/scaffold-cleanup.test.sh` after changing scaffold baseline cleanup behavior; it asserts only filesystem state and non-`.md` config/code targets
- Run `bash scripts/tests/setup-engineering-machinery.test.sh` after changing
  `plugins/engineering/skills/setup-engineering/scripts/install-machinery.sh` or
  its bundled `assets/`; it asserts installer idempotency, the no-clobber
  contract, and that the bundled payloads match their canonical plugin sources
- Run `bash scripts/tests/sync-pstack.test.sh` after changing
  `scripts/pstack-transform.sh` or `scripts/sync-pstack.sh`; it asserts the
  rebrand transform is deterministic and that a diverged sync produces real
  merge-conflict markers

## Pull request labels

Use `gh label list` to see the repository's pull-request label set. Each label's
`description` documents when to apply it. Issue labels are live tracker data and
must be resolved through `docs/issue-tracker.md`.

Verify every label has a non-empty description:

```bash
gh label list --json name,description --jq '.[] | select(.description == "")'
```

## Working with `.github/` templates

This repo ships a canonical pull request template. Agents must use it — do
not invent parallel PR structure.

- Pull requests: `.github/pull_request_template.md`. Read it before running `gh pr create`.
  The PR body must use the template's section headings in the order the template defines,
  even when the body is passed inline via `--body`.
- Issues: use the tracker-agnostic issue skills, which consult
  `docs/issue-tracker.md`.

Recommended `gh` patterns:

- PRs: `gh pr create --body-file <path-to-rendered-body>` is the safest path. The rendered
  body must already follow the template. If you pass `--body` inline, copy every template
  section name and order verbatim before filling them in.

## GitHub Actions pinning

Pin every action reference to a full 40-character commit SHA, not a tag. Tags are mutable;
SHAs are not. Above each `uses:` line, leave a comment naming the action and version the SHA
corresponds to, so updates remain reviewable.

```yaml
# actions/checkout@v4.3.1
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
```

`actionlint` runs in CI on `.github/workflows/**` changes and enforces workflow hygiene as
part of its other checks.

Also enable **Settings → Actions → General → Require actions to be pinned to a full-length
commit SHA** (at the repo or org level). GitHub then refuses to run any workflow that `uses:`
an action by tag or branch, giving a hard gate on top of the CI check.

## Skill Releases

This repo owns skills in the root plugin and the Engineering plugin:

| Skill | Path |
| --- | --- |
| scaffold-repository | `skills/scaffold-repository/` |
| using-github | `skills/using-github/` |
| install-skills | `skills/install-skills/` |
| grill-to-spec | `skills/grill-to-spec/` |
| design-by-contract | `skills/design-by-contract/` |
| grill-system-design | `skills/grill-system-design/` |
| review-system-design | `skills/review-system-design/` |
| working-on-issues | `plugins/engineering/skills/working-on-issues/` |
| move-branch-here | `plugins/engineering/skills/move-branch-here/` |
| principle-offensive-programming | `plugins/engineering/skills/principle-offensive-programming/` |
| gather-evidence | `plugins/engineering/skills/gather-evidence/` |
| running-mobile-simulators | `plugins/engineering/skills/running-mobile-simulators/` |

`find-skills` is a third-party skill from `vercel-labs/skills` and is not
a marketplace entry in this repo.

Releases are driven by `release-please` via `.github/workflows/release-please.yml`, which
maintains a single standing Release PR for the repo as a whole. Tag form: `v<X.Y.Z>` — no
component prefix. The marketplace only publishes tagged (`v<X.Y.Z>`) releases. See
[docs/release-flow.md](./docs/release-flow.md).

The in-repo plugins share one root release and tag; they are not separate
release-please packages. Third-party skills such as
`find-skills` are installed separately from their source repo's default branch
or a specific `#<git-ref>`.

Adding or removing a repo-owned skill is a normal catalog change, not a breaking
change: version it with the fitting conventional type (usually `feat:`), never a
breaking `type!` / major bump. Skills are agent instructions, not a runtime API —
a removed skill simply leaves the catalog (recorded in the marketplace tests'
`retired_marketplace_skills` guard) and breaks nothing at runtime for consumers,
who re-vendor from the lockfile. Reserve `type!` for changes that actually break
a machine-consumed contract (for example the plugin-manifest schema or the
install lockfile shape).

Merging a Release PR tags the commit and publishes a GitHub Release. The workflow also
auto-merges Release PRs after required checks pass.

Bot-generated release-please PRs from `release-please--*` branches and bot-generated release
bump PRs from `bot/bump-*` branches are the only no-issue exceptions to the issue-tag rule.

## Commit & Pull Request Guidelines

Commits must use conventional commit types, no scopes, and a current GitHub
issue reference:

`type: #123 short description`

Examples:

- `chore: #1 bootstrap marketplace repo`
- `feat: #12 add GitHub workflow skill`

For squash-and-merge workflows, PR titles must match the commitlint commit format:

`type: #123 short description`

Bot-generated release-please PRs from `release-please--*` branches and bot-generated release
bump PRs from `bot/bump-*` branches are the only no-issue exceptions.

Use the PR template as written: one `Closes #N`, `Fixes #N`, or `Resolves #N`
line and a
`What changed` summary written for a reader who has not seen the work. There is
no `Context:` line or `- <change> - <why>` contract — write plain prose.
GitHub Checks are the source of truth for routine automated verification.
Add `Testing steps` only ad hoc, when a produced artifact needs human
inspection (rendered docs, generated files, a template, release notes); make
each unchecked item describe the expected outcome, and omit the section when no
human review judgment is needed. Put only pre-merge operational chores in
`Do before merging`.
