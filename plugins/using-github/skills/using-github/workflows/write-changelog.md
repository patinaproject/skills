# changelog procedure Workflow

**Goal:** Render a user-facing changelog block for a GitHub milestone, sourced
from the merging PRs of that milestone's closed issues. Output is plain
Markdown to stdout (the user copies, edits, and pastes wherever release notes
live), or — with `--write` — inserted under the `## [Unreleased]` anchor in
`CHANGELOG.md` and re-validated with `markdownlint-cli2`.

**Inspiration.** This skill adopts the filtering rules, friendly bucket names
(`New` / `Improved` / `Fixed`), translation rules, and omit-empty-section
output from the `patinaproject/patinaproject` `/changelog-generator` skill.
The source of truth diverges: `changelog procedure` walks **GitHub
milestones + merging PRs** rather than raw `git log`, which matches the
release-please flow used by this repo.

---

## Checklist (use TodoWrite)

Create todos for each step before starting:

- [ ] Step 1: Resolve milestone
- [ ] Step 2: List milestone issues
- [ ] Step 3: Resolve merging PRs via issue timeline
- [ ] Step 4: Filter (drop internal commits)
- [ ] Step 5: Categorize into New / Improved / Fixed / Breaking
- [ ] Step 6: Discover repo style/voice docs
- [ ] Step 7: Translate each kept entry to user-facing prose
- [ ] Step 8: Render the milestone block
- [ ] Step 9: Output to stdout, or insert with `--write`
- [ ] Step 10: Append review-notes footer

---

## Step 1: Resolve milestone

Accept either a milestone title or a milestone number as the first argument.

Resolve the current repo:

```bash
gh repo view --json nameWithOwner --jq .nameWithOwner
```

On non-zero exit or output that fails the regex
`^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$`, halt:

> "Could not resolve current repository — refusing to render changelog. Ensure
> the working directory has a configured `gh` remote and try again."

Store the result as `$repo` (with `$owner`, `$name`).

If the user passed `-R other/repo`, refuse — see Refusal Conditions.

Fetch the milestone:

```bash
gh api repos/:owner/:repo/milestones \
  --jq '.[] | select(.title=="<title>" or .number==<n>)'
```

If no milestone matches, refuse:

> "Milestone `<input>` not found in `$repo`."

Default behavior renders only **closed** milestones — the release is "done."
If the resolved milestone has `state == "open"` and the user did not pass
`--include-open`, refuse:

> "Milestone `<title>` is open. Pass `--include-open` to render a draft block
> for an in-flight milestone."

Capture `$milestoneTitle`, `$milestoneNumber`, `$closedAt`, `$dueOn`.

---

## Step 2: List milestone issues

```bash
gh issue list --milestone "<title>" --state all --limit 200 \
  --json number,title,labels,state,closedAt,url
```

Keep only issues with `state == "closed"`. Cache the list as `$issues[]`.

If the list is empty, render the heading + footer with zero entries (Step 8 +
Step 10) and stop after Step 10 — there is nothing to translate.

---

## Step 3: Resolve merging PRs via issue timeline

For each closed issue, find the merging PR(s) by walking the issue's timeline
for the most recent `ClosedEvent`. Use this GraphQL query verbatim:

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

Run via:

```bash
gh api graphql \
  -f query='<query above>' \
  -F o="$owner" -F r="$name" -F n="$N" \
  --jq '.data.repository.issue.timelineItems.nodes'
```

Take the most recent `ClosedEvent.closer` that is a `PullRequest`. Use its
`mergeCommit.messageHeadline` as the conventional-commit subject for filter
and categorize. If no PR closed the issue (manual close, no `closer`), fall
back to the issue's own title plus its `state_reason`.

Cache the per-issue tuple `{number, title, url, labels[], subject, prNumber,
prTitle, prBody}`.

---

## Step 4: Filter (drop internal commits)

Apply this table to the resolved subject (PR `messageHeadline` or issue
fallback) for each issue:

| Conventional-commit type on squash-merge subject | Action |
|---|---|
| `feat`, `fix`, `perf` | **keep** |
| `chore`, `ci`, `refactor`, `test`, `build`, `style` | **drop** (internal) |
| `docs` | **drop** unless the issue carries the `documentation` label |
| release-please autorelease (`^chore: release v?\d+\.\d+\.\d+`) | **drop** always |
| any subject containing only "bump", "upgrade", "update deps", "update dependency" | **drop** (dependency churn) |
| any subject containing "fix lint", "fix types", "knip", "unused" with no other behavior change | **drop** (lint-only) |

