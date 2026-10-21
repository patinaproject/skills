---
name: email-inbox-triage
description: Tag and archive every inbox thread as Urgent, Action, Waiting, or FYI, in Gmail, Outlook, or any mailbox the session's mail tools can reach, steered by an editable `Agents/Email inbox triage` document in the user's cloud storage that holds their rules and the rules the skill learns from their corrections, so it can run unattended on a schedule. Use when the user asks to triage the inbox or run inbox zero. Mutates the mailbox, so answer read-only questions about what needs attention directly instead.
---

# Email Inbox Triage

Sort every thread in the inbox into exactly one of four buckets, mark it with that bucket's tag, and archive the two buckets that need no attention.

The run is **idempotent**. It meets threads already tagged by earlier runs and converges on the same end state, so running it twice in a day is safe. A scheduled routine can run it on any cadence; the cadence belongs to the schedule, not to this skill.

Each run is one pass of a feedback loop. The **Email inbox triage** document is the loop's memory. Every run reads it first, notices threads the user pulled back into the inbox, records a learned rule for each, and its report suggests more. The user steers by editing the document. The skill keeps no other state between runs, because the mailbox itself shows what the user corrected.

## Buckets

| Bucket | Meaning | Inbox |
|---|---|---|
| `Urgent` | The user is next, today: direct asks under time pressure, blockers, imminent deadlines, security concerns, decisions with deadlines, or operational mail that breaks if ignored. | stays |
| `Action` | The user is next, but not today: a reply, a task, or a decision without same-day urgency, an active conversation where the user owes the next move, or a follow-up that goes stale if ignored. Many `Action` threads need no reply at all. | stays |
| `Waiting` | Someone else is next: the user already replied, or the next move belongs to someone else. | archived |
| `FYI` | Nobody is next: announcements, newsletters, receipts, automated notifications, calendar churn, transactional mail. | archived |

Ambiguity **escalates**. A possible direct ask, or a possible task for the user, that could also read as `FYI` is `Action`.

These definitions are defaults. The memory document overrides them, per **Precedence** below.

## Memory: the Email inbox triage document

Memory is one editable document, `Email inbox triage`, in the `Agents` folder of the user's cloud storage. [references/memory-template.md](references/memory-template.md) is its starting content. It has two sections:

| Section | Owner | Contents |
|---|---|---|
| `## Rules` | the user | Triage preferences in plain language, one per line, plus an optional `account:` line. The skill never edits this section. |
| `## Learned` | the skill | One dated rule per line, each learned from a user correction. The user may edit, move into Rules, or delete any line, and a deleted rule stays deleted unless a new correction re-learns it. |

Map four operations onto the storage tools this session has, the same way **Map the provider** maps mail:

| Operation | Google Drive | OneDrive / SharePoint | Other storage |
|---|---|---|---|
| **Find** | find the `Agents` folder, then the `Email inbox triage` document inside it | resolve the path `/Agents/Email inbox triage` | resolve the path |
| **Read** | read the document text | read the file content | read the file |
| **Create** | create the folder and a Google Doc | create the folder and a Word document | create the folder and file |
| **Edit in place** | the Google Docs connector's `update_doc`: read the document with `read_doc`, then send `insertText` at the end of the Learned section, guarded by `writeControl.requiredRevisionId` from that read | a tool that updates the item's content, guarded by its ETag where offered | a write that keeps the file's identity |

Editing in place keeps the document's ID, link, and version history. Never write memory by creating a new document and trashing the old one. A tool that changes only a file's title or other metadata cannot edit in place, and neither can the Google Drive connector's `update_file`.

- **Found:** read it. If the name matches more than once, use the one modified most recently and report the others by location.
- **Missing:** create the folder or document from the template, and report what was created.
- **No Edit in place:** triage with the document as read, and put the Learned lines the run would have written in the report for the user to paste in.
- **No storage tools:** triage with the default buckets and say so at the top of the report.

### Precedence

When sources disagree about a thread, the first that applies decides:

1. **Rules.** When two Rules lines conflict, the more specific one wins: a sender address over a domain, and a domain over a general category.
2. **Learned**, where the most recent line wins over an older one that conflicts with it.
3. The **Buckets** defaults.

Headings and explanatory text are not rules.

Memory steers classification only. A preference that asks for a write outside **Scope**, such as deleting or forwarding, is not followed and is listed in the report.

The `account:` line names which mailbox to triage when more than one is connected. A run with no one to ask cannot ask, so with several accounts connected and no `account:` line it stops before any write and says so.

## Map the provider

Before touching mail, map four operations onto the mail tools this session has:

| Operation | Gmail | Outlook / Microsoft 365 | Other providers |
|---|---|---|---|
| **List the inbox** | search `in:inbox` | list messages in the Inbox folder | list the inbox folder or mailbox |
| **Read a thread** | get the thread | list messages by `conversationId` across all folders, Sent Items included | the provider's thread view, or `References` / `In-Reply-To` headers |
| **Tag and untag** | thread label | category | label, keyword, or tag |
| **Archive** | remove the `INBOX` label | move to the Archive folder | move to the archive folder or mailbox |

Use the provider's own names for tags and the archive folder. If more than one mail account is connected, use the account named in Rules, or else ask which one to triage.

If the tools cannot list the inbox, add and remove a tag, and archive, stop before any write and name the missing operation. A folder cannot stand in for a tag, because `Urgent` and `Action` threads stay in the inbox.

