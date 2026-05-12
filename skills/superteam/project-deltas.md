# Project deltas (Team Lead supporting reference)

This file is referenced from `SKILL.md` `## Project deltas (Team Lead lookup)` and
`## Model selection` and carries the literal bodies those sections name. `SKILL.md`
remains the orchestration spec; this file is normative for the literal token list,
halt strings, audit-log format strings, the `resolve_role_config` pseudocode body,
and the model-override grammar examples and loophole-closure enumeration.

---

## resolve_role_config algorithm

Team Lead runs this once per delegation:

```python
def resolve_role_config(role, host, host_tool_capabilities):
    shipped = load_shipped_agent_file(role, host)      # D1, host-aware (D3)
    rules_sha = sha256_8(shipped.non_negotiable_rules_block)
    delta_path = repo_root / "docs/superpowers" / f"{role}.md"
    if not delta_path.exists():
        return shipped                                 # missing -> shipped unchanged
    raw = read_text(delta_path)
    if raw.strip() == "":                              # zero-byte / whitespace
        log_audit(f"superteam delta empty: {role}")
        return shipped
    parsed = parse_delta_file(raw)
    if not parsed.has_frontmatter and parsed.has_body_sections:
        halt(f"superteam halted at Team Lead: project delta for "
             f"{role} is missing required frontmatter agent field")
    if parsed.has_frontmatter and not parsed.has_body_sections:
        log_audit(f"superteam delta empty: {role}")
        return shipped
    if parsed.frontmatter_agent != role:
        halt("superteam halted at Team Lead: project delta for "
             f"{role} declares agent {parsed.frontmatter_agent}")
    # Forbidden-append lint (LC5) — runs before any merge.
    # Match is case-insensitive on a whitespace-collapsed copy of parsed.append
    # (run-of-whitespace normalized to a single space) to defeat trivial
    # paraphrases like `MAY PUSH` or `may  push` (double space). The denylist
    # is a literal-token floor, not the primary defense; the agent file's
    # mandatory non-negotiable-rules block (LC4) is the structural guard.
    matched = match_invariant_denylist(parsed.append)
    if matched:
        halt(f"superteam halted at Team Lead: project delta for "
             f"{role} attempts to weaken non-negotiable rules (matched: {matched})")
    config = shipped.copy()
    if parsed.model is not None:
        if parsed.model not in {"opus", "sonnet", "haiku", "inherit"}:
            halt("superteam halted at Team Lead: project delta for "
                 f"{role} has invalid model value {parsed.model}")
        if parsed.model == "inherit" and shipped.model != "inherit":
            log_audit(f"superteam delta inherit-redundant: {role}")
            # resolves to shipped.model; no override applied
        else:
            config.model = parsed.model
    # Tool merge with host-capability filter (N4).
    proposed_allow = parsed.tools_allow
    unavailable = proposed_allow - host_tool_capabilities
    for tool in unavailable:
        log_audit(f"superteam delta tool unavailable: {role} {tool}@{host}")
    proposed_allow = proposed_allow & host_tool_capabilities
    config.tools = (config.tools | proposed_allow) - parsed.tools_deny
    if parsed.append:
        config.system_prompt = config.system_prompt + "\n\n" + parsed.append
    log_audit(
        f"superteam delta applied: {role} ({applied_fields(parsed)}); "
        f"non-negotiable-rules-sha={rules_sha}"
    )
    # Operator R26 model override (model layer only) applied AFTER this,
    # before binding the dispatch parameter.
    return config
```

---

## Forbidden-append denylist (LC5)

The closed token list Team Lead matches against every `## System prompt append` block
before merging. A match halts dispatch:

```text
["AC IDs are advisory", "AC-<issue>- is advisory", "may push", "may open PR",
 "may merge", "skip writing-skills", "redefine done-report", "override halt"]
```

Match is case-insensitive on a whitespace-collapsed copy of the append (a run
of whitespace is normalized to a single space) to defeat trivial paraphrases
like `MAY PUSH` or `may  push`. Non-trivial paraphrases (`feel free to push`,
`acceptance criteria are guidelines`) are NOT caught by this list and are
expected to be blocked by the agent file's mandatory non-negotiable-rules
block (LC4) instead. **The denylist is a literal-token floor, not the
primary defense.**

---

## Halt strings (Team Lead emits these verbatim)

