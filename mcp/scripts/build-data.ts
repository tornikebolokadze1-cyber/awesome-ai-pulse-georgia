/**
 * Parses the root README.md and emits data/repos.json — the canonical
 * data source for the MCP server. Run on every README change.
 *
 * Now also enriches each repo with `descriptionEn` from the GitHub repo's
 * own metadata (cached in data/github-cache.json so we don't re-fetch).
 * Curated English text in data/english-descriptions.json takes precedence
 * without changing the GitHub metadata cache.
 *
 * Output: { generated, totalRepos, categories, repos }
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..", "..");
const README = resolve(ROOT, "README.md");
const OUT = resolve(__dirname, "..", "data", "repos.json");
const GH_CACHE = resolve(__dirname, "..", "data", "github-cache.json");
const CURATED_EN = resolve(__dirname, "..", "data", "english-descriptions.json");

type Category = {
  slug: string;
  emoji: string;
  georgian: string;
  english: string;
};

const CATEGORY_MAP: Record<string, Omit<Category, "georgian">> = {
  "კოდინგ აგენტები და AI IDE-ები": {
    slug: "coding",
    emoji: "🤖",
    english: "Coding Agents & AI IDEs",
  },
  "აგენტების ორკესტრაცია": {
    slug: "orchestration",
    emoji: "🎛️",
    english: "Agent Orchestration",
  },
  "უნარები, პლაგინები და მეთოდოლოგიები": {
    slug: "plugins",
    emoji: "⚡",
    english: "Skills, Plugins & Methodologies",
  },
  "კოდბაზის გრაფები და კონტექსტი": {
    slug: "codeintel",
    emoji: "🔍",
    english: "Code Intelligence & Context",
  },
  "ტოკენები, ხარჯი და LLM Gateway-ები": {
    slug: "tokens",
    emoji: "💸",
    english: "Tokens, Cost & LLM Gateways",
  },
  "AI აგენტების ფრეიმვორკები": {
    slug: "frameworks",
    emoji: "🧬",
    english: "Agent Frameworks & SDKs",
  },
  "MCP და ინტეგრაციები": {
    slug: "mcp",
    emoji: "🔌",
    english: "MCP, Protocols & Integrations",
  },
  "ვები, ბრაუზერი და კომპიუტერის მართვა": {
    slug: "scraping",
    emoji: "🕷️",
    english: "Web, Browser & Computer Use",
  },
  "მეხსიერება, RAG და დოკუმენტები": {
    slug: "memory",
    emoji: "🧠",
    english: "Memory, RAG & Documents",
  },
  "Sandbox-ები, Evals და Observability": {
    slug: "agentinfra",
    emoji: "🧰",
    english: "Agent Infra: Sandboxes, Evals & Observability",
  },
  "AI უსაფრთხოება": { slug: "security", emoji: "🛡️", english: "AI Security" },
  "ინფერენსი და მოდელები": {
    slug: "infra",
    emoji: "⚙️",
    english: "Inference & Models",
  },
  "Workflow და No-Code ბილდერები": {
    slug: "workflow",
    emoji: "🔁",
    english: "No-Code & Workflow Builders",
  },
  "AI ასისტენტები და ჩატ-ინტერფეისები": {
    slug: "assistants",
    emoji: "🦞",
    english: "AI Assistants & Chat UIs",
  },
  "ბიზნეს და სამუშაო აგენტები": {
    slug: "business",
    emoji: "💼",
    english: "Business & Work Agents",
  },
  "კვლევა და განათლება": {
    slug: "research",
    emoji: "🔬",
    english: "Research & Education",
  },
  "ფინანსური AI": { slug: "finance", emoji: "💰", english: "Finance AI" },
  "დიზაინი და UI": {
    slug: "design",
    emoji: "🎨",
    english: "Design, UI & Diagrams",
  },
  "მედია-გენერაცია": {
    slug: "media",
    emoji: "🎬",
    english: "Media Generation",
  },
  "ხმა და მეტყველება": {
    slug: "voice",
    emoji: "🎙️",
    english: "Voice & Speech",
  },
  "რესურსები და სასწავლო მასალები": {
    slug: "resources",
    emoji: "📚",
    english: "Resources & Learning",
  },
};

type Repo = {
  name: string;
  url: string;
  stars: string;
  starsNumeric: number | null;
  description: string;
  descriptionEn: string | null;
  categorySlug: string;
  categoryEmoji: string;
  categoryGeorgian: string;
};

type GhCacheEntry = {
  description: string | null;
  fetchedAt: string;
};
type GhCache = Record<string, GhCacheEntry>;

/** "11K" → 11000, "187K" → 187000, "Guide" → null */
function parseStars(raw: string): number | null {
  const trimmed = raw.trim();
  const m = trimmed.match(/^(\d+(?:\.\d+)?)\s*([KMkm])?$/);
  if (!m) return null;
  const num = Number.parseFloat(m[1]!);
  const unit = (m[2] ?? "").toLowerCase();
  if (unit === "k") return Math.round(num * 1_000);
  if (unit === "m") return Math.round(num * 1_000_000);
  return Math.round(num);
}

function parseHeading(line: string): Category | null {
  const m = line.match(
    /^##\s+(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*️?\s+(.+?)\s*$/u,
  );
  if (!m) return null;
  const georgian = m[2]!.trim();
  const meta = CATEGORY_MAP[georgian];
  if (!meta) return null;
  return { ...meta, georgian };
}