When uncertain whether a kept commit is user-facing, **err on the side of
inclusion**. The human reviewer makes the final call.

Track two counters for the Step 10 footer:

- `$keptCount` — entries that survived the filter.
- `$droppedCount` — entries dropped as internal.

---

## Step 5: Categorize into New / Improved / Fixed / Breaking

Assign each kept entry to one bucket:

| Bucket | When to use |
|---|---|
| **Breaking** | The change has `!` after the type (e.g. `feat!:`) OR the PR body contains a `BREAKING CHANGE:` footer. Rendered ABOVE all other buckets. |
| **New** | A user can do something they could not do before (typically `feat`). |
| **Improved** | An existing capability works better, looks better, or is faster (typically `perf`, sometimes `feat` for polish). |
| **Fixed** | A bug that affected users is resolved (typically `fix`). |

Use the conventional-commit type as a hint, but **read the message**: a `fix`
that adds capability becomes **New**; a `feat` that only polishes existing
behavior becomes **Improved**.

Breaking-change detection is independent of type — any entry with `!` after
the type or a `BREAKING CHANGE:` footer routes to **Breaking** regardless of
whether it would otherwise be **New**, **Improved**, or **Fixed**.

---

## Step 6: Discover repo style/voice docs

Probe the following paths in order. The first match per category wins; read
the matched file and treat its rules as authoritative for that category.

| Category | Probe paths (in order) |
|---|---|
| Changelog style | `docs/changelog-style.md`, `docs/CHANGELOG_STYLE.md`, `.github/CHANGELOG_STYLE.md`, `CHANGELOG_STYLE.md` |
| Brand / writing voice | `docs/brand-voice.md`, `docs/BRAND_VOICE.md`, `.github/BRAND_VOICE.md`, `BRAND_VOICE.md` |

Record the discovered path(s) for the Step 10 footer. If neither category has
a match, record "no repo style/voice doc found — applied baseline rules."

**Repo style/voice docs override the Step 7 baselines where they conflict —
except** for the typography hard rule (en dash separators), which is enforced
in the renderer regardless of any repo override.

---

## Step 7: Translate each kept entry to user-facing prose

Apply discovered repo style/voice rules from Step 6 first. Otherwise apply
these baselines (the universal-safe subset that won't conflict with most
repos):

- Drop the leading `type:` / `type(scope):` prefix, issue/PR refs, and commit
  hashes from the title.
- Sentence case for titles.
- Plain language a user understands; lead with the user-facing benefit.
- No corporate vocabulary (no "leverage", "enhance", "seamless", "robust",
  "functionality").
- Target 1-2 sentences. One clear sentence beats two padded ones.
- Name the specific feature, page, library, or area when the commit mentions
  one — prefer concrete nouns over generic prose.
- Each entry ends with the canonical issue link in parentheses:
  `([#N](<issue-url>))`.

### Typography (HARD RULE — overrides any repo style override)

Every dash separator in **rendered output** is U+2013 `–` (en dash) with one
space on each side. Never emit U+2014 `—` (em dash). Never emit `--` (double
hyphen). The renderer enforces this regardless of what the repo style or
voice doc says — typography is a hard constraint, not a voice preference.

Two places this matters:

1. The milestone heading separator between version and date:
   `## [<version>] – <YYYY-MM-DD>`
2. The entry separator between bold title and description:
   `- **Title** – description ([#N](<issue-url>))`

If a translated description naturally contains an em dash, replace it with
` – ` (space, U+2013, space). If it naturally contains `--`, replace with
` – ` as well.

---

## Step 8: Render the milestone block

Render in this exact shape. **Breaking** appears first when present, then
**New**, **Improved**, **Fixed**:

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

**Resolution rules:**

- `<version>` defaults to `$milestoneTitle`.
- `<YYYY-MM-DD>` defaults to `$closedAt` truncated to date; if absent, fall
  back to `$dueOn`; if both absent, use today's date.
- **Empty buckets are omitted entirely.** Do not render an empty `### New` or
  a `*None.*` stub. If only **Fixed** has entries, render only the heading +
  `### Fixed`.
- Every dash separator is U+2013 ` – ` per Step 7's hard rule.

---

## Step 9: Output / `--write`

**Default (no flag):** print the rendered block + Step 10 footer to stdout.
Do not add a preamble or commentary; the user will copy and paste it.

**With `--write`:** open `CHANGELOG.md`, locate the literal anchor
`## [Unreleased]`, and insert the rendered block immediately after that line
and before the next `## [` heading. Then re-validate the file:

```bash
markdownlint-cli2 CHANGELOG.md
```

