/**
 * aipulse-agent — the curator's commands, run by the GitHub workflows:
 *   scan     check listed repos, look for new ones, file proposals
 *            --memory FILE  keeps the model's verdicts between runs
 *            --no-discover  only the health of listed repos, no search for new ones
 *            --max-new N    draft at most N new repos (default: maxNewPerScan in rules.json)
 *            --out FILE     the full report as JSON; exit 2 when every discovery source failed
 *   suggest  answer one owner suggestion issue (--issue N)
 *   apply    apply approved proposals to the working tree (--out result.json,
 *            --issues 12,15 to take only those); exit 1 when the run itself stopped
 *   verify   check that the README, every count and the rebuilt data agree (exit 1 if not)
 *   report   tell the issues how apply went (--result file; --commit URL when it was pushed,
 *            --error text when it was not; neither when nothing was applied)
 *   serve    run the MCP gateway locally (MCP_TOKEN, GITHUB_TOKEN; AGENT_REPO, AGENT_BRANCH, PORT,
 *            OAUTH_REDIRECT_URIS, PUBLIC_URL)
 * scan, suggest, apply and report take --dry-run (nothing is written to GitHub or to files).
 * Environment: GITHUB_TOKEN, ANTHROPIC_API_KEY, AGENT_MODEL, and AGENT_LOG_LEVEL=warn for quieter logs.
 */
import { randomBytes } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { reportApply, runApply, type ApplyResult } from "./apply.js";
import { loadCategories, loadRules, REPO_ROOT } from "./config.js";
import { GitHub } from "./github.js";
import { llmFromEnv } from "./llm.js";
import { log } from "./log.js";
import { loadMemory, saveMemory } from "./memory.js";
import type { Proposal } from "./proposals.js";
import { discoveryBroken, NO_AI_SIGNAL, runScan, runSuggestion, type Ctx, type ScanReport } from "./scan.js";
import { verifyTree } from "./verify.js";

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    "dry-run": { type: "boolean", default: false },
    "no-discover": { type: "boolean", default: false },
    "max-new": { type: "string" },
    memory: { type: "string" },
    out: { type: "string" },
    issue: { type: "string" },
    issues: { type: "string" },
    result: { type: "string" },
    commit: { type: "string" },
    error: { type: "string" },
  },
});

function context(): Ctx {
  return {
    gh: new GitHub(process.env["GITHUB_TOKEN"]),
    rules: loadRules(),
    categories: loadCategories(),
    root: REPO_ROOT,
    llm: llmFromEnv(),
    now: new Date(),
  };
}

/** What a proposal is about, in a few words. */
function subject(p: Proposal): string {
  switch (p.type) {
    case "rename":
      return `${p.from} → ${p.to}`;
    case "english":
      return `${p.updates.length} updates`;
    default:
      return p.repo;
  }
}

/** A short Markdown summary for the workflow run page (and for people reading logs). */
function summarize(r: ScanReport): string {
  const lines = [
    `## აგენტის სკანი — ${r.started.slice(0, 16).replace("T", " ")} UTC`,
    "",
    `სიაში ${r.listed} რეპოა. ახალი შეთავაზება: **${r.proposals.length}**${r.filed.length ? ` (შეიქმნა: ${r.filed.map((f) => `#${f.number}`).join(", ")})` : ""}.`,
    "",
    "| წყარო | მუშაობს | იპოვა |",
    "|---|---|---|",
    ...r.sources.map((s) => `| ${s.source} | ${s.ok ? "✅" : `❌ ${s.error ?? ""}`} | ${s.found} |`),
  ];
  if (r.notes.length) lines.push("", ...r.notes.map((n) => `- ⚠️ ${n}`));
  if (r.proposals.length) lines.push("", "### შეთავაზებები", ...r.proposals.map((p) => `- ${p.type}: ${subject(p)}`));
  // repos without any AI signal are the bulk of the trending pages: count them, list the rest
  const noSignal = r.skipped.filter((s) => s.why === NO_AI_SIGNAL).length;
  const other = r.skipped.filter((s) => s.why !== NO_AI_SIGNAL);
  if (other.length) lines.push("", `### გამოტოვებული (${other.length})`, ...other.slice(0, 30).map((s) => `- ${s.repo}: ${s.why}`));
  if (noSignal) lines.push("", `AI-სთან კავშირის გარეშე, მოდელისთვის არ გადაცემულა: ${noSignal}`);
  if (r.held.length) lines.push("", `შეკავებული (უკვე შეთავაზებულია ან უარყოფილია): ${r.held.length}`);
  return lines.join("\n");
}

