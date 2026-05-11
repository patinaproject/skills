# Design: Merge superteam, bootstrap, using-github skills into this repository for easier skill iteration [#58](https://github.com/patinaproject/skills/issues/58)

## Summary

Consolidate the `superteam`, `bootstrap`, and `using-github` skills into `patinaproject/skills` as a monorepo of vendored plugins under `plugins/`. Replace the cross-repo `repository_dispatch` bump flow with in-repo `release-please` releases, expose a first-party `npx skills` installer that resolves the marketplace from a published artifact, and migrate non-essential contributor and user docs to the repo's GitHub wiki. After this change, all three skills iterate side-by-side, can be exercised locally from a clone without publishing, and ship through a single release surface that still honors the existing `vX.Y.Z` `ref` pinning rule in both marketplace manifests.

## Goals

- Single repository for the three Patina Project skills with a single PR review surface for changes that touch multiple skills at once.
- Local-first iteration: a fresh clone is sufficient to exercise every skill against itself (the `superteam` orchestration skill must be able to drive a workflow in this repo using the in-repo copy of itself).
- Both marketplace manifests resolve in-repo skills via local paths for development and via the published tag for end users, with no `main`-branch refs leaking into release artifacts.
- `npx skills` is the documented primary install path for both Codex and Claude users, and it resolves to a tagged marketplace artifact, not a moving target.
- A `release-please`-driven release flow replaces `plugin-release-bump.yml` and the cross-repo dispatch in `docs/release-flow.md`, while preserving the existing invariant that every plugin entry in both manifests pins an explicit `vX.Y.Z` tag.
- The contributor and user surface in `docs/` shrinks to what must live in the repo (AGENTS.md, release-flow notes, superpowers design/plan artifacts); everything else moves to the repo wiki and is linked from `README.md` and the marketplace plugin descriptions.
- Workflow-contract surfaces in `superteam` (SKILL.md, agents/, pre-flight, routing-table, project-deltas, workflow-diagrams) remain bit-for-bit equivalent across the move so existing `docs/superpowers/<role>.md` deltas and `AC-<issue>-<n>` patterns keep working.

## Non-Goals

- Redesigning the `superteam`, `bootstrap`, or `using-github` skills themselves. Behavior changes outside what consolidation forces (paths, install commands) are out of scope.
- Adding new skills to the marketplace, or removing any existing entry beyond what the merge requires.
- Rewriting the `obra/superpowers` workflow contract or the SKILL.md `## Done-report contracts`. Those remain authoritative.
- Promoting Claude Code or Codex specifics that are not already in scope of these three skills. (For example, no Cowork integration work.)
- Building a public `npx skills` registry beyond what GitHub Releases and the repo's `package.json` already support.

## Acceptance Criteria

### AC-58-1

After consolidation, `plugins/bootstrap/`, `plugins/superteam/`, and `plugins/using-github/` exist in this repository, each containing a complete plugin package equivalent to the corresponding tagged upstream release at the time of merge. Each package retains both manifest surfaces (`.codex-plugin/plugin.json` and `.claude-plugin/plugin.json`) and its `skills/<plugin-name>/` directory verbatim, so existing consumers see no semantic change in the skill content. The canonical workspace overlay at `.agents/skills/<name>/` (see "Canonical skill layout" below) points at the in-package `plugins/<name>/skills/<name>/` tree so the package directory remains the byte-for-byte source of truth.

### AC-58-2

Both marketplace manifests (`.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json`) reference the three in-repo plugins through a source mode that resolves to a path inside this repository for in-repo iteration and to a tagged GitHub release artifact for installed users. Manifest entries published in any tagged release pin an explicit `vX.Y.Z` ref consistent with the existing rule in AGENTS.md and `docs/release-flow.md`. No branch refs (`main`, etc.) appear in released manifests.

### AC-58-3

A contributor can clone `patinaproject/skills`, run a documented bootstrap command (e.g. `pnpm install`), and exercise any of the three skills against this repository itself without first publishing or installing from the marketplace. Specifically, the `superteam` skill can drive an issue workflow in this repo using its own in-repo copy, the `bootstrap` skill can apply its scaffolding to this repo without reaching the network, and the `using-github` skill's slash commands can be exercised from this clone. Local resolution is documented in `README.md` or `docs/`. Falsifiable checks: (a) `node scripts/validate-marketplace.js` accepts the dev overlay and rejects it in release mode, (b) `scripts/apply-bootstrap.js plugins/bootstrap` runs against this repo without network access and exits 0, and (c) the dogfood verification below passes.

#### AC-58-3 dogfood verification

A fresh `claude` session opened at the repo root must discover all four in-repo skills (`bootstrap`, `superteam`, `using-github`, `find-skills`) via Claude's own skill loader without any user action beyond `git clone`.

Claude Code does not expose a public "list installed skills" CLI command, so this check is mechanized as a file-presence + frontmatter check against the canonical workspace overlay that the loader scans. The check script (`scripts/verify-dogfood.sh`) exits 0 if and only if all four conditions hold:

