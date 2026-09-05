# ADR-445: Keep repository and scaffold pull request contracts separate

## Status

Accepted

## Context

This repository publishes and installs the Engineering plugin, so it can use
the `opening-a-pr` playbook as its pull request body contract. Ordinary
repositories created by `scaffold-repository` do not receive that playbook
([#445](https://github.com/patinaproject/skills/issues/445)).

## Decision

The root `.github/pull_request_template.md` is a comment-only reminder, and
this repository's instructions give `opening-a-pr` sole ownership of body
structure. `scaffold-repository` copies its bundled
`skills/scaffold-repository/pr-body-template.md` for consumers. This supersedes
ADR-257's single shared template.

[#465](https://github.com/patinaproject/skills/issues/465) limits both templates
to a closing-reference reminder. The consuming repository's tracker adapter
selects one authoritative reference per completed issue. The integration and
existing closing-reference check determine the accepted reference forms.

## Consequences

This repository dogfoods the playbook it publishes without leaving ordinary
scaffold consumers with a pointer to an unavailable contract. Consumer
instructions name their active workflow when it defines body structure.
Otherwise, the author chooses the structure. Neither template prescribes body
sections or duplicate references to synchronized issues.
