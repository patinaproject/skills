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
structure. `scaffold-repository` keeps its standalone consumer contract in
`skills/scaffold-repository/pr-body-template.md` and copies that file instead
of the root template. This supersedes ADR-257's single shared template.

## Consequences

This repository dogfoods the playbook it publishes without leaving ordinary
scaffold consumers with a pointer to an unavailable contract. The scaffold
template continues to provide `Linked issue` and `What changed` sections, and
consumer instructions must point to a body contract present in their own tree.
