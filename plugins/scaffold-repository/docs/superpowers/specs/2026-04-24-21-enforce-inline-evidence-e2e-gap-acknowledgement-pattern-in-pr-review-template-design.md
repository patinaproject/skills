# Design: Enforce inline evidence + E2E gap acknowledgement pattern in PR review template [#21](https://github.com/patinaproject/bootstrap/issues/21)

## Context

Bootstrap's PR template per-AC block only asks reviewers to flip a single `Manual test:` checkbox. Two patterns have since matured in the downstream `patinaproject/patinaproject` repo that make AC verification meaningfully more rigorous:

1. **Inline slim evidence rows** that record `runner | env | @handle | ISO` for each required platform, so review state captures *where and by whom* automated coverage was observed.
2. **Acknowledged E2E gap checkboxes** rendered immediately above the `Manual test:` row, forcing reviewers to consciously accept the limits of automated coverage before attesting the manual step.

Without these prompts, bootstrap-scaffolded repos let reviewers check `Manual test:` without recording evidence provenance or confronting coverage gaps. This issue ports the slim grammar and the gap-acknowledgement row into the bootstrap PR template so every repo scaffolded from `bootstrap` inherits the discipline.

## Scope

- **In scope**: update the bootstrap PR template per-AC block (template source + mirrored root file); document the grammar and rules in the template comments and `docs/ac-traceability.md` (or `AGENTS.md`) so the contract is discoverable.
- **Out of scope** (per issue): shipping a validator script in this repo, back-filling downstream repos, changing the AC-ID grammar.

## Target per-AC block

```markdown
### AC-<issue>-<n>

Short outcome summary.

- [ ] <Platform> evidence – <runner> | <env> | @<handle> | <ISO>
- [ ] ⚠️ E2E gap: <what automated coverage does not verify>
- [ ] Manual test: <concrete numbered steps; observed outcome>
```

Rules encoded in template comments:

- One `<Platform> evidence – ...` row per required platform. Omit the evidence rows entirely for ACs explicitly marked `[platform: none]`.
- Evidence fields are pipe-separated in fixed order: `runner | env | @handle | ISO` (UTC). No detached `- Evidence:` bullets anywhere in the block.
- A `⚠️ E2E gap:` row is **included only when automated coverage has a real gap** that a reviewer must consciously accept. If coverage is comprehensive, omit the row entirely – do not use placeholder phrases like "no known gap". Every manual test is still required to sit below any applicable gap row, and the row (when present) must be checked before merge.
- The `Manual test:` row uses the literal prefix `Manual test:`, concrete numbered steps, and stays unchecked until a human reviewer performs the steps and flips the box in GitHub UI.
- Stand-in phrases `none required`, `n/a`, `not applicable`, `automated coverage is sufficient` are rejected (merge policy / future validator enforcement).

## Files changed

- `skills/bootstrap/templates/core/.github/pull_request_template.md` – template source of truth.
- `.github/pull_request_template.md` – repo-root mirror (enforced by the template-round-trip rule in `AGENTS.md`).
- `docs/ac-traceability.md` – extend §"From issue to PR" with a short reference to the slim evidence + gap rows, pointing back to the template as the canonical grammar.

## Acceptance criteria

- **AC-21-1**: Given a PR body rendered from the updated template, when the author has not replaced the `<Platform>`, `<runner>`, `<env>`, `<handle>`, or `<ISO>` placeholders, then the template still renders cleanly (passes `markdownlint-cli2`) and documents the expected slim grammar via inline comments.
- **AC-21-2**: Given a PR body rendered from the updated template, when the author fills real evidence, then every required platform has exactly one inline `- [ ] <Platform> evidence – <runner> | <env> | @<handle> | <ISO>` row and no detached `- Evidence:` bullets appear.
- **AC-21-3**: Given a PR body rendered from the updated template, when the author writes the per-AC block and the AC has a real E2E gap, then a `- [ ] ⚠️ E2E gap: ...` row sits directly above the `- [ ] Manual test: ...` row. When coverage is comprehensive, the gap row is omitted entirely.
- **AC-21-4**: Given a reviewer merging a PR rendered from the updated template, when they have not checked both the gap row and the Manual test row, then the template's own instructions (and the linked `docs/ac-traceability.md`) instruct them to block merge. Enforcement wiring (validator, required-checks) is deferred.

## Verification

- `pnpm lint:md` passes.
- Visual diff of `.github/pull_request_template.md` and `skills/bootstrap/templates/core/.github/pull_request_template.md` shows byte-identical per-AC block grammar (templates-first round-trip).
- Render a sample PR body locally: every required platform yields exactly one evidence row; the `⚠️ E2E gap:` row sits directly above `Manual test:`.
- `docs/ac-traceability.md` points to the template as the canonical per-AC grammar, without duplicating rules.

## Requirements set

- R1: Add inline per-platform evidence row grammar to the per-AC block.
- R2: Add a conditional `⚠️ E2E gap:` row above the `Manual test:` row, present only when a real gap exists.
- R3: Keep the `Manual test:` literal prefix and checkbox semantics unchanged.
- R4: Document the rules as template comments and cross-reference from `docs/ac-traceability.md`.
- R5: Keep template and root mirror byte-identical (templates-first rule in `AGENTS.md`).
- R6: Do not add validator tooling in this repo (out of scope per issue).

## Concerns

Remaining concerns: None
