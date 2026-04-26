/**
 * Smoke test — boots the compiled MCP server, exchanges an initialize handshake,
 * lists tools, and exercises one tool call. Exits 0 on success, 1 on failure.
 *
 * Used both locally (`npm run smoke`) and in CI before publish (`prepublishOnly`).
 */
import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BUNDLE = resolve(__dirname, "..", "dist", "index.js");

if (!existsSync(BUNDLE)) {
  console.error(`✗ Bundle not found: ${BUNDLE}\n  Run 'npm run build' first.`);
  process.exit(1);
}

type JsonRpc = {
  jsonrpc: "2.0";
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: unknown;
};

const messages: JsonRpc[] = [
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "smoke-test", version: "1.0" },
    },
  },
  { jsonrpc: "2.0", method: "notifications/initialized" },
  { jsonrpc: "2.0", id: 2, method: "tools/list" },
  {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: { name: "stats", arguments: {} },
  },
  {
    jsonrpc: "2.0",
    id: 4,
    method: "tools/call",
    params: { name: "search_repos", arguments: { query: "claude", limit: 1 } },
  },
];

function expect(condition: boolean, label: string): void {
  if (condition) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    process.exitCode = 1;
  }
}

async function run(): Promise<void> {
  console.log(`Smoke testing ${BUNDLE}\n`);
  const proc = spawn("node", [BUNDLE], { stdio: ["pipe", "pipe", "pipe"] });
  const responses: JsonRpc[] = [];
  let buffer = "";

  proc.stdout.on("data", (chunk: Buffer) => {
    buffer += chunk.toString("utf-8");
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        responses.push(JSON.parse(trimmed));
      } catch {
        // skip non-JSON noise
      }
    }
  });

  proc.stderr.on("data", (chunk: Buffer) => {
    process.stderr.write(`[server stderr] ${chunk.toString("utf-8")}`);
  });

  for (const msg of messages) {
    proc.stdin.write(JSON.stringify(msg) + "\n");
  }

  // Allow time for all responses
  await new Promise((r) => setTimeout(r, 1500));
  proc.kill();
  await new Promise((r) => proc.once("exit", r));

  // --- Assertions ---
  const init = responses.find((r) => r.id === 1);
  expect(init !== undefined, "initialize response received");
  expect(
    typeof (init?.result as { serverInfo?: { name: string } } | undefined)?.serverInfo?.name === "string",
    "server reports its name",
  );

  const tools = responses.find((r) => r.id === 2);
  const toolList = (tools?.result as { tools?: Array<{ name: string }> } | undefined)?.tools ?? [];
  expect(toolList.length === 5, `5 tools registered (got ${toolList.length})`);
  const expected = ["list_categories", "list_repos", "search_repos", "get_repo", "stats"];
  for (const name of expected) {
    expect(toolList.some((t) => t.name === name), `tool '${name}' is registered`);
  }

  const stats = responses.find((r) => r.id === 3);
  const statsContent = (stats?.result as { content?: Array<{ text: string }> } | undefined)?.content?.[0]?.text;
  const statsParsed = statsContent ? (JSON.parse(statsContent) as { totalRepos: number }) : null;
  expect(statsParsed !== null && statsParsed.totalRepos > 0, `stats returns totalRepos > 0 (got ${statsParsed?.totalRepos})`);

  const search = responses.find((r) => r.id === 4);
  const searchContent = (search?.result as { content?: Array<{ text: string }> } | undefined)?.content?.[0]?.text;
  const searchParsed = searchContent ? (JSON.parse(searchContent) as { matched: number }) : null;
  expect(searchParsed !== null && searchParsed.matched > 0, `search 'claude' returns matches (got ${searchParsed?.matched})`);

  if (process.exitCode === 1) {
    console.error("\n✗ Smoke test FAILED");
    process.exit(1);
  }
  console.log("\n✓ All smoke checks passed");
}

run().catch((err: unknown) => {
  console.error("Smoke test crashed:", err);
  process.exit(1);
});
