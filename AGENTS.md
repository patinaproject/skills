# Repository Guidelines

## Project Structure & Module Organization

This repository is the marketplace surface for Patina Project plugins and related install documentation.

- `plugins/work/skills/scaffold-repository/`: scaffold-repository skill
- `plugins/work/skills/using-github/`: using-github skill
- `plugins/work/skills/update-branch/`: local branch update skill
- `plugins/work/skills/to-spec/`: upstream to-spec mirror
- `plugins/work/skills/to-tickets/`: upstream to-tickets mirror
- `plugins/code/skills/working-on-issues/`: shared issue preflight (resolve live tracker, align branch and worktree, mark started)
- `plugins/code/skills/move-branch-here/`: Code worktree branch handover skill
- `plugins/code/skills/move-session-here/`: cross-agent session transcript handover skill
- `plugins/work/skills/install-skills/`: project-local skills CLI installation skill
- `plugins/work/skills/design-by-contract/`: consequential system contract design overlay
- `plugins/code/skills/principle-offensive-programming/`: defensive-code classification principle
- `plugins/work/skills/grill-system-design/`: focused system design grilling skill
- `plugins/work/skills/review-system-design/`: contract dependency review skill
- `plugins/work/skills/grill-to-spec/`: user-invoked grilling that hands ADR and glossary changes to `to-spec` as proposals
- `plugins/work/skills/writing-for-pstack/`: operator prompt authoring for `patina-mode`
- `plugins/work/skills/email-inbox-triage/`: provider-agnostic email inbox triage into four tagged buckets
- `plugins/work/skills/cloud-storage-organization/`: storage-agnostic loop that files loose files by rules learned from the user's corrections
- `plugins/work/skills/draft-user-follow-ups/`: post-release support loop that drafts proven replies to owed customers
- `plugins/work/skills/linear-inbox-cleanup/`: marks Linear inbox notifications read when they need no action
- `plugins/code/skills/gather-evidence/`: current-target evidence for human feedback
- `plugins/work/skills/pr-review-assistant/`: user-invoked pair review of someone else's pull request
- `plugins/code/skills/running-mobile-simulators/`: shared-host Android emulator and iOS simulator lifecycle skill
- `plugins/code/skills/pr/`: local PR body contract adapted from Matt Pocock
- `plugins/code/skills/patina-mode/`: Patina Project's default engineering mode, forked from pstack
- `plugins/work/skills/triage/`: upstream issue and PR triage workflow
- `plugins/work/skills/retro/`: upstream coding-session retrospective workflow
- `plugins/work/skills/show-me/`: upstream show-me mirror from humanlayer (visual explanation)
- `plugins/work/skills/design-control-loop/`: upstream design-control-loop mirror from humanlayer (agentic control loop design)
- `plugins/work/skills/ask-matt/`: upstream mirror (mattpocock)
- `plugins/work/skills/codebase-design/`: upstream mirror (mattpocock)
- `plugins/work/skills/domain-modeling/`: upstream mirror (mattpocock)
- `plugins/work/skills/grill-me/`: upstream mirror (mattpocock)
- `plugins/work/skills/grilling/`: upstream mirror (mattpocock)
- `plugins/work/skills/handoff/`: upstream mirror (mattpocock)
- `plugins/work/skills/improve-codebase-architecture/`: upstream mirror (mattpocock)
- `plugins/work/skills/setup-work-skills/`: upstream mattpocock `setup-matt-pocock-skills` mirror, renamed and forked for Patina label setup
- `plugins/work/skills/tutor/`: upstream mirror (mattpocock)
- `plugins/work/skills/to-questionnaire/`: upstream mirror (mattpocock)
- `plugins/work/skills/wait-what/`: upstream mirror (mattpocock)
- `plugins/work/skills/diagnosing-bugs/`: upstream mirror (mattpocock)
- `plugins/work/skills/implement/`: upstream mirror (mattpocock)
- `plugins/work/skills/implement-spec/`: upstream mirror (mattpocock)
- `plugins/work/skills/prototype/`: upstream mirror (mattpocock)
- `plugins/work/skills/research/`: upstream mirror (mattpocock)
- `plugins/work/skills/wayfinder/`: upstream mirror (mattpocock)
- `plugins/work/skills/wizard/`: upstream mirror (mattpocock)
- `plugins/work/skills/writing-for-agents/`: upstream mirror (mattpocock)
- `plugins/work/.claude-plugin/plugin.json`: Claude manifest for the Work plugin
- `plugins/work/.codex-plugin/plugin.json`: Codex manifest for the Work plugin
- `plugins/code/agents/patina-agent.md`: Patina mode routing agent
- `plugins/code/hooks/`: Code session-start integration
- `plugins/code/.claude-plugin/plugin.json`: Claude manifest for the Code plugin
- `plugins/code/.codex-plugin/plugin.json`: Codex manifest for the Code plugin
- `.agents/skills/<name>/`: committed overlay. Repo-owned skills are symlinks
  into their owning plugin; vendored third-party skills are real
  directories restored by `pnpm skills:install`. All entries are tracked.
