# Triage Labels

The `triage` skill speaks in canonical triage roles and needs the label strings
this repository maps them to.

`issue-tracker.md` → **Triage roles** is that mapping, and is authoritative.
Read it rather than a copy here: it carries the state roles, the two category
roles (`bug` and `enhancement`), the lifecycle each role implies in GitHub and
Linear, and the rule that a triaged issue holds exactly one category role and
one state role.

This repository uses the role names verbatim as its label strings, so no
translation is needed. Resolve the live label name from the provider's
inventory before applying one — a role name and its label string can differ in
a repository that renames them.
