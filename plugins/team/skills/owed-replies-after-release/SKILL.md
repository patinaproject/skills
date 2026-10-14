---
name: owed-replies-after-release
description: Find every customer owed a reply after a production release, prove the fix reached them, and draft the reply in place. Use the morning after a release, or when the operator asks who is owed a reply now that something shipped. Writes drafts only.
---

# Owed Replies After Release

This skill is a control loop, in the sense of the sibling
[`design-control-loop`](../design-control-loop/SKILL.md) skill, applied to
customer support.

- **Set point.** By the morning after a release, every customer the operator
  owes a reply has one of two outcomes. The outcome is a **proven** reply that
  is ready to send, with a direct link to where to reply. Or the outcome is a
  named **blocker**.
- **Sensor.** The releases in the **window**, and the **owed** replies found
  across every **touchpoint**.
- **Controller.** The three proof checks for each owed reply.
- **Actuator.** Email drafts inside the customer's thread, and reply text for
  the feedback tool.
- **Human on the loop.** The operator reads the report, sends each reply, and
  records standing corrections in the consumer's memory file.

A reply is **owed** when the person's last message waits for an operator
answer, or when the operator promised a follow-up and wrote nothing after the
promise.

## Scope

The run reads everything and writes two things: email drafts, and one
run-log line in the consumer's memory file. Every other surface ends the run
exactly as it started. Messages stay unsent. The
feedback tool keeps its posts, comments, statuses, and conversations. The
tracker keeps its issues, and production keeps its data. Feedback-tool replies
go into the report as text for the operator to paste.

## Run

### 1. Load the consumer config

Read [`references/consumer-contract.md`](references/consumer-contract.md), then
read the consuming repository's config, support voice doc, and memory file at
the paths that contract names.

Map each configured tool onto the session's tools: mail search, thread read,
and draft creation for email; conversation and post reads for the feedback
tool; issue and pull-request reads for the tracker; deploy history for the
production pipeline.

Completion criterion: every required config key has a value, and every
required operation maps to a session tool. Otherwise stop before any read of
customer data, and name each missing key or operation.

### 2. Set the window

The window starts at the end of the previous run and ends now. Take the
previous run's end from the memory file. When the memory file has none, start
the window at the beginning of the previous business day. On a Monday, that
start is the previous Friday, so the window covers the weekend.

List the production releases and deploys in the window from the configured
production branch and deploy workflow. Record each deploy's commit, time, and
result.

Completion criterion: a window with a start and an end, and a list of
production deploys in it, each with commit, time, and result. An empty list is
a valid result. Owed replies can still exist from earlier releases, so
continue.

### 3. Build the owed-reply list

Read [`references/touchpoints.md`](references/touchpoints.md) and search all
three touchpoints: the email inbox, the feedback tool's support conversations,
and the feedback tool's posts.

Merge candidates by person. For each person, search every thread they have on
every touchpoint, sent mail included, before you call a reply owed. A later
operator message on any thread means the reply is already answered.

Completion criterion: each touchpoint has a searched-and-counted result, and
each person in the list has an owed reason, a touchpoint, a reply location
link, and the full set of threads you searched for them.

### 4. Prove each owed reply

Read [`references/proof-checks.md`](references/proof-checks.md). Map each owed
reply to the tracker issues and pull requests it depends on. Run the three
checks in order: **shipped**, **data**, and **works for this customer**.

Classify each owed reply:

- **Proven** when all three checks pass.
- **Blocked** on the first failing check, with the evidence and the action that
  clears it.
- **Dropped** when the person has no action to take, or when step 3 found the
  reply already answered. Apply the memory file's standing corrections here.

Completion criterion: every owed reply is proven, blocked, or dropped, and
every check result carries a link and a label of **measured** or **inferred**.

### 5. Draft the proven replies

Write each reply in the consumer's support voice. Tell the customer what
changed and what they can do now, in their terms.

- **Email.** Create a draft as a reply inside the customer's existing thread.
  When the thread came from a feedback-tool relay sender, address the draft to
  the real customer, whose address the relayed message carries. Record the
  draft link.
- **Feedback tool.** Write the reply text and the link to the post or
  conversation where the operator will paste it.

Completion criterion: every proven reply has a draft link or reply text, and a
reply location link. Blocked replies have no draft.

### 6. Report

Write the response with
[`references/response-format.md`](references/response-format.md). Record this
run's window end in the memory file's run log, so the next run starts there.

Completion criterion: the response accounts for every person from step 3 as
ready, blocked, or dropped. The count of ready, blocked, and dropped equals the
count of people in the owed-reply list.
