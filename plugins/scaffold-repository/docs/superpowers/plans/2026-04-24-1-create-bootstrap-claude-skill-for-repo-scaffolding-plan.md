# Plan: Create `bootstrap` Claude skill for repo scaffolding [#1](https://github.com/patinaproject/bootstrap/issues/1)

Approved design: [docs/superpowers/specs/2026-04-24-1-create-bootstrap-claude-skill-for-repo-scaffolding-design.md](../specs/2026-04-24-1-create-bootstrap-claude-skill-for-repo-scaffolding-design.md) (commit `f3f53c8`).

## Strategy

Execute in three workstreams, in order:

- **W1 – Self-host baseline**: scaffold this repo to the core baseline (plus agent-plugin add-ons, since this repo *is* an agent plugin). Mirrors `patinaproject/superteam`. Must complete before W2 so the skill has a working reference to template from.
- **W2 – Author the skill**: create `skills/bootstrap/` (SKILL.md, templates/, supporting files). The skill's template library is sourced from the files W1 emits – keep them in lockstep.
- **W3 – Verification**: self-audit this repo via realignment mode (should report zero gaps), plus a non-compliant fixture repo to confirm realignment detects missing items.

Within each workstream, tasks are issue-scoped (`AC-1-<n>`) where applicable.

## W1 – Self-host baseline

### T1.1 – Core repo tooling

Files to emit into this repo root:

- `.gitignore` – `node_modules/` (add `pnpm-debug.log*`, `.DS_Store`)
- `.gitattributes` – `* text=auto eol=lf`
- `.editorconfig` – 2-space indent, LF, utf-8, trim trailing ws, final newline
- `.nvmrc` – Node 24 (current LTS)
- `package.json`:
  - `"packageManager": "pnpm@10.33.2"`, `"private": true`, `"version": "0.1.0"`
  - `"engines": { "node": ">=24", "pnpm": ">=10" }`
  - `author` derived from `git config user.name <git-email>`
  - scripts: `prepare: "husky"`, `commitlint: "commitlint"`, `lint:md: "markdownlint-cli2"`
  - devDeps: `@commitlint/cli@^19`, `@commitlint/config-conventional@^19`, `husky@^9`, `markdownlint-cli2@^0.13`, `lint-staged@^15`
  - `lint-staged`: `"*.md": "markdownlint-cli2"`
- `commitlint.config.js` – exact copy of `superteam`'s version (conventional + `ticket-required` rule)
- `.husky/commit-msg` – `pnpm exec commitlint --edit "$1"`
- `.husky/pre-commit` – `pnpm exec lint-staged`
- `.markdownlint.jsonc` – reasonable defaults (line-length off, MD013 off, MD033 off for html in docs)
- `.markdownlintignore` – `node_modules/`, `pnpm-lock.yaml`, `dist/`, `build/`

Verification (T1.1):

- `pnpm install` succeeds, writes `pnpm-lock.yaml`, initializes `.husky/_/`.
- `pnpm exec commitlint --help` exits 0.
- `pnpm lint:md` exits 0 against current repo content.
- `echo "feat: bad" | pnpm exec commitlint` exits non-zero; `echo "feat: #1 ok" | pnpm exec commitlint` exits 0.

### T1.2 – GitHub metadata

- `.github/pull_request_template.md` – adopt `superteam`'s verbatim (fixed `AC-<issue>-<n>` heading style).
- `.github/ISSUE_TEMPLATE/bug_report.md` – minimal: reproduction, expected, actual, environment.
- `.github/ISSUE_TEMPLATE/feature_request.md` – minimal: problem, proposal, alternatives.
- `.github/CODEOWNERS` – default owner `@<owner>` prompted; for this repo: `* @tlmader` (Planner: verify correct handle).

Verification (T1.2): `find .github -type f | sort` matches expected list; files render cleanly in GitHub's UI (manual, post-push).

### T1.3 – Agent + repo docs

- `AGENTS.md` – adapt `superteam`'s verbatim, replacing superteam-specific guidance sections with bootstrap-specific ones (skill lives at `skills/bootstrap/`, the skill's own conventions).
- `CLAUDE.md` – `@AGENTS.md` + Claude-only notes (subagents live at `.claude/agents/`, hooks at `.claude/settings.json`).
- `CONTRIBUTING.md` – short: how to install, how to commit, how to open a PR, pointer to `AGENTS.md`.
- `SECURITY.md` – public repo (this repo is public), templated `<security-contact>` = `ted@patinaproject.com` (derived from `git config user.email`).
- `README.md` – rewrite to cover: what bootstrap does, install commands, `/bootstrap:bootstrap` invocation, new-repo vs. realignment flow, list of supported AI platforms in agent-plugin mode.
- `docs/file-structure.md` – adapt `superteam`'s with bootstrap-specific content.

