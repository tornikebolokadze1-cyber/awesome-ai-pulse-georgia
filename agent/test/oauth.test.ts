import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { request } from "node:http";
import type { AddressInfo } from "node:net";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { auth, type OAuthClientProvider } from "@modelcontextprotocol/sdk/client/auth.js";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { OAuthClientInformationMixed, OAuthTokens } from "@modelcontextprotocol/sdk/shared/auth.js";
import type { Collection } from "../../mcp/src/data.js";
import { REPO_ROOT } from "../src/config.js";
import { createGateway, type GatewayConfig } from "../src/gateway.js";
import { GROK_REDIRECT, publicUrlFrom, redirectUrisFrom } from "../src/oauth.js";
import { startGateway } from "../src/start.js";

const SECRET = randomBytes(24).toString("hex"); // generated per run, never a literal
const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const collection = JSON.parse(readFileSync(resolve(REPO_ROOT, "mcp/data/repos.json"), "utf-8")) as Collection;
const github = { rest: async <T>(): Promise<T> => [] as T };
/** Every gateway here reads this clock, so a test can let tokens expire without waiting. */
let clock = Date.parse("2026-10-22T12:00:00Z");

async function listen(over: Partial<GatewayConfig> = {}): Promise<{ base: string; close: () => Promise<void> }> {
  const server = createGateway({ token: SECRET, github, repo: "owner/repo", branch: "main", loadCollection: async () => collection, rateLimitPerMinute: 10_000, now: () => clock, ...over });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  return {
    base: `http://127.0.0.1:${(server.address() as AddressInfo).port}`,
    close: async () => {
      // a failed check must not leave a server running, or the test process never ends
      server.closeAllConnections();
      await new Promise<void>((r) => server.close(() => r()));
    },
  };
}

let gw: { base: string; close: () => Promise<void> };
before(async () => {
  gw = await listen();
});
after(async () => {
  await gw.close();
});

const verifier = randomBytes(32).toString("base64url");
const challenge = createHash("sha256").update(verifier).digest("base64url");
/** What a connector sends to /oauth/authorize, with some fields changed or left out. */
function ask(over: Record<string, string> = {}, drop: string[] = []): URLSearchParams {
  const p = new URLSearchParams({ response_type: "code", client_id: "aipulse-grok", redirect_uri: GROK_REDIRECT, code_challenge: challenge, code_challenge_method: "S256", state: "s-123", ...over });
  for (const k of drop) p.delete(k);
  return p;
}
/** The owner submitting the consent form. */
const consent = (base: string, params: URLSearchParams, key: string) =>
  fetch(`${base}/oauth/authorize`, { method: "POST", redirect: "manual", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams([...params, ["token", key]]) });
const exchange = (base: string, fields: Record<string, string>) =>
  fetch(`${base}/oauth/token`, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(fields) });
const initialize = (base: string, bearer: string) =>
  fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream", authorization: `Bearer ${bearer}` },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "t", version: "1" } } }),
  });

async function codeFrom(base: string): Promise<string> {
  const r = await consent(base, ask(), SECRET);
  assert.equal(r.status, 302);
  return new URL(r.headers.get("location")!).searchParams.get("code")!;
}

type Tokens = { access_token: string; refresh_token: string; token_type: string; expires_in: number; scope: string };
async function tokensFrom(base: string): Promise<Tokens> {
  const r = await exchange(base, { grant_type: "authorization_code", code: await codeFrom(base), code_verifier: verifier, client_id: "aipulse-grok", redirect_uri: GROK_REDIRECT });
  assert.equal(r.status, 200);
  return (await r.json()) as Tokens;
}

/** A GET with a Host header of the test's choosing, which fetch does not allow. */
function getWithHost(base: string, path: string, host: string): Promise<{ status: number; body: string }> {
  return new Promise((ok, fail) => {
    const req = request({ host: "127.0.0.1", port: new URL(base).port, path, headers: { host } }, (res) => {
      let body = "";
      res.on("data", (c: Buffer) => (body += c.toString()));
      res.on("end", () => ok({ status: res.statusCode ?? 0, body }));
    });
    req.on("error", fail);
    req.end();
  });
}

