# AI Pulse Georgia — MCP Server

Query the [awesome-ai-pulse-georgia](https://github.com/tornikebolokadze1-cyber/awesome-ai-pulse-georgia) curated collection (250 AI repos across 14 categories) directly from inside Claude Code, Cursor, Codex, Claude.ai, or any other [Model Context Protocol](https://modelcontextprotocol.io)–compatible client — or straight from your terminal with the bundled `aipulse` **CLI**.

Instead of opening GitHub and scrolling through a README, ask your AI assistant:

> "What's a good free Claude Code alternative?"
> "Show me the top 5 RAG repos in this collection."
> "Find browser automation tools written in TypeScript."

The MCP server returns curated results from AI Pulse Georgia's hand-maintained list — every repo is vetted, categorized, and described in **both English and Georgian**. Pass `lang: "en"` (default), `"ka"`, or `"both"` to any tool.

---

## Quick install

The server is distributed as a Node CLI. Node 20+ is required.

### Claude Code

Add to your `~/.claude/claude_desktop_config.json` (or project `.mcp.json`):

```json
{
  "mcpServers": {
    "aipulsegeorgia": {
      "command": "npx",
      "args": ["-y", "@aipulsegeorgia/mcp-server"]
    }
  }
}
```

Restart Claude Code. The 5 tools below appear under the `aipulsegeorgia` namespace.

### Cursor

Settings → MCP → Add new MCP server:

```json
{
  "mcpServers": {
    "aipulsegeorgia": {
      "command": "npx",
      "args": ["-y", "@aipulsegeorgia/mcp-server"]
    }
  }
}
```

### Local development (this repo)

```bash
git clone https://github.com/tornikebolokadze1-cyber/awesome-ai-pulse-georgia.git
cd awesome-ai-pulse-georgia/mcp
npm install
npm run build
node dist/index.js
```

Then point your client at the absolute path of `dist/index.js` instead of `npx`.

---

## Tools

| Tool | Purpose | Example call |
|------|---------|--------------|
| `list_categories` | Show all categories with repo counts | — |
| `list_repos` | Browse by category, sort by stars or name, paginate | `{"category":"coding","limit":10,"lang":"en"}` |
| `search_repos` | Full-text search across name + descriptions (EN+KA) | `{"query":"browser automation","lang":"both"}` |
| `get_repo` | Fetch full details for a single repo | `{"name":"free-claude-code","lang":"en"}` |
| `stats` | Total count, top 10 by stars, English-coverage rate | — |

All tools accept `lang: "en" | "ka" | "both"` (default `"en"`). English descriptions come from each repo's GitHub `description` field; Georgian descriptions are AI Pulse Georgia's editorial reviews from the awesome-list README.

### Categories

`coding` (🤖) · `plugins` (⚡) · `design` (🎨) · `mcp` (🔌) · `scraping` (🕷️) · `frameworks` (🧬) · `workflow` (🔁) · `business` (💼) · `finance` (💰) · `memory` (🧠) · `codeintel` (🔍) · `infra` (⚙️) · `media` (🎬) · `resources` (📚)

---

## CLI (terminal access)

The same collection is queryable straight from your terminal — zero MCP client needed. The package ships a second binary, `aipulse`:

```bash
# via npx (no install)
npx -p @aipulsegeorgia/mcp-server aipulse search "rag memory"

# or after a global install / local build
aipulse categories
aipulse list --category coding --limit 10
aipulse search "browser automation" --lang both
aipulse get aider
aipulse stats
```

Commands: `categories`, `list`, `search <query>`, `get <name>`, `stats`.
Options: `-c/--category <slug>`, `-n/--limit <N>`, `--offset <N>`, `-s/--sort stars|name`, `-l/--lang en|ka|both`, `--json` (machine-readable output).

The CLI shares its query logic (`src/query.ts`) with the MCP server, so results are identical across both surfaces.

---

## How it works

1. `scripts/build-data.ts` parses the root [`README.md`](../README.md) into a structured `data/repos.json` snapshot — that's the canonical source of truth.
2. `src/index.ts` boots an MCP server on stdio and exposes the snapshot through 5 tools.
3. The bundle is built with `tsup` and shipped as ESM targeting Node 20+.

When the README is updated (new repo added, stars refreshed), running `npm run build` re-parses and rebuilds. The published npm version always reflects the latest README at publish time.

---

## Commands

| Command | Effect |
|---------|--------|
| `npm run build:data` | Re-parse README → `data/repos.json` |
| `npm run build` | Build data + compile MCP + CLI bundles to `dist/` |
| `npm run dev` | Run the MCP server from source via `tsx` |
| `npm run cli` | Run the CLI from source, e.g. `npm run cli -- search rag` |
| `npm start` | Run the compiled MCP bundle |

---

## License

MIT — same as the parent collection. Contributions welcome via PR to the awesome-ai-pulse-georgia repo.

Built by [AI Pulse Georgia](https://aipulsegeorgia.ge) 🇬🇪