| Condition | Verbatim halt string |
|---|---|
| Invalid model value in delta | `superteam halted at Team Lead: project delta for <role> has invalid model value <value>` |
| Agent mismatch (frontmatter ≠ filename) | `superteam halted at Team Lead: project delta for <role> declares agent <other>` |
| Missing frontmatter `agent:` field | `superteam halted at Team Lead: project delta for <role> is missing required frontmatter agent field` |
| Denylist match in append | `superteam halted at Team Lead: project delta for <role> attempts to weaken non-negotiable rules (matched: <pattern>)` |
| Unsupported host at pre-flight | `superteam halted at pre-flight: host <host> has no shipped per-role agent files; supported hosts: claude-code, codex` |

---

## Audit-log strings (Team Lead emits these verbatim)

| Event | Verbatim audit string |
|---|---|
| Delta applied (model, append, or tools) | `superteam delta applied: <role> (<applied-fields>); non-negotiable-rules-sha=<8-char-prefix>` |
| Delta file empty or frontmatter-only | `superteam delta empty: <role>` |
| Orphan file found during pre-flight scan | `superteam delta orphan: docs/superpowers/<file> does not match any shipped role` |
| Delta `model: inherit` on non-inherit shipped role | `superteam delta inherit-redundant: <role>` |
| Delta requests tool not available on host | `superteam delta tool unavailable: <role> <tool>@<host>` |
| Active host resolved at pre-flight | `superteam active host: <name> (probe=<source>)` |

Default destination: operator-facing chat surface. Stderr fallback when no chat
surface is available (e.g. headless CI); re-emit at the start of Team Lead's next
chat-bearing message so the operator never permanently loses the audit trail (N9, LC3).

Every `superteam delta applied` line carries `non-negotiable-rules-sha=<8-char-prefix>`
(LC4).

---

## Host-enforcement asymmetry

The `## Tools` allow/deny layer is enforced natively on Claude Code (per-agent
`tools:` frontmatter on `.claude/agents/<role>.md`) but is currently a parity
target on Codex (the host does not enforce per-agent tool allow/deny). The
`resolve_role_config` algorithm computes the merged tool set on both hosts;
Team Lead emits the same audit lines on both. Operators on Codex should treat
the tools layer as advisory until Codex gains native enforcement.

The `## Model` layer and `## System prompt append` layer are enforced on both
hosts.

---

## Active-host probe order

Probe order — first match wins; result logged once at pre-flight as
`superteam active host: <name> (probe=<source>)`:

1. `CLAUDECODE` / `CLAUDE_CODE_*` env-var family present → `claude-code`
2. `CODEX_*` env-var family present → `codex`
3. Runtime self-id via capability probe (the active subagent-dispatch tool schema introspection used in `pre-flight.md` `## Model-override capability detection`)

Supported host set: `{ claude-code, codex }`. Out-of-supported-set hosts halt at
pre-flight (see halt strings above).

---

## Model-override grammar examples

Canonical override tokens (case-insensitive; whitespace around the colon is permitted):

- `model: opus` and aliases `use opus`, `with opus`
- `model: sonnet` and aliases `use sonnet`, `with sonnet`
- `model: haiku` and aliases `use haiku`, `with haiku`

Targeted form: `model: <model> for <role>`, e.g. `model: opus for executor`.

Phrases that do NOT count as an override — `Team Lead` MUST resolve to the per-role
default and MUST NOT route these through the override path:

- "use the better model"
- "go cheap" / "go fast" / "go faster"
- "use the fast model" / "fast model"
- "use the smart model" / "smart model"
- "save tokens" / "be efficient"
- "this is taking too long"
- Any phrasing that names a model family informally without the canonical token
  (e.g. "use Claude opus please" without `model:` or `use opus`)

---

## Model-override loophole closure

1. **Model selection is binding.** Per-role defaults are not advisory; they are the
   contract. The only legitimate departures are an explicit operator override (per the
   grammar above) or the inherit-and-warn capability fallback.
2. **Ambiguous framing is NOT an override.** "Go faster", "use the smart model",
   "save tokens", "this is taking too long" — none of these reach the override path.
   Only canonical tokens do. The matching rule is substring on canonical token forms;
   no fuzzy interpretation; no LLM-based intent inference.
3. **Operator silence is NOT permission to inherit.** "The operator didn't say which
   model" means "use the per-role default", not "inherit from the parent session".
   Inheritance is the explicit `inherit` value for `Team Lead` only, plus the
   inherit-and-warn capability fallback.
4. **Operator override always wins for its targeted delegation.** `Team Lead` does not
   override the operator with a per-role default reasoning ("but Brainstormer needs
   Opus"). The override scope is one delegation; defaults reassert on the next.
5. **No persistent override memory.** An override targets one delegation. There is no
   "the operator said opus once so use opus forever" behavior. Each delegation
   re-resolves from prompt + per-role default.
