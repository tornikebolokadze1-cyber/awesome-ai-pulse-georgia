/**
 * OAuth sign-in for clients that cannot send a header, such as grok.com's custom
 * connectors. The gateway is its own authorization server (OAuth 2.1, authorization code
 * with PKCE): on the consent page the owner proves who they are once, with MCP_TOKEN, and
 * the client receives short-lived tokens instead of it.
 *
 * Nothing is stored. Codes and tokens are HMAC-signed with a key derived from MCP_TOKEN,
 * so a restart keeps a client connected and a new MCP_TOKEN disconnects every client at
 * once. The only memory is which codes were already used, for their five minutes.
 */
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { log } from "./log.js";

/** Where grok.com's custom connectors receive the code. xAI does not document it; several server operators report this exact string. */
export const GROK_REDIRECT = "https://grok.com/connectors-oauth-exchange-code/";

const SCOPE = "mcp";
const CODE_TTL = 5 * 60; // seconds
const ACCESS_TTL = 60 * 60;
const REFRESH_TTL = 30 * 24 * 60 * 60;
const MAX_FORM = 16_384;
const MAX_FAILURES = 10;
const LOCKOUT_MS = 15 * 60_000;
const LOCAL = /^(localhost|127\.0\.0\.1)(:\d{1,5})?$/i;
const HOST = /^[a-z0-9.-]+(:\d{1,5})?$/i;
const VERIFIER = /^[A-Za-z0-9._~-]{43,128}$/;
const METADATA = new Set(["/.well-known/oauth-authorization-server", "/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"]);

export type OAuthConfig = {
  /** MCP_TOKEN: the owner types it on the consent page, and the signing key is derived from it */
  secret: string;
  /** the exact addresses a code may be sent to */
  redirectUris: readonly string[];
  /** the gateway's public origin; without it, https on the request's Host */
  publicUrl?: string;
  /** test seam, in milliseconds */
  now?: () => number;
};

export type OAuth = {
  /** Answers the metadata and /oauth/* routes; false for any other path. */
  handle(req: IncomingMessage, res: ServerResponse, url: URL): Promise<boolean>;
  /** True for an unexpired access token this gateway signed. */
  accepts(header: string | undefined): boolean;
  /** The WWW-Authenticate value of a 401, pointing the client at the metadata. */
  challenge(req: IncomingMessage, presented: boolean): string;
};

type Kind = "code" | "access" | "refresh";
/** What a token carries; `ru` and `cc` only in codes. Times are in seconds. */
type Claims = { k: Kind; exp: number; cid: string; jti: string; ru?: string; cc?: string };
/** A checked authorization request. Its scope and resource are not kept: every token grants the same tools. */
type AuthRequest = { clientId: string; redirectUri: string; challenge: string; state: string };

/** OAUTH_REDIRECT_URIS (comma-separated), or grok.com's address when unset. Plain https only; http only on this machine. */
export function redirectUrisFrom(value: string | undefined): string[] {
  const list = value?.trim() ? value.split(",").map((s) => s.trim()).filter(Boolean) : [GROK_REDIRECT];
  for (const uri of list) {
    let u: URL;
    try {
      u = new URL(uri);
    } catch {
      throw new Error(`OAUTH_REDIRECT_URIS has something that is not an address: ${uri}`);
    }
    const local = u.protocol === "http:" && LOCAL.test(u.host);
    if ((u.protocol !== "https:" && !local) || u.hash || u.username || u.password) throw new Error(`OAUTH_REDIRECT_URIS takes plain https addresses only: ${uri}`);
  }
  return list;
}

/** PUBLIC_URL: the gateway's own origin, for a proxy that does not pass the Host on. */
export function publicUrlFrom(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  let u: URL;
  try {
    u = new URL(value.trim());
  } catch {
    throw new Error(`PUBLIC_URL is not an address: ${value}`);
  }
  if (u.protocol !== "https:" && !(u.protocol === "http:" && LOCAL.test(u.host))) throw new Error("PUBLIC_URL must be an https address");
  if (u.pathname !== "/" || u.search || u.hash) throw new Error("PUBLIC_URL must be an origin only, like https://example.com");
  return u.origin;
}

