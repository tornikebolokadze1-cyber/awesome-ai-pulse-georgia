/**
 * refresh-stars.ts — refresh the star COUNT column in the root README.md from
 * live GitHub data. Intended to run on a schedule (see
 * .github/workflows/mcp-star-refresh.yml) so the published counts never drift
 * far from reality.
 *
 * Scope is deliberately narrow and safe to automate:
 *   - ONLY the numeric star cell of each table row is rewritten.
 *   - URLs, repo names, and descriptions (including any prose star figures) are
 *     left untouched — those need human judgement.
 *   - Repos whose URL now redirects (renamed/moved) or returns 404 are REPORTED,
 *     not changed, so a maintainer can review them.
 *
 * Env:
 *   GITHUB_TOKEN  optional; raises the API rate limit (recommended in CI).
 *   DRY_RUN=1     report what would change without writing README.md.
 *
 * Display convention (matches the curated list):
 *   < 1,000        -> exact integer        (e.g. "677")
 *   1,000–9,999    -> one decimal + K      (e.g. "2.3K")
 *   10,000–999,999 -> nearest thousand + K (e.g. "194K")
 *   >= 1,000,000   -> one decimal + M      (e.g. "1.2M")
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const README = resolve(__dirname, "..", "..", "README.md");
const DRY_RUN = process.env["DRY_RUN"] === "1";

/** Row: `| [name](url) | stars | description |` → capture the three editable parts. */
const ROW_RE = /^(\| \[.+?\]\()(.+?)(\) \| )(.+?)( \| .+ \|)$/;

/** "194K" / "2.3K" / "677" display string for a raw count. */
function fmtStars(n: number): string {
  if (n < 1000) return String(n);
  if (n < 10000) return (Math.round(n / 100) / 10).toFixed(1) + "K";
  if (n < 1_000_000) return String(Math.round(n / 1000)) + "K";
  return (Math.round(n / 100_000) / 10).toFixed(1) + "M";
}

/** Is the current star cell a count we should refresh (vs "Guide"/"Gist" etc.)? */
function isNumericStarCell(cell: string): boolean {
  return /^\d+(?:\.\d+)?\s*[KM]?$/.test(cell.trim());
}

/** `owner/repo` from a github.com repo URL; null for gists and non-repo URLs. */
function parseGithubRepo(url: string): string | null {
  if (/gist\.github\.com/i.test(url)) return null;
  const m = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/?#]+)/i);
  if (!m) return null;
  const owner = m[1]!;
  const repo = m[2]!.replace(/\.git$/, "");
  if (["search", "marketplace", "topics", "sponsors"].includes(owner.toLowerCase())) return null;
  return `${owner}/${repo}`;
}

type StarResult = { stars: number; full: string } | { error: string };

async function fetchStars(slug: string): Promise<StarResult> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "aipulsegeorgia-star-refresh",
  };
  const token = process.env["GITHUB_TOKEN"];
  if (token) headers["Authorization"] = `Bearer ${token}`;
  try {
    const res = await fetch(`https://api.github.com/repos/${slug}`, { headers, redirect: "follow" });
    if (!res.ok) return { error: `HTTP ${res.status}` };
    const data = (await res.json()) as { stargazers_count?: number; full_name?: string };
    return { stars: data.stargazers_count ?? 0, full: data.full_name ?? slug };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

async function main(): Promise<void> {
  const raw = readFileSync(README, "utf-8");
  const lines = raw.split("\n");

  let changed = 0;
  let checked = 0;
  const renamed: string[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const cr = lines[i]!.endsWith("\r") ? "\r" : "";
    const line = cr ? lines[i]!.slice(0, -1) : lines[i]!;
    if (!line.startsWith("| [")) continue;
    const m = line.match(ROW_RE);
    if (!m) continue;
    const [, pre, url, mid, starCell, rest] = m;
    if (!isNumericStarCell(starCell!)) continue; // skip "Guide"/"Gist" specials
    const slug = parseGithubRepo(url!);
    if (!slug) continue;

    checked++;
    const r = await fetchStars(slug);
    if ("error" in r) {
      errors.push(`${slug}: ${r.error}`);
      continue;
    }
    if (r.full.toLowerCase() !== slug.toLowerCase()) renamed.push(`${slug} -> ${r.full}`);

    const next = fmtStars(r.stars);
    if (next !== starCell!.trim()) {
      changed++;
      lines[i] = `${pre}${url}${mid}${next}${rest}${cr}`;
    }
    await new Promise((res) => setTimeout(res, 60)); // be polite to the API
  }

  if (!DRY_RUN && changed > 0) writeFileSync(README, lines.join("\n"), "utf-8");

  // eslint-disable-next-line no-console
  console.log(
    `${DRY_RUN ? "[dry-run] " : ""}Checked ${checked} repos; star cell changed for ${changed}.`,
  );
  if (renamed.length) {
    console.log(`\n${renamed.length} repo(s) moved/renamed (URL not updated — review manually):`);
    for (const r of renamed) console.log(`  - ${r}`);
  }
  if (errors.length) {
    console.log(`\n${errors.length} repo(s) failed to fetch (review manually):`);
    for (const e of errors) console.log(`  - ${e}`);
  }
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