1. Each path `.claude/skills/<name>/SKILL.md` exists for `name` in `{bootstrap, superteam, using-github, find-skills}` and resolves (via symlink chain) to a real file. (Test with `test -e` which follows symlinks; reject broken links with `test -L && ! test -e` returning true.)
2. Each resolved file begins with a YAML frontmatter block whose first two non-delimiter keys include `name:` and `description:`, matching the skill loader's contract documented in Claude Code's skill format.
3. The `name:` value in each frontmatter matches the directory name (`name: bootstrap` under `.claude/skills/bootstrap/`, etc.).
4. For the three in-repo plugin skills, the symlink target resolves under `.agents/skills/<name>/SKILL.md`, which itself resolves under `plugins/<name>/skills/<name>/SKILL.md`; for `find-skills`, the symlink target resolves under `.agents/skills/find-skills/SKILL.md` (where the vercel-labs CLI copied or symlinked it, per "Canonical skill layout" below).

Pass criterion: `scripts/verify-dogfood.sh` exits 0. The check is mechanical and runs in CI on every PR that touches `.claude/skills/**`, `.agents/skills/**`, or `plugins/*/skills/**`.

### AC-58-4

The primary documented install entry point is `npx skills add patinaproject/skills@<skill>` against the vercel-labs `skills` CLI on npm (Gate G6 resolved CLOSED — this repo publishes no CLI of its own; see Gate G6 disposition). `README.md` and both marketplace manifest descriptions document `npx skills add` as the first-time install path for each of the three skills, alongside the existing `/plugin marketplace add` and `codex plugin marketplace add` paths kept as host-specific fallbacks. The release process pins a tested version range of the upstream `skills` CLI in install instructions (initially `skills@^1.5.6`, the version observed during this design); the docs include the CLI's homepage (`https://github.com/vercel-labs/skills`) and a `package.json` `engines` or equivalent record so install commands remain reproducible.

Falsifiable check: from a fresh temp directory, `npx skills add patinaproject/skills@bootstrap --agent claude-code -y` (and equivalents for `superteam`, `using-github`, `find-skills`) against this repo's current branch resolves the skill, writes `skills-lock.json`, and produces an installed skill discoverable by Claude Code's loader. The Executor records the command, the resolved lock entries, and the SHA of the branch the install resolved against in the PR body. CI exercises the same install from a clean working directory against the tagged release once it exists.

### AC-58-5

A `release-please` configuration manages versions for the marketplace itself and for each vendored plugin. The configuration is the single source of truth for what `vX.Y.Z` ends up in both marketplace manifests' `ref` fields, and merging the standing release PR is the only path that publishes a new tag. The pre-existing `plugin-release-bump.yml` workflow and the cross-repo `repository_dispatch` step in `docs/release-flow.md` are removed in the same change, with `docs/release-flow.md` rewritten to describe the new flow. Bot-generated `release-please--*` PRs are the documented exception to the issue-tag rule that already covers `bot/bump-*` PRs in AGENTS.md. The bootstrap self-apply step that currently exists as a TODO in `plugin-release-bump.yml` is either implemented as `scripts/apply-bootstrap.js` invoked from the new release workflow when `plugins/bootstrap/` is part of the release, or explicitly deferred in `docs/release-flow.md` with a tracked follow-up issue — the design forbids leaving it as an undocumented TODO.

### AC-58-6

Contributor and user documentation that does not need to live in the repository is migrated to the repository's GitHub wiki. `docs/` retains AGENTS.md, the rewritten release-flow notes, and the `superpowers/` design and plan artifacts. `README.md` and the marketplace manifest descriptions link the wiki for install walkthroughs, troubleshooting, and per-skill usage notes. The wiki migration is documented in this design and recorded as part of the issue's plan handoff, not done implicitly.

### AC-58-7

The workflow-contract surfaces in `plugins/superteam/skills/superteam/` (SKILL.md, agents/, `pre-flight.md`, `routing-table.md`, `project-deltas.md`, `workflow-diagrams.md`) are present at the new path and reachable by both hosts under the documented local resolution scheme, so an in-repo `/superteam` run on this repo resolves the same SKILL.md it would after a marketplace install. The non-negotiable-rules SHA-256 prefix computed by `Team Lead` during `resolve_role_config` for each shipped role matches between the pre-consolidation tag and the post-consolidation `plugins/superteam` copy, demonstrating no silent edit slipped in during the move.

### AC-58-8

The merge approach for the three source repositories is explicitly chosen and documented: whether Git history is preserved (e.g. `git subtree add` per source repo, or `git filter-repo` + merge) or whether the merge is a content-only import with a single conventional commit. The choice is recorded in this design with rationale, and the plan derived from this design follows the choice without revisiting it. Either way, the three source repos remain readable as archived references for at least one release cycle after consolidation.

## Context

Today this repository is a marketplace catalog only. The three Patina Project skills live in their own repos and propagate releases here through `repository_dispatch` -> `.github/workflows/plugin-release-bump.yml` -> a `chore: bump <plugin> to <tag>` PR. The current state:

