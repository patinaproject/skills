---
name: write-changelog
description: Write user-facing changelog or release note text from a milestone or published release. Use when the user asks for milestone notes, release notes, or a changelog based on tracked issues.
---

# Write a changelog

Read `docs/issue-tracker.md` at the repository root before fetching issues or
writing user-facing text. It contains the tracker commands and the project's
writing style. If it is missing, stop and say that `scaffold-repository`
provides it.

Choose one source:

- For planned work, use one milestone and its issues.
- For shipped work, use one published release and resolve its `#N` or `PAT-N`
  issue references according to `docs/issue-tracker.md`.

A milestone shows what is planned. It does not prove that work shipped. Do not
reconstruct a release from GitHub event history. Release Please continues to
maintain the commit-based `CHANGELOG.md`; this skill writes issue-based
milestone summaries and release notes.

## Steps

1. Resolve exactly one requested milestone or release. Stop if the request
   matches more than one.
2. Fetch every attached issue, following all result pages. Read enough of each
   issue to understand the user impact.
3. Remove internal work unless it changes the user experience or the user asks
   for engineering notes.
4. Group the remaining entries under `New`, `Improved`, `Fixed`, and
   `Breaking`. Omit empty sections.
5. Rewrite each entry as a short user outcome. Remove internal paths, private
   context, and unnecessary implementation detail.
6. Return milestone notes as Markdown for review. For a published release,
   show the draft first and save it through the tracker instructions only when
   the user authorized publication.
7. Report the source, total issue count, omitted internal issue count, and the
   release note link when one exists.

Never say an item shipped only because its issue is complete.
