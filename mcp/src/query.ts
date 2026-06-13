/**
 * Shared query logic over the repo collection.
 * Used by BOTH the MCP server (src/index.ts) and the CLI (src/cli.ts)
 * so search/list/get behaviour stays identical across both surfaces.
 */
import type { Collection, Repo } from "./data.js";

export type Lang = "en" | "ka" | "both";

/** Strip markdown links from descriptions for cleaner output. */
export function clean(desc: string): string {
  return desc.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
}

/**
 * Pick the description to surface based on the lang preference.
 * - "en": prefer English; fall back to Georgian if no English available.
 * - "ka": always Georgian (the editorial original).
 * - "both": return an object with both fields.
 */
export function pickDescription(
  r: Repo,
  lang: Lang,
): string | { en: string | null; ka: string } {
  const ka = clean(r.description);
  const en = r.descriptionEn ? clean(r.descriptionEn) : null;
  if (lang === "ka") return ka;
  if (lang === "both") return { en, ka };
  return en ?? ka;
}

/** One-line human-readable summary of a repo. */
export function summarizeRepo(r: Repo, lang: Lang): string {
  const stars = r.starsNumeric !== null ? `${r.stars} ⭐` : r.stars;
  const desc = pickDescription(r, lang);
  const descText =
    typeof desc === "string" ? desc : `EN: ${desc.en ?? "(none)"}\n  KA: ${desc.ka}`;
  return `${r.name} (${stars}) — ${r.url}\n  ${descText}\n  Category: ${r.categoryEmoji} ${r.categoryGeorgian}`;
}

export type ListOpts = {
  category?: string;
  sortBy?: "stars" | "name";
  limit?: number;
  offset?: number;
};

export type ListResult = {
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
  items: Repo[];
};

export function listRepos(c: Collection, opts: ListOpts = {}): ListResult {
  const { category, sortBy = "stars", limit = 20, offset = 0 } = opts;
  let filtered = category
    ? c.repos.filter((r) => r.categorySlug === category)
    : c.repos;
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return (b.starsNumeric ?? -1) - (a.starsNumeric ?? -1);
  });
  return {
    total: filtered.length,
    offset,
    limit,
    hasMore: offset + limit < filtered.length,
    items: filtered.slice(offset, offset + limit),
  };
}

export type Scored = { repo: Repo; score: number };

export function searchRepos(
  c: Collection,
  opts: { query: string; category?: string; limit?: number },
): Scored[] {
  const { query, category, limit = 10 } = opts;
  const q = query.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  return c.repos
    .filter((r) => !category || r.categorySlug === category)
    .map((r) => {
      const haystack = `${r.name} ${r.description} ${r.descriptionEn ?? ""}`.toLowerCase();
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
}

/** Find a repo by name — exact match first, then partial (case-insensitive). */
export function getRepo(c: Collection, name: string): Repo | null {
  const q = name.toLowerCase();
  const exact = c.repos.find((r) => r.name.toLowerCase() === q);
  return exact ?? c.repos.find((r) => r.name.toLowerCase().includes(q)) ?? null;
}

export type Stats = {
  totalRepos: number;
  categories: number;
  generated: string;
  englishCoverage: { total: number; withEnglish: number; pct: number };
  top10ByStars: Array<{ name: string; stars: string; url: string; category: string }>;
};

export function getStats(c: Collection): Stats {
  const top = [...c.repos]
    .filter((r) => r.starsNumeric !== null)
    .sort((a, b) => (b.starsNumeric ?? 0) - (a.starsNumeric ?? 0))
    .slice(0, 10)
    .map((r) => ({ name: r.name, stars: r.stars, url: r.url, category: r.categorySlug }));
  const withEn = c.repos.filter((r) => r.descriptionEn !== null).length;
  return {
    totalRepos: c.totalRepos,
    categories: c.categories.length,
    generated: c.generated,
    englishCoverage: {
      total: c.totalRepos,
      withEnglish: withEn,
      pct: Math.round((withEn / c.totalRepos) * 100),
    },
    top10ByStars: top,
  };
}
