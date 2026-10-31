# Response format

Write the run's final response in this shape. "Ready to send" lists the
proven replies. Leave out a section that has no rows, and keep the footer.

```markdown
# Draft user follow-ups: <window start> to <window end>

## Ready to send

### <Person> (<touchpoint>)

- Reply here: <reply location link, or "no direct link" and the conversation ID>
- Draft: <draft link>, or the reply text in a quote block
- Depends on: <issue and pull-request links>
- Shipped: <evidence link> (measured | inferred)
- Data: <evidence link, or "no data step" with the pull request read> (measured | inferred)
- Works for this customer: <live surface link> (measured | inferred)

## Blocked

### <Person> (<touchpoint>)

- Reply location: <link, or "no direct link" and the conversation ID>
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
- Count: <proven> proven + <blocked> blocked + <dropped> dropped = <candidates>
```

The response gives a person's name and touchpoint. It holds no customer email
address. The links carry the operator to the thread.

## Links

A link whose text names an identifier, such as a tracker issue key, a
pull-request number, or a feedback-tool conversation ID, takes its text and its
URL from the same tool result. Before you write the response, check each link:
the identifier in its text must equal the identifier in its URL.

A feedback-tool conversation links to the tool's own URL for that conversation.
Build it from `feedback_conversation_url`, or take it from the tool's read.
When neither gives one, write "no direct link" and the conversation ID. Never
name a conversation without a link and without saying so. Email threads and
posts always get a link.
