# Design: Bootstrap and ship /edit-issue, /new-issue, /new-branch, /changelog skills [#1](https://github.com/patinaproject/github-flows/issues/1)

## Intent

Ship the four GitHub-ergonomics skills the `github-flows` plugin exists to deliver, on top of the Patina Project baseline already scaffolded in this branch. Each skill is a thin, agent-callable Markdown contract (no executable code), discoverable via slash-command, and uses `gh` + GraphQL where the REST CLI is too coarse.

This design covers the four skill workflows plus the two supporting docs (`.github/LABELS.md`, `docs/issue-filing-style.md`) and the cross-cutting patterns shared between them. Phase 1 (the bootstrap pass) is already committed at `cf3a49b` and is in-scope for the same PR but not re-designed here.

## Decisions (Gate 1 round 2)

The following decisions resolve open questions raised at first Gate 1 pass:

- **Skill names + invocation surface.** The four skills are `edit-issue`, `new-issue`, `new-branch`, `write-changelog` (renamed from `changelog`). Each is invoked as `/github-flows:<skill>` — Claude Code requires plugin skills to be namespaced, and there is no bare `/skill-name` form for plugin-shipped skills. Reference plugins follow the same convention: `patinaproject/bootstrap` uses `/bootstrap:bootstrap`, `patinaproject/superteam` uses `/superteam:superteam`. Each `SKILL.md` documents only the namespaced form.
- **Changelog typography.** The `/write-changelog` renderer uses an **en dash** (`–`, U+2013) with spaces on either side wherever a dash separator appears — the milestone heading (`## [v0.1.0] – 2026-04-26`) and the entry separator (`**Title** – description`). It must never emit an em dash (`—`, U+2014) or a double-hyphen (`--`). Markdownlint config (`MD019`/`MD025`) is unaffected; this is a renderer-level rule encoded in `workflow.md`.

## Cross-cutting decisions

These apply to all four skills and live once in shared sections of each `workflow.md`:

### Skill file shape

Each skill is a directory under `skills/<name>/` with:

- `SKILL.md` — frontmatter (`name`, `description`) + a one-line `Follow the instructions in ./workflow.md.` pointer. The frontmatter `description` is the trigger contract — the agent activates the skill when the user phrasing matches.
- `workflow.md` — the procedural contract. Mirrors the patinaproject `/new-issue` reference: numbered steps, `**Precondition:**` declarations, `**If/Otherwise**` branches, exact `gh` / `gh api graphql` commands, `Refusal Conditions` and `Quick Reference` tables at the bottom.

No executable scripts; the agent is the runtime. This keeps the skills portable across Claude Code, Codex, and AGENTS.md-only runtimes.

### Repo resolution

Every workflow resolves the target repo with:

```bash
gh repo view --json nameWithOwner,visibility --jq '{nameWithOwner, visibility}'
```

…and validates `nameWithOwner` matches `^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$`. Non-zero exit or malformed output halts. **Same-repo only:** if the user passes `-R other/repo`, every skill refuses with the same message and points to the underlying `gh` command instead.

### Label and milestone loading

- Labels are loaded at runtime via `gh label list --json name,description`. Descriptions are the source of truth for selection (no hardcoded label names anywhere in the skills). Dependabot-only labels (`javascript`, `github_actions`) are filtered out of any user-facing list.
- Milestones are loaded via `gh api repos/:owner/:repo/milestones --jq '.[] | select(.state=="open")'`. Validation is repeated immediately before any mutation that uses one (handles open→closed races between draft and apply).

### GraphQL probing

Skills that use mutations available only on newer GitHub schemas (`addIssueDependency`, `closeIssue` with `stateReason`, sub-issues) probe the schema once per run and cache:

```bash
gh api graphql -f query='{ __type(name:"Mutation"){ fields{ name } } }' \
  --jq '.data.__type.fields[].name' | grep -qx '<mutationName>'
```

If unavailable, the skill falls back to a documented body-prose form and warns the user up front so the limitation surfaces during draft review, not after the fact.

### Public-repo leak guard (used by `/new-issue` and `/changelog --write`)

