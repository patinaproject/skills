# Plan: Agents should explicitly read and follow .github templates when filing issues and PRs [#7](https://github.com/patinaproject/bootstrap/issues/7)

## Workstream – single batch

One commit covering both surfaces.

### T-1 – Add the section to `AGENTS.md` (AC-7-1, AC-7-2, AC-7-4)

Insert a new `## Working with .github/ templates` section in [AGENTS.md](AGENTS.md) immediately after `## Issue and PR labels` (line 64–72) and before `## GitHub Actions pinning` (line 74). The section explains:

- Where the templates live: `.github/pull_request_template.md`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`.
- The rule: read the relevant template first; the body's section names and order must match it verbatim.
- Recommended `gh` invocation: `gh pr create --body-file <(cat <<'EOF' ... EOF)` or `gh pr create --template pull_request_template.md` patterns. Acceptable fallback: pass `--body` inline as long as every template section is present in order.
- A "do not invent" line: do not introduce alternative section names like `Out of scope`, `Verification`, etc. when the template uses different ones (e.g. `Validation`, `Docs updated`).
- Cross-reference: the existing PR-body acceptance-criteria rules under `## Commit & Pull Request Guidelines` are a refinement of the template's `Acceptance criteria` section.

### T-2 – Mirror the section into `skills/bootstrap/templates/core/AGENTS.md.tmpl` (AC-7-3, AC-7-4)

Insert a parallel section into [skills/bootstrap/templates/core/AGENTS.md.tmpl](skills/bootstrap/templates/core/AGENTS.md.tmpl) at the same logical position (after `## Issue and PR labels`, before `## GitHub Actions pinning`). Wording matches the AGENTS.md change, but uses generic references that hold for any scaffolded repo (no `patinaproject`-specific examples).

### T-3 – Verify (AC-7-5)

- `rg` checks per the design's verification list.
- `pnpm lint:md`.

## Order

T-1 → T-2 → T-3, single commit.

## Blockers

None.