- `.claude/skills/<name>/`: committed Claude Code overlay. Repo-owned skills
  symlink into their owning plugin; vendored third-party skills are
  relative symlinks into `../../.agents/skills/<name>`. All entries are tracked.
- `.claude-plugin/marketplace.json`: repo-local Claude marketplace source of truth for the `code` and `work` plugins
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

Treat any vendored instruction that names the retired
`resolving-merge-conflicts` skill as a reference to `fix-merge-conflicts`.

### Issue tracker

Tracker operations are defined in the sole adapter. The real file is
`docs/agents/issue-tracker.md`; `docs/issue-tracker.md` is a compatibility
symlink to it, so either path reaches the same adapter.
Follow it directly for claiming, labels, lifecycle, relationships, and closure;
the Work plugin owns the `to-spec` skill. Use it for issue filing and
editing. `docs/issue-publishing.md` governs issue body framing, and the adapter
owns readiness and priority.

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

Issue labels (Type, Theme, and Triage groups, including each repository's
Type set) and the Sentence case rule for label names live only in the tracker
adapter. See `docs/issue-tracker.md` → **Labels**.

### Domain docs

This is a single-context repository; domain docs are optional and created lazily when useful. See `docs/agents/domain.md`.

### Architecture decision records

Name and write ADRs by [`docs/adr/README.md`](docs/adr/README.md), the
single source of truth for ADR naming in this repository. It supersedes the
sequential `0001`-increment guidance still embedded in the vendored shared
skills (`domain-modeling`, `setup-work-skills`): name every ADR after its
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
request. Take the capture rules and the `GLOSSARY-FORMAT.md` and `ADR-FORMAT.md`
formats from the vendored `domain-modeling` skill; this repository owns no
documentation-capture skill. This
uses `CONTEXT.md` as the local glossary filename and supersedes the inline glossary-update capture instruction in
the vendored `domain-modeling` payload; see
[docs/adr/ADR-337-off-branch-doc-capture.md](docs/adr/ADR-337-off-branch-doc-capture.md).
In a Linear-tracked repository, the proposed ADR body goes in a Document on the
issue instead, as the tracker adapter's **Issue artifacts** section describes
([ADR-654](docs/adr/ADR-654-linear-issue-documents.md)).

## Build, Test, and Development Commands

- `pnpm install` (alias `pnpm env:setup`): install dev tooling and initialize
  Husky. It does not restore skills — vendored skills are committed.
- `pnpm skills:install`: re-vendor locked project-local skills from
  `skills-lock.json` using the upstream skills CLI
  (`pnpm dlx skills@latest experimental_install --yes`), then commit the
  refreshed `.agents/skills/**` and `.claude/skills/**` overlays. This is a
  manual maintenance command, not a `pnpm install` hook. Each lock entry tracks
  its source's default branch (latest), so re-running picks up upstream updates.
- `pnpm sync-upstream-skills`: sync every pinned upstream in
  `upstream-skills.json`, or pass a source name to sync one. It stages the
  result without committing and leaves overlapping edits as real git
  conflicts. `upstream-skills-forks.json` records deliberate local forks.
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

When creating or editing any skill under `plugins/*/skills/`, first use the third-party
`writing-for-agents` skill (the successor to `writing-great-skills`) as a
structure and progressive-disclosure review. It helps check trigger
descriptions, concise `SKILL.md` shape, leading-word terminology, and when to
split reference material out of the main skill file.

### Referring to shared repository docs

A skill under `plugins/<plugin>/skills/<name>/` sits four levels below this
repository's root, but three levels below a consumer repo's root once vendored into `.agents/skills/`
or `.claude/skills/`. A relative link to a repo-root doc therefore resolves in
exactly one of those layouts and is broken in the other — `../../AGENTS.md`
becomes `.claude/AGENTS.md`, which does not exist.

Name shared repository docs by their repo-root-relative path in prose
(`` `docs/issue-tracker.md` ``, "`AGENTS.md` at the repository root") instead of
linking them. The file lives in the consumer's repository, not alongside the
skill, so a path is the honest reference and a link is a layout assumption.

Relative links between sibling skills are fine and should stay links: skills
remain siblings in both layouts, so `../../design-by-contract/references/...` from
`plugins/work/skills/using-github/workflows/` resolves either way. Links to files bundled inside
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
- Run `bash scripts/tests/move-session-here.test.sh` after changing
  `plugins/code/skills/move-session-here/scripts/session-handoff.mjs`.
- Run `bash scripts/tests/update-branch.test.sh` after changing
  `plugins/work/skills/update-branch/**`.
- Run `node scripts/tests/triage-check-issue-state.test.mjs` after changing
  `plugins/work/skills/triage/scripts/check-issue-state.mjs`.
- Run `bash scripts/tests/dogfood.test.sh` to confirm in-repo skills pass the flat-layout check
- Run `bash scripts/tests/esm-tooling.test.sh` after changing repo tooling configs or the package module type
- Run `bash scripts/tests/markdown-lint-config.test.sh` after changing
  `.markdownlint-cli2.jsonc`, `.markdownlint.jsonc`, `.lintstagedrc.js`, or the
  `lint:md` script; it asserts the markdown exclusion mechanism behaviorally
