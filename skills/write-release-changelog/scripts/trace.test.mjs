import assert from "node:assert/strict";
import { test } from "node:test";
import { execFile } from "node:child_process";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const run = promisify(execFile);
const here = dirname(fileURLToPath(import.meta.url));
const CLI = join(here, "trace.mjs");

test("trace CLI emits the resolved feedback set as JSON", async () => {
  const dir = await mkdtemp(join(tmpdir(), "trace-cli-"));
  try {
    const notes = join(dir, "notes.md");
    const issues = join(dir, "issues.json");
    await writeFile(notes, "## v1.2.0\n- Fixes #7\n- Refactor #8\n");
    await writeFile(
      issues,
      JSON.stringify([
        { number: 7, body: "Closes https://acme.featurebase.app/p/dark-mode" },
        { number: 8, body: "internal only" },
      ]),
    );

    const { stdout } = await run("node", [
      CLI,
      "--provider",
      "featurebase",
      "--release-notes",
      notes,
      "--issues",
      issues,
    ]);
    const result = JSON.parse(stdout);

    assert.deepEqual(result.referencedIssues, [7, 8]);
    assert.equal(result.resolved.length, 1);
    assert.equal(result.resolved[0].issueNumber, 7);
    assert.deepEqual(result.needsManualReview, [8]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("trace CLI fails clearly on an unknown provider", async () => {
  const dir = await mkdtemp(join(tmpdir(), "trace-cli-"));
  try {
    const issues = join(dir, "issues.json");
    await writeFile(issues, "[]");
    await assert.rejects(
      run("node", [CLI, "--provider", "nope", "--issues", issues], {
        input: "",
      }),
      (error) => {
        assert.match(error.stderr, /Unknown --provider 'nope'/);
        return true;
      },
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