When `gh repo view --json visibility` reports `PUBLIC`, refuse any draft body that contains:

1. URLs matching `https://github.com/<org>/<private-repo>/...` where `<private-repo>` resolves (via `gh repo view -R`) to `visibility: PRIVATE` or returns 404 to the unauthenticated public.
2. File paths matching the `git remote get-url origin` of any locally-known private repo, when those paths appear inside fenced code blocks or quoted prose.

Detection is best-effort and conservative — ambiguous cases fall through to a human-readable warning that asks the user for a public-safe rewrite, never a silent rewrite.

### Confirmation pattern

Every mutating skill presents a single, explicit summary to the user and waits for `approve` / `revise` before any write. Revisions re-render the summary (no diff trick) up to 3 cycles, then halt.

## Skill-specific designs

### `/edit-issue`

**Intent.** Edit an existing GitHub issue with the right API per field. The user supplies the issue (`#N`, URL, or number) plus a free-form change request; the skill parses it into a typed changeset, validates against the remote, presents one summary, and applies.

**Routing table.**

| Field | API | Notes |
|---|---|---|
| title | `gh issue edit -t` | |
| body | `gh issue edit -b` | |
| labels (add/remove) | `gh issue edit --add-label` / `--remove-label` | Validate existence; filter Dependabot-reserved. |
| assignees | `gh issue edit --add-assignee` / `--remove-assignee` | |
| milestone | `gh issue edit -m` | Re-validate open status immediately before apply. |
| state (close/reopen with reason) | GraphQL `closeIssue` / `reopenIssue` | Pass `stateReason: COMPLETED \| NOT_PLANNED \| DUPLICATE`. Falls back to `gh issue close` / `gh issue reopen` when no reason supplied. |
| sub-issue parent | GraphQL `addSubIssue` / `removeSubIssue` | Probed; no body-prose fallback (no convention exists). |
| blocked-by / blocks | GraphQL `addIssueDependency` / `removeIssueDependency` with `dependencyType: BLOCKED_BY \| BLOCKS` | Probed; falls back to `Blocked by #N` / `Blocks #N` body-prose append. |
| related-to | Body-prose only (`Relates to #N`); no native primitive | GitHub auto-creates a CrossReferencedEvent. |

**Refusals.** Cross-repo (`owner/repo#N` or `-R other/repo`); label or milestone not on remote; ambiguous change request the user has not confirmed.

### `/new-issue`

**Intent.** Author a well-structured GitHub issue from a short user description. Heavily inspired by the patinaproject `/new-issue` workflow, with two new behaviors specific to this plugin: duplicate detection and the public-repo leak guard.

**Body template (5 sections, fixed order).** `## Problem`, `## Proposal`, `## Acceptance Criteria` (Given/When/Then; ≥1 AC), `## Context`, `## Out of Scope`. An optional `## Non-Goals / Implementation Notes` section may appear between Proposal and Acceptance Criteria. No other sections.

**Duplicate check (new vs. patinaproject reference).** After the user provides intent and before drafting:

1. Extract 3–5 key terms from the description (drop stopwords, prefer nouns/verbs).
2. Run `gh issue list --search "<terms> in:title" --state all --json number,title,state,url` plus a second pass `--search "<terms>"` (full-text) merged into the first result set, deduped by issue number.
3. Score candidates by simple title-token overlap; surface any with ≥2 overlapping non-stopword tokens.
4. If candidates exist, present them and offer three options: **(a)** comment a follow-up on the most relevant existing issue with the new context, **(b)** continue and file a new issue anyway, **(c)** abort. Default presentation order: highest score first.

**Public-repo leak guard.** Run before draft presentation (Step 6) and again at pre-creation (Step 7) — body content can change between the two. Same detection as the cross-cutting section.

**Field coverage via GraphQL.** Standard fields go via `gh issue create` (`--title`, `--body`, `--label`, `--milestone`, `--assignee`). Project-v2 assignment uses GraphQL `addProjectV2ItemById` post-create; relationships use the same probe-and-fallback pattern as `/edit-issue`.

