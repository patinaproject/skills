import { describe, expect, it } from "bun:test";
import { chmodSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GhForge } from "./adapters.ts";
import { BRANCH_RULES, SRC_REVIEWER, pullRequestRule } from "./fake-forge.ts";
import { invalidPattern, matchEntries, matchPatterns, parsePullRequestRules, printable } from "./ruleset.ts";

describe("matchPatterns follows .gitignore", () => {
  const table: [string, string[], string, string | undefined][] = [
    ["* does not cross a slash", ["src/*.ts"], "src/x/a.ts", undefined],
    ["* matches within one component", ["src/*.ts"], "src/a.ts", "src/*.ts"],
    ["a directory match covers the files under it", ["src/*"], "src/x/a.ts", "src/*"],
    ["a leading ** matches at any depth", ["**/a.ts"], "x/y/a.ts", "**/a.ts"],
    ["a leading ** matches the root too", ["**/a.ts"], "a.ts", "**/a.ts"],
    ["/**/ matches zero directories", ["src/**/a.ts"], "src/a.ts", "src/**/a.ts"],
    ["/**/ matches many directories", ["src/**/a.ts"], "src/x/y/a.ts", "src/**/a.ts"],
    ["a trailing /** matches everything inside", ["docs/**"], "docs/a/b.md", "docs/**"],
    ["a trailing /** does not match the sibling", ["docs/**"], "docs-old/a.md", undefined],
    ["* matches a dotfile", ["*"], ".env", "*"],
    ["* after a slash matches a dotfile", ["src/*"], "src/.hidden", "src/*"],
    ["a leading slash anchors to the root", ["/README.md"], "docs/README.md", undefined],
    ["a leading slash matches at the root", ["/README.md"], "README.md", "/README.md"],
    ["a bare name matches at any depth", ["README.md"], "docs/README.md", "README.md"],
    ["a middle slash anchors", ["docs/a.md"], "x/docs/a.md", undefined],
    ["? matches one character", ["a?.ts"], "ab.ts", "a?.ts"],
    ["? does not match a slash", ["a?b"], "a/b", undefined],
    ["a character class matches", ["[ab].ts"], "b.ts", "[ab].ts"],
    ["a negated class excludes", ["[!ab].ts"], "a.ts", undefined],
    ["a negation cannot re-include under an excluded directory", ["src/**", "!src/gen/**"], "src/gen/a.ts", "src/**"],
    ["a bare name does not match inside a longer name", ["foo"], "xfoo", undefined],
    ["/**/ does not match inside a longer component", ["a/**/b"], "a/xb", undefined],
    ["a leading ** does not match inside a longer name", ["**/b"], "xb", undefined],
    ["a negation of one name leaves a longer name matched", ["*.md", "!README.md"], "docs/NOTREADME.md", "*.md"],
    ["a leading ** matches a name one directory down", ["**/b"], "x/b", "**/b"],
    ["/**/ matches a name one directory down", ["a/**/b"], "a/x/b", "a/**/b"],
    ["a negated directory unmatches the files under it", ["src/*", "!src/gen/"], "src/gen/a.ts", undefined],
    ["a negation leaves other paths matched", ["src/**", "!src/gen/**"], "src/a.ts", "src/**"],
    ["a later pattern matches again after a negation", ["src/*", "!src/gen/", "src/gen/keep.ts"], "src/gen/keep.ts", "src/gen/keep.ts"],
    ["a negation of the directory leaves a matching file excluded", ["*.ts", "!src/"], "src/a.ts", "*.ts"],
    ["a negated directory does not unmatch a file under a star", ["*", "!src/"], "src/a.ts", "*"],
    ["a file cannot be re-included under an excluded directory", ["src/", "!src/keep.ts"], "src/keep.ts", "src/"],
    ["a negated directory re-includes nothing under an excluded parent", ["a/", "!a/b/", "a/b/c"], "a/b/c", "a/"],
    ["a class with ] first matches a literal ]", ["[]]"], "]", "[]]"],
    ["a negated class with ] first excludes a literal ]", ["[!]]"], "]", undefined],
    ["a negated class with ] first matches another character", ["[!]]"], "a", "[!]]"],
    ["an escaped trailing space is kept", ["a\\ "], "a ", "a\\ "],
    ["an unescaped trailing space is stripped", ["a  "], "a", "a  "],
    ["a trailing tab is kept in the name", ["a\t"], "a", undefined],
    ["a trailing tab matches the name with the tab", ["a\t"], "a\t", "a\t"],
    ["a leading negation alone matches nothing", ["!src/**"], "src/a.ts", undefined],
    ["a trailing slash matches the files under a directory", ["build/"], "out/build/x.js", "build/"],
    ["a trailing slash does not match a file of that name", ["build/"], "build", undefined],
    ["a comment matches nothing", ["# src/**"], "# src/a", undefined],
    ["a blank line matches nothing", ["", "  "], "a", undefined],
    ["an escaped hash matches a literal", ["\\#note"], "#note", "\\#note"],
    ["a negated class never matches a slash", ["a[!b]c"], "a/c", undefined],
    ["a negated class matches another character", ["a[!b]c"], "axc", "a[!b]c"],
    ["a caret negated class never matches a slash", ["a[^b]c"], "a/c", undefined],
    ["a class holding a slash never matches a slash", ["a[/]b"], "a/b", undefined],
    ["a range class never matches a slash", ["a[--0]c"], "a/c", undefined],
    ["[:digit:] matches a digit", ["[[:digit:]].ts"], "5.ts", "[[:digit:]].ts"],
    ["[:digit:] does not match a letter", ["[[:digit:]].ts"], "a.ts", undefined],
    ["[:alpha:] matches a letter", ["[[:alpha:]].ts"], "a.ts", "[[:alpha:]].ts"],
    ["[:alpha:] does not match a digit", ["[[:alpha:]].ts"], "5.ts", undefined],
    ["[:alnum:] matches a digit", ["[[:alnum:]].ts"], "5.ts", "[[:alnum:]].ts"],
    ["[:upper:] does not match lowercase", ["[[:upper:]].ts"], "a.ts", undefined],
    ["[:upper:] matches uppercase", ["[[:upper:]].ts"], "A.ts", "[[:upper:]].ts"],
    ["[:lower:] matches lowercase", ["[[:lower:]].ts"], "a.ts", "[[:lower:]].ts"],
    ["[:xdigit:] matches f", ["[[:xdigit:]].ts"], "f.ts", "[[:xdigit:]].ts"],
    ["[:xdigit:] does not match g", ["[[:xdigit:]].ts"], "g.ts", undefined],
    ["[:punct:] matches a hyphen", ["a[[:punct:]]b"], "a-b", "a[[:punct:]]b"],
    ["[:punct:] does not match a slash", ["a[[:punct:]]b"], "a/b", undefined],
    ["[:punct:] does not match a letter", ["a[[:punct:]]b"], "aab", undefined],
    ["[:blank:] matches a space", ["a[[:blank:]]b"], "a b", "a[[:blank:]]b"],
    ["[:space:] matches a space", ["a[[:space:]]b"], "a b", "a[[:space:]]b"],
    ["[:space:] matches a tab", ["a[[:space:]]b"], "a\tb", "a[[:space:]]b"],
    ["[:space:] does not match a vertical tab", ["x[[:space:]]y"], "x\vy", undefined],
    ["[:space:] does not match a form feed", ["x[[:space:]]y"], "x\fy", undefined],
    ["[:graph:] does not match a space", ["a[[:graph:]]b"], "a b", undefined],
    ["[:print:] matches a space", ["a[[:print:]]b"], "a b", "a[[:print:]]b"],
    ["[:cntrl:] does not match a space", ["a[[:cntrl:]]b"], "a b", undefined],
    ["a negated [:digit:] matches a letter", ["[![:digit:]].ts"], "a.ts", "[![:digit:]].ts"],
    ["a negated [:digit:] does not match a digit", ["[![:digit:]].ts"], "5.ts", undefined],
    ["a POSIX class mixes with a literal", ["[[:digit:]a].ts"], "a.ts", "[[:digit:]a].ts"],
    ["an escaped ] in a class is a literal ]", ["[\\]]x"], "]x", "[\\]]x"],
    ["an escaped ] in a class does not close it", ["[\\]]x"], "ax", undefined],
    ["an escaped ] after a member is a literal ]", ["[a\\]]x"], "]x", "[a\\]]x"],
    ["a negated class with an escaped ] excludes ]", ["[!\\]]x"], "]x", undefined],
    ["a negated class with an escaped ] matches another character", ["[!\\]]x"], "ax", "[!\\]]x"],
  ];
  for (const [name, patterns, path, expected] of table) it(name, () => { expect(matchPatterns(patterns, path)).toBe(expected); });
});