Verification (T1.3): `ls AGENTS.md CLAUDE.md CONTRIBUTING.md SECURITY.md README.md docs/file-structure.md` succeeds; `pnpm lint:md` exits 0.

### T1.4 – Plugin manifests + `.claude/settings.json`

- `.claude-plugin/plugin.json` – based on `superteam`'s, but `name: bootstrap`, `description: ...`, `skills: ./skills`.
- `.codex-plugin/plugin.json` – based on `superteam`'s, with Codex interface block for bootstrap.
- `.claude/settings.json`:

  ```jsonc
  {
    "enabledPlugins": {
      "superteam@patinaproject-skills": true,
      "superpowers@claude-plugins-official": true
    }
  }
  ```

  Planner verification task: confirm `enabledPlugins` is the current Claude Code field name. If the schema has changed, fall back to documenting manual install in `README.md` and note the mismatch in the Executor's done report.
- Additional agent-plugin surfaces (since this repo is itself an agent plugin):
  - `.opencode/` – Planner: check `sst/opencode` docs for current plugin-manifest layout; use minimal correct form.
  - `.github/copilot-instructions.md` – `@AGENTS.md` style one-liner + short purpose description.
  - `.cursor/rules/<repo>.mdc` – short frontmatter + pointer to `AGENTS.md`.
  - `.windsurfrules` – short pointer to `AGENTS.md` with bootstrap specifics.
- `skills/.gitkeep` (placeholder; W2 populates `skills/bootstrap/`).

Verification (T1.4): `cat .claude-plugin/plugin.json | jq .` and `.codex-plugin/plugin.json` parse as valid JSON; `.claude/settings.json` parses as valid JSONC.

## W2 – Author the skill

### T2.1 – Skill entrypoint

Create `skills/bootstrap/SKILL.md` with:

- Frontmatter: `name: bootstrap`, one-line `description:` matching the skill-trigger guidance.
- Sections: purpose, modes (new-repo vs. realignment), placeholders, emitted tree, supported AI platforms, interactive behavior, verification self-test.
- Explicit mention that realignment always prompts before overwriting; no `--patch`/flag escape hatch.

### T2.2 – Templates

Create `skills/bootstrap/templates/` mirroring the core baseline and agent-plugin add-on trees. Each file uses `{{placeholder}}` syntax for:

- `{{owner}}`, `{{repo}}`, `{{repo-description}}`, `{{visibility}}`
- `{{author-name}}`, `{{author-email}}`
- `{{codeowner}}`, `{{security-contact}}`
- `{{primary-skill-name}}` (optional)
- `{{is-agent-plugin}}`, `{{use-superteam}}`

Templates to write (one-to-one with the files emitted in W1):

- `templates/core/` – `.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`, `.markdownlint.jsonc`, `.markdownlintignore`, `package.json.tmpl`, `commitlint.config.js`, `.husky/commit-msg`, `.husky/pre-commit`, `AGENTS.md.tmpl`, `CLAUDE.md.tmpl`, `CONTRIBUTING.md.tmpl`, `README.md.tmpl`, `SECURITY.md.tmpl` (public only), `docs/file-structure.md.tmpl`, `.github/*`, `.claude/settings.json.tmpl`.
- `templates/agent-plugin/` – `.claude-plugin/plugin.json.tmpl`, `.codex-plugin/plugin.json.tmpl`, `.opencode/...`, `.github/copilot-instructions.md.tmpl`, `.cursor/rules/<repo>.mdc.tmpl`, `.windsurfrules.tmpl`, `skills/.gitkeep`.
- `templates/opt-in/superpowers/` – `docs/superpowers/specs/.gitkeep`, `docs/superpowers/plans/.gitkeep`.
- `templates/opt-in/continue/` – `.continue/config.json.tmpl`.

### T2.3 – Audit checklist

Create `skills/bootstrap/audit-checklist.md` – canonical list of every file the skill checks for in realignment mode, grouped by area, with the classification rules (`missing`, `stale`, `divergent`) and which fields to diff for each. Used by the skill at runtime and as the acceptance-criteria spec for AC-1-5/1-6/1-7/1-14/1-15.

### T2.4 – Supporting files

- `skills/bootstrap/agent-spawn-template.md` – stub following superteam's shape (may be minimal; bootstrap is primarily single-agent).
- `skills/bootstrap/pr-body-template.md` – stub; bootstrap itself uses `superteam`'s PR template when run through superteam.

