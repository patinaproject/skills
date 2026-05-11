# Wiki Index

This file lists every intended wiki page on `patinaproject/skills.wiki` with its name and
purpose. Wiki publishing is a follow-up post-merge action; the pages listed here are not
yet live. Publishing them is tracked as part of issue [#58](https://github.com/patinaproject/skills/issues/58).

## Planned wiki pages

| Wiki page name | Purpose |
| --- | --- |
| `Install-Claude-Code` | Step-by-step Claude Code install: `npx skills@1.5.6 add patinaproject/skills@<plugin>` for each plugin plus the `/plugin marketplace add` fallback. |
| `Install-Codex` | Step-by-step Codex install: `npx skills@1.5.6 add patinaproject/skills@<plugin> --agent codex` for each plugin plus the `codex plugin marketplace add` fallback. |
| `Skill-scaffold-repository-usage` | Full usage walkthrough for `scaffold-repository`: new-repo scaffold mode, realignment mode, what each baseline file does, and how to add optional surfaces. Source of truth for the plugin's user-facing behavior (the SKILL.md covers agent instructions; this page covers human intent). |
| `Skill-superteam-usage` | Full usage walkthrough for `superteam`: teammate roles (Team Lead, Brainstormer, Planner, Executor, Reviewer, Finisher), how to invoke the skill on an issue, how to hand off between teammates, and how to read the resulting design and plan docs. |
| `Skill-using-github-usage` | Full usage walkthrough for `using-github`: `/using-github` entry point, issue filing, branch creation, PR preparation, and changelog writing. |
| `Skill-office-hours-usage` | Usage walkthrough for the `office-hours` standalone skill. Covers Startup mode (six forcing questions) and Builder mode (enthusiastic design partner). Entry points: say "office hours", "grill this idea", or "is this worth building". Source of truth for this page is `.agents/skills/office-hours/SKILL.md` — the page links to that file and does not duplicate the SKILL.md body. |
| `Skill-find-skills-usage` | Usage walkthrough for the `find-skills` standalone skill: how to ask the agent to discover and install skills, what the skill resolves against (the vercel-labs registry), and how to install results. |
| `Troubleshooting` | Common failure modes: skills CLI cloning errors, broken symlinks in the canonical overlay, Codex `source: path` rejection, `core.symlinks` false on Windows/WSL, and how to reset the canonical overlay. |
| `How-Superteam-Runs-End-To-End` | Narrative walkthrough of a full superteam run from issue creation through merged PR: which teammate fires when, what artifacts land at each stage, and how to recover from a stalled run. |

## Publishing instructions (post-merge)

Wiki publishing is a separate write surface and is not gated by the PR. To publish after
merge:

1. Clone `https://github.com/patinaproject/skills.wiki.git`.
2. Create one `.md` file per page named exactly as listed above (e.g. `Install-Claude-Code.md`).
3. Source content for each page from the matching `plugins/<name>/README.md` (for plugin usage
   pages) and from `README.md` (for the install pages and troubleshooting). Standalone-skill
   pages source from `.agents/skills/<name>/SKILL.md` description/trigger sections only — do
   not copy the full SKILL.md body.
4. Push to the wiki repo default branch. GitHub renders the pages immediately.
5. Update the `plugin README.md` pointer headers in `plugins/<name>/README.md` so the wiki
   links resolve.