- `.agents/plugins/marketplace.json` and `.claude-plugin/marketplace.json` list `bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0`, each pinned to a `vX.Y.Z` tag from its source repo.
- `docs/release-flow.md` enforces the "tagged releases only, no branch refs" rule and documents the dispatch flow.
- `scripts/validate-marketplace.js` enforces the rule programmatically (`semverTag` regex; both manifest schemas).
- `docs/file-structure.md` already names `plugins/` as the location for vendored plugins; it is empty in the current tree.
- The `superteam` skill ships workflow-contract surfaces (SKILL.md, agents/, pre-flight.md, routing-table.md, project-deltas.md, workflow-diagrams.md) that must round-trip across the move without subtle drift, because `Team Lead` computes a non-negotiable-rules SHA-256 prefix that downstream audit lines depend on.

The consolidation has three forces pulling against each other:

1. **Iteration speed.** Coordinated changes across `superteam` and `using-github` today cost a release in each upstream plus a bump PR here. Consolidation collapses that into one PR.
2. **Release discipline.** The current `vX.Y.Z`-only rule is enforced by both the validator and the release-bump workflow. Whatever replaces it must keep the rule and keep it machine-checkable.
3. **Workflow-contract stability.** `superteam` itself will live in-repo, so any local-path resolution for in-repo iteration must not turn the SKILL.md into a moving target during a run, and the `writing-skills` discipline (description-as-trigger, non-negotiable rules round-trip, no silent guardrail redaction) must survive the move intact.

## Approach Options

### Option A: Monorepo with `release-please` per-package, local marketplace via JSON `path` source

Vendor each plugin under `plugins/<name>/` exactly as the upstream package is laid out today (`.codex-plugin/plugin.json`, `.claude-plugin/plugin.json`, `skills/<name>/`). Add a `release-please-config.json` and `.release-please-manifest.json` that treat each `plugins/<name>/` as its own release-please package, plus a top-level package for the marketplace itself. Both manifest files gain a development-only resolution rule: when present, the marketplace validator reads a sibling `marketplace.local.json` overlay that points each `source` at `plugins/<name>` relative to the repo root. The published `marketplace.json` always pins `vX.Y.Z` tags. `npx skills` is a tiny CLI published from `package.json` that calls the host's marketplace-add command with the latest `vX.Y.Z` release of this repo. History is preserved via `git subtree add --prefix=plugins/<name>` for each source repo so per-file blame still resolves.

### Option B: Monorepo with a single combined version, no per-package release-please

Vendor under `plugins/<name>/` the same way, but version the whole repository on a single `vX.Y.Z` line and bump all three plugin entries' refs in lockstep on every release. Simpler tooling, but it forces every release to claim all three skills changed, which weakens semver signal for downstream consumers and conflicts with the existing per-plugin release history.

### Option C: Content-only merge, drop manifests

Inline the three skills directly under a top-level `skills/` directory and drop the per-plugin `.codex-plugin` / `.claude-plugin` manifests in favor of a single repo-level plugin manifest. Fastest to implement, but it breaks the marketplace's per-plugin install surface, forces users into an all-or-nothing install, and loses the upstream package identity that the validator and ecosystem rely on.

**Selected approach: Option A.** It preserves per-plugin identity and per-plugin semver, it keeps the existing validator's `vX.Y.Z` rule machine-checkable, and it gives `Team Lead`'s SHA-256 audit a clean round-trip target. The marketplace manifests in released artifacts still pin tags; the local-path overlay only exists during development.

## Proposed file layout

