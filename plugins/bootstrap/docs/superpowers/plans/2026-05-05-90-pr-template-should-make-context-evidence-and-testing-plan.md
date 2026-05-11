# Plan: PR template should make context, evidence, and testing instructions self-explanatory to reviewers [#90](https://github.com/patinaproject/bootstrap/issues/90)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the canonical PR template's `## What changed`, `## Test coverage`, and `## Acceptance criteria` sections legible to a first-time reviewer reading the rendered body, by adding ~10–13 rendered lines (R1–R4 in the design) to the bootstrap template source and round-tripping the change to the repo root template — without touching the machine-validated per-AC grammar.

**Approved revision after Hillary feedback:** Expand the implementation into a
contract migration. Retire the separate `## Acceptance criteria` PR-body section,
move each `### AC-<issue>-<n>` coverage entry into `## Test coverage`, forbid
checkboxes in `## Test coverage`, and add a top-level `## Testing steps` section
whose checkboxes carry human tester actions. Update validator logic, fixtures,
`docs/ac-traceability.md`, and AGENTS guidance to match.

Supersession note: tasks or out-of-scope bullets below that say the old
`Test gap:`, `Non-blocking gap:`, or `Operator check:` grammar must be
preserved unchanged, that `## Acceptance criteria` remains the manual-testing
location, or that validator/docs/fixture edits are forbidden are pre-Hillary
plan context and are superseded by this approved revision.

**Architecture:** Template and validator PR. Edit bootstrap template sources under `skills/bootstrap/templates/core/**` first, mirror to the root files so source and emitted baseline stay byte-identical where applicable. The CI script `scripts/check-pr-template-checkboxes.mjs`, its tests/fixtures, `docs/ac-traceability.md`, and `AGENTS.md` are in scope because the approved revision changes where AC coverage and tester actions live.

**Tech Stack:** Markdown, `markdownlint-cli2`, Node.js (existing CI script `scripts/check-pr-template-checkboxes.mjs`), Husky + commitlint, the local `bootstrap` skill in realignment mode.

**Authoritative inputs:**

- Design: `docs/superpowers/specs/2026-05-05-90-pr-template-should-make-context-evidence-and-testing-design.md` (commit `d8434e5`).
- AGENTS.md "Commit type selection" path-first rule: any change touching `skills/bootstrap/templates/**` or `.github/pull_request_template.md` is `feat:` or `fix:`. This PR adds shipped behavior, so it is `feat:`.
- AGENTS.md "Source of truth for repo baseline": `.github/pull_request_template.md` is mirrored from `skills/bootstrap/templates/core/.github/pull_request_template.md` via the `bootstrap` skill in realignment mode. Hand-editing only the root regresses the next bootstrapped repo.
- `docs/ac-traceability.md`: AC-ID convention and the fact that the PR template is the source of truth for the colon-style evidence row grammar (this plan must not contradict that).
- Current state: as of this plan's authoring, root `.github/pull_request_template.md` and the bootstrap source template are byte-identical (`cmp -s` exits 0).

**Out of scope (do not change in this PR):**

- `scripts/check-pr-template-checkboxes.mjs` (R5).
- Any fixture under `scripts/fixtures/pr-template-checkboxes/` (R5).
- The labels `Test gap:`, `Non-blocking gap:`, `Operator check:`, the colon-style evidence row, and the `<!-- pr-checkbox: optional -->` marker (R5, design red flags).
- Adding a top-level `## How to verify` / `## Verification` / `## Testing instructions` / `## Manual test plan` section (R5 non-goal).
- Repo-specific build-acquisition copy (iOS, TestFlight, Vercel, `npm install`, `pip install`, `terraform plan`) in the rendered body (R6).
- `docs/ac-traceability.md` content edits unless a direct contradiction is found.

---

## File structure

