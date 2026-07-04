# Email Triage — Configuration

Every account-specific value the skill needs is an **input**, supplied by the
installing repository — never hardcoded in the skill. This file defines the
schema and the tool-interface contract. Bind the values wherever the installing
repo keeps skill configuration (a documented config file, environment, or the
operator's connected-tool settings), then point the skill at them.

## Configuration schema

| Key | Required | Meaning |
| --- | --- | --- |
| `mailbox` | yes | Identity of the connected account to triage (e.g. the address or the connected-account id). |
| `tool` | yes | The Gmail tool interface that provides the sanctioned operations (see below) — a connected Gmail MCP server or a CLI. Names the provider, not a hardcoded binary path chosen by the skill. |
| `labels.action` | yes | Concrete name bound to the `Triaged/Action` role. |
| `labels.archived` | yes | Concrete name bound to the `Triaged/Archived` role. |
| `labels.*` | no | Optional per-bucket label names (e.g. `labels.fyi`), additive. |
| `referenceDestination` | no | An **existing** note the Record bucket appends to. When absent, Record threads are labeled and listed only. |
| `mode` | no | `keep-and-flag` (default) or `archive`. Start supervised on `keep-and-flag`; switch to `archive` only after supervised runs. |
| `window` | no | Scan window. Defaults to the last 30 days on the first run; deeper backfill is a separate explicit run. |

Missing a **required** key is a halt-and-ask condition. The skill never invents a
mailbox, label name, or reference destination.

## Tool interface contract

The skill drives Gmail **only** through the configured `tool`, never a hardcoded
account or binary. Any MCP server or CLI that provides these operations can back
the skill:

| Operation | Purpose | Write? |
| --- | --- | --- |
| list threads | Enumerate the scan set for a mailbox + window | read |
| read thread | Inspect subject, participants, unread state, labels | read |
| create label | Create a configured label that does not yet exist | write |
| add label | Apply a configured label to a thread | write |
| remove label | Remove `INBOX` (archive) or a label | write |
| update note *(optional)* | Append to the configured reference destination | write |

These six are the **only** operations the skill uses. There is deliberately no
compose, draft, reply, send, or delete operation in the contract — the
[Safety Boundary](SKILL.md#safety-boundary) forbids them, and an adapter should
not expose them to this skill.

Where the tool exposes separate read-only and write-only connectors, prefer them:
read thread content through the read connector and apply labels through the write
connector, so untrusted message text cannot reach a write path.

## Enabling archive mode

`keep-and-flag` is the default so initial runs are fully supervised and never
change the inbox beyond labels. After you have watched enough `keep-and-flag`
runs to trust the bucketing:

1. Set `mode: archive` in configuration.
2. Re-run. FYI and Noise threads are now labeled `Triaged/Archived` and have
   `INBOX` removed. Unsure threads and hard keeps (starred, `Triaged/Action`)
   are still never archived.

To reverse an archiving run, search `label:Triaged/Archived` and restore `INBOX`
on the results.
