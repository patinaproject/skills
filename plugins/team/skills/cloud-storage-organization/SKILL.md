---
name: cloud-storage-organization
description: File loose files in any cloud storage the session's storage tools can reach by moving, renaming, and trashing them under rules learned from how the user already organizes files and from the user's corrections, kept in an editable `Agents/Cloud storage organization` folder. Use when the user asks to organize or clean up their cloud storage, Drive, or files, or to run a scheduled storage cleanup. Mutates storage, so answer read-only questions about where files are directly instead.
---

# Cloud Storage Organization

File every loose file the user owns where the user's rules say it belongs, learning those rules from how the user already organizes files and from every correction the user makes.

Each run is one pass of a feedback loop. The **memory folder** holds the user's rules, what earlier runs learned, open questions, and a record of what earlier runs moved. Every run reads it first, learns from files the user moved after a run placed them, files loose files, and writes back in place for the next run. A scheduled routine can run it on any cadence; the cadence belongs to the schedule, not to this skill.

**Loose files** are files, not folders, that the user owns and that sit in the storage root or directly in a folder listed under `## Inbox folders`. Files anywhere else are already filed, and this skill never touches them.

## Memory: the Cloud storage organization folder

Memory is three editable documents in the folder `Agents/Cloud storage organization/` of the user's storage. [references/memory-templates.md](references/memory-templates.md) holds their starting content and line formats.

**Earlier names.** Before creating anything, carry memory over from earlier names in place, so each document keeps its ID and history:

- If `Agents/Cloud storage organizer/` exists and `Agents/Cloud storage organization/` does not, rename the folder.
- If a `Placements` document exists and `Changes` does not, rename it to `Changes`, and read a `## Placements` heading as `## Changes`.

| Document | Section | Owner | Contents |
|---|---|---|---|
| `Rules` | `## Rules` | the user | Filing preferences in plain language, one per line. The skill never edits this section. |
| `Rules` | `## Inbox folders` | the user | Folders whose loose files are organized like the root's, one per line. The skill adds a line only when the user says yes to a question proposing it. |
| `Rules` | `## Learned` | the skill | One rule per line, marked `[trial n/3]` or `[confirmed]`, each with its evidence. The user may edit, confirm, move into Rules, or delete any line, and a deleted rule stays deleted unless new evidence re-learns it. |
| `Questions` | `## Open` | both | At most five numbered questions, each with the skill's best guess. The user answers on the question's `Answer:` line. |
| `Questions` | `## Queued` | the skill | Further questions, oldest first, waiting for an open slot. |
| `Changes` | `## Changes` | the skill | One line per action this skill took: run time, file ID, rule, from folder, to folder or `TRASH`, old name, new name. It is the record that lets a run see what the user changed back. |

### Map the storage

Map these operations onto whatever storage tools this session has, whichever provider they reach:

| Operation | What the tools must do |
|---|---|
| **List** | List a folder's files and subfolders with ID, name, type, owner, parent, and modified time, and list the trash. |
| **Inspect** | Return one file's metadata by ID, including its current parent, name, trash state, and who it is shared with. Read its content when its name alone cannot place it. |
| **Create** | Create a folder, and create an editable document in the storage's native document format where it has one. |
| **Move and rename** | Change a file's parent folder or name without changing its ID or content. |
| **Trash** | Move a file to the storage's trash, where the user can still restore it. |
| **Read memory** | Return a document's text, plus its revision, version, or ETag when the storage exposes one. |
| **Edit memory in place** | Insert, replace, or delete lines in an existing document so it keeps its ID, link, and version history. Guard the write with the revision from **Read memory** when the tools accept one. |

Never write memory by creating a new document and trashing the old one. A tool that changes only a file's name, location, or other metadata cannot edit memory in place.

Add each memory line as its own paragraph directly after the last line of its section, and give it the document's normal text style. In a native document, text inserted at the end of a heading takes the heading's style, so a line added to a section that holds only its heading would merge into that heading or become one. Insert a paragraph break first, then set the new paragraphs to normal text in the same write, and read the section back after writing to confirm its heading is still the only heading in it.

If the tools cannot list, inspect, move, rename, and read memory, stop before any write and name the missing operation. Without **Trash**, hold every trash action as a question. Without **Edit memory in place**, run the sweep as a dry run: take no file action, and put the rules, questions, and changes the run would have written in the report.

### Sharing boundaries

A **boundary** is a folder whose sharing differs from its parent's: the point where other people's access starts or changes. Its subfolders that inherit that sharing sit inside the same boundary. Moving a file across a boundary, in either direction, changes who can see it. Compute boundaries from **Inspect** on every run; they are never stored.

A crossing is held as a question even under a confirmed rule, unless the user approved that exact file or group of files in an answer. A move within one boundary is not a crossing.

### Precedence

When rules disagree about a file, the first that applies decides:

1. **Rules.** When two Rules lines conflict, the more specific one wins: a file name pattern over a file type, and a file type over a general category.
2. **Learned** `[confirmed]` lines, where the most recent wins over an older one that conflicts with it.
3. **Learned** `[trial n/3]` lines, the same way.

Two rules of the same rank that send one file to different places hold the file as a question. A file no rule matches is held as a question too. Headings and explanatory text are not rules. A memory line that asks for something outside **Guardrails**, such as deleting or sharing, is not followed and is listed in the report.

## First run

