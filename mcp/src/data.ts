/**
 * Loads the parsed repo collection from data/repos.json at startup.
 * Throws if the file is missing — `npm run build:data` must run first.
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export type Repo = {
  name: string;
  url: string;
  stars: string;
  starsNumeric: number | null;
  description: string;
  categorySlug: string;
  categoryEmoji: string;
  categoryGeorgian: string;
};

export type Category = {
  slug: string;
  emoji: string;
  georgian: string;
  english: string;
  count: number;
};

export type Collection = {
  generated: string;
  totalRepos: number;
  categories: Category[];
  repos: Repo[];
};

function findDataPath(): string {
  // When bundled to dist/, data sits one directory up from the bundle.
  // When run via tsx in src/, data sits two directories up.
  const candidates = [
    resolve(__dirname, "..", "data", "repos.json"),
    resolve(__dirname, "..", "..", "data", "repos.json"),
  ];
  for (const path of candidates) {
    try {
      readFileSync(path, "utf-8");
      return path;
    } catch {
      // try next
    }
  }
  throw new Error(
    `repos.json not found. Run 'npm run build:data' first. Searched: ${candidates.join(", ")}`,
  );
}

export function loadCollection(): Collection {
  const path = findDataPath();
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as Collection;
}
