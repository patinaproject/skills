# Proof checks

## Map the dependency

Map each owed reply to the tracker issues and pull requests that its answer
depends on. Use the post's linked issue, issue keys in the thread, and issues
whose description or comments link the thread. When no dependency can be
found, block the reply with the blocker "no linked work found" and name the
threads searched.

## The three checks

Run the checks in order. The first failing check is the blocker.

### Shipped

All of these hold for every dependency:

- The pull request's merge commit is in the configured `production_branch`.
- A production deploy of that commit, or of a later commit, succeeded in the
  configured `deploy_workflow`.
- For a mobile change, the change reaches users through `mobile_delivery`.
  A dependency is a mobile change when its pull request matches the paths or
  labels that `mobile_delivery` names. An over-the-air update must be published on the production channel. A
  native change must be in a store release that is live, not only submitted.

Record the **release version** of the production deploy that passed this
check, such as `18.13.0`. Read it from that deploy: its release tag, or for a
mobile change, the version of the over-the-air update or store release that
carries the change. When several deploys pass, use the earliest one that
carries every dependency. When that deploy names no version, the check fails
with the blocker "no release version on the passing deploy".

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

When no public surface can show the case and the case is an in-app
interaction, the check passes as **inferred** when both of these hold:

- The dependency's pull request or tracker issue records a reproduction of the
  reported behavior.
- The pull request adds or changes a test for that behavior.

The reply must then ask the customer to try the action again, as `SKILL.md`
step 5 describes.

When no public surface can show the case and no reproduction is recorded, the
check fails. Block the reply with "Clears when: the operator confirms the case
in the live product".

## Evidence labels

Every check result carries a link and one label.

- **Measured.** You observed it this run, such as a commit on the branch, a
  deploy run's result, or a live response.
- **Inferred.** You concluded it from other evidence, such as a description
  that says no migration is needed.

A reply is proven only when every check passes. A check can pass on inferred
evidence, and the response shows the label so the operator can decide before
sending.

## Drop

Drop a candidate in these cases, and list it in the response footer.

- **Answered.** As `touchpoints.md` defines it.
- **No action.** The customer has nothing to do and nothing to learn. For
  example, the fix applies automatically and the customer did not ask to hear
  back.
- **Standing correction.** The memory file drops the case.