const digest = (s: string) => createHash("sha256").update(s).digest();
const nonce = () => randomBytes(12).toString("base64url");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

/** Signs claims, and reads back only what it signed, of the kind asked for, before it expires. */
function signer(secret: string) {
  // a key of its own, so a signature never doubles as anything MCP_TOKEN itself is used for
  const key = createHmac("sha256", secret).update("aipulse-oauth-v1").digest();
  const mac = (body: string) => createHmac("sha256", key).update(body).digest("base64url");
  return {
    sign(claims: Claims): string {
      const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
      return `${body}.${mac(body)}`;
    },
    verify(token: string, kind: Kind, nowSec: number): Claims | null {
      if (token.length > 4096) return null;
      const [body, sig, extra] = token.split(".");
      if (!body || !sig || extra !== undefined) return null;
      // compared as text: decoding base64 first would let several spellings pass for one signature
      const want = Buffer.from(mac(body));
      const got = Buffer.from(sig);
      if (want.length !== got.length || !timingSafeEqual(want, got)) return null;
      let c: Partial<Claims> | null;
      try {
        c = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as Partial<Claims> | null;
      } catch {
        return null;
      }
      if (c?.k !== kind || typeof c.exp !== "number" || c.exp <= nowSec || typeof c.cid !== "string" || typeof c.jti !== "string") return null;
      return c as Claims;
    },
  };
}

function pkceMatches(verifier: string, challenge: string): boolean {
  if (!VERIFIER.test(verifier)) return false;
  const got = Buffer.from(createHash("sha256").update(verifier).digest("base64url"));
  const want = Buffer.from(challenge);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** Refuses every attempt for `ms` once `limit` attempts failed within `ms`. One count for everyone: a client's address can be forged. */
function lockout(limit: number, ms: number, now: () => number) {
  let since = 0;
  let failed = 0;
  let until = 0;
  return {
    locked: () => now() < until,
    fail(): void {
      if (now() - since > ms) {
        since = now();
        failed = 0;
      }
      if (++failed >= limit) {
        until = now() + ms;
        failed = 0;
      }
    },
    succeed(): void {
      failed = 0;
    },
  };
}

/** The checks of an authorization request. The first two decide whether a code may be sent anywhere at all. */
function authRequest(p: URLSearchParams, allowed: readonly string[]): AuthRequest | { error: string } {
  const clientId = p.get("client_id") ?? "";
  const redirectUri = p.get("redirect_uri") ?? "";
  if (!clientId || clientId.length > 200) return { error: "client_id is missing or longer than 200 characters" };
  if (!allowed.includes(redirectUri)) return { error: `redirect_uri is not on this gateway's list: ${redirectUri.slice(0, 300) || "(none)"}` };
  if (p.get("response_type") !== "code") return { error: "response_type must be code" };
  const challenge = p.get("code_challenge") ?? "";
  if (p.get("code_challenge_method") !== "S256" || !/^[A-Za-z0-9_-]{43}$/.test(challenge)) return { error: "a PKCE code_challenge with method S256 is required" };
  const state = p.get("state") ?? "";
  if (state.length > 2048) return { error: "state is longer than 2048 characters" };
  return { clientId, redirectUri, challenge, state };
}

async function readForm(req: IncomingMessage): Promise<URLSearchParams> {
  if (Number(req.headers["content-length"] ?? "0") > MAX_FORM) throw Object.assign(new Error("form too large"), { status: 413 });
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_FORM) throw Object.assign(new Error("form too large"), { status: 413 });
    chunks.push(chunk as Buffer);
  }
  const text = Buffer.concat(chunks).toString("utf-8");
  if (!(req.headers["content-type"] ?? "").includes("application/json")) return new URLSearchParams(text);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw Object.assign(new Error("body is not JSON"), { status: 400 });
  }
  const p = new URLSearchParams();
  if (body && typeof body === "object") for (const [k, v] of Object.entries(body)) if (typeof v === "string") p.set(k, v);
  return p;
}

