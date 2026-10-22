/**
 * Starts the gateway: serve.ts does it in the Deploy ON container, `cli.ts serve`
 * locally. Fails closed: without a long MCP_TOKEN and a GITHUB_TOKEN, or with an
 * OAuth address it cannot trust, it throws instead of listening.
 */
import type { Server } from "node:http";
import { createGateway } from "./gateway.js";
import { GitHub } from "./github.js";
import { log } from "./log.js";
import { publicUrlFrom, redirectUrisFrom } from "./oauth.js";

export function startGateway(env = process.env): Server {
  const token = env["MCP_TOKEN"] ?? "";
  const ghToken = env["GITHUB_TOKEN"] ?? "";
  if (token.length < 32)
    throw new Error(
      "MCP_TOKEN is missing or shorter than 32 characters; refusing to start",
    );
  if (!ghToken) throw new Error("GITHUB_TOKEN is missing; refusing to start");
  const repo =
    env["AGENT_REPO"] || "tornikebolokadze1-cyber/awesome-ai-pulse-georgia";
  const branch = env["AGENT_BRANCH"] || "main";
  const port = Number(env["PORT"] || "8080");
  const redirectUris = redirectUrisFrom(env["OAUTH_REDIRECT_URIS"]);
  const server = createGateway({
    token,
    github: new GitHub(ghToken, "aipulse-agent-gateway"),
    repo,
    branch,
    redirectUris,
    publicUrl: publicUrlFrom(env["PUBLIC_URL"]),
  });
  server.listen(port, "0.0.0.0", () =>
    log.info("gateway listening", { port, repo, branch, redirectUris }),
  );
  const stop = () => server.close(() => process.exit(0));
  process.on("SIGTERM", stop);
  process.on("SIGINT", stop);
  return server;
}