If `markdownlint-cli2 CHANGELOG.md` exits non-zero, surface the lint output
verbatim and stop — do not commit or stage the file.

If `CHANGELOG.md` does not contain the literal anchor `## [Unreleased]`,
refuse — see Refusal Conditions.

---

## Step 10: Append review-notes footer

After the rendered block (and inside `CHANGELOG.md` when `--write` was used),
append a short Markdown blockquote so the human can audit what was applied
and easily strip it on copy-paste:

```markdown
> **Review notes**
>
> - Commits included: <keptCount>
> - Commits excluded as internal: <droppedCount>
> - Style source: <discovered changelog-style path, or "none">
> - Voice source: <discovered brand-voice path, or "none">
> - Flags: <list any entries flagged uncertain during translation, or "none">
```

When neither category had a probe match in Step 6, render the style/voice
lines as `none — applied baseline rules`.

---

## Refusal Conditions

Stop and do NOT render or write changelog output if:

1. **Cross-repo invocation.** The user passed `-R other/repo` or otherwise
   targeted a different repository than the current working directory's `gh`
   default. Refuse with:

   > `` `changelog procedure` only renders changelogs for the current working directory's default `gh` repository. To render for another repo, `cd` into a checkout of that repo and re-run. ``

2. **Milestone not found.** No milestone in `$repo` matches the supplied
   title or number. Refuse:

   > "Milestone `<input>` not found in `$repo`."

3. **Open milestone without `--include-open`.** The resolved milestone is
   open and the user did not pass `--include-open`. Refuse:

   > "Milestone `<title>` is open. Pass `--include-open` to render a draft
   > block for an in-flight milestone."

4. **`--write` against a `CHANGELOG.md` missing the anchor.** Refuse with
   this exact message:

   > "`--write` requires the literal '## [Unreleased]' anchor in
   > `CHANGELOG.md` — refusing."

5. **Private-repo URL leak guard.** A rendered description literally
   contains a URL pointing into a private repository. Refuse to print that
   entry; surface the issue/PR number to the user and stop, so the human can
   rewrite by hand.

---

## Quick Reference

| Step | Action | Blocks on |
|------|--------|-----------|
| 1 | Resolve milestone | Cross-repo `-R` → refuse; milestone not found → refuse; open milestone without `--include-open` → refuse |
| 2 | List milestone issues | Empty list → render heading + footer only |
| 3 | Resolve merging PRs (`IssueTimelineItems[CLOSED_EVENT]`) | No `ClosedEvent.closer` PR → fall back to issue title + `state_reason` |
| 4 | Filter | Drop `chore` / `ci` / `refactor` / `test` / `build` / `style`; drop `docs` unless `documentation` label; drop release-please autorelease + dependency / lint-only churn |
| 5 | Categorize | `feat` → New; `perf` → Improved; `fix` → Fixed; `!` or `BREAKING CHANGE:` → Breaking (rendered first) |
| 6 | Discover style/voice docs | First match per category wins; recorded in Step 10 footer |
| 7 | Translate | Repo style/voice overrides baselines, EXCEPT typography (en dash hard rule) |
| 8 | Render block | Breaking first; empty buckets omitted; en dash ` – ` separators |
| 9 | Output / `--write` | `--write` requires `## [Unreleased]` anchor; re-validates with `markdownlint-cli2 CHANGELOG.md` |
| 10 | Footer | Blockquote: included / excluded counts + discovered style + voice paths |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Sourcing entries from raw `git log` | Source is GitHub milestones + merging PRs (Step 1-3) |
| Including `chore` / `ci` / `refactor` / `test` / `build` / `style` | These are dropped as internal (Step 4 filter table) |
| Including release-please autorelease commits | Drop subjects matching `^chore: release v?\d+\.\d+\.\d+` |
| Including `docs` when the issue lacks `documentation` | Only kept when the issue carries the `documentation` label |
| Rendering an em dash `—` or double hyphen `--` | Always U+2013 ` – ` with surrounding spaces (Step 7 hard rule) |
| Putting **Breaking** below **New** | **Breaking** is rendered ABOVE all other buckets when present |
| Rendering empty buckets | Omit empty buckets entirely — no `*None.*` stub |
| `--write` against a `CHANGELOG.md` missing the anchor | Refuse — do not invent the `## [Unreleased]` anchor |
| Skipping `markdownlint-cli2 CHANGELOG.md` after `--write` | Always re-validate; surface lint output verbatim and stop on failure |
| Cross-repo via `-R` | Refuse — only renders for the current working directory's default `gh` repo |
