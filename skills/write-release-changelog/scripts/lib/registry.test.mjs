import assert from "node:assert/strict";
import { test } from "node:test";

import { registry } from "./registry.mjs";
import { detectProvider } from "./detect-provider.mjs";
import { resolveFeedbackItems } from "./trace-release.mjs";

test("the reference Featurebase adapter is registered with required fingerprints", () => {
  const fb = registry.featurebase;
  assert.ok(fb, "featurebase must be in the registry");
  assert.ok(Array.isArray(fb.mcpServers) && fb.mcpServers.length > 0);
  assert.ok(fb.feedbackLinkPattern instanceof RegExp);
});

test("Featurebase fingerprints drive a confident MCP detection", () => {
  const result = detectProvider({
    config: null,
    mcpServers: registry.featurebase.mcpServers,
    issueFingerprints: {},
    repoSignals: {},
    registry,
  });
  assert.equal(result.provider, "featurebase");
  assert.equal(result.confident, true);
});

test("Featurebase link pattern resolves a real-shaped post URL from an issue body", () => {
  const result = resolveFeedbackItems({
    referencedIssues: [7],
    issues: {
      7: {
        number: 7,
        body: "Closes https://acme.featurebase.app/p/dark-mode after merge.",
      },
    },
    linkPattern: registry.featurebase.feedbackLinkPattern,
  });
  assert.equal(result.resolved.length, 1);
  assert.equal(
    result.resolved[0].feedbackLink,
    "https://acme.featurebase.app/p/dark-mode",
  );
  assert.equal(result.resolved[0].feedbackRef, "dark-mode");
});