describe("invalidPattern", () => {
  it("reports a pattern with an unknown POSIX class", () => { expect(invalidPattern(["src/**", "[[:foo:]].ts"])).toBe("[[:foo:]].ts"); });
  it("accepts every known POSIX class", () => {
    const names = ["alnum", "alpha", "blank", "cntrl", "digit", "graph", "lower", "print", "punct", "space", "upper", "xdigit"];
    expect(invalidPattern(names.map((name) => `[[:${name}:]]`))).toBeUndefined();
  });
});

describe("wildcard runs", () => {
  it("accepts four stars in a segment", () => { expect(invalidPattern(["*a*a*a*b"])).toBeUndefined(); expect(matchPatterns(["*a*a*a*b"], "xaxaxaxb")).toBe("*a*a*a*b"); });
  it("accepts stars either side of a slash", () => { expect(invalidPattern(["*a*a*/*b*b"])).toBeUndefined(); expect(matchPatterns(["*a*a*/*b*b"], "xaxa/ybyb")).toBe("*a*a*/*b*b"); });
  it("matches nothing for a reversed range", () => { expect(invalidPattern(["[z-a]"])).toBeUndefined(); expect(matchPatterns(["[z-a]"], "m")).toBeUndefined(); expect(matchPatterns(["[z-a]"], "a")).toBeUndefined(); });
  const timed = (name: string, pattern: string, path: string): void => {
    it(name, () => {
      const start = performance.now();
      expect(matchPatterns([pattern], path)).toBeUndefined();
      expect(performance.now() - start).toBeLessThan(250);
    });
  };
  timed("matches two ** segments against a deep path in bounded time", "**/a/**/a/**/b", `${"a/".repeat(500)}c`);
  timed("matches five stars against a long segment in bounded time", "*a*a*a*a*b", "a".repeat(255));
  timed("matches ** with stars against long segments in bounded time", "**/*a*a*b", Array.from({ length: 4 }, () => "a".repeat(249)).join("/"));
});

