# Repository Guidelines

## Project Structure & Module Organization

This repository follows the Patina Project baseline. It is organized around root-level plugin metadata (when applicable), a self-contained skills directory, and supporting documentation.

- `skills/`: installable skill directories. Each skill lives in its own folder.
- `.claude-plugin/`, `.codex-plugin/`, `.cursor/`, `.windsurfrules`, `.github/copilot-instructions.md`: AI editor plugin/config surfaces (present only when this repo is an AI agent plugin).
- `.claude/settings.json`: project-level Claude Code configuration, including `enabledPlugins`.
- `docs/`: contributor-facing docs and planning artifacts.
- Root config: `package.json`, `commitlint.config.js`, `.husky/`, `.markdownlint.jsonc` define local tooling, commit enforcement, and markdown linting.

Keep each skill self-contained. Prefer adjacent support files over hidden tool-specific wrappers unless a runtime requires them.

For Superpowers-generated design and planning artifacts, use the issue number and issue title as the topic slug:

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

## Coding Style & Naming Conventions

Use Markdown for skill and docs content. Keep sections short, imperative, and repository-specific.

- Skill directories: lowercase, concise names under `skills/`
- Root plugin metadata directories: `.claude-plugin/`, `.codex-plugin/`, `.cursor/`
- Main skill file: `SKILL.md`
- Support files: descriptive kebab-case or clear template names
- Prefer ASCII unless an existing file already relies on Unicode

Markdown must pass `markdownlint-cli2` using `.markdownlint.jsonc` rules. The husky `pre-commit` hook enforces this on staged files.

## Testing Guidelines

Validate changes with targeted file checks and command output.

- Confirm paths with `find` or `rg`
- Check rewritten references with `rg '<pattern>'`
- Review rendered content with `sed -n '1,200p' <file>`

For changes to `skills/**/*.md` and workflow-contract guidance, do not claim production readiness from confidence language alone. Readiness claims for those changes must be backed by the required pressure tests, review loops, and role-specific verification that actually ran. If that evidence is incomplete, report the missing evidence or blocker explicitly instead of asserting readiness.

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

- Pull requests: `.github/pull_request_template.md`. Read it before running `gh pr create`. The PR body must use the template's section headings in the order the template defines, even when the body is passed inline via `--body`.
- Issues: `.github/ISSUE_TEMPLATE/bug_report.md` and `.github/ISSUE_TEMPLATE/feature_request.md`. Pick the one that matches the report and reproduce its sections in order.

Recommended `gh` patterns:

- PRs: `gh pr create --body-file <path-to-rendered-body>` is the safest path. The rendered body must already follow the template. If you pass `--body` inline, copy every template section name and order verbatim before filling them in.
- Issues: `gh issue create --template bug_report.md` or `--template feature_request.md` lets `gh` start from the canonical file. If you pass `--body` inline, mirror the template's headings the same way.

Do not invent alternative section names when the template uses different ones — extend an existing section instead, or open a follow-up to update the template itself. The PR-body acceptance-criteria rules under [Commit & Pull Request Guidelines](#commit--pull-request-guidelines) are a refinement of the template's `Acceptance criteria` section, not a replacement for it.

## GitHub Actions pinning

Pin every action reference to a full 40-character commit SHA, not a tag. Tags are mutable; SHAs are not. Above each `uses:` line, leave a comment naming the action and version the SHA corresponds to, so updates remain reviewable.

```yaml
# actions/checkout@v4.3.1
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5
```

`actionlint` runs in CI on `.github/workflows/**` changes and enforces workflow hygiene as part of its other checks.

Also enable **Settings → Actions → General → Require actions to be pinned to a full-length commit SHA** (at the repo or org level). GitHub then refuses to run any workflow that `uses:` an action by tag or branch, giving a hard gate on top of the CI check.

## Commit & Pull Request Guidelines

Commits are enforced with Husky + commitlint. Use conventional commits with no scope and a required GitHub issue tag:

`type: #123 short description`

Scopes like `feat(repo): ...` are rejected. Keep the subject within 72 characters.

### Commit type selection

Choose the commit type by product impact, not by file extension.

| Change | Type |
|--------|------|
| Adds or changes shipped behavior, including behavior expressed in Markdown skill files, workflow gates, prompt contracts, plugin metadata, marketplace behavior, generated agent instructions, or other user-visible configuration | `feat:` |
| Corrects broken shipped behavior in those same product surfaces | `fix:` |
| Explains the product without changing shipped behavior or release semantics | `docs:` |
| Performs maintenance that does not alter user-facing behavior | `chore:` |

Edits to `skills/**/SKILL.md` and adjacent skill workflow contracts are product/runtime changes by default, not documentation edits. Use `docs:` for those files only when the change is clearly explanatory-only and does not alter installed skill behavior.

Changes that should produce a release must not use non-bumping types such as `docs:` or `chore:`. Use the release-triggering type that matches the product impact.

Pull requests should include a short summary, linked issue, validation notes, and any updated docs when structure or workflow changes.

For squash-and-merge workflows, PR titles must exactly match the commit format. Use the final intended squash commit title as the PR title.

GitHub issue titles are different: write them as plain-language summaries of the problem or request. Do not use conventional-commit prefixes like `docs:` or `feat:` in issue titles.

When an issue defines acceptance criteria, include an `Acceptance Criteria` section in the PR description.

- Use one `### AC-<issue>-<n>` heading per relevant AC, with the heading containing only the AC ID.
- Put a short outcome summary on the line below the heading.
- Put verification steps directly under the AC they validate.
- Use checkboxes only for testing or verification steps.
- If an AC is deferred or out of scope for the repo, say so in the summary text and do not add fake verification checkboxes.
