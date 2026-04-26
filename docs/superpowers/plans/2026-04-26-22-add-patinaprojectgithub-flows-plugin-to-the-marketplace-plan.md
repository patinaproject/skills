# Plan: Add `patinaproject/github-flows` to the marketplace

Issue: [patinaproject/skills#22](https://github.com/patinaproject/skills/issues/22)
Design: [2026-04-26-22-...-design.md](../specs/2026-04-26-22-add-patinaprojectgithub-flows-plugin-to-the-marketplace-design.md)

## Summary

Per design: defer the actual marketplace manifest entry to the automated bump PR fired on `github-flows` `v0.1.0`. This PR delivers documentation + author metadata only.

## Workstreams

Single linear workstream — all changes are independent file edits.

### Tasks

- **T1** (R1): Update [docs/release-flow.md](../../release-flow.md) "Current member plugins tracked by this flow" list to include `patinaproject/github-flows — agent ergonomics for GitHub workflows.`
- **T2** (R5): Update [package.json](../../../package.json) `author` block to add `"url": "https://github.com/tlmader"`. Keep `name` and `email` unchanged.
- **T3** (R3, R4): No code change — verification artifact captured in PR description. Confirm by inspection that `.github/workflows/plugin-release-bump.yml` `exists_claude=0` / `exists_codex=0` branches construct entries matching the canonical shape of existing `bootstrap`/`superteam` entries.

### ATDD verification

- **V1** (T1): `grep -F "patinaproject/github-flows" docs/release-flow.md` returns the new bullet.
- **V2** (T2): `jq '.author' package.json` returns the three-field object including `url`.
- **V3** (T2): `pnpm exec commitlint --edit` accepts the commit message format `chore: #22 ...`.
- **V4** (T3, manual inspection in Reviewer): re-read `.github/workflows/plugin-release-bump.yml` to confirm both `exists_*=0` branches emit the canonical entry shape.

### Lint / format gates

- `pnpm lint:md` must pass for the changed `docs/release-flow.md`.

## Blockers

None.

## Out of scope

- Adding a `github-flows` entry to either marketplace manifest (deferred to bump PR on first release).
- Modifying `plugin-release-bump.yml` (already supports new plugins).
- Cutting `patinaproject/github-flows` `v0.1.0` (upstream).
