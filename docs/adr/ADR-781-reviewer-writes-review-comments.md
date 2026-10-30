# ADR-781: The reviewer writes every review comment

## Status

Accepted.

## Context

`pr-review-assistant` presents someone else's pull request to a reviewer. It
wrote a ready-to-copy comment in the reviewer's voice for each comment item and
two comments for each decide item. When the reviewer asked, the coordinator
posted those comments to GitHub or Linear as the reviewer.

A drafted comment carries the agent's judgment. A reviewer who pastes or
approves it can skip the thinking that a review is for. Then nobody checks
that the pull request solves the right problem, and the reviewer and the author
do not get a shared understanding of the change.

## Decision

The reviewer writes every review comment. The skill teaches the change and
does not write the review.

- The agent never posts review comments to GitHub or Linear. When the reviewer
  asks, it refuses in one line, gives the reason, and links the `file:line`.
- The agent does not draft review-comment text anywhere, chat included. It
  corrects factual errors in a draft the reviewer wrote, with linked
  `file:line`, and does not reword it.
- Each item states the facts, the trade-off, and the open question in the
  presenter's voice. No item contains text the reviewer can paste.
- The artifact database holds only the reviewer's own checklist: a `raised`
  collection with one document per decide or comment item that the reviewer
  raised. Only the page reads and writes it.

## Alternatives considered

- **Draft comments and leave posting to the reviewer.** Rejected: a comment
  phrased for pasting gets pasted, so the agent's judgment still replaces the
  reviewer's.
- **Post only text the reviewer typed in chat.** Rejected: who submits the
  comment does not matter. The reviewer could still paste agent text into chat.
  A full refusal is easier to follow.
- **Let the agent tick "Raised" from forge threads.** Rejected: the checklist
  records what the reviewer did, so only the reviewer changes it.
- **Comprehension checks.** Rejected: better explanation and open follow-up
  questions serve the reviewer without testing them.

## Consequences

A review takes the reviewer more time to write. Every comment the author reads
comes from the reviewer's own understanding. The `rulings` and `applied`
collections are retired without migration, and the coordinator no longer reads
the artifact database. A future change that adds drafted comments or
agent-posted reviews must supersede this ADR.
