# ADR-354: `docs/agents/` holds the canonical tracker adapter

## Status

Accepted

## Context

Two skill families own the tracker adapter and disagreed about which path holds
the real file. `scaffold-repository` required the real adapter at
`docs/issue-tracker.md` with `docs/agents/issue-tracker.md` as a relative
compatibility symlink. `mattpocock/skills`' `setup-matt-pocock-skills` writes
its own seed template to `docs/agents/issue-tracker.md` and knows nothing about
the other path.

A repository that vendors both — which `skills-lock.json` in a Patina repo
routinely does — ended up with whichever layout ran second, and neither order
was stable. Scaffold first, then setup: the seed writes through the symlink or
replaces it, and the "no duplicate adapter content" rule breaks silently. Setup
first, then scaffold: the audit flags a real file where it expects a symlink,
and a naive fix deletes the only adapter.

The consuming skills split the same way. `docs/agents/issue-tracker.md` is read
by `code-review`, `to-spec`, `to-tickets`, `triage`, `wayfinder`, and
`ask-matt`; `docs/issue-tracker.md` by `new-branch`, `using-github`,
`working-on-issue`, `working-on-issues`, and `write-changelog`. Both sets are
available from this marketplace.

A second, independent gap sat behind the path question. Even with the symlink in
place, the adapter `scaffold-repository` produced had no content for three
things the upstream skills look up by name: `## Wayfinding operations`, the
`PRs as a request surface` flag, and the `publish to the issue tracker` /
`fetch the relevant ticket` indirection. `wayfinder` in particular falls back to
a local-markdown tracker when its section is absent, which is silently wrong on
a repository that has a real tracker. The path check passed while those
consumers went unserved, which is the worse failure mode.

## Decision

`docs/agents/issue-tracker.md` is the real file. `docs/issue-tracker.md` is a
relative compatibility symlink to `agents/issue-tracker.md` — the inverse of the
previous rule.

One skill had to defer to the other, and the upstream family has more consumers
and already treats `docs/agents/` as the home for agent configuration. Deferring
to it also removes the failure mode entirely rather than papering over it:
`setup-matt-pocock-skills` now writes the real file exactly where it expects to,
so running it after a scaffold is a no-op on layout instead of a silent break.

The adapter carries the three previously missing sections, and the audit
declares the whole `docs/agents/` layout: `domain.md` alongside the adapter, and
`triage-labels.md` when `triage` is vendored. The audit asserts the chosen
direction and states that the pair must resolve to one file.

## Consequences

- A repository that vendors both skill sources has one stable layout regardless
  of which skill ran last.
- Existing scaffolded repositories carry the old direction and are `divergent`
  until realigned. The flip is mechanical — move the file, invert the symlink —
  but it is a real change to every repository already on the baseline, and
  realignment must not simply delete the real file it finds where a symlink was
  expected.
- Prose that names `docs/issue-tracker.md` keeps working: the symlink resolves,
  so no reference in this repository or any consumer had to change.
- `wayfinder`, `triage`, `to-tickets`, and `to-spec` get real content instead of
  a resolving path with nothing in it for them. The wayfinding section has to be
  maintained per provider, which is new surface the adapter did not carry before.
