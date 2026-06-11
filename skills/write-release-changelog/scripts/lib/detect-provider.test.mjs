import assert from "node:assert/strict";
import { test } from "node:test";

import { detectProvider } from "./detect-provider.mjs";

// A minimal two-provider registry standing in for the real adapter fingerprints.
const registry = {
  featurebase: {
    mcpServers: ["featurebase"],
    issueBotAuthors: ["featurebase-bot"],
    linkHosts: ["feedback.featurebase.app"],
    dependencies: ["@featurebase/sdk"],
    secretNames: ["FEATUREBASE_API_KEY"],
  },
  canny: {
    mcpServers: ["canny"],
    issueBotAuthors: ["canny-bot"],
    linkHosts: ["feedback.canny.io"],
    dependencies: ["canny-sdk"],
    secretNames: ["CANNY_API_KEY"],
  },
};

test("explicit project config wins over every other signal", () => {
  const result = detectProvider({
    config: { provider: "canny" },
    mcpServers: ["featurebase"],
    issueFingerprints: { botAuthors: ["featurebase-bot"], linkHosts: [] },
    repoSignals: {},
    registry,
  });
  assert.equal(result.provider, "canny");
  assert.equal(result.source, "config");
  assert.equal(result.confident, true);
});

test("a single connected feedback MCP server is a confident match", () => {
  const result = detectProvider({
    config: null,
    mcpServers: ["featurebase"],
    issueFingerprints: {},
    repoSignals: {},
    registry,
  });
  assert.equal(result.provider, "featurebase");
  assert.equal(result.source, "mcp");
  assert.equal(result.confident, true);
});

test("two matching MCP servers are ambiguous and ask the operator", () => {
  const result = detectProvider({
    config: null,
    mcpServers: ["featurebase", "canny"],
    issueFingerprints: {},
    repoSignals: {},
    registry,
  });
  assert.equal(result.provider, null);
  assert.equal(result.source, "ask");
  assert.equal(result.confident, false);
  assert.deepEqual(result.candidates.sort(), ["canny", "featurebase"]);
});

test("issue-tracker fingerprints match when there is no config or MCP", () => {
  const result = detectProvider({
    config: null,
    mcpServers: [],
    issueFingerprints: {
      botAuthors: ["canny-bot"],
      linkHosts: ["feedback.canny.io"],
    },
    repoSignals: {},
    registry,
  });
  assert.equal(result.provider, "canny");
  assert.equal(result.source, "issue-fingerprint");
  assert.equal(result.confident, true);
});

test("repo/dependency/secret signals are the last automatic tier", () => {
  const result = detectProvider({
    config: null,
    mcpServers: [],
    issueFingerprints: {},
    repoSignals: { dependencies: ["@featurebase/sdk"], secrets: [] },
    registry,
  });
  assert.equal(result.provider, "featurebase");
  assert.equal(result.source, "repo-signal");
  assert.equal(result.confident, true);
});

test("MCP outranks issue fingerprints when both point at different providers", () => {
  const result = detectProvider({
    config: null,
    mcpServers: ["featurebase"],
    issueFingerprints: { botAuthors: ["canny-bot"], linkHosts: [] },
    repoSignals: {},
    registry,
  });
  assert.equal(result.provider, "featurebase");
  assert.equal(result.source, "mcp");
});

test("no signals at all falls through to asking the operator", () => {
  const result = detectProvider({
    config: null,
    mcpServers: [],
    issueFingerprints: {},
    repoSignals: {},
    registry,
  });
  assert.equal(result.provider, null);
  assert.equal(result.source, "ask");
  assert.equal(result.confident, false);
  assert.deepEqual(result.candidates, []);
});
