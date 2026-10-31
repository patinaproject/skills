# Consumer contract

The skill holds the method. The consuming repository holds its facts. This
file defines every fact the skill reads and where the skill looks for it.

## Discovery

The consuming repository names one config file in its `AGENTS.md` or
`CLAUDE.md`, for example:

```text
Draft user follow-ups: config at .github/agent-memory/draft-user-follow-ups.config.md
```

When no such line exists, read `.github/agent-memory/draft-user-follow-ups.config.md`.
When neither exists, stop and tell the operator to create the config from the
template below.

## Config keys

The config is a Markdown file with one `key: value` line for each key. Values
name tools and places. A value never holds a credential.

| Key | Required | Meaning | Example |
| --- | --- | --- | --- |
| `support_voice` | yes | Path to the support voice doc. The doc gives greeting, sign-off, tone, and phrasing. | `docs/SUPPORT_VOICE.md` |
| `memory_file` | yes | Path to the memory file of standing corrections. | `.github/agent-memory/draft-user-follow-ups.md` |
| `state_file` | no | Path to the file that holds each run's window end. Keep it out of version control. | `.github/agent-memory/draft-user-follow-ups.state` |
| `operator_addresses` | yes | Email addresses and feedback-tool accounts that count as the operator. A message from one of these is an operator message. | the support address, each team member's account |
| `email_tool` | yes | The mail provider the session reaches. | Gmail, Outlook |
| `feedback_tool` | yes | The feedback tool for support conversations and posts. | Canny, Featurebase, Intercom |
| `feedback_relay_senders` | no | Sender addresses the feedback tool uses to relay a customer message by email. | the tool's notification address |
| `feedback_conversation_url` | no | URL pattern for one support conversation, with an `<id>` placeholder. | `https://<host>/dashboard/conversations/<id>` |
| `tracker` | yes | The issue tracker that feedback posts and replies link to. | GitHub Issues, Jira, Linear |
| `tracker_link_pattern` | no | How a feedback post or message names its tracker issue, when the tool has no native link. | an issue key such as `ABC-123` in a comment |
| `tracker_reply_issue` | no | How to recognize a tracking issue: an issue that records the reply to one post or thread, while the work is in the issues that block it. | one Task + Support issue per active post; dev work blocks it; Done when the reply is sent and the post is closed |
| `forge_repo` | yes | The source repository that holds the production branch. | `owner/repo` on GitHub |
| `production_branch` | yes | The branch whose merge commits reach production. | `main`, `production` |
| `deploy_workflow` | yes | The pipeline run or workflow that deploys to production, and how to read its result. | a GitHub Actions workflow name, a hosting provider's production deployments |
| `mobile_delivery` | no | Which pull-request paths or labels mark a mobile change, the over-the-air update channel, and the store release history to read. | `apps/mobile/**`; the production update channel; the app store release history |
| `data_jobs` | no | Where backfills and migrations run and where their results show. | a migration log, a job dashboard |
| `public_surfaces` | yes | The live surfaces where a customer's case can be checked without credentials, such as public pages and public API endpoints. | the public website, a public read API |
| `business_days` | no | The operator's business days and time zone. | `Mon-Fri, Europe/Berlin` |
| `lookback` | no | How far back each touchpoint search reaches. | `30 days` |

A missing required key stops the run at step 1. A missing optional key has
this result, and the response footer names the key:

| Missing key | Result |
| --- | --- |
| `state_file` | Each window starts at the beginning of the previous business day, and the run writes no state. |
| `feedback_relay_senders` | A relayed email counts as from the relay sender. Its reply goes into the feedback tool's reply text. |
| `feedback_conversation_url` | A support conversation has a direct link only when the feedback tool's read returns one. Otherwise its row says "no direct link" and gives the conversation ID. |
| `tracker_link_pattern` | Only the feedback tool's native issue links count. |
| `tracker_reply_issue` | No issue counts as a tracking issue. Each mapped issue is work, and its own status counts. |
| `mobile_delivery` | A change cannot be identified as mobile. A reply whose work touches the mobile app stays blocked on shipped until the key exists. |
| `data_jobs` | A change that needs a data step stays blocked on data until the key exists. |
| `business_days` | Monday through Friday, in the time zone of the email account. |
| `lookback` | 30 days. |

## Support voice doc

Free prose owned by the consumer. The skill reads it in full before it writes a
draft, and follows it over any default phrasing.

## Memory file

Standing corrections from the operator. Use the `design-control-loop` memory
template as the base. The skill reads this file and leaves it unchanged.

```markdown
# Agent Memory: Draft user follow-ups

## Guidance

- <Standing correction that changes future runs, such as a person who never
  needs a follow-up, a promise phrase to treat as owed, or a surface to check
  first.>
```

## State file

One ISO 8601 window end on each line, newest last. The skill appends one line
for each run and reads the last line as the next window start.

## Config template

```markdown
# Draft user follow-ups: config

support_voice: docs/SUPPORT_VOICE.md
memory_file: .github/agent-memory/draft-user-follow-ups.md
state_file: .github/agent-memory/draft-user-follow-ups.state
operator_addresses: <addresses and accounts>
email_tool: <provider>
feedback_tool: <tool>
feedback_relay_senders: <sender addresses>
feedback_conversation_url: https://<host>/<path>/<id>
tracker: <tracker>
tracker_link_pattern: <pattern>
tracker_reply_issue: <tracking-issue convention>
forge_repo: <owner/repo>
production_branch: <branch>
deploy_workflow: <workflow or provider>
mobile_delivery: <mobile paths or labels; update channel; store release history>
data_jobs: <where backfills and migrations show>
public_surfaces: <public pages and public API endpoints>
business_days: Mon-Fri, <time zone>
lookback: 30 days
```
