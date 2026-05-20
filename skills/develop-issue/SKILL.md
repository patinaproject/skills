---
name: develop-issue
description: "Orchestrate same-repository GitHub issue work from branch setup through local review and PR readiness. Use when the user invokes `/develop-issue #123`, `/develop-issue https://github.com/<owner>/<repo>/issues/123`, or asks to develop exactly one issue end to end."
---

# Develop Issue

## Quick Start

Invoke with exactly one same-repository GitHub issue reference:

```text
/develop-issue #123
/develop-issue https://github.com/<owner>/<repo>/issues/123
```

This skill coordinates existing workflow skills. It does not replace their
contracts, loosen their guardrails, or merge pull requests.

## Required Child Skills

Before branch setup or implementation, confirm these installed skills are
available in the agent environment:

- `new-branch`
- `tdd`
- `diagnose`
- `review-code`
- `finish-pr`

If any are missing, halt before implementation. Report the missing skill names
and install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add patinaproject/skills --skill new-branch --skill review-code --skill finish-pr -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@diagnose -y
```

The `tdd`, `diagnose`, `write-a-skill`, `zoom-out`, and `prototype` install
hints intentionally track their source catalog's default branch. Consumers who
need a frozen install can add `#<git-ref>` to those sources.

## Conditional Routes

Conditional routes are not blanket prerequisites. Check that the named skill is
available only when the issue triggers that route; halt with the missing skill
name and install guidance only for a triggered missing route.

Install guidance for triggered conditional routes:

```sh
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@write-a-skill -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@zoom-out -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@prototype -y
```

- Route through `write-a-skill` when the issue changes an installable skill
  package surface: skill entry instructions, frontmatter or description,
  workflow contract text, examples, reference material, or bundled helper
  scripts. For skill-package changes that include executable helper scripts,
  run `write-a-skill` before `tdd`, then use `tdd` for executable behavior.
- Use `zoom-out` for ad-hoc, read-only discovery when the agent cannot yet
  explain the relevant modules, callers, and domain vocabulary. It may run in a
  background explorer when the host supports that, but the main workflow must
  consume the result before choosing an implementation route.
- Use `prototype` only when the issue explicitly asks for throwaway exploration,
  state-model sanity checks, UI direction exploration, or equivalent prototype
  work. Delete or absorb prototype output before local review unless the issue
  explicitly asks to commit prototype artifacts.

Do not add normal `/develop-issue` routes for upstream planning, triage,
architecture review, handoff, or conversation-mode skills unless the issue
explicitly asks for them.

## Input Contract

1. Accept one bare issue number, `#<number>`, or same-repository GitHub issue
   URL.
2. Reject missing issue references.
3. Reject multiple issue references.
4. Reject cross-repository issue URLs.
5. Resolve the issue through the current working directory's default `gh`
   repository.
6. Treat the issue as prior approval for implementation only when acceptance
   criteria, scope, repository rules, and design decisions are actionable.

Pause for a human when the issue lacks actionable acceptance criteria, conflicts
with repository rules, requires a design decision, depends on external access,
or otherwise needs judgment not recorded in the issue.

## Workflow

1. Read `AGENTS.md` and `CLAUDE.md` if present, plus any docs they import.
2. Validate the single same-repository issue reference and required child skills.
3. Delegate branch setup to `new-branch`; inherit every halt.
4. Apply any triggered conditional route:
   - Route installable skill package surface changes through `write-a-skill`.
   - Use `zoom-out` before implementation routing when discovery is needed.
   - Use `prototype` only for explicit throwaway exploration requests.
5. Implement one behavior at a time through `tdd`; `tdd` stays in the main
   thread so the issue controller keeps ownership of implementation decisions.
6. Route to `diagnose` when root cause is unclear, reproduction is missing,
   behavior is flaky, or performance has regressed.
7. Run repository-documented verification before local review.
8. Run `review-code` as the local review gate; inherit its read-only boundary,
   fresh-reviewer isolation requirement, and halt conditions.
   In Codex, automatically spawn a fresh Explorer background agent for this
   local review when agent dispatch is available; do not ask for another user
   confirmation after `/develop-issue` has reached the review gate. Close the
   Explorer or reviewer agent after consuming its final report. Do not leave old
   review agents running or start duplicate reviewers for the same unresolved
   review pass.
   `review-action` remains available separately for users who explicitly want
   hosted workflow emulation.
9. Triage every local review finding with the router below.
10. Repeat implementation, verification, and `review-code` until no actionable
   local findings remain or a human-owned blocker appears.
11. Delegate final publishing and PR readiness to `finish-pr` only after local
    verification and `review-code` are clean or every local finding has a
    disposition; inherit every halt. Never merge the pull request.

## Review Finding Router

Classify findings into exactly one of these outcomes:

| Outcome | Use When | Next Action |
|---|---|---|
| `ready-for-agent` | The expected behavior is clear or evidence can be gathered locally | Route clear behavior changes to `tdd`; route unclear root cause, missing reproduction, flaky behavior, or performance regression to `diagnose` |
| `ready-for-human` | The finding needs judgment, external access, manual testing, design input, missing information, changed scope, product decisions, permissions, conflicting direction, or valid work outside the issue | Stop the loop and report the blocker with evidence checked |
| `wontfix` | The finding is stale, incorrect, conflicts with repository rules, or is intentionally rejected | Explain politely in the report; add concise code comments only when future reviewers would otherwise re-raise the same concern |

There is no `needs-info` state in v1. Insufficient information maps to
`ready-for-human`.

## Final Report

When the workflow stops, report:

- Issue reference and URL
- Branch name
- Child skills invoked, with halt reason if any
- Verification commands and results
- Latest `review-code` result
- Human-owned blockers, if any
- `wontfix` explanations, if any
- PR URL and readiness status, when `finish-pr` runs
