// Release → feedback traversal.
//
// Deterministic, side-effect-free mechanics for the write-release-changelog
// ceremony. The model handles prose and judgement; these functions handle the
// reproducible "which feedback items did this release resolve?" question so two
// runs over the same release produce the same resolved set.

// `(#42)` is the standard GitHub "What's Changed" link form, so the boundary
// class deliberately admits a leading `(`. That also over-captures the rare
// markdown anchor `[see](#42)`, but any spurious number is filtered downstream:
// resolveFeedbackItems keeps only issues that exist AND link a feedback item,
// so a non-issue lands in `missing` and is surfaced, never acted on.
const HASH_REF = /(?:^|[^\w/])#(\d+)\b/g;
const ISSUE_URL = /https?:\/\/github\.com\/[^/\s]+\/[^/\s]+\/issues\/(\d+)/gi;

/**
 * Parse a release note body for the GitHub issues it references.
 *
 * Recognises `#123` shorthand and full `.../issues/123` URLs. Pull-request
 * URLs are ignored — only issues carry feedback links. Returns a numerically
 * sorted, de-duplicated list.
 *
 * @param {string|null|undefined} releaseNotes
 * @returns {number[]}
 */
export function parseReferencedIssues(releaseNotes) {
  if (!releaseNotes || typeof releaseNotes !== "string") return [];

  const found = new Set();
  for (const match of releaseNotes.matchAll(HASH_REF)) {
    found.add(Number(match[1]));
  }
  for (const match of releaseNotes.matchAll(ISSUE_URL)) {
    found.add(Number(match[1]));
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * Compute the resolved feedback set: the intersection of issues referenced by
 * the release and issues whose body links a feedback item.
 *
 * @param {object} params
 * @param {number[]} params.referencedIssues  Issue numbers from the release notes.
 * @param {Record<number, {number: number, body: string}>} params.issues
 *   Already-fetched issue stubs keyed by number. Issues not present here are
 *   reported as `missing` rather than silently dropped.
 * @param {RegExp} params.linkPattern  Adapter-supplied pattern that matches a
 *   feedback-item link in an issue body. Capture group 1 is the item slug/id.
 * @returns {{
 *   resolved: Array<{issueNumber: number, feedbackLink: string, feedbackRef: string}>,
 *   needsManualReview: number[],
 *   missing: number[]
 * }}
 */
export function resolveFeedbackItems({ referencedIssues, issues, linkPattern }) {
  const ordered = [...new Set(referencedIssues)].sort((a, b) => a - b);

  // A /g pattern makes String.match drop capture groups; normalize so an
  // adapter author's global flag does not silently degrade feedbackRef.
  const pattern = linkPattern.global
    ? new RegExp(linkPattern.source, linkPattern.flags.replace("g", ""))
    : linkPattern;

  const resolved = [];
  const needsManualReview = [];
  const missing = [];

  for (const number of ordered) {
    const issue = issues[number];
    if (!issue) {
      missing.push(number);
      continue;
    }
    const match = String(issue.body ?? "").match(pattern);
    if (match) {
      resolved.push({
        issueNumber: number,
        feedbackLink: match[0],
        feedbackRef: match[1] ?? match[0],
      });
    } else {
      needsManualReview.push(number);
    }
  }

  return { resolved, needsManualReview, missing };
}
