---
name: email-inbox-triage
description: Tag and archive every inbox thread as Urgent, Needs reply soon, Waiting, or FYI, in Gmail, Outlook, or any mailbox the session's mail tools can reach. Use when the user asks to triage the inbox or run inbox zero. Mutates the mailbox, so answer read-only questions about what needs a reply directly instead.
---

# Email Inbox Triage

Sort every thread in the inbox into exactly one of four buckets, mark it with that bucket's tag, and archive the two buckets that need no attention.

The run is **idempotent**. It meets threads already tagged by earlier runs and converges on the same end state, so running it twice in a day is safe.

## Buckets

| Bucket | Meaning | Inbox |
|---|---|---|
| `Urgent` | Direct asks under time pressure, blockers, imminent deadlines, security concerns, decisions with deadlines, or operational mail that breaks if ignored. | stays |
| `Needs reply soon` | Direct asks without same-day urgency, active conversations where the user is the next responder, or follow-ups that go stale if ignored. | stays |
| `Waiting` | The user already replied, or the next action belongs to someone else. | archived |
| `FYI` | Announcements, newsletters, receipts, automated notifications, calendar churn, transactional mail. | archived |

Ambiguity **escalates**. A possible direct ask that could also read as `FYI` is `Needs reply soon`.

## Map the provider

Before touching mail, map four operations onto the mail tools this session has:

| Operation | Gmail | Outlook / Microsoft 365 | Other providers |
|---|---|---|---|
| **List the inbox** | search `in:inbox` | list messages in the Inbox folder | list the inbox folder or mailbox |
| **Read a thread** | get the thread | list messages by `conversationId` across all folders, Sent Items included | the provider's thread view, or `References` / `In-Reply-To` headers |
| **Tag and untag** | thread label | category | label, keyword, or tag |
| **Archive** | remove the `INBOX` label | move to the Archive folder | move to the archive folder or mailbox |

Use the provider's own names for tags and the archive folder. Where tag names cannot contain spaces, as with IMAP and JMAP keywords, use one hyphenated spelling such as `Needs-reply-soon` on every run. If more than one mail account is connected, ask which one to triage.

If the tools cannot list the inbox, add and remove a tag, and archive, stop before any write and name the missing operation. A folder cannot stand in for a tag, because `Urgent` and `Needs reply soon` threads stay in the inbox.

A thread is one conversation. When the provider lists messages rather than threads, as Outlook does, group inbox messages by conversation. Every count and limit below is in threads.

## Run

1. **Resolve the tags.** List the existing tags and read the four bucket tags from that live result rather than from any cached ID. Create a missing bucket tag. If the tools cannot create one, stop and ask the user to create it.

2. **Page the whole inbox.** Request the smallest view that returns sender, subject, snippet or preview, and current tags, at around 50 per page. Follow the provider's paging until no page remains, keeping a running total.

3. **Classify snippet-first.** Sender, subject, and snippet decide most threads. Read the full thread as plain text only when the snippet leaves the bucket genuinely undecidable. The usual case is an active conversation where the surrounding messages change who owes the next reply. Whether the user already replied decides `Waiting`, so the thread read must include the user's sent messages. Where the inbox listing omits sent mail, as Outlook's does, read the thread before tagging it `Urgent` or `Needs reply soon`. A long thread hanging off a low-signal notification is still low-signal.

   Every thread gets a bucket, newsletters and automated mail included. Noise is tagged `FYI`, never skipped.

4. **Apply the bucket.** Drive every write from the tags already in hand:

   - Remove whichever of the other three bucket tags the thread carries.
   - Add the selected bucket tag.
   - Archive the thread when the bucket is `Waiting` or `FYI`.

   Combine these into as few calls as the provider allows. In Gmail, archiving rides on the removal call, so a thread takes at most two. Where tags live on messages, as Outlook categories do, apply them to every inbox message in the conversation. Where archiving is a folder move that changes message IDs, tag first and archive last. A thread that already carries the right tag and the right inbox state needs no write. Where tags live on messages, the thread carries the tag only when every inbox message does. Skip it and count it as unchanged.

5. **Reconcile and report**, per **Report** below.

If the inbox exceeds 300 threads, work newest first, stop at 300, and report the remainder as unprocessed.

## Scope

Two write operations are in scope: adding and removing the four bucket tags, and archiving.

Everything else ends the run exactly as it started. That covers message content, read state, drafts, flags and stars, other tags and categories, and the user's subscriptions. No thread leaves the mailbox. Archiving takes a thread out of the inbox and nothing more, so never delete, trash, or report spam.

## Report

Close the run with:

- The provider and account triaged.
- Total threads retrieved, count per bucket, and count left unchanged. These **reconcile**. Bucket counts plus unprocessed equals the total. Show the arithmetic.
- For every `Urgent` and `Needs reply soon` thread, the sender, subject, why it landed in that bucket, and the likely next action.
- Every thread that could not be retrieved, classified, tagged, or archived, with the error. If pagination stopped short, name the last page reached.

Reply-needed and waiting are inferences from the available signal rather than known states. The report flags the ones that were close calls. An incomplete run reported honestly beats a clean-looking one.
