# ADR-224: Do not test documentation content

- Status: accepted
- Date: 2026-06-02

## Context

Much of this repository is documentation: skill `SKILL.md` files, `AGENTS.md`,
`CLAUDE.md`, `README.md`, and contributor docs. Several shell tests under
`scripts/tests/` had grown into prose guardrails — they asserted that exact
sentences, headings, or phrasings appeared (or did not appear) inside `.md`
files (for example `assert_match "exact sentence" SKILL.md`).

Asserting on exact documentation wording is the classic "Fragile/Overspecified
Test" anti-pattern: routine, correct edits to prose break unrelated tests, the
failures teach nothing about behavior, and contributors learn to route around
the suite. The docs-as-code ecosystem reflects this — tools such as `mdschema`,
`remark-lint-frontmatter-schema`, and `@github-docs/frontmatter` validate
frontmatter *schema and structure*, never prose body content.

Markdown *linting* (`markdownlint` / `pnpm lint:md`) is a separate concern: it
checks formatting hygiene, not meaning, and is unaffected by this decision.

## Decision

Tests must not assert on the prose content of documentation files.

Tests validate code behavior and machine-consumed contracts only:

- shell and JavaScript behavior;
- valid JSON/YAML configuration;
- `.md` *frontmatter* schema (for example `name:` matches the folder);
- symlink resolution;
- required-file existence.

A documentation file's prose body must be freely editable without breaking a
test. Markdown linting stays in place and is explicitly not "testing" for the
purpose of this rule.

The rule is recorded in `AGENTS.md` (Testing Guidelines) and reinforced in
`CLAUDE.md`. Because `scaffold-repository` uses this repository's live root as
its canonical baseline, the written rule auto-propagates to scaffolded and
realigned repositories; `scaffold-repository`'s `SKILL.md` ("Conventions
encoded") and `audit-checklist.md` (Area 3) make it explicit and auditable. The
scaffold propagates the written rule only — it does not emit this test harness
to consumer repositories.

## Consequences

- Six prose-asserting test files were deleted, and `scaffold-cleanup.test.sh`
  and `workflow-cleanup.test.sh` were stripped to filesystem-state and
  non-`.md` config/code assertions.
- The suite is less brittle: doc edits no longer trip tests that encode no
  behavior, and agents get a clear, stable contract about what is tested.
- Trade-off: we lose the incidental grep-guardrails those tests provided over
  skill-doc wording (for example detecting a reintroduced stale reference inside
  a `SKILL.md`). Structural guarantees that still matter — file existence,
  frontmatter `name:` parity, valid config, symlinks — remain covered by
  `dogfood.test.sh`, `marketplace.test.sh`, and the retained filesystem/config
  assertions. Prose drift is now caught by review and `lint:md`, not by tests.
