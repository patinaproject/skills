# Design: Make the README awesome [#4](https://github.com/patinaproject/github-flows/issues/4)

> Recommended skill: `superpowers:brainstorming`. The Brainstormer role for this
> issue invokes that skill to explore intent and constraints before writing this
> design. If `superpowers:brainstorming` is unavailable, the role falls back to
> the rules captured in `AGENTS.md` and the issue's stated acceptance criteria.

## Problem

`README.md` is the front door for `patinaproject/github-flows`, but today it
reads like a scaffolded placeholder rather than a project pitch. Specifically:

- The `## What this plugin does` and `## Usage` sections are empty — only
  HTML comments instructing the author to fill them in.
- The four shipped skills (`new-issue`, `edit-issue`, `new-branch`,
  `write-changelog`) are not named or summarized anywhere in the README; a
  reader must browse `skills/` to learn what the plugin actually does.
- The eleven-editor installation matrix dominates the page and pushes value
  content below the fold.
- There are no badges (CI, latest release, license), no demo asset, and no
  concrete sample invocation.

A casual visitor cannot quickly tell what `github-flows` is, why they would
install it, or what they will be able to do once they do. The rewrite should
reorient the page around the visitor's evaluation flow: tagline, proof of
project health, demo, value-prop list of skills, quick start, and only then
deeper install and reference content.

Inspiration: <https://github.com/matiassingers/awesome-readme>.

## Scope

In scope:

- A full rewrite of `README.md` at the repository root.
- New supporting assets that the README references (a hero visual placeholder
  and any badge URLs), to the extent they live alongside the README.

## Non-Goals

- No changes to plugin behavior. No skills are added, removed, renamed, or
  modified.
- No changes to `CONTRIBUTING.md`, `RELEASING.md`, `SECURITY.md`, or the
  emitted editor surfaces (`.cursor/`, `.windsurfrules`,
  `.github/copilot-instructions.md`).
- No changes to the marketplace flow, `package.json`, `release-please-config.json`,
  or workflow files.
- No new editors added to or removed from the install matrix.
- No video production. A single static screenshot, animated GIF, or asciinema
  cast is the upper bound on the hero asset.

## Acceptance Criteria

### AC-4-1

**Given** a visitor opens `README.md`,
**when** they read the first screen,
**then** they see a one-sentence tagline, a hero visual, and a list naming
each shipped skill (`new-issue`, `edit-issue`, `new-branch`,
`write-changelog`) with its slash-command invocation.

### AC-4-2

**Given** a visitor wants to evaluate project health,
**when** they look at the top of the README,
**then** they see a badges row covering CI, latest release, and license at a
minimum.

### AC-4-3

**Given** a visitor wants to try the plugin,
**when** they follow the quick-start section,
**then** they can run a real invocation against an example issue without
filling in any placeholder text (no `<!-- placeholder -->` comments and no
`TODO`).

### AC-4-4

**Given** a visitor uses an editor other than Claude Code,
**when** they look for install steps,
**then** the eleven-editor matrix is reachable but does not occupy the
landing view — it is collapsed under a `<details>` block (or moved to a
dedicated `docs/install.md`) and linked from the README.

### AC-4-5

**Given** the rewrite is committed,
**when** CI runs,
**then** `pnpm lint:md` passes with no new markdownlint violations against
`.markdownlint.jsonc`.

## Information Architecture

The new `README.md` is ordered for an evaluating visitor: identity → trust →
demo → value → trial → depth. Sections in order:

