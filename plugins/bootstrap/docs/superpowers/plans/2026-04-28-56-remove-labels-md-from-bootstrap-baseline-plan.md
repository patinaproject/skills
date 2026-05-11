# Plan: Remove LABELS.md from bootstrap baseline and rely on `gh label list` instead [#56](https://github.com/patinaproject/bootstrap/issues/56)

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking. Each task lists exact files, edits, and an ATDD verification command that the Executor runs before claiming completion.

**Goal:** Eliminate every `LABELS.md` reference from the bootstrap baseline (skill, templates, audit checklist, repo-root contracts, issue templates) and delete `.github/LABELS.md`, leaving `gh label list` as the sole runtime authority.

**Architecture:** Mechanical removal across a fixed file list. No new code paths. The change spans the bootstrap skill surface (audit checklist, SKILL body, templates) and the repo-root contract surface (AGENTS.md prose plus the covered-files list, both issue templates, and the file deletion).

**Tech Stack:** Markdown, shell verifications (`test`, `grep`, `git`), `markdownlint-cli2`.

## Design reference

- Approved design doc: [`docs/superpowers/specs/2026-04-28-56-remove-labels-md-from-bootstrap-baseline-design.md`](../specs/2026-04-28-56-remove-labels-md-from-bootstrap-baseline-design.md)
- Approved at SHA: `d460f8e`

All ACs (AC-56-1 through AC-56-8) are quoted from that design and are mechanically observable.

## Locked-in decisions

These were resolved during planning so the Executor does not re-derive them:

1. `.github/LABELS.md` is **deleted** outright. No stub, no redirect, no "moved" note. (AC-56-1.)
2. The `Source of truth` covered-files list in `AGENTS.md` **drops** the `.github/LABELS.md` bullet. A round-trip claim with no template is incoherent. (AC-56-3 + the design's "Repo-root contract surfaces" subsection.)
3. The `AGENTS.md` "Issue and PR labels" lead paragraph is rewritten verbatim as:

   ```markdown
   Use `gh label list` as the source of truth for the live label inventory; rely on each label's `description` when picking one. Create new labels with `gh label create` (or the GitHub UI) against the live repo – do not track labels in a Markdown file.
   ```

   The `gh label list --json name,description --jq '.[] | select(.description == "")'` verification snippet and the `Verify every label has a non-empty description:` lead-in stay exactly as on `main`. (AC-56-4.)
4. Issue templates have the `Labels: see .github/LABELS.md.` clause **removed**, not replaced. Operators rely on `gh label list`. (AC-56-5.)
5. The audit-checklist row at line 41 is **deleted in full**, not softened. The autorelease rows below stay. (AC-56-2.)
6. The implementation commit type is **`feat:`**, not `docs:`. The bootstrap baseline (audit checklist, AGENTS.md contract, emitted templates) is a shipped product surface; per the AGENTS.md commit-type table, edits that change shipped behavior in skill/contract/template files are `feat:`. The earlier `d460f8e` `docs: #56 ...` commit covers the design doc only.

## Out of scope reminders (from design)

- Do **not** edit any pre-existing file under `docs/superpowers/specs/` or `docs/superpowers/plans/`. The only additions on this branch under those paths are the design doc (already committed at `d460f8e`) and this plan doc. (AC-56-8.)
- Do **not** touch the release-please reservation paragraph in `AGENTS.md` naming `autorelease: pending` and `autorelease: tagged` and the PR-title-lint skip rule. It must remain byte-identical to `main`. (AC-56-7.)
- Do **not** introduce a new mechanism for codifying labels in code (no YAML labels file, no sync script). Out of scope for this issue.
- Do **not** modify the `using-github` skill.

## Blockers

`blockers: []`

## Workstreams / Tasks

### Task T-56-1: Remove `.github/LABELS.md` audit row from the bootstrap audit checklist

**Files:**

- Modify: `skills/bootstrap/audit-checklist.md` (delete the table row currently at line 41)

**ACs satisfied:** AC-56-2, AC-56-6 (partial – combined with T-56-2 and T-56-3).

- [ ] **Step 1: Delete the row in full.**

  Remove the entire table row whose first cell is the inline-code token `.github/LABELS.md`. Do not soften, do not condition on agent-plugin mode. The row covers everything from the leading pipe to the trailing pipe and ends with the cell containing `autorelease: tagged`. The two adjacent rows (`.github/CODEOWNERS` above, `.github/workflows/lint-pr.yml` below) become contiguous.

- [ ] **Step 2: Verify the row is gone.**

  Run: `grep -n 'LABELS.md' skills/bootstrap/audit-checklist.md`
  Expected: exit code 1, no output.

### Task T-56-2: Scrub remaining `LABELS.md` references in the bootstrap skill body and templates

**Files:**

- Modify: `skills/bootstrap/SKILL.md` (only if a `LABELS.md` reference is present after T-56-1; the design notes line 161 already favours `gh label list`, but verify no collateral mention remains in the surrounding bullets)
- Verify-only: `skills/bootstrap/templates/**` (must contain zero matches; design states this is already the case and must remain so)

**ACs satisfied:** AC-56-6.

- [ ] **Step 1: Search the entire bootstrap skill tree.**

  Run: `grep -rn 'LABELS.md' skills/bootstrap/`
  If any line outside `audit-checklist.md` (already cleaned in T-56-1) appears, edit the matching file to remove the reference. Replacement wording, where prose is required, mirrors AGENTS.md decision 3 above: name `gh label list` as the source of truth.

- [ ] **Step 2: Verify zero matches across the bootstrap surface.**

  Run: `grep -rn 'LABELS.md' skills/bootstrap/`
  Expected: exit code 1, no output. (This is the AC-56-6 gate.)

### Task T-56-3: Update `AGENTS.md` covered-files list and "Issue and PR labels" prose

**Files:**

- Modify: `AGENTS.md` (line 27 bullet removal; lines 100–108 prose rewrite)

**ACs satisfied:** AC-56-3, AC-56-4, AC-56-7 (preservation check).

- [ ] **Step 1: Drop the covered-files bullet.**

  In the `Covered files (any change here must round-trip through a template edit):` list, delete the bullet whose token is `.github/LABELS.md`. The bullets immediately above (token `.github/copilot-instructions.md`) and below (token `RELEASING.md`) become contiguous.

- [ ] **Step 2: Rewrite the lead paragraph of "Issue and PR labels".**

  Replace the existing paragraph that begins `[.github/LABELS.md](.github/LABELS.md) is the source of truth ...` with this exact text (single paragraph, no list):

  ```markdown
  Use `gh label list` as the source of truth for the live label inventory; rely on each label's `description` when picking one. Create new labels with `gh label create` (or the GitHub UI) against the live repo – do not track labels in a Markdown file.
  ```

  Keep the next line `Verify every label has a non-empty description:` and the fenced `gh label list --json name,description --jq '.[] | select(.description == "")'` block exactly as on `main`. Keep the release-please paragraph that follows (the one beginning "The `autorelease: pending` and `autorelease: tagged` labels are reserved ...") verbatim.

- [ ] **Step 3: Verify zero `LABELS.md` matches in `AGENTS.md`.**

  Run: `grep -n 'LABELS.md' AGENTS.md`
  Expected: exit code 1, no output. (AC-56-3 gate.)

- [ ] **Step 4: Verify the verification snippet survived.**

  Run: `grep -n "gh label list --json name,description" AGENTS.md`
  Expected: exit code 0, exactly one match within the "Issue and PR labels" section. (AC-56-4 gate.)

- [ ] **Step 5: Verify the release-please paragraph is untouched.**

  Run: `git diff main -- AGENTS.md | grep -E '^[-+].*autorelease: (pending|tagged)' || true`
  Expected: no `+` or `-` lines reference `autorelease: pending` or `autorelease: tagged`. (AC-56-7 gate.)

### Task T-56-4: Remove `LABELS.md` clause from repo-root issue templates

**Files:**

- Modify: `.github/ISSUE_TEMPLATE/bug_report.md` (line 8 HTML comment)
- Modify: `.github/ISSUE_TEMPLATE/feature_request.md` (line 8 HTML comment)

**ACs satisfied:** AC-56-5.

- [ ] **Step 1: Edit `bug_report.md` line 8.**

  Replace:

  ```markdown
  <!-- Title: plain-language summary (no `fix:` prefix). Labels: see .github/LABELS.md. -->
  ```

  With:

  ```markdown
  <!-- Title: plain-language summary (no `fix:` prefix). -->
  ```

- [ ] **Step 2: Edit `feature_request.md` line 8.**

  Replace:

  ```markdown
  <!-- Title: plain-language summary (no `feat:` prefix). Labels: see .github/LABELS.md. -->
  ```

  With:

  ```markdown
  <!-- Title: plain-language summary (no `feat:` prefix). -->
  ```

- [ ] **Step 3: Verify zero matches.**

  Run: `grep -n 'LABELS.md' .github/ISSUE_TEMPLATE/*.md`
  Expected: exit code 1, no output. (AC-56-5 gate.)

- [ ] **Step 4: Confirm no template edit is required.**

  Run: `grep -rn 'LABELS.md' skills/bootstrap/templates/core/.github/ISSUE_TEMPLATE/`
  Expected: exit code 1, no output. The templated versions never carried the clause; this edit closes drift rather than introducing it. No mirroring is required.

### Task T-56-5: Delete `.github/LABELS.md`

**Files:**

- Delete: `.github/LABELS.md`

**ACs satisfied:** AC-56-1.

- [ ] **Step 1: Remove the file via git.**

  Run: `git rm .github/LABELS.md`

- [ ] **Step 2: Verify absence.**

  Run: `test ! -e .github/LABELS.md`
  Expected: exit code 0. (AC-56-1 gate.)

### Task T-56-6: Lint and final AC sweep

**Files:** none modified.

**ACs satisfied:** AC-56-1 through AC-56-8 (full sweep).

- [ ] **Step 1: Markdown lint.**

  Run: `pnpm lint:md`
  Expected: exit code 0. If any rule fires on `AGENTS.md`, fix in place (most likely MD013 line length on the rewritten paragraph; if so, leave the paragraph as a single sentence-per-line wrap consistent with the surrounding file).

- [ ] **Step 2: AC-56-1 – file absence.**

  Run: `test ! -e .github/LABELS.md && echo AC-56-1-OK`
  Expected: prints `AC-56-1-OK`.

- [ ] **Step 3: AC-56-2 – audit checklist clean.**

  Run: `grep -n 'LABELS.md' skills/bootstrap/audit-checklist.md && exit 1 || echo AC-56-2-OK`
  Expected: prints `AC-56-2-OK`.

- [ ] **Step 4: AC-56-3 – AGENTS.md clean.**

  Run: `grep -n 'LABELS.md' AGENTS.md && exit 1 || echo AC-56-3-OK`
  Expected: prints `AC-56-3-OK`.

- [ ] **Step 5: AC-56-4 – `gh label list` authority and verification snippet preserved.**

  Run:

  ```bash
  grep -n "gh label list" AGENTS.md \
    && grep -n "gh label list --json name,description --jq '.\[\] | select(.description == \"\")'" AGENTS.md \
    && echo AC-56-4-OK
  ```

  Expected: prints both grep matches and then `AC-56-4-OK`.

- [ ] **Step 6: AC-56-5 – issue templates clean.**

  Run: `grep -n 'LABELS.md' .github/ISSUE_TEMPLATE/*.md && exit 1 || echo AC-56-5-OK`
  Expected: prints `AC-56-5-OK`.

- [ ] **Step 7: AC-56-6 – bootstrap skill tree clean.**

  Run: `grep -rn 'LABELS.md' skills/bootstrap/ && exit 1 || echo AC-56-6-OK`
  Expected: prints `AC-56-6-OK`.

- [ ] **Step 8: AC-56-7 – release-please reservation untouched.**

  Run:

  ```bash
  git diff main -- AGENTS.md | grep -E '^[-+].*autorelease: (pending|tagged)' && exit 1 || echo AC-56-7-OK
  ```

  Expected: prints `AC-56-7-OK`.

- [ ] **Step 9: AC-56-8 – historical Superpowers artifacts untouched.**

  Run:

  ```bash
  git diff --name-only main...HEAD -- docs/superpowers/specs docs/superpowers/plans \
    | grep -vE '^docs/superpowers/(specs|plans)/2026-04-28-56-remove-labels-md-from-bootstrap-baseline-(design|plan)\.md$' \
    && exit 1 || echo AC-56-8-OK
  ```

  Expected: prints `AC-56-8-OK`. The only files in the diff under those paths are the design doc and this plan doc.

## Commit strategy

Two commits land on this branch:

1. `d460f8e` (already on the branch): `docs: #56 add design for removing LABELS.md baseline` – the design doc only. No baseline edits.
2. **This implementation commit (Executor creates):** a single `feat:` commit covering Tasks T-56-1 through T-56-5 (T-56-6 is verification only and produces no diff).

   Commit command:

   ```bash
   git add \
     skills/bootstrap/audit-checklist.md \
     AGENTS.md \
     .github/ISSUE_TEMPLATE/bug_report.md \
     .github/ISSUE_TEMPLATE/feature_request.md
   git rm .github/LABELS.md  # if not already staged via T-56-5
   git add docs/superpowers/plans/2026-04-28-56-remove-labels-md-from-bootstrap-baseline-plan.md  # only if uncommitted at execution time
   git commit -m "feat: #56 remove LABELS.md from bootstrap baseline"
   ```

   **Why `feat:` and not `docs:`.** Per AGENTS.md "Commit type selection", changes that alter shipped behavior in skill files, audit checklists, plugin metadata, generated agent instructions, or other user-visible configuration are `feat:`. This change alters the bootstrap audit contract (target repos no longer need `.github/LABELS.md`) and the repo-root contract surfaces emitted by the bootstrap skill – both shipped product surfaces. A `docs:` commit here would be a non-bumping type for a behavior-changing edit, which the AGENTS.md rules explicitly forbid for changes that should produce a release.

If T-56-6 surfaces a lint failure that requires editing `AGENTS.md`, fold the fix into the same `feat:` commit (or, if already committed, create a follow-up `feat: #56 ...` commit – never `--amend`).

## Self-review

- **Spec coverage.** Each AC maps to at least one task: AC-56-1 → T-56-5; AC-56-2 → T-56-1; AC-56-3 → T-56-3; AC-56-4 → T-56-3; AC-56-5 → T-56-4; AC-56-6 → T-56-2; AC-56-7 → T-56-3 step 5 + T-56-6 step 8; AC-56-8 → T-56-6 step 9. T-56-6 re-runs every AC as a final gate.
- **Placeholder scan.** No "TBD", "later", or "appropriate"; every step shows the exact text to remove or replace.
- **Type/identifier consistency.** File paths and grep patterns match across tasks; the AGENTS.md replacement paragraph appears once verbatim in decision 3 and is referenced (not retyped with drift) in T-56-3 step 2.