Two files change, both with the same final content. Round-trip parity is enforced by `cmp -s`.

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md` — source of truth; the implementer edits this first.
- Modify: `.github/pull_request_template.md` — root mirror; produced by running the `bootstrap` skill in realignment mode against this repo and accepting its proposed root diff. Must be byte-identical to the source after the edit.

No new files. No script changes. No fixture changes.

## Workstreams

- **W1 — Template edit (R1, R2, R3, R4 in source).** Tasks T1–T4 land all four rendered prompts in the bootstrap source template.
- **W2 — Round-trip mirror (R8, AC-90-4).** Task T5 produces the byte-identical root mirror via the bootstrap skill in realignment mode.
- **W3 — Sanity & regression checks.** Task T6 verifies `docs/ac-traceability.md` has no direct contradiction with the new rendered orientation. Task T7 runs `scripts/check-pr-template-checkboxes.mjs` to confirm the per-AC grammar still parses. Task T8 runs `markdownlint-cli2` on changed files. Task T9 runs the rendered-visibility greps from the design's GREEN-phase verifier.
- **W4 — Commit.** Task T10 stages the template change and the root mirror together and commits with a `feat:` message per AGENTS.md path-first rule.

---

## Task 1 — T1: Restructure `## What changed` to render `Context:` and the rationale-bearing bullet shape (R1, AC-90-1)

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md` — the `## What changed` section (lines 24–26 in the current file: heading, blank line, single empty bullet `-`).

**Goal:** The rendered template body must, after the author fills it, contain a `Context:` line and bullets that pair the change with its rationale. Detailed how-to-phrase guidance stays in HTML comments per template convention; the rendered body shows the *placeholder structure*, not lecturing prose.

- [ ] **Step 1: Read the current `## What changed` section to ground the edit**

  Open `skills/bootstrap/templates/core/.github/pull_request_template.md` and locate the `## What changed` heading and the empty bullet beneath it.

- [ ] **Step 2: Replace the empty bullet with a rendered `Context:` placeholder line and a rationale-bearing bullet shape, and add an HTML comment that documents the placeholder semantics for authors**

  Replace this block:

  ```markdown
  ## What changed

  -
  ```

  With this block:

  ```markdown
  ## What changed

  Context: <prior PR, prior QA pass, or follow-up issue this PR builds on, or `standalone — <reason>` when there is none>

  - <change> — <why>

  <!--
    The rendered `Context:` line and `- <change> — <why>` bullet shape are the
    structural placeholders this section requires. Replace `<...>` with actual
    values; do not delete the `Context:` line. When this PR has no prior
    context, write `Context: standalone — <reason>` (e.g.
    `Context: standalone — first pass on the new lint rule`). One bullet per
    change; the `— <why>` half states the rationale (user-visible reason or
    triggering observation), not a restatement of the change.
  -->
  ```

  Rules the implementer must follow when typing this in:

  - Use the exact ASCII `--` em-dash placeholder character `—` (U+2014). The codebase already uses `—` in the design and verifier wording, so this matches.
  - Keep the rendered `Context:` line at exactly one line (R7 calibration: R1 ≈ 1 rendered line plus the bullet-shape change).
  - The bullet stays as a single placeholder bullet so the rendered template is still ~one screen above `## Acceptance criteria`.
  - Do not add a rendered "fill these in" prose sentence above or below the placeholder. Author guidance lives in the HTML comment.

- [ ] **Step 3: Verify the rendered body now carries `Context:` and the rationale bullet shape**

  Run, from the worktree root:

  ```bash
  sed -e '/<!--/,/-->/d' skills/bootstrap/templates/core/.github/pull_request_template.md | grep -F 'Context:'
  sed -e '/<!--/,/-->/d' skills/bootstrap/templates/core/.github/pull_request_template.md | grep -F '— <why>'
  ```

  Expected: each command prints the matching line at least once and exits 0.

**AC traceability:** AC-90-1 (rendered structure forces context + per-bullet rationale).

**Verification method:** rendered-visibility grep above (HTML-comment-stripped). Aggregate verification in T9.

---

## Task 2 — T2: Add a rendered four-symbol legend under `## Test coverage` (R2, AC-90-2)

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md` — the `## Test coverage` section, between the heading and the existing HTML comment block (the legend goes *before* the HTML comment so the rendered body shows it; the existing comment block remains as the in-comment reference).