function parseRow(
  line: string,
): Pick<Repo, "name" | "url" | "stars" | "description"> | null {
  if (!line.startsWith("| [")) return null;
  const cells = line.split(" | ").map((c, i, arr) => {
    if (i === 0) return c.replace(/^\|\s*/, "");
    if (i === arr.length - 1) return c.replace(/\s*\|\s*$/, "");
    return c;
  });
  if (cells.length !== 3) return null;
  const linkMatch = cells[0]!.match(/^\[([^\]]+)\]\(([^)]+)\)\s*$/);
  if (!linkMatch) return null;
  return {
    name: linkMatch[1]!.trim(),
    url: linkMatch[2]!.trim(),
    stars: cells[1]!.trim(),
    description: cells[2]!.trim(),
  };
}

/** Extract `owner/repo` from a github.com URL. Returns null for non-repo URLs. */
function parseGithubRepo(url: string): string | null {
  // Gists are not standard repos; map to a stable slug so a curated
  // description can be cached for them (the repos API can't fetch a gist).
  const gist = url.match(
    /^https?:\/\/gist\.github\.com\/([^/]+)\/([0-9a-f]+)/i,
  );
  if (gist) return `${gist[1]!.toLowerCase()}/gist-${gist[2]!.slice(0, 8)}`;
  const m = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!m) return null;
  const owner = m[1]!;
  const repo = m[2]!.replace(/\.git$/, "");
  // Skip non-repo URLs like /blob/, /tree/, /search, /sponsors etc.
  if (
    owner === "" ||
    repo === "" ||
    ["search", "marketplace", "topics"].includes(owner.toLowerCase())
  )
    return null;
  return `${owner}/${repo}`;
}

/** Fetch GitHub repo description via the public API. Uses GITHUB_TOKEN if set for higher rate limits. */
async function fetchGhDescription(slug: string): Promise<string | null> {
  const url = `https://api.github.com/repos/${slug}`;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "aipulsegeorgia-mcp-build",
  };
  const token = process.env["GITHUB_TOKEN"];
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      console.warn(`  ! ${slug}: HTTP ${res.status}`);
      return null;
    }
    const data = (await res.json()) as { description?: string | null };
    return data.description ?? null;
  } catch (err) {
    console.warn(`  ! ${slug}: ${(err as Error).message}`);
    return null;
  }
}

function loadGhCache(): GhCache {
  if (!existsSync(GH_CACHE)) return {};
  try {
    return JSON.parse(readFileSync(GH_CACHE, "utf-8")) as GhCache;
  } catch {
    return {};
  }
}

function saveGhCache(cache: GhCache): void {
  mkdirSync(dirname(GH_CACHE), { recursive: true });
  writeFileSync(GH_CACHE, JSON.stringify(cache, null, 2) + "\n", "utf-8");
}

function parseReadme(): {
  repos: Omit<Repo, "descriptionEn">[];
  categories: Category[];
} {
  const text = readFileSync(README, "utf-8");
  const lines = text.split("\n");
  const repos: Omit<Repo, "descriptionEn">[] = [];
  const categories: Category[] = [];
  const seen = new Set<string>();
  let current: Category | null = null;

  for (const line of lines) {
    const heading = parseHeading(line);
    if (heading) {
      current = heading;
      if (!seen.has(heading.slug)) {
        categories.push(heading);
        seen.add(heading.slug);
      }
      continue;
    }
    if (!current) continue;
    const row = parseRow(line);
    if (!row) continue;
    repos.push({
      ...row,
      starsNumeric: parseStars(row.stars),
      categorySlug: current.slug,
      categoryEmoji: current.emoji,
      categoryGeorgian: current.georgian,
    });
  }

  return { repos, categories };
}

async function enrichWithEnglish(
  repos: Omit<Repo, "descriptionEn">[],
): Promise<Repo[]> {
  const cache = loadGhCache();
  const curated = JSON.parse(readFileSync(CURATED_EN, "utf-8")) as Record<string, string>;
  const skipFetch = process.env["SKIP_GH_FETCH"] === "1";
  let fetched = 0;
  let cached = 0;
  let nonGithub = 0;

  const enriched: Repo[] = [];
  for (const repo of repos) {
    const slug = parseGithubRepo(repo.url);

    let descriptionEn: string | null = null;
    if (!slug) {
      nonGithub += 1;
    } else if (cache[slug]) {
      descriptionEn = cache[slug]!.description;
      cached += 1;
    } else if (skipFetch) {
      descriptionEn = null;
    } else {
      descriptionEn = await fetchGhDescription(slug);
      cache[slug] = {
        description: descriptionEn,
        fetchedAt: new Date().toISOString(),
      };
      fetched += 1;
      // Be polite to the API
      await new Promise((r) => setTimeout(r, 100));
    }

    if (slug) descriptionEn = curated[slug.toLowerCase()] ?? descriptionEn;
    enriched.push({ ...repo, descriptionEn });
  }

  if (fetched > 0) saveGhCache(cache);
  // eslint-disable-next-line no-console
  console.log(
    `  fetched=${fetched}, cached=${cached}, non-github=${nonGithub}`,
  );
  return enriched;
}

async function main(): Promise<void> {
  const { repos: parsed, categories } = parseReadme();
  const repos = await enrichWithEnglish(parsed);
  const output = {
    generated: new Date().toISOString(),
    totalRepos: repos.length,
    categories: categories.map((c) => ({
      ...c,
      count: repos.filter((r) => r.categorySlug === c.slug).length,
    })),
    repos,
  };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(output, null, 2) + "\n", "utf-8");
  const withEn = repos.filter((r) => r.descriptionEn !== null).length;
  // eslint-disable-next-line no-console
  console.log(
    `Wrote ${repos.length} repos across ${categories.length} categories → ${OUT}\n` +
      `  ${withEn}/${repos.length} have English descriptions (${Math.round((withEn / repos.length) * 100)}%)`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
