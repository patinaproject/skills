# Memory templates

Create each missing document in `Agents/Cloud storage organizer/` with the content below. Use the storage's native editable document format where it has one. Keep every `##` heading, which the skill uses to find each section.

## Rules

```markdown
# Cloud storage organizer rules

Read on every cloud-storage-organizer run. Write your preferences under Rules
and list inbox folders under Inbox folders. The skill writes only Learned.
Edit, confirm, or delete any Learned line.

## Rules

## Inbox folders

## Learned
```

A Rules line is plain language:

```markdown
- Receipts and invoices go in Finance/<year>.
- Never touch anything in Family Photos.
```

An Inbox folders line names one folder:

```markdown
- Downloads
```

A Learned line names its rank, the rule, and the evidence:

```markdown
- [trial 1/3] PDFs named "Invoice …" → Finance/Invoices (evidence: 14 of 15 invoices already there)
- [confirmed] Screenshots → Images/Screenshots, renamed "Screenshot YYYY-MM-DD" (evidence: answered question, 2026-10-21)
```

## Questions

```markdown
# Cloud storage organizer questions

Write your answer after "Answer:". The next run acts on it.

## Open

## Queued
```

A question names its files, its best guess, and an empty answer line. Keep each field a nested bullet: converting Markdown into a native document merges plain continuation lines into one paragraph.

```markdown
1. Where should these 4 loose spreadsheets named "Budget …" go?
   - Best guess: Finance/Budgets (new folder)
   - Files: Budget 2025.xlsx, Budget 2026.xlsx, Budget Q3.xlsx, Budget draft.xlsx
   - Answer:
```

## Changes

```markdown
# Cloud storage organizer changes

Managed by cloud-storage-organizer. Do not edit. Lines older than 30 days are removed.

## Changes
```

Each line in Changes records one action. Separate fields with ` | `, and mark a line the user undid with `reversed` at the end:

```markdown
- 2026-10-21T00:05Z | 1AbC… | PDFs named "Invoice …" | / → Finance/Invoices | Invoice 0412.pdf → Invoice 0412.pdf
- 2026-10-21T00:05Z | 1XyZ… | Old installers | / → TRASH | setup.dmg → setup.dmg
- 2026-10-14T00:05Z | 1QrS… | Screenshots | / → Images/Screenshots | IMG_1.png → Screenshot 2026-10-14.png | reversed
```
