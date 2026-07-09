---
name: improve-branch-architecture
description: Find deepening opportunities scoped to the current branch's changes and the radius that can fold into them, delivered as in-conversation markdown. Use when the user wants an architecture review of this branch or current changes, or wants to deepen shallow modules before finishing a PR. For a whole-codebase audit, use improve-codebase-architecture instead.
---

# Improve Branch Architecture

Surface architectural friction and propose **deepening opportunities** — refactors that turn shallow modules into deep ones. The aim is testability and AI-navigability.

This skill is the branch-scoped sibling of `improve-codebase-architecture`. It runs that skill's **entire approach** — the same three phases, the same vocabulary, the same deepening discipline, the same inline `CONTEXT.md`/ADR side effects — changed in exactly two ways:

1. **Scope** is the current branch's changes plus the foldable radius, not the whole codebase.
2. **Medium** is in-conversation markdown with ASCII before→after sketches, not a self-contained HTML report.

For a whole-codebase audit, use `improve-codebase-architecture`. For a standards-and-spec review of the branch's changes, use `code-review`.

## Vocabulary

Every suggestion uses the deep-module vocabulary — **module**, **interface**, **depth** (**deep**/**shallow**), **seam**, **adapter**, **leverage**, **locality**. Use these terms exactly; don't drift into "component," "service," "API," or "boundary." Full definitions and principles are in [LANGUAGE.md](LANGUAGE.md) — read it before writing suggestions if any term above is unfamiliar.

The principle the Process below leans on hardest is the **deletion test**: imagine deleting the module — if complexity vanishes it was a pass-through, if complexity reappears across N callers it was earning its keep.

This skill is _informed_ by the project's domain model. The domain language gives names to good seams; ADRs record decisions the skill should not re-litigate.

## Process

### 1. Explore the branch's changes

Read the project's domain glossary (`CONTEXT.md`, if any) and any ADRs in `docs/adr/` for the area you're touching first, so recommendations use the project's domain language and do not re-litigate recorded decisions.

**Resolve branch scope from the default-branch merge-base:**

1. Resolve the repository default branch with `gh repo view --json defaultBranchRef --jq .defaultBranchRef.name` or `git rev-parse --abbrev-ref origin/HEAD`, stripping any leading `origin/`.
2. Compute the review base with `git merge-base origin/<default-branch> HEAD`.
3. The change set is the committed diff from that merge-base to `HEAD`, plus staged, unstaged, and untracked changes. Include deleted files.

Then use the Agent tool with `subagent_type=Explore` to walk the change set and gather context. The exploration is bounded by the branch, but you must read past the diff hunks to judge architecture honestly:

- **Read each changed file in full**, not just the changed lines — depth and seams aren't visible from hunks alone.
- **Read the unchanged seam-partners** of the changed code: the callers and callees the changed code interfaces with, so you can judge the interface and the deletion test against real usage.

Degrade to running inline if subagents are unavailable. This is an advisory skill, not a hard gate — do not halt when no `Explore` subagent surface exists.

Explore organically and note where you experience friction:

- Where does understanding one concept require bouncing between many small modules?
- Where are modules **shallow** — interface nearly as complex as the implementation?
- Where have pure functions been extracted just for testability, but the real bugs hide in how they're called (no **locality**)?
- Where do tightly-coupled modules leak across their seams?
- Which parts of the change are untested, or hard to test through their current interface?

Apply the **deletion test** to anything you suspect is shallow: would deleting it concentrate complexity, or just move it? A "yes, concentrates" is the signal you want.

**The candidate filter is "anything foldable into this branch."** Surface friction whose fix could plausibly ride along in this branch:

- Friction the branch **introduced**.
- Pre-existing **shallowness in the files the branch touches**.
- Foldable issues in **unchanged neighbors** (callers/callees), as long as the change set stays reasonable.

Bound recommendations by keeping the change set reasonable — do not hand the contributor a sprawling refactor of unrelated, unchanged code. That is the job of `improve-codebase-architecture`.

### 2. Present candidates as in-conversation markdown

Present candidates directly in the conversation as markdown cards. **Write no HTML file and open nothing.** Markdown renders in any surface, including a terminal where HTML and Mermaid do not.

For each candidate, a card with these fields:

- **Files** — which changed files/modules (and which foldable neighbors) are involved.
- **Problem** — why the current architecture causes friction, in the [LANGUAGE.md](LANGUAGE.md) vocabulary, with **deletion-test** reasoning.
- **Solution** — plain-English description of what would change.
- **Benefits** — explained in terms of **locality** and **leverage**, and how the **test surface** improves, naming the **dependency category** from [DEEPENING.md](DEEPENING.md).
- **Before → After sketch** — an **ASCII** sketch (not a fenced Mermaid/HTML diagram) illustrating the shallowness and the deepening. Use boxes, arrows, and indentation so the shallow→deep shift is visible in any surface.
- **Strength** — a badge, one of `Strong`, `Worth exploring`, `Speculative`.

End with a **Top recommendation**: which candidate to tackle first and why.

**Use CONTEXT.md vocabulary for the domain, and [LANGUAGE.md](LANGUAGE.md) vocabulary for the architecture.** If `CONTEXT.md` defines "Order," talk about "the Order intake module" — not "the FooBarHandler," and not "the Order service."

**ADR conflicts**: if a candidate contradicts an existing ADR, only surface it when the friction is real enough to warrant revisiting the ADR. Mark it clearly in the card (e.g. _"contradicts ADR-0007 — but worth reopening because…"_). Don't list every theoretical refactor an ADR forbids.

Do NOT propose interfaces yet. After presenting the cards, ask the user: "Which of these would you like to explore?"

### 3. Grilling loop

Once the user picks a candidate, drop into a grilling conversation. Walk the design tree with them — constraints, dependencies, the shape of the deepened module, what sits behind the seam, what tests survive.

Classify the candidate's dependencies (in-process, local-substitutable, remote-but-owned, true-external) and recommend the matching seam/adapter/testing strategy so the deepened module is testable through its interface. See [DEEPENING.md](DEEPENING.md).

Side effects happen inline as decisions crystallize:

- **Naming a deepened module after a concept not in `CONTEXT.md`?** Add the term to `CONTEXT.md` using [CONTEXT-FORMAT.md](CONTEXT-FORMAT.md). Create the file lazily if it doesn't exist.
- **Sharpening a fuzzy term during the conversation?** Update `CONTEXT.md` right there.
- **User rejects the candidate with a load-bearing reason?** Offer an ADR, framed as: _"Want me to record this as an ADR so future architecture reviews don't re-suggest it?"_ Only offer when the reason would actually be needed by a future explorer to avoid re-suggesting the same thing — skip ephemeral reasons ("not worth it right now") and self-evident ones. See [ADR-FORMAT.md](ADR-FORMAT.md).
  - When the repo documents its own ADR file-naming scheme (this repo names ADRs after the originating issue — see `docs/adr/README.md`), follow the repo over the default in [ADR-FORMAT.md](ADR-FORMAT.md).
- **Want to explore alternative interfaces for the deepened module?** Use the parallel sub-agent interface-design pass in [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md).

## Autonomous-accept mode

The Process above is **interactive** by default: it presents cards, asks the
user which candidate to explore, and drops into a grilling loop. An orchestrator
that needs the rubric without a human picking candidates — for example
`harden-branch`'s deepen-until-settled phase — triggers **autonomous-accept**
mode instead.

In this mode, run the exploration in Process step 1 unchanged, then apply the
rubric below to each candidate automatically and emit the **accepted** set for
the orchestrator to route to `implement`/`tdd`. Skip the card-presentation
question and the grilling loop, and skip their inline `CONTEXT.md`/ADR offers —
those are grilling-driven. Still honor existing ADRs: never re-litigate a
recorded decision.

**Accept** a candidate only when it:

- passes the **deletion test** — deleting the module concentrates complexity rather than just moving it,
- increases **depth**,
- improves **locality** or the **test surface**,
- fits the **foldable radius** — rides along in this branch without sprawling, and
- is badged `Strong` (`Worth exploring` qualifies only when it clearly passes the deletion test; never accept `Speculative`).

**Reject as overengineering** any candidate that is:

- pass-through or indirection that only moves complexity rather than concentrating it,
- speculative generality for needs the branch does not have,
- deepening that complicates the **interface** instead of hiding complexity behind it,
- sprawl beyond the foldable radius, or
- a contradiction of an existing ADR without load-bearing cause.

**Default to reject when uncertain.** A conservative gate that terminates beats
one that gold-plates the branch.

Emit the accepted candidates — each with the deepening to apply — and the
rejected ones with a one-line reason. When a pass accepts **zero** candidates,
the branch has settled.

## Attribution

This skill mirrors the `improve-codebase-architecture`, `codebase-design`, and `domain-modeling` skills in [`mattpocock/skills`](https://github.com/mattpocock/skills). Some bundled reference files are copied verbatim from upstream; two are owned outright because the v1 reorganisation dissolved their standalone upstream files:

- [DEEPENING.md](DEEPENING.md) from `codebase-design`.
- [CONTEXT-FORMAT.md](CONTEXT-FORMAT.md) and [ADR-FORMAT.md](ADR-FORMAT.md) from `domain-modeling`.
- [LANGUAGE.md](LANGUAGE.md) and [INTERFACE-DESIGN.md](INTERFACE-DESIGN.md) are **owned by this skill** — in v1 the deep-module vocabulary folded into `codebase-design/SKILL.md` and the interface-design pass became `codebase-design/DESIGN-IT-TWICE.md`, leaving no standalone file to mirror (see [ADR-247](../../docs/adr/ADR-247-mattpocock-v1-format-sync-repoint.md)).

The parent's `HTML-REPORT.md` is intentionally **not** copied — this skill emits in-conversation markdown, never HTML.
