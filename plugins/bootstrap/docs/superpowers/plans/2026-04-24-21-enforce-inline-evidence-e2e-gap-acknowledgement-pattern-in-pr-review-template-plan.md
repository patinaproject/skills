# Plan: Enforce inline evidence + E2E gap acknowledgement pattern in PR review template [#21](https://github.com/patinaproject/bootstrap/issues/21)

Approved design: [`../specs/2026-04-24-21-enforce-inline-evidence-e2e-gap-acknowledgement-pattern-in-pr-review-template-design.md`](../specs/2026-04-24-21-enforce-inline-evidence-e2e-gap-acknowledgement-pattern-in-pr-review-template-design.md) at commit `7f814b7`.

## Strategy

Single workstream, three file edits, one verification pass. The template change is small and localized; the `AGENTS.md` "source of truth" rule requires editing the template first and mirroring the root file byte-identically.

## Task T-21-1: Update the bootstrap PR template source

**File**: `skills/bootstrap/templates/core/.github/pull_request_template.md`

Replace the `## Acceptance criteria` section so each per-AC block renders:

```markdown
### AC-<issue>-<n>

Short outcome summary.

<!--
  One evidence row per required platform. Fields are pipe-separated in fixed order:
  runner | env | @handle | ISO (UTC). Omit the evidence rows only for ACs marked [platform: none].
  Do not use detached `- Evidence:` bullets.
-->
- [ ] <Platform> evidence – <runner> | <env> | @<handle> | <ISO>
<!--
  E2E gap row is REQUIRED on every AC. If automated coverage is comprehensive,
  state that explicitly: `no known gap: <reason>`.
  Reject stand-ins: `none required`, `n/a`, `not applicable`, `automated coverage is sufficient`.
  Reviewer must check this box before merging.
-->
- [ ] ⚠️ E2E gap: <what automated coverage does not verify>
<!--
  Manual test row uses the literal prefix `Manual test:`, concrete numbered steps,
  and stays unchecked until a human reviewer performs the steps and flips the box.
-->
- [ ] Manual test: <concrete numbered steps; observed outcome>
```

Keep the second deferred-AC example block, but update it to match the new grammar's comment conventions (deferred ACs still omit evidence/gap/manual rows and state "Deferred to `<repo-or-follow-up>`.").

## Task T-21-2: Mirror the template into the repo root

**File**: `.github/pull_request_template.md`

Make the `## Acceptance criteria` section byte-identical to the template-source version written in T-21-1. Keep the existing `<!-- One heading per relevant AC... -->` comment immediately under the `## Acceptance criteria` heading (the template-source file already has the matching comment as of T-21-1).

## Task T-21-3: Cross-reference from `docs/ac-traceability.md`

**File**: `docs/ac-traceability.md`

Extend §"From issue to PR" with one short paragraph pointing at the PR template as the canonical per-AC grammar for inline evidence rows and the `⚠️ E2E gap:` row. Do not duplicate the grammar here – refer the reader to the template comments. Do not invent new rules; this file only adds a pointer.

## Verification (maps to ACs)

1. **AC-21-1** (placeholder render): `pnpm lint:md` passes across the whole repo (template files included). Manually scan rendered template – placeholder block renders cleanly.
2. **AC-21-2** (one evidence row per platform, no detached bullets): grep the template source and root mirror for `- Evidence:` – must return zero. Count `evidence –` rows in the per-AC block – must equal one per platform.
3. **AC-21-3** (gap row directly above manual): a literal string match on the block must show `⚠️ E2E gap:` line immediately followed by `Manual test:` line with no other content between.
4. **AC-21-4** (reviewer block-merge instruction): the template comments explicitly tell the reviewer to check both rows before merging; `docs/ac-traceability.md` links to the template as canonical.
5. Template round-trip: `diff skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md` – must be empty (byte-identical).

Run:

```bash
pnpm install
pnpm lint:md
diff skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md
grep -n "Evidence:" skills/bootstrap/templates/core/.github/pull_request_template.md .github/pull_request_template.md || true
```

## Blockers

None.

## Handoff

On completion, Executor reports task IDs T-21-1, T-21-2, T-21-3 with evidence and HEAD SHA.
