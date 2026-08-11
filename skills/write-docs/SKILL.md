---
name: write-docs
description: Capture an already-settled design into CONTEXT.md glossary terms and ADRs. Use when the user says "write the docs for this", "capture this in CONTEXT.md", or "record this decision as an ADR".
---

<what-to-do>

Capture an *already-settled* understanding into documentation. The decisions are
made and the terms are agreed — write them down, do not re-litigate them. Take
that understanding from the current conversation, a finished design discussion,
or a merged decision, and record it:

- Write or update `CONTEXT.md` glossary terms using
  [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).
- Offer ADRs sparingly using [ADR-FORMAT.md](./ADR-FORMAT.md).

**Pick the capture target first.** Committed docs are read as in-force truth,
so write into the working tree only when the current branch is where these docs
will publish: the branch implementing the decision, or a docs-only branch when
the repository already reflects it. From anywhere else — a planning or grilling
session, a worktree on an unrelated branch, an implementing branch that does
not exist yet — leave the tree untouched and post the exact proposed text (the
complete ADR body and each glossary entry) to the tracker issue that will
implement the decision, creating that issue if none exists. The text then
travels to the implementing branch with the issue instead of depending on this
session's worktree surviving.

**Apply the proposals already captured.** When the current branch is where
these docs publish and the issue in play carries proposed doc changes, those
proposals are the source: write each one's text to the path it names, adding it
to the surrounding document in the right place — merged into the glossary in
term order, or created as its own ADR file. Where a proposal and the settled
understanding in this session disagree, the session is newer; write the
sharpened version and say which proposal you departed from and why.

**No grilling.** Do not run an interview loop, walk the design tree one question
at a time, or invent edge cases to force precision — that work is out of scope
here. If a fact can be checked in the codebase, check it instead of asking.

</what-to-do>

<supporting-info>

## Find the documentation layout

Most repos have a single context:

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts and the
map points to where each one lives (see [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md)).
Each context keeps its own `CONTEXT.md` and its own `docs/adr/`, alongside a
root `docs/adr/` for system-wide decisions:

```text
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
└── src/
    ├── ordering/
    │   ├── CONTEXT.md
    │   └── docs/adr/                 ← context-specific decisions
    └── billing/
        ├── CONTEXT.md
        └── docs/adr/
```

When multiple contexts exist, infer which one the current topic belongs to; if it
is unclear, ask which context to write into. A term always goes in that context's
`CONTEXT.md`. A decision goes in that context's `docs/adr/` when it binds only
that context, and in the root `docs/adr/` when it binds the system or crosses a
context boundary.

Create files lazily — only when you have something to write. If no `CONTEXT.md`
exists, create one when the first term is captured. If no `docs/adr/` exists,
create it when the first ADR is needed.

## What to capture

### Update CONTEXT.md

When a term is settled, write it into `CONTEXT.md` using the
[CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md) rules: an opinionated canonical term, a
tight one-or-two-sentence definition, and an `_Avoid_` list of the rejected
synonyms.

`CONTEXT.md` is a glossary and nothing else. Keep it totally devoid of
implementation details — it is not a spec, a scratch pad, or a place for
implementation decisions.

### Challenge a conflicting term

Before writing a term, check it against the existing glossary. If it conflicts
with language already in `CONTEXT.md`, surface the conflict rather than silently
adding a synonym or a contradiction: "Your glossary defines 'cancellation' as X,
but this seems to mean Y — which should it be?"

### Sharpen a fuzzy term

If a term is vague or overloaded, propose the precise canonical choice before
writing it: "This says 'account' — is that the Customer or the User? Those are
different things." Write the sharpened term, not the fuzzy one.

### Cross-reference with code (lightly)

Do a *light* sanity check against the code before recording something — just
enough to catch a claim the code plainly contradicts, never an exhaustive audit.
Surface any clear contradiction: "The code cancels entire Orders, but this says
partial cancellation is possible — which is right?"

### Offer ADRs sparingly

Only offer to record an ADR when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful.
2. **Surprising without context** — a future reader will wonder "why this way?"
3. **The result of a real trade-off** — there were genuine alternatives and one
   was chosen for specific reasons.

If any of the three is missing, skip the ADR. Use the
[ADR-FORMAT.md](./ADR-FORMAT.md) rules for the file itself.

> A repo may override the ADR file-naming scheme (for example, naming an ADR
> after its originating issue). When the repo documents its own scheme, follow
> the repo; otherwise use the default in [ADR-FORMAT.md](./ADR-FORMAT.md).

## Attribution

The bundled [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md) and
[ADR-FORMAT.md](./ADR-FORMAT.md) are copied verbatim from the `domain-modeling`
skill in [`mattpocock/skills`](https://github.com/mattpocock/skills). This skill
runs `domain-modeling`'s capture without the `grilling` interview, and diverges
from it deliberately in two places:

- **Capture has a target.** `domain-modeling` writes resolved terms into
  `CONTEXT.md` inline, wherever the session is running. This skill picks the
  target first, so an off-branch session sends the text to the tracker instead.
- **Capture runs both directions.** This skill also reads back: on the
  publishing branch it applies proposals already recorded on the issue, writing
  them into the files they name. `domain-modeling` only ever writes out.

</supporting-info>
