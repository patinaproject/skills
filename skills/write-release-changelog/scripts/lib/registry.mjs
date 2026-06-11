// Provider registry — the fingerprints and link patterns that detection and
// traversal consume. Adding support for a feedback tool is adding an entry
// here plus implementing the runtime adapter (see ADAPTER-INTERFACE.md);
// neither detection nor traversal control flow changes.
//
// Featurebase is the reference adapter. The other entries are detection-only
// stubs shipped as starting points; a real runtime adapter is still required
// before the ceremony can write to them.

export const registry = {
  featurebase: {
    mcpServers: ["featurebase"],
    issueBotAuthors: ["featurebase-bot"],
    linkHosts: ["featurebase.app"],
    dependencies: ["@featurebase/sdk", "featurebase"],
    secretNames: ["FEATUREBASE_API_KEY", "FEATUREBASE_ORG"],
    files: [],
    // Matches a Featurebase post URL, capturing the post slug.
    // e.g. https://acme.featurebase.app/p/dark-mode
    feedbackLinkPattern: /https?:\/\/[^/\s]*featurebase\.app\/p\/([a-z0-9-]+)/i,
  },
};
