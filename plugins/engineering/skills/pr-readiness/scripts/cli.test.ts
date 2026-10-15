import { describe, expect, it } from "bun:test";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "./cli.ts";
import { MemoryPacketStore } from "./adapters.ts";
import { HEAD, checkRun, fakeForge, invoke, review } from "./fake-forge.ts";
import type { EvaluationReport } from "./evaluator.ts";

const report = (stdout: string): EvaluationReport => JSON.parse(stdout) as EvaluationReport;

describe("pr-readiness gate", () => {
  it("posts success with description ready and exits 0", () => {
    const forge = fakeForge();
    const result = invoke(["gate", "--repo", "o/r", "--pr", "7", "--target-url", "https://example.test/run"], forge);
    expect(result.code).toBe(0);
    expect(forge.statusCalls).toEqual([{ head: HEAD, state: "success", description: "ready", targetUrl: "https://example.test/run" }]);
    expect(forge.markReadyCalls).toEqual([]);
  });
  it("posts failure naming the missing obligations and still exits 0", () => {
    const forge = fakeForge({ reviews: [], checkRuns: [] });
    const result = invoke(["gate", "--repo", "o/r", "--pr", "7"], forge);
    expect(result.code).toBe(0);
    expect(forge.statusCalls).toEqual([{ head: HEAD, state: "failure", description: "missing: standards, spec, hygiene, tests, lint, behavior, body evidence", targetUrl: undefined }]);
  });
  it("exits 1 without posting when the forge read fails", () => {
    const forge = fakeForge();
    const result = invoke(["gate", "--repo", "o/r", "--pr", "7"], { ...forge, readEvidence: () => { throw new Error("HTTP 502"); } });
    expect(result.code).toBe(1);
    expect(result.stderr).toBe("pr-readiness: HTTP 502\n");
    expect(forge.statusCalls).toEqual([]);
  });
});

describe("pr-readiness check", () => {
  it("never posts a status and exits 0 when ready", () => {
    const forge = fakeForge();
    const result = invoke(["check", "--repo", "o/r", "--pr", "7"], forge);
    expect(result.code).toBe(0);
    expect(report(result.stdout).ready).toBe(true);
    expect(forge.statusCalls).toEqual([]);
    expect(forge.markReadyCalls).toEqual([]);
  });
  it("fails with the policy parse error for a malformed policy file", () => {
    const result = invoke(["check", "--repo", "o/r", "--pr", "7"], fakeForge({ policy: "{ not json" }));
    expect(result.code).toBe(1);
    expect(result.stderr).toStartWith("pr-readiness: .github/pr-readiness.json is not valid JSON");
  });
  it("fails naming an unknown obligation in the policy file", () => {
    const result = invoke(["check", "--repo", "o/r", "--pr", "7"], fakeForge({ policy: JSON.stringify({ version: 1, obligations: { vibes: { producer: "approval" } } }) }));
    expect(result.code).toBe(1);
    expect(result.stderr).toBe("pr-readiness: .github/pr-readiness.json names unknown obligation: vibes\n");
  });
  it("requires approval for every obligation when the base has no policy file", () => {
    const result = invoke(["check", "--repo", "o/r", "--pr", "7"], fakeForge({ policy: undefined, reviews: [] }));
    expect(result.code).toBe(1);
    const produce = "a maintainer other than @patinaproject-goodyear[bot] runs code-review at 0123456789ab and approves: gh pr review 7 --repo o/r --approve";
    expect(report(result.stdout).decisions.map((d) => [d.obligation, d.validity, d.produce])).toEqual([
      ["standards", "rerun-required", produce], ["spec", "rerun-required", produce], ["hygiene", "rerun-required", produce],
      ["tests", "rerun-required", produce], ["lint", "rerun-required", produce], ["behavior", "rerun-required", produce],
    ]);
  });
});

describe("pr-readiness publish", () => {
  it("rejects a head race without forge mutation", () => {
    const forge = fakeForge({ heads: [HEAD, "f".repeat(40)] });
    const store = new MemoryPacketStore();
    const result = invoke(["publish", "--repo", "o/r", "--pr", "7", "--takeover", "true"], forge, store);
    expect(result.code).toBe(1);
    expect(forge.markReadyCalls).toEqual([]);
    expect(forge.statusCalls).toEqual([]);
    expect(store.packets.size).toBe(0);
  });
  it("is idempotent for an already-ready PR and posts no status", () => {
    const forge = fakeForge({ isDraft: false });
    const result = invoke(["publish", "--repo", "o/r", "--pr", "7"], forge);
    expect(result.code).toBe(0);
    expect(result.stdout).toBe(`PR #7 is already ready at ${HEAD}\n`);
    expect(forge.statusCalls).toEqual([]);
  });
  it("refuses an unready candidate without posting", () => {
    const forge = fakeForge({ checkRuns: [checkRun("Unit tests", { conclusion: "failure" })], reviews: [review({ state: "CHANGES_REQUESTED" })] });
    const result = invoke(["publish", "--repo", "o/r", "--pr", "7", "--takeover", "true"], forge);
    expect(result.code).toBe(1);
    expect(forge.markReadyCalls).toEqual([]);
    expect(forge.statusCalls).toEqual([]);
  });
});

describe("pr-readiness run", () => {
  it("returns 1 through the error path when no command is given", () => {
    const err = process.stderr.write.bind(process.stderr); let stderr = "";
    process.stderr.write = ((chunk: string) => { stderr += chunk; return true; }) as typeof process.stderr.write;
    const store = process.env.PATINA_READINESS_STORE; process.env.PATINA_READINESS_STORE = mkdtempSync(join(tmpdir(), "readiness-run-"));
    try { expect(run([])).toBe(1); } finally { process.stderr.write = err; if (store === undefined) delete process.env.PATINA_READINESS_STORE; else process.env.PATINA_READINESS_STORE = store; }
    expect(stderr).toBe("pr-readiness: usage: pr-readiness open|check|publish|gate\n");
  });
});
