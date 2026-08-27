# Make a private repository public

Changing visibility also changes where issues are filed. Get a reviewed plan
before changing Git history.

1. List open issues, pull requests, branches, tags, releases, forks, branch
   protection, and workflow `uses:` entries that point to commits in this
   repository.
2. Configure one-way GitHub-to-Linear issue intake. Record that later field
   updates synchronize both ways and that the Linear copies must not be edited
   or closed.
3. Create the required GitHub issue labels with descriptions.
4. Re-file open repository work on GitHub with links back to the Linear issues,
   then close the original Linear issues with links to GitHub.
5. Map every old issue and commit reference to its new public GitHub object or
   replacement text. Review the complete map.
6. Merge or close every pull request. List pull request merge commits and other
   GitHub-created refs that cannot be rewritten. Back up and check the
   repository before rewriting history:

   ```sh
   git clone --mirror <repository-url> repository-backup.git
   git clone repository-backup.git repository-restore-check
   git -C repository-restore-check fsck --full
   ```

   Perform only the history changes approved in the reviewed map.
7. Change commit, pull request, issue, ADR, contributor, agent, and tracker
   instructions to the public format. Update merged pull request text
   separately.
8. Restore branch protection. Update workflow `uses:` SHA values that point to
   this repository. Verify existing releases and the next Release Please
   result, then notify fork owners.

Never perform step 6 during a normal repository update. It requires a separate
reviewed migration plan.
