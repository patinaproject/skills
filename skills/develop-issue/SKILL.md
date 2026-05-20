---
name: develop-issue
description: "Orchestrate same-repository GitHub issue work from branch setup through local review and PR readiness. Use when the user invokes `/develop-issue #123`, `/develop-issue https://github.com/<owner>/<repo>/issues/123`, or asks to develop exactly one issue end to end."
---

# Develop Issue

## Quick Start

Invoke with exactly one same-repository GitHub issue reference:

```text
/develop-issue #123
```

This skill coordinates existing workflow skills. It does not replace their
contracts, loosen their guardrails, or merge pull requests.

## Required Child Skills

Before branch setup or implementation, confirm these installed skills are
available in the agent environment:

- `new-branch`
- `tdd`
- `diagnose`
- `review-action`
- `finish-pr`

If any are missing, halt before implementation. Report the missing skill names
and install guidance:

```sh
npm_config_ignore_scripts=true npx skills@latest add patinaproject/skills --skill new-branch --skill review-action --skill finish-pr -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@tdd -y
npm_config_ignore_scripts=true npx skills@latest add mattpocock/skills@diagnose -y
```

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
4. Implement one behavior at a time through `tdd`.
5. Route to `diagnose` when root cause is unclear, reproduction is missing,
   behavior is flaky, or performance has regressed.
6. Run repository-documented verification before local review.
7. Run `review-action` as the local review gate; inherit its read-only boundary
   and unsupported-workflow halts.
8. Triage every local review finding with the router below.
9. Repeat implementation, verification, and `review-action` until no actionable
   local findings remain or a human-owned blocker appears.
10. Delegate final publishing and PR readiness to `finish-pr`; inherit every
    halt. Never merge the pull request.

## Review Finding Router

Classify findings into exactly one of these outcomes:

| Outcome | Use When | Next Action |
|---|---|---|
| `ready-for-agent` | The expected behavior is clear or evidence can be gathered locally | Route clear behavior changes to `tdd`; route unclear root cause, missing reproduction, flaky behavior, or performance regression to `diagnose` |
| `ready-for-human` | The finding needs judgment, external access, manual testing, design input, missing information, or changed scope | Stop the loop and report the blocker with evidence checked |
| `wontfix` | The finding is stale, incorrect, outside the issue, or conflicts with repository rules | Explain politely in the report; add code comments only when intentional code would otherwise look non-obvious |

There is no `needs-info` state in v1. Insufficient information maps to
`ready-for-human`.

## Final Report

When the workflow stops, report:

- Issue reference and URL
- Branch name
- Child skills invoked, with halt reason if any
- Verification commands and results
- Latest `review-action` result
- Human-owned blockers, if any
- `wontfix` explanations, if any
- PR URL and readiness status, when `finish-pr` runs
