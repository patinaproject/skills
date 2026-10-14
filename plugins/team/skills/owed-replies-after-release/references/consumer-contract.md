# Consumer contract

The skill holds the method. The consuming repository holds its facts. This
file defines every fact the skill reads and where the skill looks for it.

## Discovery

The consuming repository names one config file in its `AGENTS.md` or
`CLAUDE.md`, for example:

```text
Owed replies after release: config at .github/agent-memory/owed-replies.config.md
```

When no such line exists, read `.github/agent-memory/owed-replies.config.md`.
When neither exists, stop and tell the operator to create the config from the
template below.

## Config keys

The config is a Markdown file with one `key: value` line for each key. Values
name tools and places. A value never holds a credential.

| Key | Required | Meaning | Example |
| --- | --- | --- | --- |
| `support_voice` | yes | Path to the support voice doc. The doc gives greeting, sign-off, tone, and phrasing. | `docs/SUPPORT_VOICE.md` |
| `memory_file` | yes | Path to the memory file of standing corrections and the run log. | `.github/agent-memory/owed-replies.md` |
| `operator_addresses` | yes | Email addresses and feedback-tool accounts that count as the operator. A message from one of these is an operator message. | the support address, the founder's account |
| `email_tool` | yes | The mail provider the session reaches. | Gmail, Outlook |
| `feedback_tool` | yes | The feedback tool for support conversations and posts. | Featurebase, Canny, Intercom |
| `feedback_relay_senders` | no | Sender addresses the feedback tool uses to relay a customer message by email. | the tool's notification address |
| `tracker` | yes | The issue tracker that feedback posts and replies link to. | Linear, GitHub Issues, Jira |
| `tracker_link_pattern` | no | How a feedback post or message names its tracker issue, when the tool has no native link. | an issue key such as `ABC-123` in a comment |
| `forge_repo` | yes | The source repository that holds the production branch. | `owner/repo` on GitHub |
| `production_branch` | yes | The branch whose merge commits reach production. | `main`, `production` |
| `deploy_workflow` | yes | The pipeline run or workflow that deploys to production, and how to read its result. | a GitHub Actions workflow name, a hosting provider's production deployments |
| `mobile_delivery` | no | How a mobile change reaches users. Name the over-the-air update channel and the store release, and where to read each. | an over-the-air channel, the app store release history |
| `data_jobs` | no | Where backfills and migrations run and where their results show. | a migration log, a job dashboard |
| `public_surfaces` | yes | The live surfaces where a customer's case can be checked without credentials, such as public pages and public API endpoints. | the public website, a public read API |
| `business_days` | no | The operator's business days and time zone. Default is Monday through Friday in the operator's local time zone. | `Mon-Fri, Europe/Berlin` |

A missing required key stops the run at step 1. A missing optional key turns
off the part of the method that uses it, and the report footer names that key.
With no `mobile_delivery`, a mobile change cannot pass the shipped check, so
the reply is blocked until the key exists.

## Support voice doc

Free prose owned by the consumer. The skill reads it in full before it writes a
draft, and follows it over any default phrasing.

## Memory file

A Markdown file with two sections. Use the `design-control-loop` memory
template as the base.

```markdown
# Agent Memory: Owed replies after release

## Guidance

- <Standing correction that changes future runs, such as a person who never
  needs a follow-up, a promise phrase to treat as owed, or a surface to check
  first.>

## Run log

- <ISO 8601 window end of each run, newest last.>
```

Guidance holds durable corrections from the operator. The run log holds only
window ends. The skill appends one run-log line for each run and changes
nothing else in the file.

## Config template

```markdown
# Owed replies after release: config

support_voice: docs/SUPPORT_VOICE.md
memory_file: .github/agent-memory/owed-replies.md
operator_addresses: <addresses and accounts>
email_tool: <provider>
feedback_tool: <tool>
feedback_relay_senders: <sender addresses>
tracker: <tracker>
tracker_link_pattern: <pattern>
forge_repo: <owner/repo>
production_branch: <branch>
deploy_workflow: <workflow or provider>
mobile_delivery: <over-the-air channel; store release source>
data_jobs: <where backfills and migrations show>
public_surfaces: <public pages and public API endpoints>
business_days: Mon-Fri, <time zone>
```