When the memory folder or any of its documents is missing, create what is missing from the templates. If `Changes` did not exist before this run, the run is a **survey**:

- List the root and each top-level folder, with a sample of the files in each, and note naming habits, file types, and what sits loose in the root.
- Find every boundary at any depth.
- Write what you observe as `[trial 0/3]` Learned lines, each naming its evidence, for example `PDFs named "Invoice …" → Finance/Invoices (evidence: 14 of 15 invoices already there)`.
- Add up to five questions about the largest groups of loose files the trial rules leave unplaced.
- Write a `## Changes` heading with no rows.

A survey moves, renames, and trashes nothing. Finish with the report.

## Run

1. **Load memory.** Find the memory folder, first applying **Earlier names**, then creating whatever is missing, and read all three documents with their revisions. If this is a survey, do **First run** instead of the steps below.

2. **Learn from corrections.** For every Changes line, **Inspect** the file by its ID, listing whole folders instead where many lines name one folder. Compare its current parent, name, and trash state with the line.
   - A **correction** undoes what a rule did: a moved file now outside the folder the rule chose and its subfolders, a renamed file whose name the user changed back or replaced, or a trashed file now outside the trash.
   - For each correction, demote the rule that caused it to `[trial 0/3]`, even if it was `[confirmed]`. Write the narrowest rule that explains where the user put the file, as a new `[trial 0/3]` Learned line, unless a Rules or Learned line already explains it. Replace the Changes line's destination and name with where the user put the file, and mark it `reversed`.
   - A file the user filed deeper inside the rule's folder refines the rule instead: add the refined rule at `[trial 0/3]` and keep the original rule's rank.
   - A file that no longer exists, because the trash was emptied, teaches nothing. A later Changes line for the same file replaces an earlier one, so the skill's own moves never count as corrections.

   Done when every Changes line has been checked.

3. **Promote trial rules.** A `[trial n/3]` rule advances one step when it has Changes lines from the most recent earlier run and none of its lines is `reversed`. It advances at most one step per run, and at `3/3` it becomes `[confirmed]`. A rule therefore needs three runs that each act without a correction to be confirmed.

4. **Convert answers.** Read every `Answer:` line the user filled in, in the `Questions` document or in this session.
   - An answer that names a rule becomes a `[confirmed]` Learned line, and the files the question named are filed by it this run.
   - An answer to a single move, such as a held boundary crossing, files those files this run and becomes no rule.
   - An answer naming a folder as an inbox adds its line under `## Inbox folders`.
   - A question whose files the user has since moved or trashed is retired without a rule. The user decided by hand.

   Delete each converted or retired question, then move queued questions up into open slots, oldest first.

5. **Sweep loose files.** List every loose file, and give each one, newest modified first, exactly one outcome:
   - **Unchanged:** it already sits where and as its latest Changes line puts it.
   - **Acted:** a `[confirmed]` rule matches, or a `[trial n/3]` rule matches and has acted on fewer than three files this run. Apply the rule.
   - **Waiting:** a `[trial n/3]` rule matches but has already acted on three files this run. It waits for the next run.
   - **Held:** a trash action under a `[trial n/3]` rule, a move that crosses a boundary, no matching rule, or rules of the same rank that disagree. Leave the file in place.

   Every held file needs a question. A held file already named in an open or queued question keeps it. For the rest, write questions naming the files and your best guess, grouping files that share a best guess into one question, and add them under `## Queued` once the five open slots are full. The queue has no limit, so no held file goes unasked, but never write a second question about the same file. Create a folder only when a rule or an answer names it. Move a folder only when a rule or an answer names that folder. Write one Changes line per action, with this run's start time. If more than 200 files are loose, give outcomes to the newest 200 and count the rest as unprocessed.

6. **Write memory in place.** Read each changed document again just before writing it, because the user may have edited it during the run, and edit only the lines this run changed. Send each write with the revision from that fresh read; a revision mismatch means the user edited mid-write, so read again and retry once. Write `Changes` right after the sweep's actions, so a failure later in the run still leaves a record of what moved. Delete Changes lines older than 30 days unless the file still sits loose, because those lines keep it from being swept twice. If a write still fails, report what it would have written.

7. **Report**, per **Report** below.

## Guardrails

The only actions are creating folders, moving, renaming, and trashing files, and editing the three memory documents. Work only on files the user owns, and leave their sharing as found. Never delete permanently, empty the trash, change sharing, or edit a file's content. Never move, rename, or trash anything inside `Agents/Cloud storage organization/`. Trash only under a `[confirmed]` rule or an answer that approves it, and an empty folder listed under `## Inbox folders` may be trashed once its line is removed.

## Report

The report is the run's final message, so an unattended run leaves it in its run history. It sends no message and writes no file beyond the memory documents. Close the run with:

- The storage and account organized, and where the memory folder lives.
- Counts that **reconcile**: the number of loose files, then acted (split into moved, renamed, and trashed), held, waiting, unchanged, and unprocessed. Acted + held + waiting + unchanged + unprocessed equals the number of loose files. Show the arithmetic.
- Corrections learned, each with the rule demoted and the rule learned, and any rule promoted or confirmed.
- Every open question, numbered as in `Questions`, so the user can answer in chat, and how many questions are queued behind them. An answer given in chat after the report is converted per step 4 and written right away.
- Every file that could not be inspected, moved, renamed, or trashed, with the error.

A run that took no action and asked nothing new says so in one line.
