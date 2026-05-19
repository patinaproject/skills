# Domain Docs

This is a single-context repository for Patina Project skill marketplace and installation documentation.

## Before exploring, read these when present

- `AGENTS.md` for repository workflow, release, GitHub, and skill-authoring rules.
- `docs/` for contributor documentation such as file structure and release flow.
- `CONTEXT.md` at the repository root, if it exists.
- `docs/adr/`, if it exists.

If `CONTEXT.md` or `docs/adr/` does not exist, proceed silently. Do not create domain docs just because they are absent; create them only when a term, workflow decision, or architectural decision needs durable documentation.

## Layout

Use a single-context layout unless the repository later adds `CONTEXT-MAP.md`:

```text
/
├── CONTEXT.md
├── docs/
│   └── adr/
└── skills/
```

When output names a repository concept, prefer the vocabulary already used in `AGENTS.md`, `docs/`, and the relevant skill `SKILL.md`.