**Goal:** Place the four-symbol legend in the rendered body using #87's already-shipped wording (already present verbatim inside the existing HTML comment at lines 56–62). Move equivalent wording into the rendered body without removing the in-comment copy — the existing comment block also explains the matrix-cell rules and stays.

- [ ] **Step 1: Insert a rendered legend block immediately after the `## Test coverage` heading, before the existing `<!--` block**

  After the line `## Test coverage` and a blank line, insert:

  ```markdown
  Legend for status cells:

  - ✅ — required validation passed with no known relevant gap for this column.
  - ⚠️ — validation exists and is sufficient to merge with a known non-blocking gap documented under the AC.
  - ❌ — required validation is missing, failing, pending, or merge-blocked.
  - ➖ — not relevant to this AC.
  ```

  Rules:

  - Use the four symbols exactly as listed (`✅`, `⚠️`, `❌`, `➖`). The `⚠️` glyph is the variation-selector form already used in the existing template; copy it verbatim from the existing HTML comment so byte-equivalence is preserved.
  - The phrasing must keep the unique anchor phrases the design's GREEN-phase verifier greps for: `required validation passed` (✅), `non-blocking gap documented` (⚠️), `merge-blocked` (❌), `not relevant` (➖). The bullets above contain all four anchors verbatim.
  - This is 5 rendered lines (1 lead-in + 4 bullets), which fits R7's R2 calibration of 4–6 lines.
  - Do not delete the existing HTML comment legend at lines 56–62; it explains matrix-cell rules in addition to the symbols and remains useful to authors.

- [ ] **Step 2: Verify each anchor phrase is present in the rendered body**

  ```bash
  sed -e '/<!--/,/-->/d' skills/bootstrap/templates/core/.github/pull_request_template.md | grep -F 'required validation passed'
  sed -e '/<!--/,/-->/d' skills/bootstrap/templates/core/.github/pull_request_template.md | grep -F 'non-blocking gap documented'
  sed -e '/<!--/,/-->/d' skills/bootstrap/templates/core/.github/pull_request_template.md | grep -F 'merge-blocked'
  sed -e '/<!--/,/-->/d' skills/bootstrap/templates/core/.github/pull_request_template.md | grep -F 'not relevant'
  ```

  Expected: each command prints at least one line and exits 0.

**AC traceability:** AC-90-2 (symbol legend visible in rendered body).

**Verification method:** four anchor-phrase greps above.

---

## Task 3 — T3: Add a rendered one-line clarification of the `AC` column under `## Test coverage` (R3, AC-90-2)

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md` — the `## Test coverage` section, immediately after the legend block from T2 and before the existing HTML comment.

**Goal:** Render one line that defines what the `AC` column references, so a reviewer never opening `docs/ac-traceability.md` can interpret the column.

- [ ] **Step 1: Insert the clarification line after the legend block**

  Add a blank line, then this single rendered line, then a blank line, before the existing `<!--` HTML comment:

  ```markdown
  The `AC` column references the acceptance-criteria IDs from the linked issue, in `AC-<issue>-<n>` form.
  ```

  Rules:

  - Exactly one rendered line (R7 R3 calibration: ≈ 1 line).
  - Must contain the literal phrase `acceptance-criteria IDs` so the design's GREEN-phase verifier grep matches.
  - Backticks around `AC` and `AC-<issue>-<n>` render as inline code on GitHub; this is intentional.

- [ ] **Step 2: Verify the rendered AC-column clarification anchor is present**

  ```bash
  sed -e '/<!--/,/-->/d' skills/bootstrap/templates/core/.github/pull_request_template.md | grep -F 'acceptance-criteria IDs'
  ```

  Expected: prints at least one line and exits 0.

**AC traceability:** AC-90-2 (rendered `AC`-column meaning).

**Verification method:** anchor-phrase grep above.

---

## Task 4 — T4: Add a rendered orientation under `## Acceptance criteria` (R4, AC-90-3)

**Files:**

