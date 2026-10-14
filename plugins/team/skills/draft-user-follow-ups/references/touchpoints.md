# Touchpoints

Search all three touchpoints on every run. Each search runs from now back
through the configured `lookback`.

## Email inbox

Two searches.

- **Awaiting a reply.** Inbound threads where the last message is from a
  customer. Exclude newsletters, receipts, and automated notifications. Include
  messages relayed by a `feedback_relay_senders` address, and record the real
  customer that the relayed message names.
- **Sent promises.** The operator's sent messages that promise a follow-up,
  with no later operator message in the same thread. Look for promise phrasing
  such as "I'll reply here as soon as it's live", "I'll let you know when",
  "once this ships", and "I'll follow up". The memory file can add phrases.

The reply location is the thread link.

## Feedback tool: support conversations

Open conversations, and conversations closed within the `lookback`, in two
cases. The last message is from the customer. Or an operator message promised
a follow-up and no later operator message exists. The reply location is the conversation link.

## Feedback tool: posts

Feature requests and bug posts in two cases.

- **Promise in a comment.** An operator comment promised an update, and no
  later operator comment exists.
- **Linked issue is Done.** The post links a tracker issue, natively or through
  `tracker_link_pattern`. The issue reached a completed state in the tracker.
  No operator reply after that completion reaches the reporter, or reaches the
  voters the operator promised to update.

For each post, the owed people are the reporter, plus the voters and
commenters a promise named. The reply location is the post link. When the tool
can notify voters through a status change, still write the reply text, and
leave the status change to the operator.

## Merge by person

Join candidates on email address first, then on the feedback-tool account
linked to that address. When the two cannot be joined with confidence, keep
them separate and mark the join as inferred in the response.

For each person, read every thread on every touchpoint, sent mail included.

## Answered

A candidate is **answered** when an operator message after the owed message
exists on any touchpoint, in any thread with that person. This is the one
definition of answered. The skill drops answered candidates.
