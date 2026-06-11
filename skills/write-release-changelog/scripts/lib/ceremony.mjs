// Release-time write orchestration.
//
// Drives the public-facing phase of the release ceremony through a provider
// adapter, enforcing the skill's hard safety rules in code rather than relying
// on the model to remember them:
//
//   - The changelog is created as a DRAFT, never published here.
//   - Public replies and status→complete are applied ONLY when the release is
//     live AND the operator approved that class of action.
//   - Re-runs are idempotent: items already replied-to or already complete are
//     left alone, so running the ceremony twice does not duplicate posts.
//   - Feedback-derived text is passed to the adapter as opaque data. Control
//     flow is derived from the resolved-item set, never from feedback content,
//     so injected instructions in a reply body cannot trigger extra actions.

const COMPLETE = "complete";

/**
 * @typedef {object} Adapter
 * @property {(args: {link: string}) => Promise<{id: string, status: string, hasResolutionComment: boolean}>} resolveItem
 * @property {(args: {title: string, body: string}) => Promise<{draftId: string, published: boolean}>} createChangelogDraft
 * @property {(args: {itemId: string, body: string, visibility: "public"|"private"}) => Promise<unknown>} postComment
 * @property {(args: {itemId: string, status: string}) => Promise<unknown>} setStatus
 */

/**
 * Run the release-time write phase.
 *
 * @param {object} params
 * @param {Array<{feedbackLink: string, replyBody: string}>} params.resolvedItems
 * @param {{title: string, body: string}} params.changelog
 * @param {Adapter} params.adapter
 * @param {{replies?: boolean, status?: boolean}} params.approval
 * @param {boolean} params.releaseIsLive
 * @returns {Promise<{changelogDraft: object, actions: Array<object>}>}
 */
export async function runReleaseCeremony({
  resolvedItems,
  changelog,
  adapter,
  approval = {},
  releaseIsLive,
}) {
  // The changelog draft is not public content, so it is always created. The
  // operator publishes it out of band once they have reviewed it.
  const changelogDraft = await adapter.createChangelogDraft({
    title: changelog.title,
    body: changelog.body,
  });

  const actions = [];
  for (const item of resolvedItems) {
    const resolved = await adapter.resolveItem({ link: item.feedbackLink });

    const reply = await applyGuarded({
      gate: gateFor({
        releaseIsLive,
        approved: approval.replies === true,
        alreadyDone: resolved.hasResolutionComment === true,
      }),
      apply: () =>
        adapter.postComment({
          itemId: resolved.id,
          body: item.replyBody,
          visibility: "public",
        }),
    });

    const status = await applyGuarded({
      gate: gateFor({
        releaseIsLive,
        approved: approval.status === true,
        alreadyDone: resolved.status === COMPLETE,
      }),
      apply: () => adapter.setStatus({ itemId: resolved.id, status: COMPLETE }),
    });

    actions.push({ itemId: resolved.id, feedbackLink: item.feedbackLink, reply, status });
  }

  return { changelogDraft, actions };
}

// Decide whether a public op may run. Order matters: a non-live release is the
// hardest stop, then operator approval, then idempotency.
function gateFor({ releaseIsLive, approved, alreadyDone }) {
  if (!releaseIsLive) return "release-not-live";
  if (!approved) return "not-approved";
  if (alreadyDone) return "already-applied";
  return null;
}

async function applyGuarded({ gate, apply }) {
  if (gate) return { applied: false, skippedReason: gate };
  await apply();
  return { applied: true };
}
