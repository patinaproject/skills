# Email Triage — Configuration

Every account-specific value the skill needs is an **input**, supplied by the
installing repository — never hardcoded in the skill. This file defines the
schema and the tool-interface contract.

## Where the values live

The installing project supplies the values in **`docs/EMAIL_TRIAGE.md`** — the
default location the skill loads each run (workflow step 1). A project that keeps
skill config elsewhere (environment, connected-tool settings, another documented
file) may do so, as long as it documents where; the skill halts and asks rather
than guessing. `docs/EMAIL_TRIAGE.md` is a plain human-edited Markdown doc, not a
machine-parsed manifest — keep it readable.

A minimal `docs/EMAIL_TRIAGE.md` in an installing project:

```markdown
# Email Triage configuration

- mailbox: me@example.com
- tool: gmail-mcp            # the connected Gmail MCP server or CLI to drive
- labels.action: Triaged/Action
- labels.archived: Triaged/Archived
- mode: keep-and-flag        # switch to `archive` only after supervised runs

# Optional
- referenceDestination: "Notes/Inbox reference"
- window: 30d
```

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
2. Re-run. FYI and Noise threads are now labeled with the configured archived
   label and have `INBOX` removed. Unsure threads and hard keeps (starred, or
   carrying the configured action label) are still never archived.

To reverse an archiving run, search the configured archived label
(`label:<labels.archived>`, default `label:Triaged/Archived`) and restore
`INBOX` on the results.