function sendJson(res: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(JSON.stringify(body));
}

const oauthError = (res: ServerResponse, error: string, description: string) => sendJson(res, 400, { error, error_description: description }, { "cache-control": "no-store" });

/** The gateway's public origin: PUBLIC_URL, or https on the Host the request came to (http only on this machine). */
function originOf(req: IncomingMessage, publicUrl: string | undefined): string | null {
  if (publicUrl) return publicUrl;
  const host = (req.headers.host ?? "").toLowerCase();
  if (!HOST.test(host)) return null;
  return `${LOCAL.test(host) ? "http" : "https"}://${host}`;
}

/** RFC 8414: where to sign in, and how. */
const serverMetadata = (origin: string) => ({
  issuer: origin,
  authorization_endpoint: `${origin}/oauth/authorize`,
  token_endpoint: `${origin}/oauth/token`,
  response_types_supported: ["code"],
  grant_types_supported: ["authorization_code", "refresh_token"],
  code_challenge_methods_supported: ["S256"],
  token_endpoint_auth_methods_supported: ["none"],
  scopes_supported: [SCOPE],
});

/** RFC 9728: which server guards /mcp. */
const resourceMetadata = (origin: string) => ({
  resource: `${origin}/mcp`,
  authorization_servers: [origin],
  scopes_supported: [SCOPE],
  bearer_methods_supported: ["header"],
  resource_name: "AI Pulse Georgia agent",
});

const CSS = `:root{color-scheme:light dark;--bg:#f4f6f9;--fg:#1c2330;--muted:#596476;--card:#fff;--line:#d8dde5;--accent:#1f5fbf;--on-accent:#fff;--bad:#b3261e}
@media (prefers-color-scheme:dark){:root{--bg:#11151b;--fg:#e7eaf0;--muted:#a2abb9;--card:#1a1f28;--line:#2d3441;--accent:#7fb0ff;--on-accent:#0f141b;--bad:#ff8a80}}
body{margin:0;padding:0 16px;background:var(--bg);color:var(--fg);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:30rem;margin:8vh auto;padding:24px;background:var(--card);border:1px solid var(--line);border-radius:12px}
h1{font-size:1.3rem;margin:0 0 12px;text-wrap:balance}p{margin:8px 0}.note{color:var(--muted);font-size:.9rem}.problem{color:var(--bad);font-weight:600;overflow-wrap:anywhere}
label{display:block;margin-top:16px;font-weight:600}
input[type=password]{box-sizing:border-box;width:100%;padding:10px;margin:6px 0 14px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--fg);font:inherit}
button{padding:10px 20px;border:0;border-radius:8px;background:var(--accent);color:var(--on-accent);font:inherit;font-weight:600;cursor:pointer}`;

