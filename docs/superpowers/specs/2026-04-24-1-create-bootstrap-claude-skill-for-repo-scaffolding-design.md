# Design: Create `bootstrap` Claude skill for repo scaffolding [#1](https://github.com/patinaproject/bootstrap/issues/1)

## Intent

Ship a `bootstrap` skill — packaged as a Claude Code + Codex plugin at the repository root — that scaffolds a new public or private repository to the Patina Project file-structure baseline, and that can also audit an existing repository and recommend incremental improvements to reach the same baseline.

The enforced baseline mirrors `patinaproject/superteam`: a dual-plugin repository root, a self-contained skill directory, conventional-commits-with-issue-ref enforcement via commitlint + Husky, a PR template, `AGENTS.md` + `CLAUDE.md` guidance, a human-readable `README.md`, and a `docs/file-structure.md` contributor reference (plus the `docs/superpowers/` tree when the project adopts the superteam workflow).

## Background

Every new Patina project starts with the same setup work, and drift between repos is already visible. `superteam` has settled on a durable file structure, so `bootstrap` treats that structure as the canonical template and gives every new repo — and every retrofit — a single invocation to reach it.

## Non-goals

- Publishing to the marketplace (out of scope for this run; covered by a follow-up).
- Runtime-specific install automation beyond emitting the correct manifest files.
- Language/framework choices beyond Node.js + PNPM at the repo-tooling layer.
- Inventing a brand-new convention set: `bootstrap` emits what `superteam` already uses.

## This repo's own scaffolding

This repository must adopt the structure `bootstrap` emits, because it is the reference implementation. As part of this run, this repo gains:

- `.claude-plugin/plugin.json`, `.codex-plugin/plugin.json`
- `skills/bootstrap/SKILL.md` (+ support files as needed)
- `AGENTS.md`, `CLAUDE.md`, updated `README.md`
- `docs/file-structure.md`
- `package.json`, `pnpm-lock.yaml`, `commitlint.config.js`, `.husky/commit-msg`
- `.github/pull_request_template.md`, `.gitignore`

The `docs/superpowers/specs/` and `docs/superpowers/plans/` trees are created by this run's design + plan artifacts.

## What `bootstrap` emits into a target repo

The skill scaffolds the following tree (paths relative to the target repo root):

**Core baseline** (every repo):

```text
.claude/settings.json
.github/CODEOWNERS
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/pull_request_template.md
.gitattributes
.gitignore
.husky/commit-msg
.husky/pre-commit
.editorconfig
.markdownlint.jsonc
.markdownlintignore
.nvmrc
AGENTS.md
CLAUDE.md
CONTRIBUTING.md
README.md
SECURITY.md                 (public repos only)
commitlint.config.js
package.json
docs/file-structure.md
```

**AI agent plugin add-ons** (emitted only when `<is-agent-plugin>` is yes):

```text
.claude-plugin/plugin.json          (Claude Code)
.codex-plugin/plugin.json           (Codex)
.github/copilot-instructions.md     (GitHub Copilot)
.cursor/rules/<repo>.mdc            (Cursor)
.windsurfrules                      (Windsurf)
skills/.gitkeep
```

`AGENTS.md` is the portable surface consumed by Aider, Zed, Cline, and others that natively honor it; it ships in the core baseline, not the agent-plugin block, so those editors are covered without dedicated rule files.

Opt-in secondary editors (prompted during agent-plugin mode):

```text
.continue/config.json               (Continue.dev)
```

Planner reviews current docs for each platform (Claude Code, Codex, Opencode, Copilot, Cursor, Windsurf, Continue.dev) before templating and uses `patinaproject/superteam`'s file patterns as the Patina-idiomatic reference for Claude Code and Codex manifests.

**Opt-in prompts** (independent of agent-plugin mode):

```text
docs/superpowers/specs/.gitkeep
docs/superpowers/plans/.gitkeep
```

### Conventions encoded

