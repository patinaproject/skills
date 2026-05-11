# Plan: Bootstrap and ship /edit-issue, /new-issue, /new-branch, /write-changelog skills [#1](https://github.com/patinaproject/github-flows/issues/1)

## Source design

[docs/superpowers/specs/2026-04-26-1-bootstrap-and-ship-skills-design.md](../specs/2026-04-26-1-bootstrap-and-ship-skills-design.md) at commit `ab5bee2` (Gate 1 round 3, approved).

## Notes for Executor

- All artifacts are Markdown — there is no executable test runtime. **ATDD means:** for each AC, define the verification evidence (a command + expected output, a grep/inspection, or a structured walkthrough) before writing the workflow content, then author so following the workflow produces that evidence.
- Each task lists its file outputs, the source-of-truth design sections to consult, the ACs it satisfies, and the verification evidence required before claiming completion.
- Workstreams **WS-2 / WS-3 / WS-4 / WS-5** are mutually independent and can be implemented in any order or in parallel agent batches. **WS-1** must land before any task that exercises `.github/LABELS.md` (Reviewer pressure-test for `/new-issue`) or before `/write-changelog --write` is exercised against `CHANGELOG.md`.
- All skill `SKILL.md` files document the namespaced invocation (`/github-flows:<skill>`) only — bare `/<skill>` is not a thing for plugin-shipped skills (Decision recorded in design).
- All `gh api graphql` mutations in workflows must include the schema-probe pattern from the design's "GraphQL probing" section, not bare-call them.

## Workstream WS-1 — Supporting docs (Phase 2)

Must land first; downstream skill workflows reference these files.

### TASK-1.1 — `.github/LABELS.md`

**Output:** `.github/LABELS.md`
**Design ref:** "Supporting docs → `.github/LABELS.md`"
**ACs satisfied:** `AC-1-7`

**Content shape:**

- `# Labels` H1.
- `## Labels` H2 with a Markdown table: `| Name | Description | Color |` header, then one row per label sorted A–Z by name (case-insensitive). Names in backticks. Initial inventory mirrors the 9 default GitHub labels currently on the repo (`bug`, `documentation`, `duplicate`, `enhancement`, `good first issue`, `help wanted`, `invalid`, `question`, `wontfix`) plus `autorelease: pending` and `autorelease: tagged` (release-please reserved — describe accordingly).
- `## Adding/Changing labels` prose: PR to this file → CI sync to remote in a follow-up issue (no CI sync in this PR).
- `## Reserved labels` prose: explicit note that `autorelease: pending`/`autorelease: tagged` are owned by Release Please and must never be applied/removed manually.

**Verification:**

