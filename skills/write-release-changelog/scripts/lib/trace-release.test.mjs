import assert from "node:assert/strict";
import { test } from "node:test";

import {
  parseReferencedIssues,
  resolveFeedbackItems,
} from "./trace-release.mjs";

test("parseReferencedIssues extracts #-style references", () => {
  const notes = "## What's new\n- Fixes #12 and #3\n- Also closes #45.";
  assert.deepEqual(parseReferencedIssues(notes), [3, 12, 45]);
});

test("parseReferencedIssues extracts full GitHub issue URLs", () => {
  const notes =
    "Resolved https://github.com/acme/widget/issues/77 in this release.";
  assert.deepEqual(parseReferencedIssues(notes), [77]);
});

test("parseReferencedIssues de-duplicates and sorts numerically", () => {
  const notes = "#10 #2 #10 #2 #100";
  assert.deepEqual(parseReferencedIssues(notes), [2, 10, 100]);
});

test("parseReferencedIssues ignores pull-request URLs", () => {
  const notes = "See https://github.com/acme/widget/pull/9 and #4";
  assert.deepEqual(parseReferencedIssues(notes), [4]);
});

test("parseReferencedIssues returns [] for empty or missing notes", () => {
  assert.deepEqual(parseReferencedIssues(""), []);
  assert.deepEqual(parseReferencedIssues(null), []);
});

const linkPattern = /https:\/\/feedback\.example\.com\/p\/([a-z0-9-]+)/i;

test("resolveFeedbackItems returns the intersection of referenced and linked issues", () => {
  const result = resolveFeedbackItems({
    referencedIssues: [3, 12, 45],
    issues: {
      3: { number: 3, body: "Fixes https://feedback.example.com/p/dark-mode" },
      12: { number: 12, body: "internal refactor, no feedback" },
      45: { number: 45, body: "closes https://feedback.example.com/p/export-csv" },
    },
    linkPattern,
  });

  assert.deepEqual(
    result.resolved.map((r) => ({ issue: r.issueNumber, link: r.feedbackLink })),
    [
      { issue: 3, link: "https://feedback.example.com/p/dark-mode" },
      { issue: 45, link: "https://feedback.example.com/p/export-csv" },
    ],
  );
});

test("resolveFeedbackItems flags referenced issues with no feedback link for manual review", () => {
  const result = resolveFeedbackItems({
    referencedIssues: [3, 12],
    issues: {
      3: { number: 3, body: "https://feedback.example.com/p/dark-mode" },
      12: { number: 12, body: "no link here" },
    },
    linkPattern,
  });

  assert.deepEqual(result.needsManualReview, [12]);
});

test("resolveFeedbackItems reports referenced issues that could not be fetched", () => {
  const result = resolveFeedbackItems({
    referencedIssues: [3, 99],
    issues: {
      3: { number: 3, body: "https://feedback.example.com/p/dark-mode" },
    },
    linkPattern,
  });

  assert.deepEqual(result.missing, [99]);
  assert.equal(result.resolved.length, 1);
});

test("resolveFeedbackItems tolerates a global-flagged adapter link pattern", () => {
  // Adapter authors may supply a /g pattern; String.match with /g drops capture
  // groups, so the function must normalize it rather than degrade feedbackRef.
  const result = resolveFeedbackItems({
    referencedIssues: [3],
    issues: { 3: { number: 3, body: "https://feedback.example.com/p/dark-mode" } },
    linkPattern: /https:\/\/feedback\.example\.com\/p\/([a-z0-9-]+)/gi,
  });
  assert.equal(result.resolved[0].feedbackRef, "dark-mode");
});

test("resolveFeedbackItems is deterministic and idempotent across two runs", () => {
  const input = {
    referencedIssues: [45, 3, 12],
    issues: {
      3: { number: 3, body: "https://feedback.example.com/p/a" },
      12: { number: 12, body: "https://feedback.example.com/p/b" },
      45: { number: 45, body: "no link" },
    },
    linkPattern,
  };
  const first = resolveFeedbackItems(input);
  const second = resolveFeedbackItems(input);
  assert.deepEqual(first, second);
  // resolved ordered by issue number regardless of input order
  assert.deepEqual(first.resolved.map((r) => r.issueNumber), [3, 12]);
});
