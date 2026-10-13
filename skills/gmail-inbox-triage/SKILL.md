---
name: gmail-inbox-triage
description: Label and archive every Gmail inbox thread as Urgent, Needs reply soon, Waiting, or FYI. Use when the user asks to triage the inbox or run inbox zero. Mutates the mailbox — answer read-only questions about what needs a reply directly instead.
---

# Gmail Inbox Triage

Sort every thread in `INBOX` into exactly one of four buckets, apply that bucket's label, and archive the two buckets that need no attention.

The run is **idempotent**: it meets threads already labeled by earlier runs and converges on the same end state, so running it twice in a day is safe.

## Buckets

| Bucket | Meaning | INBOX |
|---|---|---|
| `Urgent` | Direct asks under time pressure, blockers, imminent deadlines, security concerns, decisions with deadlines, or operational mail that breaks if ignored. | stays |
| `Needs reply soon` | Direct asks without same-day urgency, active conversations where the user is the next responder, or follow-ups that go stale if ignored. | stays |
| `Waiting` | The user already replied, or the next action belongs to someone else. | archived |
| `FYI` | Announcements, newsletters, receipts, automated notifications, calendar churn, transactional mail. | archived |

Ambiguity **escalates**: a possible direct ask that could also read as `FYI` is `Needs reply soon`.

## Run

1. **Resolve labels.** `list_labels` gives the four bucket IDs. Treat that call as the source of truth rather than any ID cached elsewhere. Create a bucket label with `create_label` if it is missing.

2. **Page the whole inbox.** `search_threads` with `query: "in:inbox"`, `pageSize: 50`, `view: THREAD_VIEW_MINIMAL`. Follow `pageToken` until it comes back empty, keeping a running total. The minimal view returns `subject`, `snippet`, `sender`, and `label_ids` — the entire snippet-first pass plus each thread's existing bucket label, in one call per page.

3. **Classify snippet-first.** Sender, subject, and snippet decide most threads. Escalate to `get_thread` with `messageFormat: PLAIN_TEXT` only when the snippet leaves the bucket genuinely undecidable — typically an active conversation where the surrounding messages change who owes the next reply. `get_thread` reports `total_messages`; a long thread hanging off a low-signal notification is still low-signal.

   Every thread gets a bucket, newsletters and automated mail included. Noise is labeled `FYI`, never skipped.

4. **Apply the bucket** — at most two calls per thread, both driven by the `label_ids` already in hand:

   - `unlabel_thread` with whichever of the other three bucket labels the thread actually carries, plus `INBOX` when the bucket is `Waiting` or `FYI`.
   - `label_thread` with the selected bucket label.

   A thread already carrying the right label and the right INBOX state needs neither call. Skip it and count it as unchanged.

5. **Reconcile and report**, per the section below.

If the inbox exceeds 300 threads, work newest first, stop at 300, and report the remainder as unprocessed.

## Scope

Two write operations are in scope: adding and removing the four bucket labels, and removing `INBOX`.

Everything else ends the run exactly as it started — message content, read state, drafts, stars, and the user's subscriptions. No thread leaves the mailbox: archiving removes `INBOX` and nothing more.

## Report

Close the run with:

- Total threads retrieved, count per bucket, and count left unchanged. These **reconcile**: bucket counts plus unprocessed equals the total. Show the arithmetic.
- For every `Urgent` and `Needs reply soon` thread: sender, subject, why it landed in that bucket, and the likely next action.
- Every thread that could not be retrieved, classified, or labeled, with the error. If pagination stopped short, name the last page reached.

Reply-needed and waiting are inferences from the available signal rather than known states; the report flags the ones that were close calls. An incomplete run reported honestly beats a clean-looking one.