test("the metadata names this gateway's own sign-in, on the address it was reached at", async () => {
  assert.deepEqual(await (await fetch(`${gw.base}/.well-known/oauth-authorization-server`)).json(), {
    issuer: gw.base,
    authorization_endpoint: `${gw.base}/oauth/authorize`,
    token_endpoint: `${gw.base}/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
    scopes_supported: ["mcp"],
  });
  for (const path of ["/.well-known/oauth-protected-resource/mcp", "/.well-known/oauth-protected-resource"]) {
    const r = (await (await fetch(`${gw.base}${path}`)).json()) as { resource: string; authorization_servers: string[] };
    assert.equal(r.resource, `${gw.base}/mcp`, path);
    assert.deepEqual(r.authorization_servers, [gw.base], path);
  }
  // behind the platform's proxy the Host is the public name, and the public side is https
  const proxied = await getWithHost(gw.base, "/.well-known/oauth-authorization-server", "gateway.example");
  assert.equal((JSON.parse(proxied.body) as { token_endpoint: string }).token_endpoint, "https://gateway.example/oauth/token");
  assert.equal((await getWithHost(gw.base, "/.well-known/oauth-protected-resource", 'gateway.example"x')).status, 400);
  const fixed = await listen({ publicUrl: "https://agent.example" });
  try {
    assert.equal(((await (await fetch(`${fixed.base}/.well-known/oauth-authorization-server`)).json()) as { issuer: string }).issuer, "https://agent.example");
  } finally {
    await fixed.close();
  }
});

test("a refused /mcp request tells the client where to sign in", async () => {
  const anonymous = await fetch(`${gw.base}/mcp`, { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
  assert.equal(anonymous.status, 401);
  const header = anonymous.headers.get("www-authenticate") ?? "";
  assert.ok(header.includes(`resource_metadata="${gw.base}/.well-known/oauth-protected-resource/mcp"`), header);
  assert.ok(!header.includes("error="), header);
  const wrong = await initialize(gw.base, "not-a-token");
  assert.equal(wrong.status, 401);
  assert.match(wrong.headers.get("www-authenticate") ?? "", /error="invalid_token"/);
});

test("the consent page says who asks and where the answer goes, escapes both, and cannot be framed", async () => {
  const r = await fetch(`${gw.base}/oauth/authorize?${ask({ client_id: "<b>grok</b>", state: '"><script>alert(1)</script>' })}`);
  assert.equal(r.status, 200);
  assert.match(r.headers.get("content-type") ?? "", /^text\/html/);
  const csp = r.headers.get("content-security-policy") ?? "";
  assert.match(csp, /frame-ancestors 'none'/);
  assert.match(csp, /form-action 'self' https:\/\/grok\.com;/);
  assert.equal(r.headers.get("x-frame-options"), "DENY");
  assert.equal(r.headers.get("cache-control"), "no-store");
  const html = await r.text();
  assert.ok(!html.includes("<script>") && !html.includes("<b>grok</b>"), "what the client sent is shown as text");
  assert.ok(html.includes("&#60;b&#62;grok&#60;/b&#62;"), html);
  assert.ok(html.includes("<b>grok.com</b>"), "the page names where the code would go");
  assert.match(html, /<input id="token" name="token" type="password"/);
});

test("a code goes only to an address on the list, character for character", async () => {
  const bad = [
    "https://grok.com/connectors-oauth-exchange-code",
    "http://grok.com/connectors-oauth-exchange-code/",
    "https://grok.com.evil.example/connectors-oauth-exchange-code/",
    "https://evil.example/connectors-oauth-exchange-code/",
    "https://grok.com/connectors-oauth-exchange-code/x",
    "https://grok.com/connectors-oauth-exchange-code/?next=https://evil.example",
    "https://GROK.com/connectors-oauth-exchange-code/",
  ];
  for (const uri of bad) {
    const page = await fetch(`${gw.base}/oauth/authorize?${ask({ redirect_uri: uri })}`);
    assert.equal(page.status, 400, uri);
    assert.match(await page.text(), /redirect_uri is not on this gateway/);
    // the submitted form is checked again, so editing its hidden field does not help either
    const posted = await consent(gw.base, ask({ redirect_uri: uri }), SECRET);
    assert.equal(posted.status, 400, uri);
    assert.equal(posted.headers.get("location"), null, uri);
  }
  const missing = await consent(gw.base, ask({}, ["redirect_uri"]), SECRET);
  assert.equal(missing.status, 400);
  assert.equal(missing.headers.get("location"), null);
});

test("PKCE with S256 is required, and a client must say who it is", async () => {
  const cases: Array<[Record<string, string>, string[]]> = [
    [{}, ["code_challenge"]],
    [{}, ["code_challenge_method"]],
    [{ code_challenge_method: "plain" }, []],
    [{ code_challenge: "too-short" }, []],
    [{ response_type: "token" }, []],
    [{}, ["client_id"]],
  ];
  for (const [over, drop] of cases) {
    const r = await consent(gw.base, ask(over, drop), SECRET);
    assert.equal(r.status, 400, JSON.stringify({ over, drop }));
    assert.equal(r.headers.get("location"), null);
  }
});

test("the right key sends a code back to the client, with its state", async () => {
  const r = await consent(gw.base, ask(), SECRET);
  assert.equal(r.status, 302);
  const location = r.headers.get("location")!;
  const to = new URL(location);
  assert.equal(`${to.origin}${to.pathname}`, GROK_REDIRECT);
  assert.equal(to.searchParams.get("state"), "s-123");
  assert.ok((to.searchParams.get("code") ?? "").length > 40);
  assert.ok(!location.includes(SECRET), "the key itself never leaves");
  // a key pasted with a stray space or line break still counts
  assert.equal((await consent(gw.base, ask(), ` ${SECRET}\n`)).status, 302);
});

test("a wrong key gets no code; ten wrong keys close the page for fifteen minutes", async () => {
  const own = await listen();
  try {
    const wrong = await consent(own.base, ask(), "x".repeat(48));
    assert.equal(wrong.status, 401);
    assert.equal(wrong.headers.get("location"), null);
    assert.match(await wrong.text(), /გასაღები არ ემთხვევა/);
    for (let i = 0; i < 8; i++) await consent(own.base, ask(), SECRET.slice(0, -1));
    assert.equal((await consent(own.base, ask(), SECRET)).status, 302, "nine mistakes do not lock the owner out");
    for (let i = 0; i < 10; i++) await consent(own.base, ask(), SECRET.slice(0, -1));
    const locked = await consent(own.base, ask(), SECRET);
    assert.equal(locked.status, 429, "the right key waits out the lockout too");
    assert.equal(locked.headers.get("location"), null);
    assert.equal(locked.headers.get("retry-after"), "900");
    clock += 15 * MINUTE + 1000;
    assert.equal((await consent(own.base, ask(), SECRET)).status, 302);
  } finally {
    await own.close();
  }
});

test("a code becomes tokens once, only with its verifier, client and address, within five minutes", async () => {
  const code = await codeFrom(gw.base);
  const fields = { grant_type: "authorization_code", code, code_verifier: verifier, client_id: "aipulse-grok", redirect_uri: GROK_REDIRECT };
  const refused = async (over: Record<string, string>) => {
    const r = await exchange(gw.base, { ...fields, ...over });
    assert.equal(r.status, 400, JSON.stringify(over));
    assert.equal(((await r.json()) as { error: string }).error, "invalid_grant", JSON.stringify(over));
  };
  await refused({ code_verifier: randomBytes(32).toString("base64url") });
  await refused({ client_id: "someone-else" });
  await refused({ redirect_uri: "https://evil.example/cb" });
  await refused({ code: `${code.split(".")[0]}.${"A".repeat(43)}` });
  const ok = await exchange(gw.base, fields);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("cache-control"), "no-store");
  const t = (await ok.json()) as Tokens;
  assert.equal(t.token_type, "Bearer");
  assert.equal(t.expires_in, 3600);
  assert.equal(t.scope, "mcp");
  assert.notEqual(t.access_token, t.refresh_token);
  await refused({}); // the same code a second time
  const late = await codeFrom(gw.base);
  clock += 5 * MINUTE + 1000;
  await refused({ code: late });
  const other = await exchange(gw.base, { grant_type: "password", username: "owner", password: "x" });
  assert.equal(((await other.json()) as { error: string }).error, "unsupported_grant_type");
});

test("an access token opens /mcp for an hour; a code, a refresh token or an altered token never does", async () => {
  const t = await tokensFrom(gw.base);
  assert.equal((await initialize(gw.base, t.access_token)).status, 200);
  assert.equal((await initialize(gw.base, t.refresh_token)).status, 401);
  assert.equal((await initialize(gw.base, await codeFrom(gw.base))).status, 401);
  const [body, sig] = t.access_token.split(".") as [string, string];
  const claims = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as { exp: number };
  const longer = Buffer.from(JSON.stringify({ ...claims, exp: claims.exp + 365 * 86_400 })).toString("base64url");
  assert.equal((await initialize(gw.base, `${longer}.${sig}`)).status, 401, "a changed expiry breaks the signature");
  assert.equal((await initialize(gw.base, `${body}.${sig}x`)).status, 401);
  clock += 60 * MINUTE + 1000;
  const expired = await initialize(gw.base, t.access_token);
  assert.equal(expired.status, 401);
  assert.match(expired.headers.get("www-authenticate") ?? "", /error="invalid_token"/);
});

test("a refresh token gives a fresh pair, and the swapped one keeps working while the client comes back", async () => {
  const t = await tokensFrom(gw.base);
  const refresh = (token: string, over: Record<string, string> = {}) => exchange(gw.base, { grant_type: "refresh_token", refresh_token: token, ...over });
  assert.equal((await refresh(t.refresh_token, { client_id: "someone-else" })).status, 400);
  assert.equal((await refresh(t.access_token)).status, 400, "an access token is no refresh token");
  clock += 29 * DAY;
  const next = (await (await refresh(t.refresh_token, { client_id: "aipulse-grok" })).json()) as Tokens;
  assert.equal((await initialize(gw.base, next.access_token)).status, 200);
  clock += 2 * DAY;
  assert.equal((await refresh(t.refresh_token)).status, 400, "the first refresh token ran out after thirty days");
  assert.equal((await refresh(next.refresh_token)).status, 200, "the one it was swapped for still works");
});

test("a new MCP_TOKEN disconnects every client at once", async () => {
  const t = await tokensFrom(gw.base);
  const rotated = await listen({ token: randomBytes(24).toString("hex") });
  try {
    assert.equal((await initialize(rotated.base, t.access_token)).status, 401);
    assert.equal((await exchange(rotated.base, { grant_type: "refresh_token", refresh_token: t.refresh_token })).status, 400);
  } finally {
    await rotated.close();
  }
});

/** What a connector like Grok's keeps between the steps of a sign-in. */
class Connector implements OAuthClientProvider {
  info: OAuthClientInformationMixed | undefined = { client_id: "aipulse-grok" };
  saved: OAuthTokens | undefined;
  verifier = "";
  sentTo: URL | undefined;
  get redirectUrl() {
    return GROK_REDIRECT;
  }
  get clientMetadata() {
    return { client_name: "test connector", redirect_uris: [GROK_REDIRECT], grant_types: ["authorization_code", "refresh_token"], response_types: ["code"], token_endpoint_auth_method: "none" };
  }
  clientInformation() {
    return this.info;
  }
  saveClientInformation(info: OAuthClientInformationMixed) {
    this.info = info;
  }
  tokens() {
    return this.saved;
  }
  saveTokens(tokens: OAuthTokens) {
    this.saved = tokens;
  }
  redirectToAuthorization(url: URL) {
    this.sentTo = url;
  }
  saveCodeVerifier(v: string) {
    this.verifier = v;
  }
  codeVerifier() {
    return this.verifier;
  }
}

test("the official MCP client signs in from scratch the way a connector does, sees the tools, and refreshes on its own", async () => {
  const connector = new Connector();
  const serverUrl = `${gw.base}/mcp`;
  assert.equal(await auth(connector, { serverUrl }), "REDIRECT");
  const sentTo = connector.sentTo!;
  assert.equal(`${sentTo.origin}${sentTo.pathname}`, `${gw.base}/oauth/authorize`);
  assert.equal((await fetch(sentTo)).status, 200, "the owner sees the consent page");
  const answer = await consent(gw.base, sentTo.searchParams, SECRET);
  const code = new URL(answer.headers.get("location")!).searchParams.get("code")!;
  assert.equal(await auth(connector, { serverUrl, authorizationCode: code }), "AUTHORIZED");
  const client = new Client({ name: "connector", version: "1.0.0" });
  await client.connect(new StreamableHTTPClientTransport(new URL(serverUrl), { authProvider: connector }));
  try {
    assert.ok((await client.listTools()).tools.some((t) => t.name === "list_proposals"));
    const first = connector.saved?.access_token;
    clock += 61 * MINUTE;
    assert.ok((await client.listTools()).tools.length > 0, "after an hour the client refreshes and carries on");
    assert.notEqual(connector.saved?.access_token, first);
  } finally {
    await client.close();
  }
});

test("the gateway refuses to start with a sign-in address it cannot trust", () => {
  assert.deepEqual(redirectUrisFrom(undefined), [GROK_REDIRECT]);
  assert.deepEqual(redirectUrisFrom(" https://a.example/cb , https://b.example/cb/ "), ["https://a.example/cb", "https://b.example/cb/"]);
  for (const bad of ["http://grok.com/cb", "grok.com/cb", "https://a.example/cb#x", "https://user:pw@a.example/cb", "javascript:alert(1)"]) assert.throws(() => redirectUrisFrom(bad), /OAUTH_REDIRECT_URIS/, bad);
  assert.equal(publicUrlFrom(undefined), undefined);
  assert.equal(publicUrlFrom("https://agent.example/"), "https://agent.example");
  for (const bad of ["http://agent.example", "https://agent.example/mcp", "agent.example"]) assert.throws(() => publicUrlFrom(bad), /PUBLIC_URL/, bad);
  assert.throws(() => startGateway({ MCP_TOKEN: SECRET, GITHUB_TOKEN: "x", OAUTH_REDIRECT_URIS: "http://grok.com/cb", PORT: "0" }), /OAUTH_REDIRECT_URIS/);
  assert.throws(() => startGateway({ MCP_TOKEN: SECRET, GITHUB_TOKEN: "x", PUBLIC_URL: "http://agent.example", PORT: "0" }), /PUBLIC_URL/);
});
