# Glossary — judging axes and worked model scores

The disclosed reference for [prompting-fable](SKILL.md)'s routing: the
judging axes and a worked score table. The axes are durable; the scores go
stale.

## Judging axes

### Intelligence

How hard a problem a model can handle unsupervised.

### Taste

The quality of what ships to humans: UI/UX, code quality, API design, copy.
Intelligence without taste solves any problem in code you don't want in your
codebase — "writes TypeScript like a Python dev."

### Cost

How freely you can spend a model, scored against your own subscriptions and
resets, not list price — a generous sub makes a frontier model effectively
free. Cost never picks the model for what ships: it is a tiebreaker when the
other axes agree, and a license to gather information cheaply before spending
a smarter model.

## Worked example: Theo's scores, mid-2026

Re-score for your own stack. Rankings 1–10, higher = better on every axis,
so a high cost score means cheap to run.

| Model | Cost | Intelligence | Taste |
| --- | --- | --- | --- |
| gpt-5.5 (Codex CLI) | 9 | 8 | 5 |
| sonnet-5 | 5 | 5 | 7 |
| opus-4.8 | 4 | 7 | 8 |
| fable-5 | 2 | 9 | 9 |

gpt-5.5's cost 9 is a generous Codex sub scored as what he actually pays, not
list price. sonnet-5's token hunger often makes opus-4.8 cheaper in practice
than the one-point gap suggests. Haiku is unscored: below the intelligence
bar for real work — never route to it.

Theo's threshold for "high taste": 7 or above on this scale. The routing and
escalation rules that consume these scores live in [SKILL.md](SKILL.md).