- **Commits**: Conventional Commits with no scope, required `#<issue>` tag in subject, 72-char max (lifted verbatim from `superteam/commitlint.config.js`).
- **PR titles**: same format as commits (for squash-and-merge).
- **PR body**: template mirroring `superteam/.github/pull_request_template.md`, including `Closes #<issue>` guidance and the `### AC-<issue>-<n>` acceptance-criteria block.
- **Issue titles**: plain-language, no conventional-commit prefix.
- **Issue templates**: minimal bug report + feature request.
- **Contributor docs**: `AGENTS.md` as the shared workflow contract, `CLAUDE.md` that imports `AGENTS.md` via `@AGENTS.md` and adds Claude-only guidance.
- **PNPM**: `"packageManager": "pnpm@10.33.2"` pin, `engines.node >=24`, `prepare: "husky"` script, commitlint + markdownlint-cli2 + lint-staged devDeps, `.nvmrc` matching.
- **Markdown linting**: `markdownlint-cli2` with `.markdownlint.jsonc` and a `.markdownlintignore` that excludes `node_modules/`, `pnpm-lock.yaml`, and any other generated content. The `pnpm lint:md` script uses a glob that does not traverse `node_modules/`. Husky `pre-commit` runs linting on staged `*.md` via `lint-staged` or equivalent so the hook is scoped to changed files and never walks `node_modules/`.
- **Line endings**: `.gitattributes` with `* text=auto eol=lf`.
- **Claude Code / Codex plugin surfaces**: both manifests at the repo root pointing at `./skills`.
- **Claude Code project settings**: `.claude/settings.json` baseline (empty permissions/hooks, with comments) emitted into every scaffolded repo.
- **Code ownership**: `.github/CODEOWNERS` with a prompted default owner (e.g. `@patinaproject/maintainers`).
- **Security reporting** (public repos only): `SECURITY.md` with a templated `<security-contact>` placeholder and acknowledgement SLA.

### Placeholders

The skill prompts for (or infers) these values and templates them into emitted files:

- `<owner>`, `<repo>`, `<repo-description>`
- `<visibility>` (public | private) — affects README shape and whether `SECURITY.md` is emitted
- `<primary-skill-name>` (optional; if set, scaffolds `skills/<name>/SKILL.md` starter)
- `<codeowner>` (default `@<owner>/maintainers`) — written into `.github/CODEOWNERS`
- `<security-contact>` (public repos only) — written into `SECURITY.md`; defaulted from `git config user.email` and editable before scaffold
- `<author-name>` — defaulted from `git config user.name`; written into `package.json` `author` field
- `<author-email>` — defaulted from `git config user.email`; written into `package.json` `author` field
- `<use-superteam>` (yes | no) — if yes, emit `docs/superpowers/specs/.gitkeep` and `docs/superpowers/plans/.gitkeep`
- `<is-agent-plugin>` (yes | no, default no) — if yes, emit Claude Code, Codex, Opencode, Copilot, Cursor, and Windsurf plugin surfaces plus `skills/.gitkeep`

### Plugin enablement in emitted `.claude/settings.json`

The emitted `.claude/settings.json` declares the canonical Patina plugins as enabled at the project level so anyone cloning the repo gets them on first Claude Code session without running install commands manually:

```jsonc
{
  "enabledPlugins": {
    "superteam@patinaproject": true,
    "superpowers@claude-plugins-official": true
  }
}
```

The Patina marketplace itself is typically user-level. The emitted `README.md` and `CLAUDE.md` include a one-line prerequisite:

```text
/plugin marketplace add patinaproject/skills
```

So the first-time-on-machine flow is one command; cloning a bootstrap-scaffolded repo afterward requires no further action. The marketplace id is `patinaproject` (from `patinaproject/skills`).

Planner task: verify the exact `enabledPlugins` schema and whether Claude Code supports project-level marketplace declaration (e.g. `extraKnownMarketplaces`) against current Claude Code docs before templating.

## Modes

### New-repo mode

Preconditions:

- Target is a git repository (initialized or empty).
- No prior `.claude-plugin/` or `.codex-plugin/` manifests.

Behavior:

- Emit the full tree above.
- Run `pnpm install` to generate `pnpm-lock.yaml` and wire Husky.
- Leave a single commit staged (not committed) so the user owns the first commit.

### Existing-repo realignment mode

Preconditions:

- Target is a git repository with existing content.

Behavior:

- Inspect the repo and produce a **realignment report** grouped by baseline area: plugin manifests, skills layout, commit/PR conventions, PNPM tooling, agent docs, README/docs structure, AI editor surfaces.
- Detect whether the repo is an AI agent plugin by presence of any agent-plugin manifest (`.claude-plugin/`, `.codex-plugin/`, `.github/copilot-instructions.md`, `.cursor/`, `.windsurfrules`, etc.). When detected, realignment includes AI editor coverage: any currently-supported platform that is missing is recommended as an addition, bringing existing plugins up to the latest supported-platform set.
- For each gap, classify as `missing`, `stale`, or `divergent` and produce a concrete recommendation on how to realign with the latest bootstrap baseline.
- Never overwrite existing files without explicit confirmation. For each recommendation, show a diff preview and ask the user to accept, skip, or defer — always interactive, no flags.
- Group recommendations into ordered batches that can be applied independently (e.g. "manifests first, then commitlint, then docs, then new-platform manifests").