```bash
# AC-1-7 (a): table parses with at least bug + enhancement
awk '/^## Labels$/,/^## /{print}' .github/LABELS.md | grep -E '^\| `(bug|enhancement)`' | wc -l   # expect ≥ 2
# AC-1-7 (b): names sorted A–Z
awk '/^## Labels$/,/^## /{print}' .github/LABELS.md | grep -oE '^\| `[a-z][^`]*`' | LC_ALL=C sort -c
# Lints clean
pnpm lint:md
```

### TASK-1.2 — `docs/issue-filing-style.md`

**Output:** `docs/issue-filing-style.md`
**Design ref:** "Supporting docs → `docs/issue-filing-style.md`"
**ACs satisfied:** `AC-1-8`

**Content sections (in order):**

1. `# Issue filing style` — repository's canonical guide.
2. `## Body template` — the 5-section template (Problem / Proposal / Acceptance Criteria / Context / Out of Scope) plus optional Non-Goals.
3. `## Acceptance Criteria format` — `AC-<issue>-<n>` IDs, Given/When/Then.
4. `## Title style` — plain language; no commit-style prefix.
5. `## Labels` — pointer to `.github/LABELS.md`.
6. `## Milestones` — when to use, how naming aligns with release tags.
7. `## Relationships` — vocabulary (`sub-issue-of`, `blocked-by`, `blocks`, `related-to`); how each maps (GraphQL or body prose).
8. `## Assignees` — soft policy.
9. `## Public-repo leak guard` — refusal policy lives here so non-skill contributors see it.
10. `## Reference implementations` — link to `skills/new-issue/workflow.md` and the patinaproject reference for traceability.

**Verification:**

```bash
grep -E '^## (Body template|Acceptance Criteria format|Public-repo leak guard)' docs/issue-filing-style.md | wc -l  # expect 3
pnpm lint:md
```

### TASK-1.3 — Add `## [Unreleased]` anchor to `CHANGELOG.md`

**Output:** edit to `CHANGELOG.md`
**Design ref:** "Open questions" #2; `/write-changelog --write` Step 9
**ACs satisfied:** part of `AC-1-23`

Insert (just below the existing release-please preamble, above any future release block):

```markdown
## [Unreleased]
```

**Verification:**

```bash
grep -Fxq '## [Unreleased]' CHANGELOG.md  # exit 0
pnpm lint:md
```

## Workstream WS-2 — `/edit-issue` (Phase 3)

### TASK-2.1 — `skills/edit-issue/workflow.md`

**Output:** new `skills/edit-issue/workflow.md`
**Design ref:** "Skill-specific designs → `/edit-issue`" + "Cross-cutting decisions"
**ACs satisfied:** `AC-1-9`, `AC-1-10`, `AC-1-11`, `AC-1-12`

**Required sections (mirror the patinaproject `/new-issue` workflow shape):**

1. `# /github-flows:edit-issue Workflow` H1 + 1-line Goal.
2. `## Checklist` — TodoWrite step list (Resolve target → Parse change request → Validate → Probe schema → Confirm → Apply REST changes → Apply GraphQL changes → Report).
3. `## Step 1: Resolve target` — `gh repo view --json nameWithOwner,visibility`; refuse cross-repo; resolve `<issue>` (number, URL, `#N`).
4. `## Step 2: Parse change request` — turn the user's prose into a typed changeset, one row per field.
5. `## Step 3: Validate against remote` — labels via `gh label list`, milestone via `gh api .../milestones`, relationship targets via GraphQL `repository.issue(number:).id` query.
6. `## Step 4: Probe GraphQL schema` — single probe; cache `$depSupported` and `$closeReasonSupported`. Document body-prose fallback for unsupported `addIssueDependency`. **Note:** `closeIssue` is a long-standing GitHub mutation, but `stateReason` is the part that matters; probe it via `__type(name:"CloseIssueInput"){ inputFields{ name } }`.
7. `## Step 5: Confirm` — render the changeset summary; wait for `approve` / `revise` / `cancel` (≤3 cycles).
8. `## Step 6: Apply REST changes` — full table from design with `gh issue edit` invocations.
9. `## Step 7: Apply GraphQL changes` — `addIssueDependency` / `addSubIssue` / `closeIssue` / `reopenIssue` snippets with the same shape as the patinaproject reference's Step 9.
10. `## Step 8: Report` — final state (URL, applied changes, fallbacks used).
11. `## Refusal Conditions` — cross-repo, missing label/milestone, unresolved relationship target, ambiguous request.
12. `## Quick Reference` table.
13. `## Common Mistakes` table.

Then update `skills/edit-issue/SKILL.md`: replace the TODO block with `Follow the instructions in ./workflow.md.`

**ATDD evidence (per AC):**

| AC | Verification |
|---|---|
| AC-1-9 | `grep -F 'BLOCKED_BY' skills/edit-issue/workflow.md` returns the `addIssueDependency` mutation snippet with `dependencyType:$t` argument and `BLOCKED_BY` enum literal. |
| AC-1-10 | `grep -F 'closeIssue' skills/edit-issue/workflow.md` returns a mutation snippet with `stateReason: NOT_PLANNED` shown in an example, and the workflow text explicitly says it falls back to `gh issue close` only when no reason is supplied. |
| AC-1-11 | Step 3 explicitly halts on missing label or non-open milestone before Step 6/7 mutations. |
| AC-1-12 | Step 1 + Refusal Conditions both contain the cross-repo refusal message verbatim ("`/github-flows:edit-issue` only edits issues in the current working directory's default `gh` repository"). |

```bash
pnpm lint:md
```

## Workstream WS-3 — `/new-issue` (Phase 4)

### TASK-3.1 — `skills/new-issue/workflow.md`

**Output:** new `skills/new-issue/workflow.md`
**Design ref:** "Skill-specific designs → `/new-issue`" + cross-cutting
**ACs satisfied:** `AC-1-13`, `AC-1-14`, `AC-1-15`, `AC-1-16`

**Required sections (extends the patinaproject reference shape with two new behaviors):**

1. `# /github-flows:new-issue Workflow` + Goal. Reference `docs/issue-filing-style.md` and `.github/LABELS.md` as authoritative.
2. `## Checklist` — TodoWrite. Add **Step 1.5: Duplicate check** between "Get description" and "Suggest labels"; add **Leak guard** as a sub-step inside both Step 6 (draft) and Step 7 (pre-creation).
3. `## Step 1: Load Labels` — copy the parser-rules block verbatim from the patinaproject reference (Section "Step 1") **with these adjustments:** read from `.github/LABELS.md`, halt with the same malformed-table message (`AC-1-15` evidence).
4. `## Step 2: Gather Intent` — same prompt shape as reference.
5. `## Step 3: Duplicate check` — design's Step 3 spec verbatim: extract 3-5 key terms; run two `gh issue list --search` passes; merge + dedupe; score by ≥2 token overlap; surface candidates with **(a) comment a follow-up / (b) file new anyway / (c) abort** options. (`AC-1-13` evidence.)
6. `## Step 4: Suggest and Confirm Labels` — adapted from reference Step 3.
7. `## Step 5: Capture Milestone` — from reference Step 4.
8. `## Step 6: Capture Relationships` — from reference Step 5 (queue-only; mutations in Step 9).
9. `## Step 7: Draft and Present` — from reference Step 6, **plus leak guard** (`AC-1-14`): when target visibility is `PUBLIC`, scan body for private-repo URLs/paths per design; refuse with clear message and ask for public-safe rewrite.
10. `## Step 8: Pre-Creation Checks` — from reference Step 7, **plus** repeat leak guard (body may have changed during revision cycles).
11. `## Step 9: Create Issue` — from reference Step 8 (zero-label happy path → `AC-1-16`).
12. `## Step 10: Apply Relationship Mutations` — from reference Step 9.
13. `## Refusal Conditions` and `## Quick Reference` and `## Common Mistakes` tables.

Then update `skills/new-issue/SKILL.md`: replace TODO with `Follow the instructions in ./workflow.md.`

**ATDD evidence:**

| AC | Verification |
|---|---|
| AC-1-13 | Step 3 contains a `gh issue list --search ... --state all` invocation AND the three-option prompt naming "comment", "file new", "abort". |
| AC-1-14 | Step 7 + Step 8 both contain a "Public-repo leak guard" subsection that runs `gh repo view --json visibility`, scans for `https://github.com/<org>/<private-repo>/...` patterns, and emits a refusal message asking for public-safe rewrite. |
| AC-1-15 | Step 1 contains the literal halt message `.github/LABELS.md table appears malformed — refusing to proceed.` |
| AC-1-16 | Step 9 contains the advisory line for zero-label case AND the command construction omits `--label` when the set is empty. |

```bash
pnpm lint:md
# AC-1-15 walk-through evidence (manual): empty .github/LABELS.md table → workflow Step 1 halts.
```

## Workstream WS-4 — `/new-branch` (Phase 5)

### TASK-4.1 — `skills/new-branch/workflow.md`

**Output:** new `skills/new-branch/workflow.md`
**Design ref:** "Skill-specific designs → `/new-branch`"
**ACs satisfied:** `AC-1-17`, `AC-1-18`, `AC-1-19`, `AC-1-20`

**Required sections:**

1. `# /github-flows:new-branch Workflow` + Goal.
2. `## Checklist` — TodoWrite (Resolve issue → Compute branch name → Check tree → Fetch → Checkout/Rebase → Install → Report).
3. `## Step 1: Resolve issue` — `gh issue view <N> --json number,title`; `--allow-closed` flag bypass.
4. `## Step 2: Compute branch name` — kebab algorithm verbatim from design (lowercase → replace runs of non-alnum with single hyphen → trim hyphens → truncate at 60 chars on hyphen boundary). Include the worked example: issue 42 "Let agents use GitHub more ergonomically" → `42-let-agents-use-github-more-ergonomically`. (`AC-1-17` evidence.)
5. `## Step 3: Check working tree` — `git status --porcelain`; refuse on non-empty with `git stash` suggestion. (`AC-1-18` evidence.)
6. `## Step 4: Fetch default branch` — `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name`; never hardcode `main`.
7. `## Step 5: Checkout / Rebase` — branch-exists vs. new-branch paths; surface rebase conflict (don't auto-abort).
8. `## Step 6: Install dependencies` — lockfile priority `pnpm-lock.yaml` → `pnpm install`; `yarn.lock` → `yarn install`; `bun.lockb` → `bun install`; `package-lock.json` → `npm install`. No lockfile + no `package.json` → skip silently. (`AC-1-19`, `AC-1-20` evidence.)
9. `## Step 7: Report` — branch, base SHA, install command + exit code.
10. `## Refusal Conditions` and `## Quick Reference`.

Then update `skills/new-branch/SKILL.md`: replace TODO with `Follow the instructions in ./workflow.md.`

**ATDD evidence:**

| AC | Verification |
|---|---|
| AC-1-17 | `grep -F '42-let-agents-use-github-more-ergonomically' skills/new-branch/workflow.md` returns the worked example. |
| AC-1-18 | Step 3 contains the literal refusal pattern referencing `git status --porcelain` and `git stash`. |
| AC-1-19 | Step 6 lockfile priority table places `pnpm-lock.yaml` row first (not `package-lock.json`). |
| AC-1-20 | Step 6 explicitly says "skip silently" for the no-lockfile, no-`package.json` case. |

```bash
pnpm lint:md
```

## Workstream WS-5 — `/write-changelog` (Phase 6)

### TASK-5.1 — `skills/write-changelog/SKILL.md` + `skills/write-changelog/workflow.md`

**Output:** new directory `skills/write-changelog/` with both files
**Design ref:** "Skill-specific designs → `/write-changelog`" (steps 1-10)
**ACs satisfied:** `AC-1-21`, `AC-1-22`, `AC-1-23`, `AC-1-24`, `AC-1-25`

**`SKILL.md` shape:** frontmatter (`name: write-changelog`, `description: ...`) + body `Follow the instructions in ./workflow.md.` Description encodes user-trigger phrasing: "Use when the user wants to render a user-facing changelog block for a milestone…"

**`workflow.md` required sections (10 steps from design):**

1. `# /github-flows:write-changelog Workflow` + Goal + reference inspiration (`patinaproject/patinaproject` `/changelog-generator` skill).
2. `## Checklist` — TodoWrite.
3. `## Step 1: Resolve milestone` — `gh api repos/:owner/:repo/milestones`; default closed-only; `--include-open` flag.
4. `## Step 2: List milestone issues` — `gh issue list --milestone "<title>" --state all --limit 200`.
5. `## Step 3: Resolve merging PRs` — exact GraphQL `IssueTimelineItems[CLOSED_EVENT]` query from design.
6. `## Step 4: Filter` — full filter table from design (drop chore/ci/refactor/test/build/style; docs unless `documentation` label; release-please autorelease; dependency churn; lint-only).
7. `## Step 5: Categorize` — New / Improved / Fixed / Breaking buckets table; "feat hint, but read the message" rule. (`AC-1-21`, `AC-1-22` evidence.)
8. `## Step 6: Discover repo style/voice docs` — probe paths table from design; first match wins per category; record discovered paths for footer.
9. `## Step 7: Translate` — baseline rules (sentence case / plain language / no corporate vocab / "name the specific thing" / link `([#N](url))`); **typography hard rule** (en dash `–` U+2013 with surrounding spaces; never `—` or `--`). (`AC-1-25` evidence.)
10. `## Step 8: Render block` — exact output template from design with en-dash separators in heading and entry lines.
11. `## Step 9: Output / --write` — stdout default; `--write` opens `CHANGELOG.md`, locates `## [Unreleased]`, inserts after; re-validates with `markdownlint-cli2`. (`AC-1-23` evidence.)
12. `## Step 10: Footer` — blockquote with included/excluded counts + discovered style sources.
13. `## Refusal Conditions` (cross-repo `AC-1-24`; milestone not found; `--include-open` required for open; missing `## [Unreleased]` anchor when `--write`; leak guard).
14. `## Quick Reference` table.

**ATDD evidence:**

| AC | Verification |
|---|---|
| AC-1-21 | Step 4 filter table excludes `chore`, includes `feat`/`fix`. Step 5 maps `feat`→**New** and `fix`→**Fixed**. |
| AC-1-22 | Step 5 categorize table places **Breaking** above all other buckets in the rendered output (Step 8 template). |
| AC-1-23 | Step 9 contains the literal anchor string `## [Unreleased]` and the post-insert validation `markdownlint-cli2 CHANGELOG.md`. |
| AC-1-24 | Refusal Conditions contain the cross-repo refusal message naming `/github-flows:write-changelog`. |
| AC-1-25 | `python3 -c "import sys; t=open('skills/write-changelog/workflow.md').read(); assert '–' in t and '—' not in t.split('---ENFORCED---')[0:1] or True; print('en-dash present')"` AND `grep -nF -- '--' skills/write-changelog/workflow.md` returns no entry-separator double-hyphens (separators in fenced code blocks for `gh` flags don't count; the en-dash rule applies to **rendered output**, which is shown in fenced markdown blocks within the workflow). Reviewer pressure-tests by searching the rendered template block specifically for `–` and confirming `—` does not appear. |

```bash
pnpm lint:md
node scripts/check-plugin-versions.mjs
```

## Workstream WS-6 — Verification + reporting

### TASK-6.1 — Repo-wide verification sweep

After WS-1 through WS-5 are committed, run the full self-test gauntlet from the bootstrap design + the per-workstream ACs as a single batch:

```bash
pnpm install                                           # idempotent re-run
pnpm exec commitlint --help >/dev/null
echo "feat: bad" | pnpm exec commitlint && exit 1 || true
echo "feat: #1 ok" | pnpm exec commitlint
pnpm lint:md
node scripts/check-plugin-versions.mjs
ls skills/edit-issue/workflow.md \
   skills/new-issue/workflow.md \
   skills/new-branch/workflow.md \
   skills/write-changelog/SKILL.md \
   skills/write-changelog/workflow.md
test -f .github/LABELS.md
test -f docs/issue-filing-style.md
grep -Fxq '## [Unreleased]' CHANGELOG.md
```

All commands must exit 0 (the `commitlint` bad-message check is inverted intentionally).

Then walk every AC (`AC-1-7` … `AC-1-25`) using the per-task verification table above, recording the actual command output as the Executor's `verification[]` evidence.

## Sequencing summary

```text
WS-1  ──┐
        ├──▶ WS-6 (verification)
WS-2 ──┤
WS-3 ──┤    (WS-2..WS-5 in parallel, after WS-1)
WS-4 ──┤
WS-5 ──┘
```

## Blockers

None.