function consent(ask: AuthRequest, problem = ""): string {
  const fields: Array<[string, string]> = [
    ["response_type", "code"],
    ["client_id", ask.clientId],
    ["redirect_uri", ask.redirectUri],
    ["code_challenge", ask.challenge],
    ["code_challenge_method", "S256"],
    ["state", ask.state],
  ];
  const hidden = fields.map(([n, v]) => `<input type="hidden" name="${n}" value="${esc(v)}">`).join("");
  return `<h1>Grok-ის დაკავშირება აგენტთან</h1>
<p><b>${esc(ask.clientId)}</b> ითხოვს წვდომას AI Pulse Georgia-ს აგენტზე. დაკავშირების შემდეგ ის შეძლებს კოლექციაში ძებნას, შეთავაზებების ნახვას, დამტკიცებასა და უარყოფას.</p>
<p>გააგრძელე მხოლოდ მაშინ, თუ Connect-ს ახლა შენ დააჭირე. პასუხი აქ გაიგზავნება: <b>${esc(new URL(ask.redirectUri).host)}</b></p>
${problem ? `<p class="problem">${esc(problem)}</p>` : ""}<form method="post" action="/oauth/authorize">${hidden}
<label for="token">MCP_TOKEN</label>
<input id="token" name="token" type="password" autocomplete="current-password" required autofocus>
<button type="submit">დაკავშირება</button>
</form>
<p class="note">MCP_TOKEN-ს Deploy ON-ში, სერვისის Environment-ის გვერდზე ნახავ. Grok თვითონ ამ გასაღებს ვერ დაინახავს: ის მხოლოდ დროებით გასაღებს მიიღებს.</p>`;
}

function refusal(problem: string): string {
  return `<h1>დაკავშირება ვერ მოხერხდა</h1>
<p>მოთხოვნა არასწორია, ამიტომ კოდი არსად გაიგზავნა. მიზეზი:</p>
<p class="problem">${esc(problem)}</p>
<p class="note">თუ მიზეზში redirect_uri წერია და ეს მისამართი ნამდვილად Grok-ისაა, ის Deploy ON-ის ცვლადს OAUTH_REDIRECT_URIS უნდა დაემატოს.</p>`;
}