### Public vs. private

- **Public**: README includes install/usage sections and links to issues/discussions.
- **Private**: README is concise and internal-focused, omits public-facing sections.

## Skill packaging

- Lives at `skills/bootstrap/SKILL.md` in this repo.
- Repo root is the plugin surface for both Claude Code (`.claude-plugin/plugin.json`) and Codex (`.codex-plugin/plugin.json`), same pattern as `superteam`.
- Skill is invoked as `/bootstrap:bootstrap` (Claude Code) or `Use $bootstrap` (Codex).
- Support files adjacent to `SKILL.md`:
  - `templates/` — the files the skill writes into target repos (source of truth for emitted content).
  - `audit-checklist.md` — canonical compliance checklist used by audit mode.

## Acceptance criteria

- **AC-1-1** — Skill exists at `skills/bootstrap/SKILL.md` and is discoverable as a Claude Code + Codex plugin at the repo root.
- **AC-1-2** — New-repo mode scaffolds the full tree listed above into an empty target repo; `pnpm install` then `pnpm exec commitlint --help` succeeds on the result.
- **AC-1-3** — Scaffolded commit hook rejects `feat: add foo` and accepts `feat: #42 add foo`.
- **AC-1-4** — Scaffolded PR template contains the `Closes #<issue>` guidance and an `### AC-<issue>-<n>` block.
- **AC-1-5** — Existing-repo realignment mode produces a grouped realignment report against a non-compliant fixture repo and proposes concrete, ordered recommendations without overwriting existing files by default.
- **AC-1-6** — Realignment mode, when given a repo that already matches the baseline, reports zero gaps.
- **AC-1-7** — This repository itself conforms to the emitted baseline (self-hosting check): running realignment mode against this repo after the run reports zero gaps.
- **AC-1-8** — `AGENTS.md`, `CLAUDE.md`, `README.md`, and `docs/file-structure.md` exist in this repo and follow the conventions documented in `superteam`.
- **AC-1-9** — Public vs. private selection produces the documented README shape differences; `SECURITY.md` is emitted only for public.
- **AC-1-10** — Scaffolded `markdownlint-cli2` config lints all emitted `*.md` files without errors; `pnpm lint:md` script exits 0 on a fresh scaffold.
- **AC-1-11** — Husky `pre-commit` hook runs markdown linting on staged `*.md` files and blocks commits with markdownlint violations.
- **AC-1-12** — Emitted `.claude/settings.json` enables `superteam@patinaproject` and `superpowers@claude-plugins-official`. The skill does not print a post-install step or marketplace-add prompt.
- **AC-1-13** — When `<is-agent-plugin>` is yes, the skill emits plugin surfaces for Claude Code, Codex, Opencode, Copilot, Cursor, and Windsurf, plus `skills/.gitkeep`. When no, none of those surfaces are emitted.
- **AC-1-14** — Realignment mode, run against an existing agent plugin that is missing one or more currently-supported platform surfaces, reports the missing platforms and recommends adding them, bringing the plugin up to the current supported-platform set.
- **AC-1-15** — Realignment mode, run against an existing agent plugin that already covers every currently-supported platform, reports zero platform-coverage gaps.
- **AC-1-16** — Agent-plugin mode emits `.github/workflows/release.yml` wired to [release-please](https://github.com/googleapis/release-please), `release-please-config.json`, and `.release-please-manifest.json` so releases are driven by conventional commits. Semver level is auto-derived from commit types; there is no manual patch/minor/major input.
- **AC-1-17** — Every emitted repo ships `.github/workflows/lint-pr.yml` that validates PR titles (ASCII-only, conventional commits with no scope, `#<issue>` subject ref), breaking-change marker consistency (title `!` ⇔ body `BREAKING CHANGE:` footer), and a `Closes #<issue>` closing keyword in the PR body.
- **AC-1-18** — `package.json` is the canonical version source; `scripts/sync-plugin-versions.mjs` and `scripts/check-plugin-versions.mjs` plus a husky `pre-commit` check block divergence between `package.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json`.
- **AC-1-19** — `CHANGELOG.md` is release-please-compatible (hand-edits to released sections are prohibited); `RELEASING.md` documents the release-please-driven flow and the `DISTRIBUTE_VIA_PATINAPROJECT_SKILLS` behavior.
- **AC-1-20** — The emitted agent-plugin `release.yml` auto-dispatches `bump-plugin-tags.yml` on `patinaproject/skills` after a successful release when `github.repository_owner == 'patinaproject'`. Forks in other orgs skip the step silently. The one-time org-level secret `PATINA_SKILLS_DISPATCH_TOKEN` is documented in `RELEASING.md`.

## Requirement set

1. Mirror `patinaproject/superteam`'s repository structure as the enforced baseline.
2. Provide both new-repo and existing-repo realignment modes in a single skill.
3. The realignment mode recommends how to realign an existing repo with the latest bootstrap baseline.
4. Never overwrite files in existing repos without explicit confirmation; realignment is always interactive.
5. Cover: commit/issue/PR conventions, PNPM, Claude Code + Codex plugin manifests, `AGENTS.md` + `CLAUDE.md`, `README.md`, `docs/`.
6. Self-host: this repo must adopt the baseline it emits.
7. Distinguish public vs. private README shape.
8. License is out of scope — do not emit a `LICENSE` file or any license-selection prompt.
9. Monorepo setup is out of scope — do not emit `pnpm-workspace.yaml`.
10. PR template lives at `.github/pull_request_template.md` so GitHub auto-discovers it.
11. Scaffold the baseline into this repo as the first execution step, before authoring the skill itself.
12. Emit `.claude/settings.json`, `.nvmrc`, `.gitattributes`, `.editorconfig`, and `.markdownlint.jsonc` as part of the baseline.
13. Emit `.github/CODEOWNERS` (with a prompted default owner) for all repos.
14. Emit `SECURITY.md` for public repos only.
15. Wire `markdownlint-cli2` into PNPM devDeps, expose a `pnpm lint:md` script, and block commits with markdown violations via a husky `pre-commit` hook.
16. Enable `superteam@patinaproject` and `superpowers@claude-plugins-official` directly in the emitted `.claude/settings.json` under `enabledPlugins`. Do not print or document a marketplace-add command — enablement is declarative.
17. Do not emit `.github/workflows/` files or a Dependabot config.
18. Derive `<author-name>`, `<author-email>`, and the `SECURITY.md` `<security-contact>` default from the user's local `git config user.name` / `git config user.email`. Halt with a blocker if those are unset.
19. Provide an `<is-agent-plugin>` prompt (default no). When yes, emit plugin surfaces for Claude Code, Codex, Opencode, Copilot, Cursor, and Windsurf, plus `skills/.gitkeep`. Cover Aider, Zed, and Cline through the baseline `AGENTS.md` rather than dedicated rule files.
20. Realignment mode detects whether the target is an AI agent plugin (by presence of any agent-plugin manifest). When detected, realignment additionally recommends adding any currently-supported platform surface the plugin is missing, so existing plugins can be brought up to the current supported-platform set on every `/bootstrap` rerun.
21. Wire `release-please` in agent-plugin mode for conventional-commits-driven releases. Emit `.github/workflows/release.yml`, `release-please-config.json`, `.release-please-manifest.json`. `CHANGELOG.md` and GitHub Release notes are generated from commits.
22. Emit `.github/workflows/lint-pr.yml` in the core baseline. Enforce ASCII-only PR titles, conventional commits with no scope, `#<issue>` subject, breaking-change marker consistency, and closing-keyword presence.
23. Make `package.json` the canonical version source. Emit `scripts/sync-plugin-versions.mjs` and `scripts/check-plugin-versions.mjs`. Husky `pre-commit` runs `pnpm check:versions` to block drift between `package.json`, `.claude-plugin/plugin.json`, and `.codex-plugin/plugin.json`.
24. Emit `CHANGELOG.md` (release-please-owned) and `RELEASING.md` (documents the flow plus the `PATINA_SKILLS_DISPATCH_TOKEN` prerequisite).
25. Emit an auto-dispatch job in agent-plugin `release.yml` that fires `bump-plugin-tags.yml` on `patinaproject/skills` after a successful release, gated on `github.repository_owner == 'patinaproject'`. No repo variable, no prompt; forks skip automatically.
26. Revise prior requirement #17 — `.github/workflows/` is now part of the baseline: `lint-pr.yml` in core, `release.yml` in agent-plugin mode. Dependabot remains out of scope.

## Concerns

- **Template-drift risk**: once `superteam` changes its own baseline, this repo's templates can drift. Mitigation noted as a follow-up: a sync check between `superteam`'s reference files and this repo's `templates/`. Not in scope for issue #1.
