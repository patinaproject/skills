# ADR-502: Return the base to pstack-claude and keep model config at the system level

## Status

Accepted. Supersedes the base choice in
[ADR-429](ADR-429-sync-pstack-carrier-branch.md); the carrier-branch sync
mechanism that ADR-429 defines stays in force.

## Context

[ADR-429](ADR-429-sync-pstack-carrier-branch.md) moved the Engineering plugin
base from `michael-denyer/pstack-claude` to `ericlitman/open-pstack`. The reason
was cross-CLI model dispatch. open-pstack ships a launcher that spawns a foreign
vendor CLI as a child process, and a route table that sends every non-parent
provider to it.

We now reach multiple providers inside one harness. A Codex parent points at a
local proxy that serves both Claude and GPT models, and Codex dispatches every
lane through its native `spawn_agent`. The proxy is the router, so the launcher
and the route table have no work left to do
([#502](https://github.com/patinaproject/skills/issues/502)).

open-pstack's data model then works against that setup. Its descriptor is
`<provider>:<model>@<effort>`, and the provider component carries no information
once the proxy owns routing. Its read-time normalization rule rewrites a
versioned Claude model to a rolling alias and forbids passing the versioned
slug. The proxy serves versioned slugs as well as rolling aliases, so that rule
destroys the identifier a developer chose.

pstack-claude dispatches natively on both harnesses and names models as bare
slugs. That is the shape both `spawn_agent` and the proxy accept.

## Decision

Track `michael-denyer/pstack-claude` as the upstream base.

Keep model configuration at the system level. The `setup-pstack` output sheet is
the contract between the plugin and the proxy. A skill names role defaults in
its own Models section, and a matching role line in the sheet overrides each at
runtime. No route table, no launcher, and no per-model agent definition sits
between a role and its model.

Leave no trace of open-pstack. Everything ADR-429 imported from it that
pstack-claude does not ship goes: `scripts/runner/`,
`references/provider-dispatch.md`, the read-time normalization rule, and the
fifteen tiered `pstack-<family>-<effort>` agent definitions, including their
copies under `setup-engineering/assets/` and `.claude/agents/`. Those agents
were open-pstack's native leg of its route table, not Patina divergence, and
they leave with it. `setup-engineering` installs only `patina-agent` and
`comment-sicko`, and its asset check mirrors the canonical agents directory
rather than a fixed list. The name survives only in `CHANGELOG.md` and in
ADRs as history.

## Consequences

The tree shapes match, so the repoint is small. Both bases vendor the plugin at
`plugins/pstack/` with a `poteto-mode` skill and a `poteto-agent` agent, so
`scripts/pstack-transform.sh` applies unchanged and only the remote defaults and
the provenance prose move.

A base swap is a start-over, not a merge. The carrier branch is deleted so the
next run seeds from `HEAD`, which is the first-run path ADR-429 describes. The
merge then takes the new base wholesale and removes the Patina-owned files under
`plugins/engineering/**`, which the same pull request restores. That restore
covers whole Patina-authored skills and Patina edits inside synced files alike,
such as the pull request body contract in `playbooks/opening-a-pr.md` and the
issue handoff step in `playbooks/session-pickup.md`. A wholesale merge cannot
flag either kind, so the pull request diffs the result against trunk before it
is opened.

Two upstream principle skills arrive with the new base:
`principle-attack-the-premise` and `principle-test-behavior-not-implementation`.
pstack-claude also ships Codex prompt stubs under `.codex-plugin/prompts/`,
which ADR-429's base did not, so the marketplace test now asserts that those
stubs exist and that each stub's frontmatter name matches its filename.

Model verification weakens. open-pstack proved which model served a lane through
a runner receipt, and receipts existed only on external lanes. All-native
dispatch therefore has no model verification in either upstream. Codex records
the child thread's `model` and `thread_source` in its rollout, which is the
evidence source a native-lane check should read.

Grok and Gemini leave the panel. The proxy serves neither today.
