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

- Reply here: <reply location link>
- Existing drafts: <each operator draft link with its last-edited date>, "none", or "not read"
- Draft: <new draft link>, or "operator draft" with its link, or the reply text in a quote block
- Differs: <what the new draft or reply text changes from the operator draft>
- Keep: <draft link>; delete: <each other draft link>
- Depends on: <issue and pull-request links>
- Shipped: <evidence link> (measured | inferred)
- Data: <evidence link, or "no data step" with the pull request read> (measured | inferred)
- Works for this customer: <live surface link> (measured | inferred)

## Blocked

### <Person> (<touchpoint>)

- Reply location: <link>
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
- Count: <proven> proven + <blocked> blocked + <dropped> dropped = <candidates>
```

The response gives a person's name and touchpoint. It holds no customer email
address. The links carry the operator to the thread.