function toStepSummary(md: string): void {
  const file = process.env["GITHUB_STEP_SUMMARY"];
  if (file) appendFileSync(file, `${md}\n`);
}

/**
 * Reports carry text a model wrote after reading a stranger's README. On a runner a line
 * of it could pass for a workflow command (::error::, ::add-mask::), so commands are
 * switched off around it, with an end marker nobody can guess.
 */
function print(text: string): void {
  if (process.env["GITHUB_ACTIONS"] !== "true") {
    process.stdout.write(`${text}\n`);
    return;
  }
  const end = randomBytes(16).toString("hex");
  process.stdout.write(`::stop-commands::${end}\n${text}\n::${end}::\n`);
}

function setOutput(name: string, value: string): void {
  const file = process.env["GITHUB_OUTPUT"];
  if (file) appendFileSync(file, `${name}=${value}\n`);
}

async function main(): Promise<void> {
  const cmd = positionals[0];
  const dryRun = values["dry-run"] === true;
  switch (cmd) {
    case "scan": {
      const maxNew = values["max-new"] === undefined ? undefined : Number(values["max-new"]);
      // a typo here must not lift the model budget
      if (maxNew !== undefined && !(Number.isInteger(maxNew) && maxNew >= 0)) throw new Error("--max-new needs a whole number, 0 or more");
      const ctx = context();
      const memory = loadMemory(values.memory);
      const report = await runScan(ctx, { dryRun, discover: values["no-discover"] !== true, memory, ...(maxNew !== undefined ? { maxNew } : {}) });
      if (values.memory && !dryRun) saveMemory(values.memory, memory, ctx.now);
      if (values.out) writeFileSync(values.out, JSON.stringify(report, null, 2));
      const md = summarize(report);
      toStepSummary(md);
      print(md);
      if (discoveryBroken(report)) process.exitCode = 2; // "nothing new" would only be a guess
      return;
    }
    case "suggest": {
      const n = Number(values.issue);
      if (!Number.isInteger(n) || n <= 0) throw new Error("suggest needs --issue <number>");
      const r = await runSuggestion(context(), n, dryRun);
      print(JSON.stringify(r, null, 2));
      return;
    }
    case "apply": {
      const numbers = values.issues?.split(",").map((s) => Number(s.trim()));
      // a typo must not widen "only these" into "all of them"
      if (numbers && !numbers.every((n) => Number.isInteger(n) && n > 0)) throw new Error("--issues needs issue numbers, like --issues 12,15");
      const result = await runApply(context(), { dryRun, ...(numbers ? { numbers } : {}) });
      if (values.out) writeFileSync(values.out, JSON.stringify(result, null, 2));
      setOutput("applied", String(result.applied.length));
      const md = [
        `## აგენტი: დამტკიცებული ცვლილებები`,
        ...(result.error ? [`⛔ გაშვება შეჩერდა და არაფერი შენახულა: ${result.error}`] : []),
        `რეპოები: ${result.counts.before.repos} → ${result.counts.after.repos}`,
        ...result.applied.map((a) => `- ✅ #${a.number} ${a.summary}`),
        ...result.failed.map((f) => `- ⚠️ #${f.number} ${f.error}`),
      ].join("\n");
      toStepSummary(md);
      print(md);
      // the result file is already written, so the issues can still be told why
      if (result.error) process.exitCode = 1;
      return;
    }
    case "report": {
      if (!values.result) throw new Error("report needs --result <apply-result.json>");
      const result = JSON.parse(readFileSync(values.result, "utf-8")) as ApplyResult;
      if (dryRun) {
        print(`would report ${result.applied.length} applied, ${result.failed.length} failed`);
        return;
      }
      await reportApply(context(), result, { ...(values.commit ? { changeUrl: values.commit } : {}), ...(values.error ? { error: values.error } : {}) });
      return;
    }
    case "verify": {
      const problems = verifyTree(REPO_ROOT, loadCategories());
      for (const p of problems) process.stderr.write(`✗ ${p}\n`);
      process.stdout.write(problems.length ? `${problems.length} problem(s)\n` : "✓ README, counts and generated data agree\n");
      if (problems.length) process.exitCode = 1;
      return;
    }
    case "serve": {
      // loaded only here: no other command needs the MCP SDK
      const { startGateway } = await import("./start.js");
      startGateway();
      return;
    }
    default:
      process.stderr.write("usage: cli.ts <scan|suggest|apply|verify|report|serve> [--dry-run] ...\n");
      process.exitCode = 64;
  }
}

main().catch((err: unknown) => {
  log.error("agent failed", { error: (err as Error).message });
  process.exitCode = 1;
});
