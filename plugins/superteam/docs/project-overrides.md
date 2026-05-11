# Authoring `docs/superpowers/<role>.md` project override files

Consuming projects can override per-role model, tools, and system-prompt behavior without
forking the shipped `superteam` skill. This document is the operator-facing authoring
guide; it is greppable for AC-73-2 / AC-73-7 override-schema verification.

The normative contracts live in:

- [`skills/superteam/SKILL.md` `## Project deltas (Team Lead lookup)`](../skills/superteam/SKILL.md#project-deltas-team-lead-lookup) — precedence rules, closed model enum, append-only invariant, denylist pointer, algorithm pointer, halt/audit-log string pointers.
- [`skills/superteam/project-deltas.md`](../skills/superteam/project-deltas.md) — literal denylist tokens, halt strings, audit-log strings, `resolve_role_config` algorithm body.

---

## Supported hosts

Override files are consumed by `Team Lead` on the supported host set: `{ claude-code, codex }`.
Out-of-supported-set hosts halt at pre-flight before any delta is applied.

---

## File location and naming

Place the file at:

```text
<repo-root>/docs/superpowers/<role>.md
```

where `<role>` is the kebab-case agent filename — one of:

```text
team-lead
brainstormer
planner
executor
reviewer
finisher
```

One file per role. Files for unknown role slugs emit a `superteam delta orphan` warning
at pre-flight; the run continues and the orphan file is never applied.

---

## File schema

A delta file is a Markdown file with YAML frontmatter and up to four optional body sections:

```markdown
---
agent: <role>
---

## Model
<one of: opus | sonnet | haiku | inherit>

## Tools
allow:
  - <Tool>
deny:
  - <Tool>

## System prompt append
<free-form Markdown appended verbatim after the shipped system prompt>
```

All four body sections are optional. You may include any subset. The `agent:` frontmatter
field is required whenever a body section is present.

### Closed model enum

Legal `## Model` values: `{ opus, sonnet, haiku, inherit }`.

`inherit` resolves to "use the shipped default for this role." For non-`team-lead` roles
a delta of `inherit` is allowed but logs `superteam delta inherit-redundant: <role>`.
Any other value halts dispatch.

### Append-only system prompt

`## System prompt append` is always appended; there is no `replace` mode. A project delta
cannot redact shipped guardrails.

### Forbidden append tokens

`## System prompt append` is linted against a closed denylist before dispatch. Matches
halt with a verbatim blocker. The literal token list lives in
[`skills/superteam/project-deltas.md` `## Forbidden-append denylist (LC5)`](../skills/superteam/project-deltas.md#forbidden-append-denylist-lc5).

### Operator-prompt model override (N2)

The operator's R26 model override (canonical tokens: `model: opus`, `model: sonnet`,
`model: haiku`, or `use <model>` / `with <model>`) applies to the model layer only, after
the delta is merged. Tool allow/deny and system-prompt-append layers are not
operator-prompt-overridable.

---

## Edge-case handling summary

| Condition | Behavior |
|---|---|
| File absent or not yet created | No-op; shipped defaults apply unchanged |
| Zero-byte or all-whitespace file | No-op; logs `superteam delta empty: <role>` |
| Valid frontmatter `agent:` but no body sections | No-op; logs `superteam delta empty: <role>` |
| Body sections present but frontmatter missing `agent:` | Halt: `superteam halted at Team Lead: project delta for <role> is missing required frontmatter agent field` |
| Frontmatter `agent:` ≠ filename slug | Halt: `superteam halted at Team Lead: project delta for <role> declares agent <other>` |
| Invalid `## Model` value | Halt: `superteam halted at Team Lead: project delta for <role> has invalid model value <value>` |
| `## System prompt append` contains a denylist token | Halt: `superteam halted at Team Lead: project delta for <role> attempts to weaken non-negotiable rules (matched: <pattern>)` |
| Tool in `allow:` unavailable on the active host | Warning logged; tool silently dropped from the merged tool set |

Every applied delta is logged on the operator-facing chat surface:
`superteam delta applied: <role> (<applied-fields>); non-negotiable-rules-sha=<8-char-prefix>`.

---

## Minimal example — model override only

```markdown
---
agent: executor
---

## Model
sonnet
```

Applied delta: `superteam delta applied: executor (model); non-negotiable-rules-sha=a1b2c3d4`

---

## Full example — all four sections

```markdown
---
agent: brainstormer
---

## Model
opus

## Tools
allow:
  - WebSearch
deny:
  - Write

## System prompt append
When authoring the design doc, prefer ADR (Architecture Decision Record) format for
each major decision. Cite issue numbers from this repository when referencing prior
decisions.
```

Applied delta: `superteam delta applied: brainstormer (model, tools, system-prompt-append); non-negotiable-rules-sha=a1b2c3d4`

The `## System prompt append` block is appended verbatim after the shipped brainstormer
system prompt. The shipped non-negotiable rules block is prepended first (LC4); the append
follows. If any forbidden-intent token appeared in the append, dispatch would halt before
reaching this point.
