# Response format

Write the run's final response in this shape. "Ready to send" lists the
proven replies. Leave out a section that has no rows, and keep the footer.
Write the `Differs:` line only when the candidate has an operator draft and
the run wrote a new draft or reply text. Write the `Keep:` line only when the
thread holds both an operator draft and a new draft from this run.

```markdown
# Draft user follow-ups: <window start> to <window end>

## Ready to send

### <Person> (<touchpoint>)

- Reply here: <reply location link, or "no direct link" and the conversation ID>
- Existing drafts: <each operator draft link with its last-edited date>, "none", or "not read"
- Draft: <new draft link>, or "operator draft" with its link, or the reply text in a quote block
- Differs: <what the new draft or reply text changes from the operator draft>
- Keep: <draft link>; delete: <each other draft link>
- Depends on: <issue and pull-request links>; for a remap, <duplicate link> remapped to <original link> (measured | inferred)
- Shipped: <evidence link> (measured | inferred)
- Data: <evidence link, or "no data step" with the pull request read> (measured | inferred)
- Works for this customer: <live surface link> (measured | inferred)

## Blocked

### <Person> (<touchpoint>)

- Reply location: <link, or "no direct link" and the conversation ID>
- Existing drafts: <each operator draft link with its last-edited date>, "none", or "not read"
- Blocker: <first failing check and what failed>
- Evidence: <links, each measured | inferred>
- Clears when: <the action or event that clears the blocker>

## Footer

- Releases checked: <each production deploy with commit, time, and result, or "none in window">
- Sources searched: <each touchpoint with its search and the count it returned>
- Dropped as answered: <person, touchpoint, and the link to the later operator message>
- Dropped as no action: <person, touchpoint, and why>
- Dropped by standing correction: <person, touchpoint, and the correction>
- Config keys missing: <optional keys that turned off part of the method>
- Drafts not read: <touchpoints whose drafts the session could not read>, or "none"
- Tracker cleanup: duplicates: <duplicate link> duplicates <original link> (<relation | comment link>); child should block: <child link> under <tracking issue link>; Done after the reply is sent: <tracking issue link>; or "none"
- Count: <proven> proven + <blocked> blocked + <dropped> dropped = <candidates>
```

Tracker cleanup is text for the operator. Leave the tracker unchanged.

The response gives a person's name and touchpoint. It holds no customer email
address. The links carry the operator to the thread, except where a support
conversation gives "no direct link" under the rule below.

## Links

A link whose text names an identifier, such as a tracker issue key, a
pull-request number, or a feedback-tool conversation ID, takes its text and its
URL from the same tool result. Before you write the response, check each link:
the identifier in its text must equal the identifier in its URL. When they
differ, rebuild the link from one tool result.

A feedback-tool conversation, and any link into it such as an operator draft
or a later operator message, links to the tool's own URL for that conversation.
Build it from `feedback_conversation_url`, or take it from the tool's read.
When neither gives one, write "no direct link" and the conversation ID. Email
threads and posts always get a link.