export function createOAuth(cfg: OAuthConfig): OAuth {
  const now = cfg.now ?? Date.now;
  const seconds = () => Math.floor(now() / 1000);
  const { sign, verify } = signer(cfg.secret);
  const ownerKey = digest(cfg.secret);
  const lock = lockout(MAX_FAILURES, LOCKOUT_MS, now);
  const used = new Map<string, number>(); // code id → expiry
  // a browser checks form-action on the redirect that answers the form too, so the clients' origins belong in it
  const formAction = [...new Set(cfg.redirectUris.map((u) => new URL(u).origin))].join(" ");

  function page(res: ServerResponse, status: number, title: string, inner: string, headers: Record<string, string> = {}): void {
    res.writeHead(status, {
      ...headers,
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": `default-src 'none'; style-src 'unsafe-inline'; form-action 'self' ${formAction}; frame-ancestors 'none'; base-uri 'none'`,
      "x-frame-options": "DENY",
      "x-content-type-options": "nosniff",
      "referrer-policy": "no-referrer",
    });
    res.end(`<!doctype html><html lang="ka"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body><main>${inner}</main></body></html>`);
  }

  async function authorize(req: IncomingMessage, res: ServerResponse, url: URL): Promise<void> {
    const post = req.method === "POST";
    // the form posts every field back, so a submitted request is checked again from scratch
    const params = post ? await readForm(req) : url.searchParams;
    const ask = authRequest(params, cfg.redirectUris);
    if ("error" in ask) return page(res, 400, "დაკავშირება ვერ მოხერხდა", refusal(ask.error));
    if (!post) return page(res, 200, "Grok-ის დაკავშირება", consent(ask));
    if (lock.locked()) return page(res, 429, "Grok-ის დაკავშირება", consent(ask, "ძალიან ბევრი არასწორი ცდა იყო, ამიტომ გვერდი 15 წუთით დაიკეტა. სცადე მოგვიანებით."), { "retry-after": String(LOCKOUT_MS / 1000) });
    if (!timingSafeEqual(digest((params.get("token") ?? "").trim()), ownerKey)) {
      lock.fail();
      log.warn("oauth: a wrong key on the consent page");
      return page(res, 401, "Grok-ის დაკავშირება", consent(ask, "გასაღები არ ემთხვევა. ჩასვი MCP_TOKEN ზუსტად ისე, როგორც Deploy ON-შია."));
    }
    lock.succeed();
    const code = sign({ k: "code", exp: seconds() + CODE_TTL, cid: ask.clientId, jti: nonce(), ru: ask.redirectUri, cc: ask.challenge });
    const to = new URL(ask.redirectUri);
    to.searchParams.set("code", code);
    if (ask.state) to.searchParams.set("state", ask.state);
    log.info("oauth: the owner approved a client", { client: ask.clientId });
    res.writeHead(302, { location: to.href, "cache-control": "no-store", "referrer-policy": "no-referrer" });
    res.end();
  }

  function issue(res: ServerResponse, grant: string, cid: string, nowSec: number): void {
    const mint = (k: Kind, ttl: number) => sign({ k, exp: nowSec + ttl, cid, jti: nonce() });
    log.info("oauth: tokens issued", { grant, client: cid });
    sendJson(res, 200, { access_token: mint("access", ACCESS_TTL), token_type: "Bearer", expires_in: ACCESS_TTL, refresh_token: mint("refresh", REFRESH_TTL), scope: SCOPE }, { "cache-control": "no-store", pragma: "no-cache" });
  }

  async function token(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const p = await readForm(req);
    const nowSec = seconds();
    const grant = p.get("grant_type") ?? "";
    const clientId = p.get("client_id") ?? "";
    if (grant === "authorization_code") {
      const c = verify(p.get("code") ?? "", "code", nowSec);
      if (!c || used.has(c.jti)) return oauthError(res, "invalid_grant", "the code is unknown, already used or expired");
      if (clientId !== c.cid || p.get("redirect_uri") !== c.ru) return oauthError(res, "invalid_grant", "client_id or redirect_uri is not the one the code was issued for");
      if (!pkceMatches(p.get("code_verifier") ?? "", c.cc ?? "")) return oauthError(res, "invalid_grant", "the code_verifier does not match the code_challenge");
      for (const [jti, exp] of used) if (exp <= nowSec) used.delete(jti);
      used.set(c.jti, c.exp);
      return issue(res, grant, c.cid, nowSec);
    }
    if (grant === "refresh_token") {
      const r = verify(p.get("refresh_token") ?? "", "refresh", nowSec);
      if (!r || (clientId !== "" && clientId !== r.cid)) return oauthError(res, "invalid_grant", "the refresh token is unknown or expired");
      return issue(res, grant, r.cid, nowSec);
    }
    return oauthError(res, "unsupported_grant_type", "use authorization_code or refresh_token");
  }

  return {
    async handle(req, res, url) {
      const path = url.pathname;
      if (path === "/oauth/token") {
        if (req.method === "POST") await token(req, res);
        else sendJson(res, 405, { error: "use POST" }, { allow: "POST" });
        return true;
      }
      if (path === "/oauth/authorize") {
        if (req.method === "GET" || req.method === "POST") await authorize(req, res, url);
        else sendJson(res, 405, { error: "use GET or POST" }, { allow: "GET, POST" });
        return true;
      }
      if (!METADATA.has(path)) return false;
      if (req.method !== "GET") {
        sendJson(res, 405, { error: "use GET" }, { allow: "GET" });
        return true;
      }
      const origin = originOf(req, cfg.publicUrl);
      if (!origin) sendJson(res, 400, { error: "invalid_request", error_description: "unexpected Host header" });
      else sendJson(res, 200, path === "/.well-known/oauth-authorization-server" ? serverMetadata(origin) : resourceMetadata(origin));
      return true;
    },

    accepts(header) {
      if (!header?.startsWith("Bearer ")) return false;
      return verify(header.slice(7).trim(), "access", seconds()) !== null;
    },

    challenge(req, presented) {
      const origin = originOf(req, cfg.publicUrl);
      const parts = ['Bearer realm="aipulse-agent"'];
      if (presented) parts.push('error="invalid_token"');
      if (origin) parts.push(`resource_metadata="${origin}/.well-known/oauth-protected-resource/mcp"`);
      return parts.join(", ");
    },
  };
}
