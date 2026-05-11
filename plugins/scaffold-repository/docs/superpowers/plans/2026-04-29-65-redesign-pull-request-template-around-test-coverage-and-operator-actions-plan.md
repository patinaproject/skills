# Plan: Redesign pull request template around test coverage and operator actions [#65](https://github.com/patinaproject/bootstrap/issues/65)

## Workstreams

1. Template contract
   - Update `skills/bootstrap/templates/core/.github/pull_request_template.md` first.
   - Mirror the generated root `.github/pull_request_template.md`.
   - Verify section order, linked issue guidance, `Unit` plus platform matrix, per-AC test rows, optional `Test gap`, and checkbox semantics.

2. Guidance alignment
   - Update `skills/bootstrap/templates/core/AGENTS.md.tmpl` and root `AGENTS.md`.
   - Update `docs/ac-traceability.md` and `skills/bootstrap/pr-body-template.md`.
   - Keep emitted agent/editor guidance aligned with repo-wide wording changes.

3. Repository style sweep
   - Replace em dashes with en dashes across tracked repository text.
   - Keep root baseline files and template sources in sync where round-trip discipline applies.

4. Verification and review
   - Compare root and template PR files with `cmp`.
   - Search for stale old-row wording, removed section headings, invalid checkbox rows, and em dashes.
   - Run `git diff --check`.
   - Run `pnpm lint:md`.
   - Review the resulting diff against AC-65-1 through AC-65-6 before publishing.

## Task Mapping

- T65-1 covers AC-65-1 and AC-65-2 by changing the top-level PR template sections and issue-linking instructions.
- T65-2 covers AC-65-3 by changing the test coverage matrix.
- T65-3 covers AC-65-4 and AC-65-5 by moving per-AC rows under `Acceptance criteria` and narrowing checkbox use.
- T65-4 covers AC-65-6 by aligning AGENTS, traceability docs, mirrored root files, and bootstrap template sources.
- T65-5 covers the en-dash and stale-wording checks requested by the operator.

## Verification Commands

```bash
cmp -s .github/pull_request_template.md skills/bootstrap/templates/core/.github/pull_request_template.md
rg -n "$(printf '\342\200\224')"
rg -n "[Ee]vidence rows|E2E g[a]p|## Valid[a]tion|## Docs upd[a]ted|## Summ[a]ry" .github/pull_request_template.md skills/bootstrap/templates/core/.github/pull_request_template.md AGENTS.md skills/bootstrap/templates/core/AGENTS.md.tmpl docs/ac-traceability.md skills/bootstrap/pr-body-template.md
git diff --check
pnpm lint:md
```

## Blockers

None known.
