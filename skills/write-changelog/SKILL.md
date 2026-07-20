---
name: write-changelog
description: Render user-facing changelog or release-note copy from a project milestone or shipped Release. Use when the user asks for milestone notes, release notes, or a changelog derived from tracked issues.
---

# Write Changelog

Read [`docs/issue-tracker.md`](../../docs/issue-tracker.md) for remote
operations and repository brand-voice guidance before writing user-facing copy.

## Choose the source

- **Planning milestone:** resolve one project and project milestone, then list
  its issues. This answers what a delivery phase contains.
- **Shipped Release:** fetch one Release and its attached issues, then create or
  update the corresponding release notes through the adapter. This answers what
  actually shipped.

Do not use project milestones as proof of shipping. Do not reconstruct shipped
content by walking forge event timelines. Release Please continues to own the
commit-level `CHANGELOG.md`; this skill owns issue-level milestone and Release
summaries.

## Workflow

1. Resolve the requested project milestone or Release. Refuse an ambiguous
   target.
2. Fetch all attached issues, following pagination, and include the issue
   descriptions needed to understand user impact.
3. Exclude internal-only work unless it materially changes the user experience
   or the user asks for an engineering changelog.
4. Group kept entries under `New`, `Improved`, `Fixed`, and `Breaking`; omit
   empty groups.
5. Rewrite entries as concise user outcomes. Avoid issue titles that expose
   implementation details, internal paths, or private context.
6. For a project milestone, return Markdown for review. For a Release, present
   the draft and, when publishing is authorized, save it as tracker release
   notes through the adapter.
7. Report the source identifier, issue count, omitted internal count, and the
   created or updated release-note link when one exists.

Never claim an item shipped merely because its issue is completed.
