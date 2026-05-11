# Design: Simplify README skill invocation examples [#18](https://github.com/patinaproject/github-flows/issues/18)

> Recommended skill: `superpowers:brainstorming`. The Brainstormer role for this
> issue uses that discipline to settle README wording and scope before
> implementation. The design is intentionally small because the issue changes
> documentation examples, not skill behavior.

## Intent

Make the README examples match what users actually type. The main skill list
should stop displaying the plugin-qualified `github-flows:` prefix, and the
README should include a concrete `Using GitHub` example that shows how to route
GitHub work through the umbrella skill.

## Requirements

- Update only user-facing README guidance unless implementation discovers a
  directly related markdown consistency issue.
- In the README skill list, display the user-facing skill names or invocations
  without `github-flows:`.
- Preserve the existing skill outcomes: new issue filing, issue editing, branch
  creation, changelog writing, and the `Using GitHub` router.
- Add a concrete `Using GitHub` example similar to an explicit skill invocation
  so Codex-style users can see how to ask for the router skill by name.
- Keep editor-specific examples honest: slash-command examples should remain in
  Claude Code sections when they are Claude Code-specific, while Codex examples
  should use the `$github-flows:using-github` style users actually type.
- Keep the README markdownlint-clean.

## Approaches Considered

### Recommended: README-Only Invocation Cleanup

Update the README's "What you get" list and relevant examples so they center on
user-facing names. Use `/new-issue`, `/edit-issue`, `/new-branch`,
`/write-changelog`, and `/using-github` where slash-command syntax is the
surface, and include a Codex-style `$github-flows:using-github` example where
that syntax is the surface.

This is the smallest change that satisfies the issue while preserving the
plugin package name and the existing installation guidance.

### Alternative: Rename Skills or Plugin Metadata

The repository could rename commands or alter plugin metadata so the public
runtime no longer exposes `github-flows:` anywhere.

That is out of scope. The issue is about README simplification, not runtime
behavior or packaging.

### Alternative: Remove Slash Commands From the README

The README could describe only plain-language skill names and omit concrete
invocations.

That would avoid prefix confusion, but it would make the README less useful for
people trying to copy a real command or prompt.

## Design

Revise the README around two principles:

- The top-level skill inventory uses the terms users would type first:
  `/using-github`, `/new-issue`, `/edit-issue`, `/new-branch`, and
  `/write-changelog`.
- Runtime-specific examples can show their native syntax, including an explicit
  Codex-style `[$github-flows:using-github]` invocation example for the router
  skill.

The `Using GitHub` example should be close to the user's request shape:

```text
[$github-flows:using-github]

New issue: simplify the README examples. When the issue is created, create a
new branch and begin work.
```

The exact rendered example may omit brackets or path-like metadata if that is
clearer in README prose, but it should demonstrate the router skill as the
entry point for a multi-step GitHub task.

## Acceptance Criteria

- AC-18-1: Given a user reads the README skill list, when they scan the
  available skills, then the listed invocations omit the `github-flows:` prefix
  and show what users would actually type.
- AC-18-2: Given a user wants to route repository work through the GitHub
  workflow skill, when they read the README examples, then they see a concrete
  `Using GitHub` example similar to an explicit skill invocation.
- AC-18-3: Given the README examples are updated, when markdown lint runs, then
  the README passes the repository markdown checks.

## Testing

- Run `pnpm lint:md`.
- Run `rg 'github-flows:' README.md` and review any remaining matches to ensure
  they appear only where runtime-specific syntax or package names require them.
- Run `rg 'using-github|Using GitHub|/using-github' README.md` to verify the
  router skill is discoverable.
- Review `README.md` directly to confirm the examples distinguish plugin
  install syntax from skill invocation syntax.

## Out of Scope

- Changing skill behavior or file layout under `skills/`.
- Changing plugin install commands, marketplace names, or package metadata.
- Updating editor-generated guidance outside `README.md`.
- Opening or changing release automation.

## Concerns

No approval-relevant concerns remain. The main implementation risk is making
the examples too generic, so the plan should include a direct README review for
copy-paste usefulness after lint passes.