describe("printable", () => {
  it("leaves plain text unchanged", () => { expect(printable("src/a b.ts")).toBe("src/a b.ts"); });
  it("escapes a control character", () => { expect(printable("a\nb")).toBe("a\\nb"); });
  it("escapes a right-to-left override", () => { expect(printable("a\u202eb")).toBe("a\\u202eb"); });
  it("escapes a line separator", () => { expect(printable("a\u2028b")).toBe("a\\u2028b"); });
  it("truncates text over 200 characters", () => { expect(printable(`src/${"x".repeat(246)}`)).toBe(`src/${"x".repeat(196)}…(50 more)`); });
  it("keeps text of exactly 200 characters", () => { expect(printable("y".repeat(200))).toBe("y".repeat(200)); });
});

describe("matchEntries", () => {
  it("reports the first sorted matching path of an entry", () => {
    expect(matchEntries(parsePullRequestRules(BRANCH_RULES.slice()), ["docs/new.md", "src/old.ts", "src/b.ts"])).toEqual([
      { rulesetId: 15382168, rulesetSource: "patinaproject", reviewerId: 456, reviewerType: "Team", minimumApprovals: 2, pattern: "src/**", path: "src/b.ts" },
    ]);
  });
  it("matches nothing for an entry with no patterns", () => {
    const rules = parsePullRequestRules([pullRequestRule({ required_reviewers: [{ reviewer: { id: 1, type: "Team" }, minimum_approvals: 1 }] })]);
    expect(rules[0]!.requiredReviewers[0]!.filePatterns).toEqual([]);
    expect(matchEntries(rules, ["src/a.ts"])).toEqual([]);
  });
});