**Refusals.** Cross-repo; Dependabot-reserved labels; non-existent labels/milestones; relationship targets that don't resolve; the user explicitly declining to revise a leaked-content draft.

### `/new-branch`

**Intent.** From an issue reference, prepare a clean working branch and ready dependencies — replacing the manual `fetch / checkout -b / rebase / install` dance.

**Branch name format.** Mirror GitHub's "Create branch" UI default: `<issue-number>-<kebab-title>`. Kebab algorithm:

1. Lowercase.
2. Replace any run of non-`[a-z0-9]` characters with a single hyphen.
3. Trim leading/trailing hyphens.
4. Truncate to 60 chars total (issue number + hyphen + title), preferring to cut at a hyphen boundary.

Example: issue 42 "Let agents use GitHub more ergonomically" → `42-let-agents-use-github-more-ergonomically`.

**Steps.**

1. Resolve issue (`gh issue view <N> --json number,title`); refuse if not open unless `--allow-closed` passed.
2. Refuse on dirty tree (`git status --porcelain` non-empty); suggest `git stash`.
3. `git fetch origin <default-branch>` (default branch from `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`, not hardcoded `main`).
4. If branch exists locally: `git checkout <branch> && git rebase origin/<default>`. Else: `git checkout -b <branch> origin/<default>`.
5. Lockfile-driven install (priority: `pnpm-lock.yaml` → `pnpm install`; `yarn.lock` → `yarn install`; `bun.lockb` → `bun install`; `package-lock.json` → `npm install`). No lockfile + no `package.json` → skip silently with a one-line note.
6. Report: branch name, base SHA, install command + exit code.

**Refusals.** Dirty tree; issue not found; cross-repo `-R`; rebase conflict (surface conflict and stop without aborting the rebase, so the user can resolve).

### `/write-changelog`

**Intent.** Render a user-facing changelog block for a milestone, sourced from the merging PRs of its closed issues. Output is plain Markdown to stdout — the user copies, edits, and pastes wherever the release notes live. There is no Featurebase or external publishing path.