- Run `bash scripts/tests/marketplace.test.sh` to confirm the `.claude-plugin/` catalog is valid
- Run `bash scripts/tests/pull-request-workflow.test.sh` after changing
  `.github/workflows/pull-request.yml` or `.github/pr-readiness.json`
- Run `bash scripts/tests/diff-hygiene.test.sh` after changing `scripts/check-diff-hygiene.sh`
- Run `bash scripts/tests/workflow-cleanup.test.sh` after changing workflow cleanup behavior; it asserts only filesystem state and non-`.md` config targets
- Run `bash scripts/tests/scaffold-baseline-manifest.test.sh` after changing
  `plugins/work/skills/scaffold-repository/core-baseline.txt` or its `verify-baseline.sh`
- Run `bash scripts/tests/scaffold-cleanup.test.sh` after changing scaffold baseline cleanup behavior; it asserts only filesystem state and non-`.md` config/code targets
- Run `bash scripts/tests/setup-code-skills-machinery.test.sh` after changing
  `plugins/code/skills/setup-code-skills/scripts/install-machinery.sh` or
  its bundled `assets/`; it asserts installer idempotency, the no-clobber
  contract, and that the bundled payloads match their canonical plugin sources
- Run `node scripts/tests/sheet-encodings.test.mjs` after changing a model-sheet
  decoder (`read-sheet.sh`, the `session-start` hooks, or `pi/sheet.ts`); it
  asserts that every decoder reads each sheet encoding the same way
- Run `node scripts/tests/sheet-decoder.test.mjs` after changing
  `plugins/code/pi/sheet.ts`, `setup-pstack/scripts/read-sheet.sh`, or the
  session-start hooks; it feeds UTF-16LE, BOM, and CRLF sheets through every
  decoder and compares one literal role map
- Run `bash scripts/tests/sync-upstream-skills.test.sh` after changing
  `scripts/sync-upstream-skills.mjs`; it exercises the manifest, fork registry,
  dry-run, idempotence, three-way merge, and argument-refusal contracts.

## Pull request labels

Use `gh label list` to see the repository's pull-request label set. Each label's
`description` documents when to apply it. Issue labels are live tracker data and
must be resolved through `docs/issue-tracker.md`.

Verify every label has a non-empty description:

```bash
gh label list --json name,description --jq '.[] | select(.description == "")'
```

## Writing pull requests

Pull request bodies follow `plugins/code/skills/pr/SKILL.md`. Use its
section order and omit empty optional sections. Put one closing line in
`## Merge Danger` for each completed issue, with both GitHub and corresponding
Linear references and a closing keyword for each.

`.github/pull_request_template.md` only reminds authors about the closing
references. It does not define the body structure. Use
`gh pr create --body-file <path-to-rendered-body>` with a body that already
follows the `pr` skill.

For issues, use the tracker-agnostic issue skills. They consult
`docs/issue-tracker.md`.

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

This repo owns skills in the Code and Work plugins:

| Skill | Path |
| --- | --- |
| scaffold-repository | `plugins/work/skills/scaffold-repository/` |
| using-github | `plugins/work/skills/using-github/` |
| update-branch | `plugins/work/skills/update-branch/` |
| install-skills | `plugins/work/skills/install-skills/` |
| design-by-contract | `plugins/work/skills/design-by-contract/` |
| grill-system-design | `plugins/work/skills/grill-system-design/` |
| review-system-design | `plugins/work/skills/review-system-design/` |
| writing-for-pstack | `plugins/work/skills/writing-for-pstack/` |
| email-inbox-triage | `plugins/work/skills/email-inbox-triage/` |
| cloud-storage-organization | `plugins/work/skills/cloud-storage-organization/` |
| draft-user-follow-ups | `plugins/work/skills/draft-user-follow-ups/` |
| linear-inbox-cleanup | `plugins/work/skills/linear-inbox-cleanup/` |
| grill-to-spec | `plugins/work/skills/grill-to-spec/` |
| working-on-issues | `plugins/code/skills/working-on-issues/` |
| move-branch-here | `plugins/code/skills/move-branch-here/` |
| move-session-here | `plugins/code/skills/move-session-here/` |
| principle-offensive-programming | `plugins/code/skills/principle-offensive-programming/` |
| pr | `plugins/code/skills/pr/` |
| gather-evidence | `plugins/code/skills/gather-evidence/` |
| pr-review-assistant | `plugins/work/skills/pr-review-assistant/` |
| running-mobile-simulators | `plugins/code/skills/running-mobile-simulators/` |
| retro | `plugins/work/skills/retro/` |
| to-spec | `plugins/work/skills/to-spec/` |
| to-tickets | `plugins/work/skills/to-tickets/` |
| triage | `plugins/work/skills/triage/` |

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
bump PRs from `bot/bump-*` branches are the only no-issue PR exceptions to the issue-tag rule.

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
bump PRs from `bot/bump-*` branches are the only no-issue PR exceptions.