```text
patinaproject/skills/
  .agents/plugins/marketplace.json         # released: vX.Y.Z refs (unchanged schema)
  .claude-plugin/marketplace.json          # released: vX.Y.Z refs (unchanged schema)
  .agents/plugins/marketplace.local.json   # dev overlay: path-based, excluded from packaged releases
  .claude-plugin/marketplace.local.json    # dev overlay: path-based, excluded from packaged releases
  .agents/skills/                          # CANONICAL workspace overlay (symlink targets; not packaged)
    bootstrap        -> ../../plugins/bootstrap/skills/bootstrap
    superteam        -> ../../plugins/superteam/skills/superteam
    using-github     -> ../../plugins/using-github/skills/using-github
    find-skills/                           # installed via `npx skills add vercel-labs/skills@find-skills`
      SKILL.md
  .claude/skills/                          # Claude Code skill loader path (symlinks into .agents/skills/)
    bootstrap        -> ../../.agents/skills/bootstrap
    superteam        -> ../../.agents/skills/superteam
    using-github     -> ../../.agents/skills/using-github
    find-skills      -> ../../.agents/skills/find-skills
  skills-lock.json                         # committed; produced by vercel-labs skills CLI for reproducible re-installs
  plugins/
    bootstrap/
      .codex-plugin/plugin.json
      .claude-plugin/plugin.json
      skills/bootstrap/...                 # PACKAGE SOURCE OF TRUTH (shipped to consumers)
      package.json                         # name: bootstrap, version: managed by release-please
      CHANGELOG.md                         # managed by release-please
    superteam/
      .codex-plugin/plugin.json
      .claude-plugin/plugin.json
      skills/superteam/
        SKILL.md
        agents/...
        pre-flight.md
        routing-table.md
        project-deltas.md
        workflow-diagrams.md
      package.json
      CHANGELOG.md
    using-github/
      .codex-plugin/plugin.json
      .claude-plugin/plugin.json
      skills/using-github/...
      package.json
      CHANGELOG.md
  release-please-config.json
  .release-please-manifest.json
  scripts/
    validate-marketplace.js                # extended: also lints marketplace.local.json schema when present and
                                           # asserts overlay symlinks are absent from release-mode publish paths
    apply-bootstrap.js                     # replaces the TODO step in plugin-release-bump.yml; in-repo invocation of plugins/bootstrap
    verify-dogfood.sh                      # AC-58-3 dogfood check (file-presence + frontmatter)
  docs/
    AGENTS.md
    release-flow.md                        # rewritten for release-please; documents vercel-labs CLI version pin
    file-structure.md                      # rewritten for the new layout and canonical overlay
    superpowers/specs/...
    superpowers/plans/...
  .github/workflows/
    release-please.yml                     # replaces plugin-release-bump.yml
    lint-md.yml                            # unchanged
    lint-pr.yml                            # unchanged
    lint-actions.yml                       # unchanged
    verify-iteration.yml                   # runs validator (--dev / release), apply-bootstrap, verify-dogfood.sh
```

Note the absence of a `packages/skills-cli/` directory: Gate G6 (CLOSED) removed it. The vercel-labs CLI is consumed via `npx`, not republished.

The wiki carries everything that used to live in per-plugin `README.md` install walkthroughs, user-facing troubleshooting, and any non-design tutorial content.

## Canonical skill layout

This repo has three concentric surfaces for skill content. The package source of truth lives inside each plugin. Two top-level overlays project it onto the surfaces this repo's own Claude and Codex sessions actually scan:

```text
plugins/<name>/skills/<name>/SKILL.md   <-- package source of truth (shipped to consumers)
  ^
  | symlink (workspace overlay; not packaged)
  |
.agents/skills/<name>/SKILL.md          <-- canonical workspace overlay (single source for both hosts)
  ^
  | symlink
  |
.claude/skills/<name>/SKILL.md          <-- Claude Code skill loader path (local-iteration only)
```

Rationale:

- `plugins/<name>/skills/<name>/` is what marketplace consumers receive when they install via `npx skills add patinaproject/skills@<name>` or via either host's `/plugin marketplace add` command. It must remain byte-equivalent to the upstream tag content per AC-58-7.
- `.agents/skills/<name>/` is the **canonical workspace overlay**. The directory name uses `.agents` with the `s` (matching `.agents/plugins/marketplace.json` already in the repo). This is the layer the design treats as the single overlay surface; Codex stays under `.agents/` per repo convention. Both `bootstrap`, `superteam`, `using-github`, and `find-skills` get an entry here.
- `.claude/skills/<name>/` is a thin symlink layer pointing into `.agents/skills/<name>/`. Claude Code's skill loader scans `.claude/skills/**/SKILL.md`, so this layer exists solely so this repo's own Claude sessions discover the four in-repo skills without any user action beyond `git clone`. Codex's loader does not require a parallel `.codex/skills/` directory because `.agents/skills/` already lives under a Codex-prefixed root.
- Symlinks are **dev-time iteration aids only**. They are excluded from the packaged release surface (see Risks; see Workstream 4 in the plan). The `release-please` `extra-files` rewrites and the `npm` `files` allowlists must not include these overlay paths.

The vercel-labs `skills` CLI defaults to copying skill content when `--agent <agent>` is passed and to symlinking otherwise. For the dogfood overlay we want the symlink behavior because it keeps `plugins/<name>/skills/<name>/SKILL.md` as the sole edit target. The `find-skills` skill installed via `npx skills add vercel-labs/skills@find-skills --agent claude-code -y` produced a copy plus a `skills-lock.json`; the canonical-layout reconciliation step (Plan W2.x) moves the copied content into `.agents/skills/find-skills/` and replaces the CLI-created `.claude/skills/find-skills/` directory with a symlink into the canonical path. `skills-lock.json` stays at the repo root (its CLI-chosen location) and is committed so subsequent `npx skills` operations are reproducible.

For Codex the overlay is consumed in two ways:

1. As a marketplace dev overlay (`marketplace.local.json`) declaring `path:` sources pointing at `plugins/<name>` (per Gate G2). This is the install-equivalent path.
2. As a directory `.agents/skills/<name>/` containing the same SKILL.md, so Codex's skill discovery sees the in-repo content without going through the marketplace at all.

## In-repo iteration: local-path marketplace resolution

The two manifests in their released form continue to declare `vX.Y.Z` refs against this repository. For local development, a contributor runs the host's marketplace-add command pointed at the working tree instead. Two surfaces support this:

1. A development overlay file (`marketplace.local.json` in each marketplace directory) declares a `path:` source for each plugin entry, e.g. `"source": { "source": "path", "path": "../../plugins/superteam" }` for Codex and the Claude analogue. The overlay is gitignored from packaged releases but tracked in-repo so contributors get it on clone. The validator gains an explicit mode for the overlay that skips the `vX.Y.Z` rule and instead asserts each `path` resolves to a `plugins/<name>/` directory with both per-plugin manifests present.
2. `npx skills --dev` (added under `packages/skills-cli/`) registers the local overlay against the active host so a clone is sufficient. The default `npx skills` (no `--dev`) targets the published tag. The CLI's two modes are documented in `README.md` and in the wiki install walkthrough.

For the `superteam` skill specifically, in-repo iteration must not introduce path drift inside a single `/superteam` run. The CLI's `--dev` mode registers a stable absolute path resolved at registration time, and `superteam`'s pre-flight host-probe order is unchanged: probing remains a runtime aid, not a substitute for the locked SKILL.md at the registered path. `Team Lead`'s `resolve_role_config` SHA-256 prefix is computed against the SKILL.md at that path, identical to a marketplace-installed copy.

## `npx skills` installer (adopted from vercel-labs)

Gate G6 is **CLOSED**: the bare npm name `skills` is taken by `vercel-labs/skills` (`skills@1.5.6` at design time), a fully capable CLI that already supports `add <owner/repo@skill>`, `init`, `find`, `experimental_sync`, and per-agent (`--agent claude-code`, `--agent codex`, etc.) install. This repo therefore **does not author or publish its own `skills` CLI.** Workstream 5 in the prior plan is replaced by an integration workstream covering manifest descriptions, README, and documentation updates — no new package, no new `bin`.

User-facing install pattern:

```sh
npx skills add patinaproject/skills@bootstrap     --agent claude-code -y
npx skills add patinaproject/skills@superteam     --agent claude-code -y
npx skills add patinaproject/skills@using-github  --agent claude-code -y
npx skills add patinaproject/skills@find-skills   --agent claude-code -y   # already installed pre-delta; documented for fresh clones
```

The `<owner/repo@skill>` syntax resolves against the published GitHub repository. The CLI walks the repo's plugin structure, finds the named skill, and either symlinks (no `--agent`) or copies (with `--agent`) the content into the agent's expected skill directory. `skills-lock.json` records the resolved SHA so subsequent re-installs reproduce.

**Supply-chain considerations (raised during delta review):**

- The CLI is a third-party dependency. The README install instructions pin a tested **version range** (`skills@^1.5.6` initially), and the docs include both the upstream repo URL (`https://github.com/vercel-labs/skills`) and the version's published-to-npm date so a contributor verifying the install can confirm they're pulling the same artifact this design exercised.
- `npx skills add` should be run with `--ignore-scripts` where the host shell supports it (`npm_config_ignore_scripts=true npx skills add ...`). The README documents this as the default-recommended invocation and explains the trade-off (it disables postinstall scripts; the vercel-labs CLI currently has none, but this is defense-in-depth).
- The marketplace manifests continue to pin `vX.Y.Z` refs for the repo itself. A user who distrusts the npm-distributed CLI can fall back entirely to `/plugin marketplace add patinaproject/skills` (Claude Code) or `codex plugin marketplace add patinaproject/skills --ref vX.Y.Z` (Codex). The vercel-labs CLI is the **primary** documented path, not the only one.
- If the upstream `vercel-labs/skills` package is unpublished or rewritten in a way that breaks the documented install pattern, the fallback is the marketplace-add path above. The repo's `docs/release-flow.md` records this as the documented rollback.

Host detection / auto-invocation: out of scope here (Planner's Gate G4 carried this; with the vercel-labs CLI doing the heavy lifting, host detection is the CLI's concern, not ours).

## Migration approach: history preservation

History is preserved via `git subtree add --prefix=plugins/<name> <upstream-remote> <tag>` for each of the three source repos at their current tagged versions (`bootstrap@v1.10.0`, `superteam@v1.5.0`, `using-github@v2.0.0`). This keeps per-file blame intact across the move and gives the SHA-256 round-trip check a defensible base. The three upstream repos are archived (not deleted) on completion and their `README.md` is updated to point at this repo. Archiving rather than deleting protects against link-rot from older marketplace consumers and lets the issue's plan recover from a botched merge if needed.

The first consolidation commit is a single non-conventional merge introducing all three `plugins/<name>/` trees from their archived tags, followed by conventional commits that wire up `release-please`, the dev overlay, the CLI package, the workflow replacement, and the doc rewrites. Each follow-up commit pairs with one or more `AC-58-<n>` IDs in the PR body, per AGENTS.md.

## `release-please` configuration shape

