# Delegate a repository check

`scaffold-repository` normally runs in one task. When the host delegates the
existing repository check to a subagent, give it the target path, owner,
repository name, description, and visibility.

Require the subagent to read [audit-checklist.md](./audit-checklist.md) before
editing. It must show a diff for every proposed change and wait for the user to
accept it. Its final report lists accepted, skipped, and deferred changes in
the checklist's order.
