#!/usr/bin/env node
/**
 * AI Pulse Georgia MCP Server
 *
 * Exposes the curated awesome-ai-pulse-georgia repo collection (250+ repos
 * across 14 categories) as MCP tools. Designed for stdio transport — usable
 * from Claude Code, Cursor, Codex, and any other MCP-compatible client.
 *
 * v0.2 — bilingual: every result includes editorial Georgian + GitHub-sourced
 * English descriptions. Use the `lang` parameter to control which is returned.
 *
 * Shared query logic lives in query.ts (also used by the CLI in cli.ts).
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadCollection } from "./data.js";
import {
  getRepo,
  getStats,
  listRepos,
  pickDescription,
  searchRepos,
  summarizeRepo,
} from "./query.js";

const collection = loadCollection();

const server = new McpServer({
  name: "aipulsegeorgia-mcp",
  version: "0.2.0",
});

const categorySlugs = collection.categories.map((c) => c.slug) as [string, ...string[]];
const CategoryEnum = z.enum(categorySlugs);
const LangEnum = z.enum(["en", "ka", "both"]).default("en");

function jsonResult(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function textResult(text: string): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text }] };
}

// --- Tools ---

server.tool(
  "list_categories",
  "List all categories with repo counts. Use this first to understand the collection's structure.",
  {},
  async () =>
    jsonResult({
      totalRepos: collection.totalRepos,
      categories: collection.categories,
    }),
);

server.tool(
  "list_repos",
  "List repos, optionally filtered by category and sorted. Returns paginated results. Set lang='en' (default) for English descriptions sourced from GitHub, 'ka' for the editorial Georgian description, or 'both' for both.",
  {
    category: CategoryEnum.optional().describe("Filter by category slug (see list_categories)"),
    sortBy: z.enum(["stars", "name"]).default("stars").describe("Sort order; 'stars' returns highest-starred first"),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
    lang: LangEnum.describe("Description language: 'en' (default, English from GitHub), 'ka' (editorial Georgian), 'both'"),
  },
  async ({ category, sortBy, limit, offset, lang }) => {
    const { total, hasMore, items } = listRepos(collection, { category, sortBy, limit, offset });
    return jsonResult({
      total,
      offset,
      limit,
      hasMore,
      lang,
      repos: items.map((r) => ({
        name: r.name,
        url: r.url,
        stars: r.stars,
        starsNumeric: r.starsNumeric,
        category: r.categorySlug,
        description: pickDescription(r, lang),
      })),
    });
  },
);

server.tool(
  "search_repos",
  "Full-text search across name + Georgian description + English description. Case-insensitive. Use for queries like 'free claude code', 'browser automation', 'rag'.",
  {
    query: z.string().min(2).describe("Search query — at least 2 characters"),
    category: CategoryEnum.optional().describe("Optionally narrow to a single category"),
    limit: z.number().int().min(1).max(50).default(10),
    lang: LangEnum.describe("Description language to return: 'en' (default), 'ka', or 'both'"),
  },
  async ({ query, category, limit, lang }) => {
    const scored = searchRepos(collection, { query, category, limit });
    return jsonResult({
      query,
      matched: scored.length,
      lang,
      repos: scored.map((s) => ({
        name: s.repo.name,
        url: s.repo.url,
        stars: s.repo.stars,
        category: s.repo.categorySlug,
        score: s.score,
        description: pickDescription(s.repo, lang),
      })),
    });
  },
);

server.tool(
  "get_repo",
  "Get full details for a single repo by name (case-insensitive, supports partial match).",
  {
    name: z.string().min(2).describe("Repo name, e.g. 'Claude Code', 'free-claude-code', 'aider'"),
    lang: LangEnum.describe("Description language: 'en' (default), 'ka', or 'both'"),
  },
  async ({ name, lang }) => {
    const repo = getRepo(collection, name);
    if (!repo) {
      return textResult(`No repo found matching '${name}'. Try search_repos for fuzzy matching.`);
    }
    return textResult(summarizeRepo(repo, lang));
  },
);

server.tool(
  "stats",
  "Collection-level stats: total count, top repos by stars, last generated time, English-coverage rate.",
  {},
  async () => jsonResult(getStats(collection)),
);

// --- Boot ---

const transport = new StdioServerTransport();
await server.connect(transport);
// Note: do NOT console.log on stdout — that channel is the MCP transport.
// Stderr is fine for diagnostics if needed.