- Monorepo mode with four packages: `plugins/bootstrap`, `plugins/superteam`, `plugins/using-github`, and `packages/skills-cli`. The top-level marketplace itself does not get its own package; its version is the `packages/skills-cli` version, because that is what users install.
- Each plugin package gets independent semver based on its own conventional commits (scopes: commits whose path falls under `plugins/<name>/` map to that package).
- `release-please` produces tags `bootstrap-v1.11.0`, `superteam-v1.6.0`, `using-github-v2.1.0`, etc., plus `skills-v1.0.0` for the CLI. The marketplace manifests pin per-plugin `vX.Y.Z` refs derived from the per-plugin tag (the `bootstrap-` prefix is stripped to match the manifest's existing `vX.Y.Z` regex). The release-please workflow extends the existing validator's checks to assert that mapping.
- The "release-please-action" step opens release PRs from `release-please--*` branches; AGENTS.md is updated to list this prefix alongside `bot/bump-*` as the only no-issue PRs.
- The bootstrap self-application step that today lives as a TODO in `plugin-release-bump.yml` becomes `scripts/apply-bootstrap.js` invoked from the release-please workflow when `plugins/bootstrap/` is part of the release. The same workflow signs commits as `github-actions[bot]` and enables auto-merge, preserving the existing signing/auto-merge guarantees described in `docs/release-flow.md`.
- `scripts/validate-marketplace.js` keeps its `vX.Y.Z`-only check for the released manifests. The dev overlay's `path:` entries are validated against the working tree only.

## Wiki migration plan

Move to the wiki:

- Per-host install walkthroughs (Claude Code, Codex) with screenshots
- Per-skill usage examples and FAQs that today live in upstream `README.md`s
- Troubleshooting notes for `npx skills`, marketplace upgrades, and host detection
- The "how superteam runs end-to-end" narrative currently in `patinaproject/superteam/README.md`

Keep in the repo:

- `AGENTS.md` (root) and the existing `CLAUDE.md` import shim
- `docs/release-flow.md` (rewritten for release-please)
- `docs/file-structure.md` (rewritten for `plugins/`, `packages/`, and overlay files)
- `docs/superpowers/specs/` and `docs/superpowers/plans/`
- `README.md` reduced to: one-paragraph repo description, `npx skills` quickstart, links to the wiki for everything else, and a links table for the three skills

Marketplace manifest descriptions link the wiki landing page for each plugin so install pages in Claude Code and Codex surface the migration target naturally.

## Open questions

1. **Per-plugin tag prefix vs. unified tag line.** `release-please` monorepo mode emits prefixed tags by default (`bootstrap-v1.11.0`). The existing manifest validator regex is `^v(\d+\.\d+\.\d+)$`. The plan must extend the validator or strip the prefix when writing manifests. Either is fine; flagging so the Planner picks one explicitly rather than the Executor improvising.
2. **Codex `path:` source support.** Confirm Codex's marketplace manifest accepts a path-style source equivalent to Claude's. If it does not, the dev overlay for Codex may need to fall back to a `git+file://` URL or a `--ref local` convention; the Planner should validate against the current Codex release before locking in the overlay schema.
3. **Bootstrap self-apply during release.** Today the bootstrap self-apply is a TODO step. The plan must decide whether `scripts/apply-bootstrap.js` runs every release or only on `plugins/bootstrap/` releases, and whether the result is committed to the release-please PR branch or to a follow-up PR.
4. **CLI host detection robustness.** Resolved by adopting the vercel-labs `skills` CLI (Gate G6 closed). Host detection is the upstream CLI's concern. Auto-invocation from this repo is not in scope.
5. **Wiki content ownership.** Wikis are not branch-protected. The plan should decide whether wiki content has an "owner of record" in `docs/` (e.g. a `docs/wiki-sources/` folder that the wiki mirrors from), or whether the wiki is the canonical surface. Recommendation: canonical wiki, with a single doc in `docs/` listing the wiki pages that exist so review of wiki link-rot stays in-repo.

## Gates resolved in-design

### Gate G6 — `npx skills` package name (CLOSED)

**Resolution:** the bare npm name `skills` is owned by `vercel-labs/skills` (`skills@1.5.6` at the time of this design). The vercel-labs CLI already implements `add <owner/repo@skill>`, `init`, `find`, `experimental_sync`, and per-agent install via `--agent claude-code` / `--agent codex`. It does what we would have built. **Integration, not invention.**

**Rationale:**

- Publishing `@patinaproject/skills` as a competing scoped CLI would split user intuition (`npx skills` vs. `npx @patinaproject/skills`) and put us on the hook for maintaining a CLI that duplicates an actively-developed upstream.
- The upstream's `<owner/repo@skill>` install syntax already targets exactly the granularity we need (per-plugin install against `patinaproject/skills`).
- Marketplace-add (`/plugin marketplace add` / `codex plugin marketplace add`) remains a host-native fallback if a user distrusts npm-distributed tooling.

**Consequence:** Workstream 5 in the previous plan (build and publish our own CLI) is **replaced** by a documentation/integration workstream. No new package directory under `packages/`, no new `bin`, no `npm publish` step in the release workflow. AC-58-4 is rewritten to reflect this (see above).

## Risks

- **Workflow-contract drift in `superteam`.** Moving SKILL.md changes its path and may inadvertently change line endings, trailing newlines, or YAML key order, which would shift the non-negotiable-rules SHA-256 prefix. Mitigation: AC-58-7 explicitly asserts the SHA-256 prefix round-trips, and the merge uses `git subtree add` rather than a fresh copy so byte content is preserved.
- **Local-path overlay leaking into a release.** If `marketplace.local.json` ever lands in a published release artifact, downstream users get an install that points at a path that does not exist on their machine. Mitigation: `release-please` and the marketplace manifest published surface both exclude `*.local.json`; the validator's release-mode check refuses to publish if either overlay file is present at the path it would resolve from.
- **Canonical-layout symlinks leaking into a release.** `.agents/skills/<name>/` and `.claude/skills/<name>/` are symlinks into `plugins/<name>/skills/<name>/`. They are workspace-iteration aids and must not appear in the package payload consumers receive via `npx skills add` or marketplace install. Mitigations: (a) the `release-please` `extra-files` configuration only targets the marketplace manifests, not the overlay directories; (b) the overlay directories are listed in `.gitattributes` `export-ignore` so `git archive`-derived tarballs strip them; (c) the validator's release-mode check refuses to publish if a `.agents/skills/<name>/SKILL.md` or `.claude/skills/<name>/SKILL.md` entry is not a symlink whose target resolves under `plugins/`. The dogfood check (AC-58-3) verifies the symlinks point at the right place; the release-mode validator inverts that to refuse the publish if the layout drifts.
- **Vercel-labs CLI supply-chain.** Adopting an upstream CLI for the primary install path means an unpublish or compromise upstream affects our docs. Mitigations: (a) pin a tested version range in install docs (`skills@^1.5.6` initially); (b) recommend `npm_config_ignore_scripts=true` as the default invocation; (c) document the marketplace-add fallback so a contributor can avoid the npm-distributed CLI entirely; (d) record the upstream repo URL and tested version in `docs/release-flow.md`.
- **Cross-host install asymmetry.** Codex and Claude Code differ in how their marketplace manifests resolve `path:` sources. If only one host supports the overlay, in-repo iteration for the other host falls back to "publish a dev tag." Mitigation: open question (2) above must resolve before plan handoff.
- **History-preservation cost.** `git subtree add` adds repo size proportional to the three source histories. Combined, this is small (the three repos are <50 MB), but it does mean `pnpm install` clone-time grows. Acceptable.
- **Single-release blast radius.** Once consolidated, a bad merge can break all three skills at once. Mitigation: `release-please`'s per-package versioning still produces three independent tags, so a single bad release can be rolled back per-plugin; combined with the existing `vX.Y.Z` validator, this matches the current rollback story.
- **Wiki link rot.** Wiki content is easy to lose track of. Mitigation: see open question (5).

## Workflow-contract considerations (writing-skills)

This design touches `skills/**/*.md` and the workflow-contract surfaces of `superteam`. Per the `superpowers:writing-skills` discipline:

- **RED/GREEN baseline.** The existing `superteam` SKILL.md has a tested baseline at `v1.5.0`. Consolidation must preserve baseline behavior; AC-58-7's SHA-256 round-trip is the GREEN check.
- **Rationalization resistance.** No SKILL.md edits are in scope of this design. The migration is byte-equivalent. Any later behavior change is its own issue and follows the same SKILL.md TDD discipline.
- **Red flags.** "We can clean up the SKILL.md while we're moving it" is the obvious failure mode. The plan must explicitly forbid this in its execution steps; the SHA-256 check enforces it.
- **Token-efficiency targets.** No content is being added to SKILL.md, so the existing token targets stay green.
- **Role ownership.** AGENTS.md and `docs/release-flow.md` are owned in this repo. `SKILL.md` for each plugin is owned in `plugins/<name>/skills/<name>/SKILL.md` after the move; the source-of-truth boundary that AGENTS.md describes shifts from "upstream repo owns the package" to "this repo's `plugins/<name>/` owns the package." This shift is documented in the AGENTS.md update that ships with the consolidation PR.
- **Stage-gate bypass paths.** The `release-please` workflow must not allow a manifest publish without `vX.Y.Z` (the existing validator enforces this) and must not allow a manifest publish with a `marketplace.local.json` overlay present (added validator check). Both gates are machine-enforceable, not advisory.

## Adversarial review (post-commit pass)

A second pass against the `superpowers:writing-skills` review dimensions (RED/GREEN baseline obligations, rationalization resistance, red flags, token-efficiency targets, role ownership, stage-gate bypass paths) plus general design dimensions (testable ACs, assumption surfacing, completeness, reversibility, naming) surfaced three material findings, dispositioned below.

### Revisions

- **AC-58-3 falsifiability.** Original AC said "exercise any skill" without a concrete check. Revised to require three documented exit-0 invocations (overlay registration, validator dev/release modes, bootstrap apply against this repo).
- **AC-58-5 bootstrap self-apply coverage.** Original AC removed `plugin-release-bump.yml` but did not say what becomes of the TODO bootstrap self-apply step. Revised to require either implementation or explicit deferral with a tracked follow-up issue; leaving the TODO undocumented is forbidden.
- **npm-name lock-in.** Original `npx skills` section assumed the bare name was available. Added scoped fallback `@patinaproject/skills` and made name resolution a Planner gate.

Non-material observations recorded but not dispositioned into AC changes:

- AC-58-7's SHA-256 check is verification, not a behavioral test. Acceptable because the move is byte-equivalent (no SKILL.md edits in scope per writing-skills section).
- "What happens if the dev overlay drifts from the released manifest during a release-please run" is a Planner-implementation concern, not a design defect.

### Reviewer context

Same-thread fallback reviewer pass. No fresh subagent or parallel specialist was available in this teammate context; findings above are this teammate's adversarial pass against the committed design, applied with the writing-skills and general design dimensions enumerated in the role contract. Brainstormer-originated concerns are explicitly tagged as such above, separate from the dispositioned findings.

## Delta history

This appendix records design revisions made after Gate 1 first approved. Each entry is a discrete delta with a date and a source attribution.

### 2026-05-11 — Operator delta revision

Source: operator prompt opening a Gate-1 re-review during the `/superteam` delta run, supplied to the Brainstormer in this thread. The operator-binding deltas absorbed in this revision are:

1. **Canonical skill layout introduced.** `.agents/skills/` becomes the canonical workspace overlay; `.claude/skills/` is a symlink layer into it; `plugins/<name>/skills/<name>/` remains the package source of truth shipped to consumers. New "Canonical skill layout" section added. AC-58-1 amended to mention the overlay relationship. The original Workstream 5 (build/publish our own CLI) is removed from the implementation surface.

2. **Gate G6 closed by adoption, not by name resolution.** The bare npm name `skills` is taken by `vercel-labs/skills@1.5.6`, which already implements the install surface this repo intended to build. AC-58-4 rewritten so the primary install path is `npx skills add patinaproject/skills@<skill>` against the upstream CLI. Supply-chain notes added (version pinning, `--ignore-scripts`, marketplace-add fallback). The "`npx skills` installer" section rewritten as "(adopted from vercel-labs)" with no new package authored in this repo.

3. **Dogfood verification mechanized as AC-58-3 sub-check.** AC-58-3 extended with a "dogfood verification" sub-section. The check is mechanized as `scripts/verify-dogfood.sh` — file-presence + YAML-frontmatter assertions against the canonical overlay paths, because Claude Code does not expose a public "list installed skills" CLI command that this design can pin against. The four in-repo skills (`bootstrap`, `superteam`, `using-github`, `find-skills`) must all be discoverable.

4. **`find-skills` artifacts reconciled with canonical layout.** The `npx skills add vercel-labs/skills@find-skills --agent claude-code -y` install placed content under `.claude/skills/find-skills/` and produced `skills-lock.json` at the repo root. The canonical-layout reconciliation moves the copied content under `.agents/skills/find-skills/` and replaces `.claude/skills/find-skills/` with a symlink. `skills-lock.json` is committed in place at the repo root.

5. **Release-please / overlay symlink separation made explicit.** New Risks bullet records that the overlay symlinks (`.agents/skills/`, `.claude/skills/`) must not appear in the packaged release surface. The validator's release-mode check is extended to enforce this.

No prior acceptance criterion was weakened. No non-negotiable rule was removed. The byte-equivalence requirement for the `superteam` workflow-contract surfaces (AC-58-7) is reinforced by the canonical-layout decision (symlinks preserve byte content), not relaxed.

### 2026-05-11 — Adversarial review (delta-only)

The brainstormer ran a separate adversarial review against the four delta dimensions named in the operator prompt:

1. **Dogfood AC falsifiability.** Original delta draft asserted "a fresh `claude` session discovers four skills" without specifying the check mechanism. Revised to specify `scripts/verify-dogfood.sh` doing file-presence + frontmatter assertions; the test is now reproducible without invoking the Claude binary.
2. **Vercel-labs supply-chain.** Added explicit mitigations: pinned version range (`skills@^1.5.6`), `npm_config_ignore_scripts=true` recommendation, marketplace-add fallback as a CLI-free path, upstream repo URL recorded in `docs/release-flow.md`.
3. **Release-please / overlay symlink interaction.** Added a Risks bullet making the rule explicit: overlay symlinks are workspace-only; the validator's release-mode check refuses publishes that include them. `.gitattributes` `export-ignore` is documented as a secondary mitigation.
4. **SKILL.md frontmatter sufficiency.** Verified by inspection at design time that each of the three in-repo plugin SKILL.md files already carries the `name:` / `description:` frontmatter Claude's skill loader requires (`plugins/bootstrap/skills/bootstrap/SKILL.md`, `plugins/superteam/skills/superteam/SKILL.md`, `plugins/using-github/skills/using-github/SKILL.md`). No frontmatter rewrite is required for the canonical-overlay symlinks to be discoverable. Recorded as a clean-pass dimension, not a defect.
