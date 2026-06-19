---
name: write-docs
description: Capture an already-aligned design into CONTEXT.md glossary terms and ADRs, with no interview loop. Use when the user says "write the docs for this", "capture this in CONTEXT.md", or "record this decision as an ADR" and the decisions are already settled.
---

<what-to-do>

Capture an *already-aligned* understanding into documentation. The decisions are
already made and the terms are already settled — your job is to write them down,
not to re-litigate them.

Take the aligned understanding from the current conversation, a finished design
discussion, or a merged decision, and record it:

- Write or update `CONTEXT.md` glossary terms using
  [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).
- Offer ADRs sparingly using [ADR-FORMAT.md](./ADR-FORMAT.md).

**Do not run an interview loop.** Do not walk the design tree one question at a
time, and do not invent edge-case scenarios to force precision. That is grilling,
and it is out of scope here. If a fact can be checked in the codebase, check it
instead of asking.

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
When multiple contexts exist, infer which one the current topic belongs to; if it
is unclear, ask which context to write into.

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
enough to avoid capturing a claim the code plainly contradicts. If you find a
clear contradiction, surface it: "The code cancels entire Orders, but this says
partial cancellation is possible — which is right?" Do not turn this into an
exhaustive audit.

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
runs only the documentation-writing half of `grill-with-docs`/`grilling`, without
the interview.

</supporting-info>
