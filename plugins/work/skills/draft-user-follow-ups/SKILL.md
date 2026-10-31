---
name: draft-user-follow-ups
description: Draft follow-ups to users after a production release. Find every customer owed a reply, prove the fix reached them, and draft the reply in place for a person to send. Use the morning after a release, or when the operator asks who is owed a reply now that something shipped. Writes drafts only.
---

# Draft User Follow-ups

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
- **Human on the loop.** The operator reads the response, sends each reply, and
  records standing corrections in the consumer's memory file.

A reply is **owed** when the person's last message waits for an operator
answer, or when the operator promised a follow-up and wrote nothing after the
promise. [`references/touchpoints.md`](references/touchpoints.md) defines when
an owed reply is **answered**.

## Scope

The run reads everything. It writes email drafts and, when the consumer
configures a state file, one line in that file. Every other surface ends the
run exactly as it started. Messages stay unsent. The feedback tool keeps its
posts, comments, statuses, and conversations. The tracker keeps its issues,
production keeps its data, and the memory file keeps its text. Feedback-tool
replies go into the response as text for the operator to paste. The
operator's existing drafts end the run unchanged. The run never edits, sends,
or deletes them.

## Run

### 1. Load the consumer config

Read [`references/consumer-contract.md`](references/consumer-contract.md), then
read the consuming repository's config, support voice doc, and memory file at
the paths that contract names. Hold the memory file's standing corrections for
the steps where each one acts.

Map each configured tool onto the session's tools: mail search, thread read,
draft listing, and draft creation for email; conversation and post reads for
the feedback tool; issue and pull-request reads for the tracker; deploy history
for the production pipeline. Draft listing for email is required. Reading
feedback-tool drafts is optional. When the session cannot read them, continue.
The response marks those drafts as not read.

Completion criterion: every required config key has a value, and every
required operation maps to a session tool. Otherwise stop before any read of
customer data, and name each missing key or operation.

### 2. Set the window

The window ends now. It starts at the previous run's end, read from the state
file. With no state file or no entry in it, the window starts at the beginning
of the previous business day. On a Monday, that start is the previous Friday,
so the window covers the weekend.

List the production releases and deploys in the window from the configured
production branch and deploy workflow. Record each deploy's commit, time, and
result.

Completion criterion: a window with a start and an end, and a list of
production deploys in it, each with commit, time, and result. An empty list is
a valid result. Owed replies can still exist from earlier releases, so
continue.

### 3. Build the candidate list

Read [`references/touchpoints.md`](references/touchpoints.md) and search all
three touchpoints: the email inbox, the feedback tool's support conversations,
and the feedback tool's posts. Apply the standing corrections that change what
counts as owed, such as an added promise phrase.

Merge candidates by person, and read every thread each person has on every
touchpoint, sent mail included. Attach each person's **operator drafts** to
the candidate. An operator draft is an unsent draft written from one of the
`operator_addresses`, in any thread or conversation read for that person. Mark
each candidate **answered** or **owed**.

Completion criterion: each touchpoint has a searched-and-counted result. Each
candidate has a touchpoint, a reply location link, the full set of threads
read, its operator drafts or none, and a mark of answered or owed with its
reason.

### 4. Prove each owed reply

Read [`references/proof-checks.md`](references/proof-checks.md). Map each owed
reply to the tracker issues and pull requests it depends on. Run the three
checks in order: **shipped**, **data**, and **works for this customer**.

Classify each candidate:

- **Proven** when all three checks pass.
- **Blocked** on the first failing check, with the evidence and the action that
  clears it.
- **Dropped** when it is answered, when the person has no action to take, or
  when a standing correction drops it.

Completion criterion: every candidate is proven, blocked, or dropped, and every
check result carries a link and a label of **measured** or **inferred**.

### 5. Draft the proven replies

Write each reply in the consumer's support voice. Tell the customer what
changed and what they can do now, in their terms.

Write only about what the customer reported. Leave out account, registration,
or contest status that the customer did not ask about.

When the fix is in an in-app interaction, ask the customer to try the action
again: "Could you give it another try?" Give the steps, and link the
customer's own item or page where the steps start.

Every reply about a shipped feature or fix, on every touchpoint, contains this
sentence exactly, with the release version that the **shipped** check recorded
for this reply:

```text
This was fixed in the v<version> update! Close and reopen the app to get the fix.
```

Take the version from this run's **shipped** check only. A version in an
earlier reply, a thread, or the memory file names an older release. The
support voice shapes the rest of the reply and leaves this sentence as written.

- **Email.** First apply the reuse test below to each operator draft in the
  thread.
  - When an operator draft passes, create no draft. That operator draft is the
    candidate's draft.
  - Otherwise create a draft as a reply inside the customer's existing thread.
    When the thread came from a feedback-tool relay sender, address the draft
    to the real customer, whose address the relayed message carries. Record
    the draft link. When the thread holds an operator draft, say what differs
    from it, and name which draft to keep and which to delete.
  - Never create more than one new draft per thread.
- **Feedback tool.** Write the reply text and the link to the post or
  conversation where the operator will paste it. This covers a support
  conversation message and a post comment. When an operator draft exists
  there, name it and say what differs.

An operator draft passes the **reuse test** when all three hold. A draft with
an older version fails.

- It is a reply inside the candidate's thread.
- It is addressed to the real customer. For a relay thread, that is the
  relayed address.
- It contains the release sentence word for word, with this run's **shipped**
  version.

Completion criterion: every proven reply has a draft link or reply text, and a
reply location link. An operator draft that passed the reuse test counts as the
draft link. Every proven reply about a shipped feature or fix contains the
release sentence with its own recorded version. Every proven reply stays on the
reported topic, and a reply for a fixed in-app interaction asks the customer to
try again, with the steps and a link to their own item or page. Blocked replies
get no new draft from the run.

### 6. Respond

Write the response with
[`references/response-format.md`](references/response-format.md). When the
consumer configures a state file, append this run's window end to it.

Completion criterion: the response accounts for every candidate as proven,
blocked, or dropped, and the count of proven, blocked, and dropped equals the
count of candidates. When a state file is configured, it holds this run's
window end.
