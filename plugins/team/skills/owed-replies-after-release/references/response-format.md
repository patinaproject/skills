# Response format

Write the run's final response in this shape. "Ready to send" lists the
proven replies. Leave out a section that has no rows, and keep the footer.

```markdown
# Owed replies after release: <window start> to <window end>

## Ready to send

### <Person> (<touchpoint>)

- Reply here: <reply location link>
- Draft: <draft link>, or the reply text in a quote block
- Depends on: <issue and pull-request links>
- Shipped: <evidence link> (measured | inferred)
- Data: <evidence link, or "no data step" with the pull request read> (measured | inferred)
- Works for this customer: <live surface link> (measured | inferred)

## Blocked

### <Person> (<touchpoint>)

- Reply location: <link>
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