- Modify: `skills/bootstrap/templates/core/.github/pull_request_template.md` — the `## Acceptance criteria` section, immediately after the heading and before the existing `<!--` HTML comment that documents the per-AC content order.

**Goal:** Two short rendered lines that answer (a) what an evidence row attests to and (b) where reviewers find manual-test steps. Must point at the canonical `Operator check:` rows and at the colon-style evidence row format without retiring or paraphrasing those labels in a way that contradicts `docs/ac-traceability.md`.

- [ ] **Step 1: Insert the orientation block immediately after the `## Acceptance criteria` heading**

  After the heading and a blank line, before the existing `<!--` block, insert:

  ```markdown
  Evidence rows take the form `<Platform> test: <command, workflow job, tool, or harness>, <environment>[, <link, verifier, or ISO>]` — the trailing field is who or what proves the test ran.

  Reviewers and QA exercising the change manually follow the `Operator check:` rows under each AC.
  ```

  Rules:

  - 2 rendered prose lines plus the surrounding blank lines (R7 R4 calibration: ≈ 2–3 lines).
  - Must contain the literal word `evidence` so the design's GREEN-phase verifier grep matches.
  - Must keep the canonical evidence-row shape verbatim — copy it from the existing HTML comment at line 94 of the current template so the rendered orientation does not drift from the in-comment grammar that `docs/ac-traceability.md` describes.
  - Must reference the literal label `Operator check:` (with colon and backticks) so the rendered orientation points readers at the existing CI-validated rows rather than inventing a new section name.
  - Do not enumerate the AC heading structure (outcome, checkboxes); that is already visible from the existing headings and bullets.

- [ ] **Step 2: Verify the rendered AC-section anchors are present**

  ```bash
  sed -e '/<!--/,/-->/d' skills/bootstrap/templates/core/.github/pull_request_template.md | grep -F 'evidence'
  sed -e '/<!--/,/-->/d' skills/bootstrap/templates/core/.github/pull_request_template.md | grep -F 'Operator check:'
  ```

  Expected: each command prints at least one line. The `Operator check:` grep will also match the existing placeholder row at the bottom of the section (line 141 in the current template); that is fine — the assertion is "rendered body mentions `Operator check:`", which is true of the new orientation line as well.

- [ ] **Step 3: Sanity-check the R7 budget**

  ```bash
  git diff --stat skills/bootstrap/templates/core/.github/pull_request_template.md
  ```

  Expected: rendered additions across T1–T4 stay within the design's R7 budget (~15 rendered lines combined). HTML comment additions are not counted against the budget but must remain bounded (the only HTML comment added by this plan is the small author-guidance comment in T1).