## W3 – Verification

### T3.1 – Self-audit

Manually walk `audit-checklist.md` against the current repo state. Expected result: zero gaps (satisfies AC-1-7, AC-1-8, AC-1-15).

### T3.2 – Fixture sanity check

Describe in `audit-checklist.md` a "non-compliant fixture": what a minimal, non-compliant repo would look like and what gaps the skill would report. No actual fixture repo or test harness – the skill itself is markdown-driven – but the checklist documents the expected classification output so a reviewer can trace AC-1-5/AC-1-6/AC-1-14 by hand.

### T3.3 – Tooling smoke tests

Run once on this repo after W1+W2:

1. `pnpm install`
2. `pnpm exec commitlint --help`
3. `pnpm lint:md`
4. `echo "bad subject" | pnpm exec commitlint` → non-zero
5. `echo "feat: #1 bootstrap self-host" | pnpm exec commitlint` → zero
6. `git add <a-markdown-file-with-an-intentional-violation>; git commit` → blocked by pre-commit
7. Remove the violation, retry → commit succeeds

Record all results in the Executor done report.

## Blockers

**None** at plan time. Open Planner-research items (not blockers – fallbacks documented):

- Exact `enabledPlugins` schema in current Claude Code (fallback: document in README only).
- Exact Opencode plugin layout (fallback: emit `AGENTS.md` + a minimal `.opencode/README.md` noting Opencode reads `AGENTS.md`).
- Exact Cursor `.cursor/rules/*.mdc` frontmatter and Windsurf `.windsurfrules` format (fallback: minimal file pointing at `AGENTS.md`).

## Workstream summary

| Workstream | Scope | Depends on |
|---|---|---|
| W1 – Self-host baseline | All repo-root and `.github/` + `.claude/` files; `pnpm install` to generate lockfile | – |
| W2 – Author skill | `skills/bootstrap/` with SKILL.md, templates/, audit-checklist.md | W1 |
| W3 – Verification | Self-audit walk, tooling smoke tests | W1, W2 |
| W4 – Release flow + PR hygiene | release-please, lint-pr workflow, version enforcement scripts, marketplace auto-dispatch, CHANGELOG + RELEASING docs, template mirrors | W1, W2 |

## Task IDs

- **T1.1** Core repo tooling
- **T1.2** GitHub metadata
- **T1.3** Agent + repo docs
- **T1.4** Plugin manifests + `.claude/settings.json`
- **T2.1** Skill entrypoint SKILL.md
- **T2.2** Templates tree
- **T2.3** Audit checklist
- **T2.4** Supporting skill files
- **T3.1** Self-audit walk
- **T3.2** Fixture sanity documentation
- **T3.3** Tooling smoke tests
- **T4.1** Version enforcement – `scripts/sync-plugin-versions.mjs`, `scripts/check-plugin-versions.mjs`, husky `pre-commit` hook, `package.json` canonical `version` field
- **T4.2** `.github/workflows/lint-pr.yml` – ASCII-only title, conventional commits with no scope, `#<issue>` subject pattern, breaking-change marker consistency, closing-keyword check (patinaproject/patinaproject adapted)
- **T4.3** release-please wiring – `.github/workflows/release.yml`, `release-please-config.json`, `.release-please-manifest.json`. Both plugin manifests listed under `extra-files` with `$.version` jsonpath for lockstep bumping
- **T4.4** `CHANGELOG.md` (release-please-owned stub) and `RELEASING.md` (flow documentation)
- **T4.5** Marketplace auto-dispatch – `notify-patinaproject-skills` job in `release.yml` gated on `github.repository_owner == 'patinaproject'`, dispatching `bump-plugin-tags.yml` via `peter-evans/workflow-dispatch@v3` using `PATINA_SKILLS_DISPATCH_TOKEN`
- **T4.6** Template mirror – `lint-pr.yml`, scripts, `CHANGELOG.md`, `RELEASING.md` → `templates/core/`; `release.yml`, `release-please-config.json`, `.release-please-manifest.json` → `templates/agent-plugin/`. `package.json.tmpl` updated with `version` field and new scripts
- **T4.7** Audit checklist + SKILL.md updates reflecting W4 files
- **T4.8** Follow-up issue filed – [patinaproject/skills#12](https://github.com/patinaproject/skills/issues/12) covers marketplace tag tracking for Claude Code + Codex, opencode via npm, org-level dispatch receiver, and marketplace's own release cycle via bootstrap
