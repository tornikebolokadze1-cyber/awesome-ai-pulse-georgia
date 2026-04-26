/**
 * Parses the root README.md and emits data/repos.json — the canonical
 * data source for the MCP server. Run on every README change.
 *
 * Output: { generated, totalRepos, categories, repos }
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..", "..");
const README = resolve(ROOT, "README.md");
const OUT = resolve(__dirname, "..", "data", "repos.json");

type Category = {
  slug: string;
  emoji: string;
  georgian: string;
  english: string;
};

const CATEGORY_MAP: Record<string, Omit<Category, "georgian">> = {
  "კოდინგ აგენტები": { slug: "coding", emoji: "🤖", english: "Coding Agents" },
  "Claude Code პლაგინები და უნარები": { slug: "plugins", emoji: "⚡", english: "Claude Code Plugins & Skills" },
  "MCP ინტეგრაციები": { slug: "mcp", emoji: "🔌", english: "MCP Integrations" },
  "ვებ სკრეიპინგი და ბრაუზერი": { slug: "scraping", emoji: "🕷️", english: "Web Scraping & Browser" },
  "AI აგენტების ფრეიმვორკები": { slug: "frameworks", emoji: "🧬", english: "AI Agent Frameworks" },
  "მზა AI აგენტები ბიზნესისთვის": { slug: "business", emoji: "💼", english: "Ready-Made AI Agents for Business" },
  "მეხსიერება და RAG": { slug: "memory", emoji: "🧠", english: "Memory & RAG" },
  "AI ინფრასტრუქტურა და ხელსაწყოები": { slug: "infra", emoji: "⚙️", english: "AI Infrastructure & Tools" },
  "რესურსები და სასწავლო მასალები": { slug: "resources", emoji: "📚", english: "Resources & Learning" },
};

type Repo = {
  name: string;
  url: string;
  stars: string;
  starsNumeric: number | null;
  description: string;
  categorySlug: string;
  categoryEmoji: string;
  categoryGeorgian: string;
};

/** "11K" → 11000, "187K" → 187000, "1.5M" → 1500000, "Guide" → null */
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

/** Extract Georgian section heading: "## 🤖 კოდინგ აგენტები" → category */
function parseHeading(line: string): Category | null {
  const m = line.match(/^##\s+(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*️?\s+(.+?)\s*$/u);
  if (!m) return null;
  const georgian = m[2]!.trim();
  const meta = CATEGORY_MAP[georgian];
  if (!meta) return null;
  return { ...meta, georgian };
}

/** Extract repo from a markdown table row: | [name](url) | stars | description | */
function parseRow(line: string): Pick<Repo, "name" | "url" | "stars" | "description"> | null {
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

function parse(): { repos: Repo[]; categories: Category[] } {
  const text = readFileSync(README, "utf-8");
  const lines = text.split("\n");
  const repos: Repo[] = [];
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

function main(): void {
  const { repos, categories } = parse();
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
  // eslint-disable-next-line no-console
  console.log(`Wrote ${repos.length} repos across ${categories.length} categories → ${OUT}`);
}

main();