**Inspiration.** The `patinaproject/patinaproject` `/changelog-generator` skill — adopted: the **filtering rules** (drop `chore`/`ci`/`refactor`/`test`/`build`/`style`/`docs`; keep `feat`/`fix`/`perf`; `docs` only kept when the issue carries a `documentation` label, mirroring the reference's "internal vs. user-facing docs" carve-out), the **friendly bucket names** (`New` / `Improved` / `Fixed`), the **translation rules** (drop `type:`/`#N` prefixes, sentence case, plain language, no corporate vocabulary), and the **omit-empty-section** output rule. **Diverged:** source is **GitHub milestones + merging PRs**, not raw `git log` over a tag/time range. Rationale: matches this repo's release-please flow (milestones curate what shipped this release; release-please cuts the tag), and gives a clean way for humans to scope the changelog without remembering tag pairs.

**Source of truth.** Milestones. The user supplies a milestone title or number; the skill walks closed issues in that milestone, resolves their merging PRs, and renders one block.

**Steps.**

1. Resolve milestone: accept title or number; fetch via `gh api repos/:owner/:repo/milestones --jq '.[] | select(.title=="<title>" or .number==<n>)'`. Default behavior renders only **closed** milestones (the release is "done"); `--include-open` allows draft renders for in-flight milestones.
2. List milestone issues: `gh issue list --milestone "<title>" --state all --limit 200 --json number,title,labels,state,closedAt`.
3. For each closed issue, find merging PR(s) via the issue timeline:

    ```graphql
    query($o:String!,$r:String!,$n:Int!){
      repository(owner:$o,name:$r){
        issue(number:$n){
          timelineItems(itemTypes:[CLOSED_EVENT], last:5){
            nodes{ ... on ClosedEvent {
              closer { ... on PullRequest { number title body mergeCommit { oid messageHeadline messageBody } } }
            } }
          }
        }
      }
    }
    ```

    Take the most recent `ClosedEvent.closer` that is a `PullRequest`. If none, fall back to the issue's own title + `state_reason`.

4. Filter (adopted from reference):

    | Conventional-commit type on squash-merge subject | Action |
    |---|---|
    | `feat`, `fix`, `perf` | **keep** |
    | `chore`, `ci`, `refactor`, `test`, `build`, `style` | **drop** (internal) |
    | `docs` | **drop** unless issue carries `documentation` label |
    | release-please autorelease (`^chore: release v?\d+\.\d+\.\d+`) | **drop** always |
    | any subject containing only "bump", "upgrade", "update deps", "update dependency" | **drop** (dependency churn) |
    | any subject containing "fix lint", "fix types", "knip", "unused" with no other behavior change | **drop** (lint-only) |

    When uncertain whether a kept commit is user-facing, **err on the side of inclusion** — the human reviewer makes the final call (matches the reference's policy).

5. Categorize (friendly bucket names from the reference):

    | Bucket | When to use |
    |---|---|
    | **New** | A user can do something they could not do before (typically `feat`). |
    | **Improved** | An existing capability works better, looks better, or is faster (typically `perf`, sometimes `feat` for polish). |
    | **Fixed** | A bug that affected users is resolved (typically `fix`). |
    | **Breaking** | The change has `!` after type OR a `BREAKING CHANGE:` footer. Rendered above all other buckets. |

    Use the type as a hint, but read the message: a `fix` that adds capability becomes **New**.

6. **Discover repo-specific style sources** before translating. Probe each of the following paths (case-insensitive on the filename, first match wins per category) and, if present, read it and treat it as authoritative for that category — its rules override the baselines below where they conflict.

    | Category | Probe paths (in order) |
    |---|---|
    | Changelog style | `docs/changelog-style.md`, `docs/CHANGELOG_STYLE.md`, `.github/CHANGELOG_STYLE.md`, `CHANGELOG_STYLE.md` |
    | Brand / writing voice | `docs/brand-voice.md`, `docs/BRAND_VOICE.md`, `.github/BRAND_VOICE.md`, `BRAND_VOICE.md` |

    Record which sources were discovered (paths + commit SHA) in the review-notes footer (Step 9) so the human can audit what voice/style rules were applied. If neither category has a match, fall through to the baseline rules below; that fact is also recorded in the footer.

7. Translate each kept entry to user-facing prose. Apply discovered repo-specific rules first; otherwise apply these baselines (they are the universal-safe subset that won't conflict with most repos):

    - Drop the leading `type:` / `type(scope):` prefix, issue/PR refs, and commit hashes.
    - Sentence case for titles.
    - Plain language a user understands; lead with the user-facing benefit.
    - **Typography:** use **en dash** (`–`, U+2013) with a space on each side as the title-to-description separator, and in the heading date separator. Never emit `—` (em dash) or `--` (double hyphen). This is enforced in the renderer regardless of repo style overrides — typography is a hard constraint, not a voice preference.
    - No corporate vocabulary (no "leverage", "enhance", "seamless", "robust", "functionality").
    - Target 1–2 sentences. One clear sentence beats two padded ones.
    - Name the specific feature, page, library, or area when the commit mentions one — prefer concrete nouns over generic prose.
    - Each entry ends with the canonical issue link in parentheses: `([#N](<issue-url>))`.

8. Render the milestone block:

    ```markdown
    ## [<version>] – <YYYY-MM-DD>

    ### Breaking

    - **Title** – description ([#N](<issue-url>))

    ### New

    - **Title** – description ([#N](<issue-url>))

    ### Improved

    - **Title** – description ([#N](<issue-url>))

    ### Fixed

    - **Title** – description ([#N](<issue-url>))
    ```

    Empty buckets are omitted entirely (no `*None.*` stub). `<version>` defaults to milestone title; `<date>` defaults to milestone `closedAt` truncated to date, falling back to `dueOn`, then today.

9. Default output: stdout, ready for the user to paste. With `--write`: open `CHANGELOG.md`, locate the `## [Unreleased]` heading, insert the rendered block immediately after it (and before the next `## [` heading). Re-validate the resulting file with `markdownlint-cli2 CHANGELOG.md`.

10. After the rendered block, append a short footer (matching the reference's "review notes"): commits-included count, commits-excluded-as-internal count, the discovered style/voice source paths from Step 6 (or "no repo style/voice doc found — applied baseline rules"), and any flags surfaced during translation (uncertain categorization, etc.). The footer is rendered as a Markdown blockquote so it's easy to strip when copy-pasting.

**Refusals.** Cross-repo `-R`; milestone not found; `--include-open` flag is required for an open milestone; `--write` against a `CHANGELOG.md` missing the `## [Unreleased]` anchor; private-repo leak guard hits in any rendered description (rare — only triggers if a PR title literally contains a private-repo URL).

## Supporting docs

### `.github/LABELS.md`

Single-source label inventory consumed by `/new-issue` and `/edit-issue`. Structure:

```markdown
# Labels

## Labels

| Name | Description | Color |
|------|-------------|-------|
| `bug` | Something isn't working | `d73a4a` |
| `documentation` | Improvements or additions to documentation | `0075ca` |
| `enhancement` | New feature or request | `a2eeef` |
| ... | ... | ... |

## Adding/Changing labels

…
```

Initial inventory mirrors the GitHub-default 9 labels already on the repo, alphabetized. The `## Adding/Changing labels` prose explains the workflow (PR to this file → CI sync to the remote in a follow-up issue, not in this PR).

### `docs/issue-filing-style.md`

Captures the conventions the patinaproject reference encodes in its own style doc. Single source of truth for:

- 5-section issue body template (matches `/new-issue` output).
- Acceptance Criteria format (`AC-<issue>-<n>`, Given/When/Then).
- When to use milestones vs. labels vs. assignees.
- Relationship vocabulary: `sub-issue-of`, `blocked-by`, `blocks`, `related-to`.
- Public-repo leak guard policy (lives here so non-skill contributors see it too).
- Title style (plain-language, no commit-style prefix).

## Open questions / decisions deferred

None block Gate 1; recording for traceability:

1. **Resolved at round 2:** Skill invocation surface — namespaced `/github-flows:<skill>` everywhere. See **Decisions** above.
2. **`/write-changelog --write` and ordering.** Inserting after `## [Unreleased]` assumes that anchor exists in the bootstrap `CHANGELOG.md`. The current `CHANGELOG.md` is the release-please default and does not yet have an `## [Unreleased]` anchor; Phase 2 docs work adds it (or `--write` halts cleanly with the missing-anchor refusal).
3. **Schema-probe caching across runs.** Cached only per-invocation. A future enhancement could persist to `.claude/cache/`, but it's out of scope here.

## Active acceptance criteria

All ACs from issue #1, restated as the active set under review:

- **Baseline (Phase 1):** AC-1-1 through AC-1-6 — already satisfied by commit `cf3a49b`.
- **Supporting docs (Phase 2):** AC-1-7 (`.github/LABELS.md` shape), AC-1-8 (`docs/issue-filing-style.md` content).
- **`/edit-issue` (Phase 3):** AC-1-9 (BLOCKED_BY mutation), AC-1-10 (`closeIssue` with stateReason), AC-1-11 (label/milestone existence refusal), AC-1-12 (cross-repo refusal).
- **`/new-issue` (Phase 4):** AC-1-13 (duplicate surface + comment-instead offer), AC-1-14 (public-repo leak refusal), AC-1-15 (malformed LABELS.md halt), AC-1-16 (zero-label happy path).
- **`/new-branch` (Phase 5):** AC-1-17 (kebab branch name), AC-1-18 (dirty-tree refusal), AC-1-19 (pnpm install on `pnpm-lock.yaml`), AC-1-20 (skip on no lockfile/no package.json).
- **`/write-changelog` (Phase 6):** AC-1-21 (bucket routing: `feat`→New, `fix`→Fixed, `chore` excluded), AC-1-22 (Breaking section first), AC-1-23 (`--write` insertion + markdownlint validity), AC-1-24 (cross-repo refusal), AC-1-25 (en-dash typography: every dash separator in rendered output is U+2013 with surrounding spaces; no `—` or `--`).
