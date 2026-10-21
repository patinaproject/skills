# Memory template

Create the missing `Email inbox triage` folder in the `Agents` folder, then each missing document below inside it. Use the storage's native editable document format where it has one.

## `Rules`

The user owns this document. The skill reads it and never writes it after creating it.

```markdown
# Email inbox triage rules

Read on every email-inbox-triage run. Write your preferences here as list items,
one per line. Only list items are rules. For example, "account: me@example.com",
"Anything from my accountant is Action.", or "GitHub notifications are FYI
unless they mention me directly."
```

## `Learned`

The skill appends one line per correction to the end of this document. The user may edit or delete any line.

```markdown
# Email inbox triage learned rules

Added by email-inbox-triage when you move an archived thread back to the inbox.
Edit, delete, or move any line into the Rules document.
```

A Learned line names the date, the rule, and the evidence:

```markdown
- 2026-10-21: from `billing@vendor.example` → `Action` (you moved 1 `FYI` thread back to the inbox)
- 2026-10-21: from `support@vendor.example` → `Action` (you said 1 `FYI` thread, "Re: Question", needed `Action`)
```
