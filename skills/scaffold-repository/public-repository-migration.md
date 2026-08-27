# Make a private repository public

Changing visibility also changes where issues are filed. Get a reviewed plan
before changing Git history.

1. List current issue references, open work, pull requests, tags, releases,
   forks, branch protection, and self-referencing action commits.
2. Configure one-way GitHub-to-Linear issue intake. Record that later field
   updates synchronize both ways and that the Linear copies must not be edited
   or closed.
3. Create the required GitHub issue labels with descriptions.
4. Re-file open repository work on GitHub with links back to the Linear issues,
   then close the original Linear issues with links to GitHub.
5. Review a complete map from every old reference to its new public GitHub
   object or replacement text.
6. Merge or close every pull request, list GitHub-managed fixed references,
   create and restore-test a mirror backup, then perform only the approved
   history changes across repository branches and tags.
7. Change commit, pull request, issue, ADR, contributor, agent, and tracker
   instructions to the public format. Update merged pull request text
   separately.
8. Restore branch protection, update self-referencing action commits, verify
   releases and the next release calculation, and notify fork owners.

Never perform step 6 during a normal repository update. It requires a separate
reviewed migration plan.
