---
name: linear-inbox-cleanup
description: Mark as read every unread Linear inbox notification that needs no action, archive every read one that needs no action, and leave the rest unchanged. Use when the user asks to clean up their Linear inbox, or on a schedule. Changes read and archive state, so answer read-only questions about the inbox directly instead.
---

# Linear Inbox Cleanup

A notification **needs no action** when it is **done**, **status noise**,
**triage-assigned**, **superseded**, or **idle**. **Clear** every unread
notification that needs no action. **Archive** every read notification that
needs no action, whatever its age. **Keep** every other notification. When in
doubt about a notification, keep it.

A notification is read when its `readAt` is non-null. When the response omits
`readAt`, treat the notification as unread.

Clear means `mark_notification` with `id` set to the notification ID and
`read: true`. Archive means the GraphQL `notificationArchive` mutation, sent as
in [Archive](#archive). Keep means leave the notification unchanged: an unread
one stays unread, and a read one stays read and in the inbox.

In [Categories](#categories) and [Superseded](#superseded), "clear" means the
notification needs no action. [Run](#run) step 8 decides whether it is
cleared or archived.

## Scope

Use only these Linear MCP tools: `get_user`, `get_notifications`, `get_issue`,
`get_diff`, `list_comments`, and `mark_notification`. Do not use a browser.

The only non-MCP actions are two shell commands: the key check in
[Run](#run) step 3, which reaches no service, and the `curl` call in
[Archive](#archive). The `curl` call sends `notificationArchive`, the only
GraphQL operation this skill may send. Send no other GraphQL query or
mutation.

The only writes are clear, through `mark_notification`, and archive, through
`notificationArchive`. Never snooze, delete, or unarchive a notification, and
never comment on or change an issue, project, document, comment, or pull
request.

## Categories

- **Done.** The notification's issue has status type `completed` or
  `canceled`, or its pull request has status `merged`. A Duplicate status is
  type `canceled`. Any other issue status type, and an open pull request or
  one closed without merging, is not done. Nothing is left to act on, so clear
  a done notification whatever its type, mentions included.
- **Status noise.** `category` is `statusChanges`. That covers
  `issueStatusChanged`, `issueRestored`, `issueUnblocked`, and every other
  status-change type. Clear it whatever the issue's status.
- **Triage-assigned.** `type` is `issueAssignedToYou` and `subtitle` is
  `Assigned by Triage Rule`. An assignment by a person or a bot is not
  triage-assigned.
- **Superseded.** A later event shows the user already acted, or the work
  moved on. See [Superseded](#superseded).
- **Idle.** A new-comment notification where the user is not @-mentioned and
  has not commented in that thread.

Issue URLs below use `<KEY>-<N>`, the issue identifier with its team key, such
as `ENG-123`.

## Notifying comment

Find a notification's notifying comment and thread this way:

1. Find the parent from the `url`. `/issue/<KEY>-<N>/...` gives
   `issueId: "<KEY>-<N>"`, `/document/<slug>` gives `documentId`, and
   `/project/<slug>` gives `projectId`. The comment ID prefix is the eight hex
   characters after `#comment-`.
2. Call `list_comments` for the parent with `limit: 250`, following `cursor`.
3. The notifying comment is the one whose `id` starts with the prefix.
4. The thread root is the comment's `parentId` when set, or else the comment's
   own `id`. The thread is the root plus every comment whose `parentId` is the
   root.

## Superseded

Check each condition in this order, and record the first that matches as the
reason. A condition matches only the notification types listed for it. A
condition that does not apply to a notification is a silent non-match. When a
condition applies but a lookup it needs fails, or a field it needs is missing,
keep the notification and, when it is unread, list it under Unresolved. No
later check runs on it, Idle included. A field is missing when the response
omits it. A field the response returns as `null` is present and empty.

Compare timestamps as instants and dates in UTC.

- **Answered.** Types: `issueNewComment`, `issueCommentMention`,
  `documentNewComment`, `documentCommentMention`, `projectNewComment`, and
  `projectCommentMention`, with a `url` that has `#comment-<prefix>`. A
  comment in the thread has `author.id` equal to the user's `id` and
  `createdAt` later than the notifying comment's `createdAt`. A comment with
  only `onBehalfOf.id` equal to the user's `id` does not count.
- **Reviewed.** Types: `pullRequestReviewRequested` and
  `pullRequestReviewRerequested`, plus `pullRequestCommented`,
  `pullRequestCommentMention`, and `pullRequestMention` when `subtitle`
  contains "ready for review", case-insensitive. The `url` is a `/review/`
  URL. Read `viewerReviewState` from `get_diff`. A null `lastSubmittedAt` or
  `lastSubmittedDecision` matches neither bullet. Clear when either holds:
  - `lastSubmittedAt` is later than the notification's `updatedAt` and
    `createdAt`, and `isAskedToReviewAgain` is false. Any decision counts,
    changes requested included.
  - For the two request types only: `lastSubmittedDecision` is `approved`,
    and `isReviewRequested` and `isAskedToReviewAgain` are both false.
- **Advanced.** Type: `issueNewComment`. The notifying comment's body begins
  with `> *This was generated by AI during triage.*` and does not @-mention the
  user. The issue's `statusType` is `unstarted` or `started`.
- **Reassigned.** Type: `issueAssignedToYou`. The issue's `assigneeId` is not
  the user's `id`. An unassigned issue counts.
- **Rescheduled.** Type: `issueDue`. The notice is overdue when its `subtitle`
  contains "overdue", case-insensitive, and due soon otherwise. Clear either
  kind when the issue's `dueDate` is empty. Also clear an overdue notice when
  `dueDate` is later than the date of the notification's `createdAt` and is
  today or later.
- **Restated.** Types: the Answered types. Check this condition last, after
  the others have run over every notification. Clear this notification when
  another one with the same `type` and a later `createdAt` is still pending,
  and its notifying comment is in the same thread as this one's, with the same
  `author.id`. For an unread notification, the later one is pending when it is
  still unread after every earlier clear in this run. For a read notification,
  the later one is pending when it is unread, or when it is read and no
  earlier check matched it. When either comment or its author cannot be
  resolved, this condition does not match.

## Run

Keep one cache for the whole run, keyed by issue identifier, review URL, and
comment parent. Every step reads from it, so each is fetched at most once.

1. **Identify the user.** Call `get_user` with `query: "me"`. Keep the user's
   `id` and `name`. `get_user` returns no profile URL, so build it as
   `https://linear.app/<workspace>/profiles/<displayName>`, taking
   `<workspace>` from any notification `url` in step 2. A comment body
   @-mentions the user only when it contains that profile URL or a mention
   link to it. The user's name or `@<displayName>` as plain text, without the
   profile link, is not a mention, because Linear does not notify it as one.

2. **Fetch every notification.** Call `get_notifications` with `limit: 250`
   and without `unreadOnly`. Follow `cursor` until `hasNextPage` is false.
   Split the result into unread and read notifications.

3. **Set read notifications aside.** Check whether the key is set with
   `[ -n "$LINEAR_API_KEY" ] && echo set || echo unset`, which never prints
   the key. When it is unset, keep every read notification without lookups and
   skip archiving for the run. Otherwise, keep without lookups each read
   notification whose `snoozedUntilAt` is later than now. Steps 4 to 8 cover
   the unread notifications and the remaining read ones.

4. **Clear status noise and triage-assigned.** Neither needs a lookup.

5. **Clear the done ones** among the rest. Look up each notification's status
   from its `url`:

   - `/issue/<KEY>-<N>/...`: call `get_issue` for `<KEY>-<N>` with `fields`
     `statusType`, `assigneeId`, and `dueDate`, and read its status type.
   - `/review/<slug>`: call `get_diff` with the review URL, without its
     `#comment-` fragment, and read its status.

   A notification whose lookup fails, or shows no status type, is not done.

6. **Clear the superseded ones** among the rest, by [Superseded](#superseded).

7. **Find the idle candidates** among the notifications not yet cleared or
   kept as unresolved. A candidate reports a new comment or reply:
   `category` is `commentsAndReplies`, or `type` is a new-comment or reply
   type, such as `issueNewComment`, `projectUpdateNewComment`, or a document or
   project comment type. Keep every other notification without further checks,
   including:

   - any `type` containing `Mention`, such as `issueMention` or
     `issueCommentMention`, or `category` `mentions`
   - reactions, meaning any `type` containing `Reaction`
   - review requests, re-requests, approvals, and all other pull-request or
     `reviews` activity
   - assignments not made by the Triage Rule, document content changes,
     project updates, and anything else that is not a comment

   Then check each candidate:

   1. Find the notifying comment and thread by
      [Notifying comment](#notifying-comment). Keep the notification when the
      parent, the prefix, or a matching comment cannot be found.
   2. Keep the notification when any comment in the thread has `author.id` or
      `onBehalfOf.id` equal to the user's `id`.
   3. Keep the notification when the notifying comment's body @-mentions the
      user.
   4. Otherwise, clear it.

8. **Write.** Steps 4 to 7 only decide. Write after every decision is made.
   Clear each unread notification that needs no action with
   `mark_notification`. Archive each read notification that needs no action,
   one at a time, by [Archive](#archive). A notification cleared in this run is
   never archived in this run. A later run archives it once it is read.

## Archive

Archive one notification with this shell command, replacing `<id>` with the
notification `id`. It reads the key from the environment and prints the
response, which holds only `success` or `errors`, and the HTTP status. It never
prints the key.

```sh
case "$LINEAR_API_KEY" in lin_api_*) auth="$LINEAR_API_KEY" ;; *) auth="Bearer $LINEAR_API_KEY" ;; esac
curl -sS https://api.linear.app/graphql \
  -H "Authorization: $auth" -H 'Content-Type: application/json' \
  -w '\nHTTP %{http_code}\n' \
  -d '{"query":"mutation($id: String!) { notificationArchive(id: $id) { success } }","variables":{"id":"<id>"}}'
```

An archive fails on a curl error, an HTTP status other than 200, an `errors`
entry in the response, or `success` other than `true`. On the first failure,
send no further `notificationArchive` in this run. Count the failed
notification and every one not yet sent as kept read. A wrong key, a key
for another user, and a rate limit all fail this way.

## Report

End with a short summary.

- **Counts.** Unread scanned, read scanned, cleared per reason, archived per
  reason, idle candidates, kept unread, and kept read. Unread scanned equals
  cleared plus kept unread. Read scanned equals archived plus kept read. So
  scanned equals cleared plus archived plus kept.
- **Archiving skipped.** When `LINEAR_API_KEY` is unset, one line saying
  archiving was skipped because `LINEAR_API_KEY` is not set.
- **Cleared.** One line per cleared notification, in this form:
  `[<KEY>-<N>](issue url) — <title> — <author or notification type> (reason: <reason>)`.
  The reason is one of `issue completed`, `issue canceled`, `PR merged`,
  `status change`, `assigned by Triage Rule`, `superseded: answered`,
  `superseded: reviewed`, `superseded: advanced`, `superseded: reassigned`,
  `superseded: rescheduled`, `superseded: restated`, or
  `not mentioned, not in thread`. For a pull request, use the pull request's
  title as the link text and link its Linear review page. For a document or
  project, use its title as the link text and link its Linear page. Never
  invent an issue identifier.
- **Archived.** One line per archived notification, in the Cleared form and
  reason vocabulary, followed by the notification `id`.
- **Unresolved.** Every unread notification kept because something could not
  be resolved, with the reason: a failed lookup, no status type, a missing field
  a Superseded condition needs, no parent or comment prefix, or no matching
  comment. After an archive failure, add one line with the error message and
  the count of the failed notification plus those not yet sent. A read
  notification that cannot be resolved is counted as kept read and is not
  listed here.

Render every Linear issue identifier as a Markdown link to its Linear URL.
