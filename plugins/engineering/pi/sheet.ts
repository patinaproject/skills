import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface Sheet {
  text: string;
  hookOff: boolean;
  piModels: Map<string, string>;
}

export function decodeSheet(bytes: Uint8Array): string {
  // Windows PowerShell 5.1's `>` writes UTF-16 LE with a byte-order mark.
  const encoding = bytes[0] === 0xff && bytes[1] === 0xfe ? "utf16le" : "utf8";
  return Buffer.from(bytes).toString(encoding).replace(/^\uFEFF/, "").replace(/\r(?=\n|$)/g, "");
}

function parseSheet(text: string): Sheet {
  const lines = text.split("\n");
  const piModels = new Map<string, string>();
  for (const line of lines) {
    const m = /^pi models:\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    for (const pair of m[1].split(",")) {
      const [alias, id] = pair.split("=").map((s) => s.trim());
      if (alias && id) piModels.set(alias, id);
    }
  }
  return { text, hookOff: lines.includes("session hook: off"), piModels };
}

export function readSheet(agentDir: string): Sheet | undefined {
  let bytes: Buffer;
  try {
    bytes = readFileSync(join(agentDir, "pstack-models.md"));
  } catch {
    return undefined;
  }
  return parseSheet(decodeSheet(bytes));
}
