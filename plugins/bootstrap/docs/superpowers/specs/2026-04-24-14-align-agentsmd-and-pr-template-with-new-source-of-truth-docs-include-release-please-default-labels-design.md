# Design: Align AGENTS.md and PR template with new source-of-truth docs; include release-please default labels [#14](https://github.com/patinaproject/bootstrap/issues/14)

## Context

Issue [#11](https://github.com/patinaproject/bootstrap/issues/11) and PR [#12](https://github.com/patinaproject/bootstrap/pull/12) established two sources of truth that older governance surfaces do not yet defer to:

- `.github/LABELS.md` – canonical list of repo labels and their intent.
- `docs/ac-traceability.md` – canonical AC-ID format and Given/When/Then convention.

Three surfaces still inline or ignore these docs:

- `AGENTS.md` "Issue and PR labels" points at `gh label list` but does not name `.github/LABELS.md`.
- `AGENTS.md` "Project Structure & Module Organization" inlines the `AC-<issue-number>-<integer>` format without linking `docs/ac-traceability.md`.
- `.github/pull_request_template.md` lists AC heading rules with no link to `docs/ac-traceability.md`.

Separately, `.github/LABELS.md` documents only `autorelease: pending`, while release-please's default label set also includes `autorelease: tagged` – created on-demand when a release is cut – so contributors and agents have no documented guidance for the tagged variant.

This design covers the surgical edits needed to close those gaps without duplicating rules or expanding scope.

## Requirements

Reproduced verbatim from issue #14 acceptance criteria:

- AC-14-1: Given a contributor reads `.github/LABELS.md`, when they scan the current-labels list, then the release-please defaults (`autorelease: pending`, `autorelease: tagged`) are present with tool-managed guidance.
- AC-14-2: Given an agent consults `AGENTS.md` for label guidance, when they read the "Issue and PR labels" section, then it defers to `.github/LABELS.md` as the source of truth while preserving the `gh label list --json name,description` hygiene check.
- AC-14-3: Given a reader looks up AC-ID conventions, when they read `AGENTS.md` or `.github/pull_request_template.md`, then both surfaces link to `docs/ac-traceability.md` rather than redefining the format.
- AC-14-4: Given `pnpm lint:md` runs on the updated files, when it finishes, then it reports zero errors.

## Design decisions

### `.github/LABELS.md` – add `autorelease: tagged` and group release-please labels

Introduce a new "Release-please (tool-managed)" subsection under the existing Current labels list. Move the existing `autorelease: pending` entry into that subsection and add a new `autorelease: tagged` entry alongside it. The subsection's intro sentence must state that these labels are created and managed on-demand by release-please (not by `gh label create`) so contributors do not try to provision them manually. Keep the existing non-release-please labels in their current order and formatting; only the release-please entries move.

Preserve the current description text for `autorelease: pending` – fixing its empty upstream description on GitHub is tracked separately (see Out of scope) and is not part of this change.

### `AGENTS.md` "Issue and PR labels" – defer to `.github/LABELS.md`

Rewrite the section's lead paragraph to a single short paragraph that:

1. Names `.github/LABELS.md` as the source of truth for the repo's label set and when to apply each label.
2. Keeps the existing instruction to verify every label has a non-empty description.

Do not move or rewrite the existing `gh label list --json name,description --jq '.[] | select(.description == "")'` hygiene bash block – leave it in place immediately after the paragraph so agents still have the executable check.

Drop the current sentence that says "Use `gh label list` to see the repository's canonical label set" and the follow-on "Each label's `description` documents when to apply it" – both are replaced by the `.github/LABELS.md` pointer. Keep the existing "do not invent new labels without updating the repository's label set first" guardrail, rephrased to point at `.github/LABELS.md` as the place to update.

### `AGENTS.md` AC-ID line – link `docs/ac-traceability.md`

The existing sentence "Format acceptance criteria IDs as `AC-<issue-number>-<integer>`, for example `AC-1-1`." stays. Append one sentence immediately after it that links `docs/ac-traceability.md` as the full convention (covering Given/When/Then phrasing, per-AC PR headings, and deferred-AC handling). Do not duplicate the Given/When/Then rules inline.

### `.github/pull_request_template.md` – link `docs/ac-traceability.md` from Acceptance criteria

Under the existing `## Acceptance criteria` heading, add a single HTML comment line pointing readers to `docs/ac-traceability.md` for the full convention. Using an HTML comment keeps the rendered PR body clean (the link hint is for authors, not reviewers) and avoids introducing a new visible section that diverges from the template's established headings. The existing AC heading rules in the template body remain unchanged – the link is additive.

## Out of scope

- Fixing the empty GitHub description on the `autorelease: pending` label (tracked separately; upstream label metadata edit via `gh label edit`, not a docs change).
- Creating or editing GitHub labels via `gh label create` / `gh label edit` – release-please defaults are created by the tool on-demand.
- Expanding the PR template beyond the single Acceptance-criteria link hint (no new sections, no reworded headings).
- Any changes under `skills/**` – the `bootstrap` skill templates are not touched by this issue.
- Restating AC format or label rules inline anywhere they can be replaced by a cross-link.

## Concerns

Remaining concerns: None.