**AC traceability:** AC-90-3 (rendered orientation answers QA's two unanswered questions).

**Verification method:** anchor-phrase greps above plus diff-stat budget check.

---

## Task 5 — T5: Round-trip the template change to the root via the bootstrap skill in realignment mode (R8, AC-90-4)

**Files:**

- Modify: `.github/pull_request_template.md` — produced by running the `bootstrap` skill in realignment mode and accepting its proposed root diff for this file.

**Goal:** The root template ends byte-identical to the bootstrap template source. Hand-editing the root file directly is forbidden by the design's loophole closure.

- [ ] **Step 1: Confirm pre-state**

  ```bash
  cmp -s skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md && echo "identical" || echo "drifted"
  ```

  Expected at this point: `drifted` (T1–T4 just edited the source template). If it prints `identical`, T1–T4 did not save; go back and fix.

- [ ] **Step 2: Trigger the local `bootstrap` skill in realignment mode**

  Invoke the `bootstrap` skill against this repo in realignment mode. The skill is shipped at `skills/bootstrap/SKILL.md` and is also registered as a slash-command/skill on this machine (`bootstrap`). The implementer launches it and instructs it to:

  1. Realign this repository (the worktree at `/Users/tlmader/dev/patinaproject-org/bootstrap/.claude/worktrees/busy-cartwright-e09ba4`) against the bootstrap templates.
  2. Limit the proposed diff to `.github/pull_request_template.md` (other root files must already be in sync; if the skill reports unrelated drift, halt and surface it to the operator before continuing).
  3. Apply the proposed root-file change so it matches `skills/bootstrap/templates/core/.github/pull_request_template.md` byte-for-byte.

  If the bootstrap skill is not directly invocable in this environment, the equivalent realignment-mode action for this single file is to copy the source template to the root path verbatim:

  ```bash
  cp skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md
  ```

  The implementer should prefer the skill invocation; the `cp` fallback is acceptable only because for this one file realignment mode is a verbatim copy, and the same `cmp -s` check in Step 3 enforces the outcome either way.

- [ ] **Step 3: Verify byte-identical parity**

  ```bash
  cmp -s skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md && echo "identical" || echo "drifted"
  ```

  Expected: `identical`. If `drifted`, do not commit; fix the root mirror until `cmp -s` exits 0.

**AC traceability:** AC-90-4 (round-trip parity).

**Verification method:** `cmp -s` exit 0.

---

## Task 6 — T6: Sanity-check `docs/ac-traceability.md` for direct contradiction with the new rendered orientation

**Files:**

- Read-only check: `docs/ac-traceability.md`.

**Goal:** Confirm the rendered orientation added in T4 does not contradict `docs/ac-traceability.md`. The plan's default outcome is "no edit needed" — the design's Implementation Shape #3 says "update only if a direct contradiction exists".

- [ ] **Step 1: Read the relevant paragraph**

  Read the "Test coverage and per-AC verification rows" paragraph in `docs/ac-traceability.md`. It currently states the canonical PR template at `.github/pull_request_template.md` is the source of truth for the colon-style platform-test row format and points at the template's own comments.

- [ ] **Step 2: Compare against T4's wording**

  The T4 orientation states:

  > Evidence rows take the form `<Platform> test: <command, workflow job, tool, or harness>, <environment>[, <link, verifier, or ISO>]` — the trailing field is who or what proves the test ran.
  > Reviewers and QA exercising the change manually follow the `Operator check:` rows under each AC.

  Verify that this wording is consistent with `docs/ac-traceability.md`'s claim that the template is the source of truth and uses the colon-style row. Both reference the same canonical shape.

- [ ] **Step 3: Decide**

  Expected outcome: no edit to `docs/ac-traceability.md`. The doc already defers grammar to the PR template; T4 paraphrases that grammar verbatim from the existing HTML comment, so no contradiction is introduced.

  If the implementer finds a direct contradiction (e.g. the doc independently states a different evidence-row shape that T4's wording disagrees with), halt and route back to the Brainstormer rather than rewriting requirements yourself.

**AC traceability:** R5 / design Implementation Shape #3 (no scope creep into doc rewrite unless required).

**Verification method:** read-and-decide above; expected default is no change.

---

## Task 7 — T7: Run the per-AC grammar regression check

**Files:**

- Read-only run: `scripts/check-pr-template-checkboxes.mjs` and fixtures under `scripts/fixtures/pr-template-checkboxes/`.

**Goal:** Confirm the existing CI script still parses `Test gap:`, `Non-blocking gap:`, and `Operator check:` correctly against the unchanged fixtures. The new rendered prompts must not break the script (R5).

- [ ] **Step 1: Run the script**

  ```bash
  node scripts/check-pr-template-checkboxes.mjs
  ```

  Expected: exit 0 with no error output. The fixtures listed under `scripts/fixtures/pr-template-checkboxes/` (16 files; verified at plan-authoring time) must all still pass. If the script complains about a fixture or about the canonical template, do not modify the fixture or the script — instead halt and re-read T1–T4. The most likely cause is that one of the new rendered lines accidentally introduced a `Test gap:` / `Non-blocking gap:` / `Operator check:` substring outside its expected per-AC location; fix the template wording.

**AC traceability:** R5 (no machine-validated contract drift).

**Verification method:** script exit code.

---

## Task 8 — T8: Run `markdownlint-cli2` on the changed files

**Files:**

- Read-only lint run.

**Goal:** Pre-commit hook (`pre-commit` runs `lint-staged` which invokes `markdownlint-cli2` on staged `*.md`). Run the linter explicitly before staging so commit-time failures are caught early.

- [ ] **Step 1: Lint both changed files**

  ```bash
  pnpm exec markdownlint-cli2 \
    skills/bootstrap/templates/core/.github/pull_request_template.md \
    .github/pull_request_template.md
  ```

  Expected: exit 0 with no rule violations. If the linter complains about line length, list-marker indentation, or trailing spaces, fix the wording in the bootstrap source template, re-run T5 to mirror to root, then re-run this step.

**AC traceability:** infrastructure (Husky pre-commit gate).

**Verification method:** linter exit code.

---

## Task 9 — T9: Run the full GREEN-phase rendered-visibility verifier from the design

**Goal:** Execute the design's GREEN-phase verification block end to end against the root file, reproducing the design's expected matches.

- [ ] **Step 1: Byte-parity check**

  ```bash
  cmp -s skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md && echo "OK"
  ```

  Expected: `OK`.

- [ ] **Step 2: Rendered-visibility anchor greps (R1, R2, R3, R4 in one batch)**

  ```bash
  STRIPPED=$(sed -e '/<!--/,/-->/d' .github/pull_request_template.md)
  printf '%s\n' "$STRIPPED" | grep -F 'Context:'
  printf '%s\n' "$STRIPPED" | grep -F '— <why>'
  printf '%s\n' "$STRIPPED" | grep -F 'required validation passed'
  printf '%s\n' "$STRIPPED" | grep -F 'non-blocking gap documented'
  printf '%s\n' "$STRIPPED" | grep -F 'merge-blocked'
  printf '%s\n' "$STRIPPED" | grep -F 'not relevant'
  printf '%s\n' "$STRIPPED" | grep -F 'acceptance-criteria IDs'
  printf '%s\n' "$STRIPPED" | grep -F 'evidence'
  ```

  Expected: every grep prints at least one line and exits 0. If any grep prints nothing, the corresponding rendered prompt is missing or the wording lost its anchor phrase; fix it in the bootstrap source template, re-run T5, re-run this step.

- [ ] **Step 3: Token-budget spot-check**

  ```bash
  git diff --stat skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md
  ```

  Expected: rendered additions ≈ 10–13 lines combined (R7 budget ~15). If substantially over budget, simplify the wording before committing.

**AC traceability:** AC-90-1, AC-90-2, AC-90-3, AC-90-4 (aggregate verifier).

**Verification method:** all greps + `cmp -s` + diff-stat must succeed.

---

## Task 10 — T10: Stage and commit the template change and the root mirror together

**Files:**

- Stage: `skills/bootstrap/templates/core/.github/pull_request_template.md`
- Stage: `.github/pull_request_template.md`

**Goal:** One commit covering both the source-of-truth edit and its root mirror, typed `feat:` per AGENTS.md path-first rule (the change touches `skills/bootstrap/templates/**` and `.github/pull_request_template.md`, both product-surface globs).

- [ ] **Step 1: Stage both files explicitly**

  ```bash
  git add \
    skills/bootstrap/templates/core/.github/pull_request_template.md \
    .github/pull_request_template.md
  ```

  Do not use `git add -A` or `git add .` — AGENTS.md guidance is to stage specific files to avoid sweeping in unrelated changes.

- [ ] **Step 2: Commit with a `feat:` message**

  Use a heredoc for the commit message body. Example title (Reviewer/Finisher may refine on PR creation; the squash-merge title rule requires this exact `type: #issue short description` shape):

  ```bash
  git commit -m "$(cat <<'EOF'
  feat: #90 render context, legend, AC column meaning, and evidence orientation

  Adds the smallest set of rendered prompts that close QA's reported parsing
  gaps without touching the machine-validated per-AC grammar:

  - `## What changed`: rendered `Context:` line and `- <change> — <why>`
    bullet shape (R1, AC-90-1).
  - `## Test coverage`: rendered legend for ✅ ⚠️ ❌ ➖ using #87's wording
    and a one-line clarification of the `AC` column (R2 + R3, AC-90-2).
  - `## Acceptance criteria`: rendered orientation pointing at the
    colon-style evidence row format and at `Operator check:` rows for
    manual exercise (R4, AC-90-3).

  Round-trip: edited the bootstrap template source first, mirrored the
  root template via the bootstrap skill in realignment mode in the same
  commit (R8, AC-90-4).

  Out of scope (R5): `scripts/check-pr-template-checkboxes.mjs`, the
  fixtures under `scripts/fixtures/pr-template-checkboxes/`, and the
  labels `Test gap:`, `Non-blocking gap:`, `Operator check:`, the
  colon-style evidence row, and `<!-- pr-checkbox: optional -->`.
  EOF
  )"
  ```

  Rules:

  - Subject line ≤ 72 characters and exactly matches the `type: #<issue> short description` shape (commitlint enforces).
  - Type is `feat:` (path-first rule: any diff touching `skills/bootstrap/templates/**` or `.github/pull_request_template.md` cannot be `docs:` or `chore:`).
  - The pre-commit hook will run `markdownlint-cli2` on staged `*.md`. T8 already ran the linter, so this should pass.
  - Do not skip hooks (`--no-verify` is forbidden by AGENTS.md).
  - Do not amend a previous commit.

- [ ] **Step 3: Verify the commit landed**

  ```bash
  git status
  git log -1 --pretty=fuller
  ```

  Expected: working tree clean, latest commit is the `feat: #90 ...` commit, both files appear in `git show --stat HEAD`.

**AC traceability:** all four ACs are now backed by a single commit on the working branch; round-trip parity is preserved by staging both files together.

**Verification method:** `git status` clean + `git log` shows the commit + `git show --stat HEAD` lists both files.

---

## Aggregate verification before handoff to Reviewer

Before handing off to Reviewer, the implementer must confirm the following from the worktree root, in this order, and all must succeed:

1. `cmp -s skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md` exits 0.
2. The eight rendered-visibility greps from T9 Step 2 all match.
3. `node scripts/check-pr-template-checkboxes.mjs` exits 0.
4. `pnpm exec markdownlint-cli2 skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md` exits 0.
5. `git diff --stat HEAD~1 HEAD` shows only the two template files changed; no fixture, script, or unrelated file was touched.
6. `git log -1 --pretty=%s` matches the regex `^feat: #90 .+` and is ≤ 72 characters.

If any of these fail, the implementer fixes the wording in the bootstrap source template, re-runs T5, and re-runs the aggregate checks. Do not adjust `scripts/check-pr-template-checkboxes.mjs`, fixtures, or `docs/ac-traceability.md` to make a check pass — those are out-of-scope per design R5.

## Blockers

None at plan-authoring time. The design is approved, the source-of-truth and root template are byte-identical pre-edit (`cmp -s` confirmed), the CI script and fixtures exist and are intentionally untouched, and the bootstrap skill is available at `skills/bootstrap/SKILL.md`.

## Self-review notes

- **Spec coverage:** R1 ↔ T1; R2 ↔ T2; R3 ↔ T3; R4 ↔ T4; R5 ↔ T7 (regression check) + W3 scope guard; R6 ↔ rules embedded in T1, T2, T4 (no surface-specific copy in rendered body); R7 ↔ T4 Step 3 + T9 Step 3 budget checks; R8 ↔ T5 + T9 Step 1; R9 ↔ ownership clauses in design preserved (no plan task changes ownership). All four ACs (AC-90-1..AC-90-4) have at least one task whose verification step is the design's named verifier for that AC.
- **No placeholders:** every step contains the exact wording, command, file path, and expected output the implementer needs.
- **Type consistency:** the four anchor phrases (`required validation passed`, `non-blocking gap documented`, `merge-blocked`, `not relevant`) are used identically in T2 (template wording), T9 (verifier greps), and align with the design's GREEN-phase verifier. The colon-style evidence row format is reproduced verbatim across T4 (template wording) and the design's Cross-Reference paragraph.
