---
name: finish-pr
description: Deprecated name for ready-pr.
disable-model-invocation: true
---

# Finish PR is deprecated

Confirm that `ready-pr` is installed. If it is missing, stop and provide this
command:

```sh
npm_config_ignore_scripts=true pnpm dlx skills@latest add patinaproject/skills --skill ready-pr -y
```

Run `ready-pr` with the user's complete request and return its result. Add no
extra steps. `ready-pr` handles publication, checks, review feedback, and the
draft-to-ready change. It does not merge the pull request or enable auto-merge.
