#!/usr/bin/env node
/**
 * AI Pulse Georgia CLI
 *
 * Terminal access to the same curated repo collection the MCP server exposes.
 * Reuses the shared query logic in query.ts so results match the MCP exactly.
 *
 * Usage:
 *   aipulse categories
 *   aipulse list [--category <slug>] [--sort stars|name] [--limit N] [--offset N] [--lang en|ka|both]
 *   aipulse search <query...> [--category <slug>] [--limit N] [--lang en|ka|both]
 *   aipulse get <name...> [--lang en|ka|both]
 *   aipulse stats
 * Global flag: --json (machine-readable output)
 */
import { loadCollection } from "./data.js";
import {
  getRepo,
  getStats,
  listRepos,
  pickDescription,
  searchRepos,
  summarizeRepo,
  type Lang,
} from "./query.js";

type Parsed = { _: string[]; flags: Record<string, string | boolean> };

function parseArgs(argv: string[]): Parsed {
  const aliases: Record<string, string> = {
    c: "category",
    n: "limit",
    s: "sort",
    l: "lang",
    h: "help",
  };
  const valueFlags = new Set(["category", "limit", "offset", "sort", "lang"]);
  const _: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a.startsWith("--") || a.startsWith("-")) {
      let key = a.replace(/^-+/, "");
      if (aliases[key]) key = aliases[key];
      if (valueFlags.has(key)) {
        flags[key] = argv[++i] ?? "";
      } else {
        flags[key] = true;
      }
    } else {
      _.push(a);
    }
  }
  return { _, flags };
}

function asLang(v: unknown): Lang {
  return v === "ka" || v === "both" ? v : "en";
}

function descText(d: string | { en: string | null; ka: string }): string {
  if (typeof d === "string") return d;
  return `EN: ${d.en ?? "(none)"} | KA: ${d.ka}`;
}

function printRepoLine(r: {
  name: string;
  url: string;
  stars: string;
  category: string;
  description: string | { en: string | null; ka: string };
}): void {
  console.log(`★ ${r.stars.padEnd(5)} ${r.name}  [${r.category}]`);
  console.log(`   ${descText(r.description)}`);
  console.log(`   ${r.url}\n`);
}

function help(): void {
  console.log(`AI Pulse Georgia — curated AI/agentic repo collection (CLI)

Usage:
  aipulse categories                       List all categories with counts
  aipulse list [opts]                      List repos (paginated)
  aipulse search <query...> [opts]         Full-text search
  aipulse get <name...> [opts]             Show one repo's details
  aipulse stats                            Collection statistics

Options:
  -c, --category <slug>   Filter by category slug (see 'categories')
  -n, --limit <N>         Max results (list: 20, search: 10)
      --offset <N>        Pagination offset (list)
  -s, --sort <stars|name> Sort order for list (default: stars)
  -l, --lang <en|ka|both> Description language (default: en)
      --json              Machine-readable JSON output

Examples:
  aipulse search "rag memory" --lang both
  aipulse list -c coding -n 10
  aipulse get aider`);
}

function main(): void {
  const { _, flags } = parseArgs(process.argv.slice(2));
  const cmd = _[0] ?? (flags.help ? "help" : "help");
  const json = flags.json === true;
  const lang = asLang(flags.lang);
  const collection = loadCollection();

  switch (cmd) {
    case "categories":
    case "cats": {
      if (json) {
        console.log(JSON.stringify({ totalRepos: collection.totalRepos, categories: collection.categories }, null, 2));
        return;
      }
      console.log(`${collection.totalRepos} repos across ${collection.categories.length} categories:\n`);
      for (const c of collection.categories) {
        console.log(`  ${c.emoji} ${c.english.padEnd(34)} ${String(c.count).padStart(3)}  (${c.slug})`);
      }
      return;
    }
    case "list":
    case "ls": {
      const category = typeof flags.category === "string" ? flags.category : undefined;
      const sortBy = flags.sort === "name" ? "name" : "stars";
      const limit = Number(flags.limit) || 20;
      const offset = Number(flags.offset) || 0;
      const res = listRepos(collection, { category, sortBy, limit, offset });
      const repos = res.items.map((r) => ({
        name: r.name, url: r.url, stars: r.stars, category: r.categorySlug,
        description: pickDescription(r, lang),
      }));
      if (json) {
        console.log(JSON.stringify({ total: res.total, offset: res.offset, limit: res.limit, hasMore: res.hasMore, repos }, null, 2));
        return;
      }
      console.log(`${res.total} repos${category ? ` in '${category}'` : ""} — showing ${repos.length} (offset ${offset})\n`);
      repos.forEach(printRepoLine);
      if (res.hasMore) console.log(`… more available — add: --offset ${offset + limit}`);
      return;
    }
    case "search":
    case "s": {
      const query = _.slice(1).join(" ");
      if (query.length < 2) {
        console.error("search needs a query of at least 2 characters. e.g. aipulse search rag");
        process.exitCode = 1;
        return;
      }
      const category = typeof flags.category === "string" ? flags.category : undefined;
      const limit = Number(flags.limit) || 10;
      const scored = searchRepos(collection, { query, category, limit });
      const repos = scored.map((s) => ({
        name: s.repo.name, url: s.repo.url, stars: s.repo.stars, category: s.repo.categorySlug,
        score: s.score, description: pickDescription(s.repo, lang),
      }));
      if (json) {
        console.log(JSON.stringify({ query, matched: repos.length, repos }, null, 2));
        return;
      }
      console.log(`"${query}" — ${repos.length} match${repos.length === 1 ? "" : "es"}\n`);
      repos.forEach(printRepoLine);
      return;
    }
    case "get":
    case "show": {
      const name = _.slice(1).join(" ");
      if (name.length < 2) {
        console.error("get needs a repo name. e.g. aipulse get aider");
        process.exitCode = 1;
        return;
      }
      const repo = getRepo(collection, name);
      if (!repo) {
        console.error(`No repo found matching '${name}'. Try: aipulse search ${name}`);
        process.exitCode = 1;
        return;
      }
      if (json) {
        console.log(JSON.stringify({ ...repo, description: pickDescription(repo, lang) }, null, 2));
        return;
      }
      console.log(summarizeRepo(repo, lang));
      return;
    }
    case "stats": {
      const s = getStats(collection);
      if (json) {
        console.log(JSON.stringify(s, null, 2));
        return;
      }
      console.log(`AI Pulse Georgia collection`);
      console.log(`  Repos:      ${s.totalRepos}`);
      console.log(`  Categories: ${s.categories}`);
      console.log(`  English:    ${s.englishCoverage.withEnglish}/${s.englishCoverage.total} (${s.englishCoverage.pct}%)`);
      console.log(`  Generated:  ${s.generated}`);
      console.log(`\n  Top 10 by stars:`);
      s.top10ByStars.forEach((r, i) => console.log(`    ${String(i + 1).padStart(2)}. ${r.stars.padEnd(6)} ${r.name}  [${r.category}]`));
      return;
    }
    case "help":
    default:
      help();
      return;
  }
}

main();
