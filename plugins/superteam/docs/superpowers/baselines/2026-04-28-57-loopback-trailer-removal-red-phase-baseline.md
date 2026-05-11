# RED-phase baseline: loopback trailer removal [#57](https://github.com/patinaproject/superteam/issues/57)

This baseline captures the current `Loopback:` trailer failure and workflow
surface area before removing trailer-backed loopback state.

## Malformed trailer shape

The issue reports commit messages shaped like this:

```text
docs: #57 update design

Body explaining the change.

Loopback: spec-level

Co-Authored-By: teammate <noreply@example.com>
```

Because git recognizes only the final contiguous `Key: value` paragraph as the
trailer block, the parser sees `Co-Authored-By:` but not `Loopback:`.

Expected parser outcome for that shape:

```text
git log -1 --format='%(trailers:only,key=Loopback)'

```

The empty output means fresh pre-flight cannot recover the intended loopback
class from git trailers.

## Current surface area

An agent currently has to inspect or obey all of these surfaces to handle
loopbacks:

- `skills/superteam/SKILL.md`
- `skills/superteam/routing-table.md`
- `skills/superteam/pre-flight.md`
- `skills/superteam/loopback-trailers.md`
- `skills/superteam/agent-spawn-template.md`
- `docs/superpowers/pressure-tests/superteam-orchestration-contract.md`

## Captured rationalization

"We can fix this with more trailer rules."

That would preserve the same hidden state machine and add more parser-specific
work for future agents. The GREEN target is simpler:

- no required `Loopback:` commit trailer
- no pre-flight trailer scan
- no hidden replacement marker or sidecar state
- feedback classification and Reviewer safety preserved through visible state
