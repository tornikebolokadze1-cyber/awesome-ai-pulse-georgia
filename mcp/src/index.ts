#!/usr/bin/env node
/**
 * AI Pulse Georgia MCP Server
 *
 * Exposes the curated awesome-ai-pulse-georgia repo collection (179+ repos
 * across 9 categories) as MCP tools. Designed for stdio transport — usable
 * from Claude Code, Cursor, Codex, and any other MCP-compatible client.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { loadCollection, type Repo } from "./data.js";

const collection = loadCollection();

const server = new McpServer({
  name: "aipulsegeorgia-mcp",
  version: "0.1.0",
});

const categorySlugs = collection.categories.map((c) => c.slug) as [string, ...string[]];
const CategoryEnum = z.enum(categorySlugs);

/** Strip markdown links from descriptions for cleaner LLM input. */
function clean(desc: string): string {
  return desc.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
}

function summarize(r: Repo): string {
  const stars = r.starsNumeric !== null ? `${r.stars} ⭐` : r.stars;
  return `${r.name} (${stars}) — ${r.url}\n  ${clean(r.description)}\n  Category: ${r.categoryEmoji} ${r.categoryGeorgian}`;
}

function jsonResult(data: unknown): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}

function textResult(text: string): { content: Array<{ type: "text"; text: string }> } {
  return { content: [{ type: "text", text }] };
}

// --- Tools ---

server.tool(
  "list_categories",
  "List all 9 categories with repo counts. Use this first to understand the collection's structure.",
  {},
  async () => jsonResult({
    totalRepos: collection.totalRepos,
    categories: collection.categories,
  }),
);

server.tool(
  "list_repos",
  "List repos, optionally filtered by category and sorted. Returns paginated results.",
  {
    category: CategoryEnum.optional().describe("Filter by category slug (see list_categories)"),
    sortBy: z.enum(["stars", "name"]).default("stars").describe("Sort order; 'stars' returns highest-starred first"),
    limit: z.number().int().min(1).max(100).default(20),
    offset: z.number().int().min(0).default(0),
  },
  async ({ category, sortBy, limit, offset }) => {
    let filtered = category
      ? collection.repos.filter((r) => r.categorySlug === category)
      : collection.repos;

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return (b.starsNumeric ?? -1) - (a.starsNumeric ?? -1);
    });

    const page = filtered.slice(offset, offset + limit);
    return jsonResult({
      total: filtered.length,
      offset,
      limit,
      hasMore: offset + limit < filtered.length,
      repos: page.map((r) => ({
        name: r.name,
        url: r.url,
        stars: r.stars,
        starsNumeric: r.starsNumeric,
        category: r.categorySlug,
        description: clean(r.description),
      })),
    });
  },
);

server.tool(
  "search_repos",
  "Full-text search across name and description. Case-insensitive. Use for queries like 'free claude code', 'browser automation', 'rag'.",
  {
    query: z.string().min(2).describe("Search query — at least 2 characters"),
    category: CategoryEnum.optional().describe("Optionally narrow to a single category"),
    limit: z.number().int().min(1).max(50).default(10),
  },
  async ({ query, category, limit }) => {
    const q = query.toLowerCase();
    const tokens = q.split(/\s+/).filter(Boolean);

    const scored = collection.repos
      .filter((r) => !category || r.categorySlug === category)
      .map((r) => {
        const haystack = `${r.name} ${r.description}`.toLowerCase();
        const score = tokens.reduce((acc, t) => acc + (haystack.includes(t) ? 1 : 0), 0);
        const nameMatch = r.name.toLowerCase().includes(q) ? 5 : 0;
        return { repo: r, score: score + nameMatch };
      })
      .filter((s) => s.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.repo.starsNumeric ?? -1) - (a.repo.starsNumeric ?? -1);
      })
      .slice(0, limit);

    return jsonResult({
      query,
      matched: scored.length,
      repos: scored.map((s) => ({
        name: s.repo.name,
        url: s.repo.url,
        stars: s.repo.stars,
        category: s.repo.categorySlug,
        score: s.score,
        description: clean(s.repo.description),
      })),
    });
  },
);

server.tool(
  "get_repo",
  "Get full details for a single repo by name (case-insensitive, supports partial match).",
  {
    name: z.string().min(2).describe("Repo name, e.g. 'Claude Code', 'free-claude-code', 'aider'"),
  },
  async ({ name }) => {
    const q = name.toLowerCase();
    const exact = collection.repos.find((r) => r.name.toLowerCase() === q);
    const partial = exact ?? collection.repos.find((r) => r.name.toLowerCase().includes(q));
    if (!partial) {
      return textResult(`No repo found matching '${name}'. Try search_repos for fuzzy matching.`);
    }
    return textResult(summarize(partial));
  },
);

server.tool(
  "stats",
  "Collection-level stats: total count, top repos by stars, last generated time.",
  {},
  async () => {
    const top = [...collection.repos]
      .filter((r) => r.starsNumeric !== null)
      .sort((a, b) => (b.starsNumeric ?? 0) - (a.starsNumeric ?? 0))
      .slice(0, 10)
      .map((r) => ({ name: r.name, stars: r.stars, url: r.url, category: r.categorySlug }));
    return jsonResult({
      totalRepos: collection.totalRepos,
      categories: collection.categories.length,
      generated: collection.generated,
      top10ByStars: top,
    });
  },
);

// --- Boot ---

const transport = new StdioServerTransport();
await server.connect(transport);
// Note: do NOT console.log on stdout — that channel is the MCP transport.
// Stderr is fine for diagnostics if needed.
