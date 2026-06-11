#!/usr/bin/env node
// Thin CLI over the deterministic traversal. The agent gathers release notes
// and referenced-issue bodies (via gh) and feeds them here to get a
// reproducible resolved-feedback set, instead of eyeballing the release.
//
// Usage:
//   node trace.mjs --provider featurebase \
//     --release-notes notes.md --issues issues.json
//
//   --release-notes <file>  Release note body. Reads stdin when omitted.
//   --issues <file>         JSON: array of {number, body} or object keyed by number.
//   --provider <id>         Registry provider id supplying the feedback link pattern.
//
// Prints JSON: { referencedIssues, resolved, needsManualReview, missing }.

import { readFile } from "node:fs/promises";

import { registry } from "./lib/registry.mjs";
import {
  parseReferencedIssues,
  resolveFeedbackItems,
} from "./lib/trace-release.mjs";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i];
    if (key.startsWith("--")) {
      args[key.slice(2)] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

function normalizeIssues(raw) {
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : Object.values(parsed);
  const issues = {};
  for (const issue of list) {
    issues[issue.number] = { number: issue.number, body: issue.body ?? "" };
  }
  return issues;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const provider = registry[args.provider];
  if (!provider) {
    const known = Object.keys(registry).join(", ");
    throw new Error(
      `Unknown --provider '${args.provider}'. Known providers: ${known}.`,
    );
  }

  const releaseNotes = args["release-notes"]
    ? await readFile(args["release-notes"], "utf8")
    : await readStdin();

  if (!args.issues) {
    throw new Error("--issues <file> is required.");
  }
  const issues = normalizeIssues(await readFile(args.issues, "utf8"));

  const referencedIssues = parseReferencedIssues(releaseNotes);
  const { resolved, needsManualReview, missing } = resolveFeedbackItems({
    referencedIssues,
    issues,
    linkPattern: provider.feedbackLinkPattern,
  });

  process.stdout.write(
    `${JSON.stringify({ referencedIssues, resolved, needsManualReview, missing }, null, 2)}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
