import { afterAll, describe, expect, it } from "bun:test";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, realpathSync, rmSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ISSUE_ENTRY_POINTS,
  PROTECTED_OPERATIONS,
  decideContinuation,
  type CheckoutSnapshot,
  type RouteRequest,
} from "./issue-handoff.ts";

const checkout: CheckoutSnapshot = {
  branch: "435-canonical",
  head: "0123456789abcdef",
  worktreePath: "/worktrees/issue-435",
};

function request(
  entry: (typeof ISSUE_ENTRY_POINTS)[number],
  operation: (typeof PROTECTED_OPERATIONS)[number]
): RouteRequest {
  return {
    entry,
    operation,
    preflight: {
      kind: "passed",
      issue: {
        id: "#435",
        provider: "github",
        url: "https://github.com/patinaproject/skills/issues/435",
      },
      endingBranch: checkout.branch,
      worktreePath: checkout.worktreePath,
    },
  };
}

describe("issue handoff policy", () => {
  it("defines both issue-linked entries and every protected operation", () => {
    expect(ISSUE_ENTRY_POINTS).toEqual(["direct", "session-pickup"]);
    expect(PROTECTED_OPERATIONS).toEqual([
      "branch-change",
      "edit",
      "commit",
      "pull-request-change",
      "operational-run",
    ]);
  });

  for (const entry of ISSUE_ENTRY_POINTS) {
    for (const operation of PROTECTED_OPERATIONS) {
      it(`refuses ${entry} ${operation} when the preflight is missing`, () => {
        expect(
          decideContinuation({ entry, operation }, checkout)
        ).toEqual({
          kind: "stop",
          reason: "missing-preflight",
          blocked: PROTECTED_OPERATIONS,
        });
      });

      it(`allows ${entry} ${operation} after a matching pass`, () => {
        expect(decideContinuation(request(entry, operation), checkout)).toEqual(
          {
            kind: "continue",
            issue: "#435",
          }
        );
      });
    }
  }

  for (const gate of [
    "completed-issue",
    "blocker",
    "dirty-worktree",
    "branch-owned-elsewhere",
  ]) {
    it(`refuses a failed ${gate} gate`, () => {
      expect(
        decideContinuation(
          {
            entry: "direct",
            operation: "edit",
            preflight: {
              kind: "failed",
              gate,
              issue: "#435",
            },
          },
          checkout
        )
      ).toEqual({
        kind: "stop",
        reason: "preflight-failed",
        blocked: PROTECTED_OPERATIONS,
      });
    });
  }

  it("treats no-issue as a terminal routing result", () => {
    expect(
      decideContinuation(
        {
          entry: "direct",
          operation: "edit",
          preflight: { kind: "no-issue" },
        },
        checkout
      )
    ).toEqual({
      kind: "stop",
      reason: "no-issue",
      blocked: PROTECTED_OPERATIONS,
    });
  });

  it("refuses a pass from a non-canonical branch", () => {
    expect(
      decideContinuation(request("direct", "edit"), {
        ...checkout,
        branch: "t3code/generated",
      })
    ).toEqual({
      kind: "stop",
      reason: "stale-checkout",
      blocked: PROTECTED_OPERATIONS,
    });
  });

  it("refuses a pass from another physical worktree", () => {
    expect(
      decideContinuation(request("session-pickup", "commit"), {
        ...checkout,
        worktreePath: "/worktrees/other",
      })
    ).toEqual({
      kind: "stop",
      reason: "stale-checkout",
      blocked: PROTECTED_OPERATIONS,
    });
  });
});

describe("issue handoff CLI", () => {
  const script = join(import.meta.dir, "issue-handoff.ts");
  const receiptRoots: string[] = [];

  afterAll(() => {
    for (const path of receiptRoots) {
      rmSync(path, { recursive: true });
    }
  });

  function git(...args: string[]): string {
    const result = Bun.spawnSync(["git", ...args], {
      cwd: import.meta.dir,
    });
    expect(result.exitCode).toBe(0);
    return result.stdout.toString().trim();
  }

  async function run(input: unknown) {
    const receiptRoot = await mkdtemp(join(tmpdir(), "issue-handoff-test-"));
    receiptRoots.push(receiptRoot);
    const result = spawnSync(process.execPath, [script, "route"], {
      cwd: import.meta.dir,
      env: { ...process.env, PATINA_ISSUE_RECEIPT_DIR: receiptRoot },
      input: JSON.stringify(input),
      encoding: "utf8",
    });
    return {
      exitCode: result.status,
      stderr: result.stderr,
      stdout: result.stdout,
    };
  }

  it("refuses a direct route with no working-on-issues result", async () => {
    const result = await run({ entry: "direct", operation: "edit" });

    expect(result.exitCode).toBe(2);
    const output = JSON.parse(result.stdout);
    expect(output.kind).toBe("stop");
    expect(output.reason).toBe("missing-preflight");
    expect(existsSync(output.receiptPath)).toBe(true);
  });

  it("routes session pickup only after a matching pass", async () => {
    const branch = git("branch", "--show-current");
    const worktreePath = realpathSync(git("rev-parse", "--show-toplevel"));
    const result = await run({
      entry: "session-pickup",
      operation: "operational-run",
      preflight: {
        kind: "passed",
        issue: {
          id: "#435",
          provider: "github",
          url: "https://github.com/patinaproject/skills/issues/435",
        },
        endingBranch: branch,
        worktreePath,
      },
    });

    expect(result.exitCode).toBe(0);
    const output = JSON.parse(result.stdout);
    expect(output.kind).toBe("continue");
    expect(existsSync(output.receiptPath)).toBe(true);
    const receipt = JSON.parse(readFileSync(output.receiptPath, "utf8"));
    expect(receipt.request.entry).toBe("session-pickup");
    expect(receipt.decision.kind).toBe("continue");
  });

  it("persists an explicit no-issue receipt while refusing the route", async () => {
    const result = await run({
      entry: "direct",
      operation: "pull-request-change",
      preflight: { kind: "no-issue" },
    });

    expect(result.exitCode).toBe(2);
    const output = JSON.parse(result.stdout);
    expect(output.reason).toBe("no-issue");
    const receipt = JSON.parse(readFileSync(output.receiptPath, "utf8"));
    expect(receipt.request.preflight).toEqual({ kind: "no-issue" });
  });
});
