# Repository Guidelines

## Project Structure & Module Organization

This repository is a reference implementation of the `bootstrap` skill it ships. It is organized around a single installable skill, root-level plugin metadata, and supporting documentation.

- `skills/`: installable skill directories. Each skill lives in its own folder, for example `skills/bootstrap/`.
- `.claude-plugin/`: Claude Code plugin manifest for the repository root.
- `.codex-plugin/`: Codex plugin manifest for the repository root.
- `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`: additional AI editor surfaces the `bootstrap` skill emits for agent plugins.
- `.claude/settings.json`: project-level Claude Code configuration, including `enabledPlugins`.
- `docs/`: contributor-facing docs plus planning artifacts such as `docs/file-structure.md` and `docs/superpowers/plans/`.
- Root config: `package.json`, `commitlint.config.js`, `.husky/`, `.markdownlint.jsonc` define local tooling, commit enforcement, and markdown linting.

Keep each skill self-contained. Prefer adjacent support files like `audit-checklist.md` or `pr-body-template.md` over hidden tool-specific wrappers unless a runtime requires them.

For Superpowers-generated design and planning artifacts, use the issue number and issue title as the topic slug. Name files as:

- `docs/superpowers/specs/YYYY-MM-DD-<issue-number>-<issue-title>-design.md`
- `docs/superpowers/plans/YYYY-MM-DD-<issue-number>-<issue-title>-plan.md`

Use human-readable H1 titles inside those files:

- Design docs: `# Design: <exact issue title> [#<issue>](<issue-url>)`
- Plan docs: `# Plan: <exact issue title> [#<issue>](<issue-url>)`

Format acceptance criteria IDs as `AC-<issue-number>-<integer>`, for example `AC-1-1`.

## Build, Test, and Development Commands

- `pnpm install`: install local tooling and initialize Husky hooks.
- `pnpm exec commitlint --edit <path>`: validate a commit message file against repo rules.
- `pnpm lint:md`: lint all tracked Markdown files with `markdownlint-cli2`.
- `.husky/commit-msg <path>`: run commit-message validation through the active Git hook.
- `.husky/pre-commit`: run `lint-staged`, which invokes `markdownlint-cli2` on staged `*.md`.
- `find skills -maxdepth 2 -type f | sort`: quick structure check for imported skills.

There is no application build pipeline. Changes are Markdown, repo-tooling, and skill-template focused.

## Coding Style & Naming Conventions

Use Markdown for skill and docs content. Keep sections short, imperative, and repository-specific.

- Skill directories: lowercase, concise names such as `skills/bootstrap/`
- Root plugin metadata directories: `.claude-plugin/`, `.codex-plugin/`, `.cursor/`
- Main skill file: `SKILL.md`
- Support files: descriptive kebab-case or clear template names
- Prefer ASCII unless an existing file already relies on Unicode

Markdown must pass `markdownlint-cli2` using `.markdownlint.jsonc` rules. The husky `pre-commit` hook enforces this on staged files.

## Testing Guidelines

No formal test suite exists yet. Validate changes with targeted file checks and command output.

- Confirm paths with `find` or `rg`
- Check rewritten references with `rg '<pattern>'`
- Review rendered content with `sed -n '1,200p' <file>`
- Verify root install metadata with `sed -n '1,200p' .claude-plugin/plugin.json` and the equivalent Codex manifest
- For changes to `skills/**/*.md` and workflow-contract guidance, do not claim production readiness from confidence language alone. Back readiness claims with documented verification, or report the missing evidence as a blocker.

If you add executable tooling later, document the exact verification command in `docs/`.

## Issue and PR labels

Use `gh label list` to see the repository's canonical label set. Each label's `description` documents when to apply it. Rely on those descriptions when selecting labels for issues and PRs — do not invent new labels without updating the repository's label set first.

Verify every label has a non-empty description:

```bash
gh label list --json name,description --jq '.[] | select(.description == "")'
```

The `autorelease: pending` and `autorelease: tagged` labels are reserved for Release Please automation. Release Please applies `autorelease: pending` to the open release PR and `autorelease: tagged` after the release tag is cut. Never apply or remove these labels manually; PR-title lint is intentionally skipped while `autorelease: pending` is present so release PRs can keep their `chore: release <version>` title.

## Working with `.github/` templates

This repo ships canonical templates for issues and pull requests. Agents must use them — do not invent parallel structure.

- Pull requests: `.github/pull_request_template.md`. Read it before running `gh pr create`. The PR body must use the template's section headings (`Summary`, `Linked issue`, `Acceptance criteria`, `Validation`, `Docs updated`) in the order the template defines, even when the body is passed inline via `--body`.
- Issues: `.github/ISSUE_TEMPLATE/bug_report.md` and `.github/ISSUE_TEMPLATE/feature_request.md`. Pick the one that matches the report and reproduce its sections in order.

Recommended `gh` patterns:

- PRs: `gh pr create --body-file <path-to-rendered-body>` is the safest path. The rendered body must already follow the template. If you pass `--body` inline, copy every template section name and order verbatim before filling them in.
- Issues: `gh issue create --template bug_report.md` or `--template feature_request.md` lets `gh` start from the canonical file. If you pass `--body` inline, mirror the template's headings the same way.

Do not invent alternative section names (e.g. `Out of scope`, `Verification`, `Notes`) when the template uses different ones — extend an existing section instead, or open a follow-up to update the template itself. The PR-body acceptance-criteria rules under [Commit & Pull Request Guidelines](#commit--pull-request-guidelines) are a refinement of the template's `Acceptance criteria` section, not a replacement for it.

## GitHub Actions pinning

Pin every action reference to a full 40-character commit SHA, not a tag. Tags are mutable; SHAs are not. Above each `uses:` line, leave a comment naming the action and version the SHA corresponds to, so updates remain reviewable.

```yaml
# actions/checkout@v4.3.1
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
```

`actionlint` runs in CI on `.github/workflows/**` changes and enforces this convention as part of its other checks.

Also enable **Settings → Actions → General → Require actions to be pinned to a full-length commit SHA** (at the repo or org level). GitHub then refuses to run any workflow that `uses:` an action by tag or branch, giving a hard gate on top of the CI check.

## Commit & Pull Request Guidelines

Commits are enforced with Husky + commitlint. Use conventional commits with no scope and a required GitHub issue tag:

`type: #123 short description`

Examples:

- `docs: #12 add bootstrap skill guide`
- `chore: #34 bootstrap commit hooks`

Scopes like `feat(repo): ...` are rejected. Keep the subject within 72 characters.

Pull requests should include a short summary, linked issue, validation notes, and any updated docs when structure or workflow changes.

For squash-and-merge workflows, PR titles must exactly match the commitlint and commitizen commit format:

`type: #123 short description`

Use the final intended squash commit title as the PR title.

GitHub issue titles are different: write them as plain-language summaries of the problem or request. Do not use conventional-commit prefixes like `docs:` or `feat:` in issue titles.

When an issue defines acceptance criteria, include an `Acceptance Criteria` section in the PR description.

- Use one `### AC-<issue>-<n>` heading per relevant AC, with the heading containing only the AC ID.
- Put a short outcome summary on the line below the heading.
- Put verification steps directly under the AC they validate.
- Use checkboxes only for testing or verification steps.
- If an AC is deferred or out of scope for the repo, say so in the summary text and do not add fake verification checkboxes.
