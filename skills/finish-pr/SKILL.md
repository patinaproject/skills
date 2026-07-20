---
name: finish-pr
description: Deprecated compatibility alias for ready-pr.
disable-model-invocation: true
---

# Finish PR (Deprecated)

Confirm `ready-pr` is installed. If it is missing, stop with:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill ready-pr -y
```

Invoke `ready-pr` with the caller's complete scope and return its result.

`ready-pr` is the single source of truth for publication, checks, review
feedback, draft-to-ready handling, and final ready-to-merge gates. This alias
adds no workflow steps and never merges a pull request or enables auto-merge.
