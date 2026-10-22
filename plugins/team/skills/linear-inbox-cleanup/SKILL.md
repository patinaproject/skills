---
name: linear-inbox-cleanup
description: Mark as read every unread Linear inbox notification that needs no action, and keep the rest unread. Use when the user asks to clean up their Linear inbox, or on a schedule. Only changes read state, so answer read-only questions about the inbox directly instead.
---

# Linear Inbox Cleanup

**Clear** every unread notification that is **done**, **status noise**,
**triage-assigned**, or **idle**. **Keep** every other notification. When in
doubt about a notification, keep it.

Clear means `mark_notification` with `id` set to the notification ID and
`read: true`. Keep means leave it unread.

## Scope

Use only these Linear MCP tools: `get_user`, `get_notifications`, `get_issue`,
`get_diff`, `list_comments`, and `mark_notification`. Do not use a browser.

The only write is clear. Never archive or snooze a notification, and never
comment on or change an issue, project, document, or pull request.

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
- **Idle.** A new-comment notification where the user is not @-mentioned and
  has not commented in that thread.

Issue URLs below use `<KEY>-<N>`, the issue identifier with its team key, such
as `ENG-123`.

## Run

1. **Identify the user.** Call `get_user` with `query: "me"`. Keep the user's
   `id`, `name`, and profile URL
   (`https://linear.app/<workspace>/profiles/<handle>`). A comment body
   @-mentions the user only when it contains that profile URL or a mention
   link to it. The user's name or `@<handle>` as plain text, without the
   profile link, is not a mention, because Linear does not notify it as one.

2. **Fetch every unread notification.** Call `get_notifications` with
   `unreadOnly: true` and `limit: 250`. Follow `cursor` until `hasNextPage` is
   false.

3. **Clear status noise and triage-assigned.** Neither needs a lookup.

4. **Clear the done ones** among the rest. Look up each notification's status
   from its `url`:

   - `/issue/<KEY>-<N>/...`: call `get_issue` for `<KEY>-<N>` and read its
     status type.
   - `/review/<slug>`: call `get_diff` with the review URL and read its
     status.

   Cache each issue and review so each is fetched once. A notification whose
   lookup fails, or shows no status type, is not done.

5. **Find the idle candidates** among the notifications not yet cleared. A
   candidate reports a new comment or reply: `category` is
   `commentsAndReplies`, or `type` is a new-comment or reply type, such as
   `issueNewComment`, `projectUpdateNewComment`, or a document or project
   comment type. Keep every other notification without further checks,
   including:

   - any `type` containing `Mention`, such as `issueMention` or
     `issueCommentMention`, or `category` `mentions`
   - reactions, meaning any `type` containing `Reaction`
   - review requests, re-requests, approvals, and all other pull-request or
     `reviews` activity
   - assignments not made by the Triage Rule, document content changes,
     project updates, and anything else that is not a comment

6. **Check each candidate.**

   1. Find the parent from the `url`. `/issue/<KEY>-<N>/...` gives
      `issueId: "<KEY>-<N>"`, `/document/<slug>` gives `documentId`, and
      `/project/<slug>` gives `projectId`. The comment ID prefix is the eight
      hex characters after `#comment-`. If either the parent or the prefix
      cannot be found, keep the notification.
   2. Call `list_comments` for the parent with `limit: 250`, following
      `cursor`. Cache each parent so it is listed once.
   3. Find the notifying comment, the one whose `id` starts with the prefix.
      If none matches, keep the notification.
   4. The thread root is the comment's `parentId` when set, or else the
      comment's own `id`. The thread is the root plus every comment whose
      `parentId` is the root.
   5. Keep the notification when any comment in the thread has `author.id` or
      `onBehalfOf.id` equal to the user's `id`.
   6. Keep the notification when the notifying comment's body @-mentions the
      user.
   7. Otherwise, clear it.

## Report

End with a short summary.

- **Counts.** Unread notifications scanned, cleared as done, cleared as status
  change, cleared as triage-assigned, idle candidates, cleared as idle, and
  kept. Cleared and kept add up to scanned.
- **Cleared.** One line per notification, in this form:
  `[<KEY>-<N>](issue url) — <title> — <author or notification type> (reason: <reason>)`.
  The reason is one of `issue completed`, `issue canceled`, `PR merged`,
  `status change`, `assigned by Triage Rule`, or
  `not mentioned, not in thread`. For a pull request, use the pull request's
  title as the link text and link its Linear review page. For a document or
  project, use its title as the link text and link its Linear page. Never
  invent an issue identifier.
- **Unresolved.** Every notification kept because something could not be
  resolved, with the reason: a failed lookup, no status type, no parent or
  comment prefix, or no matching comment.

Render every Linear issue identifier as a Markdown link to its Linear URL.
