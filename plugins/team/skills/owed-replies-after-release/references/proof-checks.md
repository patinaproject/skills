# Proof checks

## Map the dependency

Map each owed reply to the tracker issues and pull requests that its answer
depends on. Use the post's linked issue, issue keys in the thread, and issues
whose description or comments link the thread. When no dependency can be
found, block the reply with the blocker "no linked work found" and name the
threads searched.

A reply that needs no shipped change, such as a question with a known answer,
skips the shipped and data checks and runs only the works-for-this-customer
check.

## The three checks

Run the checks in order. The first failing check is the blocker.

### Shipped

All of these hold for every dependency:

- The pull request's merge commit is in the configured `production_branch`.
- A production deploy of that commit, or of a later commit, succeeded in the
  configured `deploy_workflow`.
- For a mobile change, the change reaches users through `mobile_delivery`.
  An over-the-air update must be published on the production channel. A
  native change must be in a store release that is live, not only submitted.

### Data

Every backfill, migration, or data job that the change needs ran in
production and finished. Read the result from `data_jobs`. When the change
needs no data step, record that, and name the pull request you read to decide
it.

### Works for this customer

Check the customer's own case on a configured `public_surfaces` entry, such as
the page, the item, or the public API response the customer reported. Use only
public reads. The check passes when the live surface shows the fixed behavior
for that case.

When no public surface can show the case, the check result is inferred from
the shipped and data checks, and the report says so.

## Evidence labels

Every check result carries a link and one label.

- **Measured.** You observed it this run, such as a commit on the branch, a
  deploy run's result, or a live response.
- **Inferred.** You concluded it from other evidence, such as a description
  that says no migration is needed.

A reply is proven only when every check passes. An inferred works-for-this-
customer result still counts as a pass, and the report shows the label so the
operator can decide before sending.

## Drop

Drop a candidate in two cases, and list it in the report footer.

- **Answered.** An operator message after the owed message exists on any
  touchpoint.
- **No action.** The customer has nothing to do and nothing to learn. For
  example, the fix applies automatically and the customer did not ask to hear
  back. A standing correction in the memory file can also drop a case.