describe("parsePullRequestRules", () => {
  it("keeps only pull_request rows and reads their parameters", () => {
    expect(parsePullRequestRules(BRANCH_RULES.slice())).toEqual([{
      rulesetId: 15382168, rulesetSource: "patinaproject", requiredApprovingReviewCount: 0, dismissStaleReviewsOnPush: true, requireLastPushApproval: true,
      requiredReviewers: [{ reviewerId: 456, reviewerType: "Team", filePatterns: ["src/**"], minimumApprovals: 2 }],
    }]);
  });
  it("throws on a malformed pull_request row", () => {
    expect(() => parsePullRequestRules([pullRequestRule({ required_approving_review_count: "0" })])).toThrow("forge returned a malformed pull_request rule: required_approving_review_count");
    expect(() => parsePullRequestRules([pullRequestRule({ required_reviewers: [{ reviewer: { id: 1 }, file_patterns: [], minimum_approvals: 1 }] })])).toThrow("forge returned a malformed pull_request rule: type");
    expect(() => parsePullRequestRules([pullRequestRule({}, { ruleset_id: "x" })])).toThrow("forge returned a malformed pull_request rule: ruleset_id");
    expect(() => parsePullRequestRules([pullRequestRule({ required_reviewers: [SRC_REVIEWER, 5] })])).toThrow("forge returned a malformed pull_request rule: required_reviewers");
  });
});

describe("GhForge branch rules and changed files", () => {
  function withStubGh(script: string): { forge: GhForge; calls: () => string[]; restore: () => void } {
    const dir = mkdtempSync(join(tmpdir(), "stub-gh-"));
    writeFileSync(join(dir, "gh"), `#!/bin/sh\necho "$*" >> "${dir}/calls"\n${script}\n`);
    chmodSync(join(dir, "gh"), 0o755);
    const previous = process.env.PATH;
    process.env.PATH = `${dir}:${previous}`;
    return { forge: new GhForge("gh"), calls: () => readFileSync(join(dir, "calls"), "utf8").split("\n").filter(Boolean), restore: () => { process.env.PATH = previous; } };
  }
  it("reads the paginated rules of an encoded base ref", () => {
    const stub = withStubGh(`echo '${JSON.stringify(pullRequestRule())}'`);
    try {
      expect(stub.forge.readBranchRules("o/r", "release/1")).toEqual([pullRequestRule()]);
      expect(stub.calls()).toEqual(["api --paginate repos/o/r/rules/branches/release%2F1?per_page=100 --jq .[]"]);
    } finally { stub.restore(); }
  });
  it("reads the file rows and the changed_files total", () => {
    const stub = withStubGh(`case "$*" in\n  *pulls/7/files*) printf '%s\\n' '{"filename":"a.ts"}' '{"filename":"b.ts","previous_filename":"c.ts"}' ;;\n  *pulls/7) echo '{"changed_files":3000}' ;;\n  *) exit 2 ;;\nesac`);
    try {
      expect(stub.forge.readChangedFiles("o/r", 7)).toEqual({ rows: [{ filename: "a.ts" }, { filename: "b.ts", previous_filename: "c.ts" }], total: 3000 });
      expect(stub.calls()).toEqual(["api --paginate repos/o/r/pulls/7/files?per_page=100 --jq .[]", "api repos/o/r/pulls/7"]);
    } finally { stub.restore(); }
  });
  it("rejects a pull request without changed_files", () => {
    const stub = withStubGh(`case "$*" in\n  *pulls/7/files*) exit 0 ;;\n  *pulls/7) echo '{}' ;;\nesac`);
    try { expect(() => stub.forge.readChangedFiles("o/r", 7)).toThrow("forge returned a pull request without changed_files"); } finally { stub.restore(); }
  });
});