1. **Title + tagline.** `# github-flows` followed by a single-sentence
   tagline that replaces "Let agents use GitHub more ergonomically" with
   something that names the audience and the outcome (for example,
   "Slash-command skills that let coding agents file issues, start branches,
   edit issues, and write changelogs in any GitHub repo.").
2. **Badges row.** Inline badge images, one line, in this order: CI status
   (GitHub Actions workflow badge), latest release (shields.io
   `github/v/release`), license (shields.io `github/license`). Optional
   future additions (npm, downloads) are out of scope for this rewrite.
3. **Hero visual.** A single image immediately under the badges. The first
   pass ships a static screenshot of one skill (recommended:
   `github-flows:new-issue`) running in Claude Code. If no asset is ready at
   implementation time, ship a placeholder note in an HTML comment that
   names the intended asset path (for example,
   `<!-- TODO: replace with docs/assets/hero.png -->`) and an
   `alt`-only image reference is omitted; the rewrite must not ship visible
   `TODO` text. Track the upgrade to a GIF or asciinema cast in a
   follow-up issue.
4. **What you get.** A bulleted list naming each shipped skill, its
   slash-command invocation, and a one-line outcome. See "Skill summaries"
   below for the canonical copy.
5. **Quick start.** A 60-second flow that assumes Claude Code, the most
   common entry point. Three numbered steps: register the Patina Project
   marketplace, install the plugin, run a real invocation against an
   example issue (for example,
   `/github-flows:new-issue` against this repo's issue tracker). No
   placeholder repos, no `<your-repo>` tokens that the user must edit.
6. **Other editors.** The eleven-editor install matrix moves into a
   collapsible `<details><summary>Install in another editor</summary> …
   </details>` block. Content inside is the existing matrix, lightly
   touched only as needed to keep markdownlint clean. (Alternative: extract
   to `docs/install.md` and link. The `<details>` block is the preferred
   path because it keeps everything discoverable on one page.)
7. **Related / Links.** A short closing section consolidating links to the
   Patina Project marketplace (`patinaproject/skills`), other Patina Project plugins, and
   the existing `CONTRIBUTING.md`, `SECURITY.md`, and `RELEASING.md` files.
8. **License.** A one-line pointer to `LICENSE` (MIT).

### Skill summaries

The "What you get" list uses these one-liners (copy is the implementer's call,
but the slash-command invocations and outcomes are fixed):

- **`/github-flows:new-issue`** — File a new GitHub issue with smart label
  selection, duplicate detection, and a public-repo leak guard.
- **`/github-flows:edit-issue`** — Edit an existing issue's title, body,
  labels, assignees, milestone, state, close reason, or relationships,
  preferring GraphQL where REST falls short.
- **`/github-flows:new-branch`** — Start work on an issue: branch from the
  default branch as `<issue-number>-<kebab-title>`, rebase, and install
  dependencies via the highest-priority lockfile.
- **`/github-flows:write-changelog`** — Render a user-facing changelog from a
  GitHub milestone, sourced from closed issues and their merging PRs.

### Hero asset decision

The repository ships no hero asset today. The implementation should:

- Prefer a static PNG screenshot at `docs/assets/hero.png` for the first
  pass. Static images are cheapest to produce and lint-clean.
- If no asset is ready at implementation time, omit the `<img>` tag entirely
  rather than ship a broken reference, and add an HTML comment marking the
  intended insertion point. Open a follow-up issue to ship the asset.
- A GIF or asciinema cast is an acceptable upgrade in a later PR but is not
  required for this rewrite.

### Badges decision

Use shields.io-hosted badges so they render on GitHub without committing
binary assets:

- CI: GitHub Actions workflow badge for the lint workflow that runs
  `pnpm lint:md` (the existing CI surface). If multiple workflows exist,
  prefer the one that most closely represents "is the repo healthy".
- Release: `https://img.shields.io/github/v/release/patinaproject/github-flows`.
- License: `https://img.shields.io/github/license/patinaproject/github-flows`.

Each badge links to a useful destination (Actions tab, Releases page,
`LICENSE` file).

## Markdownlint Compliance Rules

The rewrite must pass `pnpm lint:md`, which runs `markdownlint-cli2` against
`.markdownlint.jsonc`. Concretely:

- Use ATX headings (`#`, `##`, …). Do not skip heading levels.
- Surround headings, lists, and fenced code blocks with blank lines.
- Specify a language on every fenced code block (`bash`, `text`, `yaml`).
- Keep lines within the configured line-length budget; wrap prose to a
  consistent width and rely on the `.markdownlint.jsonc` exemptions for
  tables, headings, and code fences.
- Use a single H1 (`# github-flows`).
- Use reference-style links sparingly; prefer inline links for the badges
  row to keep the source readable.
- Inside the `<details>` block, leave a blank line after `<summary>` and
  before the closing `</details>` so markdownlint parses the embedded
  Markdown correctly.
- No bare URLs — wrap every URL in `<…>` or a `[text](url)` link.
- No trailing whitespace; end the file with a single newline.

## Out of Scope

- Changes to `CONTRIBUTING.md`, `RELEASING.md`, `SECURITY.md`, or the
  `.cursor` / `.windsurfrules` / `.github/copilot-instructions.md` editor
  surfaces.
- Adding or removing supported editors.
- Producing video assets beyond a single hero screenshot, GIF, or
  asciinema cast.
- Plugin behavior changes of any kind.
