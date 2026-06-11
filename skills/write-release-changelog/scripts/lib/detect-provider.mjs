// Provider detection.
//
// An ordered heuristic that stops at the first confident match, falling back to
// asking the operator when a tier is ambiguous or every tier is silent. The
// registry supplies per-provider fingerprints; adding a provider is adding a
// registry entry, never editing this control flow.

/**
 * @typedef {object} ProviderFingerprint
 * @property {string[]} [mcpServers]      Connected feedback-tool MCP server ids.
 * @property {string[]} [issueBotAuthors] Integration-bot issue authors.
 * @property {string[]} [linkHosts]       Hosts that appear in feedback links.
 * @property {string[]} [dependencies]    Package names that imply the provider.
 * @property {string[]} [secretNames]     Secret/env names that imply the provider.
 * @property {string[]} [files]           Repo files that imply the provider.
 */

/**
 * Detect the project's feedback provider.
 *
 * Tier order (first confident match wins): explicit config → connected MCP →
 * issue-tracker fingerprints → repo/dependency/secret signals → ask. A tier
 * that matches exactly one provider is confident; a tier that matches more than
 * one is ambiguous and short-circuits to asking the operator with candidates.
 *
 * @param {object} signals
 * @param {{provider?: string}|null} signals.config
 * @param {string[]} [signals.mcpServers]
 * @param {{botAuthors?: string[], linkHosts?: string[]}} [signals.issueFingerprints]
 * @param {{dependencies?: string[], secrets?: string[], files?: string[]}} [signals.repoSignals]
 * @param {Record<string, ProviderFingerprint>} signals.registry
 * @returns {{provider: string|null, source: string, confident: boolean, candidates: string[]}}
 */
export function detectProvider({
  config,
  mcpServers = [],
  issueFingerprints = {},
  repoSignals = {},
  registry,
}) {
  // Tier 1: explicit config naming the provider.
  if (config?.provider) {
    return confident(config.provider, "config");
  }

  const providers = Object.entries(registry);

  // Tier 2: a connected feedback-tool MCP server.
  const mcpMatches = matchTier(providers, (fp) =>
    overlaps(fp.mcpServers, mcpServers),
  );
  const mcp = decideTier(mcpMatches, "mcp");
  if (mcp) return mcp;

  // Tier 3: issue-tracker fingerprints (bot authors and feedback link hosts).
  const fingerprintMatches = matchTier(
    providers,
    (fp) =>
      overlaps(fp.issueBotAuthors, issueFingerprints.botAuthors) ||
      overlaps(fp.linkHosts, issueFingerprints.linkHosts),
  );
  const fingerprint = decideTier(fingerprintMatches, "issue-fingerprint");
  if (fingerprint) return fingerprint;

  // Tier 4: repo, dependency, or secret signals.
  const repoMatches = matchTier(
    providers,
    (fp) =>
      overlaps(fp.dependencies, repoSignals.dependencies) ||
      overlaps(fp.secretNames, repoSignals.secrets) ||
      overlaps(fp.files, repoSignals.files),
  );
  const repo = decideTier(repoMatches, "repo-signal");
  if (repo) return repo;

  // Tier 5: nothing matched — ask the operator.
  return { provider: null, source: "ask", confident: false, candidates: [] };
}

function matchTier(providers, predicate) {
  return providers.filter(([, fp]) => predicate(fp)).map(([id]) => id);
}

function decideTier(matches, source) {
  if (matches.length === 1) return confident(matches[0], source);
  if (matches.length > 1) {
    return { provider: null, source: "ask", confident: false, candidates: matches };
  }
  return null;
}

function confident(provider, source) {
  return { provider, source, confident: true, candidates: [] };
}

function overlaps(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  const set = new Set(a);
  return b.some((value) => set.has(value));
}