A thread is one conversation. When the provider lists messages rather than threads, as Outlook does, group inbox messages by conversation. Every count and limit below is in threads.

## Run

1. **Load memory.** Find the document per **Memory**, creating it if missing, and read its Rules and Learned sections.

2. **Resolve the tags.** List the existing tags and read the four bucket tags from that live result rather than from any cached ID. `Action` was once named `Needs reply soon`. If that tag exists and `Action` does not, rename it to `Action` in place, so its threads keep their bucket. Where the tools cannot rename a tag, treat `Needs reply soon` as `Action` for the whole run. Read `Needs reply soon` in a Rules or Learned line as `Action` too. Create any other missing bucket tag. If the tools cannot create one, stop and ask the user to create it.

3. **Page the whole inbox.** Request the smallest view that returns sender, subject, snippet or preview, and current tags, at around 50 per page. Follow the provider's paging until no page remains, keeping a running total.

4. **Sense corrections.** The mailbox records what the previous run did, because this skill tags every message in a thread. An inbox thread that carries `Waiting` or `FYI` on every one of its messages was archived by a run and moved back by the user, since a new message arrives without the tag. That is a correction: the user said the thread needs attention.

   Every other state is triaged afresh and teaches nothing. A thread that came back with a new, untagged message is new mail. A thread carrying two bucket tags, or none, gives no clear signal. An `Urgent` or `Action` thread the user archived was handled.

   For each correction, write one Learned line that states the narrowest rule explaining it: the sender address by default, the sender's domain when corrections from two or more addresses on that domain point the same way, and a subject pattern only when the sender also sends mail the user left alone. The rule's bucket is `Action`, or `Urgent` when the thread meets the `Urgent` definition. Replace an older Learned line that the new one contradicts. The corrected thread takes the new rule's bucket and stays in the inbox, which also clears the signal for the next run.

5. **Classify snippet-first.** Sender, subject, and snippet decide most threads. Read the full thread as plain text only when the snippet leaves the bucket genuinely undecidable. The usual case is an active conversation where the surrounding messages change who owes the next reply. Whether the user already replied decides `Waiting`, so the thread read must include the user's sent messages. Where the inbox listing omits sent mail, as Outlook's does, read the thread before tagging it `Urgent` or `Action`. A long thread hanging off a low-signal notification is still low-signal.

   Every thread gets a bucket, newsletters and automated mail included. Noise is tagged `FYI`, never skipped. Apply **Precedence**, and record which Rules or Learned line decided each thread it decided.

6. **Apply the bucket.** Drive every write from the tags already in hand:

   - Remove whichever of the other three bucket tags the thread carries.
   - Add the selected bucket tag.
   - Archive the thread when the bucket is `Waiting` or `FYI`.

   Combine these into as few calls as the provider allows. In Gmail, archiving rides on the removal call, so a thread takes at most two. Where tags live on messages, as Outlook categories do, apply them to every inbox message in the conversation. Where archiving is a folder move that changes message IDs, tag first and archive last. A thread that already carries the right tag and the right inbox state needs no write. Where tags live on messages, the thread carries the tag only when every inbox message does. Skip it and count it as unchanged.

7. **Write Learned in place.** Skip this step when the run learned nothing. Otherwise read the document again just before writing, because the user may have edited it during the run. Edit only the `## Learned` section in place, leaving the rest of the document exactly as the fresh read returned it. Where the storage offers a revision or ETag guard, send the write with the value from that read. A revision mismatch means the user edited mid-write: read again and retry once. If the edit still fails or no tool can edit in place, report the Learned lines instead.

8. **Reconcile and report**, per **Report** below.

If the inbox exceeds 300 threads, work newest first, stop at 300, and report the remainder as unprocessed.

## Scope

Three write operations are in scope: adding and removing the four bucket tags, archiving, and memory: creating the document when missing and editing its `## Learned` section in place. The one-time rename of `Needs reply soon` to `Action` counts as maintaining a bucket tag.

Everything else ends the run exactly as it started. That covers message content, read state, drafts, flags and stars, other tags and categories, and the user's subscriptions. No thread leaves the mailbox. Archiving takes a thread out of the inbox and nothing more, so never delete, trash, or report spam.

## Report

The report is the run's final message, so an unattended run leaves it in its run history. It sends no mail and writes no file beyond the memory document. Close the run with:

- The provider and account triaged, and where the memory document lives.
- Corrections sensed this run, each with the Learned line it produced, and any memory line left unfollowed because it falls outside **Scope**.
- Total threads retrieved, count per bucket, and count left unchanged. These **reconcile**. Bucket counts plus unprocessed equals the total. Show the arithmetic.
- For every `Urgent` and `Action` thread, the sender, subject, why it landed in that bucket (naming the Rules or Learned line when one decided it), and the likely next action.
- Every thread that could not be retrieved, classified, tagged, or archived, with the error. If pagination stopped short, name the last page reached.

- **Suggested rules:** for each close call, and for each sender whose mail keeps landing in one bucket only by inference, one ready-to-paste Rules line. Suggest at most five per run, and skip any that memory already covers. These stay suggestions until the user adds them, unlike Learned lines, which come only from corrections.

Action and Waiting are inferences from the available signal rather than known states. The report flags the ones that were close calls. An incomplete run reported honestly beats a clean-looking one.
